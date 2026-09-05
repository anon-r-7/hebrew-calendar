import Models from '@api/models'
import { logger } from '@api/utils/logger'
import { QueryTypes } from 'sequelize'
import { SYSTEM_EVENT_SHORT_NAMES } from '@api/constants/systemEvents'

/** Internal state */
let _running = false
let _startTime: Date | null = null

let _lastInsertPerItemMs: number | null = null
let _lastRefreshMs: number | null = null

let _lastPending: { start: Date; processedCount: number } | null = null

/** Public: is a sync job currently executing? */
export const isRunning = (): boolean => _running

async function refreshMaterializedView() {
  const log = console.log
  const query = (sql) =>
    Models.sequelize.query(sql, { type: QueryTypes.SELECT })

  try {
    log('---- Starting swap-refresh of events_pair_view ----')

    // Set performance parameters
    const perfTuning = [
      `SET work_mem = '128MB'`,
      `SET maintenance_work_mem = '512MB'`,
      `SET jit = off`
    ]
    for (const cmd of perfTuning) await Models.sequelize.query(cmd)

    // 1. Get view definition
    const viewResult = await query(`
      SELECT pg_get_viewdef('public.events_pair_view'::regclass, true) AS view_sql
    `)
    const view_sql = viewResult?.[0]?.['view_sql']
    if (!view_sql) throw new Error('Failed to get view definition')

    // 2. Create staging materialized view
    const dropStagingSql = `DROP MATERIALIZED VIEW IF EXISTS public.events_pair_view__staging`
    await Models.sequelize.query(dropStagingSql)

    const createStagingSQL = `CREATE MATERIALIZED VIEW public.events_pair_view__staging AS ${view_sql}`
    await Models.sequelize.query(createStagingSQL)
    log('✅ Created staging materialized view')

    // 3. Get current index definitions
    const indexRows = await query(`
      SELECT pg_get_indexdef(i.indexrelid) AS create_index_sql
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      WHERE t.relname = 'events_pair_view'
    `)

    // 4. Create indexes on staging view
    for (const row of indexRows) {
      const create_index_sql = row['create_index_sql']
      if (!create_index_sql) continue

      // "CREATE [UNIQUE] INDEX <name> ON public.events_pair_view ..." →
      // build it CONCURRENTLY, as <name>__staging, on the staging view.
      const concurrentSQL = create_index_sql
        .replace(
          /^CREATE (UNIQUE )?INDEX (\S+) ON /,
          (_m, unique, name) =>
            `CREATE ${unique ?? ''}INDEX CONCURRENTLY ${name}__staging ON `
        )
        .replace(
          /ON public\.events_pair_view /,
          'ON public.events_pair_view__staging '
        )

      try {
        for (const cmd of [
          `SET work_mem = '128MB'`,
          `SET maintenance_work_mem = '512MB'`,
          `SET jit = off`
        ])
          await Models.sequelize.query(cmd)
        log(`🔧 Creating index: ${concurrentSQL}`)
        await Models.sequelize.query(concurrentSQL)
      } catch (err) {
        log(`❌ Failed to create index: ${concurrentSQL}`)
        throw err
      }
    }

    log('✅ All staging indexes created. Proceeding to swap...')

    // 5. Swap views
    await Models.sequelize.query(
      `ALTER MATERIALIZED VIEW public.events_pair_view RENAME TO events_pair_view__old`
    )
    await Models.sequelize.query(
      `ALTER MATERIALIZED VIEW public.events_pair_view__staging RENAME TO events_pair_view`
    )
    log('✅ Swap complete')

    // 6. Drop old materialized view
    await Models.sequelize.query(
      `DROP MATERIALIZED VIEW public.events_pair_view__old`
    )
    log('🗑️ Dropped old materialized view')

    // 7. Clean up and rename staging indexes to production naming
    const renameIndexRows = (await query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'events_pair_view'
        AND indexname LIKE '%\\_\\_staging'
    `)) as { indexname: string }[]

    for (const { indexname } of renameIndexRows) {
      const newName = indexname.replace(/__staging$/, '')

      // Drop any conflicting index first
      try {
        await Models.sequelize.query(`DROP INDEX IF EXISTS ${newName}`)
        log(`🗑️ Dropped old index: ${newName}`)
      } catch (err) {
        log(`⚠️ Could not drop old index: ${newName}`)
        throw err
      }

      // Rename the staging index to production name
      try {
        await Models.sequelize.query(
          `ALTER INDEX ${indexname} RENAME TO ${newName}`
        )
        log(`🔁 Renamed ${indexname} → ${newName}`)
      } catch (err) {
        log(`❌ Failed to rename index ${indexname}`)
        throw err
      }
    }

    log('✅ View refresh complete.')

    await Models.sequelize.query(`VACUUM ANALYZE public.events_pair_view`)
    log('🧹 Ran VACUUM ANALYZE on refreshed view')
  } catch (err) {
    console.error('💥 Error during refresh:', err)
    throw err
  }
}

/**
 * Insert any missing "system" rows into `events` for every hebrew_event_dates
 * row whose event is in SYSTEM_EVENT_SHORT_NAMES. Mirrors the rules of the
 * original backfill (20250527120000-event-pairs):
 *   - single-day events (event_day IS NULL) get BEFORE / TARGET / AFTER rows
 *   - multi-day events get BEFORE on day 1, TARGET every day, AFTER on the
 *     last day (matzot: 7, sukkot / chanukkah: 8)
 * The fan-out trigger on `events` pairs each new system row with every user
 * event, so no explicit events_pairs work is needed here.
 * Returns the number of `events` rows inserted.
 */
export const syncSystemEvents = async (): Promise<number> => {
  const [, meta] = await Models.sequelize.query(
    `
    INSERT INTO events (day_index, source, system_meta, source_row)
    WITH selected_hebrew_event_dates AS (
      SELECT
        hed.uuid      AS hed_id,
        hd.day_index  AS target_day_index,
        he.short_name,
        hed.event_day
      FROM hebrew_event_dates hed
      JOIN hebrew_dates  hd ON hd.uuid = hed.hebrew_date
      JOIN hebrew_events he ON he.uuid = hed.hebrew_event
      WHERE he.short_name IN (:short_names)
    ),
    candidates AS (
      /* ---- BEFORE (single-day events, or first day of multi-day) ---- */
      SELECT
        target_day_index - 1                  AS day_index,
        'before'::enum_events_system_meta     AS system_meta,
        hed_id                                AS source_row
      FROM selected_hebrew_event_dates
      WHERE event_day IS NULL OR event_day = 1

      UNION ALL

      /* ---- TARGET (always) ---- */
      SELECT
        target_day_index,
        NULL::enum_events_system_meta,
        hed_id
      FROM selected_hebrew_event_dates

      UNION ALL

      /* ---- AFTER (single-day events, or last day of multi-day) ---- */
      SELECT
        target_day_index + 1,
        'after'::enum_events_system_meta,
        hed_id
      FROM selected_hebrew_event_dates
      WHERE
        event_day IS NULL
        OR (short_name = 'matzot' AND event_day = 7)
        OR (short_name IN ('sukkot', 'chanukkah') AND event_day = 8)
    )
    SELECT
      c.day_index,
      'system'::enum_events_source,
      c.system_meta,
      c.source_row
    FROM candidates c
    /* The unique constraint treats NULL system_meta as distinct, so an
       ON CONFLICT clause alone would re-insert every TARGET row each run. */
    WHERE NOT EXISTS (
      SELECT 1
      FROM events e
      WHERE e.source = 'system'
        AND e.source_row = c.source_row
        AND e.system_meta IS NOT DISTINCT FROM c.system_meta
    )
    ON CONFLICT ON CONSTRAINT events_source_row_meta_unique DO NOTHING;
    `,
    { replacements: { short_names: [...SYSTEM_EVENT_SHORT_NAMES] } }
  )

  // Sequelize returns the affected row count either directly (INSERT
  // statements) or as `rowCount` on the raw pg result.
  if (typeof meta === 'number') return meta
  return Number((meta as { rowCount?: number })?.rowCount ?? 0)
}

export interface SyncResult {
  systemInserted: number
  processedCount: number
  insertMs: number
  refreshMs: number
  errors: string[]
}

/** Public: queue a sync (fire-and-forget). Returns true if started */
export const enqueue = async (): Promise<boolean> => {
  if (_running) return false
  void runSync()
  return true
}

/** Internal: estimate how many entries are left */
const estimatePendingCount = async (): Promise<number> => {
  return await Models.EventsEntry.count({ where: { processed: false } })
}

/**
 * Public: run a full sync and wait for it to finish.
 *   1. insert missing system events (fans out pairs via trigger)
 *   2. process unprocessed user entries (fans out pairs via trigger)
 *   3. rebuild the events_pair_view materialized view
 * Resolves with a summary; never rejects (errors are collected in `errors`).
 */
export const runSync = async (): Promise<SyncResult> => {
  if (_running) {
    throw new Error('[sync] already running')
  }
  _running = true
  _startTime = new Date()

  const errors: string[] = []
  let systemInserted = 0

  try {
    const pendingCount = await estimatePendingCount()
    _lastPending = { start: _startTime, processedCount: pendingCount }
  } catch (err) {
    logger.error(`[sync] could not estimate pending entries: ${err}`)
    _lastPending = { start: _startTime, processedCount: 0 }
  }

  logger.info('[sync] starting')
  const insertStart = Date.now()
  let processedCount = 0
  let hasMore = true

  try {
    logger.info('[sync] syncing system events')
    systemInserted = await syncSystemEvents()
    logger.info(`[sync] system events inserted=${systemInserted}`)
  } catch (err) {
    logger.error(`[sync] system events failed: ${err}`)
    errors.push(`system events: ${err}`)
  }

  try {
    while (hasMore) {
      const didProcess = await Models.sequelize.transaction(async (t) => {
        const entry = await Models.EventsEntry.findOne({
          where: { processed: false },
          lock: t.LOCK.UPDATE,
          skipLocked: true,
          transaction: t
        })

        if (!entry) return false

        await Models.Events.create(
          {
            day_index: entry.day_index,
            source: 'user' as const,
            system_meta: null,
            source_row: entry.uuid
          },
          { transaction: t }
        )

        await entry.update({ processed: true }, { transaction: t })

        processedCount++
        return true
      })

      hasMore = didProcess
    }
  } catch (err) {
    logger.error(`[sync] failed: ${err}`)
    errors.push(`user entries: ${err}`)
  }

  const insertMs = Date.now() - insertStart

  // Always refresh view, even if nothing was inserted
  let refreshMs = 0
  const refreshStart = Date.now()
  try {
    // await Models.sequelize.transaction(async (t) => {
    //   // await Models.sequelize.query(`
    //   //   SET LOCAL work_mem = '512MB';
    //   //   SET LOCAL maintenance_work_mem = '4GB';
    //   //   SET LOCAL parallel_setup_cost = 100;
    //   //   SET LOCAL parallel_tuple_cost = 0.01;
    //   //   SET LOCAL max_parallel_workers = 8;
    //   //   SET LOCAL max_parallel_workers_per_gather = 4;
    //   //   SET LOCAL jit = off;
    //   // `, { transaction: t });

    //   // await Models.sequelize.query(`
    //   //   REFRESH MATERIALIZED VIEW CONCURRENTLY events_pair_view;
    //   // `, { transaction: t });
    // });

    await refreshMaterializedView()

    refreshMs = Date.now() - refreshStart
    logger.info('[sync] materialized view refreshed')
  } catch (err) {
    logger.error(`[sync] MV refresh failed: ${err}`)
    errors.push(`materialized view refresh: ${err}`)
  }

  _running = false

  // Store durations
  if (processedCount > 0) {
    _lastInsertPerItemMs = insertMs / processedCount
  }
  _lastRefreshMs = refreshMs

  logger.info(
    `[sync] completed: systemInserted=${systemInserted}, processed=${processedCount}, insertMs=${insertMs}, refreshMs=${refreshMs}, errors=${errors.length}`
  )

  return { systemInserted, processedCount, insertMs, refreshMs, errors }
}

/** Public: get current sync status and estimated times */
export const getStatus = () => {
  if (!_running || !_startTime || !_lastPending) {
    return {
      syncing: _running,
      start: _startTime,
      estimatedEnd: null,
      estimatedRemaining: null
    }
  }

  const now = Date.now()
  const { start, processedCount } = _lastPending

  const insertEstimate =
    _lastInsertPerItemMs && processedCount > 0
      ? _lastInsertPerItemMs * processedCount
      : 0

  const refreshEstimate = _lastRefreshMs ?? 0
  const totalEstimate = insertEstimate + refreshEstimate
  const estimatedEnd = new Date(start.getTime() + totalEstimate)
  const remainingMs = Math.max(0, estimatedEnd.getTime() - now)

  return {
    syncing: true,
    start,
    estimatedEnd,
    estimatedTotal: {
      minutes: Math.floor(totalEstimate / 60000),
      seconds: Math.floor((totalEstimate % 60000) / 1000)
    },
    estimatedRemaining: {
      minutes: Math.floor(remainingMs / 60000),
      seconds: Math.floor((remainingMs % 60000) / 1000)
    }
  }
}

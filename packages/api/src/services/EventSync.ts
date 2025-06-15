import Models from '@api/models'
import { logger } from '@api/utils/logger'
import { QueryTypes } from 'sequelize'

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

      const concurrentSQL = create_index_sql
        .replace(/^CREATE INDEX /, 'CREATE INDEX CONCURRENTLY ')
        .replace(/^CREATE UNIQUE INDEX /, 'CREATE UNIQUE INDEX CONCURRENTLY ')
        .replace('epv', `epv__staging`)
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
        AND indexname LIKE 'epv__staging_%'
    `)) as { indexname: string }[]

    for (const { indexname } of renameIndexRows) {
      const newName = indexname.replace(`epv__staging`, 'epv')

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

/** Public: queue a sync. Returns true if started */
export const enqueue = async (): Promise<boolean> => {
  if (_running) return false

  _running = true
  _startTime = new Date()

  const pendingCount = await estimatePendingCount()
  _lastPending = { start: _startTime, processedCount: pendingCount }

  void _run()
  return true
}

/** Internal: estimate how many entries are left */
const estimatePendingCount = async (): Promise<number> => {
  return await Models.EventsEntry.count({ where: { processed: false } })
}

/** Internal: main sync function */
const _run = async (): Promise<void> => {
  logger.info('[sync] starting')
  const insertStart = Date.now()
  let processedCount = 0
  let hasMore = true

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
  }

  _running = false

  // Store durations
  if (processedCount > 0) {
    _lastInsertPerItemMs = insertMs / processedCount
  }
  _lastRefreshMs = refreshMs

  logger.info(
    `[sync] completed: processed=${processedCount}, insertMs=${insertMs}, refreshMs=${refreshMs}`
  )
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

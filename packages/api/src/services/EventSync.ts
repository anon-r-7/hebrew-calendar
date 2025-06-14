import Models from '@api/models'
import { logger } from '@api/utils/logger'

/** Internal state */
let _running = false
let _startTime: Date | null = null

let _lastInsertPerItemMs: number | null = null
let _lastRefreshMs: number | null = null

let _lastPending: { start: Date; processedCount: number } | null = null

/** Public: is a sync job currently executing? */
export const isRunning = (): boolean => _running

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
    await Models.sequelize.query(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY events_pair_view;'
    )
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

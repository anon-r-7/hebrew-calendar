import Models from '@api/models'
import { logger } from '@api/utils/logger'

/** Internal flag – never exported */
let _running = false
let _startTime: Date | null = null
let _endTime: Date | null = null
const _runTimes: number[] = [] // ms

/** Public: is a sync job currently executing? */
export const isRunning = (): boolean => _running

export const enqueue = (): boolean => {
  if (_running) return false // already in progress

  _running = true
  _startTime = new Date()
  _endTime = null
  void _run() // fire & forget
  return true
}

/* ------------------------------------------------------------------ */
/* internal implementation                                            */
/* ------------------------------------------------------------------ */
const _run = async (): Promise<void> => {
  logger.info('[sync] starting')
  try {
    let processedCount = 0
    let hasMore = true

    while (hasMore) {
      const didProcess = await Models.sequelize.transaction(async (t) => {
        // 1. Get one unprocessed row with a FOR UPDATE lock, skip locked rows
        const entry = await Models.EventsEntry.findOne({
          where: { processed: false },
          lock: t.LOCK.UPDATE,
          skipLocked: true, // Avoid blocking if another transaction holds it
          transaction: t
        })

        if (!entry) {
          return false // no more entries left to process
        }

        // 2. Insert event, letting the DB trigger do the fan-out
        const eventPayload = {
          day_index: entry.day_index,
          source: 'user' as const,
          system_meta: null,
          source_row: entry.uuid
        }

        await Models.Events.create(eventPayload, { transaction: t })

        // 3. Mark entry as processed
        await entry.update({ processed: true }, { transaction: t })

        processedCount++
        return true
      })

      hasMore = didProcess
      logger.info(`[sync] complete ${processedCount} events`)
    }

    logger.info(`[sync] completed: ${processedCount} events processed`)
  } catch (err) {
    logger.error(`[sync] failed: ${err}`)
  } finally {
    await Models.sequelize.query(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY events_pair_view;'
    )

    _running = false
    _endTime = new Date()

    if (_startTime && _endTime) {
      const durationMs = _endTime.getTime() - _startTime.getTime()
      _runTimes.push(durationMs)

      // Optional: limit size of history if you want
      if (_runTimes.length > 100) _runTimes.shift()
    }
  }

  logger.info('[sync] materialized view refreshed')
}

export const getStatus = () => {
  const now = new Date()

  let estimatedEnd: Date | null = null
  let estimatedRemainingMs = null

  if (_running && _startTime && _runTimes.length > 0) {
    const avgRunTimeMs = _runTimes.reduce((a, b) => a + b, 0) / _runTimes.length

    estimatedEnd = new Date(_startTime.getTime() + avgRunTimeMs)
    estimatedRemainingMs = estimatedEnd.getTime() - now.getTime()

    if (estimatedRemainingMs < 0) estimatedRemainingMs = 0
  }

  return {
    syncing: _running,
    start: _startTime,
    estimatedEnd,
    estimatedRemaining: estimatedRemainingMs
      ? {
          minutes: Math.floor(estimatedRemainingMs / 60000),
          seconds: Math.floor((estimatedRemainingMs % 60000) / 1000)
        }
      : null,
    lastRunTime: _runTimes.length > 0 ? _runTimes[_runTimes.length - 1] : null,
    averageRunTime:
      _runTimes.length > 0
        ? _runTimes.reduce((a, b) => a + b, 0) / _runTimes.length
        : null
  }
}

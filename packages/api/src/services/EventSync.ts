import Models from '@api/models'
import { logger } from '@api/utils/logger'

/** Internal flag – never exported */
let _running = false

/** Public: is a sync job currently executing? */
export const isRunning = (): boolean => _running

/** Public: queue a sync.  Returns true if a job was started, false if one is already running. */
export const enqueue = (): boolean => {
  if (_running) return false // already in progress

  _running = true
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
    _running = false
  }

  // Refresh materialized view once after all inserts complete
  try {
    Models.sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY events_pair_view;')
    logger.info('[sync] materialized view refreshed')
  } catch (err) {
    logger.error(`[sync] MV refresh failed: ${err}`)
  }
}

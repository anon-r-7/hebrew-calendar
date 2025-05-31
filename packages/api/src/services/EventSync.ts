import { EventEntryModel } from '@api/models/EventsEntry'
import { EventModel } from '@api/models/Events'
import { sequelize } from '@api/models'
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
    /* each job runs in a single DB transaction */
    await sequelize.transaction(async (t) => {
      /* 1) grab all un-processed rows FOR UPDATE (lock) */
      const entries = await EventEntryModel.findAll({
        where: { processed: false },
        lock: t.LOCK.UPDATE,
        transaction: t
      })

      if (!entries.length) {
        logger.info('[sync] nothing to do')
        return
      }

      /* 2) bulk-insert into events; let DB trigger fan-out pairs */
      const eventsPayload = entries.map((e) => ({
        day_index: e.day_index,
        source: 'user', // user event
        system_meta: null,
        source_row: e.uuid
      }))

      await EventModel.bulkCreate(eventsPayload, { transaction: t })

      /* 3) mark entries processed */
      await Promise.all(
        entries.map((e) => e.update({ processed: true }, { transaction: t }))
      )
    })

    /* 4) refresh MV outside the transaction (non-blocking) */
    await sequelize.query('REFRESH MATERIALIZED VIEW events_pair_view')

    logger.info('[sync] completed')
  } catch (err) {
    logger.error(`[sync] failed: ${err}`)
  } finally {
    _running = false
  }
}

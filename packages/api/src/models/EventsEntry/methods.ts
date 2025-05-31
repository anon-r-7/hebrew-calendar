import { Op, Transaction } from 'sequelize'
import models from '@api/models'

const { EventsEntry, HebrewDates, Events, EventPairs, sequelize } = models

/* ───────────────────────── helpers ─────────────────────────── */

async function locateHebrewDate(type: 'gregorian' | 'hebrew', date: string) {
  if (type === 'gregorian') {
    // date = 'YYYY-MM-DD'
    return HebrewDates.findOne({ where: { gregorian: date } })
  }
  // hebrew: 'YYYY-MM-DD'   (yy-mm-dd already padded)
  const [yy, mm, dd] = date.split('-').map(Number)
  return HebrewDates.findOne({ where: { yy, mm, dd } })
}

/* ───────────────────────── CRUD ────────────────────────────── */

export async function create(payload: {
  type: 'gregorian' | 'hebrew'
  date: string
  name?: string
  description?: string
  tags?: string
  created_by: string
}) {
  const hd = await locateHebrewDate(payload.type, payload.date)
  if (!hd) throw new Error('Hebrew date not found')

  return EventsEntry.create({
    ...payload,
    hebrew_date: hd.uuid,
    day_index: hd.day_index
  })
}

export async function update(
  uuid: string,
  fields: { name?: string; description?: string }
) {
  const row = await EventsEntry.findByPk(uuid)
  if (!row) return null
  await row.update(fields)
  return row
}

export async function list(opts: {
  created_by?: string
  page: number
  size: number
}) {
  const where: any = {}
  if (opts.created_by) where.created_by = opts.created_by
  return EventsEntry.findAndCountAll({
    where,
    include: [
      {
        model: HebrewDates,
        as: 'hebrewDate'
      }
    ],
    order: [['date', 'ASC']],
    offset: (opts.page - 1) * opts.size,
    limit: opts.size
  })
}

/** cascades: events → event_pairs, then refresh MV */
export async function removeCascade(uuid: string) {
  await sequelize.transaction(async (t: Transaction) => {
    const entry = await EventsEntry.findByPk(uuid, { transaction: t })
    if (!entry) return

    /* delete from events & pairs */
    const evts = await Events.findAll({
      where: { source: 'user', source_row: uuid },
      transaction: t
    })
    const evtIds = evts.map((e) => e.uuid)

    await EventPairs.destroy({
      where: { [Op.or]: [{ a: evtIds }, { b: evtIds }] },
      transaction: t
    })
    await Events.destroy({ where: { uuid: evtIds }, transaction: t })

    /* delete entry */
    await entry.destroy({ transaction: t })
  })

  /* refresh MV outside trx */
  await sequelize.query(
    'REFRESH MATERIALIZED VIEW CONCURRENTLY events_pair_view'
  )
}

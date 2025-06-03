import Models from '@api/models'
import { Op, Transaction } from 'sequelize'

/* ───────────────────────── helpers ─────────────────────────── */

async function locateHebrewDate(type: 'gregorian' | 'hebrew', date: string) {
  if (type === 'gregorian') {
    // date = 'YYYY-MM-DD'
    return Models.HebrewDates.findOne({ where: { gregorian: date } })
  }
  // hebrew: 'YYYY-MM-DD'   (yy-mm-dd already padded)
  const [yy, mm, dd] = date.split('-').map(Number)
  return Models.HebrewDates.findOne({ where: { yy, mm, dd } })
}

async function getTransformedById(uuid: string) {
  const row = await Models.EventsEntry.findByPk(uuid, {
    include: [
      {
        model: Models.HebrewDates,
        as: 'hebrewDateEntry',
        attributes: ['gregorian', 'yy', 'mm', 'dd']
      },
      {
        model: Models.User,
        as: 'creator',
        attributes: ['uuid', 'first_name', 'last_name']
      }
    ]
  })

  if (!row) return null

  return {
    uuid: row.uuid,
    date: row.date,
    type: row.type,
    name: row.name,
    description: row.description,
    tags: row.tags,
    day_index: row.day_index,
    processed: row.processed,
    hebrew_date: {
      gregorian: row.hebrewDateEntry?.gregorian,
      hebrew: `${String(row.hebrewDateEntry?.yy).padStart(4, '0')}-${String(
        row.hebrewDateEntry?.mm
      ).padStart(2, '0')}-${String(row.hebrewDateEntry?.dd).padStart(2, '0')}`
    },
    created_by: {
      uuid: row.creator?.uuid ?? '',
      first_name: row.creator?.first_name ?? '',
      last_name: row.creator?.last_name ?? ''
    }
  }
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

  const row = await Models.EventsEntry.create({
    ...payload,
    hebrew_date: hd.uuid,
    day_index: hd.day_index
  })

  return getTransformedById(row.uuid)
}

export async function update(
  uuid: string,
  fields: { name?: string; description?: string; tags?: string }
) {
  const row = await Models.EventsEntry.findByPk(uuid)
  if (!row) return null

  await row.update(fields)
  return getTransformedById(uuid)
}

export async function list(opts: {
  created_by?: string
  page: number
  size: number
}) {
  const page = opts.page ?? 1
  const size = opts.size ?? 500

  const where: any = {}
  if (opts.created_by) where.created_by = opts.created_by

  const { rows, count } = await Models.EventsEntry.findAndCountAll({
    where,
    include: [
      {
        model: Models.HebrewDates,
        as: 'hebrewDateEntry',
        attributes: ['gregorian', 'yy', 'mm', 'dd']
      },
      {
        model: Models.User,
        as: 'creator',
        attributes: ['uuid', 'first_name', 'last_name']
      }
    ],
    order: [['date', 'ASC']],
    offset: (page - 1) * size,
    limit: size
  })

  return {
    total: count,
    entries: rows.map((row) => ({
      uuid: row.uuid,
      date: row.date,
      type: row.type,
      name: row.name,
      description: row.description,
      tags: row.tags,
      day_index: row.day_index,
      processed: row.processed,
      hebrew_date: {
        gregorian: row.hebrewDateEntry?.gregorian,
        hebrew: `${String(row.hebrewDateEntry?.yy).padStart(4, '0')}-${String(
          row.hebrewDateEntry?.mm
        ).padStart(2, '0')}-${String(row.hebrewDateEntry?.dd).padStart(2, '0')}`
      },
      created_by: {
        uuid: row.creator?.uuid ?? '',
        first_name: row.creator?.first_name ?? '',
        last_name: row.creator?.last_name ?? ''
      }
    }))
  }
}

/** cascades: events → event_pairs, then refresh MV */
export async function removeCascade(uuid: string) {
  await Models.sequelize.transaction(async (t: Transaction) => {
    const entry = await Models.EventsEntry.findByPk(uuid, { transaction: t })
    if (!entry) return

    /* delete from events & pairs */
    const evts = await Models.Events.findAll({
      where: { source: 'user', source_row: uuid },
      transaction: t
    })
    const evtIds = evts.map((e) => e.uuid)

    await Models.EventsPairs.destroy({
      where: { [Op.or]: [{ a: evtIds }, { b: evtIds }] },
      transaction: t
    })
    await Models.Events.destroy({ where: { uuid: evtIds }, transaction: t })

    /* delete entry */
    await entry.destroy({ transaction: t })
  })

  // TODO: user should be advised to sync after deleting
  // /* refresh MV outside trx; intentionally do not block return */
  // Models.sequelize
  //   .query('REFRESH MATERIALIZED VIEW CONCURRENTLY events_pair_view')
  //   .catch((err) =>
  //     console.error('Failed to refresh materialized view:', err.message)
  //   )
}

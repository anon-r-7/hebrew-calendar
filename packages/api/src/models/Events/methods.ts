import { QueryTypes } from 'sequelize'
import Models from '@api/models'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('@api/utils/analysis.js')

/** each event carries its reading from the two creation anchors (rungs of 8190, score) */
const withCreation = (raw: any) => {
  // bigint columns arrive as strings from raw queries; the UI and the engine want numbers
  const e = { ...raw, day_index: Number(raw.day_index), month_index: Number(raw.month_index), month_length: Number(raw.month_length) }
  const fc = engine.fromCreation(e)
  return {
    ...e,
    from_creation: {
      days: fc.day1.days,
      y364: Math.round((fc.day1.days / 364) * 1000) / 1000,
      y360: Math.round((fc.day1.days / 360) * 1000) / 1000,
      day1: { rung: fc.day1.rung, best: fc.day1.best, score: fc.day1.score, hits: fc.day1.hits },
      day8: { rung: fc.day8.rung, best: fc.day8.best, score: fc.day8.score, hits: fc.day8.hits }
    }
  }
}

// an event with its date, as the admin page shows it
const EVENT_COLUMNS = `
  e.uuid, e.name, e.description, e.created_by, e.created_at, u.first_name AS created_by_name,
  hd.uuid AS hebrew_date, hd.gregorian, hd.day_of_week, hd.day_index, hd.month_index, hd.yy, hd.mm, hd.dd,
  (SELECT max(dd) FROM hebrew_dates m WHERE m.month_index = hd.month_index) AS month_length,
  (SELECT COALESCE(json_agg(he.name ORDER BY he.name), '[]')
     FROM hebrew_event_dates hed
     JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hed.hebrew_date = hd.uuid AND he.short_name <> 'shabbat') AS holidays`

export const listEvents = async (search = ''): Promise<any[]> => {
  const rows: any[] = await Models.sequelize.query(
    `
    SELECT ${EVENT_COLUMNS}
    FROM events e
    JOIN hebrew_dates hd ON hd.uuid = e.hebrew_date
    LEFT JOIN users u ON u.uuid = e.created_by
    WHERE (:search = '' OR e.name ILIKE :pattern OR COALESCE(e.description, '') ILIKE :pattern)
    ORDER BY hd.day_index ASC, e.name ASC;`,
    { replacements: { search, pattern: `%${search}%` }, type: QueryTypes.SELECT }
  )
  return rows.map(withCreation)
}

export const findEvent = async (uuid: string): Promise<any | null> => {
  const rows: any[] = await Models.sequelize.query(
    `SELECT ${EVENT_COLUMNS} FROM events e JOIN hebrew_dates hd ON hd.uuid = e.hebrew_date LEFT JOIN users u ON u.uuid = e.created_by WHERE e.uuid = :uuid;`,
    { replacements: { uuid }, type: QueryTypes.SELECT }
  )
  return rows[0] ? withCreation(rows[0]) : null
}

export const createEvent = async (values: {
  name: string
  description: string | null
  hebrew_date: string
  created_by: string | null
}) => {
  const created = await Models.Events.create(values)
  return findEvent(created.uuid)
}

export const updateEvent = async (
  uuid: string,
  values: { name?: string; description?: string | null; hebrew_date?: string }
) => {
  const [count] = await Models.Events.update(values, { where: { uuid } })
  return count ? findEvent(uuid) : null
}

export const deleteEvent = async (uuid: string): Promise<number> =>
  Models.Events.destroy({ where: { uuid } })

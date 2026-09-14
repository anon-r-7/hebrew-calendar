import { QueryTypes } from 'sequelize'
import Models from '@api/models'

// an event with its date, as the admin page shows it
const EVENT_COLUMNS = `
  e.uuid, e.name, e.description, e.created_by, e.created_at, u.first_name AS created_by_name,
  hd.uuid AS hebrew_date, hd.gregorian, hd.day_of_week, hd.day_index, hd.month_index, hd.yy, hd.mm, hd.dd,
  (SELECT max(dd) FROM hebrew_dates m WHERE m.month_index = hd.month_index) AS month_length,
  (SELECT COALESCE(json_agg(he.name ORDER BY he.name), '[]')
     FROM hebrew_event_dates hed
     JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hed.hebrew_date = hd.uuid AND he.short_name <> 'shabbat') AS holidays`

export const listEvents = async (search = ''): Promise<any[]> =>
  Models.sequelize.query(
    `
    SELECT ${EVENT_COLUMNS}
    FROM events e
    JOIN hebrew_dates hd ON hd.uuid = e.hebrew_date
    LEFT JOIN users u ON u.uuid = e.created_by
    WHERE (:search = '' OR e.name ILIKE :pattern OR COALESCE(e.description, '') ILIKE :pattern)
    ORDER BY hd.day_index ASC, e.name ASC;`,
    { replacements: { search, pattern: `%${search}%` }, type: QueryTypes.SELECT }
  )

export const findEvent = async (uuid: string): Promise<any | null> => {
  const rows: any[] = await Models.sequelize.query(
    `SELECT ${EVENT_COLUMNS} FROM events e JOIN hebrew_dates hd ON hd.uuid = e.hebrew_date LEFT JOIN users u ON u.uuid = e.created_by WHERE e.uuid = :uuid;`,
    { replacements: { uuid }, type: QueryTypes.SELECT }
  )
  return rows[0] || null
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

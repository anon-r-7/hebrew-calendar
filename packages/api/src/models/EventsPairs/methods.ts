import { QueryTypes } from 'sequelize'
import Models from '@api/models'
import { breakdown, BREAKDOWN_FIELDS, BreakdownField } from '@api/utils/breakdown'

// one side of a pair: the event and its date, plus its Hebrew month's length
const side = (p: string) => `
  e${p}.uuid AS ${p}_uuid, e${p}.name AS ${p}_name, e${p}.description AS ${p}_description,
  h${p}.gregorian AS ${p}_gregorian, h${p}.day_of_week AS ${p}_day_of_week,
  h${p}.day_index AS ${p}_day_index, h${p}.month_index AS ${p}_month_index,
  h${p}.yy AS ${p}_yy, h${p}.mm AS ${p}_mm, h${p}.dd AS ${p}_dd,
  (SELECT max(dd) FROM hebrew_dates m WHERE m.month_index = h${p}.month_index) AS ${p}_month_length,
  (SELECT COALESCE(json_agg(he.name ORDER BY he.name), '[]')
     FROM hebrew_event_dates hed
     JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hed.hebrew_date = h${p}.uuid AND he.short_name <> 'shabbat') AS ${p}_holidays`

const CALC_COLUMNS = BREAKDOWN_FIELDS.map((f) => `p.${f}`).join(', ')

const PAIR_SQL = `
  SELECT p.uuid, p.include_first_day, p.favorite, p.created_by, p.created_at, ${CALC_COLUMNS}, ${side('a')}, ${side('b')}
  FROM events_pairs p
  JOIN events ea ON ea.uuid = p.a
  JOIN hebrew_dates ha ON ha.uuid = ea.hebrew_date
  JOIN events eb ON eb.uuid = p.b
  JOIN hebrew_dates hb ON hb.uuid = eb.hebrew_date`

const pickSide = (row: any, p: string) => ({
  uuid: row[`${p}_uuid`],
  name: row[`${p}_name`],
  description: row[`${p}_description`],
  gregorian: row[`${p}_gregorian`],
  day_of_week: row[`${p}_day_of_week`],
  day_index: Number(row[`${p}_day_index`]),
  month_index: Number(row[`${p}_month_index`]),
  yy: row[`${p}_yy`],
  mm: row[`${p}_mm`],
  dd: row[`${p}_dd`],
  month_length: Number(row[`${p}_month_length`]),
  holidays: row[`${p}_holidays`] || []
})

// the stored numbers, as the UI's breakdown object (numeric columns arrive as strings)
const storedBreakdown = (row: any) => {
  const out: any = { include_first_day: row.include_first_day }
  for (const f of BREAKDOWN_FIELDS) out[f] = row[f] === null || row[f] === undefined ? null : Number(row[f])
  return out
}

const unflatten = (row: any) => ({
  uuid: row.uuid,
  include_first_day: row.include_first_day,
  favorite: !!row.favorite,
  created_by: row.created_by,
  created_at: row.created_at,
  a: pickSide(row, 'a'),
  b: pickSide(row, 'b'),
  breakdown: storedBreakdown(row)
})

export interface PairFilter {
  event?: string // pairs involving this event
  favorite?: boolean // only favorites
  q?: string // name search on either side
  field?: BreakdownField
  min?: number
  max?: number
  whole?: boolean // field is a whole number
  divisible_by?: number // field is a whole number divisible by this
  sort?: BreakdownField | 'created_at'
  dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

const isField = (f: any): f is BreakdownField => BREAKDOWN_FIELDS.includes(f)

export const listPairs = async (filter: PairFilter = {}): Promise<any[]> => {
  const where: string[] = []
  const replacements: any = {}
  if (filter.event) {
    where.push('(p.a = :event OR p.b = :event)')
    replacements.event = filter.event
  }
  if (filter.favorite) where.push('p.favorite = true')
  if (filter.q) {
    where.push('(ea.name ILIKE :pattern OR eb.name ILIKE :pattern)')
    replacements.pattern = `%${filter.q}%`
  }
  if (filter.field && isField(filter.field)) {
    const col = `p.${filter.field}`
    if (Number.isFinite(filter.min)) {
      where.push(`${col} >= :min`)
      replacements.min = filter.min
    }
    if (Number.isFinite(filter.max)) {
      where.push(`${col} <= :max`)
      replacements.max = filter.max
    }
    if (filter.whole || filter.divisible_by) where.push(`${col} = floor(${col})`)
    if (filter.divisible_by && Number.isFinite(filter.divisible_by) && filter.divisible_by > 0) {
      where.push(`mod(${col}::bigint, :divisor) = 0`)
      replacements.divisor = Math.floor(filter.divisible_by)
    }
  }
  const sortCol = filter.sort && (isField(filter.sort) ? `p.${filter.sort}` : filter.sort === 'created_at' ? 'p.created_at' : null)
  const order = sortCol ? `${sortCol} ${filter.dir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, p.created_at DESC` : 'p.created_at DESC'
  const limit = Number.isFinite(filter.limit) ? Math.min(Math.max(Number(filter.limit), 1), 1000) : 500
  const offset = Number.isFinite(filter.offset) ? Math.max(Number(filter.offset), 0) : 0

  const rows: any[] = await Models.sequelize.query(
    `${PAIR_SQL}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset};`,
    { replacements, type: QueryTypes.SELECT }
  )
  return rows.map(unflatten)
}

export const findPair = async (uuid: string): Promise<any | null> => {
  const rows: any[] = await Models.sequelize.query(`${PAIR_SQL} WHERE p.uuid = :uuid;`, {
    replacements: { uuid },
    type: QueryTypes.SELECT
  })
  return rows.length ? unflatten(rows[0]) : null
}

/** Recompute and store the maths for the given pairs (all pairs when none given). */
export const recalcPairs = async (where: { uuid?: string; event?: string } = {}): Promise<number> => {
  const clauses: string[] = []
  const replacements: any = {}
  if (where.uuid) {
    clauses.push('p.uuid = :uuid')
    replacements.uuid = where.uuid
  }
  if (where.event) {
    clauses.push('(p.a = :event OR p.b = :event)')
    replacements.event = where.event
  }
  const rows: any[] = await Models.sequelize.query(
    `${PAIR_SQL}${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''};`,
    { replacements, type: QueryTypes.SELECT }
  )
  for (const row of rows) {
    const calc = breakdown(pickSide(row, 'a'), pickSide(row, 'b'), row.include_first_day)
    const values: any = {}
    for (const f of BREAKDOWN_FIELDS) values[f] = calc[f]
    await Models.EventsPairs.update(values, { where: { uuid: row.uuid } })
  }
  return rows.length
}

export const createPair = async (values: {
  a: string
  b: string
  include_first_day: boolean
  created_by: string | null
}) => {
  const created = await Models.EventsPairs.create(values)
  await recalcPairs({ uuid: created.uuid })
  return findPair(created.uuid)
}

export const updatePair = async (uuid: string, values: { favorite?: boolean; include_first_day?: boolean }) => {
  const [count] = await Models.EventsPairs.update(values, { where: { uuid } })
  if (!count) return null
  // counting the first day changes every stored measure
  if (values.include_first_day !== undefined) await recalcPairs({ uuid })
  return findPair(uuid)
}

export const deletePair = async (uuid: string): Promise<number> =>
  Models.EventsPairs.destroy({ where: { uuid } })

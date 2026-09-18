import { QueryTypes } from 'sequelize'
import Models from '@api/models'
import { breakdown, BREAKDOWN_FIELDS, BreakdownField } from '@api/utils/breakdown'
import { listEvents } from '@api/models/Events/methods'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('@api/utils/analysis.js')

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
  SELECT p.uuid, p.include_first_day, p.favorite, p.created_by, p.created_at, ${CALC_COLUMNS},
         p.analysis, p.score, p.analysis_version, p.hebrew_years, p.same_month_day, ${side('a')}, ${side('b')}
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

const unflatten = (row: any, tol?: number, mode: 'exact' | 'upto' = 'upto') => {
  const stored = row.analysis || null
  const analysis = tol === undefined || !stored ? stored : engine.atTolerance(stored, tol, mode)
  return {
    uuid: row.uuid,
    include_first_day: row.include_first_day,
    favorite: !!row.favorite,
    created_by: row.created_by,
    created_at: row.created_at,
    a: pickSide(row, 'a'),
    b: pickSide(row, 'b'),
    breakdown: storedBreakdown(row),
    // the cycles-engine result (see utils/analysis.js), re-scored to the requested tolerance
    analysis,
    score: analysis ? analysis.score : Number(row.score) || 0,
    analysis_version: Number(row.analysis_version) || 0,
    hebrew_years: row.hebrew_years === null || row.hebrew_years === undefined ? null : Number(row.hebrew_years),
    same_month_day: !!row.same_month_day
  }
}

export interface PairFilter {
  event?: string // pairs involving this event
  favorite?: boolean // only favorites
  q?: string // name search on either side
  field?: BreakdownField
  min?: number
  max?: number
  whole?: boolean // field is a whole number
  divisible_by?: number // field is a whole number divisible by this
  sort?: BreakdownField | 'created_at' | 'score'
  dir?: 'asc' | 'desc'
  limit?: number
  offset?: number
  // cycles-engine filters: tolerance in days (0–3) applied to the stored hits, minimum score,
  // a hit family ('ladder' | 'classic' | 'years' | 'moon') or hit flag ('named', 'both-whole',
  // 'self-similar', 'jubilee' …) that must be present within that tolerance
  tol?: number
  // 'exact' (default when tol is given): only hits that miss by exactly the tolerance bucket,
  // and only pairs that have such a hit; 'upto': every hit within ±tol
  mode?: 'exact' | 'upto'
  min_score?: number
  family?: string
  flag?: string
  hebrew_years?: number
  same_month_day?: boolean
}

const isField = (f: any): f is BreakdownField => BREAKDOWN_FIELDS.includes(f)

/**
 * The engine's score, in SQL, over the stored hits within a tolerance: the best hit in full,
 * the second at a quarter, the third at a tenth (analysis.js WEIGHTS), capped at 10, rounded
 * like the engine.
 * `tol` is a SQL expression (a bind name or a literal).
 */
const scoreSql = (tol: string, mode: 'exact' | 'upto') => `(SELECT LEAST(10, COALESCE(round(sum(s * CASE rn WHEN 1 THEN 1 WHEN 2 THEN 0.25 ELSE 0.1 END)::numeric, 2), 0)) FROM (
      SELECT (h->>'score')::numeric AS s,
             row_number() OVER (ORDER BY (h->>'score')::numeric DESC, abs((h->>'offset')::numeric) ASC) AS rn
        FROM jsonb_array_elements(COALESCE(p.analysis->'hits', '[]'::jsonb)) h
       WHERE ${hitInTol(tol, mode)}) t WHERE rn <= 3)`

/** the engine's inTolerance() in SQL: 'exact' is the bucket (tol−1, tol], tol 0 → offset 0 */
const hitInTol = (tol: string, mode: 'exact' | 'upto') =>
  mode === 'exact'
    ? `(abs((h->>'offset')::numeric) <= ${tol} AND abs((h->>'offset')::numeric) > ${tol} - 1)`
    : `abs((h->>'offset')::numeric) <= ${tol}`

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
  const tol = Number.isFinite(filter.tol) ? Math.min(Math.max(Number(filter.tol), 0), engine.MAX_TOL) : undefined
  const mode: 'exact' | 'upto' = tol === undefined ? 'upto' : filter.mode === 'upto' ? 'upto' : 'exact'
  const hitTol = tol === undefined ? engine.MAX_TOL : tol
  replacements.hitTol = hitTol
  if (tol !== undefined && mode === 'exact') {
    // "only ±N": the pair must have a hit that misses by exactly that bucket
    where.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(p.analysis->'hits', '[]'::jsonb)) h WHERE ${hitInTol(':hitTol', mode)})`)
  }
  if (filter.family || filter.flag) {
    // a hit of that family / carrying that flag, within the tolerance
    where.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(p.analysis->'hits', '[]'::jsonb)) h
                  WHERE ${hitInTol(':hitTol', mode)}
                    ${filter.family ? "AND h->>'family' = :family" : ''}
                    ${filter.flag ? "AND h->'flags' ? :flag" : ''})`)
    if (filter.family) replacements.family = filter.family
    if (filter.flag) replacements.flag = filter.flag
  }
  if (Number.isFinite(filter.min_score) && Number(filter.min_score) > 0) {
    // score of the hits within tolerance, computed in SQL exactly as the engine does it
    where.push(`${scoreSql(':hitTol', mode)} >= :minScore`)
    replacements.minScore = Number(filter.min_score)
  }
  if (Number.isFinite(filter.hebrew_years)) {
    where.push('p.hebrew_years = :hebrewYears')
    replacements.hebrewYears = Number(filter.hebrew_years)
  }
  if (filter.same_month_day) where.push('p.same_month_day = true')
  const scoreExpr = scoreSql(String(hitTol), mode)
  const sortCol =
    filter.sort && (isField(filter.sort) ? `p.${filter.sort}` : filter.sort === 'created_at' ? 'p.created_at' : filter.sort === 'score' ? scoreExpr : null)
  const order = sortCol ? `${sortCol} ${filter.dir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, p.created_at DESC` : 'p.created_at DESC'
  const limit = Number.isFinite(filter.limit) ? Math.min(Math.max(Number(filter.limit), 1), 1000) : 500
  const offset = Number.isFinite(filter.offset) ? Math.max(Number(filter.offset), 0) : 0

  const rows: any[] = await Models.sequelize.query(
    `${PAIR_SQL}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset};`,
    { replacements, type: QueryTypes.SELECT }
  )
  return rows.map((r) => unflatten(r, tol, mode))
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
    const a = pickSide(row, 'a')
    const b = pickSide(row, 'b')
    const calc = breakdown(a, b, row.include_first_day)
    const values: any = {}
    for (const f of BREAKDOWN_FIELDS) values[f] = calc[f]
    // the cycles engine, stored at its widest tolerance; lists re-score per request
    const analysis = engine.analyzePair(a, b)
    values.analysis = analysis
    values.score = analysis.score
    values.analysis_version = engine.ANALYSIS_VERSION
    values.hebrew_years = analysis.hebrew_years
    values.same_month_day = analysis.same_month_day
    await Models.EventsPairs.update(values, { where: { uuid: row.uuid } })
  }
  return rows.length
}

/** pairs whose stored analysis predates the current engine (or is missing) get recomputed */
export const recalcStale = async (): Promise<number> => {
  const rows: any[] = await Models.sequelize.query(
    `SELECT uuid FROM events_pairs WHERE analysis IS NULL OR analysis_version < :v;`,
    { replacements: { v: engine.ANALYSIS_VERSION }, type: QueryTypes.SELECT }
  )
  for (const r of rows) await recalcPairs({ uuid: r.uuid })
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

/**
 * Generate every pair the engine finds interesting and persist it. The standing rule, used
 * automatically after an event is created or re-dated and by `yarn pairs:generate`:
 * score ≥ 4.5 within ±3 days, favorite at ≥ 6. Existing pairs are skipped (either direction),
 * so it only ever adds. `onlyEvent` restricts the scan to spans that touch one event, which
 * is all that can have changed after a create or edit. `dryRun` reports without writing.
 */
export const GENERATE_DEFAULTS = { minScore: 4.5, tol: 3, favoriteAt: 6 }

export interface GenerateOptions {
  minScore?: number
  tol?: number
  favoriteAt?: number | null
  onlyEvent?: string
  dryRun?: boolean
  log?: (line: string) => void
}

export const generatePairs = async (opts: GenerateOptions = {}) => {
  const minScore = opts.minScore ?? GENERATE_DEFAULTS.minScore
  const tol = Math.min(Math.max(opts.tol ?? GENERATE_DEFAULTS.tol, 0), engine.MAX_TOL)
  const favoriteAt = opts.favoriteAt === undefined ? GENERATE_DEFAULTS.favoriteAt : opts.favoriteAt
  const log = opts.log || (() => undefined)
  const existing: any[] = await Models.sequelize.query('SELECT a, b FROM events_pairs;', { type: QueryTypes.SELECT })
  const taken = new Set(existing.map((p) => [p.a, p.b].sort().join('|')))
  const events = (await listEvents()).sort((x, y) => Number(x.day_index) - Number(y.day_index))
  const found: { a: any; b: any; analysis: any }[] = []
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]
      if (opts.onlyEvent && a.uuid !== opts.onlyEvent && b.uuid !== opts.onlyEvent) continue
      if (taken.has([a.uuid, b.uuid].sort().join('|'))) continue
      const analysis = engine.analyzePair(a, b, tol)
      if (analysis.score >= minScore) found.push({ a, b, analysis })
    }
  }
  found.sort((x, y) => y.analysis.score - x.analysis.score)
  log(`${events.length} events, ${found.length} new spans with score ≥ ${minScore} at ±${tol}d${taken.size ? ` (${taken.size} existing pairs skipped)` : ''}`)
  let created = 0
  let favorited = 0
  for (const f of found) {
    log(`  ${f.analysis.score.toFixed(2).padStart(6)}  ${f.a.name.slice(0, 34).padEnd(34)} → ${f.b.name.slice(0, 34).padEnd(34)}  ${f.analysis.best}`)
    if (opts.dryRun) continue
    try {
      const pair = await createPair({ a: f.a.uuid, b: f.b.uuid, include_first_day: false, created_by: null })
      created++
      if (favoriteAt !== null && f.analysis.score >= favoriteAt && pair) {
        await Models.EventsPairs.update({ favorite: true }, { where: { uuid: pair.uuid } })
        favorited++
      }
    } catch (err: any) {
      // a concurrent create of the same pair is fine; anything else surfaces
      if (err?.name !== 'SequelizeUniqueConstraintError') throw err
    }
  }
  return { scanned: events.length, found: found.length, created, favorited }
}

import { QueryTypes } from 'sequelize'
import Models from '@api/models'
import { listEvents, findEvent } from '@api/models/Events/methods'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('@api/utils/analysis.js')

export const MAX_TOL: number = engine.MAX_TOL
export const RUNG: number = engine.RUNG
export const NAMED_RUNGS: number[] = engine.NAMED_RUNGS

const clampTol = (tol: any) => Math.min(Math.max(Number.isFinite(Number(tol)) ? Number(tol) : 2, 0), MAX_TOL)
const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

/** the row the engine wants for a creation anchor or an event */
const anchorRow = async (anchor: string | undefined) => {
  if (!anchor || anchor === 'creation1') return engine.CREATION_DAY_1
  if (anchor === 'creation8') return engine.CREATION_DAY_8
  if (!isUuid(anchor)) return null
  return findEvent(anchor)
}

/**
 * Every other event, analysed against `uuid`, ranked by score. Events already paired with
 * it (either direction) are left out so the list only offers new combinations.
 */
export const candidates = async (uuid: string, tol: any = 2, mode: 'exact' | 'upto' = 'exact') => {
  if (!isUuid(uuid)) return null
  const t = clampTol(tol)
  const [events, partners] = await Promise.all([
    listEvents(),
    Models.sequelize.query(
      `SELECT CASE WHEN a = :uuid THEN b ELSE a END AS other FROM events_pairs WHERE a = :uuid OR b = :uuid;`,
      { replacements: { uuid }, type: QueryTypes.SELECT }
    ) as Promise<any[]>
  ])
  const anchor = events.find((e) => e.uuid === uuid)
  if (!anchor) return null
  const taken = new Set(partners.map((p) => p.other))
  const out = events
    .filter((e) => e.uuid !== uuid && !taken.has(e.uuid))
    .map((e) => {
      // analysed earlier → later so the reading matches the pair that would be saved
      const [a, b] = Number(e.day_index) < Number(anchor.day_index) ? [e, anchor] : [anchor, e]
      return { event: e, analysis: engine.analyzePair(a, b, t, mode) }
    })
    // "only ±N": a candidate has to have a hit in that bucket
    .filter((c) => mode !== 'exact' || c.analysis.hits.length)
  out.sort((x, y) => y.analysis.score - x.analysis.score || Number(x.event.day_index) - Number(y.event.day_index))
  return { anchor, tolerance: t, mode, candidates: out }
}

/**
 * Same-rung groups: events whose day count from the anchor leaves the same residue mod
 * `period` (within ±tol, wrapping at the period boundary). Members of a group are all a whole
 * number of periods apart. `period` may also be 'y49' / 'y50' / 'y7' for Hebrew-year residues.
 */
export const cycles = async (opts: { period: any; tol: any; anchor?: string; mode?: 'exact' | 'upto' }) => {
  const t = clampTol(opts.tol)
  const mode = opts.mode === 'upto' ? 'upto' : 'exact'
  const events = await listEvents()
  const anchor = await anchorRow(opts.anchor)
  if (!anchor) return null
  const yearMode = typeof opts.period === 'string' && /^y\d+$/.test(opts.period)
  const period = yearMode ? Number(String(opts.period).slice(1)) : Number(opts.period) || RUNG
  if (!(period > 0)) return null
  const items = events.map((e) => {
    const span = yearMode ? Number(e.yy) - Number(anchor.yy) : Number(e.day_index) - Number(anchor.day_index)
    const residue = ((span % period) + period) % period
    return { event: e, span, residue, k: Math.floor(span / period) }
  })
  items.sort((x, y) => x.residue - y.residue)
  // sweep: a residue joins the open group only while the group's whole spread (max − min, and the
  // list is sorted so the newcomer is the max) stays within tol, so every pair of members is
  // within tol of each other; the wrap-around joins the last group to the first the same way
  const span = yearMode ? 0 : t
  const groups: { residue: number; members: typeof items }[] = []
  for (const it of items) {
    const g = groups[groups.length - 1]
    if (g && it.residue - g.members[0].residue <= span) g.members.push(it)
    else groups.push({ residue: it.residue, members: [it] })
  }
  if (!yearMode && groups.length > 1) {
    const first = groups[0]
    const last = groups[groups.length - 1]
    const lastMin = last.members[0].residue - period
    const firstMax = first.members[first.members.length - 1].residue
    if (firstMax - lastMin <= span) {
      first.members.unshift(...last.members.map((m) => ({ ...m, residue: m.residue - period })))
      first.residue = first.members[0].residue
      groups.pop()
    }
  }
  const shaped = groups
    .map((g) => {
      const centre = g.members[0].residue
      const members = g.members
        .map((m) => ({ event: m.event, k: m.k, offset: m.residue - centre, span: m.span }))
        // "only ±N": keep the exact members and the ones that miss by exactly that bucket
        .filter((m) => mode !== 'exact' || m.offset === 0 || engine.inTolerance(m.offset, t, 'exact'))
      return { residue: centre, size: members.length, members }
    })
    .filter((g) => g.size > 1 && (mode !== 'exact' || t === 0 || g.members.some((m) => m.offset !== 0)))
    .sort((x, y) => y.size - x.size || x.residue - y.residue)
  return { anchor: { name: anchor.name, day_index: anchor.day_index, yy: anchor.yy }, period, tolerance: t, mode, year_mode: yearMode, groups: shaped }
}

/**
 * Anchor projection, for the Ladder and the Events views.
 *
 * `forward` (Ladder) steps the anchor along the period and resolves each step to a date:
 *   8190                 the interesting rungs: every multiple of 44, 56, 90 or 91 (4 and 16 are too many)
 *   a multiple of 8190   every step of it (k = 4 → 4, 8, 12 …)
 *   anything else        every step, but only the ones with an event within ±14 days
 *   a year period        no ladder (years are not a day count)
 *
 * `events` (Events) is every event that sits a whole number of the period from the anchor,
 * within the tolerance, with that reading and its analysis at the same tolerance.
 */
const INTERESTING_K = [44, 56, 90, 91]
const MAX_ROWS = 500
const NEAR_DAYS = 14

export const project = async (anchorId: string | undefined, periodArg?: any, tolArg?: any, modeArg?: 'exact' | 'upto') => {
  const anchor = await anchorRow(anchorId)
  if (!anchor) return null
  const yearMode = typeof periodArg === 'string' && /^y\d+$/.test(periodArg)
  const period = yearMode ? Number(String(periodArg).slice(1)) : Number(periodArg) || RUNG
  if (!(period > 0)) return null
  const t = clampTol(tolArg)
  const mode: 'exact' | 'upto' = modeArg === 'upto' ? 'upto' : 'exact'
  const base = Number(anchor.day_index)
  const events = await listEvents()
  const kind = yearMode ? 'years' : period === RUNG ? 'rung' : period % RUNG === 0 ? 'multiple' : RUNG % period === 0 ? 'fraction' : 'other'

  // ---- forward: the ladder
  const [{ max_index }]: any[] = await Models.sequelize.query('SELECT max(day_index) AS max_index FROM hebrew_dates;', { type: QueryTypes.SELECT })
  const maxIdx = Number(max_index)
  const targets: { k: number; step: number; day_index: number }[] = []
  if (!yearMode) {
    if (kind === 'rung') {
      const maxK = Math.floor((maxIdx - base) / RUNG)
      const ks = new Set<number>()
      for (const m of INTERESTING_K) for (let k = m; k <= maxK; k += m) ks.add(k)
      for (const k of [...ks].sort((a, b) => a - b)) targets.push({ k, step: k, day_index: base + k * RUNG })
    } else {
      for (let m = 1; base + m * period <= maxIdx && targets.length < MAX_ROWS * 8; m++) targets.push({ k: (m * period) / RUNG, step: m, day_index: base + m * period })
    }
  }
  const nearOf = (idx: number) =>
    events
      .map((e) => ({ event: e, offset: Number(e.day_index) - idx }))
      .filter((x) => Math.abs(x.offset) <= NEAR_DAYS)
      .sort((x, y) => Math.abs(x.offset) - Math.abs(y.offset))
  let picked = targets.map((x) => ({ ...x, near: nearOf(x.day_index) }))
  // every step of a small period is thousands of rows; keep the ones something lands on
  if (kind === 'fraction' || kind === 'other') picked = picked.filter((x) => x.near.length)
  const truncated = picked.length > MAX_ROWS
  picked = picked.slice(0, MAX_ROWS)
  const rows: any[] = picked.length
    ? await Models.sequelize.query(
        `SELECT hd.day_index, to_char(hd.gregorian, 'YYYY-MM-DD') AS gregorian,
                CASE WHEN hd.gregorian < DATE '0001-01-01' THEN 'bc' ELSE 'ad' END AS era,
                hd.day_of_week, hd.yy, hd.mm, hd.dd,
                (SELECT COALESCE(json_agg(he.name ORDER BY he.name), '[]')
                   FROM hebrew_event_dates hed
                   JOIN hebrew_events he ON he.uuid = hed.hebrew_event
                  WHERE hed.hebrew_date = hd.uuid AND he.short_name <> 'shabbat') AS holidays
           FROM hebrew_dates hd WHERE hd.day_index IN (:idx);`,
        { replacements: { idx: picked.map((x) => x.day_index) }, type: QueryTypes.SELECT }
      )
    : []
  // bigint columns arrive as strings from a raw query; the payload should be numbers throughout
  const byIdx = new Map(rows.map((r) => [Number(r.day_index), { ...r, day_index: Number(r.day_index) }]))
  const forward = picked.map((x) => {
    const date = byIdx.get(x.day_index) || null
    return {
      k: x.k,
      step: x.step,
      label: engine.NAMED_K[x.k] || `${x.k * 22.5} y364 = ${x.k * 22.75} y360`,
      day_index: x.day_index,
      y364: (x.step * period) / 364,
      y360: (x.step * period) / 360,
      date,
      holidays: date ? date.holidays || [] : [],
      near: x.near
    }
  })

  // ---- events: every event read against this period, closest to a whole multiple first.
  // Not filtered — from most anchors nothing is exact, and an empty list teaches nothing. The
  // tolerance filters each event's hit chips and flags the rows that land in the bucket.
  const list = events
    .filter((e) => e.uuid !== (anchor as any).uuid)
    .map((e) => {
      const [a, b] = Number(e.day_index) < base ? [e, anchor] : [anchor, e]
      const analysis = engine.analyzePair(a, b, t, mode)
      const days = Math.abs(Number(e.day_index) - base)
      const step = yearMode
        ? (() => {
            const dy = Math.abs(Number(e.yy) - Number(anchor.yy))
            const m = Math.round(dy / period)
            return { m, offset: m * period - dy, unit: 'years' as const }
          })()
        : (() => {
            const { m, off } = engine.nearest(days, period)
            return { m, offset: off, unit: 'days' as const }
          })()
      return {
        event: e,
        direction: Number(e.day_index) < base ? 'before' : 'after',
        days,
        step,
        // does this event sit on the period, at the tolerance in view?
        on_period: step.m >= 1 && engine.inTolerance(step.offset, t, mode),
        analysis
      }
    })
    // an event closer to the anchor than half a period sits on no multiple of it
    .filter((x) => x.step.m >= 1)
    .sort(
      (x, y) =>
        Math.abs(x.step.offset) - Math.abs(y.step.offset) ||
        y.analysis.score - x.analysis.score ||
        x.days - y.days
    )

  return {
    anchor: { name: anchor.name, day_index: anchor.day_index },
    period,
    kind,
    tolerance: t,
    year_mode: yearMode,
    truncated,
    forward,
    events: list
  }
}

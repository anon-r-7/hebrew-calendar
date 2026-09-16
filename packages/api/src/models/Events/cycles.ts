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
 * Anchor projection. Forward: the anchor stepped along the chosen period, resolved to calendar
 * dates, with holidays on the day and events within ±14 days. Which steps:
 *   period 8190          the interesting rungs: every multiple of 44, 56, 90 or 91 (4 and 16 are too many)
 *   a multiple of 8190   every multiple of that step (k = 4 → 4, 8, 12 …)
 *   a fraction of 8190   every multiple of the fraction, but only the steps with an event within ±14 days
 * Backward: every event's reading from the anchor, best first.
 */
const INTERESTING_K = [44, 56, 90, 91]
const MAX_ROWS = 500

export const project = async (anchorId: string | undefined, periodArg?: any) => {
  const anchor = await anchorRow(anchorId)
  if (!anchor) return null
  const period = Number(periodArg) || RUNG
  if (!(period > 0) || (period % RUNG !== 0 && RUNG % period !== 0)) return null
  const [{ max_index }]: any[] = await Models.sequelize.query('SELECT max(day_index) AS max_index FROM hebrew_dates;', { type: QueryTypes.SELECT })
  const maxIdx = Number(max_index)
  const base = Number(anchor.day_index)
  const events = await listEvents()
  const kind = period === RUNG ? 'rung' : period % RUNG === 0 ? 'multiple' : 'fraction'
  // steps as multiples of the period, expressed in rungs
  const targets: { k: number; step: number; day_index: number }[] = []
  if (kind === 'rung') {
    const maxK = Math.floor((maxIdx - base) / RUNG)
    const ks = new Set<number>()
    for (const m of INTERESTING_K) for (let k = m; k <= maxK; k += m) ks.add(k)
    for (const k of [...ks].sort((a, b) => a - b)) targets.push({ k, step: k, day_index: base + k * RUNG })
  } else {
    for (let m = 1; base + m * period <= maxIdx && targets.length < MAX_ROWS * 4; m++) targets.push({ k: (m * period) / RUNG, step: m, day_index: base + m * period })
  }
  const nearOf = (idx: number) =>
    events
      .map((e) => ({ event: e, offset: Number(e.day_index) - idx }))
      .filter((x) => Math.abs(x.offset) <= 14)
      .sort((x, y) => Math.abs(x.offset) - Math.abs(y.offset))
  let picked = targets.map((t) => ({ ...t, near: nearOf(t.day_index) }))
  // fractions: thousands of steps from Creation; keep the ones something lands on
  if (kind === 'fraction') picked = picked.filter((t) => t.near.length)
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
        { replacements: { idx: picked.map((t) => t.day_index) }, type: QueryTypes.SELECT }
      )
    : []
  const byIdx = new Map(rows.map((r) => [Number(r.day_index), r]))
  const d = RUNG / period
  const forward = picked.map((t) => {
    const date = byIdx.get(t.day_index) || null
    const label =
      kind === 'fraction'
        ? `${t.step} × ${period} = ${Number.isInteger(t.k) ? t.k : `${t.step}/${d}`} rung${t.k === 1 ? '' : 's'}`
        : engine.NAMED_K[t.k] || `${t.k * 22.5} y364 = ${t.k * 22.75} y360`
    return {
      k: t.k,
      step: t.step,
      label,
      day_index: t.day_index,
      y364: t.k * 22.5,
      y360: t.k * 22.75,
      date,
      holidays: date ? date.holidays || [] : [],
      near: t.near
    }
  })
  const backward = events
    .filter((e) => e.uuid !== (anchor as any).uuid)
    .map((e) => {
      const [a, b] = Number(e.day_index) < Number(anchor.day_index) ? [e, anchor] : [anchor, e]
      const analysis = engine.analyzePair(a, b, MAX_TOL)
      return { event: e, direction: Number(e.day_index) < Number(anchor.day_index) ? 'before' : 'after', analysis }
    })
    .sort((x, y) => y.analysis.score - x.analysis.score || x.analysis.days - y.analysis.days)
  return { anchor: { name: anchor.name, day_index: anchor.day_index }, period, kind, truncated, forward, backward }
}

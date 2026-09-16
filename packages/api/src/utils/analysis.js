'use strict'

/**
 * The cycles engine: everything "interesting" about the span between two dates, scored.
 *
 * Plain JS (not TS) on purpose: migrations require() it to backfill, and the TS code imports
 * it (allowJs). Keep it dependency-free.
 *
 * The idea: 364-day (Enochian) and 360-day (Revelation) years close together only every
 * 32,760 days = 90 × 364 = 91 × 360. A quarter of that, 8,190 = 90 × 91, is the "rung". Any
 * span is read as a rational number of rungs (k whole rungs + r/d of a rung), and a span
 * within a few days of a clean fraction is a hit.
 *
 * Offsets: a hit's `offset` is the number of days the span is SHORT of the clean value
 * (clean − days). +1 means one day short, i.e. counting the first day makes it exact (the old
 * "include first day"); −1 means one day over. Fractions of a day appear for x.5 / x.75 values.
 *
 * Scores are a 0–10 tier scale, not a rarity: a whole rung of 8190 is 8, +1 when the rung is a
 * named one, +½ when it is whole in both calendars (k ≡ 0 mod 4), +½ when it is self-similar
 * (k a multiple of 90 or 91). Fractions of a rung step down by denominator (½ → 6.5, ⅓ and ¼ → 6,
 * ⅕–⅛ → 5.5, ⅑–1/16 → 5, coarser → 4.5, +½ when the whole part is a named rung and d ≤ 10). Whole
 * classic periods sit below (2548 → 6, 1260 → 5.5, 364 and 360 → 4.5, weeks → 1). The Hebrew-year
 * layer only counts on the SAME month and day (a year count alone is always true of something):
 * jubilee multiple 6, named year count 5, sabbatical 3, plain same date 2.5; both ends in jubilee
 * years 1; same day of the Hebrew month 1. The offset does not change the score; the tolerance
 * filter decides which hits are in view.
 *
 * Families of hits:
 *   ladder  – k + r/d rungs of 8190 (d over the divisors of 8190 down to period 91, plus the
 *             half/quarter denominators 4, 8, 12, 20, 28 which land on x.5 / x.75 days)
 *   classic – whole 7 / 30 / 360 / 364 / 1260 / 2548 day periods
 *   moon    – same day of the Hebrew month (the old "new moons whole")
 *   years   – the Hebrew-year layer: 49-multiples (jubilees), named year counts, both ends in
 *             the jubilee class (≡ 3001 mod 49), same month and day
 *
 * A hit whose period divides another hit's period at the same offset is dropped (a span on
 * 8190 is also on 4095, 2730, 1638 … but that is one fact). The pair score is the best hit
 * plus a quarter of the second and a tenth of the third, capped at 10. Bump ANALYSIS_VERSION
 * whenever the rules change so stored analyses can be recomputed.
 */

const ANALYSIS_VERSION = 3
const RUNG = 8190
const CYCLE = 32760 // 4 rungs: 90 y364 = 91 y360
const MAX_TOL = 3 // hits are computed out to ±3 days; callers filter tighter

// denominators d for which a hit on 8190/d is worth recording: the divisors of 8190 up to 30
// (period ≥ 273 days) plus the half/quarter denominators 4, 8, 12, 20, 28 (x.5 / x.75 days)
const DENOMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 18, 20, 21, 26, 28, 30]

// rungs that are notable in their own right (what the year columns read at that rung)
const NAMED_K = {
  4: '90 y364 = 91 y360',
  16: '360 y364 = 364 y360',
  44: '990 y364 = 1001 y360',
  56: '1260 y364',
  88: '1980 y364 = 2002 y360',
  90: '2025 y364 = 2047.5 y360',
  91: '2047.5 y364 = 2070.25 y360',
  92: '2070 y364 = 2093 y360',
  112: '2520 y364 = 2548 y360',
  132: '2970 y364 = 3003 y360',
  144: '3240 y364 = 3276 y360 ≈ 3229 solar',
  176: '3960 y364 = 4004 y360',
  180: '4050 y364 = 4095 y360',
  182: '4095 y364 = 4140.5 y360',
  184: '4140 y364 = 4186 y360',
  196: '4410 y364 = 4459 y360 ≈ 4395 solar',
  220: '4950 y364 = 5005 y360',
  264: '5940 y364 = 6006 y360',
  270: '6075 y364 = 6142.5 y360',
  273: '6142.5 y364 = 6210.75 y360',
  308: '6930 y364 = 7007 y360',
  340: '7650 y364 = 7735 y360 ≈ 7624 solar',
  360: '8100 y364 = 8190 y360',
  364: '8190 y364 = 8281 y360',
  392: '8820 y364 = 8918 y360 ≈ 8790 solar'
}
const NAMED_RUNGS = Object.keys(NAMED_K).map(Number)

const NAMED_YEARS = new Set([
  40, 49, 50, 70, 90, 91, 120, 360, 364, 430, 480, 490, 500, 1000, 1001, 1260, 2000, 2002, 2520, 2548, 3000, 3003, 4000,
  4004, 6000, 6006, 7000, 7007
])
const JUBILEE_ANCHOR = 3001 // 1st Temple jubilee; jubilee-class years are ≡ 3001 mod 49

const CLASSIC = [
  { period: 7, unit: 'weeks', base: 1 },
  { period: 360, unit: 'y360', base: 4.5 },
  { period: 364, unit: 'y364', base: 4.5 },
  { period: 1260, unit: '× 1260', base: 5.5 },
  { period: 2548, unit: '× 2548', base: 6 }
]

// synthetic rows for the two creation anchors (1-08-01 = day 1; day 8 opens the second week)
const CREATION_DAY_1 = { name: 'Creation day 1', day_index: 1, month_index: 1, yy: 1, mm: 8, dd: 1, month_length: 30 }
const CREATION_DAY_8 = { name: 'Creation day 8', day_index: 8, month_index: 1, yy: 1, mm: 8, dd: 8, month_length: 30 }

const gcd = (a, b) => (b ? gcd(b, a % b) : a)
const round = (x, p = 3) => Math.round(x * 10 ** p) / 10 ** p

// the offset does not change a hit's score: the view is always filtered to one tolerance, so
// ranking within it is by the strength of the fact alone
const scored = (base) => round(base, 2)

/** nearest multiple of period: {m, off} with days + off = m·period (off > 0: the span is short) */
const nearest = (days, period) => {
  const m = Math.round(days / period)
  return { m, off: round(m * period - days, 2) }
}

/** days as a mixed number of rungs, plus the signed distance to the nearest clean fraction */
const rungPosition = (days) => {
  const value = days / RUNG
  let best = null
  for (const den of DENOMS) {
    const { m, off } = nearest(days, RUNG / den)
    if (Math.abs(off) <= MAX_TOL && (!best || Math.abs(off) < Math.abs(best.off) - 1e-9)) {
      const g = gcd(m, den)
      best = { num: m / g, den: den / g, off }
    }
  }
  const k = Math.floor(value)
  return {
    value: round(value, 4),
    k,
    remainder: round(value - k, 4),
    nearest: best ? { k: Math.floor(best.num / best.den), r: best.num % best.den, d: best.den, offset: best.off } : null
  }
}

const ladderHits = (days) => {
  const hits = []
  const seen = new Set()
  for (const den of DENOMS) {
    const period = RUNG / den
    const { m, off } = nearest(days, period)
    if (m <= 0 || Math.abs(off) > MAX_TOL) continue
    const g = gcd(m, den)
    const num = m / g
    const d = den / g
    const key = `${num}/${d}@${off}`
    if (seen.has(key)) continue
    seen.add(key)
    const k = Math.floor(num / d)
    const r = num % d
    const flags = []
    let base
    if (r === 0) {
      base = 8
      if (NAMED_K[k]) {
        flags.push('named')
        base += 1
      }
      if (k % 4 === 0) {
        flags.push('both-whole')
        base += 0.5
      }
      if (k % 90 === 0 || k % 91 === 0) {
        flags.push('self-similar')
        base += 0.5
      }
    } else {
      // fractions step down by denominator: ½ 6.5 · ⅓ ¼ 6 · ⅕–⅛ 5.5 · ⅑–1/16 5 · coarser 4.5
      base = 7 - 0.5 * Math.ceil(Math.log2(d))
      if (k > 0 && NAMED_K[k] && d <= 10) {
        // a named rung plus a clean fraction (44 + 1/5); coarse fractions don't earn it
        flags.push('named-whole-part')
        base += 0.5
      }
    }
    const label = r === 0 ? `${k} rung${k === 1 ? '' : 's'}` : k ? `${k} + ${r}/${d} rungs` : `${r}/${d} rung`
    // the divisibility this hit actually asserts: k%4 → the full 32760 cycle, even k → 16380
    const implies = r === 0 ? (k % 4 === 0 ? CYCLE : k % 2 === 0 ? RUNG * 2 : RUNG) : RUNG / d
    hits.push({
      family: 'ladder',
      label,
      detail: r === 0 && NAMED_K[k] ? NAMED_K[k] : `${round((num / d) * 22.5, 3)} y364 · ${round((num / d) * 22.75, 3)} y360`,
      period: RUNG / d,
      implies,
      k,
      r,
      d,
      offset: off,
      flags,
      score: scored(base, off)
    })
  }
  return hits
}

const classicHits = (days) => {
  const hits = []
  for (const { period, unit, base } of CLASSIC) {
    const { m, off } = nearest(days, period)
    if (m <= 0 || Math.abs(off) > MAX_TOL) continue
    hits.push({ family: 'classic', label: `${m} ${unit}`, period, k: m, offset: off, flags: [], score: scored(base, off) })
  }
  return hits
}

const yearHits = (a, b) => {
  const ya = Number(a.yy)
  const yb = Number(b.yy)
  const hy = Math.abs(yb - ya)
  const sameMD = Number(a.mm) === Number(b.mm) && Number(a.dd) === Number(b.dd)
  const sameDD = Number(a.dd) === Number(b.dd)
  const hits = []
  const named = NAMED_YEARS.has(hy)
  // a year count on its own is always true of something; it only means anything on the same date
  if (sameMD && hy && hy % 49 === 0) {
    hits.push({ family: 'years', label: `${hy} Hebrew years = ${hy / 49} × 49, same date`, period: 49, k: hy / 49, offset: 0, flags: named ? ['jubilee', 'named-years', 'same-date'] : ['jubilee', 'same-date'], score: named ? 6.5 : 6 })
  } else if (sameMD && named) {
    hits.push({ family: 'years', label: `${hy} Hebrew years, same date`, period: hy, k: 1, offset: 0, flags: ['named-years', 'same-date'], score: 5 })
  } else if (sameMD && hy && hy % 7 === 0) {
    hits.push({ family: 'years', label: `${hy} Hebrew years = ${hy / 7} × 7, same date`, period: 7, k: hy / 7, offset: 0, flags: ['sabbatical', 'same-date'], score: 3 })
  } else if (sameMD && hy) {
    hits.push({ family: 'years', label: `${hy} Hebrew years, same date`, period: 354, k: hy, offset: 0, flags: ['same-date'], score: 2.5 })
  }
  if ((ya - JUBILEE_ANCHOR) % 49 === 0 && (yb - JUBILEE_ANCHOR) % 49 === 0) {
    hits.push({ family: 'years', label: 'both in jubilee years (≡ 3001 mod 49)', period: 49, k: 0, offset: 0, flags: ['jubilee-class'], score: 1 })
  }
  if (sameDD && !sameMD) {
    hits.push({ family: 'moon', label: 'same day of the Hebrew month', period: 30, k: 0, offset: 0, flags: [], score: 1 })
  }
  return { hits, hebrew_years: hy, same_month_day: sameMD, mod_49: hy % 49, jubilee_class: (ya - JUBILEE_ANCHOR) % 49 === 0 && (yb - JUBILEE_ANCHOR) % 49 === 0 }
}

/** drop a hit when another hit at the same offset asserts a period it divides (same fact, coarser),
 *  and drop hits too cheap to mean anything (a week at ±3 is score 0) */
const dedupe = (hits) =>
  hits.filter((h) => {
    if (h.score < 1) return false
    if (h.family === 'years') return true
    return !hits.some((o) => {
      if (o === h || o.family === 'years' || o.offset !== h.offset) return false
      const big = o.implies || o.period
      return big > h.period && Number.isInteger(round(big / h.period, 6))
    })
  })

// best hit counts in full, the next two at a quarter and a tenth, capped at 10: several small
// facts about one span must not outscore one big one
const WEIGHTS = [1, 0.25, 0.1]
const scoreOf = (hits) => round(Math.min(10, hits.slice(0, 3).reduce((s, h, i) => s + h.score * WEIGHTS[i], 0)), 2)

/**
 * Tolerance modes. 'upto' keeps every hit with |offset| ≤ tol. 'exact' keeps only the hits whose
 * |offset| falls in the bucket (tol−1, tol] — tol 0 is offset 0 only, tol 1 catches ½ and 1, tol 2
 * catches 1¼ … 2, tol 3 catches 2¼ … 3 — so a view at ±2 shows spans that miss by two days, not
 * everything up to two days.
 */
const inTolerance = (offset, tol, mode) => {
  const t = Math.min(Math.max(Number(tol) || 0, 0), MAX_TOL)
  const o = Math.abs(offset)
  if (mode === 'exact') return t === 0 ? o === 0 : o <= t && o > t - 1
  return o <= t
}

/**
 * Analyse the span a → b. Rows need day_index, yy, mm, dd. `tol` (0–3) keeps only hits within
 * ±tol days; the score is over the kept hits.
 */
const analyzePair = (a, b, tol = MAX_TOL, mode = 'upto') => {
  const days = Math.abs(Number(b.day_index) - Number(a.day_index))
  const years = yearHits(a, b)
  let hits = dedupe([...ladderHits(days), ...classicHits(days), ...years.hits])
  hits = hits.filter((h) => inTolerance(h.offset, tol, mode))
  hits.sort((x, y) => y.score - x.score || Math.abs(x.offset) - Math.abs(y.offset))
  return {
    version: ANALYSIS_VERSION,
    days,
    rung: rungPosition(days),
    hebrew_years: years.hebrew_years,
    same_month_day: years.same_month_day,
    jubilee_class: years.jubilee_class,
    hits,
    best: hits[0] ? hits[0].label : null,
    score: scoreOf(hits)
  }
}

/** re-filter a stored (tol 3) analysis to a tighter tolerance without recomputing */
const atTolerance = (analysis, tol, mode = 'upto') => {
  if (!analysis) return analysis
  const hits = (analysis.hits || []).filter((h) => inTolerance(h.offset, tol, mode))
  return { ...analysis, hits, best: hits[0] ? hits[0].label : null, score: scoreOf(hits) }
}

/** the same, for a single event against the two creation anchors */
const fromCreation = (row, tol = MAX_TOL) => ({
  day1: analyzePair(CREATION_DAY_1, row, tol),
  day8: analyzePair(CREATION_DAY_8, row, tol)
})

module.exports = {
  ANALYSIS_VERSION,
  RUNG,
  CYCLE,
  MAX_TOL,
  DENOMS,
  NAMED_K,
  NAMED_RUNGS,
  NAMED_YEARS,
  CREATION_DAY_1,
  CREATION_DAY_8,
  nearest,
  rungPosition,
  inTolerance,
  analyzePair,
  atTolerance,
  fromCreation
}

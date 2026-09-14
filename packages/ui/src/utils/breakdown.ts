/**
 * The pair maths, computed in the browser from two events' day_index / month_index.
 * Mirrors packages/api/src/utils/breakdown.ts (which is what gets persisted on a pair).
 */
export interface BreakdownInput {
  day_index: number | string
  month_index: number | string
  yy: number | string
  dd: number | string
  month_length?: number | string
}

export interface Breakdown {
  days: number
  half_days: number
  weeks: number
  years_364: number
  months_364: number
  years_360: number
  months_360: number
  years_civil: number
  new_moons: number
  new_moons_fraction: number
  new_moon_years: number
  new_moon_years_fraction: number
}

export const breakdown = (a: BreakdownInput, b: BreakdownInput, includeFirstDay: boolean): Breakdown => {
  const first = includeFirstDay ? 1 : 0
  const position = (r: BreakdownInput) =>
    Number(r.month_index) + (Number(r.dd) - 1) / (Number(r.month_length) || 30)
  const days = Math.abs(Number(b.day_index) - Number(a.day_index)) + first
  const new_moons = Math.abs(Number(b.month_index) - Number(a.month_index)) + first
  const new_moons_fraction = Math.abs(position(b) - position(a)) + first
  return {
    days,
    half_days: days * 2,
    weeks: days / 7,
    years_364: days / 364,
    months_364: (days * 12) / 364,
    years_360: days / 360,
    months_360: days / 30,
    years_civil: Math.abs(Number(b.yy) - Number(a.yy)),
    new_moons,
    new_moons_fraction,
    new_moon_years: new_moons / 12,
    new_moon_years_fraction: new_moons_fraction / 12
  }
}

/** whole-number test that tolerates the float in fractional new moons */
export const isWholeNumber = (n: number) => Math.abs(n - Math.round(n)) < 1e-6

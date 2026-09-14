/**
 * Everything the UI's "days between" table shows, from two hebrew_dates rows. Also the
 * set of columns persisted on events_pairs (same names), so a pair can be filtered on
 * them server-side. month_length is the number of days in each row's Hebrew month.
 */
export interface BreakdownRow {
  day_index: number | string
  month_index: number | string
  yy: number | string
  mm: number | string
  dd: number | string
  month_length: number | string
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
  include_first_day: boolean
}

/** numeric columns of events_pairs a caller may filter or sort by */
export const BREAKDOWN_FIELDS = [
  'days', 'half_days', 'weeks', 'years_364', 'months_364', 'years_360', 'months_360',
  'years_civil', 'new_moons', 'new_moons_fraction', 'new_moon_years', 'new_moon_years_fraction'
] as const
export type BreakdownField = (typeof BREAKDOWN_FIELDS)[number]

export const breakdown = (a: BreakdownRow, b: BreakdownRow, includeFirstDay: boolean): Breakdown => {
  const first = includeFirstDay ? 1 : 0
  const position = (r: BreakdownRow) =>
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
    new_moon_years_fraction: new_moons_fraction / 12,
    include_first_day: includeFirstDay
  }
}

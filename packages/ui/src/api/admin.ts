import { client } from './client'

/** one thing the cycles engine found about a span (see api utils/analysis.js) */
export interface Hit {
  family: 'ladder' | 'classic' | 'years' | 'moon'
  label: string
  detail?: string
  period: number
  k?: number
  r?: number
  d?: number
  offset: number
  flags: string[]
  score: number
}

export interface Analysis {
  version: number
  days: number
  rung: { value: number; k: number; remainder: number; nearest: { k: number; r: number; d: number; offset: number } | null }
  hebrew_years: number
  same_month_day: boolean
  jubilee_class: boolean
  hits: Hit[]
  best: string | null
  score: number
}

export interface FromCreation {
  days: number
  y364: number
  y360: number
  day1: { rung: Analysis['rung']; best: string | null; score: number; hits: Hit[] }
  day8: { rung: Analysis['rung']; best: string | null; score: number; hits: Hit[] }
}

export interface AdminEvent {
  uuid: string
  from_creation?: FromCreation
  name: string
  description: string | null
  created_by_name?: string | null
  holidays?: string[]
  hebrew_date: string
  gregorian: string
  day_of_week: string
  day_index: number
  month_index: number
  month_length?: number
  yy: number
  mm: number
  dd: number
}

export interface AdminPair {
  uuid: string
  include_first_day: boolean
  favorite: boolean
  created_at: string
  a: AdminEvent
  b: AdminEvent
  analysis: Analysis | null
  score: number
  hebrew_years: number | null
  same_month_day: boolean
  breakdown: {
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
}

/** numeric measures stored on a pair; the pairs list can filter and sort on any of them */
export const PAIR_FIELDS: { key: keyof AdminPair['breakdown']; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'half_days', label: 'Half days' },
  { key: 'weeks', label: 'Weeks' },
  { key: 'years_364', label: 'Years (Enochian)' },
  { key: 'months_364', label: 'Months (Enochian)' },
  { key: 'years_360', label: 'Years (Revelation)' },
  { key: 'months_360', label: 'Months (Revelation)' },
  { key: 'years_civil', label: 'Years (civil)' },
  { key: 'new_moons', label: 'New moons' },
  { key: 'new_moons_fraction', label: 'New moons (fractional)' },
  { key: 'new_moon_years', label: 'New moon years' },
  { key: 'new_moon_years_fraction', label: 'New moon years (fractional)' }
]

export interface PairFilter {
  event?: string
  favorite?: boolean
  q?: string
  field?: string
  min?: string
  max?: string
  whole?: boolean
  divisible_by?: string
  sort?: string
  dir?: 'asc' | 'desc'
  limit?: number
  // cycles engine
  tol?: number
  min_score?: string
  family?: string
  flag?: string
  same_month_day?: boolean
}

export interface Candidate {
  event: AdminEvent
  analysis: Analysis
}
export interface CycleGroup {
  residue: number
  size: number
  members: { event: AdminEvent; k: number; offset: number; span: number }[]
}
export interface Projection {
  anchor: { name: string; day_index: number }
  period: number
  kind: 'rung' | 'multiple' | 'fraction'
  truncated: boolean
  forward: {
    k: number
    step: number
    label: string
    day_index: number
    y364: number
    y360: number
    date: { gregorian: string; era: 'ad' | 'bc'; day_of_week: string; yy: number; mm: number; dd: number } | null
    // holidays that fall on the rung date itself (shabbat excluded)
    holidays: string[]
    near: { event: AdminEvent; offset: number }[]
  }[]
  backward: { event: AdminEvent; direction: 'before' | 'after'; analysis: Analysis }[]
}

const listEvents = async (q = '') =>
  (await client({ method: 'GET', url: 'events', params: q ? { q } : {} })).data as AdminEvent[]

export interface NewEvent {
  name: string
  description: string
  type: 'gregorian' | 'hebrew'
  date: string
  era: 'ad' | 'bc'
}

const createEvent = async (data: NewEvent) => (await client({ method: 'POST', url: 'events', data })).data as AdminEvent

const updateEvent = async (uuid: string, data: Partial<NewEvent>) =>
  (await client({ method: 'PATCH', url: `events/${uuid}`, data })).data as AdminEvent

const deleteEvent = async (uuid: string) => client({ method: 'DELETE', url: `events/${uuid}` })

const listPairs = async (filter: PairFilter = {}) => {
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(filter)) if (v !== undefined && v !== '' && v !== false) params[k] = String(v)
  return (await client({ method: 'GET', url: 'events/pairs', params })).data as AdminPair[]
}

const createPair = async (data: { a: string; b: string; include_first_day: boolean }) =>
  (await client({ method: 'POST', url: 'events/pairs', data })).data as AdminPair

const updatePair = async (uuid: string, data: { favorite?: boolean; include_first_day?: boolean }) =>
  (await client({ method: 'PATCH', url: `events/pairs/${uuid}`, data })).data as AdminPair
const setPairFavorite = (uuid: string, favorite: boolean) => updatePair(uuid, { favorite })

const deletePair = async (uuid: string) => client({ method: 'DELETE', url: `events/pairs/${uuid}` })

/** every other event analysed against this one, ranked, minus its existing partners */
const candidates = async (uuid: string, tol: number) =>
  (await client({ method: 'GET', url: `events/${uuid}/candidates`, params: { tol } })).data as {
    anchor: AdminEvent
    tolerance: number
    candidates: Candidate[]
  }

/** same-rung groups under a period (days, or y49 / y50 / y7) from an anchor (creation1 | creation8 | event uuid) */
const cycles = async (period: string | number, tol: number, anchor: string) =>
  (await client({ method: 'GET', url: 'events/cycles', params: { period, tol, anchor } })).data as {
    anchor: { name: string; day_index: number; yy: number }
    period: number
    tolerance: number
    year_mode: boolean
    groups: CycleGroup[]
  }

const project = async (anchor: string, period?: string | number) =>
  (await client({ method: 'GET', url: 'events/project', params: period ? { anchor, period } : { anchor } })).data as Projection

export default { listEvents, createEvent, updateEvent, deleteEvent, listPairs, createPair, updatePair, setPairFavorite, deletePair, candidates, cycles, project }

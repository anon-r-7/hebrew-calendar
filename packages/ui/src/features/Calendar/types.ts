export interface EventDetails {
  uuid: string
  name: string
  short_name: string
}

export interface Event {
  uuid
  event: EventDetails
}

export interface Date {
  uuid: string
  gregorian: string
  day_of_week: string
  day_index: number
  month_index: number
  dd: number
  mm: number
  yy: number
  events?: Event[]
  // days-from / new-moons-from results
  days_from_day_index?: number
  new_moons_from_month_index?: number
}

// what a tool counts in: days (day_index) or new moons (month_index)
export type Unit = 'days' | 'new_moons'

// days-between-dates?detail=true
export interface BetweenResult {
  unit: Unit
  diff: number
  days: number
  new_moons: number
  new_moons_fraction: number
  years_civil: number
  include_first_day: boolean
  start: Pick<Date, 'gregorian' | 'day_of_week' | 'day_index' | 'month_index' | 'yy' | 'mm' | 'dd'>
  end: Pick<Date, 'gregorian' | 'day_of_week' | 'day_index' | 'month_index' | 'yy' | 'mm' | 'dd'>
}

export interface InitialState {
  dates: Date[]
  type?: string
  unit?: Unit
  result?: BetweenResult
  // new-moons-from: set when the target month has no such day and nearest days are shown instead
  message?: string | null
}

export interface Meta {
  count: {
    total: number
    current: number
  }
  page: {
    current: number
    next: number | null
    prev: number | null
    limit: number
  }
}

export interface Pair {
  events_pairs_uuid: string
  favorite: boolean
  calculations: {
    diff: number
    half_days: number
    weeks: number
    revelation_years: number
    enochian_years: number
  }
  isExact: {
    weeks: boolean
    revelation_years: boolean
    enochian_years: boolean
  }
  dates: Array<{
    name: string
    description: string
    source: 'user' | 'system'
    day_index: number
    day_of_week: string
    gregorian: {
      formatted: string
      yy: string
      mm: string
      dd: string
      era: string
    }
    hebrew: {
      formatted: string
      yy: string
      mm: string
      dd: string
    }
    user?: {
      events_entry_uuid: string
      description: string
      tags: string
      created_by: {
        uuid: string
        first_name: string
        last_name: string
      }
    }
    system?: {
      hebrew_event_dates_uuid: string
      hebrew_dates_uuid: string
      hebrew_events_uuid: string
      event_day: string
      short_name: string
    }
  }>
}

interface FilterMeta {
  uuid: string
  name: string
}

export interface InitialState {
  syncing: {
    syncing: boolean
    start: Date | null
    estimatedEnd: Date | null
    estimatedRemaining: number | null
    lastRunTime: number | null
    averageRunTime: number | null
  }
  pairs: Pair[]
  meta: Meta
  filterMeta: {
    events: FilterMeta[]
    users: FilterMeta[]
    entries: FilterMeta[]
  }
}

// Event Entries
export interface CreateEntry {
  type: 'gregorian' | 'hebrew'
  date: string // e.g. '2025-10-03'
  name: string
  description?: string
  tags?: string // comma-separated
}

export interface UpdateEntry {
  name?: string
  description?: string
  tags?: string
}

export interface GetEntries {
  page?: number
  size?: number
  created_by?: string
}

// Event Pairs
export interface UpdatePair {
  favorite?: boolean
}

export interface GetPairsParams {
  page?: number
  limit?: number
  order?: 'diff' | 'diff_desc' | 'gregorian' | 'gregorian_desc'
  events_pairs_uuid?: string
  favorite?: boolean
  weeks?: string
  revelation_years?: string
  enochian_years?: string
  exact_weeks?: boolean
  exact_rev_years?: boolean
  exact_enoch_years?: boolean
  events_entry_uuid?: string
  hebrew_events_uuid?: string
  created_by_uuid?: string
  gregorian_source?: string // Required if using any gregorian param
  gregorian?: string // '0076-06-10 BC'
  gregorian_from?: string // '0076-06-10 BC'
  gregorian_to?: string // '0076-06-12 BC'
  gregorian_before?: string // '0076-06-12 BC'
  gregorian_after?: string // '0076-06-12 BC'
  exclude_before_feasts?: boolean
  exclude_after_feasts?: boolean
  require_user_source?: boolean
  tags?: string // comma-separated
  name?: string
}

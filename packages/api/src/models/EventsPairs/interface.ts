export interface EventPairsParams {
  // Page Size
  page?: string | number
  limit?: string | number

  // Order
  order?: 'diff' | 'diff_desc' | 'gregorian' | 'gregorian_desc'

  // Event Pair Props
  events_pairs_uuid?: string
  favorite?: string
  exact_rev_years?: string
  exact_enoch_years?: string
  exact_weeks?: string
  enochian_years?: string | number
  revelation_years?: string | number
  weeks?: string | number

  // Date Props
  name?: string
  tags?: string
  gregorian_source?: 'user' | 'system'
  gregorian?: string
  gregorian_from?: string
  gregorian_to?: string
  gregorian_before?: string
  gregorian_after?: string
  events_entry_uuid?: string
  hebrew_events_uuid?: string
  created_by_uuid?: string
  exclude_before_feasts?: string
  exclude_after_feasts?: string
}

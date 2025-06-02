export interface HebrewDate {
  uuid: string
  gregorian: Date
  day_of_week: string
  day_index: number
  dd: number
  mm: number
  yy: number
}

export interface Entry {
  uuid: string
  date: string
  type: 'gregorian' | 'hebrew'
  name: string
  description: string
  tags: string
  hebrew_date: HebrewDate
  day_index: number
  processed: boolean
  created_by: string
}

export interface InitialState {
  entries: Entry[]
}

export interface User {
  uuid: string
  first_name: string
  last_name: string
}

export interface Entry {
  uuid: string
  date: string
  type: 'gregorian' | 'hebrew'
  name: string
  description: string
  tags: string
  hebrew_date: {
    gregorian: string
    hebrew: string
  }
  day_index: number
  processed: boolean
  created_by: {
    uuid: string
    first_name: string
    last_name: string
  }
}

export interface InitialState {
  users: User[]
  entries: Entry[]
  total: number
}

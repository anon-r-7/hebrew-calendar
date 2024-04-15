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
  dd: number
  mm: number
  yy: number
  events?: Event[]
}

export interface InitialState {
  dates: Date[]
}


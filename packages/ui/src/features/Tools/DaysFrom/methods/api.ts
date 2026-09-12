import api from '@ui/api/dates'
import type { Unit } from '@ui/features/Calendar/types'

interface Payload {
  category: string
  type: type
  unit: Unit
  era: string
  event: string
  start: string
  buffer: number
  days: number
  include_first_day: boolean
  direction: 'future' | 'past'
}

interface Data {
  payload: Payload
  asyncManager: any
  store: any
}

export const getDaysFromDate = async ({
  payload,
  asyncManager,
  store
}: Data) => {
  try {
    asyncManager.start()
    // new moons never use a buffer: one date, or a message with the nearest days
    const request =
      payload.unit === 'new_moons' ? { ...payload, buffer: 0 } : payload
    const response = await api.getDaysFromDate(request)
    asyncManager.success()
    // days-from answers with an array; new-moons-from with { message, dates }
    const dates = Array.isArray(response) ? response : response.dates
    const message = Array.isArray(response) ? null : response.message
    store.update({ dates, message, type: payload.type, unit: payload.unit })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

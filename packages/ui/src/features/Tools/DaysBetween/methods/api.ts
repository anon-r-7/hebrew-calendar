import api from '@ui/api/dates'
import type { Unit } from '@ui/features/Calendar/types'

interface Payload {
  type: type
  unit: Unit
  start: string
  end: string
  era_start: string
  era_end: string
  include_first_day: boolean
}

interface Data {
  payload: Payload
  asyncManager: any
  store: any
}

export const getDaysBetweenDates = async ({
  payload,
  asyncManager,
  store
}: Data) => {
  try {
    asyncManager.start()
    // detail=true: the number in the chosen unit plus everything the breakdown table needs
    const result = await api.getDaysBetweenDates({ ...payload, detail: true })
    // an API that predates detail= answers with the bare number; fail cleanly, don't crash the page
    if (typeof result !== 'object' || result === null || typeof result.diff !== 'number')
      throw new Error('days-between-dates did not return a detail object')
    asyncManager.success()
    store.update({ result, type: payload.type })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

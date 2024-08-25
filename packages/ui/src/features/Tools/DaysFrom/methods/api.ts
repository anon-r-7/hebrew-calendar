import api from '@ui/api/dates'

interface Payload {
  category: string
  type: type
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
    const dates = await api.getDaysFromDate(payload)
    asyncManager.success()
    store.update({ dates, type: payload.type })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

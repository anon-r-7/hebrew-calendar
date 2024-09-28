import api from '@ui/api/dates'

interface Payload {
  type: type
  start: string
  end: string
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
    const diff = await api.getDaysBetweenDates(payload)
    asyncManager.success()
    store.update({ diff, type: payload.type })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

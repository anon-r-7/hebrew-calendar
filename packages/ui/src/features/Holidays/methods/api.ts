import api from '@ui/api/dates'

interface Payload {
  year: string
  type: type
}

interface Data {
  payload: Payload
  asyncManager: any
  store: any
}

export const getHolidays = async ({ payload, asyncManager, store }: Data) => {
  try {
    asyncManager.start()
    const dates = await api.getHolidays(payload)
    asyncManager.success()
    store.update({ dates })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

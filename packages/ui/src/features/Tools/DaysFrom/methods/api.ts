import api from '@ui/api/dates'

interface Payload {
  start: string
  days: number
  type: type
  buffer: number
}

interface Data {
  payload: Payload
  asyncManager: any
  store: any
}

export const getDateDiff = async ({ payload, asyncManager, store }: Data) => {
  try {
    asyncManager.start()
    const dates = await api.get(payload)
    asyncManager.success()
    store.update({ dates, type: payload.type })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

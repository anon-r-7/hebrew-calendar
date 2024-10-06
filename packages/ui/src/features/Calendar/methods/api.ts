import api from '@ui/api/dates'

interface Payload {
  start: string
  end: string
  era: string
  type: string
  with_events: boolean
}

const payloadDefault: Payload = {
  start: '',
  end: '',
  era: '',
  type: 'gregorian',
  with_events: true,
  with_astronomy: false
}

export const getDates = async ({ payload, asyncManager, store }) => {
  try {
    asyncManager.start()
    const dates = await api.get({ ...payloadDefault, ...payload })
    asyncManager.success()
    store.update({ dates, type: payload.type })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

import api from '@ui/api/dates'

interface Payload {
  start: string
  end: string
  type: string
  with_events: boolean
}

const payloadDefault = {
  start: '',
  end: '',
  type: 'gregorian',
  with_events: true
}

export const getDates = async ({ payload, asyncManager, store }) => {
  try {
    asyncManager.start()
    const dates = await api.get({ ...payloadDefault, ...payload })
    asyncManager.success()
    store.update({ dates })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting dates. Please try again.`
    )
  }
}

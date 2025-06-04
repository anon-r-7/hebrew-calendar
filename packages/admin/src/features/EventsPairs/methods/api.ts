import api from '@admin/api/events'

export const getFilterMeta = async ({ asyncManager, store }) => {
  try {
    asyncManager.start()
    const { events, users, entries } = await api.getFilterMeta()
    store.update({
      filterMeta: {
        events: events ?? [],
        users: users ?? [],
        entries: entries ?? []
      }
    })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting filter meta. Please try again.`
    )
  }
}

export const getPairs = async ({ payload, asyncManager, store }) => {
  try {
    asyncManager.start()
    const { rows, meta } = await api.getPairs(payload)
    store.update({ pairs: rows, meta })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting pairs. Please try again.`
    )
  }
}

export const updatePair = async ({
  events_pairs_uuid,
  payload,
  asyncManager,
  store
}) => {
  try {
    asyncManager.start()
    const pair = await api.updatePair(events_pairs_uuid, payload)

    if (pair?.uuid) {
      const next = store.state.pairs
      const index = next.findIndex((row) => row.events_pairs_uuid === pair.uuid)
      if (index > -1) {
        next[index] = { ...next[index], favorite: pair.favorite }
        store.update({ pairs: next })
      }
    }

    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem udpating pairs. Please try again.`
    )
  }
}

export const getSync = async ({ asyncManager, store }) => {
  try {
    asyncManager.start()
    const { syncing } = await api.getSync()
    store.update({ syncing })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem posting sync. Please try again.`
    )
  }
}

export const postSync = async ({ asyncManager, store }) => {
  try {
    asyncManager.start()
    const { syncing } = await api.postSync()
    store.update({ syncing })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem posting sync. Please try again.`
    )
  }
}

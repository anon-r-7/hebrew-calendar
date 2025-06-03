import api from '@admin/api/events'

export const getUsers = async ({ asyncManager, store }) => {
  try {
    asyncManager.start()
    const users = await api.getUsers()
    store.update({ users })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting users. Please try again.`
    )
  }
}

export const getEntries = async ({ payload, asyncManager, store }) => {
  try {
    asyncManager.start()
    const { entries, total } = await api.getEntries(payload)
    store.update({ entries, total })
    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem getting entries. Please try again.`
    )
  }
}

export const createEntry = async ({ payload }) => {
  try {
    const entry = await api.createEntry(payload)
    return entry
  } catch (error) {
    return null
  }
}

export const updateEntry = async ({ uuid, payload, asyncManager, store }) => {
  try {
    asyncManager.start()
    const entry = await api.updateEntry(uuid, payload)

    if (entry?.uuid) {
      const next = store.state.entries
      const index = next.findIndex((row) => row.uuid === entry.uuid)
      if (index > -1) {
        next[index] = entry
        store.update({ entries: next })
      }
    }

    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem creating entry. Please try again.`
    )
  }
}

export const deleteEntry = async ({ uuid, asyncManager, store }) => {
  try {
    asyncManager.start()
    const response = await api.deleteEntry(uuid)
    if (response?.success) {
      const next = [...store.state.entries] // make a shallow copy
      const index = next.findIndex((row) => row.uuid === uuid)
      if (index > -1) {
        next.splice(index, 1)
        store.update({ entries: next })
      }
    }

    asyncManager.success()
  } catch (error) {
    asyncManager.fail(
      `Hmm, there was a problem deleting the entry. Please try again.`
    )
  }
}

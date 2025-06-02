import React, { useEffect, useState, useCallback } from 'react'
import { useStore } from '@admin/hooks/useStore'
import { useAsyncManager } from '@admin/hooks/useAsyncManager'

import { Loading } from '@admin/components/Loading'
import { getDateFromParts } from '@admin/utils/date'

import { InitialState } from './types'
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry
} from './methods/api'

const initialState: InitialState = {
  entries: []
}

const defaultCreateOptions = {
  type: 'gregorian',
  yy: '',
  mm: '',
  dd: '',
  era: 'AD',
  name: '',
  description: '',
  tags: ''
}

const defaultUpdateOptions = {
  name: null,
  description: null,
  tags: null
}

const defaultGetOptions = {
  // todo
}

export const EventsEntry = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()

  const [createOptions, setCreateOptions] = useState(defaultCreateOptions)
  const [updateOptions, setUpdateOptions] = useState(defaultUpdateOptions)
  const [getOptions, setGetOptions] = useState(defaultGetOptions)

  const fetch = useCallback(() => {
    getEntries({
      asyncManager,
      store,
      payload: {
        ...getOptions
      }
    })
  }, [getOptions])

  useEffect(() => {
    fetch()
  }, [])

  const onCreate = async () => {
    const date = getDateFromParts(createOptions)
    await createEntry({
      asyncManager,
      store,
      payload: {
        date,
        type: createOptions.type,
        name: createOptions.name,
        description: createOptions.description,
        tags: createOptions.tags
      }
    })
    setCreateOptions(defaultCreateOptions)
  }

  const onUpdate = async (uuid) => {
    await updateEntry({
      asyncManager,
      store,
      uuid,
      payload: {
        name: updateOptions.name !== null ? updateOptions.name : null,
        description:
          updateOptions.description !== null ? updateOptions.description : null,
        tags: updateOptions.tags !== null ? updateOptions.tags : null
      }
    })
    setUpdateOptions(defaultUpdateOptions)
  }

  const onDelete = async (uuid) => {
    await deleteEntry({
      asyncManager,
      store,
      uuid
    })
    setUpdateOptions(defaultUpdateOptions)
  }

  return (
    <>
      <Loading loading={asyncManager.loading} />
      <div>{/* TODO: should be a table showing entries. */}</div>
    </>
  )
}

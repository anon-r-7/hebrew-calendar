import React, { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { useStore } from '@ui/hooks/useStore'
import { useAsyncManager } from '@ui/hooks/useAsyncManager'
import { getCurrentMonthFirstIso, getMonthRange } from '@ui/utils/date'

import { CalendarGrid } from '@ui/components/CalendarGrid'

import { InitialState } from './types'
import { getDates } from './methods/api'
import { DateControls } from './components/DateControls'

const initialState: InitialState = { dates: [] }

const defaultApiControls = {
  start: getCurrentMonthFirstIso(),
  type: 'gregorian',
  with_events: true
}

export const Calendar = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()
  const [apiControls, setApiControls] = useState(defaultApiControls)
  const [reload, setReload] = useState(false)

  const parseQueryParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const [year, month] = (
      searchParams.get('start') || defaultApiControls.start
    ).split('-')

    return {
      start: `${year}-${month}-01`,
      type: searchParams.get('type') || defaultApiControls.type,
      with_events:
        searchParams.get('with_events') === 'false'
          ? false
          : defaultApiControls.with_events
    }
  }

  useEffect(() => {
    if (reload) onSubmit()
  }, [reload])

  useEffect(() => {
    const updateApiControls = () => {
      const params = parseQueryParams()
      setApiControls(params)
      setReload(true)
    }

    updateApiControls()

    window.addEventListener('popstate', updateApiControls)

    return () => {
      window.removeEventListener('popstate', updateApiControls)
    }
  }, [])

  const onSubmit = () => {
    const [start, end] = getMonthRange(apiControls.start)

    getDates({
      asyncManager,
      store,
      payload: {
        ...apiControls,
        start,
        end
      }
    })
  }

  return (
    <Box w="100vw" minH="100vh" p={0} m={0}>
      <DateControls
        apiControls={apiControls}
        setApiControls={setApiControls}
        onSubmit={onSubmit}
      />
      <CalendarGrid dates={store.state.dates} />
    </Box>
  )
}

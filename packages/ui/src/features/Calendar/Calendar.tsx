import React, { useEffect, useState } from 'react'
import { Flex, Box, Heading, useTheme } from '@chakra-ui/react'
import { useStore } from '@ui/hooks/useStore'
import { useAsyncManager } from '@ui/hooks/useAsyncManager'
import { getCurrentMonthFirstIso, getMonthRange, months } from '@ui/utils/date'

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
  const theme = useTheme()

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

  const [primaryYear, monthIndex] = apiControls.start.split('-')
  const monthName = months[parseFloat(monthIndex) - 1]

  return (
    <Box w="100vw" minH="100vh" p={0} m={0}>
      <Flex direction="column" align="center" justify="center">
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          p={{ base: 2, md: 4 }}
          w="full"
          maxW={{ base: "100%", md: theme.sizes.container.xl }}
        >
          <Heading size={{ base: "md", md: "lg" }} fontWeight="700" color="brand.light">
            {monthName}, {primaryYear} AD
          </Heading>
          <Box style={{ marginTop: 12 }}>
            <DateControls
              apiControls={apiControls}
              setApiControls={setApiControls}
              onSubmit={onSubmit}
            />
          </Box>
        </Flex>
      </Flex>
      <CalendarGrid dates={store.state.dates} />
    </Box>
  )
}

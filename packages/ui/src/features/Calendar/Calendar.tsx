import React, { useEffect, useState } from 'react'
import { Flex, Box, Heading, Text, useTheme } from '@chakra-ui/react'
import { useStore } from '@ui/hooks/useStore'
import { useAsyncManager } from '@ui/hooks/useAsyncManager'
import {
  getCurrentMonthFirstIso,
  getMonthRangeGregorian,
  getMonthRangeHebrew,
  months
} from '@ui/utils/date'

import { CalendarGrid } from '@ui/components/CalendarGrid'
import { Loading } from '@ui/components/Loading'

import { InitialState } from './types'
import { getDates } from './methods/api'
import { DateControls } from './components/DateControls'

const initialState: InitialState = { dates: [], type: 'gregorian' }

const defaultApiControls = {
  start: getCurrentMonthFirstIso(),
  type: 'gregorian',
  with_events: true,
  with_astronomy: 'false'
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
          : defaultApiControls.with_events,
      with_astronomy:
        searchParams.get('with_events') === 'true'
          ? 'true'
          : defaultApiControls.with_astronomy
    }
  }

  useEffect(() => {
    if (reload) onSubmit()
  }, [reload])

  useEffect(() => {
    const [yy, mm] = apiControls.start.split('-')
    const diff = 3760

    const yyN = parseFloat(yy)

    if (apiControls.type === 'gregorian' && yyN >= 1 && yyN <= 2075) {
      // do nothing
    } else if (apiControls.type === 'hebrew' && yyN >= 3762 && yyN <= 5836) {
      // do nothing
    } else {
      const updatedYear =
        apiControls.type === 'gregorian' ? yyN - diff : yyN + diff

      setApiControls({
        ...apiControls,
        start: `${updatedYear}-${mm}-01`
      })
    }
  }, [apiControls.type])

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
    const [start, end] =
      apiControls.type === 'gregorian'
        ? getMonthRangeGregorian(apiControls.start)
        : getMonthRangeHebrew(apiControls.start)

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

  const heading =
    apiControls.type === 'gregorian'
      ? `${monthName}, ${primaryYear} AD`
      : `Month ${parseFloat(monthIndex)}, ${primaryYear} Hebrew`

  return (
    <>
      <Loading loading={asyncManager.loading} />
      <Box w="100%" minH="100%" p={0} m={0}>
        <Flex direction="column" align="center" justify="center">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            pt={4}
            pb={{ base: 2, md: 4 }}
            w="full"
            maxW={{ base: '100%', md: theme.sizes.container.xl }}>
            <Heading
              size={{ base: 'md', md: 'lg' }}
              fontWeight="700"
              color="brand.light">
              {heading}
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

        <CalendarGrid dates={store.state.dates} type={store.state.type} />

        <Flex direction="column" align="center" justify="center">
          <Flex
            direction={{ base: 'row', md: 'row' }}
            justify="space-around"
            align="center"
            m={12}
            w="full"
            maxW={{ base: 200 }}>
            <a href="/calendar">
              <Text fontSize="md" color="brand.light">
                Calendar
              </Text>
            </a>
            <a href="/tools">
              <Text fontSize="md" color="brand.grey">
                Tools
              </Text>
            </a>
          </Flex>
        </Flex>
      </Box>
    </>
  )
}

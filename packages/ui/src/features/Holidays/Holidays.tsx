import React, { useState, useEffect } from 'react'
import {
  Flex,
  Box,
  Heading,
  Text,
  useBreakpointValue,
  useTheme
} from '@chakra-ui/react'

import { useStore } from '@ui/hooks/useStore'
import { useAsyncManager } from '@ui/hooks/useAsyncManager'

import { InitialState } from 'features/Calendar/types'

const initialState: InitialState = { dates: [] }

const defaultApiControls = {
  year: new Date().getFullYear(),
  type: 'gregorian'
}

import { DateControls } from './components/DateControls'
import { List } from './components/List'
import { getHolidays } from './methods/api'

export const Holidays = () => {
  const theme = useTheme()
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()

  const [apiControls, setApiControls] = useState(defaultApiControls)

  const onSubmit = () => {
    getHolidays({
      asyncManager,
      store,
      payload: apiControls
    })
  }

  useEffect(() => {
    onSubmit()
  }, [])

  const padding = useBreakpointValue({ base: '4', md: '0' })

  return (
    <Box w="100%" minH="100%" p={0} m={0}>
      {/* controls share the table's column so they line up with its left edge */}
      <Flex direction="row" justify="center" pl={padding} pr={padding}>
        <Box w="full" maxW={{ base: '100%', md: theme.sizes.container.xl }}>
          <DateControls
            apiControls={apiControls}
            setApiControls={setApiControls}
            onSubmit={onSubmit}
          />
        </Box>
      </Flex>
      <List store={store} />
    </Box>
  )
}

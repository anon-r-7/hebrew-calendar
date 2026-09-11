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
      <Flex
        direction="row"
        align="center"
        justify="center"
        pl={padding}
        pr={padding}>
        <Flex
          direction={{ base: 'row', md: 'row' }}
          justify="space-between"
          align="center"
          pt={4}
          pb={{ base: 2, md: 4 }}
          w="full"
          maxW={{ base: '100%', md: theme.sizes.container.xl }}>
          <Heading
            size={{ base: 'md', md: 'lg' }}
            fontWeight="600"
            color="brand.text">
            Holidays
          </Heading>
        </Flex>
      </Flex>

      <DateControls
        apiControls={apiControls}
        setApiControls={setApiControls}
        onSubmit={onSubmit}
      />
      <List store={store} />
    </Box>
  )
}

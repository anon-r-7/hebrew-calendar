import React, { useEffect, useState } from 'react'
import {
  Flex,
  Box,
  Heading,
  Text,
  FormControl,
  Button,
  useBreakpointValue,
  useTheme
} from '@chakra-ui/react'
import { useStore } from '@ui/hooks/useStore'
import { useAsyncManager } from '@ui/hooks/useAsyncManager'

import { InitialState } from 'features/Calendar/types'
import { getDateDiff } from './methods/api'
import { DateControls } from './components/DateControls'
import { OptionControls } from './components/OptionControls'

const initialState: InitialState = { dates: [], type: 'gregorian' }

const getDate = () => {
  const dt = new Date()
  return dt.toISOString().split('T')[0]
}

const defaultApiControls = {
  start: getDate(),
  type: 'gregorian',
  buffer: 3,
  days: 10
}

export const Tools = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()
  const theme = useTheme()

  const [apiControls, setApiControls] = useState(defaultApiControls)

  const onSubmit = () => {
    getDateDiff({
      asyncManager,
      store,
      payload: apiControls
    })
  }

  useEffect(() => {
    const [yy, mm, dd] = apiControls.start.split('-')
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
        start: `${updatedYear}-${mm}-${dd}`
      })
    }
  }, [apiControls.type])

  // {store.state.dates} type={store.state.type}

  const buttonSize = useBreakpointValue({ base: 'lg', md: 'sm' })
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
            fontWeight="700"
            color="brand.light">
            Tools
          </Heading>
        </Flex>
      </Flex>

      <Flex direction="row" justify="center" background="white">
        <Flex
          direction={{ base: 'column', md: 'column' }}
          pt={12}
          pb={12}
          pl={padding}
          pr={padding}
          w="full"
          maxW={{ base: '100%', md: theme.sizes.container.xl }}>
          <Heading
            size={{ base: 'sm', md: 'md' }}
            mb={2}
            fontWeight="700"
            color="brand.primary">
            Distance between Days
          </Heading>

          <Box mt={4}>
            <DateControls
              apiControls={apiControls}
              setApiControls={setApiControls}
            />
          </Box>

          <Box mt={4}>
            <OptionControls
              apiControls={apiControls}
              setApiControls={setApiControls}
            />
          </Box>

          <FormControl>
            <Button
              size={buttonSize}
              onClick={onSubmit}
              mt={{ base: 0.25, md: 6 }}
              mr={2}
              bg="brand.primary"
              fontWeight="500"
              fontFamily="HubotSans"
              borderRadius="0"
              color="white"
              mb={2}
              sx={{
                ':hover': {
                  bg: 'brand.accent' // Use Chakra's color tokens or any CSS color
                }
              }}>
              Search
            </Button>
          </FormControl>
        </Flex>
      </Flex>

      <Flex direction="column" align="center" justify="center">
        <Flex
          direction={{ base: 'row', md: 'row' }}
          justify="space-around"
          align="center"
          m={12}
          w="full"
          maxW={{ base: 200 }}>
          <a href="/calendar">
            <Text fontSize="md" color="brand.grey">
              Calendar
            </Text>
          </a>
          <a href="/tools">
            <Text fontSize="md" color="brand.light">
              Tools
            </Text>
          </a>
        </Flex>
      </Flex>
    </Box>
  )
}

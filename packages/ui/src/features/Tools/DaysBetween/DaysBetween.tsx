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
import { getDaysBetweenDates } from './methods/api'

import { DateControls } from './components/DateControls'
import { AdvancedOptionsControls } from './components/AdvancedOptionsControls'

const initialState: InitialState = { dates: [], type: 'gregorian' }

const getDate = () => {
  const dt = new Date()
  return dt.toISOString().split('T')[0]
}

const defaultApiControls = {
  type: 'gregorian',
  start: getDate(),
  end: getDate(),
  include_first_day: false
}

export const DaysBetween = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()
  const theme = useTheme()

  const [apiControls, setApiControls] = useState(defaultApiControls)

  const onSubmit = () => {
    getDaysBetweenDates({
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

  const buttonSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const padding = useBreakpointValue({ base: '4', md: '0' })
  const buttonWidth = useBreakpointValue({ base: '97%', md: '140px' })

  return (
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
          Days Between Dates
        </Heading>

        <Box mt={4}>
          <DateControls
            apiControls={apiControls}
            setApiControls={setApiControls}
          />
        </Box>

        <Box mt={4}>
          <AdvancedOptionsControls
            apiControls={apiControls}
            setApiControls={setApiControls}
          />
        </Box>

        <FormControl>
          <Button
            size={buttonSize}
            onClick={onSubmit}
            w={buttonWidth}
            mt={{ base: 6, md: 6 }}
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

        {store.state.diff ? <Text>{store.state.diff} days between</Text> : null}
      </Flex>
    </Flex>
  )
}

import React, { useEffect, useState } from 'react'
import {
  Flex,
  Box,
  Grid,
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
import { getDaysFromDate } from './methods/api'
import { DateControls } from './components/DateControls'
import { OptionControls } from './components/OptionControls'

const initialState: InitialState = { dates: [], type: 'gregorian' }

const getDate = () => {
  const dt = new Date()
  return dt.toISOString().split('T')[0]
}

const defaultApiControls = {
  category: 'date', // 'date', 'event'
  type: 'gregorian',
  event: 'pesach',
  start: getDate(),
  buffer: 3,
  days: 10
}

export const DaysFrom = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()
  const theme = useTheme()

  const [apiControls, setApiControls] = useState(defaultApiControls)

  const onSubmit = () => {
    getDaysFromDate({
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

  // Move this hook outside of tableRow
  const isMobile = useBreakpointValue({ base: true, md: false })

  const tableRow = ([one, two, three, four, five], key, header, labels) => {
    const backgroundColor = key % 2 === 0 ? '#f0f0f0' : 'white'

    return (
      <Grid
        templateColumns={{ base: '1fr', md: '100px 125px 125px 125px 40%' }}
        gap={4}
        pt={4}
        pb={4}
        pl={8}
        pr={8}
        background={backgroundColor}
        key={key}
        w="100%">
        <Box>
          {isMobile && <Text fontWeight="bold">{labels[0]}:</Text>}
          <Text textAlign={'center'} fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {one}
          </Text>
        </Box>
        <Box>
          {isMobile && <Text fontWeight="bold">{labels[1]}:</Text>}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {two}
          </Text>
        </Box>
        <Box>
          {isMobile && <Text fontWeight="bold">{labels[2]}:</Text>}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {three}
          </Text>
        </Box>
        <Box>
          {isMobile && <Text fontWeight="bold">{labels[3]}:</Text>}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {four}
          </Text>
        </Box>
        {five?.length ? (
          <Box>
            {isMobile && <Text fontWeight="bold">{labels[4]}:</Text>}
            <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
              {five}
            </Text>
          </Box>
        ) : null}
      </Grid>
    )
  }

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
          Days From Date
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

        {store.state.dates.length ? (
          <Box mt={4}>
            {!isMobile &&
              tableRow(
                ['Days From', 'Gregorian', 'Hebrew', 'Day', 'Events'],
                'header',
                true,
                ['Days From', 'Gregorian', 'Hebrew', 'Day', 'Events']
              )}
            {store.state.dates.map(
              (
                {
                  days_from_day_index,
                  gregorian,
                  yy,
                  mm,
                  dd,
                  day_of_week,
                  events
                },
                key
              ) => {
                const columns = [
                  days_from_day_index,
                  gregorian,
                  `${yy}-${mm}-${dd}`,
                  day_of_week,
                  events.map((event) => event.event.name).join(', ')
                ]
                return tableRow(columns, key, false, [
                  'Days From',
                  'Gregorian',
                  'Hebrew',
                  'Day',
                  'Events'
                ])
              }
            )}
          </Box>
        ) : null}
      </Flex>
    </Flex>
  )
}

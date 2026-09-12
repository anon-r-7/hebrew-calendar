import React, { useState } from 'react'
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
import { AdvancedOptionsControls } from './components/AdvancedOptionsControls'

const initialState: InitialState = { dates: [], type: 'gregorian' }

const getDate = () => {
  const dt = new Date()
  return dt.toISOString().split('T')[0]
}

const defaultApiControls = {
  category: 'date', // 'date', 'event'
  type: 'gregorian',
  unit: 'days', // 'days' | 'new_moons'
  event: 'pesach',
  start: getDate(),
  era: 'ad',
  buffer: 0,
  days: 10,
  include_first_day: true,
  direction: 'future'
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

  const buttonSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const padding = useBreakpointValue({ base: '4', md: '0' })
  const buttonWidth = useBreakpointValue({ base: '97%', md: '140px' })

  // Move this hook outside of tableRow
  const isMobile = useBreakpointValue({ base: true, md: false })

  // the unit of the search whose results are showing (not the control's current value)
  const resultUnit = store.state.unit === 'new_moons' ? 'new_moons' : 'days'
  const fromLabel = resultUnit === 'new_moons' ? 'New Moons From' : 'Days From'
  const columnLabels = [fromLabel, 'Gregorian', 'Hebrew', 'Day', 'Events']

  const tableRow = (cells, key, header, labels) => (
    <Grid
      key={key}
      templateColumns={{ base: '1fr', md: '100px 125px 125px 125px 40%' }}
      gap={4}
      px={{ base: 4, md: 8 }}
      py={header ? 3 : 3.5}
      w="100%"
      bg={
        header
          ? 'brand.backgroundAlt'
          : key % 2 === 0
          ? 'transparent'
          : 'brand.surface'
      }
      borderBottom="1px solid"
      borderColor={header ? 'brand.primary' : 'brand.borderMuted'}
      transition="background .12s ease"
      _hover={header ? undefined : { bg: 'brand.backgroundAlt' }}>
      {cells.map((cell, i) =>
        i === 4 && !String(cell || '').length ? null : (
          <Box key={i}>
            {isMobile && (
              <Text
                fontSize="10px"
                fontWeight="600"
                letterSpacing="0.06em"
                textTransform="uppercase"
                color="brand.gray"
                mb={0.5}>
                {labels[i]}
              </Text>
            )}
            <Text
              fontSize={header ? '11px' : '14px'}
              fontWeight={header ? '600' : i === 0 ? '500' : '400'}
              letterSpacing={header ? '0.08em' : undefined}
              textTransform={header ? 'uppercase' : undefined}
              color={header ? 'brand.textSecondary' : 'brand.text'}
              className={!header && (i === 1 || i === 2) ? 'mono' : undefined}>
              {cell}
            </Text>
          </Box>
        )
      )}
    </Grid>
  )

  return (
    <Flex direction="row" justify="center" background="brand.background">
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
          {apiControls.unit === 'new_moons'
            ? 'New Moons From Date'
            : 'Days From Date'}
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
            borderRadius="md"
            color="brand.onPrimary"
            mb={2}
            sx={{
              ':hover': {
                bg: 'brand.primaryLight' // Use Chakra's color tokens or any CSS color
              }
            }}>
            Search
          </Button>
        </FormControl>

        {store.state.message ? (
          <Box
            mt={4}
            px={{ base: 4, md: 6 }}
            py={3}
            borderRadius="md"
            border="1px solid"
            borderColor="brand.feastBorder"
            bg="brand.feastBg"
            color="brand.feastText"
            fontSize="14px"
            fontWeight="500">
            {store.state.message}
          </Box>
        ) : null}

        {store.state.dates.length ? (
          <Box
            mt={4}
            borderRadius="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="brand.border"
            boxShadow="brand.base"
            bg="brand.surfaceRaised">
            {!isMobile &&
              tableRow(columnLabels, 'header', true, columnLabels)}
            {store.state.dates.map(
              (
                {
                  days_from_day_index,
                  new_moons_from_month_index,
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
                  resultUnit === 'new_moons'
                    ? new_moons_from_month_index
                    : days_from_day_index,
                  gregorian,
                  `${yy.toString().padStart(2, '0')}-${mm
                    .toString()
                    .padStart(2, '0')}-${dd.toString().padStart(2, '0')}`,
                  day_of_week,
                  events.map((event) => event.event.name).join(', ')
                ]
                return tableRow(columns, key, false, columnLabels)
              }
            )}
          </Box>
        ) : null}
      </Flex>
    </Flex>
  )
}

import React from 'react'
import { Box, Flex, Text, useTheme, useBreakpointValue } from '@chakra-ui/react'

import { daysOfWeek } from '@ui/utils/date'

const Day = ({ day, isPrimary }) => {
  if (!day) {
    return <Box h="100%" />
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [GnumMonth, GnumDay] = day.gregorian.split('-').slice(1)

  const primaryDate = `${GnumMonth}/${GnumDay}`

  return (
    <Box position="relative" w="full" p={{ base: 0.5, md: 1 }} height="100%">
      <Text
        fontFamily={isPrimary ? 'HubotSans' : 'HubotSans-Light'}
        fontWeight={isPrimary ? '500' : '300'}
        position="absolute"
        top="0"
        right="1"
        fontSize={'xs'}>
        {primaryDate}
      </Text>
    </Box>
  )
}

export const EmptyCalendar = ({ dates = [], type }) => {
  const theme = useTheme()

  const fullGrid = Array.from({ length: 5 }, () => Array(7).fill(null))

  const datesGrid = dates.map((date) => ({
    ...date,
    gregorian: `${date.yy}-${String(date.mm).padStart(2, '0')}-${String(
      date.dd
    ).padStart(2, '0')}`
  }))

  // Even if no dates, the calendar will render an empty grid.
  const primaryDate = dates.length ? datesGrid[0][type] : null

  return (
    <Flex direction="column" align="center" justify="center">
      <Flex justify="space-around" w="full" maxW={theme.sizes.container.xl}>
        {daysOfWeek.map((day, j) => (
          <Week day={day} theme={theme} key={j} />
        ))}
      </Flex>
      {fullGrid.map((week, i) => (
        <Flex
          key={i}
          justify="space-around"
          w="full"
          maxW={theme.sizes.container.xl}
          mb={0}>
          {week.map((day, j) => {
            return (
              <Box
                key={j}
                w="14.285%"
                h="150px"
                p={0}
                m={0}
                bg={day ? 'brand.light' : 'gray.100'}
                border="1px solid"
                borderColor="brand.dark"
                borderRadius={{ base: 'none', md: 'sm' }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                boxShadow={theme.shadows.brand.base}>
                <Day day={day} type={type} isPrimary={Boolean(primaryDate)} />
              </Box>
            )
          })}
        </Flex>
      ))}
    </Flex>
  )
}

const Week = ({ day, theme }) => {
  const dayDisplay = useBreakpointValue({
    base: day.slice(0, 3),
    md: day
  })

  return (
    <Box
      w="14%" // Fixed width for header cells
      h="24px" // Fixed height for header cells
      p={2}
      m={1}
      color="brand.light"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      boxShadow={theme.shadows.brand.base}>
      <Text fontSize="md" fontWeight="700">
        {dayDisplay}
      </Text>
    </Box>
  )
}

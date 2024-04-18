import React from 'react'
import { Box, Flex, Text, useTheme } from '@chakra-ui/react'
import { daysOfWeek } from '@ui/utils/date'

const isPrimaryMonth = (date, primaryDate) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dateYear, dateMonth] = date.split('-')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [primaryYear, primaryMonth] = primaryDate.split('-')
  return dateMonth === primaryMonth
}

const Day = ({ day, isPrimary }) => {
  if (!day) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [numYear, numMonth, numDay] = day.gregorian.split('-')
  const events = day.events.map((event) => event.event.name)

  return (
    <Box position="relative" w="full" p="2" height="100%">
      <Text
        fontFamily={isPrimary ? 'HubotSans' : 'HubotSans-Light'}
        fontWeight={isPrimary ? '500' : '300'}
        position="absolute"
        top="0"
        right="0"
        fontSize="xs">
        {numMonth}/{numDay}
      </Text>
      <Box mt="4">
        {events.map((event, k) => (
          <Box
            key={k}
            w="full"
            mt="1"
            p="1"
            fontVariantCaps="all-small-caps"
            fontWeight="500"
            fontFamily="HubotSans"
            fontSize="12"
            bg={isPrimary ? 'blue.700' : 'brand.lightBlue'}
            color="white"
            textAlign="center"
            borderRadius="md">
            {event}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export const CalendarGrid = ({ dates }) => {
  const theme = useTheme()

  if (!dates || !dates.length) return <div>No dates available</div>

  // Find the first "day 1" of the primary month
  const firstDayIndex = dates.findIndex((date) =>
    date.gregorian.endsWith('-01')
  )
  if (firstDayIndex === -1) return <div>Invalid date range provided.</div>

  // Get the start day of the week for the first day of the primary month
  const startingDay = daysOfWeek.indexOf(dates[firstDayIndex].day_of_week)

  // Determine the index of the last day of the primary month
  const nextMonthStartIndex = dates
    .slice(firstDayIndex)
    .findIndex((date, i) => i > 0 && date.gregorian.endsWith('-01'))
  const lastDayIndex =
    nextMonthStartIndex !== -1
      ? firstDayIndex + nextMonthStartIndex - 1
      : dates.length - 1

  // Initialize the grid with up to 6 rows initially
  let grid = Array.from({ length: 6 }, () => Array(7).fill(null))
  let currentWeek = 0 // Initialize week counter

  // Populate the grid starting from the first day of the primary month
  let index = firstDayIndex
  while (index < dates.length) {
    const date = dates[index]
    const dayIndex = daysOfWeek.indexOf(date.day_of_week) // Get the day index from the daysOfWeek array

    // Place the date object in the correct cell
    grid[currentWeek][dayIndex] = date

    // Check if we need to increment the week (i.e., start a new week row)
    if (dayIndex === 6 && index !== dates.length - 1) {
      currentWeek++
    }

    index++
  }

  // Fill in preceding days from the previous month if the primary month does not start on Sunday
  if (startingDay !== 0 && firstDayIndex > 0) {
    currentWeek = 0 // Reset to the first row
    for (
      let i = firstDayIndex - 1, col = startingDay - 1;
      i >= 0 && col >= 0;
      i--, col--
    ) {
      grid[currentWeek][col] = dates[i]
    }
  }

  // Check if the grid needs adjustment: remove the 6th row if unused
  if (
    grid[5] &&
    !grid[5].find((date) => date?.day_index === dates[lastDayIndex]?.day_index)
  ) {
    grid = grid.slice(0, 5)
  }

  const primaryDate = dates[firstDayIndex].gregorian

  return (
    <Flex direction="column" align="center" justify="center">
      <Flex justify="space-around" w="full" maxW={theme.sizes.container.xl}>
        {daysOfWeek.map((day, j) => (
          <Box
            key={j}
            w="14%"
            h="24px"
            p={2}
            m={1}
            color={'brand.light'}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            boxShadow={theme.shadows.brand.base}>
            <Text fontSize="md" fontWeight="700">
              {day}
            </Text>
          </Box>
        ))}
      </Flex>
      {grid.map((week, i) => (
        <Flex
          key={i}
          justify="space-around"
          w="full"
          maxW={theme.sizes.container.xl}>
          {week.map((day, j) => (
            <Box
              key={j}
              w="14%"
              h="150px"
              p={2}
              m={1}
              bg={
                isPrimaryMonth(day.gregorian, primaryDate)
                  ? 'brand.light'
                  : 'brand.grey'
              }
              border="1px solid"
              borderColor="brand.dark"
              borderRadius="md"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              boxShadow={day ? theme.shadows.brand.base : 'none'}>
              <Day
                day={day}
                isPrimary={isPrimaryMonth(day.gregorian, primaryDate)}
              />
            </Box>
          ))}
        </Flex>
      ))}
    </Flex>
  )
}

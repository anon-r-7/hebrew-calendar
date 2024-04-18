import React from 'react'
import {
  Box,
  Flex,
  Text,
  useTheme,
  useBreakpointValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useDisclosure
} from '@chakra-ui/react'

import { daysOfWeek } from '@ui/utils/date'

const isPrimaryMonth = (date, primaryDate) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dateYear, dateMonth] = date.split('-')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [primaryYear, primaryMonth] = primaryDate.split('-')
  return dateMonth === primaryMonth
}

const getEventDetails = (event) => {
  switch (event.short_name) {
    case 'shabbat':
      return {
        hebrew: 'שַׁבָּת',
        pronunciation: 'sha-baht',
        english: 'Sabbath',
        meaning: ''
      }
    case 'rosh_chodesh':
      return {
        hebrew: 'ראש חודש',
        pronunciation: 'rosh kho-desh',
        english: 'Head of the Month',
        meaning: ''
      }
    case 'pesach':
      return {
        hebrew: 'פסח',
        pronunciation: 'peh-sakh',
        english: 'Passover',
        meaning: ''
      }
    case 'matzot':
      return {
        hebrew: 'חג המצות',
        pronunciation: 'khag ha-mats-oht',
        english: 'Feast of Unleavened Bread',
        meaning: ''
      }
    case 'yom_bikkurim':
      return {
        hebrew: 'יום הביכורים',
        pronunciation: 'yom ha-bee-koo-reem',
        english: 'Day of Firstfruits',
        meaning: ''
      }
    case 'shavuot':
      return {
        hebrew: 'חג שבועות',
        pronunciation: 'khag sha-voo-ot',
        english: 'Chag Shavuot',
        meaning: ''
      }
    case 'yom_teruah':
      return {
        hebrew: 'יום תרועה',
        pronunciation: 'yom te-roo-ah',
        english: 'Day of Trumpets',
        meaning: ''
      }
    case 'yom_kippur':
      return {
        hebrew: 'יום כיפור',
        pronunciation: 'yom kee-poor',
        english: 'Day of Atonement',
        meaning: ''
      }
    case 'sukkot':
      return {
        hebrew: 'חג הסוכות',
        pronunciation: 'khag ha-soo-kot',
        english: 'Feast of Tabernacles',
        meaning: ''
      }
    case 'chanukkah':
      return {
        hebrew: 'חנוכה',
        pronunciation: 'kha-noo-kah',
        english: 'Festival of Lights',
        meaning: ''
      }
    case 'purim':
      return {
        hebrew: 'פורים',
        pronunciation: 'poo-reem',
        english: 'Lots',
        meaning: ''
      }
    case 'tisha_bav':
      return {
        hebrew: 'תשעה באב',
        pronunciation: 'tee-sha ba-av',
        english: '9th of Av',
        meaning: ''
      }
    default:
      return {}
  }
}

const Event = ({ event, day, isPrimary }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const eventName = useBreakpointValue({
    base: event.name.slice(0, 10),
    md: event.name
  })

  const eventDetails = getEventDetails(event)

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      _focus={{ outline: 'none' }}>
      <PopoverTrigger>
        <Box
          w="full"
          mt={1}
          p={1}
          fontWeight="500"
          fontFamily="HubotSans"
          fontSize={{ base: '10', md: '12' }}
          bg={isPrimary ? 'blue.700' : 'brand.lightBlue'}
          color="white"
          textAlign="center"
          borderRadius="md"
          cursor="pointer">
          {eventName}
        </Box>
      </PopoverTrigger>
      <PopoverContent
        _focus={{ outline: 'none' }}
        sx={{
          bg: 'white',
          borderColor: 'white', // Ensure this color is visible
          borderWidth: '0', // Adjusted to be visible
          boxShadow: 's', // Adding a shadow for emphasis
          outline: 'none'
        }}>
        <PopoverBody style={{ fontFamily: 'HubotSans' }}>
          <Text style={{ fontWeight: '700' }}>{event.name}</Text>
          <Text style={{ fontSize: 14 }}>
            <b>Hebrew Date:</b> {day.yy}-{day.mm}-{day.dd}
          </Text>
          <Text style={{ fontSize: 14 }}>
            <b>Gregorian Date:</b> {day.gregorian}
          </Text>
          <Text style={{ fontSize: 14 }}>
            <b>Hebrew:</b> {eventDetails.hebrew}
          </Text>
          <Text style={{ fontSize: 14 }}>
            <b>English:</b> {eventDetails.english}
          </Text>
          <Text style={{ fontSize: 14 }}>
            <b>Pronunciation:</b> {eventDetails.pronunciation}
          </Text>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

const Day = ({ day, isPrimary }) => {
  if (!day) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [numYear, numMonth, numDay] = day.gregorian.split('-')
  const events = day.events.map((event) => event.event)

  return (
    <Box position="relative" w="full" p={{ base: 0, md: 2 }} height="100%">
      <Text
        fontFamily={isPrimary ? 'HubotSans' : 'HubotSans-Light'}
        fontWeight={isPrimary ? '500' : '300'}
        position="absolute"
        top="0"
        right="0"
        fontSize={'xs'}>
        {numMonth}/{numDay}
      </Text>
      <Box mt={{ base: 5, md: 4 }}>
        {events.map((event, k) => (
          <Event event={event} day={day} isPrimary={isPrimary} key={k} />
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
          <Week day={day} theme={theme} key={j} />
        ))}
      </Flex>
      {grid.map((week, i) => (
        <Flex
          key={i}
          justify="space-around"
          w="full"
          maxW={theme.sizes.container.xl}
          mb={1} // Add margin bottom to each week row for spacing
        >
          {week.map((day, j) => (
            <Box
              key={j}
              w="14%" // Fixed width for day cells
              h="150px" // Fixed height for day cells
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

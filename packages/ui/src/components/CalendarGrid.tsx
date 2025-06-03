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
import { EmptyCalendar } from './EmptyCalendar'

const isPrimaryMonth = (date, primaryDate) => {
  if (!date) return false
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

const isDayOfRest = (day) => {
  let isRest = false

  day.events.map(({ event }) => {
    if (
      [
        'shabbat',
        'yom_bikkurim',
        'shavuot',
        'yom_teruah',
        'yom_kippur'
      ].includes(event.short_name)
    ) {
      isRest = true
    } else if (event.short_name === 'matzot') {
      if ([15, 21].includes(day.dd)) {
        isRest = true
      }
    } else if (event.short_name === 'sukkot') {
      if ([15, 22].includes(day.dd)) {
        isRest = true
      }
    }
  })
  return isRest
}

const Event = ({ event, datesGrid, day }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const eventName = useBreakpointValue({
    base: event.name.slice(0, 5) + '..',
    md: event.name
  })

  const eventDetails = getEventDetails(event)

  const prevDay = datesGrid.find(
    ({ day_index }) => Number(day_index) === Number(day.day_index) - 1
  )
  const nextDay = datesGrid.find(
    ({ day_index }) => Number(day_index) === Number(day.day_index) + 1
  )

  const hasEvent = (searchDay) => {
    if (!searchDay) return false
    if (!searchDay?.events) return false
    if (!searchDay?.events.length) return false

    return (
      searchDay.events.filter((row) => {
        return row.event.short_name === event.short_name
      }).length > 0
    )
  }

  const continueLeft = hasEvent(prevDay)
  const continueRight = hasEvent(nextDay)

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
          fontFamily="Fustat-Light"
          fontSize={{ base: '10', md: '12' }}
          bg={'brand.primary'}
          color="white"
          textAlign="center"
          borderTopLeftRadius={continueLeft ? 0 : 12}
          borderBottomLeftRadius={continueLeft ? 0 : 12}
          borderTopRightRadius={continueRight ? 0 : 12}
          borderBottomRightRadius={continueRight ? 0 : 12}
          marginLeft={continueLeft ? '-6px' : 0}
          marginRight={continueRight ? '-6px' : 0}
          width={continueLeft || continueRight ? 'var(--chakra-blur)' : ''}
          cursor="pointer">
          {eventName}
        </Box>
      </PopoverTrigger>
      <PopoverContent
        _focus={{ outline: 'none' }}
        sx={{
          display: isOpen ? 'flex' : 'none',
          bg: 'white',
          borderColor: 'white', // Ensure this color is visible
          borderWidth: '0', // Adjusted to be visible
          boxShadow: 's', // Adding a shadow for emphasis
          outline: 'none'
        }}>
        <PopoverBody style={{ fontFamily: 'Fustat-Regular' }}>
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

const Details = ({
  primaryDate,
  secondaryDate,
  primaryYear,
  secondaryYear,
  type,
  astronomy,
  theme
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const Astronomy = ({ parent, type, isHeader, hour, min, sec }) => {
    return (
      <Flex flexDirection="row">
        <Text
          style={{
            flex: 2,
            fontSize: 12,
            fontWeight: isHeader ? 700 : 300,
            color: isHeader ? theme.colors.brand.primaryLight : 'black'
          }}>
          {parent === 'Type' ? 'Type' : parent === 'sun' ? 'Solar' : 'Lunar'}
        </Text>
        <Text
          style={{
            flex: 3,
            fontSize: 12,
            fontWeight: isHeader ? 700 : 300,
            color: isHeader ? theme.colors.brand.primaryLight : 'black'
          }}>
          {type}
        </Text>
        <Text
          style={{
            flex: 2,
            fontSize: 12,
            fontWeight: isHeader ? 700 : 300,
            color: isHeader ? theme.colors.brand.primaryLight : 'black'
          }}>
          {isHeader
            ? 'Time'
            : `${String(hour).padStart(2, '0')}:${String(min).padStart(
                2,
                '0'
              )}:${String(sec).padStart(2, '0')}`}
        </Text>
      </Flex>
    )
  }

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      _focus={{ outline: 'none' }}>
      <PopoverTrigger>
        <Text
          fontFamily={isPrimary ? 'Fustat-Regular' : 'Fustat-Light'}
          fontWeight={isPrimary ? '500' : '300'}
          position="absolute"
          top="0"
          right="1"
          borderBottomWidth={1}
          borderBottomColor={'#ccc'}
          fontSize={'xs'}>
          {primaryDate}
        </Text>
      </PopoverTrigger>
      <PopoverContent
        _focus={{ outline: 'none' }}
        sx={{
          display: isOpen ? 'flex' : 'none',
          bg: 'white',
          borderColor: 'white', // Ensure this color is visible
          borderWidth: '0', // Adjusted to be visible
          boxShadow: 's', // Adding a shadow for emphasis
          outline: 'none'
        }}>
        <PopoverBody style={{ fontFamily: 'Fustat-Regular' }}>
          <Flex flexDirection="row" justifyContent={'space-between'}>
            <Text style={{ fontSize: 12, fontWeight: '300' }}>
              {type === 'gregorian' ? 'Hebrew' : 'Gregorian'} {secondaryYear}/
              {secondaryDate}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700' }}>
              {type === 'gregorian' ? 'Gregorian' : 'Hebrew'} {primaryYear}/
              {primaryDate}
            </Text>
          </Flex>
          <Flex marginTop={2} flexDirection="column">
            {(astronomy?.sun?.length || astronomy?.moon?.length) && (
              <Astronomy isHeader={true} parent={'Type'} type={'Event'} />
            )}
            {astronomy?.sun &&
              astronomy.sun.map((row, index) => (
                <Astronomy
                  key={index}
                  parent={'sun'}
                  type={row.type}
                  hour={row.hour}
                  min={row.min}
                  sec={row.sec}
                />
              ))}
            {astronomy?.moon &&
              astronomy.moon.map((row, index) => (
                <Astronomy
                  key={index}
                  parent={'moon'}
                  type={row.type}
                  hour={row.hour}
                  min={row.min}
                  sec={row.sec}
                />
              ))}
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

const Day = ({ day, datesGrid, type, isPrimary, theme }) => {
  if (!day) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [GnumYear, GnumMonth, GnumDay] = day.gregorian.split('-')

  const isBC = day.gregorian.includes('BC')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [HnumYear, HnumMonth, HnumDay] = day.hebrew.split('-')

  const Gday = GnumDay.replace(' BC', '')

  const primaryDate =
    type === 'gregorian' ? `${GnumMonth}/${Gday}` : `${HnumMonth}/${HnumDay}`
  const secondaryDate =
    type === 'gregorian' ? `${HnumMonth}/${HnumDay}` : `${GnumMonth}/${Gday}`

  const gregorian_year_bc = isBC ? `BC ${GnumYear}` : GnumYear
  const primaryYear = type === 'gregorian' ? gregorian_year_bc : HnumYear
  const secondaryYear = type === 'gregorian' ? HnumYear : gregorian_year_bc

  const events = day.events.map((event) => event.event)

  events.sort((a, b) => {
    const priority = ['shabbat', 'rosh_chodesh']

    const isAInPriority = priority.includes(a.short_name)
    const isBInPriority = priority.includes(b.short_name)

    if (isAInPriority && !isBInPriority) return 1 // `a` goes after `b`
    if (!isAInPriority && isBInPriority) return -1 // `a` goes before `b`
    return 0 // no change in order
  })

  const moon_phase = day?.moon_phase

  return (
    <Box position="relative" w="full" p={{ base: 0.5, md: 1 }} height="100%">
      {moon_phase && (
        <img
          src={`/${moon_phase}.png`}
          style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            bottom: '4px',
            right: 'calc(50% - 8px)'
          }}
        />
      )}
      <Details
        primaryDate={primaryDate}
        secondaryDate={secondaryDate}
        primaryYear={primaryYear}
        secondaryYear={secondaryYear}
        astronomy={day.astronomy}
        type={type}
        theme={theme}
      />
      <Text
        color={'#777'}
        fontFamily={isPrimary ? 'Fustat-Regular' : 'Fustat-Light'}
        fontWeight={isPrimary ? '500' : '300'}
        position="absolute"
        top="0"
        left="1"
        display={{ base: 'none', sm: 'block' }}
        fontSize={'xs'}>
        {secondaryDate}
      </Text>
      <Box mt={5}>
        {events.map((event, k) => (
          <Event event={event} day={day} datesGrid={datesGrid} key={k} />
        ))}
      </Box>
    </Box>
  )
}

export const CalendarGrid = ({ dates, type }) => {
  const theme = useTheme()

  if (!dates || !dates.length) return <EmptyCalendar />

  const datesGrid = dates.map((date) => ({
    ...date,
    hebrew: `${date.yy}-${String(date.mm).padStart(2, '0')}-${String(
      date.dd
    ).padStart(2, '0')}`
  }))

  // Find the first "day 1" of the primary month
  const firstDayIndex = datesGrid.findIndex((date) => {
    return date[type].replace(' BC', '').endsWith('-01')
  })

  if (firstDayIndex === -1) return <div>Invalid date range provided.</div>

  // Get the start day of the week for the first day of the primary month
  const startingDay = daysOfWeek.indexOf(datesGrid[firstDayIndex].day_of_week)

  // Determine the index of the last day of the primary month
  const nextMonthStartIndex = datesGrid
    .slice(firstDayIndex)
    .findIndex(
      (date, i) => i > 0 && date[type].replace(' BC', '').endsWith('-01')
    )
  const lastDayIndex =
    nextMonthStartIndex !== -1
      ? firstDayIndex + nextMonthStartIndex - 1
      : datesGrid.length - 1

  // Initialize the grid with up to 6 rows initially
  let grid = Array.from({ length: 6 }, () => Array(7).fill(null))
  let currentWeek = 0 // Initialize week counter

  // Populate the grid starting from the first day of the primary month
  let index = firstDayIndex
  while (index < datesGrid.length && currentWeek < 6) {
    const date = datesGrid[index]
    const dayIndex = daysOfWeek.indexOf(date.day_of_week) // Get the day index from the daysOfWeek array

    // Place the date object in the correct cell
    grid[currentWeek][dayIndex] = date

    // Check if we need to increment the week (i.e., start a new week row)
    if (dayIndex === 6 && index !== datesGrid.length - 1) {
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
      grid[currentWeek][col] = datesGrid[i]
    }
  }

  // Check if the grid needs adjustment: remove the 6th row if unused
  if (
    grid[5] &&
    !grid[5].find(
      (date) => date?.day_index === datesGrid[lastDayIndex]?.day_index
    )
  ) {
    grid = grid.slice(0, 5)
  }

  const primaryDate = datesGrid[firstDayIndex][type]

  const today = new Date().toISOString().split('T')[0]

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
          mb={0}>
          {week.map((day, j) => {
            const isToday = today === day.gregorian

            return (
              <Box
                key={j}
                w="14.285%"
                h="150px"
                p={0}
                m={0}
                bg={
                  isToday
                    ? '#ffefc0'
                    : !isPrimaryMonth(day ? day[type] : null, primaryDate)
                    ? '#ccc'
                    : isDayOfRest(day)
                    ? '#c7dfec'
                    : 'brand.light'
                }
                border="0.5px solid"
                borderColor="brand.gray"
                borderRadius={{ base: 'none', md: 'none' }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                boxShadow={day ? theme.shadows.brand.surface : 'none'}>
                <Day
                  day={day}
                  datesGrid={datesGrid}
                  theme={theme}
                  type={type}
                  isPrimary={isPrimaryMonth(
                    day ? day[type] : null,
                    primaryDate
                  )}
                />
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
      boxShadow={theme.shadows.brand.surface}>
      <Text fontSize="md" fontWeight="700">
        {dayDisplay}
      </Text>
    </Box>
  )
}

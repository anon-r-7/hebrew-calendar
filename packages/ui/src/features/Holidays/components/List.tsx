import React from 'react'
import {
  Flex,
  Box,
  Grid,
  Text,
  useBreakpointValue,
  useTheme
} from '@chakra-ui/react'

export const List = ({ store }) => {
  const theme = useTheme()

  const padding = useBreakpointValue({ base: '4', md: '0' })

  // Move this hook outside of tableRow
  const isMobile = useBreakpointValue({ base: true, md: false })

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

  const tableRow = ([one, two, three, four, five], key, header, labels) => {
    const backgroundColor = key % 2 === 0 ? '#f0f0f0' : 'white'

    return (
      <Grid
        templateColumns={{ base: '1fr', md: '150px 100px 125px 125px 100px' }}
        gap={4}
        pt={4}
        pb={4}
        pl={8}
        pr={8}
        background={backgroundColor}
        key={key}
        w="100%">
        <Box>
          {isMobile && (
            <Text fontWeight="700" fontFamily={'HubotSans'}>
              {labels[0]}:
            </Text>
          )}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {one}
          </Text>
        </Box>
        <Box>
          {isMobile && (
            <Text fontWeight="700" fontFamily={'HubotSans'}>
              {labels[1]}:
            </Text>
          )}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {two}
          </Text>
        </Box>
        <Box>
          {isMobile && (
            <Text fontWeight="700" fontFamily={'HubotSans'}>
              {labels[2]}:
            </Text>
          )}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {three}
          </Text>
        </Box>
        <Box>
          {isMobile && (
            <Text fontWeight="700" fontFamily={'HubotSans'}>
              {labels[3]}:
            </Text>
          )}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {four}
          </Text>
        </Box>
        <Box>
          {isMobile && (
            <Text fontWeight="700" fontFamily={'HubotSans'}>
              {labels[4]}:
            </Text>
          )}
          <Text fontWeight={header ? '700' : '300'} fontFamily={'HubotSans'}>
            {five}
          </Text>
        </Box>
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
        {store.state.dates.length ? (
          <Box mt={4}>
            {!isMobile &&
              tableRow(
                ['Events', 'Gregorian', 'Hebrew', 'Day', 'Rest Day'],
                'header',
                true,
                ['Events', 'Gregorian', 'Hebrew', 'Day', 'Rest Day']
              )}
            {store.state.dates.map(
              ({ gregorian, yy, mm, dd, day_of_week, events }, key) => {
                const restDay = isDayOfRest({ dd, events })

                const columns = [
                  events.map((event) => event.event.name).join(', '),
                  gregorian,
                  `${yy.toString().padStart(2, '0')}-${mm
                    .toString()
                    .padStart(2, '0')}-${dd.toString().padStart(2, '0')}`,
                  day_of_week,
                  restDay ? 'Yes' : ''
                ]

                return tableRow(columns, key, false, [
                  'Events',
                  'Gregorian',
                  'Hebrew',
                  'Day',
                  'Rest'
                ])
              }
            )}
          </Box>
        ) : null}
      </Flex>
    </Flex>
  )
}

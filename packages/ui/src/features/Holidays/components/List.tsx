import React from 'react'
import {
  Flex,
  Box,
  Grid,
  Text,
  useBreakpointValue,
  useTheme
} from '@chakra-ui/react'

const COLUMNS = { base: '1fr', md: '150px 100px 125px 125px 100px' }
const LABELS = ['Events', 'Gregorian', 'Hebrew', 'Day', 'Rest Day']

export const List = ({ store }) => {
  const theme = useTheme()
  const padding = useBreakpointValue({ base: '4', md: '0' })
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
        if ([15, 21].includes(day.dd)) isRest = true
      } else if (event.short_name === 'sukkot') {
        if ([15, 22].includes(day.dd)) isRest = true
      }
    })
    return isRest
  }

  const HeaderRow = () => (
    <Grid
      templateColumns={COLUMNS}
      gap={4}
      px={{ base: 4, md: 8 }}
      py={3}
      bg="brand.backgroundAlt"
      borderBottom="2px solid"
      borderColor="brand.primary">
      {LABELS.map((label) => (
        <Text
          key={label}
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="brand.textSecondary">
          {label}
        </Text>
      ))}
    </Grid>
  )

  const DataRow = ({ cells, index }) => (
    <Grid
      templateColumns={COLUMNS}
      gap={4}
      px={{ base: 4, md: 8 }}
      py={3.5}
      bg={index % 2 === 0 ? 'transparent' : 'brand.surface'}
      borderBottom="1px solid"
      borderColor="brand.borderMuted"
      transition="background .12s ease"
      _hover={{ bg: 'brand.backgroundAlt' }}>
      {cells.map((cell, i) => (
        <Box key={i}>
          {isMobile && (
            <Text
              fontSize="10px"
              fontWeight="600"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color="brand.gray"
              mb={0.5}>
              {LABELS[i]}
            </Text>
          )}
          <Text
            fontSize="14px"
            fontWeight={i === 0 ? '500' : '400'}
            className={i === 1 || i === 2 ? 'mono' : undefined}
            color={i === 4 && cell === 'Yes' ? 'brand.secondary' : 'brand.text'}>
            {cell}
          </Text>
        </Box>
      ))}
    </Grid>
  )

  return (
    <Flex direction="row" justify="center" background="brand.background">
      <Flex
        direction="column"
        pt={12}
        pb={12}
        pl={padding}
        pr={padding}
        w="full"
        maxW={{ base: '100%', md: theme.sizes.container.xl }}>
        {store.state.dates.length ? (
          <Box
            mt={4}
            borderRadius="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="brand.border"
            boxShadow="brand.base"
            bg="brand.surfaceRaised">
            {!isMobile && <HeaderRow />}
            {store.state.dates.map(
              ({ gregorian, yy, mm, dd, day_of_week, events }, key) => {
                const restDay = isDayOfRest({ dd, events })
                const cells = [
                  events.map((event) => event.event.name).join(', '),
                  gregorian,
                  `${String(yy).padStart(2, '0')}-${String(mm).padStart(
                    2,
                    '0'
                  )}-${String(dd).padStart(2, '0')}`,
                  day_of_week,
                  restDay ? 'Yes' : ''
                ]
                return <DataRow key={key} cells={cells} index={key} />
              }
            )}
          </Box>
        ) : null}
      </Flex>
    </Flex>
  )
}

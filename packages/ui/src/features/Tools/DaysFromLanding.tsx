import React from 'react'
import {
  Flex,
  Box,
  Heading,
  Text,
  useBreakpointValue,
  useTheme
} from '@chakra-ui/react'

import { DaysFrom } from './DaysFrom/DaysFrom'

export const DaysFromLanding = () => {
  const theme = useTheme()

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

      <DaysFrom />

      <Flex direction="column" align="center" justify="center">
        <Flex
          direction="row"
          wrap="wrap"
          justify="center"
          align="center"
          gap={{ base: 3, md: 6 }}
          m={12}
          w="full"
          maxW={{ base: '100%', md: 760 }}>
          <a href="/calendar">
            <Text fontSize="md" color="brand.grey">
              Calendar
            </Text>
          </a>
          <a href="/holidays">
            <Text fontSize="md" color="brand.grey">
              Holidays
            </Text>
          </a>
          <a href="/days-from">
            <Text fontSize="md" color="brand.light">
              Days From
            </Text>
          </a>
          <a href="/days-between">
            <Text fontSize="md" color="brand.grey">
              Days Between
            </Text>
          </a>
          <a href="/timeline" target="_blank" rel="noopener noreferrer">
            <Text fontSize="md" color="brand.grey">
              Biblical Timeline
            </Text>
          </a>
        </Flex>
      </Flex>
    </Box>
  )
}

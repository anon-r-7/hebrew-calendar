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

export const Tools = () => {
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
          direction={{ base: 'row', md: 'row' }}
          justify="space-around"
          align="center"
          m={12}
          w="full"
          maxW={{ base: 200 }}>
          <a href="/calendar">
            <Text fontSize="md" color="brand.grey">
              Calendar
            </Text>
          </a>
          <a href="/tools">
            <Text fontSize="md" color="brand.light">
              Tools
            </Text>
          </a>
        </Flex>
      </Flex>
    </Box>
  )
}

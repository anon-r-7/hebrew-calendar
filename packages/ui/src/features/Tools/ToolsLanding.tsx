import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Box, Flex, Tab, TabList, Tabs, useBreakpointValue, useTheme } from '@chakra-ui/react'

import { Routes } from '@ui/Routes'
import { DaysBetween } from './DaysBetween/DaysBetween'
import { DaysFrom } from './DaysFrom/DaysFrom'
import { Holidays } from '@ui/features/Holidays/Holidays'

// Days Between and Days From live under one "Tools" entry as tabs; each tab has its own URL
const TABS = [
  { path: Routes.DaysBetween, label: 'Days Between', view: DaysBetween },
  { path: Routes.DaysFrom, label: 'Days From', view: DaysFrom },
  { path: Routes.Holidays, label: 'Holidays', view: Holidays }
]

export const ToolsLanding = () => {
  const theme = useTheme()
  const history = useHistory()
  const { pathname } = useLocation()
  const padding = useBreakpointValue({ base: '4', md: '0' })
  const index = Math.max(0, TABS.findIndex(({ path }) => pathname.startsWith(path)))

  return (
    <Box w="100%" minH="100%" p={0} m={0} bg="brand.background">
      <Flex direction="row" align="center" justify="center" pl={padding} pr={padding}>
        <Flex direction="column" pt={6} w="full" maxW={{ base: '100%', md: theme.sizes.container.xl }}>
          <Tabs variant="unstyled" index={index} onChange={(i) => history.push(TABS[i].path)}>
            <TabList gap={6} borderBottom="1px solid" borderColor="brand.border">
              {TABS.map(({ label }) => (
                <Tab
                  key={label}
                  px={0}
                  pb={3}
                  fontFamily="heading"
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="700"
                  color="brand.textSecondary"
                  borderBottom="2px solid"
                  borderColor="transparent"
                  mb="-1px"
                  _selected={{ color: 'brand.primary', borderColor: 'brand.primary' }}
                  _focus={{ boxShadow: 'none' }}
                  _focusVisible={{ boxShadow: 'none' }}>
                  {label}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </Flex>
      </Flex>
      {React.createElement(TABS[index].view)}
    </Box>
  )
}

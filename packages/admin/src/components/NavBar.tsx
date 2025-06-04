import React from 'react'
import { Box, Flex, Link as ChakraLink, Text } from '@chakra-ui/react'
import { NavLink as RouterLink, useLocation } from 'react-router-dom'
import { Routes } from '../routes'

const navItems = [
  { label: 'Analyze', to: Routes.EventsPairs },
  { label: 'Create', to: Routes.EventsEntry }
]

export const NavBar = () => {
  const location = useLocation()

  return (
    <Box
      bg="gray.50"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={6}
      py={3}>
      <Flex gap={6} align="center">
        <Text fontWeight="bold" fontSize="lg">
          Hebrew Feasts
        </Text>
        {navItems.map(({ label, to }) => (
          <ChakraLink
            key={to}
            as={RouterLink}
            to={to}
            fontWeight={location.pathname === to ? 'bold' : 'normal'}
            color={location.pathname === to ? 'brand.600' : 'gray.700'}
            _hover={{ textDecoration: 'none', color: 'brand.500' }}>
            {label}
          </ChakraLink>
        ))}
      </Flex>
    </Box>
  )
}

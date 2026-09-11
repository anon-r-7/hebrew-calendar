import React, { useEffect } from 'react'
import { Box, Flex, Link, Text, useColorMode } from '@chakra-ui/react'

import { ThemeToggle } from '@ui/components/ThemeToggle'

const links = [
  { href: '/calendar', label: 'Calendar' },
  { href: '/holidays', label: 'Holidays' },
  { href: '/days-from', label: 'Days From' },
  { href: '/days-between', label: 'Days Between' },
  { href: '/timeline', label: 'Timeline' }
]

// Sticky, editorial top frame — echoes the timeline's blurred ".controls" bar:
// translucent ground + backdrop blur + hairline base. Brand wordmark (Fraunces)
// on the left, nav in the middle, the light/dark toggle on the right.
export const AppHeader = () => {
  const { colorMode } = useColorMode()
  const path =
    typeof window !== 'undefined' ? window.location.pathname : '/calendar'

  // Keep <html> painted to match the active mode so a toggle never leaves a
  // stale dark gutter behind the body on overscroll / short pages.
  useEffect(() => {
    try {
      document.documentElement.style.background =
        colorMode === 'dark' ? '#0d1020' : '#f5f4f0'
    } catch (e) {}
  }, [colorMode])

  const navLink = (href, label, isActive) => (
    <Link
      key={href}
      href={href}
      fontSize={{ base: '13px', md: '14px' }}
      fontWeight={isActive ? '600' : '500'}
      letterSpacing="0.01em"
      whiteSpace="nowrap"
      color={isActive ? 'brand.text' : 'brand.textSecondary'}
      borderBottom="2px solid"
      borderColor={isActive ? 'brand.primary' : 'transparent'}
      pb="2px"
      _hover={{ color: 'brand.text', textDecoration: 'none' }}
      transition="color .16s ease, border-color .16s ease">
      {label}
    </Link>
  )

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex={40}
      bg="brand.headerBg"
      backdropFilter="blur(10px)"
      sx={{ WebkitBackdropFilter: 'blur(10px)' }}
      borderBottom="1px solid"
      borderColor="brand.border">
      <Flex
        align="center"
        gap={{ base: 3, md: 6 }}
        px={{ base: 4, md: 0 }}
        py={{ base: 2.5, md: 3 }}
        maxW="container.xl"
        mx="auto">
        <Link
          href="/calendar"
          _hover={{ textDecoration: 'none' }}
          flex="none">
          <Text
            as="span"
            fontFamily="heading"
            fontSize={{ base: '18px', md: '21px' }}
            fontWeight="600"
            letterSpacing="-0.01em"
            color="brand.text">
            Hebrew Feasts
          </Text>
        </Link>

        <Box flex="1 1 auto" />

        <Flex
          as="nav"
          align="center"
          gap={{ base: 3, md: 5 }}
          overflowX="auto"
          css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {links.map(({ href, label }) =>
            navLink(href, label, path.startsWith(href))
          )}
        </Flex>

        <ThemeToggle ml={{ base: 1, md: 2 }} />
      </Flex>
    </Box>
  )
}

import React, { useEffect } from 'react'
import {
  Box,
  Flex,
  Link,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode
} from '@chakra-ui/react'

import { ThemeToggle } from '@ui/components/ThemeToggle'
import { useAuth } from '@ui/hooks/useAuth'
import nav from '@ui/nav.json'

// one definition for this header and the timeline's (timeline/build.mjs reads the same file)
const baseLinks = nav.links as { href: string; label: string; match?: string }[]

const HamburgerIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

// Sticky, editorial top frame — echoes the timeline's blurred ".controls" bar.
// Desktop: brand wordmark, inline nav, theme toggle. Mobile: a hamburger menu
// (left) + wordmark, with the toggle on the right.
export const AppHeader = () => {
  const { colorMode } = useColorMode()
  const { loggedIn, logout } = useAuth()
  const links = [...baseLinks, ...(loggedIn ? nav.signedIn : []), ...nav.trailing]
  // sign-in / sign-out sits at the end of the nav; signing out returns to the calendar
  const session = loggedIn
    ? { ...nav.session.logout, onClick: logout }
    : { ...nav.session.login, onClick: undefined }
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

  const isActive = (href: string, match?: string) => path.startsWith(match || href)

  // the sign-in / sign-out link is never the "current page"
  const navLink = (href, label, onClick?: () => void, match?: string, active = isActive(href, match)) => (
    <Link
      key={label}
      href={href}
      onClick={onClick}
      fontSize="14px"
      fontWeight={active ? '600' : '500'}
      letterSpacing="0.01em"
      whiteSpace="nowrap"
      color={active ? 'brand.text' : 'brand.textSecondary'}
      borderBottom="2px solid"
      borderColor={active ? 'brand.primary' : 'transparent'}
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
        {/* Mobile: hamburger menu (hidden on desktop) */}
        <Box display={{ base: 'block', md: 'none' }} flex="none">
          <Menu autoSelect={false}>
            <MenuButton
              aria-label="Open navigation menu"
              display="grid"
              placeItems="center"
              w="34px"
              h="34px"
              borderRadius="full"
              bg="brand.surfaceRaised"
              border="1px solid"
              borderColor="brand.border"
              color="brand.text"
              transition="border-color .16s ease"
              _hover={{ borderColor: 'brand.gray' }}
              _active={{ borderColor: 'brand.gray' }}>
              <Box as="span" display="grid" placeItems="center">
                <HamburgerIcon />
              </Box>
            </MenuButton>
            <MenuList
              bg="brand.surfaceRaised"
              borderColor="brand.border"
              boxShadow="brand.lift"
              minW="188px"
              py={2}
              zIndex={50}>
              {links.map(({ href, label, match }) => (
                <MenuItem
                  key={href}
                  as="a"
                  href={href}
                  bg="transparent"
                  fontSize="15px"
                  fontWeight={isActive(href, match) ? '600' : '500'}
                  color={isActive(href, match) ? 'brand.primary' : 'brand.text'}
                  _hover={{ bg: 'brand.backgroundAlt' }}
                  _focus={{ bg: 'brand.backgroundAlt' }}>
                  {label}
                </MenuItem>
              ))}
              <MenuItem
                as="a"
                href={session.href}
                onClick={session.onClick}
                bg="transparent"
                fontSize="15px"
                fontWeight="500"
                color="brand.textSecondary"
                _hover={{ bg: 'brand.backgroundAlt' }}
                _focus={{ bg: 'brand.backgroundAlt' }}>
                {session.label}
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        <Link href="/calendar" _hover={{ textDecoration: 'none' }} flex="none">
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

        {/* Desktop: inline nav (hidden on mobile) */}
        <Flex
          as="nav"
          display={{ base: 'none', md: 'flex' }}
          align="center"
          gap={5}>
          {links.map(({ href, label, match }) => navLink(href, label, undefined, match))}
          {navLink(session.href, session.label, session.onClick, undefined, false)}
        </Flex>

        <ThemeToggle ml={{ base: 1, md: 2 }} />
      </Flex>
    </Box>
  )
}

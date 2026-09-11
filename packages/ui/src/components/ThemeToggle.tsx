import React from 'react'
import { useColorMode, chakra } from '@chakra-ui/react'

// A round icon toggle modeled on the Anno Mundi timeline's ".icon-btn":
// 34px circle, surface fill, hairline border, subtle hover. Shows the glyph
// for the mode you'll switch TO (sun when currently dark, moon when light).
export const ThemeToggle = (props) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === 'dark'

  return (
    <chakra.button
      type="button"
      onClick={toggleColorMode}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title="Toggle light / dark"
      display="inline-grid"
      placeItems="center"
      flex="none"
      w="34px"
      h="34px"
      borderRadius="full"
      bg="brand.surfaceRaised"
      border="1px solid"
      borderColor="brand.border"
      color="brand.text"
      fontSize="15px"
      lineHeight="1"
      transition="border-color .16s ease, color .16s ease, background .16s ease"
      _hover={{ borderColor: 'brand.gray' }}
      _focusVisible={{
        outline: '2px solid var(--chakra-colors-brand-primary)',
        outlineOffset: '2px'
      }}
      {...props}>
      {isDark ? '☀' : '☾'}
    </chakra.button>
  )
}

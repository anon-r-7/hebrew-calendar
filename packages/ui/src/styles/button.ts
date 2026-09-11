import { defineStyleConfig } from '@chakra-ui/react'

export const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: '600',
    borderRadius: 'full',
    letterSpacing: '.01em',
    fontFamily: 'body',
    transition: 'all .16s ease'
  },
  sizes: {
    md: { fontSize: '14px', px: '20px', py: '10px', h: 'auto' },
    sm: { fontSize: '13px', px: '14px', py: '7px', h: 'auto' }
  },
  variants: {
    solid: {
      bg: 'brand.primary',
      color: 'brand.onPrimary',
      _hover: { bg: 'brand.primaryLight', _disabled: { bg: 'brand.primary' } },
      _active: { bg: 'brand.primaryDark' }
    },
    outline: {
      border: '1px solid',
      borderColor: 'brand.border',
      color: 'brand.text',
      bg: 'brand.surfaceRaised',
      _hover: { borderColor: 'brand.primary', bg: 'brand.surface' },
      _active: { bg: 'brand.surface' }
    },
    ghost: {
      color: 'brand.text',
      bg: 'transparent',
      _hover: { bg: 'brand.surface' }
    },
    subtle: {
      bg: 'brand.surface',
      color: 'brand.text',
      _hover: { bg: 'brand.backgroundAlt' }
    }
  },
  defaultProps: { size: 'md', variant: 'solid' }
})

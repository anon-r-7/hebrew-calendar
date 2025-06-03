import { defineStyleConfig } from '@chakra-ui/react'

export const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: '600',
    borderRadius: 'full',
    textTransform: 'uppercase',
    fontFamily: 'Fustat-ExtraBold',
    transition: 'all 0.2s ease-in-out'
  },
  sizes: {
    md: {
      fontSize: '14px',
      px: '24px',
      py: '12px'
    },
    sm: {
      fontSize: '13px',
      px: '20px',
      py: '10px'
    }
  },
  variants: {
    solid: {
      bg: 'brand.primary',
      color: 'white',
      _hover: {
        bg: 'brand.primaryLight'
      },
      _active: {
        bg: 'brand.primaryDark'
      }
    },
    outline: {
      border: '2px solid',
      borderColor: 'brand.primary',
      color: 'brand.primary',
      bg: 'transparent',
      _hover: {
        bg: 'brand.surface'
      },
      _active: {
        bg: 'brand.primaryLight'
      }
    },
    ghost: {
      color: 'brand.primary',
      bg: 'transparent',
      _hover: {
        bg: 'brand.surface'
      }
    },
    subtle: {
      bg: 'brand.surface',
      color: 'brand.text',
      _hover: {
        bg: 'brand.primaryLight'
      }
    }
  },
  defaultProps: {
    size: 'md',
    variant: 'solid'
  }
})

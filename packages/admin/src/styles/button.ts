import { defineStyleConfig } from '@chakra-ui/react'

export const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: '500',
    borderRadius: 'base'
  },
  sizes: {
    md: {
      fontSize: 'sm'
    }
  },
  variants: {
    nav: {
      px: 6,
      border: '2px solid',
      borderColor: 'brand.primary',
      color: 'brand.primary',
      _hover: {
        bg: 'blue',
        color: 'brand.biscay',
        borderColor: 'brand.biscay'
      }
    },
    cta: {
      px: 6,
      border: '2px solid',
      backgroundColor: 'brand.primary',
      borderColor: 'brand.primary',
      color: 'brand.white',
      _hover: {
        bg: 'bul',
        borderColor: 'brand.biscay'
      }
    },
    default: {
      px: 6,
      border: '2px solid',
      backgroundColor: 'brand.white',
      borderColor: 'brand.primary',
      color: 'brand.primary',
      _hover: {
        bg: 'brand.zircon',
        color: 'brand.biscay',
        borderColor: 'brand.biscay'
      }
    }
  }
})

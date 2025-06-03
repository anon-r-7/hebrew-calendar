import { defineStyleConfig } from '@chakra-ui/react'

export const Select = defineStyleConfig({
  baseStyle: {
    field: {
      borderRadius: 'md',
      fontFamily: 'Fustat-Light',
      fontSize: '16px'
    }
  },
  sizes: {
    md: {
      field: {
        px: 4,
        py: 0,
        fontSize: '16px'
      }
    },
    sm: {
      field: {
        px: 3,
        py: 0,
        fontSize: '14px'
      }
    }
  },
  variants: {
    outline: {
      field: {
        bg: 'white',
        border: '1px solid',
        borderColor: 'brand.border',
        _hover: {
          borderColor: 'brand.primaryLight'
        },
        _focus: {
          borderColor: 'brand.primary',
          boxShadow: '0 0 0 1px #20C997'
        }
      }
    }
  },
  defaultProps: {
    size: 'md',
    variant: 'outline'
  }
})

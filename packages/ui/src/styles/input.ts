import { defineStyleConfig } from '@chakra-ui/react'

export const Input = defineStyleConfig({
  baseStyle: {
    field: {
      borderRadius: 'md',
      fontSize: '16px',
      fontFamily: 'Fustat-Light'
    }
  },
  sizes: {
    md: {
      field: {
        px: 4,
        py: 3,
        fontSize: '16px'
      }
    },
    sm: {
      field: {
        px: 3,
        py: 2,
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
        },
        _invalid: {
          borderColor: 'brand.danger'
        }
      }
    }
  },
  defaultProps: {
    size: 'md',
    variant: 'outline'
  }
})

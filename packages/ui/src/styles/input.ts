import { defineStyleConfig } from '@chakra-ui/react'

export const Input = defineStyleConfig({
  baseStyle: {
    field: { borderRadius: 'md', fontFamily: 'body' }
  },
  sizes: {
    md: { field: { px: 4, py: 3, fontSize: '15px' } },
    sm: { field: { px: 3, py: 2, fontSize: '14px' } }
  },
  variants: {
    outline: {
      field: {
        bg: 'brand.surfaceRaised',
        color: 'brand.text',
        border: '1px solid',
        borderColor: 'brand.border',
        _hover: { borderColor: 'brand.gray' },
        _focusVisible: {
          borderColor: 'brand.primary',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)'
        },
        _placeholder: { color: 'brand.gray' },
        _invalid: {
          borderColor: 'brand.danger',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-danger)'
        }
      }
    }
  },
  defaultProps: { size: 'md', variant: 'outline' }
})

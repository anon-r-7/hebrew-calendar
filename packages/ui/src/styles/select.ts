import { defineStyleConfig } from '@chakra-ui/react'

export const Select = defineStyleConfig({
  baseStyle: {
    field: { borderRadius: 'md', fontFamily: 'body' },
    icon: { color: 'brand.gray' }
  },
  sizes: {
    md: { field: { px: 4, fontSize: '15px' } },
    sm: { field: { px: 3, fontSize: '14px' } }
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
        // native <option> lists follow the OS, but set sane colors where honored
        '> option': { background: 'var(--chakra-colors-brand-surfaceRaised)', color: 'var(--chakra-colors-brand-text)' }
      }
    }
  },
  defaultProps: { size: 'md', variant: 'outline' }
})

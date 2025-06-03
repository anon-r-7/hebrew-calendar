import { defineStyleConfig } from '@chakra-ui/react'

export const Heading = defineStyleConfig({
  baseStyle: {
    fontFamily: 'Fustat-SemiBold',
    fontWeight: '600',
    color: 'brand.text',
    lineHeight: '1.4'
  },
  sizes: {
    xl: { fontSize: '36px' },
    lg: { fontSize: '32px' },
    md: { fontSize: '24px' },
    sm: { fontSize: '20px' },
    xs: { fontSize: '18px' }
  },
  defaultProps: {
    size: 'md'
  }
})

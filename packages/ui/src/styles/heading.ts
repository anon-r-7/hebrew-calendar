import { defineStyleConfig } from '@chakra-ui/react'

export const Heading = defineStyleConfig({
  baseStyle: {
    fontFamily: 'heading',
    fontWeight: '600',
    color: 'brand.text',
    letterSpacing: '-.01em',
    lineHeight: '1.12'
  },
  sizes: {
    '2xl': { fontSize: ['40px', '56px'] },
    xl: { fontSize: ['32px', '40px'] },
    lg: { fontSize: '30px' },
    md: { fontSize: '23px' },
    sm: { fontSize: '19px' },
    xs: { fontSize: '16px' }
  },
  defaultProps: { size: 'md' }
})

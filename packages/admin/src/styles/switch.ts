import { defineStyleConfig } from '@chakra-ui/react'

export const Switch = defineStyleConfig({
  baseStyle: {
    track: {
      bg: 'brand.borderMuted',
      _checked: {
        bg: 'brand.primary'
      }
    },
    thumb: {
      bg: 'white'
    }
  }
})

import { defineStyleConfig } from '@chakra-ui/react'

export const Switch = defineStyleConfig({
  baseStyle: {
    track: {
      bg: 'brand.gray', // off: faint ink, visible on both grounds (hairSoft was invisible)
      _checked: { bg: 'brand.primary' }
    },
    thumb: { bg: 'brand.surfaceRaised' }
  }
})

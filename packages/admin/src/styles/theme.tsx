// theme/index.ts
import { extendTheme } from '@chakra-ui/react'
import { Button } from './button'
import { Heading } from './heading'
import { Switch } from './switch'
import { Input } from './input'
import { Select } from './select'

export const theme = extendTheme({
  colors: {
    brand: {
      primary: '#1475a8', // Deep modern blue
      primaryDark: '#105d89', // For hovers / active
      primaryLight: '#3492c9', // For lighter UI
      surface: '#f7f8f9', // Light gray UI background
      background: '#ffffff', // Main background
      text: '#2B3248', // Primary body text
      textSecondary: '#4D4D4D', // Subtle labels
      border: '#E3E7E9', // Light stroke / dividers
      borderMuted: '#D6DBDF', // Soft backgrounds
      gray: '#ADB6BE', // Iconography / placeholder text
      success: '#11C57A',
      danger: '#D32F2F',
      warning: '#FFA826',
      info: '#22CAFD'
    }
  },
  fonts: {
    body: '"Fustat-Light", sans-serif',
    heading: '"Fustat-SemiBold", sans-serif',
    mono: 'Menlo, monospace'
  },
  components: {
    Button,
    Heading,
    Switch,
    Input,
    Select
  },
  styles: {
    global: {
      body: {
        bg: 'brand.background',
        color: 'brand.text',
        fontSize: '18px',
        lineHeight: '1.6'
      },
      a: {
        color: 'brand.primary',
        fontWeight: '600',
        textDecoration: 'underline',
        _hover: {
          color: 'brand.primaryLight'
        }
      }
    }
  },
  sizes: {
    container: {
      xl: '1200px',
      '2xl': '1440px'
    }
  },
  shadows: {
    brand: {
      base: '0 8px 24px rgba(43, 50, 72, 0.05)'
    }
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px'
  }
})

import { extendTheme } from '@chakra-ui/react'
import { Button } from './button'
import { Heading } from './heading'
import { Switch } from './switch'
import { Input } from './input'
import { Select } from './select'

export const theme = extendTheme({
  colors: {
    brand: {
      primary: '#005b96',
      secondary: '#dee8f1',
      accent: '#35414c',
      dark: '#212529',
      light: '#f8f9fa',
      lightBlue: '#607999',
      grey: '#c1c1c6',
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      red: '#993232'
    }
  },
  fonts: {
    body: '"HubotSans-Light", sans-serif',
    heading: '"HubotSans", serif',
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
        bg: 'brand.accent',
        color: 'brand.dark'
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
      base: '0px 14px 21px rgba(0, 0, 0, 0.06)'
    }
  }
})

// export const theme = extendTheme({
//   colors: {
//     brand: {
//       primary: '#375bd2',
//       mirage: '#0c162c',
//       biscay: '#1a2b6b',
//       perano: '#a0b3f2',
//       lavender: '#dfe7fb',
//       zircon: '#f5f7fd',
//       red: '#ff5e57',
//       yellow: '#ffdd59',
//       green: '#05c46b',
//       black: '#000000',
//       gray_90: '#252e42',
//       gray_80: '#3d4556',
//       gray_70: '#555c6c',
//       gray_60: '#6d7380',
//       gray_50: '#858a95',
//       gray_40: '#9ea2ab',
//       gray_30: '#b7bac0',
//       gray_20: '#ced0d5',
//       gray_10: '#e7e8ea',
//       gray_05: '#f3f3f4',
//       white: '#ffffff',
//       link: '#375bd2'
//     }
//   },
//   fonts: {
//     body: 'Lato, system-ui, sans-serif',
//     heading: 'Montserrat, system-ui, sans-serif',
//     mono: 'Menlo, monospace'
//   },
//   styles: {
//     global: {
//       'html, body': {
//         color: 'brand.gray_60',
//         lineHeight: 'base',
//         backgroundColor: 'brand.zircon'
//       }
//     }
//   },
//   sizes: {
//     container: {
//       xl: '1200px',
//       '2xl': '1440px'
//     }
//   },
//   shadows: {
//     brand: {
//       base: '0px 14px 21px rgba(0, 0, 0, 0.06)'
//     }
//   },
//   components: {
//     Button,
//     Heading,
//     Switch,
//     Input,
//     Select
//   }
// })

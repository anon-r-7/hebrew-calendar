// theme/index.ts — reskinned to match the Anno Mundi timeline: an editorial, muted
// "Journey of Light" aesthetic. Fraunces display serif + IBM Plex Sans/Mono, a parchment
// (light) / deep-indigo (dark) ground with gold accents. Dark by default, with a light toggle.
import { extendTheme } from '@chakra-ui/react'
import { Button } from './button'
import { Heading } from './heading'
import { Switch } from './switch'
import { Input } from './input'
import { Select } from './select'

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false
}

// Timeline palette (kept in sync with timeline/template.html tokens)
const LIGHT = {
  ground: '#f5f4f0', ground2: '#eceae3', surface: '#ffffff', surface2: '#faf9f5',
  ink: '#24211b', inkSoft: '#5f5849', inkFaint: '#968f7e',
  hair: '#e6e2d8', hairSoft: '#eeebe3',
  gold: '#9a7410', goldLine: '#c19a2b', goldSoft: '#efe7cd', accent: '#a83a29',
  green: '#2c6b3a', blue: '#585aa4'
}
const DARK = {
  ground: '#0d1020', ground2: '#141833', surface: '#181c30', surface2: '#1e2440',
  ink: '#ece5d3', inkSoft: '#a7a08d', inkFaint: '#7c7666',
  hair: '#282d47', hairSoft: '#222741',
  gold: '#dbb856', goldLine: '#c7a340', goldSoft: '#5a4d24', accent: '#e07a5f',
  green: '#5eb974', blue: '#9d97dd'
}
const sem = (l, d) => ({ default: l, _dark: d })

export const theme = extendTheme({
  config,
  fonts: {
    body: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: '"Fraunces", "Fraunces 144", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  // The whole app references `brand.*`; defining them as semantic tokens makes every
  // component adapt to light/dark automatically.
  semanticTokens: {
    colors: {
      brand: {
        background: sem(LIGHT.ground, DARK.ground),
        backgroundAlt: sem(LIGHT.ground2, DARK.ground2),
        surface: sem(LIGHT.surface2, DARK.surface2),
        surfaceRaised: sem(LIGHT.surface, DARK.surface),
        text: sem(LIGHT.ink, DARK.ink),
        textSecondary: sem(LIGHT.inkSoft, DARK.inkSoft),
        primary: sem(LIGHT.gold, DARK.gold),
        primaryDark: sem('#7d5e0d', DARK.goldLine),
        primaryLight: sem(LIGHT.goldLine, '#e8c976'),
        onPrimary: sem(LIGHT.ground, DARK.ground), // text/icon that sits on a gold fill
        secondary: sem(LIGHT.green, DARK.green),
        border: sem(LIGHT.hair, DARK.hair),
        borderMuted: sem(LIGHT.hairSoft, DARK.hairSoft),
        gray: sem(LIGHT.inkFaint, DARK.inkFaint),
        goldSoft: sem(LIGHT.goldSoft, DARK.goldSoft),
        success: sem(LIGHT.green, DARK.green),
        danger: sem(LIGHT.accent, DARK.accent),
        warning: sem(LIGHT.gold, DARK.gold),
        info: sem(LIGHT.blue, DARK.blue),
        // translucent sticky-header ground (blurred bar, like the timeline .controls)
        headerBg: sem('rgba(245,244,240,0.85)', 'rgba(13,16,32,0.82)'),
        // feast label pill — soft pale-gold in LIGHT (the timeline never fills with heavy
        // ochre; gold is an accent there), solid bright-gold in DARK where it reads well.
        feastBg: sem(LIGHT.goldSoft, DARK.gold),
        feastText: sem(LIGHT.gold, DARK.ground),
        feastBorder: sem(LIGHT.goldLine, DARK.gold),
        // legacy alias (some components still say brand.light)
        light: sem(LIGHT.surface2, DARK.surface),
        // calendar day-cell states, mode-aware
        cell: sem(LIGHT.surface2, DARK.surface),
        cellMuted: sem('#e8e4da', '#12152a'),
        // "Today" fill — pale gold in light; in DARK we keep the normal cell fill
        // (no muddy olive block) and mark today with a clean gold ring instead.
        cellToday: sem('#f3e4b8', DARK.surface),
        // Sabbath/rest-day tint — pale periwinkle in light. In DARK, a clean low-chroma
        // neutral lift (no saturated blue, no muddy brown) so the column reads as a
        // subtle panel rather than a colored block.
        cellRest: sem('#e6e3f1', '#2c2f39')
      }
    },
    // Mode-aware elevation, mirroring the timeline's two-tuned --shadow / --shadow-lift
    // (soft ink shadows in light, deep black shadows in dark).
    shadows: {
      brand: {
        base: sem(
          '0 1px 2px rgba(30,26,16,.05), 0 8px 22px rgba(30,26,16,.07)',
          '0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.45)'
        ),
        lift: sem(
          '0 2px 6px rgba(30,26,16,.08), 0 18px 44px rgba(30,26,16,.13)',
          '0 2px 8px rgba(0,0,0,.5), 0 22px 50px rgba(0,0,0,.6)'
        )
      }
    }
  },
  components: {
    Button,
    Heading,
    Switch,
    Input,
    Select,
    // Gold check instead of Chakra's stock blue, so it stays on-palette.
    Checkbox: {
      baseStyle: {
        control: {
          borderColor: 'brand.border',
          _checked: {
            bg: 'brand.primary',
            borderColor: 'brand.primary',
            color: 'brand.onPrimary',
            _hover: { bg: 'brand.primaryDark', borderColor: 'brand.primaryDark' }
          }
        }
      }
    }
  },
  styles: {
    global: (props) => ({
      body: {
        bg: 'brand.background',
        color: 'brand.text',
        fontFamily: 'body',
        fontSize: '17px',
        lineHeight: '1.6',
        WebkitFontSmoothing: 'antialiased',
        // Atmospheric depth so the ground isn't a flat fill — echoes the timeline's
        // textured dark backdrops. Dark: a warm gold glow (top-left) + cool indigo
        // (top-right). Light: a single whisper of warmth. Fixed so it doesn't scroll.
        backgroundImage:
          props.colorMode === 'dark'
            ? 'radial-gradient(1100px 620px at 12% -8%, rgba(219,184,86,0.06), transparent 60%), radial-gradient(1000px 720px at 100% 0%, rgba(120,124,210,0.10), transparent 55%)'
            : 'radial-gradient(1200px 760px at 50% -22%, rgba(154,116,16,0.045), transparent 62%)',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      },
      a: {
        color: 'brand.primary',
        fontWeight: '600',
        textDecoration: 'none',
        _hover: { color: 'brand.primaryLight', textDecoration: 'underline' }
      },
      '::selection': {
        background: 'var(--chakra-colors-brand-goldSoft)',
        color: 'var(--chakra-colors-brand-text)'
      },
      // tabular figures for the numeric inputs/dates that run through the app
      '.mono, input[type=number]': { fontVariantNumeric: 'tabular-nums' }
    })
  },
  sizes: {
    container: { xl: '1200px', '2xl': '1440px' }
  },
  shadows: {
    brand: {
      base: '0 1px 2px rgba(0,0,0,.05), 0 8px 22px rgba(0,0,0,.07)'
    }
  },
  radii: {
    sm: '6px',
    md: '9px',
    lg: '16px',
    full: '9999px'
  }
})

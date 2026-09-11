import React from 'react'
import { createRoot } from 'react-dom/client'
import { ColorModeScript } from '@chakra-ui/react'

import { Providers } from '@ui/providers'
import { App } from '@ui/App'
import { theme } from '@ui/styles/theme'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <Providers>
      <App />
    </Providers>
  </>
)

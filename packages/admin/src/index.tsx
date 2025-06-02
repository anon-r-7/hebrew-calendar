import React from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from '@admin/providers'
import { App } from '@admin/App'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <Providers>
    <App />
  </Providers>
)

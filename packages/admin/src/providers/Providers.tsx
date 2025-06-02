import React from 'react'
import { Router } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '@admin/styles/theme'

const history = createBrowserHistory()

export const Providers = ({ children }) => (
  <Router history={history}>
    <ChakraProvider theme={theme}>{children}</ChakraProvider>
  </Router>
)

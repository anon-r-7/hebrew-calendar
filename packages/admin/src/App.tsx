import React, { useState, useEffect } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import Cookies from 'js-cookie'

import { Routes } from '@admin/Routes'
import { Auth } from '@admin/features/Auth/Auth'
import { EventsEntry } from '@admin/features/EventsEntry/EventsEntry'

const AUTH_TOKEN_KEY = 'auth_token'

export const App = () => {
  const [token, setToken] = useState<string | null>(null)

  const onSubmit = (token) => {
    Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 })
    setToken(token)
  }

  useEffect(() => {
    const existingToken = Cookies.get(AUTH_TOKEN_KEY)
    if (existingToken) setToken(existingToken)
  }, [])

  if (!token) {
    return <Auth onSubmit={onSubmit} />
  }

  return (
    <ChakraProvider>
      <Switch>
        <Route
          exact
          path={Routes.EventsPairs}
          render={(props) => <EventsEntry {...props} />}
        />
        <Route
          exact
          path={Routes.EventsEntry}
          render={(props) => <EventsEntry {...props} />}
        />
        <Redirect to={Routes.EventsPairs} />
      </Switch>
    </ChakraProvider>
  )
}

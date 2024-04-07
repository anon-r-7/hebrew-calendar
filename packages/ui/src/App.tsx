import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { Routes } from '@ui/Routes'
import { Home } from '@ui/features/Home'

export const App = () => (
  <>
    <Switch>
      <Route
        exact
        path={Routes.Home}
        render={(props) => (
          <>
            <Home {...props} />
          </>
        )}
      />

      <Redirect to={Routes.Home} />
    </Switch>
  </>
)

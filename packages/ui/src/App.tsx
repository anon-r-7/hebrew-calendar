import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { Routes } from '@ui/Routes'
import { Calendar } from '@ui/features/Calendar/Calendar'

export const App = () => (
  <>
    <Switch>
      <Route
        exact
        path={Routes.Calendar}
        render={(props) => (
          <>
            <Calendar {...props} />
          </>
        )}
      />

      <Redirect to={Routes.Calendar} />
    </Switch>
  </>
)

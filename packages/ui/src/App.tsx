import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { Routes } from '@ui/Routes'
import { Calendar } from '@ui/features/Calendar/Calendar'
import { Tools } from '@ui/features/Tools/Tools'
import { test } from './test'

test()

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
      <Route
        exact
        path={Routes.Tools}
        render={(props) => (
          <>
            <Tools {...props} />
          </>
        )}
      />

      <Redirect to={Routes.Calendar} />
    </Switch>
  </>
)

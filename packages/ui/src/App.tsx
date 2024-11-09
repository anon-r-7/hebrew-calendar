import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { Routes } from '@ui/Routes'
import { Calendar } from '@ui/features/Calendar/Calendar'
import { Holidays } from '@ui/features/Holidays/Holidays'
import { DaysFromLanding } from '@ui/features/Tools/DaysFromLanding'
import { DaysBetweenLanding } from '@ui/features/Tools/DaysBetweenLanding'

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
        path={Routes.Holidays}
        render={(props) => (
          <>
            <Holidays {...props} />
          </>
        )}
      />
      <Route
        exact
        path={Routes.DaysFrom}
        render={(props) => (
          <>
            <DaysFromLanding {...props} />
          </>
        )}
      />
      <Route
        exact
        path={Routes.DaysBetween}
        render={(props) => (
          <>
            <DaysBetweenLanding {...props} />
          </>
        )}
      />

      <Redirect to={Routes.Calendar} />
    </Switch>
  </>
)

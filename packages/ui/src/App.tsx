import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { Routes } from '@ui/Routes'
import { AppHeader } from '@ui/components/AppHeader'
import { Calendar } from '@ui/features/Calendar/Calendar'
import { ToolsLanding } from '@ui/features/Tools/ToolsLanding'
import { Login } from '@ui/features/Admin/Login'
import { Events } from '@ui/features/Admin/Events'

export const App = () => (
  <>
    <AppHeader />
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
        path={[Routes.DaysBetween, Routes.DaysFrom, Routes.Holidays]}
        render={(props) => <ToolsLanding {...props} />}
      />
      <Redirect exact from={Routes.Tools} to={Routes.DaysBetween} />
      <Redirect exact from={Routes.LegacyHolidays} to={Routes.Holidays} />
      <Redirect exact from={Routes.LegacyDaysBetween} to={Routes.DaysBetween} />
      <Redirect exact from={Routes.LegacyDaysFrom} to={Routes.DaysFrom} />

      <Route exact path={Routes.Login} render={(props) => <Login {...props} />} />
      <Route exact path={Routes.Events} render={(props) => <Events {...props} />} />

      <Redirect to={Routes.Calendar} />
    </Switch>
  </>
)

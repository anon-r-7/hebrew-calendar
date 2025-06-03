import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { Routes } from '@admin/Routes'
import { EventsEntry } from '@admin/features/EventsEntry/EventsEntry'

export const App = () => (
  <>
    <Switch>
      <Route
        exact
        path={Routes.EventsPairs}
        render={(props) => (
          <>
            <EventsEntry {...props} />
          </>
        )}
      />
      <Route
        exact
        path={Routes.EventsEntry}
        render={(props) => (
          <>
            <EventsEntry {...props} />
          </>
        )}
      />

      <Redirect to={Routes.NotFound} />
    </Switch>
  </>
)

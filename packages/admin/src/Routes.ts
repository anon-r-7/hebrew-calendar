export const Routes = {
  EventsEntry: '/events-entry',
  NotFound: '/not-found'
}

export const createRoute = ({ route, id }) => route.replace(':id', id)

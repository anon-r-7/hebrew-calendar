export const Routes = {
  Calendar: '/calendar'
}

export const createRoute = ({ route, id }) => route.replace(':id', id)

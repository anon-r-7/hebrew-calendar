export const Routes = {
  Calendar: '/calendar',
  Tools: '/tools'
}

export const createRoute = ({ route, id }) => route.replace(':id', id)

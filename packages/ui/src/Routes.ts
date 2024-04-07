export const Routes = {
  Home: '/'
}

export const createRoute = ({ route, id }) => route.replace(':id', id)

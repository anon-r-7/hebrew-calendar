export const Routes = {
  Calendar: '/calendar',
  DaysFrom: '/days-from',
  DaysBetween: '/days-between'
}

export const createRoute = ({ route, id }) => route.replace(':id', id)

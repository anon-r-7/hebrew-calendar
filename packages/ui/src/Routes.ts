export const Routes = {
  Calendar: '/calendar',
  Holidays: '/tools/holidays',
  Tools: '/tools',
  DaysBetween: '/tools/days-between',
  DaysFrom: '/tools/days-from',
  // old locations, redirected
  LegacyHolidays: '/holidays',
  LegacyDaysFrom: '/days-from',
  LegacyDaysBetween: '/days-between',
  // hidden: not linked from the nav
  Login: '/login',
  Events: '/events'
}

export const createRoute = ({ route, id }) => route.replace(':id', id)

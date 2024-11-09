import { client } from './client'

const get = async ({ start, end, era, type, with_events, with_astronomy }) => {
  const response = await client({
    method: 'GET',
    url: 'dates',
    params: {
      start,
      end,
      era,
      type,
      with_events,
      with_astronomy
    }
  })
  return response.data
}

const getHolidays = async ({ year, type }) => {
  const response = await client({
    method: 'GET',
    url: 'dates/holidays',
    params: {
      year,
      type,
    }
  })
  return response.data
}

const getDaysFromDate = async (params) => {
  const response = await client({
    method: 'GET',
    url: 'dates/days-from-date',
    params
  })
  return response.data
}

const getDaysBetweenDates = async (params) => {
  const response = await client({
    method: 'GET',
    url: 'dates/days-between-dates',
    params
  })
  return response.data
}

export default {
  get,
  getDaysFromDate,
  getDaysBetweenDates,
  getHolidays
}

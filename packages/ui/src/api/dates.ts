import { client } from './client'

const get = async ({ start, end, type, with_events, with_astronomy }) => {
  const response = await client({
    method: 'GET',
    url: 'dates',
    params: {
      start,
      end,
      type,
      with_events,
      with_astronomy,
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

export default {
  get,
  getDaysFromDate
}

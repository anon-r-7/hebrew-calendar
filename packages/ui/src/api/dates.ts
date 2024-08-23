import { client } from './client'

const get = async ({ start, end, type, with_events }) => {
  const response = await client({
    method: 'GET',
    url: 'dates',
    params: {
      start,
      end,
      type,
      with_events
    }
  })
  return response.data
}

const getDiff = async ({ start, diff, type, buffer }) => {
  const response = await client({
    method: 'GET',
    url: 'dates/diff',
    params: {
      start,
      diff,
      type,
      buffer
    }
  })
  return response.data
}

export default {
  get,
  getDiff
}

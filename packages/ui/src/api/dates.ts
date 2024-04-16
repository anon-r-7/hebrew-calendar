import { client } from './client'

const get = async ({ start, end, type, with_events }) => {
  const response = await client({
    method: 'GET',
    url: 'dates',
    params: {
      start,
      end,
      type,
      with_events,
    }
  })
  return response.data
}

export default {
  get
}
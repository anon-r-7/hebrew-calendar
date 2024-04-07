import { client } from '../client'

export const create = async (data) => {
  const response = await client({
    method: 'POST',
    url: 'query',
    data
  })
  return response
}

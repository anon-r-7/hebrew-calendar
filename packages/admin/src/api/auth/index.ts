import { client } from '../client'
import * as Request from './interface'

const baseUrl = '/v1/auth'

export default {
  login: async (payload: Request.Login): Promise<any> => {
    const { data } = await client.post(`${baseUrl}`, payload)
    return data
  }
}

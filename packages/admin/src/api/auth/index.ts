import { client } from '../client'
import * as Request from './interface'

const baseUrl = '/auth'

export default {
  login: async (payload: Request.Login): Promise<any> => {
    const { data } = await client.post(`${baseUrl}`, payload)
    return data
  }
}

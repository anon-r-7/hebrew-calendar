import axios from 'axios'
import { env } from '@ui/config/config'

export const client = axios.create({
  baseURL: `${env.apiUrl()}/v1`
})

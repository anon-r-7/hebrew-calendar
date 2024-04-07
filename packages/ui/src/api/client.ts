import axios from 'axios'
import { env } from '../config'

export const client = axios.create({
  baseURL: `${env.apiUrl()}`
})

import axios from 'axios'
import Cookies from 'js-cookie'
import { env } from '@admin/config/config'

const AUTH_TOKEN_KEY = 'auth_token'

export const client = axios.create({
  baseURL: `${env.apiUrl()}/v1`
})

client.interceptors.request.use((config) => {
  const token = Cookies.get(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

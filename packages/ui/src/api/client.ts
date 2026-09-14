import axios from 'axios'
import { env } from '@ui/config/config'

export const AUTH_TOKEN_KEY = 'auth_token'

export const getToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}
export const setToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(AUTH_TOKEN_KEY)

export const client = axios.create({
  baseURL: `${env.apiUrl()}/v1`
  // baseURL: `https://api.hebrewfeasts.com/v1`
})

// the admin pages send the session token; public pages are unaffected
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getToken()) {
      clearToken()
      window.dispatchEvent(new Event('AUTH_LOGOUT'))
    }
    return Promise.reject(error)
  }
)

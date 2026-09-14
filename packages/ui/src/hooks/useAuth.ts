import { useCallback, useEffect, useState } from 'react'
import { clearToken, getToken } from '@ui/api/client'

// signed-in state for the header: follows the token in localStorage and the
// AUTH_LOGIN / AUTH_LOGOUT events the login page and API client dispatch
export const useAuth = () => {
  const [loggedIn, setLoggedIn] = useState(!!getToken())

  useEffect(() => {
    const sync = () => setLoggedIn(!!getToken())
    window.addEventListener('AUTH_LOGIN', sync)
    window.addEventListener('AUTH_LOGOUT', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('AUTH_LOGIN', sync)
      window.removeEventListener('AUTH_LOGOUT', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // stable identity: consumers put it in effect dependency lists
  const logout = useCallback(() => {
    clearToken()
    window.dispatchEvent(new Event('AUTH_LOGOUT'))
  }, [])

  return { loggedIn, logout }
}

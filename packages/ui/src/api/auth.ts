import { client } from './client'

const login = async ({ email, password }: { email: string; password: string }) => {
  const response = await client({ method: 'POST', url: 'auth', data: { email, password } })
  return response.data as { token: string; user: { uuid: string; email: string } }
}

const me = async () => {
  const response = await client({ method: 'GET', url: 'auth/me' })
  return response.data as { uuid: string; email: string; first_name: string; last_name: string }
}

export default { login, me }

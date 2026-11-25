import { apiClient } from './apiClient'

export async function login(credentials) {
  const { data } = await apiClient.post('/api/v1/auth/login', credentials)
  return data
}

export async function register(registration) {
  const { data } = await apiClient.post('/api/v1/auth/register', registration)
  return data
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/api/v1/auth/me')
  return data
}

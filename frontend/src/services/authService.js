import { apiClient } from './apiClient'

export async function login(credentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data
}

export async function register(registration) {
  const { data } = await apiClient.post('auth/register', registration)
  return data
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('auth/me')
  return data
}

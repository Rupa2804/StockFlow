import { apiClient } from './apiClient'

export async function getOrganizationSettings() {
  const { data } = await apiClient.get('/api/v1/settings')
  return data
}

export async function updateOrganizationSettings(settings) {
  const { data } = await apiClient.patch('/api/v1/settings', settings)
  return data
}

export async function createOrganizationInvitation(invitation) {
  const { data } = await apiClient.post(
    '/api/v1/organizations/invitations',
    invitation,
  )
  return data
}

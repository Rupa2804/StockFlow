import { apiClient } from './apiClient'

export async function getOrganizationSettings() {
  const { data } = await apiClient.get('settings')
  return data
}

export async function updateOrganizationSettings(settings) {
  const { data } = await apiClient.patch('settings', settings)
  return data
}

export async function createOrganizationInvitation(invitation) {
  const { data } = await apiClient.post(
    'organizations/invitations',
    invitation,
  )
  return data
}

import { apiClient } from './apiClient'

export async function getDashboardSummary() {
  const { data } = await apiClient.get('/api/v1/dashboard/summary')
  return data
}

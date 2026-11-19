import client from './client'

export interface DashboardNavigationSettings {
  dashboard_segregation: boolean
}

export async function getDashboardNavigationSettings(): Promise<DashboardNavigationSettings> {
  const response = await client.get<{ dashboard_segregation?: boolean }>('/getDashboards/all')
  return { dashboard_segregation: response.data.dashboard_segregation === true }
}

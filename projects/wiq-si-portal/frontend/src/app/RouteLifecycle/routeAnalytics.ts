import type { IUserDetails } from '../../shared/api/users'

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] }

interface RouteAnalyticsEvent {
  user?: IUserDetails
  dashboardTitle?: string
  dashboardType?: string
  selectedLocation?: string
}

export function pushRouteAnalytics({
  user,
  dashboardTitle,
  dashboardType,
  selectedLocation,
}: RouteAnalyticsEvent): void {
  const windowWithDataLayer = window as DataLayerWindow
  windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer || []
  windowWithDataLayer.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
    dashboardTitle,
    dashboardType,
    employeeNumber: user?.employee_number,
    siRole: user?.Store_Insights_Role,
    selectedLocation,
  })
}

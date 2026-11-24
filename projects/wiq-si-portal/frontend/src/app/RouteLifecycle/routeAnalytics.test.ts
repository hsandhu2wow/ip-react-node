import { beforeEach, describe, expect, it } from 'vitest'
import type { IUserDetails } from '../../shared/api/users'
import { pushRouteAnalytics } from './routeAnalytics'

describe('pushRouteAnalytics', () => {
  beforeEach(() => {
    delete (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
  })

  it('pushes route metadata and cached user details to the data layer', () => {
    const user: IUserDetails = {
      employee_number: '12345',
      Store_Insights_Role: 'store-manager',
    }

    pushRouteAnalytics({
      user,
      dashboardTitle: 'Information',
      dashboardType: 'Information Page',
      selectedLocation: 'store-42',
    })

    const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
    expect(dataLayer).toBeDefined()
    expect(dataLayer).toHaveLength(1)
    expect(dataLayer![0]).toMatchObject({
      event: 'gtm.js',
      dashboardTitle: 'Information',
      dashboardType: 'Information Page',
      employeeNumber: '12345',
      siRole: 'store-manager',
      selectedLocation: 'store-42',
    })
    expect(typeof dataLayer![0]['gtm.start']).toBe('number')
  })

  it('preserves undefined dashboard metadata for placeholder routes', () => {
    pushRouteAnalytics({ user: {} })

    const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
    expect(dataLayer?.[0]).toMatchObject({ event: 'gtm.js' })
    expect(dataLayer?.[0].dashboardTitle).toBeUndefined()
    expect(dataLayer?.[0].dashboardType).toBeUndefined()
  })
})

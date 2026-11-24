import { describe, expect, it, vi } from 'vitest'
import client from './client'
import { getDashboardNavigationSettings } from './dashboardNavigation'

vi.mock('./client', () => ({ default: { get: vi.fn() } }))

describe('getDashboardNavigationSettings', () => {
  it('reads the dashboard segregation flag from the Angular dashboard endpoint', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { dashboard_segregation: true },
    } as never)

    await expect(getDashboardNavigationSettings()).resolves.toEqual({
      dashboard_segregation: true,
    })
    expect(client.get).toHaveBeenCalledWith('/getDashboards/all')
  })

  it('does not turn a rejected request into a successful default', async () => {
    vi.mocked(client.get).mockRejectedValueOnce(new Error('unavailable'))
    await expect(getDashboardNavigationSettings()).rejects.toThrow('unavailable')
  })
})

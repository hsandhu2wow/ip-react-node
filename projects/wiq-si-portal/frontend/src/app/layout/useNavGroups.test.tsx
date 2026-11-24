import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../shared/context/AuthContext'
import { getUserDetails } from '../../shared/api/users'
import { getDashboardNavigationSettings } from '../../shared/api/dashboardNavigation'
import { getCFCChildCodes } from '../../features/quick-facts/api/sqf'
import { useNavGroups } from './useNavGroups'

vi.mock('../../shared/api/users', () => ({ getUserDetails: vi.fn() }))
vi.mock('../../shared/api/dashboardNavigation', () => ({ getDashboardNavigationSettings: vi.fn() }))
vi.mock('../../features/quick-facts/api/sqf', () => ({ getCFCChildCodes: vi.fn() }))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
}

describe('useNavGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserDetails).mockResolvedValue({
      name: 'Alex Example',
      portal: 'BIG W',
      sqf: 1,
      sqf_enabled: true,
    })
    vi.mocked(getCFCChildCodes).mockResolvedValue([])
    vi.mocked(getDashboardNavigationSettings).mockResolvedValue({ dashboard_segregation: true })
  })

  it('returns loaded account data and segregated groups from the Angular setting', async () => {
    const { result } = renderHook(() => useNavGroups(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toHaveProperty('user.name', 'Alex Example'))
    expect(result.current).toHaveProperty('groups.0.items.0.to', '/quick-facts')
    expect(result.current.isCfc).toBe(false)
    expect(getDashboardNavigationSettings).toHaveBeenCalledOnce()
  })

  it('exposes whether the current account area is a CFC child', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      name: 'Alex Example',
      portal: 'BIG W',
      sqf_area_of_responsibility: '1234',
      sqf: 1,
      sqf_enabled: true,
    })
    vi.mocked(getCFCChildCodes).mockResolvedValue(['1234'])
    const { result } = renderHook(() => useNavGroups(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isCfc).toBe(true))
  })

  it('uses the Angular SI segregation default without requesting dashboard data', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      portal: 'SI',
      sqf: 1,
      sqf_enabled: true,
    })
    const { result } = renderHook(() => useNavGroups(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current).toHaveProperty('groups.0.items.0.to', '/quick-facts'))
    expect(getDashboardNavigationSettings).not.toHaveBeenCalled()
  })

  it('exposes dashboard-setting errors instead of showing an unsegregated fallback', async () => {
    vi.mocked(getDashboardNavigationSettings).mockRejectedValue(new Error('settings unavailable'))
    const { result } = renderHook(() => useNavGroups(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.dashboardSettingsError).toBe(true))
    expect(result.current).toHaveProperty('groups.0.items.0.to', '/quick-facts')
    expect(result.current).not.toHaveProperty('groups.1.items.0.to', '/dashboards/app/all')
  })
})

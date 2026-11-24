import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { RouteLifecycle } from './RouteLifecycle'

function NavigationControls() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/dashboards/info')}>Information</button>
      <button onClick={() => navigate('/quick-facts/summary')}>Quick Facts</button>
      <button onClick={() => navigate('/dashboards/search/example')}>Dashboard placeholder</button>
    </>
  )
}

describe('RouteLifecycle analytics', () => {
  beforeEach(() => {
    delete (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
  })

  it('tracks non-Quick-Facts routes once, including Information Page metadata', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['user-details'], {
      employee_number: '12345',
      Store_Insights_Role: 'store-manager',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboards/search/example']}>
          <RouteLifecycle />
          <NavigationControls />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
      expect(dataLayer).toHaveLength(1)
      expect(dataLayer?.[0]).toMatchObject({
        event: 'gtm.js',
        employeeNumber: '12345',
        siRole: 'store-manager',
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Information' }))
    await waitFor(() => {
      const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
      expect(dataLayer).toHaveLength(2)
      expect(dataLayer?.[1]).toMatchObject({ dashboardTitle: undefined, dashboardType: 'Information Page' })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Quick Facts' }))
    expect((window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard placeholder' }))
    await waitFor(() => {
      const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
      expect(dataLayer).toHaveLength(3)
      expect(dataLayer?.[2].dashboardTitle).toBeUndefined()
      expect(dataLayer?.[2].dashboardType).toBeUndefined()
    })
  })
})

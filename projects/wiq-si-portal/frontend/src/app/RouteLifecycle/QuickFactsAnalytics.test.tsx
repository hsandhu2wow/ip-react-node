import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { QuickFactsAnalytics } from './QuickFactsAnalytics'

const filterState = vi.hoisted(() => ({ selectedNode: { code: 'location-1' } }))
vi.mock('../../shared/context/FilterContext', () => ({
  useFilter: () => filterState,
}))

function ChangeLocation() {
  return (
    <button
      onClick={() => {
        filterState.selectedNode = { code: 'location-2' }
        window.dispatchEvent(new Event('test:location-change'))
      }}
    >
      Change location
    </button>
  )
}

describe('QuickFactsAnalytics', () => {
  it('emits selected location for the route and subsequent filter changes', async () => {
    delete (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
    const queryClient = new QueryClient()
    queryClient.setQueryData(['user-details'], {
      employee_number: '12345',
      Store_Insights_Role: 'store-manager',
    })

    function Harness() {
      const [, setTick] = useState(0)
      return (
        <>
          <QuickFactsAnalytics />
          <button onClick={() => setTick(value => value + 1)}>Refresh filter</button>
          <ChangeLocation />
        </>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/quick-facts/summary']}>
          <Harness />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
      expect(dataLayer).toHaveLength(1)
      expect(dataLayer?.[0].selectedLocation).toBe('location-1')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Change location' }))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh filter' }))
    await waitFor(() => {
      const dataLayer = (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer
      expect(dataLayer).toHaveLength(2)
      expect(dataLayer?.[1].selectedLocation).toBe('location-2')
    })
  })
})

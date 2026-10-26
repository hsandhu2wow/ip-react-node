import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import client from '../api/client'
import { useFilter } from '../context/FilterContext'
import { useSummaryCards } from './useSummaryCards'
import { useDetailsCard } from './useDetailsCard'
import { useFilterTree } from './useFilterTree'
import { useCardStatus } from './useCardStatus'
import type { IQFTree } from '../types/sqf.types'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('../context/FilterContext', () => ({ useFilter: vi.fn() }))

const selectedNode: IQFTree = {
  name: 'Sydney', code: '1234', level: 'Store', level_desc: 'Store',
  depth: 4, apiDepth: 3, expandable: false,
}

describe('SQF queries and API contracts', () => {
  let queryClient: QueryClient
  const initTree = vi.fn()
  let filter: ReturnType<typeof useFilter>

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    filter = {
      selectedNode, selectedDate: '2026-10-19', isLoaded: true, initTree,
      treeNodes: [selectedNode], selectedPeriod: 'WTD', selectedBreakdownAxis: 'childLevel',
      breakdownAxisChangeCount: 0,
      setSelectedNode: vi.fn(), setSelectedDate: vi.fn(),
      setSelectedPeriod: vi.fn(), setSelectedBreakdownAxis: vi.fn(),
    }
    vi.mocked(useFilter).mockImplementation(() => filter)
  })

  afterEach(() => queryClient.clear())

  it('fetches summary cards again when location or date changes', async () => {
    const cards = [{ cardName: 'sales', cardType: 'summary' }]
    vi.mocked(client.get).mockResolvedValue({ data: { WTD: cards } })
    const { result, rerender } = renderHook(() => useSummaryCards(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ WTD: [{
      ...cards[0], apiType: 'generic', jsId: 'js-sales-summary-card-0', tableOnly: false,
    }] })
    expect(client.get).toHaveBeenLastCalledWith('/sqf/summaryCards/3/2026-10-19/1234')

    filter = { ...filter, selectedDate: '2026-10-18' }
    rerender()
    await waitFor(() => expect(client.get).toHaveBeenLastCalledWith('/sqf/summaryCards/3/2026-10-18/1234'))
    filter = { ...filter, selectedNode: { ...selectedNode, code: '5678' } }
    rerender()
    await waitFor(() => expect(client.get).toHaveBeenLastCalledWith('/sqf/summaryCards/3/2026-10-18/5678'))
  })

  it('does not request summary before hierarchy readiness or when explicitly disabled', async () => {
    filter = { ...filter, selectedNode: null, isLoaded: false }
    const { result, rerender } = renderHook(({ enabled }) => useSummaryCards(enabled), {
      wrapper, initialProps: { enabled: true },
    })
    expect(result.current.fetchStatus).toBe('idle')
    filter = { ...filter, selectedNode, isLoaded: true }
    rerender({ enabled: false })
    expect(result.current.fetchStatus).toBe('idle')
    expect(client.get).not.toHaveBeenCalled()
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    rerender({ enabled: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('reuses the fetched period response when only period or breakdown axis changes', async () => {
    const data = {
      WTD: [{ cardName: 'sales', cardType: 'summary' }],
      YDAY: [{ cardName: 'sales', cardType: 'summary' }],
    }
    vi.mocked(client.get).mockResolvedValue({ data })
    const { result, rerender } = renderHook(() => useSummaryCards(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    filter = { ...filter, selectedPeriod: 'YDAY', selectedBreakdownAxis: 'department' }
    rerender()
    expect(result.current.data).toEqual({
      WTD: [{ ...data.WTD[0], apiType: 'generic', jsId: 'js-sales-summary-card-0', tableOnly: false }],
      YDAY: [{ ...data.YDAY[0], apiType: 'generic', jsId: 'js-sales-summary-card-0', tableOnly: false }],
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it.each([
    { apiDepth: 0, code: 'National' },
    { apiDepth: 3, code: '' },
  ])('omits location segments for depth/code $apiDepth/$code', async ({ apiDepth, code }) => {
    filter = { ...filter, selectedNode: { ...selectedNode, apiDepth, code } }
    vi.mocked(client.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => ({
      summary: useSummaryCards(), details: useDetailsCard('sales'),
    }), { wrapper })
    await waitFor(() => expect(result.current.summary.isSuccess && result.current.details.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/sqf/summaryCards/0/2026-10-19')
    expect(client.get).toHaveBeenCalledWith('/sqf/detailCard/sales/0/2026-10-19')
  })

  it('fetches the requested detail metric and refetches on metric changes', async () => {
    const response = { YDAY: [{ cardName: 'sales', cardType: 'details' }] }
    vi.mocked(client.get).mockResolvedValue({ data: response })
    const { result, rerender } = renderHook(({ metric }) => useDetailsCard(metric), {
      wrapper, initialProps: { metric: 'sales' },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ YDAY: [{
      ...response.YDAY[0], apiType: 'generic', jsId: 'js-sales-details-card-0', tableOnly: false,
    }] })
    expect(client.get).toHaveBeenLastCalledWith('/sqf/detailCard/sales/3/2026-10-19/1234')
    rerender({ metric: 'wages' })
    await waitFor(() => expect(client.get).toHaveBeenLastCalledWith('/sqf/detailCard/wages/3/2026-10-19/1234'))
  })

  it('does not request details without a metric or ready hierarchy', () => {
    const initialProps: { metric: string | undefined } = { metric: undefined }
    const { result, rerender } = renderHook(({ metric }) => useDetailsCard(metric), {
      wrapper, initialProps,
    })
    expect(result.current.fetchStatus).toBe('idle')
    filter = { ...filter, isLoaded: false, selectedNode: null }
    rerender({ metric: 'sales' })
    expect(result.current.fetchStatus).toBe('idle')
    expect(client.get).not.toHaveBeenCalled()
  })

  it('surfaces transport errors rather than converting them to empty card arrays', async () => {
    const error = new Error('Backend unavailable')
    vi.mocked(client.get).mockRejectedValue(error)
    const { result } = renderHook(() => ({ summary: useSummaryCards(), details: useDetailsCard('sales') }), { wrapper })
    await waitFor(() => expect(result.current.summary.isError && result.current.details.isError).toBe(true))
    expect(result.current.summary.error).toBe(error)
    expect(result.current.details.error).toBe(error)
    expect(result.current.summary.data).toBeUndefined()
    expect(result.current.details.data).toBeUndefined()
  })

  it('initializes the hierarchy after fetching and reuses cached data on remount', async () => {
    const hierarchy = [{ name: 'National', code: 'N', level: 0, level_desc: 'National' }]
    vi.mocked(client.get).mockResolvedValue({ data: hierarchy })
    const first = renderHook(() => useFilterTree(), { wrapper })
    expect(initTree).not.toHaveBeenCalled()
    await waitFor(() => expect(initTree).toHaveBeenCalledWith(hierarchy))
    expect(client.get).toHaveBeenCalledWith('/sqf/getUniversalFilterGeneric')
    first.unmount()
    renderHook(() => useFilterTree(), { wrapper })
    expect(initTree).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('does not initialize the hierarchy after a failed request', async () => {
    vi.mocked(client.get).mockRejectedValue(new Error('Hierarchy unavailable'))
    const { result } = renderHook(() => useFilterTree(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(initTree).not.toHaveBeenCalled()
  })

  it('shares cached card configuration across consumers', async () => {
    const status = { sales: { sequence: 1, details: 1 } }
    vi.mocked(client.get).mockResolvedValue({ data: status })
    const first = renderHook(() => useCardStatus(), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()
    const second = renderHook(() => useCardStatus(), { wrapper })
    expect(second.result.current.data).toEqual(status)
    expect(client.get).toHaveBeenCalledExactlyOnceWith('/sqf/getSQFMetricCardsStatus')
  })
})

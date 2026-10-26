import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSeasonalCard } from './useSeasonalCard'
import client from '../api/client'
import { seasonalAPI } from '../test/fixtures/seasonal'
import { formatDate, getYesterdayDate } from '../utils/formatters'
import type { ETAMap } from '../types/sqf.types'
let eta: ETAMap | undefined
const date = formatDate(getYesterdayDate())

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('../context/FilterContext', () => ({ useFilter: () => ({ isLoaded: true, selectedNode: { apiDepth: 0, code: 'AU', level_desc: 'National' }, selectedDate: date }) }))
vi.mock('./useDataLoadETA', () => ({ useDataLoadETA: () => ({ data: eta }) }))
vi.mock('./useSupportEmail', () => ({ useSupportEmail: () => ({ data: 'help@example.com' }) }))
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useSeasonalCard', () => {
  it('does not fetch an unavailable seasonal metric', async () => {
    vi.mocked(client.get).mockReset().mockResolvedValue({ data: [seasonalAPI] })
    const { result } = renderHook(() => useSeasonalCard(undefined), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(client.get).not.toHaveBeenCalled()
  })
  it('fetches the dedicated details endpoint and returns mapped legacy cards', async () => {
    vi.mocked(client.get).mockReset().mockResolvedValue({ data: [{ ...seasonalAPI, cardType: 'details' }] })
    const { result } = renderHook(() => useSeasonalCard({ sequence: 4, titleText: 'Summer Event', details: 1 }, true), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith(`/sqf/seasonalMetricDetails/0/${date}`)
    expect(result.current.data?.[0]).toMatchObject({ title: 'Summer Event', infoMainNumber: '12.35%' })
  })
  it('loads the CFC directory before requesting a CFC-only Seasonal card', async () => {
    vi.mocked(client.get).mockReset().mockImplementation(async url => ({ data: url === '/sqf/getCFCChildCodes' ? { cfc_codes: ['AU'] } : [seasonalAPI] }))
    const { result } = renderHook(() => useSeasonalCard({ sequence: 4, summary: 1, show_only_cfc: true }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.get).toHaveBeenCalledWith('/sqf/getCFCChildCodes')
    expect(result.current.data?.[0].hidden).not.toBe(true)
    expect(result.current.data?.[0].infoMainNumber).toBe('12.35%')
  })

  it('updates a no-data card when the shared ETA arrives after its response', async () => {
    eta = undefined
    vi.mocked(client.get).mockReset().mockResolvedValue({ data: { status: 'error-NoDataFound' } })
    const { result, rerender } = renderHook(() => useSeasonalCard({ sequence: 4, summary: 1 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].error).toMatchObject({ generic: true })
    eta = { seasonal: { time: new Date('2026-10-19T08:30:00') } }
    rerender()
    expect(result.current.data?.[0].error).toMatchObject({ cutOffTime: '8:30 AM', generic: false })
    eta = undefined
  })
})

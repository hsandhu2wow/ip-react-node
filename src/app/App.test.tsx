import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import client from '../shared/api/client'
import App from './App'
import fixture from '../test/fixtures/sqf-api.sanitized.json'
import { SnackbarProvider } from '../shared/components/Snackbar/Snackbar'

vi.mock('../shared/api/client', () => ({ default: { get: vi.fn() } }))

describe('application routes with sanitized API responses', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.mocked(client.get).mockImplementation(async path => {
      if (path === '/sqf/getUniversalFilterGeneric') return { data: structuredClone(fixture.hierarchy) }
      if (path === '/sqf/getSQFMetricCardsStatus') return { data: structuredClone(fixture.status) }
      if (path === '/sqf/getDataLoadETA') return { data: [] }
      if (path === '/supportEmail/SQF') return { data: 'fixture-support@example.invalid' }
      if (path === '/sqf/getCFCChildCodes') return { data: { cfc_codes: [] } }
      if (path.startsWith('/sqf/summaryCards/')) return { data: structuredClone(fixture.summary) }
      if (path.startsWith('/sqf/detailCard/fixture_metric/')) return { data: structuredClone(fixture.details) }
      throw new Error(`Unexpected test request: ${path}`)
    })
  })

  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  function show(path: string) {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <SnackbarProvider><App /></SnackbarProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('initializes hierarchy and renders real-shaped period/breakdown cards through summary and details', async () => {
    show('/quick-facts/summary?date=2026-10-19')
    expect(await screen.findByText('Fixture Sales')).toBeInTheDocument()
    expect(screen.getByText('Fixture KPI 1')).toBeInTheDocument()
    expect(client.get).toHaveBeenCalledWith('/sqf/summaryCards/0/2026-10-19')
    const summaryRequestCount = () => vi.mocked(client.get).mock.calls
      .filter(([path]) => path.startsWith('/sqf/summaryCards/')).length
    const requestsBeforePeriodChange = summaryRequestCount()
    fireEvent.click(screen.getByLabelText('Reporting period'))
    fireEvent.click(screen.getByRole('option', { name: 'Day' }))
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Breakdown'))
    fireEvent.click(screen.getByRole('option', { name: 'Departments' }))
    expect(screen.getByText('Fixture KPI 1')).toBeInTheDocument()
    expect(summaryRequestCount()).toBe(requestsBeforePeriodChange)
    fireEvent.click(screen.getByRole('link', { name: 'Go to details' }))
    await waitFor(() => expect(client.get).toHaveBeenCalledWith(expect.stringMatching(/^\/sqf\/detailCard\/fixture_metric\/0\//)))
    expect(await screen.findByRole('link', { name: /Back to all cards/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Fixture KPI 1')).toHaveLength(2))
    expect(screen.getByText(/Woolworths Ltd - Confidential information/)).toBeInTheDocument()
  })

  it.each(['/quick-facts', '/unknown-route'])('redirects %s into the functional summary route', async path => {
    show(path)
    expect(await screen.findByRole('link', { name: 'Go to details' })).toBeInTheDocument()
    expect(screen.getByText('Fixture Sales')).toBeInTheDocument()
  })

  it('keeps summary failures visible through the full provider/query stack', async () => {
    const get = vi.mocked(client.get).getMockImplementation()!
    vi.mocked(client.get).mockImplementation((path, config) => {
      if (path.startsWith('/sqf/summaryCards/')) return Promise.reject(new Error('Metrics unavailable'))
      return get(path, config)
    })
    show('/quick-facts/summary?date=2026-10-19')
    expect(await screen.findByText('Failed to load metrics. Please try again.')).toBeInTheDocument()
    expect(screen.queryByText('Fixture Sales')).not.toBeInTheDocument()
  })

  it('selects a location from the captured hierarchy and fetches its location-scoped data', async () => {
    show('/quick-facts/summary?date=2026-10-19')
    await screen.findByText('Fixture Sales')
    fireEvent.click(screen.getByRole('button', { name: /Fixture National/ }))
    expect(screen.getByRole('tree', { name: 'Location' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('treeitem', { name: 'Fixture child - fixture-child' }))
    await waitFor(() => expect(client.get).toHaveBeenCalledWith('/sqf/summaryCards/1/2026-10-19/fixture-child'))
    expect(screen.queryByRole('tree')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fixture child/ })).toBeInTheDocument()
  })

  it('selects a reporting date, closes the calendar and fetches the new date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 20, 12))
    show('/quick-facts/summary?date=2026-10-19')
    await screen.findByText('Fixture Sales')
    fireEvent.click(screen.getByRole('button', { name: /19 Oct/ }))
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '18 OCT 2026' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(client.get).toHaveBeenCalledWith('/sqf/summaryCards/0/2026-10-18'))
    expect(screen.getByRole('button', { name: /18 Oct/ })).toBeInTheDocument()
  })

  it('dismisses location and date overlays on outside clicks and opens the print preview', async () => {
    show('/quick-facts/summary?date=2026-10-19')
    await screen.findByText('Fixture Sales')
    fireEvent.click(screen.getByRole('button', { name: /Fixture National/ }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('tree')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /19 Oct/ }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Print' }))
    expect(screen.getByRole('dialog', { name: 'Quick Facts preview' })).toBeInTheDocument()
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

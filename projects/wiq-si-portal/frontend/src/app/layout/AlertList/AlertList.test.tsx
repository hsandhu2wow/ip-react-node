import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { PageLoadedProvider, useNotifyPageLoaded } from '../../../shared/context/PageLoadedContext'
import { TrendActionsProvider, useRegisterTrendActions, type TrendActions } from '../../../features/trend/context/TrendActionsContext'
import { HEADER_NAV_ATTR } from '../../../shared/components/StellaPanel/StellaPanel'
import type { IAlert } from '../../../shared/api/alerts'
import { AlertList } from './AlertList'

const auth = vi.hoisted(() => ({ portal: 'SI' }))
vi.mock('../../../shared/context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Fixture', portal: auth.portal } }) }))

const alert = (id: number, overrides: Partial<IAlert>): IAlert =>
  ({ id, type: 'info', active: 1, sqf: 0, sqa: 0, wf: 0, myplan: 0, removable: 1, ...overrides })

let served: { alerts: IAlert[]; popups: IAlert[] }
let requests: { alerts: number; popups: number; read: unknown[] }

const noActions: TrendActions = { subscriptionEnabled: false, openSubscription: () => {} }

function Page({ ready = true, actions = noActions }: { ready?: boolean; actions?: TrendActions }) {
  useNotifyPageLoaded(ready)
  useRegisterTrendActions(actions)
  return null
}

function Navigation() {
  const navigate = useNavigate()
  return (
    <>
      {['summary', 'details', 'weekly', 'myplan'].map(page => (
        <button key={page} onClick={() => navigate(`/quick-facts/${page}`)}>Go {page}</button>
      ))}
      <AlertList />
      <Outlet />
    </>
  )
}

function renderList({ path = '/quick-facts/summary', ready = true, trend }: { path?: string; ready?: boolean; trend?: TrendActions } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const page = <Page ready={ready} actions={trend} />
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PageLoadedProvider>
          <TrendActionsProvider>
            <Routes>
              <Route path="/quick-facts" element={<Navigation />}>
                <Route path="summary" element={page} />
                <Route path="details" element={<Page ready={false} />} />
                <Route path="weekly" element={page} />
                <Route path="myplan" element={page} />
              </Route>
            </Routes>
          </TrendActionsProvider>
        </PageLoadedProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  auth.portal = 'SI'
  served = { alerts: [], popups: [] }
  requests = { alerts: 0, popups: 0, read: [] }
  server.use(
    http.get('*/api/alerts', () => { requests.alerts++; return HttpResponse.json(served.alerts) }),
    http.get('*/api/popUpAlerts', () => { requests.popups++; return HttpResponse.json(served.popups) }),
    http.post('*/api/popUpAlerts/read', async ({ request }) => {
      requests.read.push(JSON.parse(String((await request.formData()).get('payload'))))
      return HttpResponse.json({})
    }),
  )
})

afterEach(() => vi.restoreAllMocks())

describe('AlertList (Angular app-alert-list)', () => {
  it('waits for a page to load, then fetches alerts once for the layout', async () => {
    served.alerts = [alert(1, { sqf: 1, text: 'Quick Facts notice' })]
    const { unmount } = renderList({ ready: false })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(requests).toMatchObject({ alerts: 0, popups: 0 })
    unmount()
    renderList()
    expect(await screen.findByText('Quick Facts notice')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go weekly' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go summary' }))
    expect(screen.getByText('Quick Facts notice')).toBeInTheDocument()
    expect(requests).toMatchObject({ alerts: 1, popups: 1 })
  })

  it('renders the type, icon, safe rich text, plain text and optional close button', async () => {
    served.alerts = [
      alert(1, { sqf: 1, type: 'new', hyperText: 'See <a href="https://example.invalid/notes">notes</a><img src="x" onerror="alert(1)">' }),
      alert(2, { sqf: 1, type: 'warning', text: '<b>Plain</b> text', removable: 0 }),
    ]
    renderList()
    const [first, second] = await screen.findAllByRole('alert')
    expect(first.className).toContain('alert-new')
    expect(within(first).getByText('new_releases')).toHaveAttribute('aria-hidden', 'true')
    expect(within(first).getByRole('link', { name: 'notes' })).toHaveAttribute('href', 'https://example.invalid/notes')
    expect(first.querySelector('[onerror]')).toBeNull()
    expect(within(first).getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument()
    expect(second.className).toContain('alert-warning')
    expect(within(second).getByText('error')).toBeInTheDocument()
    expect(within(second).getByText('<b>Plain</b> text')).toBeInTheDocument()
    expect(within(second).queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the current page alerts and keeps dismissed ones hidden across navigation', async () => {
    served.alerts = [
      alert(1, { sqf: 1, text: 'Daily alert' }),
      alert(2, { wf: 1, text: 'Weekly alert' }),
      alert(3, { myplan: 1, text: 'Plan alert' }),
    ]
    renderList()
    expect(await screen.findByText('Daily alert')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go weekly' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Weekly alert')
    fireEvent.click(screen.getByRole('button', { name: 'Go myplan' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Plan alert')
    fireEvent.click(screen.getByRole('button', { name: 'Go summary' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('replaces Weekly Facts admin alerts with the page banner, even after it is dismissed', async () => {
    served.alerts = [alert(1, { wf: 1, text: 'Weekly alert' })]
    const dismissBanner = vi.fn()
    const trend: TrendActions = { ...noActions, banner: { type: 'warning', text: 'Data <strong>delayed</strong>' }, dismissBanner }
    const { unmount } = renderList({ path: '/quick-facts/weekly', trend })
    await waitFor(() => expect(requests.alerts).toBe(1))
    const banner = screen.getByRole('alert')
    expect(banner.className).toContain('alert-warning')
    expect(within(banner).getByText('error')).toBeInTheDocument()
    expect(within(banner).getByText('delayed').tagName).toBe('STRONG')
    expect(screen.queryByText('Weekly alert')).not.toBeInTheDocument()
    fireEvent.click(within(banner).getByRole('button', { name: 'Dismiss notification' }))
    expect(dismissBanner).toHaveBeenCalledOnce()
    unmount()
    renderList({ path: '/quick-facts/weekly', trend: { ...trend, bannerDismissed: true } })
    await waitFor(() => expect(requests.alerts).toBe(2))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('belongs to the sticky header measured by the Stella panel', () => {
    const { container } = renderList({ ready: false })
    expect(container.querySelector(`[${HEADER_NAV_ATTR}]`)).not.toBeNull()
  })
})

describe('AlertList pop-up alerts (Angular AlertDialogComponent)', () => {
  it('opens the current page pop-ups and reopens them on navigation until acknowledged', async () => {
    served.popups = [
      alert(5, { sqf: 1, text: '<p>Daily update</p>' }),
      alert(6, { wf: 1, text: 'Weekly update' }),
    ]
    renderList()
    const dialog = await screen.findByRole('dialog', { name: 'Important Update' })
    expect(dialog).toHaveTextContent('Daily update')
    expect(dialog).not.toHaveTextContent('Weekly update')
    fireEvent.click(screen.getByTestId('dialog-backdrop'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remind me later' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go details' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go summary' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(requests.read).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Go weekly' }))
    const weekly = screen.getByRole('dialog', { name: 'Important Update' })
    expect(weekly).toHaveTextContent('Weekly update')
    fireEvent.click(within(weekly).getByRole('button', { name: 'I understand' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(requests.read).toEqual([[expect.objectContaining({ id: 6, icon: 'info' })]]))
    fireEvent.click(screen.getByRole('button', { name: 'Go myplan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go weekly' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go summary' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Daily update')
  })

  it('shows acknowledged pop-ups again on the next navigation when marking them read fails', async () => {
    served.popups = [alert(5, { sqf: 1, text: 'Daily update' })]
    server.use(http.post('*/api/popUpAlerts/read', () => {
      requests.read.push('failed')
      return HttpResponse.json({}, { status: 500 })
    }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderList()
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'I understand' }))
    await waitFor(() => expect(requests.read).toEqual(['failed']))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go details' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Daily update')
  })

  it('sanitises the pop-up body and themes it for the BIGW portal', async () => {
    auth.portal = 'BIGW'
    served.popups = [alert(5, { sqf: 1, text: '<strong>Daily</strong> update<img src="x" onerror="alert(1)">' })]
    renderList()
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Daily').tagName).toBe('STRONG')
    expect(dialog.querySelector('[onerror]')).toBeNull()
    expect(dialog.querySelector('[class*="bigw"]')).not.toBeNull()
    expect(screen.getByTestId('dialog-backdrop').className).toContain('alertBackdrop')
  })
})

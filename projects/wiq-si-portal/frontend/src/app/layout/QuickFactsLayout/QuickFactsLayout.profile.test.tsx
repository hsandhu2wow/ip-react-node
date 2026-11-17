import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { QuickFactsLayout } from './QuickFactsLayout'

const firstManager = {
  full_name: 'Fixture First Manager',
  success_factors_role: 'Store Manager',
  profile_photo: 'https://example.com/manager.png',
}
const secondManager = { ...firstManager, full_name: 'Fixture Second Manager' }

describe('Quick Facts Store Manager header', () => {
  let queryClient: QueryClient
  let requests: string[]

  beforeEach(() => {
    requests = []
    vi.stubGlobal('innerWidth', 1280)
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(1280)
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    server.use(
      http.get('*/api/getUserdetails', () => HttpResponse.json({ portal: 'SI' })),
      http.get('*/api/sqf/getUniversalFilterGeneric', () => HttpResponse.json([{
        name: 'Fixture Group', code: 'group', level: 3, level_desc: 'Group',
        children: [
          { name: 'First Store', code: 'store-one', level: 4, level_desc: 'Store' },
          { name: 'Second Store', code: 'store-two', level: 4, level_desc: 'Store' },
          { name: 'Unassigned Store', code: 'unassigned', level: 4, level_desc: 'Store' },
        ],
      }])),
      http.get('*/api/sqf/getSQFMetricCardsStatus', () => HttpResponse.json({})),
      http.get('*/api/sqf/getCFCChildCodes', () => HttpResponse.json({ cfc_codes: [] })),
      http.get('*/api/sqf/summaryCards/:depth/:date/:code', () => HttpResponse.json([])),
      http.get('*/api/sqf/getTeamMemberArea/:depth/:code', ({ params, request }) => {
        requests.push(new URL(request.url).pathname)
        if (params.code === 'unassigned') {
          return HttpResponse.json({ message: 'Store Manager not found' }, { status: 404 })
        }
        return HttpResponse.json(params.code === 'store-two' ? secondManager : firstManager)
      }),
    )
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function renderLayout(page = 'summary') {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/quick-facts/${page}?code=store-one&date=2026-11-16`]}>
          <Routes>
            <Route path="/quick-facts" element={<QuickFactsLayout />}>
              <Route path=":page" element={
                <main>
                  No Store Profile card is rendered on this test page.
                  <Link to="?code=store-two&date=2026-11-16">Select second store</Link>
                  <Link to="?code=unassigned&date=2026-11-16">Select unassigned store</Link>
                </main>
              } />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    return screen.getByTestId('filter-bar')
  }

  it.each(['summary', 'weekly', 'myplan'])('populates the %s top header from the selected Store manager endpoint', async page => {
    const header = renderLayout(page)
    expect(await within(header).findByText(firstManager.full_name)).toBeInTheDocument()
    expect(within(header).getByText('Store Manager')).toBeInTheDocument()
    expect(within(header).getByTestId('member-profile').querySelector('img')).toHaveAttribute('src', firstManager.profile_photo)
    expect(requests).toEqual(['/api/sqf/getTeamMemberArea/4/store-one'])
    expect(within(screen.getByRole('main')).queryByText(firstManager.full_name)).not.toBeInTheDocument()
  })

  it('uses the desktop viewport even when the physical screen reports a mobile width', async () => {
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(768)
    const header = renderLayout()
    expect(await within(header).findByText(firstManager.full_name)).toBeInTheDocument()
    expect(within(header).queryByRole('menu')).not.toBeInTheDocument()
  })

  it('moves the manager between the header and mobile menu at 768/769px without refetching', async () => {
    const header = renderLayout()
    expect(await within(header).findByText(firstManager.full_name)).toBeInTheDocument()

    vi.stubGlobal('innerWidth', 768)
    fireEvent(window, new Event('resize'))
    expect(within(header).queryByText(firstManager.full_name)).not.toBeInTheDocument()
    fireEvent.click(within(header).getByRole('button', { name: 'More options' }))
    expect(within(screen.getByRole('menu')).getByText(firstManager.full_name)).toBeInTheDocument()

    vi.stubGlobal('innerWidth', 769)
    fireEvent(window, new Event('resize'))
    expect(within(header).getByText(firstManager.full_name)).toBeInTheDocument()
    expect(within(screen.getByRole('menu')).queryByText(firstManager.full_name)).not.toBeInTheDocument()
    expect(requests).toEqual(['/api/sqf/getTeamMemberArea/4/store-one'])
  })

  it('replaces the manager on store navigation and does not retain one after a failed lookup', async () => {
    const header = renderLayout()
    expect(await within(header).findByText(firstManager.full_name)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Select second store' }))
    expect(within(header).queryByText(firstManager.full_name)).not.toBeInTheDocument()
    expect(await within(header).findByText(secondManager.full_name)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Select unassigned store' }))
    expect(within(header).queryByText(secondManager.full_name)).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.getQueryState(['sqf', 'member-profile', 4, 'unassigned'])?.status).toBe('error'))
    expect(within(header).queryByTestId('member-profile')).not.toBeInTheDocument()
    expect(requests).toEqual([
      '/api/sqf/getTeamMemberArea/4/store-one',
      '/api/sqf/getTeamMemberArea/4/store-two',
      '/api/sqf/getTeamMemberArea/4/unassigned',
    ])
  })
})

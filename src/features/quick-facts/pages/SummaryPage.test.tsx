import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useFilter } from '../../../shared/context/FilterContext'
import { useEnrichedSummaryCards } from '../hooks/useEnrichedSummaryCards'
import { SummaryPage } from './SummaryPage'
import type { IAvailableMetricCards, ISeasonalCard, ISQFMetricCard } from '../../../shared/types/sqf.types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mapSeasonalCards } from '../api/seasonal'
import { seasonalAPI } from '../../../test/fixtures/seasonal'
import { CardsPreviewContext, type CardsPreviewContextValue } from '../../../shared/components/PreviewDialog/cardsPreviewContext'

vi.mock('../../../shared/context/FilterContext', () => ({
  useFilter: vi.fn(),
  useOptionalFilter: () => null,
}))
vi.mock('../hooks/useEnrichedSummaryCards', () => ({ useEnrichedSummaryCards: vi.fn() }))

const card = (name: string, seq?: number): ISQFMetricCard => ({
  cardName: name, cardTitle: name, cardType: 'summary', seq,
})

describe('SummaryPage', () => {
  beforeEach(() => {
    seasonal = undefined
    portal = 'SI'
    vi.mocked(useFilter).mockReturnValue({
      isLoaded: true, breakdownAxisChangeCount: 0,
      selectedNode: { name: 'National', code: 'N', apiDepth: 0, depth: 0, level: '0', level_desc: 'National', expandable: true },
      selectedBreakdownAxis: 'childLevel', selectedPeriod: 'WTD',
      treeNodes: [], selectedDate: '2026-10-19', initTree: vi.fn(),
      setSelectedNode: vi.fn(), setSelectedDate: vi.fn(),
      setSelectedPeriod: vi.fn(), setSelectedBreakdownAxis: vi.fn(),
    })
    vi.mocked(useEnrichedSummaryCards).mockReturnValue({
      data: [], cardStatus: {}, isLoading: false, isError: false,
    })
  })

  function show() {
    return render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><SummaryPage /></QueryClientProvider></MemoryRouter>)
  }

  it('shows six placeholders until the hierarchy is ready', () => {
    vi.mocked(useFilter).mockReturnValue({
      ...useFilter(), isLoaded: false, selectedNode: null,
    })
    show()
    expect(screen.getAllByTestId('metric-card-skeleton')).toHaveLength(6)
  })

  it('orders visible cards using explicit sequence before configured sequence', () => {
    vi.mocked(useEnrichedSummaryCards).mockReturnValue({
      data: [card('Fallback'), card('Configured'), card('Explicit', 1), { ...card('Hidden', 0), hidden: true }],
      cardStatus: { Configured: { sequence: 2 }, Explicit: { sequence: 10 } },
      isLoading: false, isError: false,
    })
    const { container } = show()
    expect(screen.getByRole('heading', { name: /Daily.*powered by Quick Facts/ })).toBeInTheDocument()
    const slots = [...container.querySelectorAll('.metric-card-slot')]
    expect(slots.map(slot => slot.textContent)).toEqual([
      expect.stringContaining('Explicit'),
      expect.stringContaining('Configured'),
      expect.stringContaining('Fallback'),
    ])
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('shows a query error rather than silently displaying an empty success', () => {
    vi.mocked(useEnrichedSummaryCards).mockReturnValue({
      data: [], cardStatus: {}, isLoading: false, isError: true,
    })
    show()
    expect(screen.getByText('Failed to load metrics. Please try again.')).toBeInTheDocument()
  })
})

let seasonal: ISeasonalCard | undefined
let genericCards: ISQFMetricCard[] = []
let cardStatus: IAvailableMetricCards = { profileCard: { sequence: 3 } }
const seasonalFixture = mapSeasonalCards([seasonalAPI], { node: { apiDepth: 0, code: 'AU', level_desc: '' }, date: '', config: { titleText: 'Summer Event', sequence: 2 } })[0]
vi.mock('../hooks/useSeasonalCard', () => ({ useSeasonalCard: () => ({ data: seasonal ? [seasonal] : undefined, isLoading: false }) }))
vi.mock('../components/SeasonalCard/SeasonalBarChart', () => ({ SeasonalBarChart: () => null }))

let portal = 'METRO'
let levelDesc = 'Store'
const getStoreProfileCard = vi.fn()
vi.mock('../../../shared/context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'x', portal } }) }))
vi.mock('../hooks/useSupportEmail', () => ({ useSupportEmail: () => ({ data: 'help@x.com' }) }))
vi.mock('../../../shared/components/NpsSurvey/NpsSurvey', () => ({ NpsSurvey: () => null }))
vi.mock('../api/storeProfile', () => ({ getStoreProfileCard: (...a: unknown[]) => getStoreProfileCard(...a), getStoreProfileRoleNames: vi.fn() }))

const renderPage = (registerPageCards = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})) => {
  vi.mocked(useFilter).mockReturnValue({
    ...useFilter(), isLoaded: true, selectedBreakdownAxis: 'childLevel',
    selectedNode: { code: '1248', name: 'Town Hall - 1248', level_desc: levelDesc, apiDepth: 4, depth: 4, level: '4', expandable: false },
  })
  vi.mocked(useEnrichedSummaryCards).mockReturnValue({ isLoading: false, isError: false, data: genericCards, cardStatus })
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient()}>
    <CardsPreviewContext.Provider value={{ preview: () => Promise.resolve(), registerPageCards }}><SummaryPage /></CardsPreviewContext.Provider>
  </QueryClientProvider></MemoryRouter>)
}

beforeEach(() => {
  seasonal = undefined
  genericCards = []
  cardStatus = { profileCard: { sequence: 3 } }
  getStoreProfileCard.mockReset().mockResolvedValue({ title: 'Town Hall - 1248', jsId: 'js-profile-card', profile: {}, storeAddress: {}, roles: [] })
})

describe('SummaryPage store profile card (Angular showProfileCard)', () => {
  it.each(['METRO', 'PEL'])('shows for the %s portal at Store level', async p => {
    portal = p
    levelDesc = 'Store'
    renderPage()
    await waitFor(() => expect(screen.getByText('STORE PROFILE')).toBeDefined())
    expect(getStoreProfileCard).toHaveBeenCalledWith(expect.objectContaining({ code: '1248' }))
  })

  it('is hidden for other portals or above Store level', () => {
    portal = 'SI'
    levelDesc = 'Store'
    const { unmount } = renderPage()
    expect(screen.queryByText('STORE PROFILE')).toBeNull()
    unmount()
    portal = 'METRO'
    levelDesc = 'State'
    renderPage()
    expect(screen.queryByText('STORE PROFILE')).toBeNull()
    expect(getStoreProfileCard).not.toHaveBeenCalled()
  })
})


describe('SummaryPage Seasonal', () => {
  it('inserts seasonal by sequence among generic cards and registers the same page print order', () => {
    portal = 'SI'
    genericCards = [
      { cardName: 'later', cardType: 'summary', cardTitle: 'Later', jsId: 'js-later', seq: 3 },
      { cardName: 'earlier', cardType: 'summary', cardTitle: 'Earlier', jsId: 'js-earlier', seq: 1 },
    ]
    seasonal = seasonalFixture
    cardStatus = { seasonal: { sequence: 2, summary: 1 } }
    const register = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})
    renderPage(register)
    expect(screen.getByText('SUMMER EVENT')).toBeInTheDocument()
    expect([...document.querySelectorAll('.metric-card-slot > [id]')].map(el => el.id)).toEqual(['js-earlier', seasonal.jsId, 'js-later'])
    expect(register.mock.calls[0][0]().map(c => c.jsId)).toEqual(['js-earlier', seasonal.jsId, 'js-later'])
  })

  it.each(['unavailable', 'hidden'])('does not render or export an %s seasonal card', mode => {
    portal = 'SI'
    seasonal = { ...seasonalFixture, hidden: mode === 'hidden' }
    cardStatus = { seasonal: { sequence: 2, summary: mode === 'unavailable' ? 0 : 1 } }
    const register = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})
    renderPage(register)
    expect(screen.queryByText('SUMMER EVENT')).toBeNull()
    expect(register.mock.calls[0][0]()).toEqual([])
  })

  it('uses Angular max sequence 100 for zero sequence and keeps seasonal before tied profile cards', async () => {
    portal = 'METRO'
    levelDesc = 'Store'
    seasonal = seasonalFixture
    genericCards = [{ cardName: 'earlier', cardType: 'summary', cardTitle: 'Earlier', jsId: 'js-earlier', seq: 99 }]
    cardStatus = { seasonal: { summary: 1, sequence: 0 }, profileCard: { sequence: 100 } }
    renderPage()
    await waitFor(() => expect(screen.getByText('STORE PROFILE')).toBeInTheDocument())
    expect([...document.querySelectorAll('.metric-card-slot > [id]')].map(el => el.id)).toEqual(['js-earlier', seasonal.jsId, 'js-profile-card'])
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SummaryPage } from './SummaryPage'
import { MemoryRouter } from 'react-router-dom'
import type { IAvailableMetricCards, ISeasonalCard, ISQFMetricCard } from '../../types/sqf.types'
import { mapSeasonalCards } from '../../api/seasonal'
import { seasonalAPI } from '../../test/fixtures/seasonal'
import { CardsPreviewContext } from '../../components/shared/PreviewDialog/cardsPreviewContext'
import type { CardsPreviewContextValue } from '../../components/shared/PreviewDialog/cardsPreviewContext'
let seasonal: ISeasonalCard | undefined
let genericCards: ISQFMetricCard[] = []
let cardStatus: IAvailableMetricCards = { profileCard: { sequence: 3 } }
const seasonalFixture = mapSeasonalCards([seasonalAPI], { node: { apiDepth: 0, code: 'AU', level_desc: '' }, date: '', config: { titleText: 'Summer Event', sequence: 2 } })[0]
vi.mock('../../hooks/useSeasonalCard', () => ({ useSeasonalCard: () => ({ data: seasonal ? [seasonal] : undefined, isLoading: false }) }))
vi.mock('../../components/cards/SeasonalCard/SeasonalBarChart', () => ({ SeasonalBarChart: () => null }))

let portal = 'METRO'
let levelDesc = 'Store'
const getStoreProfileCard = vi.fn()
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'x', portal } }) }))
vi.mock('../../context/FilterContext', () => ({
  useOptionalFilter: () => null,
  useFilter: () => ({ isLoaded: true, selectedBreakdownAxis: 'child', selectedNode: { code: '1248', name: 'Town Hall - 1248', level_desc: levelDesc } }),
}))
vi.mock('../../hooks/useEnrichedSummaryCards', () => ({
  useEnrichedSummaryCards: () => ({ isLoading: false, isError: false, data: genericCards, cardStatus }),
}))
vi.mock('../../hooks/useSupportEmail', () => ({ useSupportEmail: () => ({ data: 'help@x.com' }) }))
vi.mock('../../components/shared/NpsSurvey/NpsSurvey', () => ({ NpsSurvey: () => null }))
vi.mock('../../api/storeProfile', () => ({ getStoreProfileCard: (...a: unknown[]) => getStoreProfileCard(...a), getStoreProfileRoleNames: vi.fn() }))

const renderPage = (registerPageCards = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})) =>
  render(<MemoryRouter><QueryClientProvider client={new QueryClient()}>
    <CardsPreviewContext.Provider value={{ preview: () => Promise.resolve(), registerPageCards }}><SummaryPage /></CardsPreviewContext.Provider>
  </QueryClientProvider></MemoryRouter>)

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

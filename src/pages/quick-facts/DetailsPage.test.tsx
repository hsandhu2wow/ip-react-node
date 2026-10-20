import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { IQFTree, ISQFMetricCard, ISeasonalCard } from '../../types/sqf.types'
import { DetailsPage } from './DetailsPage'
import { mapSeasonalCards } from '../../api/seasonal'
import { seasonalAPI } from '../../test/fixtures/seasonal'
import { CardsPreviewContext } from '../../components/shared/PreviewDialog/cardsPreviewContext'
import type { CardsPreviewContextValue } from '../../components/shared/PreviewDialog/cardsPreviewContext'
import { processFilterResponse, addParents, flattenTree } from '../../utils/tree'

const state = vi.hoisted(() => ({
  data: undefined as unknown,
  seasonalData: [] as ISeasonalCard[],
  node: null as IQFTree | null,
  nodes: [] as IQFTree[],
  setSelectedNode: vi.fn(),
}))
vi.mock('../../context/FilterContext', () => {
  const useFilter = () => ({
    isLoaded: true, selectedNode: state.node, treeNodes: state.nodes,
    selectedDate: '2026-10-17', selectedPeriod: 'WTD', selectedBreakdownAxis: 'childLevel',
    setSelectedNode: state.setSelectedNode, breakdownAxisChangeCount: 0,
  })
  return { useFilter, useOptionalFilter: useFilter }
})
const sendAnalytics = vi.hoisted(() => vi.fn())
vi.mock('../../utils/analytics', () => ({ sendQFDataToAnalytics: sendAnalytics }))
const detailRequests = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useSeasonalCard', () => ({
  useSeasonalCard: (_config: unknown, details: boolean) => ({ data: details ? state.seasonalData : [], isLoading: false, isError: false }),
}))
vi.mock('../../components/cards/SeasonalCard/SeasonalBarChart', () => ({ SeasonalBarChart: () => null }))
vi.mock('../../hooks/useDetailsCard', () => ({
  useDetailsCard: (type: string | undefined) => { detailRequests(type); return { data: state.data, isLoading: false, isError: false } },
}))
vi.mock('../../hooks/useCFCChildCodes', () => ({ useCFCChildCodes: () => ({ data: ['1234'], isPending: false }) }))
vi.mock('../../hooks/useCardStatus', () => ({
  useCardStatus: () => ({ data: {
    seasonal: { titleText: 'Summer Event', details: 1, summary: 1, details_start_level: 0, details_last_level: 6, sequence: 4 },
    sales: { titleText: 'Sales', details: 1, details_start_level: 0, details_last_level: 9, sequence: 1 },
    C1Availability: { titleText: 'Availability', details: 1, details_start_level: 0, details_last_level: 9, sequence: 2 },
  } }),
}))
vi.mock('../../hooks/useEnrichedSummaryCards', () => ({ useEnrichedSummaryCards: () => ({ data: [] }) }))
vi.mock('../../hooks/useDataLoadETA', () => ({ useDataLoadETA: () => ({ data: undefined }) }))
vi.mock('../../hooks/useSupportEmail', () => ({ useSupportEmail: () => ({ data: 'support@example.com' }) }))
vi.mock('../../components/cards/CardSidebar/CardSidebar', () => ({ CardSidebar: () => null }))

const card = (title: string, code: string): ISQFMetricCard => ({
  cardName: 'sales', cardType: 'details', cardTitle: title, apiType: 'generic', childCode: code,
  jsId: `js-sales-${code}`, infoNumbers: [{ displayValue: 1, text: 'Sales', val: 1 }],
  tabs: [{ label: 'First', richText: `${title} first` }, { label: 'Second', richText: `${title} second` }],
})

function renderPage(type = 'sales', registerPageCards = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})) {
  return render(
    <MemoryRouter initialEntries={[`/quick-facts/details/${type}?code=Area&period=WTD&axis=childLevel`]}>
      <CardsPreviewContext.Provider value={{ preview: () => Promise.resolve(), registerPageCards }}>
        <Routes>
          <Route path="/quick-facts/details/:type" element={<DetailsPage />} />
        </Routes>
      </CardsPreviewContext.Provider>
    </MemoryRouter>,
  )
}

describe('DetailsPage', () => {
  beforeEach(() => {
    state.setSelectedNode.mockReset()
    state.seasonalData = []
    detailRequests.mockClear()
    state.node = {
      name: 'Area', code: 'Area', level: '4', level_desc: 'Area', apiDepth: 4, depth: 4,
      expandable: true,
      children: [{
        name: 'Store', code: '1234', level: '5', level_desc: 'Store', apiDepth: 5, depth: 5,
        expandable: true,
      }],
    }
    state.nodes = [state.node, ...state.node.children!]
    state.data = [card('Zulu', 'Z'), card('Alpha', 'A')]
  })

  it('renders the Angular qf-card-divider once, after the last details card', () => {
    const { container } = renderPage()
    const dividers = container.querySelectorAll('.qf-card-divider')
    expect(dividers).toHaveLength(1)
    expect(dividers[0].previousElementSibling?.querySelector('#js-sales-A')).not.toBeNull()
    expect(dividers[0].nextElementSibling).toBeNull()
  })

  it('preserves each card active tab when sorting moves it to a different position', () => {
    renderPage()
    fireEvent.click(screen.getAllByRole('tab', { name: 'Second' })[0])
    expect(screen.getByText('Zulu second')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sort Cards/ }))
    fireEvent.click(screen.getByRole('option', { name: 'A - Z' }))
    expect(screen.getByText('Zulu second')).toBeInTheDocument()
    expect(screen.getByText('Alpha first')).toBeInTheDocument()
  })

  it('sends sortCardsQFDetailsCard and tabChangeQFDetailsCard analytics like Angular', () => {
    sendAnalytics.mockReset()
    renderPage()
    fireEvent.click(screen.getAllByRole('tab', { name: 'Second' })[0])
    expect(sendAnalytics).toHaveBeenCalledWith('tabChangeQFDetailsCard', 'Second-sales', 'Area')
    fireEvent.click(screen.getByRole('button', { name: /Sort Cards/ }))
    fireEvent.click(screen.getByRole('option', { name: 'A - Z' }))
    expect(sendAnalytics).toHaveBeenCalledWith('sortCardsQFDetailsCard', 'sales', 'Area')
  })

  it('selects a department below the store from the availability dropdown', () => {
    state.node = processFilterResponse([{
      name: 'Area', code: 'Area', level: 4, level_desc: 'Area',
      children: [{
        name: 'Store', code: '1234', level: 5, level_desc: 'Store',
        leafChildren: [{ name: 'Produce', code: '10', level: 6, level_desc: 'Department' }],
      }],
    }])!
    addParents(state.node)
    state.nodes = flattenTree(state.node)
    state.data = [{
      ...card('Store', '1234'), cardName: 'C1Availability',
      children: [{ code: '1234-10', label: 'Produce' }],
    }]
    renderPage('C1Availability')
    fireEvent.change(screen.getByRole('combobox', { name: 'Select Department' }), { target: { value: '1234-10' } })
    expect(state.setSelectedNode).toHaveBeenCalledWith(expect.objectContaining({
      code: '1234-10', name: 'Produce', apiDepth: 5, parent: state.node.children![0],
    }))
  })

  it('shows the API sort label and exports only the visible detail cards in displayed order', () => {
    const register = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})
    state.data = { WTD: { cards: [card('Zulu', 'Z'), { ...card('Hidden', 'H'), hidden: true }, card('Alpha', 'A')], sortBy: 'HighLow' } }
    renderPage('sales', register)
    expect(screen.getByRole('button', { name: /High - Low/ })).toBeInTheDocument()
    const getCards = register.mock.calls[0][0]
    expect(getCards().map(c => c.cardTitle)).toEqual(['Zulu', 'Alpha'])
    fireEvent.click(screen.getByRole('button', { name: /High - Low/ }))
    fireEvent.click(screen.getByRole('option', { name: 'A - Z' }))
    expect(getCards().map(c => c.cardTitle)).toEqual(['Alpha', 'Zulu'])
  })
})


describe('DetailsPage Seasonal', () => {
  beforeEach(() => { state.data = undefined })
  const seasonalCards = (cardLevel: string) => mapSeasonalCards([
    { ...seasonalAPI, cardType: 'details', CHILD_DESC: 'Zulu', CHILD_CODE: 'Z', LEVEL: cardLevel, SELL_THRU_BY_COMMITMENT_TY: '75' },
    { ...seasonalAPI, cardType: 'details', CHILD_DESC: 'Alpha', CHILD_CODE: 'A', LEVEL: cardLevel, SELL_THRU_BY_COMMITMENT_TY: '10' },
  ], { node: { apiDepth: 0, code: 'AU', level_desc: '' }, date: '', forDetails: true,
    config: { sequence: 4, titleText: 'Summer Event', details: 1, details_start_level: 0, details_last_level: 6 } })

  it.each([
    ['State', ['Zulu', 'Alpha'], 'Z - A'],
    ['Department', ['Zulu', 'Alpha'], 'Sort Cards'],
    ['Store', ['Alpha', 'Zulu'], 'A - Z'],
  ])('renders legacy %s cards with Angular initial sort rules and exports them in that order', (level, expected, label) => {
    state.seasonalData = seasonalCards(level)
    const register = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})
    renderPage('seasonal', register)
    expect(screen.getByText('Summer Event')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
    expect([...document.querySelectorAll('.qf-details-card__title')].map(el => el.textContent?.trim().split(' - ')[0])).toEqual(expected.map(s => s.toUpperCase()))
    expect(register.mock.calls[0][0]().map(c => c.level)).toEqual(expected)
    expect(detailRequests).toHaveBeenLastCalledWith(undefined)
    expect(screen.getAllByRole('table')).toHaveLength(2)
  })

  it('sorts the Seasonal primary KPI numerically and keeps hidden cards out of the list and print', () => {
    state.seasonalData = [...seasonalCards('Department'), { ...seasonalCards('Department')[0], hidden: true }]
    const register = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})
    renderPage('seasonal', register)
    fireEvent.click(screen.getByRole('button', { name: /Sort Cards/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Low-High' }))
    expect(register.mock.calls[0][0]().map(c => c.level)).toEqual(['Alpha', 'Zulu'])
    expect(screen.getByRole('button', { name: /Low - High/ })).toBeInTheDocument()
  })
})

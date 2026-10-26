import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useFilter } from '../../context/FilterContext'
import { useDetailsCard } from '../../hooks/useDetailsCard'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { DetailsPage } from './DetailsPage'
import type { IAvailableMetricCards, IQFTree, ISQFMetricCard, ISeasonalCard } from '../../types/sqf.types'
import { mapSeasonalCards } from '../../api/seasonal'
import { seasonalAPI } from '../../test/fixtures/seasonal'
import { CardsPreviewContext, type CardsPreviewContextValue } from '../../components/shared/PreviewDialog/cardsPreviewContext'
import { processFilterResponse, addParents, flattenTree } from '../../utils/tree'

vi.mock('../../context/FilterContext', () => {
  const useFilter = vi.fn()
  return { useFilter, useOptionalFilter: useFilter }
})
vi.mock('../../hooks/useDetailsCard', () => ({ useDetailsCard: vi.fn() }))
vi.mock('../../hooks/useCardStatus', () => ({ useCardStatus: vi.fn() }))
vi.mock('../../hooks/useEnrichedSummaryCards', () => ({ useEnrichedSummaryCards: vi.fn() }))

const coverageCard = (name: string, val: number, sortByVal?: number): ISQFMetricCard => ({
  cardName: name, cardTitle: name, cardType: 'details', sortByVal,
  infoNumbers: [{ displayValue: val, val, text: 'Sales' }],
})

describe('DetailsPage', () => {
  let queryClient: QueryClient

  function statusResult(data: IAvailableMetricCards) {
    return new QueryObserver<IAvailableMetricCards>(queryClient, {
      queryKey: ['status-fixture', data], initialData: data, enabled: false,
    }).getCurrentResult()
  }

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.mocked(useFilter).mockReturnValue({
      isLoaded: true, breakdownAxisChangeCount: 0, selectedNode: null, selectedPeriod: 'WTD', selectedBreakdownAxis: 'childLevel',
      treeNodes: [], selectedDate: '2026-10-19', initTree: vi.fn(),
      setSelectedNode: vi.fn(), setSelectedDate: vi.fn(),
      setSelectedPeriod: vi.fn(), setSelectedBreakdownAxis: vi.fn(),
    })
    vi.mocked(useDetailsCard).mockReturnValue({
      data: [coverageCard('Store 10', 5), coverageCard('Store 2', 20), coverageCard('CLOSED', 1), { ...coverageCard('Hidden', 0), hidden: true }],
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    vi.mocked(useCardStatus).mockReturnValue(statusResult({
      sales: { sequence: 1, titleText: 'Sales details', details: 1, details_start_level: 0, details_last_level: 9 },
    }))
    vi.mocked(useEnrichedSummaryCards).mockReturnValue({
      data: [], cardStatus: {}, isLoading: false, isError: false,
    })
  })

  afterEach(() => queryClient.clear())

  function show() {
    return render(
      <MemoryRouter initialEntries={['/quick-facts/details/sales']}>
        <Routes>
          <Route path="/quick-facts/details/:type" element={<DetailsPage />} />
          <Route path="/quick-facts/summary" element={<p>Summary destination</p>} />
        </Routes>
      </MemoryRouter>
    )
  }

  const titles = () => screen.getAllByText(/^(Store 2|Store 10|CLOSED|Preferred)$/).map(el => el.textContent)

  function sort(label: string) {
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    fireEvent.click(screen.getByRole('option', { name: label }))
  }

  it('sorts location names numerically and moves closed locations last', () => {
    show()
    expect(screen.getByText('Sales details')).toBeInTheDocument()
    expect(titles()).toEqual(['Store 10', 'Store 2', 'CLOSED'])
    sort('A - Z')
    expect(titles()).toEqual(['Store 2', 'Store 10', 'CLOSED'])
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    sort('Z - A')
    expect(titles()).toEqual(['Store 10', 'Store 2', 'CLOSED'])
  })

  it('sorts both directions by numeric KPI values', () => {
    show()
    sort('High-Low')
    expect(titles()).toEqual(['Store 2', 'Store 10', 'CLOSED'])
    sort('Low-High')
    expect(titles()).toEqual(['CLOSED', 'Store 10', 'Store 2'])
  })

  it('honors the backend default sort and explicit sortByVal', () => {
    vi.mocked(useDetailsCard).mockReturnValue({
      data: { WTD: { cards: [coverageCard('Preferred', 1, 100), coverageCard('Store 2', 20)], sortBy: 'High - Low' } },
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    show()
    expect(titles()).toEqual(['Preferred', 'Store 2'])
    expect(screen.getByRole('button', { name: /High - Low/ })).toBeInTheDocument()
    sort('Low-High')
    expect(titles()).toEqual(['Store 2', 'Preferred'])
    sort('High-Low')
    expect(titles()).toEqual(['Preferred', 'Store 2'])
    expect(screen.getByRole('button', { name: /High - Low/ })).toBeInTheDocument()
  })

  it('closes the sort menu on outside clicks', () => {
    show()
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('redirects unknown metrics to summary', () => {
    vi.mocked(useCardStatus).mockReturnValue(statusResult({}))
    show()
    expect(screen.getByText('Summary destination')).toBeInTheDocument()
  })

  it('shows nine placeholders while details load', () => {
    vi.mocked(useDetailsCard).mockReturnValue({ isLoading: true } as ReturnType<typeof useDetailsCard>)
    show()
    expect(screen.getAllByTestId('metric-card-skeleton')).toHaveLength(9)
  })

  it('shows an explicit details query error', () => {
    vi.mocked(useDetailsCard).mockReturnValue({
      isError: true, isLoading: false,
    } as ReturnType<typeof useDetailsCard>)
    show()
    expect(screen.getByText('Failed to load details. Please try again.')).toBeInTheDocument()
  })

  it('builds breadcrumbs without hidden ancestors and selects a child on drill-down', () => {
    const parent: IQFTree = {
      name: 'Hidden ancestor', code: 'N', level: '0', level_desc: 'National',
      depth: 0, apiDepth: 0, expandable: true, hidden: true,
      parent: {
        name: 'National', code: 'AU', level: '0', level_desc: 'National',
        depth: 0, apiDepth: 0, expandable: true,
      },
    }
    const selectedNode: IQFTree = {
      name: 'Region', code: 'R', level: '1', level_desc: 'Region',
      depth: 1, apiDepth: 1, expandable: true, parent,
    }
    const child: IQFTree = {
      ...selectedNode, name: 'Area', code: 'A', apiDepth: 2, parent: selectedNode,
      children: [], expandable: false,
    }
    selectedNode.children = [child]
    const setSelectedNode = vi.fn()
    vi.mocked(useFilter).mockReturnValue({ ...useFilter(), selectedNode, setSelectedNode, treeNodes: [parent, selectedNode, child] })
    vi.mocked(useDetailsCard).mockReturnValue({
      data: [{ ...coverageCard('Store 2', 20), apiType: 'generic', isGenericCardApi: true, childCode: 'A', customDrillDownText: 'Area details' }],
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    show()
    expect(screen.getByText('Region')).toBeInTheDocument()
    expect(screen.queryByText('Hidden ancestor')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View Area details' }))
    expect(setSelectedNode).toHaveBeenCalledExactlyOnceWith(child)
  })

  it('preserves an explicit API denial of drill-down', () => {
    const selectedNode: IQFTree = {
      name: 'Region', code: 'R', level: '1', level_desc: 'Region',
      depth: 1, apiDepth: 1, expandable: true,
      children: [{ name: 'Area', code: 'A', level: '2', level_desc: 'Area', depth: 2, apiDepth: 2, expandable: false }],
    }
    vi.mocked(useFilter).mockReturnValue({ ...useFilter(), selectedNode })
    vi.mocked(useDetailsCard).mockReturnValue({
      data: [{ ...coverageCard('Store 2', 20), canDrillDown: false, childCode: 'A' }],
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    show()
    expect(screen.queryByRole('button', { name: /^View / })).not.toBeInTheDocument()
  })
})
const state = vi.hoisted(() => ({
  data: undefined as unknown,
  seasonalData: [] as ISeasonalCard[],
  node: null as IQFTree | null,
  nodes: [] as IQFTree[],
  setSelectedNode: vi.fn(),
}))
const sendAnalytics = vi.hoisted(() => vi.fn())
vi.mock('../../utils/analytics', () => ({ sendQFDataToAnalytics: sendAnalytics }))
const detailRequests = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useSeasonalCard', () => ({
  useSeasonalCard: (_config: unknown, details: boolean) => ({ data: details ? state.seasonalData : [], isLoading: false, isError: false }),
}))
vi.mock('../../components/cards/SeasonalCard/SeasonalBarChart', () => ({ SeasonalBarChart: () => null }))
vi.mock('../../hooks/useCFCChildCodes', () => ({ useCFCChildCodes: () => ({ data: ['1234'], isPending: false }) }))
vi.mock('../../hooks/useDataLoadETA', () => ({ useDataLoadETA: () => ({ data: undefined }) }))
vi.mock('../../hooks/useSupportEmail', () => ({ useSupportEmail: () => ({ data: 'support@example.com' }) }))
vi.mock('../../components/cards/CardSidebar/CardSidebar', () => ({ CardSidebar: () => null }))

const card = (title: string, code: string): ISQFMetricCard => ({
  cardName: 'sales', cardType: 'details', cardTitle: title, apiType: 'generic', childCode: code,
  jsId: `js-sales-${code}`, infoNumbers: [{ displayValue: 1, text: 'Sales', val: 1 }],
  tabs: [{ label: 'First', richText: `${title} first` }, { label: 'Second', richText: `${title} second` }],
})

function renderPage(type = 'sales', registerPageCards = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {})) {
  vi.mocked(useFilter).mockImplementation(() => ({
    isLoaded: true, selectedNode: state.node, treeNodes: state.nodes,
    selectedDate: '2026-10-17', selectedPeriod: 'WTD', selectedBreakdownAxis: 'childLevel',
    initTree: vi.fn(), setSelectedDate: vi.fn(), setSelectedPeriod: vi.fn(), setSelectedBreakdownAxis: vi.fn(),
    setSelectedNode: state.setSelectedNode, breakdownAxisChangeCount: 0,
  }))
  vi.mocked(useDetailsCard).mockImplementation((type: string | undefined) => {
    detailRequests(type)
    return { data: state.data, isLoading: false, isError: false } as ReturnType<typeof useDetailsCard>
  })
  vi.mocked(useCardStatus).mockReturnValue(new QueryObserver<IAvailableMetricCards>(new QueryClient(), {
    queryKey: ['parity-status'], enabled: false, initialData: {
    seasonal: { titleText: 'Summer Event', details: 1, summary: 1, details_start_level: 0, details_last_level: 6, sequence: 4 },
    sales: { titleText: 'Sales', details: 1, details_start_level: 0, details_last_level: 9, sequence: 1 },
    C1Availability: { titleText: 'Availability', details: 1, details_start_level: 0, details_last_level: 9, sequence: 2 },
    },
  }).getCurrentResult())
  vi.mocked(useEnrichedSummaryCards).mockReturnValue({ data: [], cardStatus: {}, isLoading: false, isError: false })
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

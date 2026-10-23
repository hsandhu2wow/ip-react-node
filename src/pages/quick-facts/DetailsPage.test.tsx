import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useFilter } from '../../context/FilterContext'
import { useDetailsCard } from '../../hooks/useDetailsCard'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { DetailsPage } from './DetailsPage'
import type { IAvailableMetricCards, IQFTree, ISQFMetricCard } from '../../types/sqf.types'

vi.mock('../../context/FilterContext', () => ({ useFilter: vi.fn() }))
vi.mock('../../hooks/useDetailsCard', () => ({ useDetailsCard: vi.fn() }))
vi.mock('../../hooks/useCardStatus', () => ({ useCardStatus: vi.fn() }))
vi.mock('../../hooks/useEnrichedSummaryCards', () => ({ useEnrichedSummaryCards: vi.fn() }))

const card = (name: string, val: number, sortByVal?: number): ISQFMetricCard => ({
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
      isLoaded: true, selectedNode: null, selectedPeriod: 'WTD', selectedBreakdownAxis: 'childLevel',
      treeNodes: [], selectedDate: '2026-10-19', initTree: vi.fn(),
      setSelectedNode: vi.fn(), setSelectedDate: vi.fn(),
      setSelectedPeriod: vi.fn(), setSelectedBreakdownAxis: vi.fn(),
    })
    vi.mocked(useDetailsCard).mockReturnValue({
      data: [card('Store 10', 5), card('Store 2', 20), card('CLOSED', 1), { ...card('Hidden', 0), hidden: true }],
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    vi.mocked(useCardStatus).mockReturnValue(statusResult({
      sales: { sequence: 1, titleText: 'Sales details' },
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
      data: { WTD: { cards: [card('Store 2', 20), card('Preferred', 1, 100)], sortBy: 'High - Low' } },
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    show()
    expect(titles()).toEqual(['Preferred', 'Store 2'])
    expect(screen.getByRole('button', { name: /High-Low/ })).toBeInTheDocument()
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
    vi.mocked(useFilter).mockReturnValue({ ...useFilter(), selectedNode, setSelectedNode })
    vi.mocked(useDetailsCard).mockReturnValue({
      data: [{ ...card('Store 2', 20), isGenericCardApi: true, childCode: 'A', customDrillDownText: 'Area details' }],
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
      data: [{ ...card('Store 2', 20), canDrillDown: false, childCode: 'A' }],
      isLoading: false, isError: false,
    } as ReturnType<typeof useDetailsCard>)
    show()
    expect(screen.queryByRole('button', { name: /^View / })).not.toBeInTheDocument()
  })
})

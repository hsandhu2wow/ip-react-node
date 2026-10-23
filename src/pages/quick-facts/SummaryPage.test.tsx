import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useFilter } from '../../context/FilterContext'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { SummaryPage } from './SummaryPage'
import type { ISQFMetricCard } from '../../types/sqf.types'

vi.mock('../../context/FilterContext', () => ({ useFilter: vi.fn() }))
vi.mock('../../hooks/useEnrichedSummaryCards', () => ({ useEnrichedSummaryCards: vi.fn() }))

const card = (name: string, seq?: number): ISQFMetricCard => ({
  cardName: name, cardTitle: name, cardType: 'summary', seq,
})

describe('SummaryPage', () => {
  beforeEach(() => {
    vi.mocked(useFilter).mockReturnValue({
      isLoaded: true,
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
    return render(<MemoryRouter><SummaryPage /></MemoryRouter>)
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
    expect(screen.getByText('National')).toBeInTheDocument()
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

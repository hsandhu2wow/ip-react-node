import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../context/FilterContext', () => ({ useFilter: vi.fn() }))
vi.mock('../../../hooks/useFilterTree', () => ({ useFilterTree: vi.fn() }))
vi.mock('../../../hooks/useSummaryCards', () => ({ useSummaryCards: vi.fn() }))
vi.mock('../../../hooks/useDetailsCard', () => ({ useDetailsCard: vi.fn() }))
vi.mock('./LocationTree', () => ({ LocationTree: () => null }))

import { FilterBar } from './FilterBar'
import { useFilter } from '../../../context/FilterContext'
import { useSummaryCards } from '../../../hooks/useSummaryCards'
import { useDetailsCard } from '../../../hooks/useDetailsCard'

const mockFilter = useFilter as ReturnType<typeof vi.fn>
const mockSummary = useSummaryCards as ReturnType<typeof vi.fn>
const mockDetails = useDetailsCard as ReturnType<typeof vi.fn>

const setPeriod = vi.fn()
const setAxis = vi.fn()
const card = { cardName: 'a', cardType: 'summary' }

function setup(opts: { path?: string; levelDesc?: string; summary?: unknown } = {}) {
  mockFilter.mockReturnValue({
    selectedNode: { name: 'N', code: '1', level_desc: opts.levelDesc ?? 'National', children: [{ level_desc: 'Zone' }] },
    selectedDate: '2026-10-01',
    isLoaded: true,
    setSelectedNode: vi.fn(),
    setSelectedDate: vi.fn(),
    selectedPeriod: 'WTD',
    selectedBreakdownAxis: 'childLevel',
    setSelectedPeriod: setPeriod,
    setSelectedBreakdownAxis: setAxis,
  })
  mockSummary.mockReturnValue({ data: opts.summary ?? { WTD: [card], YDAY: [card] } })
  mockDetails.mockReturnValue({ data: undefined })
  return render(
    <MemoryRouter initialEntries={[opts.path ?? '/quick-facts/summary']}>
      <FilterBar />
    </MemoryRouter>
  )
}

describe('FilterBar period/breakdown controls', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows both controls on the summary page with two periods', () => {
    setup()
    expect(screen.getByLabelText('Reporting period')).toBeDefined()
    expect(screen.getByLabelText('Breakdown').textContent).toContain('Zones')
  })

  it('hides the period control when only one period came back', () => {
    setup({ summary: { WTD: [card] } })
    expect(screen.queryByLabelText('Reporting period')).toBeNull()
  })

  it('hides the breakdown control at Store level', () => {
    setup({ levelDesc: 'Store' })
    expect(screen.queryByLabelText('Breakdown')).toBeNull()
  })

  it('hides both controls on other pages', () => {
    setup({ path: '/quick-facts/weekly' })
    expect(screen.queryByLabelText('Reporting period')).toBeNull()
    expect(screen.queryByLabelText('Breakdown')).toBeNull()
  })

  it('updates period and axis on selection', () => {
    setup()
    fireEvent.click(screen.getByLabelText('Reporting period'))
    fireEvent.click(screen.getByRole('option', { name: 'Day' }))
    expect(setPeriod).toHaveBeenCalledWith('YDAY')
    fireEvent.click(screen.getByLabelText('Breakdown'))
    fireEvent.click(screen.getByRole('option', { name: 'Departments' }))
    expect(setAxis).toHaveBeenCalledWith('department')
  })
})

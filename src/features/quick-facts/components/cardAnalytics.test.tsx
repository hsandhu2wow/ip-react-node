import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ISQFMetricCard } from '../../../shared/types/sqf.types'
import { FilterProvider, useFilter } from '../../../shared/context/FilterContext'

const send = vi.fn()
vi.mock('../../../shared/utils/analytics', () => ({ sendQFDataToAnalytics: (...a: unknown[]) => send(...a) }))

import { SummaryCard } from './SummaryCard/SummaryCard'
import { DetailsCard } from './DetailsCard/DetailsCard'

const base: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'summary',
  cardTitle: 'Sales',
  cardHeader: '#219653',
  infoNumbers: [{ displayValue: '$1M', text: 'WTD' }],
  tableData: { type: 'basic', headers: ['Name'], data: [] },
}

const legacy: ISQFMetricCard = {
  ...base,
  tableData: undefined,
  cards: [
    { cardName: 'a', cardType: 'summary', keys: { period: 'wtd' }, infoNumbers: [] },
    { cardName: 'b', cardType: 'summary', keys: { period: 'mtd' }, infoNumbers: [] },
  ],
  filterKeys: { period: 'periodDd' },
  dropdowns: [{ key: 'periodDd', data: [{ key: 'wtd', text: 'WTD' }, { key: 'mtd', text: 'MTD' }] }],
}

const axisCard: ISQFMetricCard = {
  ...base,
  tableData: undefined,
  filterKeys: { view: 'view' },
  dropdowns: [{ key: 'view', data: [{ key: 'hierarchy', text: 'Zones' }, { key: 'department', text: 'Depts' }] }],
  cards: [
    { cardName: 'sales', cardType: 'summary', keys: { view: 'hierarchy' }, infoNumbers: [] },
    { cardName: 'sales', cardType: 'summary', keys: { view: 'department' }, infoNumbers: [] },
  ],
}

function AxisButton() {
  const { setSelectedBreakdownAxis } = useFilter()
  return <button onClick={() => setSelectedBreakdownAxis('department')}>set-axis</button>
}

function AxisSummary({ card }: { card: ISQFMetricCard }) {
  return <SummaryCard card={card} axis={useFilter().selectedBreakdownAxis} />
}
function AxisDetails({ card }: { card: ISQFMetricCard }) {
  return <DetailsCard card={card} axis={useFilter().selectedBreakdownAxis} />
}

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

beforeEach(() => send.mockReset())

describe('SummaryCard analytics (Angular sqf-summary-card)', () => {
  it('sends expandSummaryTable only when expanding', () => {
    wrap(<SummaryCard card={base} />)
    fireEvent.click(screen.getByTestId('expand-toggle'))
    expect(send).toHaveBeenCalledWith('expandSummaryTable', 'sales', undefined)
    fireEvent.click(screen.getByTestId('expand-toggle'))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sends dropdownChangeSummaryCard on a card filter change', () => {
    wrap(<SummaryCard card={legacy} />)
    fireEvent.click(screen.getByRole('button', { name: 'MTD' }))
    expect(send).toHaveBeenCalledWith('dropdownChangeSummaryCard', 'sales', undefined)
  })

  it('sends recognizeQFSummaryCard on recognise', () => {
    wrap(<SummaryCard card={base} />)
    fireEvent.click(screen.getByTestId('recognize-btn'))
    expect(send).toHaveBeenCalledWith('recognizeQFSummaryCard', 'sales', undefined)
  })

  it('sends breakdownAxisChangeSummaryCard when the header axis resolves a child card', () => {
    wrap(<FilterProvider><AxisButton /><AxisSummary card={axisCard} /></FilterProvider>)
    expect(send).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('set-axis'))
    expect(send).toHaveBeenCalledWith('breakdownAxisChangeSummaryCard', 'sales', undefined)
  })
})

describe('DetailsCard analytics (Angular sqf-details-card)', () => {
  it('sends dropdownChangeDetailsCard on a card filter change', () => {
    wrap(<DetailsCard card={{ ...legacy, cardType: 'details' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'MTD' }))
    expect(send).toHaveBeenCalledWith('dropdownChangeDetailsCard', 'sales', undefined)
  })

  it('sends recognizeQFDetailsCard on recognise', () => {
    wrap(<DetailsCard card={{ ...base, cardType: 'details' }} />)
    fireEvent.click(screen.getByTestId('details-recognize-btn'))
    expect(send).toHaveBeenCalledWith('recognizeQFDetailsCard', 'sales', undefined)
  })

  it('sends breakdownAxisChangeQFDetailsCard when the header axis resolves a child card', () => {
    wrap(<FilterProvider><AxisButton /><AxisDetails card={{ ...axisCard, cardType: 'details' }} /></FilterProvider>)
    fireEvent.click(screen.getByText('set-axis'))
    expect(send).toHaveBeenCalledWith('breakdownAxisChangeQFDetailsCard', 'sales', undefined)
  })
})

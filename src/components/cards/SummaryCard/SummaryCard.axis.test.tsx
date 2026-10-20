import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryCard } from './SummaryCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'
import { FilterProvider, useFilter } from '../../../context/FilterContext'

const sub = (title: string, keys: Record<string, string>): ISQFMetricCard => ({
  cardName: 'sales',
  cardType: 'summary',
  cardTitle: title,
  keys,
  infoNumbers: [{ displayValue: title, text: 'x', color: '#000' }],
})

const axisCard: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'summary',
  cardTitle: 'Sales',
  filterKeys: { view: 'view' },
  dropdowns: [{ key: 'view', data: [{ key: 'hierarchy', text: 'Zones' }, { key: 'department', text: 'Depts' }] }],
  cards: [sub('ZONE-VAL', { view: 'hierarchy' }), sub('DEPT-VAL', { view: 'department' })],
}

const legacyCard: ISQFMetricCard = {
  ...axisCard,
  dropdowns: [{ key: 'view', data: [{ key: 'WTD', text: 'WTD' }, { key: 'ETD', text: 'ETD' }] }],
  cards: [sub('WTD-VAL', { view: 'WTD' }), sub('ETD-VAL', { view: 'ETD' })],
}

const renderCard = (props: Parameters<typeof SummaryCard>[0]) =>
  render(
    <MemoryRouter>
      <SummaryCard {...props} />
    </MemoryRouter>
  )

describe('SummaryCard breakdown axis', () => {
  it('shows the child card for the childLevel axis and hides the per-card dropdown', () => {
    renderCard({ card: axisCard, axis: 'childLevel' })
    expect(screen.getByText('ZONE-VAL')).toBeDefined()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('switches content when the axis is department', () => {
    renderCard({ card: axisCard, axis: 'department' })
    expect(screen.getByText('DEPT-VAL')).toBeDefined()
  })

  it('keeps the per-card period toggle group for legacy cards', () => {
    renderCard({ card: legacyCard, axis: 'department' })
    expect(screen.getByText('WTD-VAL')).toBeDefined()
    expect(screen.getByRole('group', { name: 'view' })).toBeDefined()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('uses the dropdown behaviour when no axis is provided', () => {
    renderCard({ card: axisCard })
    expect(screen.getByRole('combobox')).toBeDefined()
    expect(screen.getByText('ZONE-VAL')).toBeDefined()
  })
})

function AxisButton({ axis }: { axis: 'childLevel' | 'department' }) {
  const { setSelectedBreakdownAxis } = useFilter()
  return <button onClick={() => setSelectedBreakdownAxis(axis)}>set-{axis}</button>
}

describe('SummaryCard expands on header breakdown change (Angular onBreakdownAxisChanged)', () => {
  const tableCard: ISQFMetricCard = {
    cardName: 'voc',
    cardType: 'summary',
    cardTitle: 'VOC',
    tableData: { type: 'basic', headers: [], rows: [] } as unknown as ISQFMetricCard['tableData'],
  }

  it('starts collapsed and expands when the user changes the breakdown axis', () => {
    render(
      <MemoryRouter>
        <FilterProvider>
          <AxisButton axis="department" />
          <SummaryCard card={tableCard} />
        </FilterProvider>
      </MemoryRouter>
    )
    expect(screen.getByText('Expand')).toBeDefined()
    fireEvent.click(screen.getByText('set-department'))
    expect(screen.getByText('Collapse')).toBeDefined()
  })
})

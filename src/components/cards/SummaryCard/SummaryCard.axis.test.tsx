import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryCard } from './SummaryCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

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

  it('keeps the per-card dropdown for legacy cards', () => {
    renderCard({ card: legacyCard, axis: 'department' })
    expect(screen.getByText('WTD-VAL')).toBeDefined()
    expect(screen.getByRole('combobox')).toBeDefined()
  })

  it('uses the dropdown behaviour when no axis is provided', () => {
    renderCard({ card: axisCard })
    expect(screen.getByRole('combobox')).toBeDefined()
    expect(screen.getByText('ZONE-VAL')).toBeDefined()
  })
})

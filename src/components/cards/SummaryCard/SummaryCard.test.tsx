import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryCard } from './SummaryCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

function renderCard(props: Parameters<typeof SummaryCard>[0]) {
  return render(
    <MemoryRouter>
      <SummaryCard {...props} />
    </MemoryRouter>
  )
}

const baseCard: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'summary',
  cardTitle: 'Sales',
  cardHeader: '#219653',
  infoNumbers: [{ displayValue: '$1.2M', text: 'WTD', color: '#219653' }],
  updatedTime: '2026-06-29T22:00:00Z',
}

describe('SummaryCard', () => {
  it('renders skeleton when isLoading=true', () => {
    renderCard({ isLoading: true })
    expect(document.querySelector('[data-testid="metric-card-skeleton"]')).not.toBeNull()
  })

  it('renders nothing when card.hidden=true', () => {
    const { container } = renderCard({ card: { ...baseCard, hidden: true } })
    expect(container.firstChild).toBeNull()
  })

  it('renders card title', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('Sales')).toBeDefined()
  })

  it('renders KPI displayValue', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('$1.2M')).toBeDefined()
  })

  it('shows recognize button when cardHeader is green (not red/neutral)', () => {
    renderCard({ card: baseCard })
    expect(document.querySelector('[data-testid="recognize-btn"]')).not.toBeNull()
  })

  it('hides recognize button when cardHeader is red (#eb5757)', () => {
    renderCard({ card: { ...baseCard, cardHeader: '#eb5757' } })
    expect(document.querySelector('[data-testid="recognize-btn"]')).toBeNull()
  })

  it('hides recognize button when cardHeader is neutral (#ebecec)', () => {
    renderCard({ card: { ...baseCard, cardHeader: '#ebecec' } })
    expect(document.querySelector('[data-testid="recognize-btn"]')).toBeNull()
  })

  it('renders "Go to details" link when isDetailsPageAvailable', () => {
    renderCard({ card: { ...baseCard, isDetailsPageAvailable: true } })
    expect(screen.getByText(/Go to details/)).toBeDefined()
  })

  it('renders custom drill-down label when customDrillDownText is set', () => {
    renderCard({ card: { ...baseCard, isDetailsPageAvailable: true, customDrillDownText: 'store view' } })
    expect(screen.getByText(/Go to store view/)).toBeDefined()
  })

  it('shows expand toggle when tableData is present', () => {
    renderCard({
      card: {
        ...baseCard,
        tableData: { type: 'basic', headers: ['Name'], data: [] },
        updatedTime: '2026-06-29T22:00:00Z',
      },
    })
    expect(screen.getByTestId('expand-toggle')).toBeDefined()
  })

  it('shows filter error when dropdown combo has no match', () => {
    const cardWithFilters: ISQFMetricCard = {
      ...baseCard,
      cards: [
        { cardName: 'sales-wtd', cardType: 'summary', keys: { period: 'wtd' }, infoNumbers: [] },
      ],
      filterKeys: { period: 'periodDd' },
      dropdowns: [{ key: 'periodDd', data: [{ key: 'mtd', label: 'MTD' }] }],
    }
    renderCard({ card: cardWithFilters })
    expect(screen.getByText(/Data temporarily unavailable/)).toBeDefined()
  })

  it('shows generic error card', () => {
    renderCard({
      card: { ...baseCard, error: { generic: true, support_email: 'help@example.com' } },
    })
    expect(screen.getByText(/unavailable/i)).toBeDefined()
  })

  it('shows Metrics Info button when dataInfo is present', () => {
    renderCard({ card: { ...baseCard, updatedTime: '2026-06-29T22:00:00Z', dataInfo: { title: 'Info', body: '<p>desc</p>' } } })
    expect(screen.getByTestId('metrics-info-btn')).toBeDefined()
  })

  it('opens InfoModal when Metrics Info button is clicked', () => {
    renderCard({ card: { ...baseCard, updatedTime: '2026-06-29T22:00:00Z', dataInfo: { title: 'My Info', body: '<p>desc</p>' } } })
    fireEvent.click(screen.getByTestId('metrics-info-btn'))
    expect(screen.getByText('My Info')).toBeDefined()
  })
})

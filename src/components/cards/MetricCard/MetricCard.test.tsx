// src/components/cards/MetricCard/MetricCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MetricCard } from './MetricCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

function renderCard(props: Parameters<typeof MetricCard>[0]) {
  return render(
    <MemoryRouter>
      <MetricCard {...props} />
    </MemoryRouter>
  )
}

describe('MetricCard', () => {
  it('renders skeleton when isLoading=true', () => {
    renderCard({ isLoading: true })
    expect(document.querySelector('[data-testid="metric-card-skeleton"]')).not.toBeNull()
  })

  it('renders nothing when card.hidden=true', () => {
    const card: ISQFMetricCard = { cardName: 'sales', cardType: 'summary', hidden: true }
    const { container } = renderCard({ card })
    expect(container.firstChild).toBeNull()
  })

  it('renders error when card.error is set', () => {
    const card: ISQFMetricCard = {
      cardName: 'sales',
      cardType: 'summary',
      cardTitle: 'Sales',
      error: { generic: true, support_email: 'support@example.com' },
    }
    renderCard({ card })
    expect(screen.getByTestId('metric-card-error')).toBeDefined()
  })

  it('renders card title when card is valid', () => {
    const card: ISQFMetricCard = {
      cardName: 'sales',
      cardType: 'summary',
      cardTitle: 'Sales',
      cardHeader: 'Sales',
      infoNumbers: [{ val: '$1.2M', label: 'WTD', color: 'positive' }],
    }
    renderCard({ card })
    expect(screen.getByText('Sales')).toBeDefined()
  })

  it('renders error with cut-off time message', () => {
    const card: ISQFMetricCard = {
      cardName: 'sales',
      cardType: 'summary',
      cardTitle: 'Sales',
      error: { cutOffTime: '9:00 AM' },
    }
    renderCard({ card })
    expect(screen.getByText(/9:00 AM/)).toBeDefined()
  })
})

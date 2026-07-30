import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CardSidebar } from './CardSidebar'
import type { ISQFMetricCard } from '../../../types/sqf.types'

const cards: ISQFMetricCard[] = [
  {
    cardName: 'sales',
    cardType: 'summary',
    cardTitle: 'Sales',
    cardHeader: '#219653',
    isDetailsPageAvailable: true,
    infoNumbers: [{ displayValue: '$1.2M', text: 'WTD', color: '#219653' }],
  },
  {
    cardName: 'stockloss',
    cardType: 'summary',
    cardTitle: 'Stock Loss',
    cardHeader: '#eb5757',
    isDetailsPageAvailable: true,
    infoNumbers: [{ displayValue: '1.2%', text: 'WTD', color: '#eb5757' }],
  },
  {
    cardName: 'nolinkcard',
    cardType: 'summary',
    cardTitle: 'No Link',
    cardHeader: '#219653',
    isDetailsPageAvailable: false,
  },
]

function render$(selectedType: string) {
  return render(
    <MemoryRouter>
      <CardSidebar cards={cards} selectedType={selectedType} />
    </MemoryRouter>
  )
}

describe('CardSidebar', () => {
  it('renders only cards where isDetailsPageAvailable=true', () => {
    render$('sales')
    expect(screen.getByText('Sales')).toBeDefined()
    expect(screen.getByText('Stock Loss')).toBeDefined()
    expect(screen.queryByText('No Link')).toBeNull()
  })

  it('renders the first KPI displayValue for each card', () => {
    render$('sales')
    expect(screen.getByText('$1.2M')).toBeDefined()
    expect(screen.getByText('1.2%')).toBeDefined()
  })

  it('marks the selected card with data-selected attribute', () => {
    render$('sales')
    const selected = document.querySelector('[data-selected="true"]')
    expect(selected).not.toBeNull()
    expect(selected?.textContent).toContain('Sales')
  })

  it('renders a "Go to details" link for each card pointing to its details page', () => {
    render$('sales')
    const links = screen.getAllByRole('link', { name: /Go to details/i })
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/quick-facts/details/sales')
    expect(hrefs).toContain('/quick-facts/details/stockloss')
  })

  it('renders nothing when cards array is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <CardSidebar cards={[]} selectedType="sales" />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })
})

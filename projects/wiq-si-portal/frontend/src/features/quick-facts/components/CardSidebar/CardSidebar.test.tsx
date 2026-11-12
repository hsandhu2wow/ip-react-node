import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CardSidebar } from './CardSidebar'
import { mapSeasonalCards } from '../../api/seasonal'
import { seasonalAPI } from '../../../../test/fixtures/seasonal'
import type { ISQFMetricCard } from '../../../../shared/types/sqf.types'

vi.mock('../SeasonalCard/SeasonalBarChart', () => ({ SeasonalBarChart: () => null }))

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
  it('inserts the seasonal legacy summary by sequence and marks its active type', () => {
    const seasonalCard = mapSeasonalCards([seasonalAPI], { node: { apiDepth: 0, code: '', level_desc: '' }, date: '',
      config: { titleText: 'Summer Event', sequence: 2, details: 1, summary: 1, details_last_level: 6 } })[0]
    render(<MemoryRouter><CardSidebar cards={cards} selectedType="seasonal" seasonalCard={seasonalCard}
      cardStatus={{ seasonal: { summary: 1, details: 1, sequence: 2 }, sales: { details: 1, sequence: 3 }, stockloss: { details: 1, sequence: 1 }, nolinkcard: { details: 0, sequence: 4 } }} /></MemoryRouter>)
    const entries = [...document.querySelectorAll('[data-selected]')]
    expect(entries.map(e => e.querySelector('[class*=title], [class*=Title]')?.textContent)).toEqual(['Stock Loss', 'SUMMER EVENT', 'Sales'])
    expect(document.querySelector('[aria-current="page"]')?.textContent).toContain('SUMMER EVENT')
    expect(screen.getAllByRole('link', { name: /Go to details/ }).map(l => l.getAttribute('href'))).toContain('/quick-facts/details/seasonal')
  })

  it('renders details-enabled cards ordered by card-status sequence', () => {
    render(
      <MemoryRouter>
        <CardSidebar
          cards={cards}
          selectedType="sales"
          cardStatus={{
            sales: { sequence: 3, details: 1 },
            stockloss: { sequence: 1, details: 1 },
            nolinkcard: { sequence: 2, details: 0 },
          }}
        />
      </MemoryRouter>
    )
    const titles = Array.from(document.querySelectorAll('[data-selected]')).map(
      el => el.textContent?.match(/Sales|Stock Loss|No Link/)?.[0]
    )
    expect(titles).toEqual(['Stock Loss', 'Sales'])
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

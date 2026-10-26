import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryCard } from './SummaryCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'
import { CardsPreviewContext, type CardsPreviewContextValue } from '../../shared/PreviewDialog/cardsPreviewContext'

function renderCard(props: Parameters<typeof SummaryCard>[0], preview: CardsPreviewContextValue['preview'] = () => Promise.resolve()) {
  return render(
    <MemoryRouter>
      <CardsPreviewContext.Provider value={{ preview, registerPageCards: () => () => {} }}>
        <SummaryCard {...props} />
      </CardsPreviewContext.Provider>
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
  afterEach(() => vi.useRealTimers())
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

  it('keeps recognition available when no header colour is set', () => {
    renderCard({ card: { ...baseCard, cardHeader: undefined } })
    expect(document.querySelector('[data-testid="recognize-btn"]')).not.toBeNull()
  })

  describe('breakdown cards use the resolved child header (Angular setComponentValues)', () => {
    const breakdownCard = (parentHeader: string | undefined, childHeader: string): ISQFMetricCard => ({
      ...baseCard,
      cardHeader: parentHeader,
      filterKeys: { breakdown: 'breakdown' },
      dropdowns: [{ key: 'breakdown', data: [{ key: 'department', text: 'Departments' }] }],
      cards: [{ ...baseCard, cardHeader: childHeader, keys: { breakdown: 'department' } }],
    })

    it('shows recognition and the child colour when only the child header is green', () => {
      renderCard({ card: breakdownCard(undefined, '#219653'), axis: 'department' })
      expect(document.querySelector('[data-testid="recognize-btn"]')).not.toBeNull()
      expect((screen.getByText('Sales').closest('[style]') as HTMLElement).style.borderTopColor).toBe('rgb(33, 150, 83)')
    })

    it('hides recognition when the resolved child header is red', () => {
      renderCard({ card: breakdownCard('#219653', '#EB5757'), axis: 'department' })
      expect(document.querySelector('[data-testid="recognize-btn"]')).toBeNull()
    })
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
      dropdowns: [{ key: 'periodDd', data: [{ key: 'mtd', text: 'MTD' }] }],
    }
    renderCard({ card: cardWithFilters })
    expect(screen.getByText(/Data temporarily unavailable/)).toBeDefined()
  })

  it('shows generic error card', () => {
    renderCard({
      card: { ...baseCard, error: { generic: true, supportEmail: 'help@example.com' } },
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

  it('updates content when a legacy segmented filter is clicked', async () => {
    const cardWithFilters: ISQFMetricCard = {
      ...baseCard,
      cards: [
        { cardName: 'sales-wtd', cardType: 'summary', keys: { period: 'wtd' }, infoNumbers: [{ displayValue: '$1M', text: 'WTD' }] },
        { cardName: 'sales-mtd', cardType: 'summary', keys: { period: 'mtd' }, infoNumbers: [{ displayValue: '$5M', text: 'MTD' }] },
      ],
      filterKeys: { period: 'periodDd' },
      dropdowns: [{ key: 'periodDd', data: [{ key: 'wtd', text: 'WTD' }, { key: 'mtd', text: 'MTD' }] }],
    }
    renderCard({ card: cardWithFilters })
    // Initially shows first subcard (wtd)
    expect(screen.getByText('$1M')).toBeDefined()

    // Legacy (non-axis) dropdowns render as a segmented toggle, like Angular
    fireEvent.click(screen.getByRole('button', { name: 'MTD' }))
    expect(screen.getByText('$5M')).toBeDefined()
  })

  it('toggles explanatory KPI text independently of metric values', () => {
    renderCard({ card: {
      ...baseCard,
      infoNumbers: [
        { displayValue: '$1M', text: 'Sales', infoMessage: 'Includes online orders' },
        { displayValue: '$2M', text: 'Plan' },
      ],
    } })
    expect(screen.queryByText('Includes online orders')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('More info'))
    expect(screen.getByText('Includes online orders')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('More info'))
    expect(screen.queryByText('Includes online orders')).not.toBeInTheDocument()
  })

  it('expands backend HTML sections and respects their initial state', () => {
    renderCard({ card: { ...baseCard, expandable_list: [
      { header: '<b>Closed section</b>', content: '<p>Hidden explanation</p>' },
      { header: 'Open section', content: '<p>Visible explanation</p>', isExpanded: true },
    ] } })
    expect(screen.queryByText('Hidden explanation')).not.toBeInTheDocument()
    expect(screen.getByText('Visible explanation')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Closed section'))
    expect(screen.getByText('Hidden explanation')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Open section'))
    expect(screen.queryByText('Visible explanation')).not.toBeInTheDocument()
  })

  it('disables recognition until the preview has opened', async () => {
    let openPreview!: () => void
    const preview = vi.fn(() => new Promise<void>(resolve => { openPreview = resolve }))
    renderCard({ card: baseCard }, preview)
    const button = screen.getByTestId('recognize-btn')
    fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(preview).toHaveBeenCalledExactlyOnceWith('recognize', [baseCard])
    await act(async () => openPreview())
    expect(button).toBeEnabled()
  })

  it('renders custom KPI HTML and collapses/expands table content', () => {
    renderCard({ card: {
      ...baseCard, subHeading: 'Report explanation',
      customInfoNumbers: '<strong>Custom KPI</strong>', richText: '<p>Metric notes</p>',
      tableData: { headers: ['Location'], data: [{ column0: { displayValue: 'Sydney' } }] },
    } })
    expect(screen.getByText('Custom KPI').tagName).toBe('STRONG')
    expect(screen.getByText('Report explanation')).toBeInTheDocument()
    expect(screen.getByText('Metric notes')).toBeInTheDocument()
    const tableWrapper = screen.getByRole('table').closest('[class*="collapsible"]')!
    const collapsedClass = tableWrapper.className
    fireEvent.click(screen.getByTestId('expand-toggle'))
    expect(screen.getByTestId('expand-toggle')).toHaveTextContent('Collapse')
    expect(tableWrapper.className).not.toBe(collapsedClass)
    fireEvent.click(screen.getByTestId('expand-toggle'))
    expect(tableWrapper.className).toBe(collapsedClass)
  })

  it('distinguishes pending refresh from an expired cutoff and preserves support links', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T09:00:00Z'))
    const pending = renderCard({ card: { ...baseCard, error: { cutOffTime: '10:00:00', cutOffAt: Date.now() + 3_600_000, supportEmail: 'help@example.com' } } })
    expect(screen.getByText(/expected to complete by 10:00:00/)).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/images/Data_refresh_empty_state.svg')
    expect(screen.getByRole('link', { name: 'help@example.com' })).toHaveAttribute('href', 'mailto:help@example.com')
    pending.unmount()
    renderCard({ card: { ...baseCard, error: { cutOffTime: '08:00:00', cutOffAt: Date.now() - 3_600_000, message: 'Refresh delayed' } } })
    expect(screen.getByText('Refresh delayed')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/images/Data_refresh_failed_empty_state.svg')
  })

  it('closes the Metrics Info overlay without removing the card', () => {
    renderCard({ card: { ...baseCard, dataInfo: { title: 'Info', body: '<p>Explanation</p>' } } })
    fireEvent.click(screen.getByTestId('metrics-info-btn'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
  })
})

describe('SummaryCard Angular parity', () => {
  const tableCard: ISQFMetricCard = {
    ...baseCard,
    isDetailsPageAvailable: true,
    tableData: { type: 'basic', headers: ['Name'], data: [] },
  }

  it('auto-expands autoExpandForMobile cards only on mobile browsers (Angular UTIL.browser.mobile)', () => {
    const ua = vi.spyOn(window.navigator, 'userAgent', 'get')
    ua.mockReturnValue('Mozilla/5.0 (Macintosh) Chrome/120 Safari/537.36')
    const { unmount } = renderCard({ card: { ...tableCard, autoExpandForMobile: true } })
    expect(screen.getByTestId('expand-toggle')).toHaveAttribute('aria-expanded', 'false')
    unmount()
    ua.mockReturnValue('Mozilla/5.0 (iPhone) Mobile/15E148 Safari/604.1')
    renderCard({ card: { ...tableCard, autoExpandForMobile: true } })
    expect(screen.getByTestId('expand-toggle')).toHaveAttribute('aria-expanded', 'true')
    ua.mockRestore()
  })

  it('renders the breakdown label and Expand toggle above the table, not in the footer', () => {
    renderCard({ card: tableCard, axis: 'department' })
    const toggle = screen.getByTestId('expand-toggle')
    expect(toggle.closest('[class*="breakdownRow"]')?.textContent).toContain('Departments')
    expect(toggle.closest('[class*="footer"]')).toBeNull()
    fireEvent.click(toggle)
    expect(toggle.textContent).toContain('Collapse')
  })

  it("formats Updated at like Angular's 'MMM d, h:mm a'", () => {
    renderCard({ card: { ...baseCard, updatedTime: new Date(2026, 9, 10, 4, 55).toISOString() } })
    expect(screen.getByText('Updated at Oct 10, 4:55 AM')).toBeDefined()
  })

  it('shows the pending ETA message until the cut-off passes, then the error message', () => {
    const errorCard = (cutOffAt: number): ISQFMetricCard => ({
      ...baseCard,
      error: { message: 'Data refresh failed', cutOffTime: '7:30 AM', cutOffAt },
    })
    const { unmount } = renderCard({ card: errorCard(Date.now() + 60_000) })
    expect(screen.getByText('Data refresh is expected to complete by 7:30 AM')).toBeDefined()
    unmount()
    renderCard({ card: errorCard(Date.now() - 60_000) })
    expect(screen.getByText('Data refresh failed')).toBeDefined()
  })
})

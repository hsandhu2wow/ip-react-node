import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DetailsCard } from './DetailsCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

function renderCard(props: Parameters<typeof DetailsCard>[0]) {
  return render(
    <MemoryRouter>
      <DetailsCard {...props} />
    </MemoryRouter>
  )
}

const baseCard: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'details',
  cardTitle: 'Store 1234',
  cardHeader: '#219653',
  infoNumbers: [{ displayValue: '$1.2M', text: 'WTD', color: '#219653' }],
  updatedTime: '2026-06-29T22:00:00Z',
}

describe('DetailsCard', () => {
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
    expect(screen.getByText('Store 1234')).toBeDefined()
  })

  it('renders KPI value', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('$1.2M')).toBeDefined()
  })

  it('shows recognize button when cardHeader is not red/neutral', () => {
    renderCard({ card: baseCard })
    expect(document.querySelector('[data-testid="details-recognize-btn"]')).not.toBeNull()
  })

  it('hides recognize button when cardHeader is red', () => {
    renderCard({ card: { ...baseCard, cardHeader: '#eb5757' } })
    expect(document.querySelector('[data-testid="details-recognize-btn"]')).toBeNull()
  })

  it('shows updated time in footer', () => {
    renderCard({ card: baseCard })
    expect(screen.getByTestId('details-updated-time')).toBeDefined()
  })

  it('shows Metrics Info button when dataInfo is present', () => {
    renderCard({ card: { ...baseCard, dataInfo: { title: 'Info', body: '<p>body</p>' } } })
    expect(screen.getByTestId('details-metrics-info-btn')).toBeDefined()
  })

  it('opens InfoModal when Metrics Info is clicked', () => {
    renderCard({ card: { ...baseCard, dataInfo: { title: 'My Info', body: '<p>body</p>' } } })
    fireEvent.click(screen.getByTestId('details-metrics-info-btn'))
    expect(screen.getByText('My Info')).toBeDefined()
  })

  it('hides left column when tableOnly=true', () => {
    renderCard({ card: { ...baseCard, tableOnly: true, tableData: { type: 'basic', headers: [], data: [] } } })
    expect(document.querySelector('[data-testid="details-left-col"]')).toBeNull()
  })

  it('shows filter error when no sub-card matches', () => {
    const card: ISQFMetricCard = {
      ...baseCard,
      cards: [{ cardName: 'sales-wtd', cardType: 'details', keys: { period: 'wtd' }, infoNumbers: [] }],
      filterKeys: { period: 'periodDd' },
      dropdowns: [{ key: 'periodDd', icon: 'calendar_today', data: [{ key: 'mtd', text: 'MTD' }] }],
    }
    renderCard({ card })
    expect(screen.getByText(/Data temporarily unavailable/)).toBeDefined()
  })

  it('disables recognition until the existing loading simulation completes', () => {
    vi.useFakeTimers()
    renderCard({ card: baseCard })
    const button = screen.getByTestId('details-recognize-btn')
    fireEvent.click(button)
    expect(button).toBeDisabled()
    act(() => vi.advanceTimersByTime(1500))
    expect(button).toBeEnabled()
  })

  it('switches the content when a legacy dropdown changes', () => {
    renderCard({ card: {
      ...baseCard,
      filterKeys: { period: 'periodDd' },
      dropdowns: [{ key: 'periodDd', data: [{ key: 'wtd', text: 'WTD' }, { key: 'mtd', text: 'MTD' }] }],
      cards: [
        { ...baseCard, keys: { period: 'wtd' }, infoNumbers: [{ displayValue: '$1M', text: 'Week' }] },
        { ...baseCard, keys: { period: 'mtd' }, infoNumbers: [{ displayValue: '$5M', text: 'Month' }] },
      ],
    } })
    expect(screen.getByText('$1M')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mtd' } })
    expect(screen.getByText('$5M')).toBeInTheDocument()
    expect(screen.queryByText('$1M')).not.toBeInTheDocument()
  })

  it('closes Metrics Info while keeping the detail card', () => {
    renderCard({ card: { ...baseCard, dataInfo: { title: 'Details Info', body: '<p>Definition</p>' } } })
    fireEvent.click(screen.getByTestId('details-metrics-info-btn'))
    expect(screen.getByText('Definition')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Store 1234')).toBeInTheDocument()
  })

  it('shows pending versus expired refresh states with the support email', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T09:00:00Z'))
    const pending = renderCard({ card: { ...baseCard, error: { cutOffTime: '10:00:00', supportEmail: 'help@example.com' } } })
    expect(screen.getByText(/expected to complete by 10:00:00/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'help@example.com' })).toHaveAttribute('href', 'mailto:help@example.com')
    pending.unmount()
    renderCard({ card: { ...baseCard, error: { cutOffTime: '08:00:00', message: 'Refresh delayed' } } })
    expect(screen.getByText('Refresh delayed')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/images/Data_refresh_failed_empty_state.svg')
  })
})

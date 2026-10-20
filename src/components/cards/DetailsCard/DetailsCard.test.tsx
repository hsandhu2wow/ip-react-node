import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DetailsCard } from './DetailsCard'
import type { ISQFMetricCard, IQFTree } from '../../../types/sqf.types'

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

  it('lets touch and keyboard users toggle KPI explanations', () => {
    renderCard({ card: {
      ...baseCard, infoNumbers: [{ displayValue: '$1.2M', text: 'Sales', infoMessage: 'Excludes refunds' }],
    } })
    fireEvent.click(screen.getByRole('button', { name: 'More info' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Excludes refunds')
    fireEvent.keyDown(screen.getByRole('button', { name: 'More info' }), { key: 'Enter' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('dismisses a KPI explanation when scrolling moves its anchor', () => {
    renderCard({ card: {
      ...baseCard, infoNumbers: [{ displayValue: '$1.2M', text: 'Sales', infoMessage: 'Excludes refunds' }],
    } })
    fireEvent.click(screen.getByRole('button', { name: 'More info' }))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.scroll(window)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('explains when a card cannot drill down further', () => {
    renderCard({ card: { ...baseCard, canDrillDown: false } })
    expect(screen.getByText('Store 1234')).toHaveAttribute('title', 'No further drill down available')
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

  it('drills generic API cards down via childCode even without isGenericCardApi', () => {
    const onDrillDown = vi.fn()
    const node: IQFTree = {
      name: 'National', code: 'National', level: '0', level_desc: 'National',
      depth: 0, apiDepth: 0, expandable: true,
      children: [{
        name: 'NSW', code: 'NSW', level: '1', level_desc: 'State',
        depth: 1, apiDepth: 1, expandable: true,
      }],
    }
    renderCard({
      card: { ...baseCard, apiType: 'generic', childCode: 'NSW', canDrillDown: true },
      selectedNode: node, onDrillDown,
    })
    fireEvent.click(screen.getByRole('button', { name: 'View Category details' }))
    expect(onDrillDown).toHaveBeenCalledWith('NSW')
  })

  it('keeps non-availability drill-down links when the next level is Store', () => {
    renderCard({
      card: { ...baseCard, apiType: 'generic', childCode: '1234', canDrillDown: true },
      selectedNode: {
        name: 'Area', code: 'A', level: '4', level_desc: 'Area', depth: 4, apiDepth: 4, expandable: true,
        children: [{
          name: 'Store', code: '1234', level: '5', level_desc: 'Store', depth: 5, apiDepth: 5,
          expandable: false,
        }],
      },
    })
    expect(screen.getByRole('button', { name: 'View Category details' })).toBeInTheDocument()
  })

  it('populates the availability department selector and passes the chosen code', () => {
    const onDrillDown = vi.fn()
    const card = {
      ...baseCard, cardName: 'C1Availability', canDrillDown: true,
      children: [{ code: '1234-10', label: 'Produce' }],
    }
    renderCard({
      card, onDrillDown,
      selectedNode: {
        name: 'Area', code: 'A', level: '4', level_desc: 'Area', depth: 4, apiDepth: 4, expandable: true,
        children: [{
          name: 'Store', code: '1234', level: '5', level_desc: 'Store', depth: 5, apiDepth: 5,
          expandable: false,
        }],
      },
    })
    expect(screen.getByRole('option', { name: 'Produce' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Select Department' }), { target: { value: '1234-10' } })
    expect(onDrillDown).toHaveBeenCalledWith('1234-10')
  })

  it('shows an unavailable state instead of stale data when the new axis has no matching card', () => {
    const card: ISQFMetricCard = {
      ...baseCard,
      filterKeys: { view: 'view' },
      dropdowns: [{ key: 'view', data: [{ key: 'hierarchy', text: 'States' }, { key: 'department', text: 'Departments' }] }],
      cards: [{ ...baseCard, keys: { view: 'hierarchy' } }],
    }
    const { rerender } = renderCard({ card, axis: 'childLevel' })
    expect(screen.getByText('$1.2M')).toBeInTheDocument()
    rerender(<MemoryRouter><DetailsCard card={card} axis="department" supportEmail="support@example.com" /></MemoryRouter>)
    expect(screen.getByText('Data temporarily unavailable')).toBeInTheDocument()
    expect(screen.queryByText('$1.2M')).not.toBeInTheDocument()
  })

  it('uses the selected child card header colour after an axis change', () => {
    const card: ISQFMetricCard = {
      ...baseCard,
      filterKeys: { view: 'view' },
      dropdowns: [{ key: 'view', data: [{ key: 'department', text: 'Departments' }] }],
      cards: [{ ...baseCard, cardHeader: '#eb5757', keys: { view: 'department' } }],
    }
    const { container } = renderCard({ card, axis: 'department' })
    expect(container.querySelector('[style*="border-top-color"]')).toHaveStyle({ borderTopColor: '#eb5757' })
  })
})

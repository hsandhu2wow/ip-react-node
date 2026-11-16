import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
const sendAnalytics = vi.hoisted(() => vi.fn())
vi.mock('../../../../shared/utils/analytics', () => ({ sendQFDataToAnalytics: sendAnalytics }))
vi.mock('../../../../shared/context/FilterContext', () => ({ useOptionalFilter: () => ({ selectedNode: { code: '1001' } }) }))
import { MetricCardTabs } from './MetricCardTabs'

describe('MetricCardTabs', () => {
  it('switches between backend table views and an empty view', () => {
    render(<MetricCardTabs tabs={[
      { label: 'Week', tableData: { headers: ['Location'], data: [{ column0: { displayValue: 'Weekly store' } }] } },
      { label: 'Yesterday', tableData: { headers: ['Location'], data: [{ column0: { displayValue: 'Yesterday store' } }] } },
      { label: 'No data' },
    ]} />)
    expect(screen.getByRole('cell', { name: 'Weekly store' })).toBeInTheDocument()
    expect(screen.queryByText('Yesterday store')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Yesterday' }))
    expect(screen.getByRole('cell', { name: 'Yesterday store' })).toBeInTheDocument()
    expect(screen.queryByText('Weekly store')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'No data' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Week' }))
    expect(screen.getByRole('cell', { name: 'Weekly store' })).toBeInTheDocument()
  })

  it('renders API tab names, rich text and reporting times for the selected tab', () => {
    render(<MetricCardTabs tabs={[
      { tabName: 'Overview', richText: '<p>Overview notes</p>', reportingTime: '<b>As at 8am</b>' },
      { tabName: 'Comments', richText: '<p>Customer comments</p>' },
    ]} />)
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Overview notes')).toBeInTheDocument()
    expect(screen.getByText('As at 8am')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Comments' }))
    expect(screen.getByText('Customer comments')).toBeInTheDocument()
    expect(screen.queryByText('Overview notes')).not.toBeInTheDocument()
  })

  it('falls back to the first tab when refreshed data removes the active tab', () => {
    const { rerender } = render(<MetricCardTabs tabs={[
      { label: 'First', richText: 'First content' },
      { label: 'Second', richText: 'Second content' },
    ]} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Second' }))
    rerender(<MetricCardTabs tabs={[{ label: 'Replacement', richText: 'Replacement content' }]} />)
    expect(screen.getByText('Replacement content')).toBeInTheDocument()
    rerender(<MetricCardTabs tabs={[]} />)
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('sends Angular tabChange analytics only when the tab changes', () => {
    sendAnalytics.mockReset()
    render(<MetricCardTabs cardName="sales" isSummary tabs={[{ tabName: 'A', richText: 'a' }, { tabName: 'B', richText: 'b' }]} />)
    fireEvent.click(screen.getByRole('tab', { name: 'A' }))
    expect(sendAnalytics).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: 'B' }))
    expect(sendAnalytics).toHaveBeenCalledWith('tabChangeQFSummaryCard', 'B-sales', '1001')
  })
})

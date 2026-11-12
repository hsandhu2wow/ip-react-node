import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SeasonalDetailsCard, SeasonalSummaryCard } from './SeasonalCard'
import { mapSeasonalCards } from '../../api/seasonal'
import { seasonalAPI } from '../../../../test/fixtures/seasonal'
import { CardsPreviewContext } from '../../../../shared/components/PreviewDialog/cardsPreviewContext'

let portal = 'SI'
vi.mock('../../../../shared/context/AuthContext', () => ({ useAuth: () => ({ user: { portal } }) }))
vi.mock('../../../../shared/context/FilterContext', () => ({ useFilter: () => ({ selectedNode: { code: 'AU' } }), useOptionalFilter: () => ({ selectedNode: { code: 'AU' } }) }))
vi.mock('./SeasonalBarChart', () => ({ SeasonalBarChart: ({ details }: { details?: boolean }) => <div aria-label="Seasonal Sales chart" data-chart-layout={details ? 'details' : 'summary'} /> }))
const analytics = vi.hoisted(() => vi.fn())
vi.mock('../../../../shared/utils/analytics', () => ({ sendQFDataToAnalytics: analytics }))
const card = mapSeasonalCards([seasonalAPI], { node: { apiDepth: 0, code: 'AU', level_desc: 'National' }, date: '',
  config: { titleText: 'Summer Event', sequence: 4, summary: 1, details: 1, summary_start_level: 0, summary_last_level: 6, details_last_level: 5 } })[0]

function wrap(child: React.ReactNode, preview = vi.fn(() => Promise.resolve())) {
  return render(<MemoryRouter initialEntries={['/quick-facts/summary?code=AU&date=2026-10-18']}>
    <CardsPreviewContext.Provider value={{ preview, registerPageCards: () => () => {} }}>{child}</CardsPreviewContext.Provider>
  </MemoryRouter>)
}

describe('legacy Seasonal card shells', () => {
  it('shows numbers, date, chart, location and details link; expands/collapses the table with analytics', () => {
    wrap(<SeasonalSummaryCard card={card} />)
    expect(screen.getByText('SUMMER EVENT')).toBeInTheDocument()
    expect(within(document.querySelector('[class$="__numbers"]')!).getByText('12.35%')).toBeInTheDocument()
    expect(screen.getByText('Sell Thru By Commitment')).toBeInTheDocument()
    expect(within(document.querySelector('.qf-summary-card__numbers')!).getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('1.2K')).toBeInTheDocument()
    expect(screen.getByText('$12.3K')).toBeInTheDocument()
    expect(screen.getByText('National')).toBeInTheDocument()
    expect(screen.getByText('Event-to-date')).toBeInTheDocument()
    expect(screen.getByText('Updated at Oct 18, 7:30 AM')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to details' })).toHaveAttribute('href', '/quick-facts/details/seasonal?code=AU&date=2026-10-18')
    expect(screen.queryByRole('table')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Expand/ }))
    expect(screen.getByRole('table')).toBeVisible()
    expect(analytics).toHaveBeenCalledWith('expandSummaryTable', 'seasonal', 'AU')
    fireEvent.click(screen.getByRole('button', { name: /Collapse/ }))
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('hides expand links without rows, and table-only cards have no numbers or recognize action', () => {
    const { unmount } = wrap(<SeasonalSummaryCard card={{ ...card, tableData: [] }} />)
    expect(screen.queryByRole('button', { name: /Expand/ })).toBeNull()
    unmount()
    wrap(<SeasonalSummaryCard card={{ ...card, tableOnly: true, status: 'White' }} />)
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.queryByText('$12.3K')).toBeNull()
    expect(screen.queryByLabelText('Seasonal Sales chart')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Recognize' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Expand/ })).toBeNull()
  })

  it('recognizes only green cards, passes the legacy card and resets loading after opening', async () => {
    const preview = vi.fn(() => Promise.resolve())
    wrap(<SeasonalSummaryCard card={card} />, preview)
    fireEvent.click(screen.getByRole('button', { name: 'Recognize' }))
    expect(preview).toHaveBeenCalledWith('recognize', [card])
    expect(analytics).toHaveBeenCalledWith('recognizeQFSummaryCard', 'seasonal', 'AU')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Recognize' })).not.toBeDisabled())
  })

  it.each([
    [{ generic: true }, 'Data refresh failed, we are currently investigating', 'Data_refresh_failed_empty_state.svg'],
    [{ generic: 'Unavailable for selection' }, 'Unavailable for selection', 'Data_refresh_failed_empty_state.svg'],
    [{ cutOffTime: '8:30 AM' }, 'Data refresh is expected to complete by 8:30 AM', 'Data_refresh_empty_state.svg'],
    [{ level: true }, 'Quick Facts does not display information at this level', 'Data_refresh_failed_empty_state.svg'],
    [{ wmd: true }, /WMD Metric card is currently unavailable due to source data changes/, 'Data_refresh_failed_empty_state.svg'],
  ])('renders the legacy %j error state', (error, text, image) => {
    wrap(<SeasonalSummaryCard card={{ ...card, error: { ...error, supportEmail: 'help@example.com' } }} />)
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', `/assets/images/${image}`)
    if (!('wmd' in error)) expect(screen.getByRole('link', { name: 'help@example.com' })).toHaveAttribute('href', 'mailto:help@example.com')
    expect(screen.queryByRole('button', { name: 'Recognize' })).toBeNull()
  })

  it('uses BIGW error wording, METRO abbreviated store locations and hides hidden cards', () => {
    portal = 'BIGW'
    const first = wrap(<SeasonalSummaryCard card={{ ...card, error: { generic: true } }} />)
    expect(screen.getByText('This metric card is currently unavailable.')).toBeInTheDocument()
    expect(screen.getByText(/Please see the information banner above/)).toBeInTheDocument()
    first.unmount()
    portal = 'METRO'
    const second = wrap(<SeasonalSummaryCard card={{ ...card, level: 'A very long store name', cardLevel: 'Store', cardCode: '1234' }} />)
    expect(screen.getByText('1234')).toHaveAttribute('title', 'Add your TS getter here')
    expect(screen.queryByText('A very long store name')).toBeNull()
    second.unmount()
    wrap(<SeasonalSummaryCard card={{ ...card, hidden: true }} />)
    expect(screen.queryByText('SUMMER EVENT')).toBeNull()
    portal = 'SI'
  })

  it('shows loading when null and preserves legacy expandTable control visibility', () => {
    const { unmount } = wrap(<SeasonalSummaryCard card={null} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    unmount()
    wrap(<SeasonalSummaryCard card={card} expandTable />)
    expect(screen.queryByRole('table')).toBeNull()
    expect(document.querySelector('.qf-summary-card__table')).toHaveClass('qf-summary-card__table--unscrolled')
    expect(screen.queryByRole('button', { name: /Expand/ })).toBeNull()
    expect(document.getElementById(card.jsId!)).toHaveClass('qf-summary-card')
  })

  it('uses the summary shell for mini details while retaining details chart dimensions', () => {
    wrap(<SeasonalDetailsCard card={card} mini />)
    expect(document.getElementById(card.jsId!)).toHaveClass('qf-summary-card')
    expect(screen.getByLabelText('Seasonal Sales chart')).toHaveAttribute('data-chart-layout', 'details')
    expect(screen.queryByRole('separator')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Expand/ }))
    expect(screen.getByRole('table')).toBeVisible()
  })

  it('renders the details shell with a table, conditional Category KPI and child-level drill-down', () => {
    const details = { ...card, cardType: 'details' as const, level: 'Produce', infoAdditional2Text: '', cardLevel: 'Category' }
    const node = { children: [{ apiDepth: 5, children: [{ level_desc: 'Department' }] }] }
    const drill = vi.fn()
    wrap(<SeasonalDetailsCard card={details} selectedNode={node as never} detailsLastLevel={6} onDrillDown={drill} last />)
    expect(screen.getByText('PRODUCE')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeVisible()
    expect(within(document.querySelector('[class$="__numbers"]')!).getByText('12.35%')).toBeInTheDocument()
    expect(screen.queryByText('$12.3K')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'View Department details' }))
    expect(drill).toHaveBeenCalledWith('AU')
    expect(screen.queryByRole('separator')).toBeNull()
  })
})

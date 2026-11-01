import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MetricCardTable } from './MetricCardTable'
import type { ISQFTableData } from '../../../../shared/types/sqf.types'

const tableData = {
  type: 'comments',
  headers: [{ text: 'Comment', tooltip: 'What the customer said' }, { text: 'Score' }],
  data: [
    { column0: { displayValue: '<b>Great</b> store' }, column1: { displayValue: 9, value: 9, color: '#219653' } },
    { column0: { displayValue: 'Slow checkout' }, column1: { displayValue: 3, value: 3 } },
  ],
  mobileHeaders: ['Feedback'],
  mobileData: [{ column0: { displayValue: 'Mobile only' } }],
  scrollHelpText: { desktop: 'Scroll right' },
  footer: [{ column0: { displayValue: 'Total' } }],
} as unknown as ISQFTableData

const setWidth = (mobile: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: mobile && q.includes('599'), media: q }))

afterEach(() => vi.unstubAllGlobals())

describe('Comments table (Angular sqf-comments-table)', () => {
  it('renders HTML comments with Angular column widths, no footer or scroll help', () => {
    setWidth(false)
    render(<MetricCardTable tableData={tableData} />)
    const table = screen.getByTestId('comments-table')
    expect(within(table).getByText('Great').tagName).toBe('B')
    const [h0, h1] = within(table).getAllByRole('columnheader')
    expect(h0.style.width).toBe('300px')
    expect(h1.style.width).toBe('100px')
    expect(screen.queryByText('Total')).toBeNull()
    expect(screen.queryByTestId('scroll-help')).toBeNull()
    expect(screen.getByText('Column header definitions')).toBeDefined()
  })

  it('sorts by a column header click', () => {
    setWidth(false)
    render(<MetricCardTable tableData={tableData} />)
    fireEvent.click(screen.getByRole('columnheader', { name: /Score/ }))
    const firstRow = screen.getAllByRole('row')[1]
    expect(firstRow.textContent).toContain('Slow checkout')
  })

  it('uses mobileHeaders and mobileData on extra-small screens', () => {
    setWidth(true)
    render(<MetricCardTable tableData={tableData} />)
    expect(screen.getByText('Feedback')).toBeDefined()
    expect(screen.getByText('Mobile only')).toBeDefined()
    expect(screen.queryByText('Slow checkout')).toBeNull()
  })
})

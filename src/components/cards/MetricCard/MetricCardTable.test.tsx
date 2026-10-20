import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MetricCardTable } from './MetricCardTable'
import type { ISQFTableData } from '../../../types/sqf.types'

const cell = (displayValue: string, value: string | number, cssClass?: string) => ({ displayValue, value, cssClass })

const tableData: ISQFTableData = {
  type: 'basic',
  headers: ['State', 'NPS'],
  headersCssClass: ['', 'right-align'],
  sortCol: 'column1',
  sortOrder: 'desc',
  data: [
    { column0: cell('NSW', 'NSW'), column1: cell('10', 10, 'right-align') },
    { column0: cell('VIC', 'VIC'), column1: cell('30', 30, 'right-align') },
    { column0: cell('QLD', 'QLD'), column1: cell('20', 20, 'right-align') },
  ],
  footer: [{ column0: cell('Total', 'Total', 'right-align'), column1: cell('60', 60) }],
}

const firstColumn = () =>
  Array.from(document.querySelectorAll('tbody tr td:first-child')).map(td => td.textContent)

describe('MetricCardTable', () => {
  it('applies the initial API sort, then toggles and switches columns on header click', () => {
    render(<MetricCardTable tableData={tableData} />)
    expect(firstColumn()).toEqual(['VIC', 'QLD', 'NSW'])

    fireEvent.click(screen.getByText('NPS'))
    expect(firstColumn()).toEqual(['NSW', 'QLD', 'VIC'])

    fireEvent.click(screen.getByText('State'))
    expect(firstColumn()).toEqual(['NSW', 'QLD', 'VIC'])
    fireEvent.click(screen.getByText('State'))
    expect(firstColumn()).toEqual(['VIC', 'QLD', 'NSW'])
  })

  it('styles footer cells with the header css class so Total aligns with its column', () => {
    render(<MetricCardTable tableData={tableData} />)
    const footerCells = document.querySelectorAll('tfoot td')
    expect(footerCells[0].className).toBe('')
    expect(footerCells[1].className).toBe('right-align')
  })

  it('renders headerless API tables and their explanatory rich text', () => {
    const { container } = render(<MetricCardTable tableData={{
      ...tableData, tableWithoutHeaders: true, richText: '<p>Figures exclude closed stores.</p>',
    }} />)
    expect(container.querySelector('thead')).toBeNull()
    expect(screen.getByText('VIC')).toBeInTheDocument()
    expect(screen.getByText('Figures exclude closed stores.')).toBeInTheDocument()
  })

  it('preserves API row heights on body and footer rows', () => {
    const { container } = render(<MetricCardTable tableData={{
      ...tableData,
      data: [{ ...tableData.data![0], rowHeight: '64px' }],
      footer: [{ ...tableData.footer![0], rowHeight: '72px' }],
    }} />)
    expect(container.querySelector('tbody tr')).toHaveStyle({ height: '64px' })
    expect(container.querySelector('tfoot tr')).toHaveStyle({ height: '72px' })
  })

  it('collapses a nested row when the breakdown data changes', () => {
    const nested: ISQFTableData = {
      type: 'nested', headers: ['Department'],
      data: [{ key: 'same', column0: cell('Produce', 'Produce'), breakdown_table_data: [{ column0: cell('Apples', 'Apples') }] }],
    }
    const { rerender } = render(<MetricCardTable tableData={nested} />)
    fireEvent.click(screen.getByText('Produce'))
    expect(screen.getByText('Apples')).toBeInTheDocument()
    rerender(<MetricCardTable tableData={{
      ...nested,
      data: [{ key: 'same', column0: cell('Bakery', 'Bakery'), breakdown_table_data: [{ column0: cell('Bread', 'Bread') }] }],
    }} />)
    expect(screen.queryByText('Bread')).not.toBeInTheDocument()
  })
})

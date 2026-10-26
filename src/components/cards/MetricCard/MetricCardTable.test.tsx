import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MetricCardTable } from './MetricCardTable'
import type { ISQFTableData } from '../../../types/sqf.types'

describe('MetricCardTable', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders backend HTML headers/cells, custom classes, fallback values and totals', () => {
    render(<MetricCardTable tableData={{
      headers: [{ text: '<strong>Location</strong>' }, 'Sales'], hasHTMLHeaders: true,
      headersCssClass: ['location-header'],
      data: [{ column0: { displayValue: '<em>Sydney</em>', color: '#219653', cssClass: 'positive' } }],
      footer: [{ column0: { displayValue: 'Total' }, column1: { displayValue: 42 } }],
    }} />)
    expect(screen.getByRole('columnheader', { name: 'Location' })).toHaveClass('location-header')
    expect(screen.getByText('Location').tagName).toBe('STRONG')
    expect(screen.getByText('Sydney').tagName).toBe('EM')
    expect(screen.getByRole('cell', { name: 'Sydney' })).toHaveClass('positive')
    expect(screen.getByText('Sydney').parentElement).toHaveStyle({ color: '#219653' })
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument()
    const footer = screen.getByText('Total').closest('tfoot')!
    expect(within(footer).getByRole('cell', { name: '42' })).toBeInTheDocument()
  })

  it('shows the supplied sort direction and tolerates missing sort values or columns', () => {
    const data = { headers: ['Store', { text: 'Sales' }], sortCol: 'column1', sortOrder: 'asc',
      data: [{ column0: { displayValue: 'Zebra' } }, { column0: { displayValue: 'Alpha' } }] }
    const { rerender } = render(<MetricCardTable tableData={data} />)
    expect(screen.getByRole('columnheader', { name: 'Sales' })).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getAllByRole('row').slice(1).map(row => row.textContent)).toEqual(['Zebra-', 'Alpha-'])
    rerender(<MetricCardTable tableData={{ ...data, sortOrder: 'desc' }} />)
    expect(screen.getByRole('columnheader', { name: 'Sales' })).toHaveAttribute('aria-sort', 'descending')
    rerender(<MetricCardTable tableData={{ ...data, sortCol: 'unknown' }} />)
    expect(screen.getAllByRole('columnheader').every(header => header.getAttribute('aria-sort') === 'none')).toBe(true)
  })

  it('expands only one nested parent at a time and collapses it on a second click', () => {
    render(<MetricCardTable tableData={{
      type: 'nested', headers: ['Location', 'Sales'],
      data: [
        { key: 'north', column0: { displayValue: 'North' }, breakdown_table_data: [
          { column0: { displayValue: 'Sydney' }, column1: { displayValue: 10 } },
        ] },
        { column0: { displayValue: 'South' }, breakdown_table_data: [
          { column0: { displayValue: 'Melbourne' } },
        ] },
        { column0: { displayValue: 'Leaf' } },
      ],
    }} />)
    expect(screen.queryByText('Sydney')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('North'))
    expect(screen.getByText('Sydney')).toBeInTheDocument()
    expect(screen.getByText('expand_more')).toBeInTheDocument()
    fireEvent.click(screen.getByText('South'))
    expect(screen.queryByText('Sydney')).not.toBeInTheDocument()
    expect(screen.getByText('Melbourne')).toBeInTheDocument()
    fireEvent.click(screen.getByText('South'))
    expect(screen.queryByText('Melbourne')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Leaf'))
    expect(screen.queryByText('expand_more')).not.toBeInTheDocument()
  })

  it('shows a frozen-column overflow shadow only while more columns remain to scroll', () => {
    const data = { freeze_first_column: true, headers: ['Store'], data: [{ column0: { displayValue: 'Sydney' } }] }
    const { rerender, unmount } = render(<MetricCardTable tableData={data} />)
    const table = screen.getByRole('table')
    const scroller = table.parentElement!
    const shadowWrapper = scroller.parentElement!
    const baseClass = shadowWrapper.className
    Object.defineProperties(scroller, {
      scrollWidth: { configurable: true, value: 600 },
      clientWidth: { configurable: true, value: 200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    })
    fireEvent(window, new Event('resize'))
    expect(shadowWrapper.className).not.toBe(baseClass)
    scroller.scrollLeft = 400
    fireEvent.scroll(scroller)
    expect(shadowWrapper.className).toBe(baseClass)
    scroller.scrollLeft = 0
    fireEvent.scroll(scroller)
    expect(shadowWrapper.className).not.toBe(baseClass)
    rerender(<MetricCardTable tableData={{ ...data, freeze_first_column: false }} />)
    expect(shadowWrapper.className).toBe(baseClass)
    const removeListener = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('renders nothing for absent headers and rows', () => {
    const { container } = render(<MetricCardTable tableData={{}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

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

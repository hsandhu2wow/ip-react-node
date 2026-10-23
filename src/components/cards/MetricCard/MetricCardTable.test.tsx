import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MetricCardTable } from './MetricCardTable'

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
    expect(screen.getByRole('cell', { name: 'Sydney' })).toHaveStyle({ color: '#219653' })
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument()
    const footer = screen.getByText('Total').closest('tfoot')!
    expect(within(footer).getByRole('cell', { name: '42' })).toBeInTheDocument()
  })

  it('shows the supplied sort direction without reordering backend rows', () => {
    const data = { headers: ['Store', { text: 'Sales' }], sortCol: 'column1', sortOrder: 'asc',
      data: [{ column0: { displayValue: 'Zebra' } }, { column0: { displayValue: 'Alpha' } }] }
    const { rerender } = render(<MetricCardTable tableData={data} />)
    expect(within(screen.getByRole('columnheader', { name: /Sales/ })).getByText('arrow_upward')).toBeInTheDocument()
    expect(screen.getAllByRole('row').slice(1).map(row => row.textContent)).toEqual(['Zebra-', 'Alpha-'])
    rerender(<MetricCardTable tableData={{ ...data, sortOrder: 'desc' }} />)
    expect(screen.getByText('arrow_downward')).toBeInTheDocument()
    rerender(<MetricCardTable tableData={{ ...data, sortCol: 'unknown' }} />)
    expect(screen.queryByText('arrow_upward')).not.toBeInTheDocument()
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
    const baseClass = scroller.className
    Object.defineProperties(scroller, {
      scrollWidth: { configurable: true, value: 600 },
      clientWidth: { configurable: true, value: 200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    })
    fireEvent(window, new Event('resize'))
    expect(scroller.className).not.toBe(baseClass)
    scroller.scrollLeft = 400
    fireEvent.scroll(scroller)
    expect(scroller.className).toBe(baseClass)
    scroller.scrollLeft = 0
    fireEvent.scroll(scroller)
    expect(scroller.className).not.toBe(baseClass)
    rerender(<MetricCardTable tableData={{ ...data, freeze_first_column: false }} />)
    expect(scroller.className).toBe(baseClass)
    const removeListener = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('renders nothing for absent headers and rows', () => {
    const { container } = render(<MetricCardTable tableData={{}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

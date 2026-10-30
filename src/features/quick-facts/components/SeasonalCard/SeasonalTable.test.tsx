import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SeasonalTable } from './SeasonalTable'
import { mapSeasonalCards } from '../../api/seasonal'
import { seasonalAPI } from '../../../../test/fixtures/seasonal'

const rows = mapSeasonalCards([seasonalAPI], { node: { apiDepth: 0, code: '', level_desc: '' }, date: '' })[0].tableData!

describe('SeasonalTable', () => {
  it('uses default columns, titlecases state, colours cells and displays the zero-sales info line', () => {
    render(<SeasonalTable tableData={rows} childCode="AU" cardLevel="State" zeroSalesSohArticles={8} />)
    expect(screen.getAllByRole('columnheader').map(c => c.textContent)).toEqual([
      'Focus Segments', 'CommitSell Thru', 'SOH Sell Thru', 'SalesQTY', 'QTYvs LY', 'Sales', 'Sales vs LY',
    ])
    expect(screen.getByText('Zulu Focus')).toBeInTheDocument()
    expect(screen.getByText('-40.25%')).toHaveClass('qf-table__data--negative')
    expect(screen.getByText('$1.2K')).toHaveAttribute('title', '$1,200.75')
    expect(screen.getByText('Article Count of SOH & No Sales: 8')).toBeInTheDocument()
  })

  it('shows NSLS article columns and rich header in the definitions popup (icon first)', () => {
    render(<SeasonalTable tableData={rows} childCode="AU-NSLS" cardLevel="Department" />)
    expect(screen.getAllByRole('columnheader').map(c => c.textContent)).toEqual([
      'Articles', 'CommitSell Thru', 'Optimized Sell Thru', 'SOH', 'SalesQTY', 'Sales',
    ])
    const banner = screen.getByRole('button', { name: 'Column header definitions' })
    expect(banner.firstElementChild?.textContent).toBe('info_outlined')
    fireEvent.click(banner)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('The metric provides list of articles which have SOH but No Sales /Low Sales.').tagName).toBe('STRONG')
    expect(within(dialog).getByText(/This metric represents a target sell-through rate/)).toBeInTheDocument()
    expect(within(dialog).queryByText(/Note :Overall/)).toBeNull()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('uses Category at Department level and includes the definitions footer note', () => {
    render(<SeasonalTable tableData={rows} childCode="AU" cardLevel="Department" zeroSalesSohArticles={0} />)
    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Column header definitions' }))
    expect(screen.getByText('Note :Overall metric values will be slightly different from category metric values')).toBeInTheDocument()
    expect(screen.queryByText(/Article Count/)).toBeNull()
  })

  it('keeps API order initially (salesWTD does not exist), then sorts numerically by raw Sales on click', () => {
    const data = [rows[0], { ...rows[0], state: 'alpha', salesETD: '$20', salesETDUnFormatted: 20 }]
    render(<SeasonalTable tableData={data} childCode="AU" cardLevel="State" />)
    const states = () => screen.getAllByRole('row').slice(1).map(r => r.firstElementChild?.textContent)
    expect(states()).toEqual(['Zulu Focus', 'Alpha'])
    const sales = screen.getByRole('columnheader', { name: /^Sales$/ })
    expect(sales).toHaveAttribute('aria-sort', 'none')
    fireEvent.click(within(sales).getByRole('button'))
    expect(states()).toEqual(['Alpha', 'Zulu Focus'])
    expect(sales).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(within(sales).getByRole('button'))
    expect(states()).toEqual(['Zulu Focus', 'Alpha'])
    expect(sales).toHaveAttribute('aria-sort', 'descending')
  })
})

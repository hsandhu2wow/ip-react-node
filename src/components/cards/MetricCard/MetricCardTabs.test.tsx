import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
    fireEvent.click(screen.getByRole('button', { name: 'Yesterday' }))
    expect(screen.getByRole('cell', { name: 'Yesterday store' })).toBeInTheDocument()
    expect(screen.queryByText('Weekly store')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'No data' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Week' }))
    expect(screen.getByRole('cell', { name: 'Weekly store' })).toBeInTheDocument()
  })
})

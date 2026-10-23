import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  afterEach(() => vi.useRealTimers())

  it('enforces inclusive date bounds and returns a padded ISO date', () => {
    const onSelect = vi.fn()
    render(<DatePicker selectedDate="2026-10-08" minDate="2026-10-05" maxDate="2026-10-10" onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: '8' })).toHaveAttribute('aria-current', 'date')
    expect(screen.getByRole('button', { name: '4' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '11' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(onSelect.mock.calls).toEqual([['2026-10-05'], ['2026-10-10']])
  })

  it('navigates across year boundaries in both directions', () => {
    render(<DatePicker selectedDate="2026-01-15" minDate="" maxDate="" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('DEC 2025')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText('JAN 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText('FEB 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('JAN 2026')).toBeInTheDocument()
  })

  it('renders leap day and handles a month starting on Monday', () => {
    render(<DatePicker selectedDate="2016-02-15" minDate="" maxDate="" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: '29' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '30' })).not.toBeInTheDocument()
    expect(screen.queryByText('FEB', { exact: true })).not.toBeInTheDocument()
  })

  it('opens the current month when no date is selected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 20, 12))
    render(<DatePicker selectedDate="" minDate="" maxDate="" onSelect={vi.fn()} />)
    expect(screen.getByText('OCT 2026')).toBeInTheDocument()
  })
})

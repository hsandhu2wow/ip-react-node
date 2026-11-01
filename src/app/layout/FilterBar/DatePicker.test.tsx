import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  afterEach(() => vi.useRealTimers())

  it('enforces inclusive date bounds and returns a padded ISO date', () => {
    const onSelect = vi.fn()
    render(<DatePicker selectedDate="2026-10-08" minDate="2026-10-05" maxDate="2026-10-10" onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: '8 OCT 2026' })).toHaveAttribute('aria-current', 'date')
    expect(screen.getByRole('button', { name: '4 OCT 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '11 OCT 2026' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '4 OCT 2026' }))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '5 OCT 2026' }))
    fireEvent.click(screen.getByRole('button', { name: '10 OCT 2026' }))
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
    expect(screen.getByRole('button', { name: '29 FEB 2016' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '30 FEB 2016' })).not.toBeInTheDocument()
    expect(screen.getByText('FEB', { selector: 'td' })).toHaveAttribute('colspan', '7')
  })

  it('opens the current month when no date is selected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 20, 12))
    render(<DatePicker selectedDate="" minDate="" maxDate="" onSelect={vi.fn()} />)
    expect(screen.getByText('OCT 2026')).toBeInTheDocument()
  })
})

const base = { selectedDate: '2026-10-19', minDate: '2026-09-19', maxDate: '2026-10-19' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DatePicker (Angular mat-calendar parity)', () => {
  it('disables navigation past the min/max month', () => {
    render(<DatePicker {...base} onSelect={() => {}} />)
    expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(true)
    const prev = screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement
    expect(prev.disabled).toBe(false)
    fireEvent.click(prev)
    expect(screen.getByRole('button', { name: 'Choose month and year' }).textContent).toContain('SEPT 2026')
    expect((screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('puts the month label in its own row when fewer than 3 leading days', () => {
    const { rerender } = render(<DatePicker {...base} onSelect={() => {}} />)
    expect(screen.getByText('OCT', { selector: 'td' }).getAttribute('colspan')).toBe('3')
    rerender(<DatePicker {...base} selectedDate="2026-09-20" onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('SEPT', { selector: 'td' }).getAttribute('colspan')).toBe('7')
  })

  it('switches to the multi-year view, then year view, then month view', () => {
    const onSelect = vi.fn()
    render(<DatePicker {...base} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose month and year' }))
    expect(screen.getByRole('button', { name: 'Choose date' }).textContent).toContain('2003 – 2026')
    expect((screen.getByRole('button', { name: '2025' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Previous 24 years' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '2026' }))
    expect(screen.getByText('2026', { selector: 'td' }).getAttribute('colspan')).toBe('4')
    expect((screen.getByRole('button', { name: 'AUG' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'SEPT' }))
    expect(screen.getByRole('button', { name: 'Choose month and year' }).textContent).toContain('SEPT 2026')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('returns to the month view when the period button is clicked in the year view', () => {
    render(<DatePicker {...base} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose month and year' }))
    fireEvent.click(screen.getByRole('button', { name: '2026' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose date' }))
    expect(screen.getByRole('button', { name: 'Choose month and year' }).textContent).toContain('OCT 2026')
  })

  it('shows the WTD/Day toggle only at <=768px (Angular sqf-calendar-header)', () => {
    const onPeriodChange = vi.fn()
    vi.stubGlobal('innerWidth', 1024)
    const { unmount } = render(<DatePicker {...base} period="WTD" onPeriodChange={onPeriodChange} onSelect={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Day' })).toBeNull()
    unmount()
    vi.stubGlobal('innerWidth', 360)
    render(<DatePicker {...base} period="WTD" onPeriodChange={onPeriodChange} onSelect={() => {}} />)
    const panel = screen.getByRole('dialog')
    fireEvent.click(within(panel).getByRole('button', { name: 'Day' }))
    expect(onPeriodChange).toHaveBeenCalledWith('YDAY')
  })
})

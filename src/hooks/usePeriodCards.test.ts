import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('../context/FilterContext', () => ({ useFilter: vi.fn() }))

import { usePeriodCards } from './usePeriodCards'
import { useFilter } from '../context/FilterContext'

const mockUseFilter = useFilter as ReturnType<typeof vi.fn>
const c = (cardName: string) => ({ cardName, cardType: 'summary' as const })

describe('usePeriodCards', () => {
  beforeEach(() => mockUseFilter.mockReturnValue({ selectedPeriod: 'WTD' }))

  it('returns the selected period cards', () => {
    mockUseFilter.mockReturnValue({ selectedPeriod: 'YDAY' })
    const { result } = renderHook(() => usePeriodCards({ WTD: [c('w')], YDAY: [c('y')] }))
    expect(result.current.cards[0].cardName).toBe('y')
    expect(result.current.hasMultiplePeriods).toBe(true)
  })

  it('falls back to the available period and hides the toggle', () => {
    mockUseFilter.mockReturnValue({ selectedPeriod: 'YDAY' })
    const { result } = renderHook(() => usePeriodCards({ WTD: [c('w')] }))
    expect(result.current.activePeriod).toBe('WTD')
    expect(result.current.cards[0].cardName).toBe('w')
    expect(result.current.hasMultiplePeriods).toBe(false)
  })

  it('keeps the toggle visible while data is loading', () => {
    const { result } = renderHook(() => usePeriodCards(undefined))
    expect(result.current.cards).toEqual([])
    expect(result.current.hasMultiplePeriods).toBe(true)
  })

  it('exposes per-period sortBy', () => {
    const { result } = renderHook(() => usePeriodCards({ WTD: { cards: [c('w')], sortBy: 'Z - A' } }))
    expect(result.current.sortBy).toBe('Z - A')
  })
})

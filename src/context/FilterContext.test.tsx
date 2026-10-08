import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { FilterProvider, useFilter } from './FilterContext'

const wrapper =
  (url: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>
      <FilterProvider>{children}</FilterProvider>
    </MemoryRouter>
  )

describe('FilterContext period/axis', () => {
  it('defaults to WTD and childLevel', () => {
    const { result } = renderHook(() => useFilter(), { wrapper: wrapper('/') })
    expect(result.current.selectedPeriod).toBe('WTD')
    expect(result.current.selectedBreakdownAxis).toBe('childLevel')
  })

  it('initialises from the URL and ignores invalid values', () => {
    const a = renderHook(() => useFilter(), { wrapper: wrapper('/?period=YDAY&axis=department') })
    expect(a.result.current.selectedPeriod).toBe('YDAY')
    expect(a.result.current.selectedBreakdownAxis).toBe('department')
    const b = renderHook(() => useFilter(), { wrapper: wrapper('/?period=bogus&axis=nope') })
    expect(b.result.current.selectedPeriod).toBe('WTD')
    expect(b.result.current.selectedBreakdownAxis).toBe('childLevel')
  })

  it('updates via setters', () => {
    const { result } = renderHook(() => useFilter(), { wrapper: wrapper('/') })
    act(() => result.current.setSelectedPeriod('YDAY'))
    act(() => result.current.setSelectedBreakdownAxis('department'))
    expect(result.current.selectedPeriod).toBe('YDAY')
    expect(result.current.selectedBreakdownAxis).toBe('department')
  })

  it('does not reset period/axis when the date changes', () => {
    const { result } = renderHook(() => useFilter(), { wrapper: wrapper('/') })
    act(() => result.current.setSelectedPeriod('YDAY'))
    act(() => result.current.setSelectedBreakdownAxis('department'))
    act(() => result.current.setSelectedDate('2026-10-01'))
    expect(result.current.selectedPeriod).toBe('YDAY')
    expect(result.current.selectedBreakdownAxis).toBe('department')
  })
})

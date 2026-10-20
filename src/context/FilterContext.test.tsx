import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { FilterProvider, useFilter } from './FilterContext'
import type { ISQFGenericFilter } from '../types/sqf.types'

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

  it('restores location, date, period and breakdown when navigating back and forward', () => {
    const tree: ISQFGenericFilter[] = [{
      name: 'National', code: 'National', level: 0, level_desc: 'National',
      children: [{ name: 'NSW', code: 'NSW', level: 1, level_desc: 'State' }],
    }]
    const { result } = renderHook(() => ({ filter: useFilter(), navigate: useNavigate() }), {
      wrapper: wrapper('/quick-facts/summary?code=National&date=2026-10-10&period=WTD&axis=childLevel'),
    })
    act(() => result.current.filter.initTree(tree))
    act(() => result.current.navigate('/quick-facts/details/sales_v4?code=NSW&date=2026-10-11&period=YDAY&axis=department'))
    expect(result.current.filter.selectedNode?.code).toBe('NSW')
    expect(result.current.filter.selectedDate).toBe('2026-10-11')
    expect(result.current.filter.selectedPeriod).toBe('YDAY')
    expect(result.current.filter.selectedBreakdownAxis).toBe('department')
    act(() => result.current.navigate(-1))
    expect(result.current.filter.selectedNode?.code).toBe('National')
    expect(result.current.filter.selectedDate).toBe('2026-10-10')
    expect(result.current.filter.selectedPeriod).toBe('WTD')
    expect(result.current.filter.selectedBreakdownAxis).toBe('childLevel')
    act(() => result.current.navigate(1))
    expect(result.current.filter.selectedNode?.code).toBe('NSW')
    expect(result.current.filter.selectedPeriod).toBe('YDAY')
  })
})

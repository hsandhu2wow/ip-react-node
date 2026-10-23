import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
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

  const hierarchy: ISQFGenericFilter[] = [{
    name: 'National', code: 'N', level: 0, level_desc: 'National',
    children: [{
      name: 'Sydney', code: '1234', level: 4, level_desc: 'Store',
    }],
  }]

  function useFilterWithUrl() {
    const filter = useFilter()
    const [params] = useSearchParams()
    return { filter, params }
  }

  describe('FilterContext hierarchy and URL integration', () => {
    it('restores the selected location and reporting date from the URL', () => {
      const { result } = renderHook(useFilterWithUrl, {
        wrapper: wrapper('/?code=1234&date=2026-10-18&period=YDAY&axis=department'),
      })
      expect(result.current.filter.isLoaded).toBe(false)
      act(() => result.current.filter.initTree(hierarchy))
      const filter = result.current.filter
      expect(filter.isLoaded).toBe(true)
      expect(filter.selectedDate).toBe('2026-10-18')
      expect(filter.selectedNode?.code).toBe('1234')
      expect(filter.selectedNode?.apiDepth).toBe(4)
      expect(filter.selectedNode?.parent).toBe(filter.treeNodes[0])
      expect(filter.selectedPeriod).toBe('YDAY')
      expect(filter.selectedBreakdownAxis).toBe('department')
    })

    it('falls back to the first selectable location for an unknown code', () => {
      const { result } = renderHook(() => useFilter(), { wrapper: wrapper('/?code=missing') })
      act(() => result.current.initTree(hierarchy))
      expect(result.current.selectedNode?.code).toBe('N')
      expect(result.current.isLoaded).toBe(true)
    })

    it('does not mark an empty or fully hidden hierarchy as loaded', () => {
      const { result } = renderHook(() => useFilter(), { wrapper: wrapper('/') })
      act(() => result.current.initTree([]))
      expect(result.current.isLoaded).toBe(false)
      act(() => result.current.initTree([{
        name: 'Hidden', code: 'H', level: 0, level_desc: 'National', alwaysHidden: true,
      }]))
      expect(result.current.treeNodes).toEqual([])
      expect(result.current.selectedNode).toBeNull()
      expect(result.current.isLoaded).toBe(false)
    })

    it('updates location, date, period and axis without losing unrelated URL parameters', () => {
      const { result } = renderHook(useFilterWithUrl, {
        wrapper: wrapper('/?campaign=retained&date=2026-10-18'),
      })
      act(() => result.current.filter.initTree(hierarchy))
      const store = result.current.filter.treeNodes.find(node => node.code === '1234')!
      act(() => result.current.filter.setSelectedNode(store))
      expect(result.current.filter.selectedNode).toBe(store)
      expect(result.current.params.get('code')).toBe('1234')
      act(() => result.current.filter.setSelectedDate('2026-10-19'))
      act(() => result.current.filter.setSelectedPeriod('YDAY'))
      act(() => result.current.filter.setSelectedBreakdownAxis('department'))
      expect(Object.fromEntries(result.current.params)).toEqual({
        campaign: 'retained', date: '2026-10-19', code: '1234', period: 'YDAY', axis: 'department',
      })
      expect(result.current.filter.selectedNode).toBe(store)
    })
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

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))
vi.mock('../context/FilterContext', () => ({
  useFilter: vi.fn(),
}))
vi.mock('../api/trend', () => ({
  getWeeklyFacts: vi.fn(),
  getMyPlan: vi.fn(),
}))

import { useQuery } from '@tanstack/react-query'
import { useFilter } from '../context/FilterContext'
import { getWeeklyFacts, getMyPlan } from '../api/trend'
import { useTrendData } from './useTrendData'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>
const mockUseFilter = useFilter as ReturnType<typeof vi.fn>
const mockGetWeeklyFacts = getWeeklyFacts as ReturnType<typeof vi.fn>
const mockGetMyPlan = getMyPlan as ReturnType<typeof vi.fn>

describe('useTrendData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('builds the correct query key and enabled flag when loaded with a selected node', () => {
    mockUseFilter.mockReturnValue({ selectedNode: { code: 'National' }, isLoaded: true })
    useTrendData('weekly')
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['trend', 'weekly', 'National'],
        enabled: true,
        staleTime: 0,
      })
    )
  })

  it('is disabled when isLoaded is false', () => {
    mockUseFilter.mockReturnValue({ selectedNode: { code: 'National' }, isLoaded: false })
    useTrendData('weekly')
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('is disabled when there is no selected node code', () => {
    mockUseFilter.mockReturnValue({ selectedNode: null, isLoaded: true })
    useTrendData('weekly')
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('queryFn calls getWeeklyFacts when metric is weekly', async () => {
    mockUseFilter.mockReturnValue({ selectedNode: { code: 'National' }, isLoaded: true })
    useTrendData('weekly')
    const passedArgs = mockUseQuery.mock.calls[0][0]
    await passedArgs.queryFn()
    expect(mockGetWeeklyFacts).toHaveBeenCalledWith('National')
    expect(mockGetMyPlan).not.toHaveBeenCalled()
  })

  it('queryFn calls getMyPlan when metric is myPlan', async () => {
    mockUseFilter.mockReturnValue({ selectedNode: { code: 'National' }, isLoaded: true })
    useTrendData('myPlan')
    const passedArgs = mockUseQuery.mock.calls[0][0]
    await passedArgs.queryFn()
    expect(mockGetMyPlan).toHaveBeenCalledWith('National')
    expect(mockGetWeeklyFacts).not.toHaveBeenCalled()
  })
})

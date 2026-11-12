import { useQuery } from '@tanstack/react-query'
import { useFilter } from '../../../shared/context/FilterContext'
import { getWeeklyFacts, getMyPlan } from '../api/trend'
import type { WfMetric, WfPageData } from '../types/wf.types'

export function useTrendData(metric: WfMetric) {
  const { selectedNode, isLoaded } = useFilter()
  const code = selectedNode?.code

  return useQuery<WfPageData>({
    queryKey: ['trend', metric, code],
    queryFn: () => (metric === 'weekly' ? getWeeklyFacts(code as string) : getMyPlan(code as string)),
    enabled: isLoaded && !!code,
    staleTime: 0,
  })
}

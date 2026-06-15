import { useQuery } from '@tanstack/react-query'
import { getSeasonalMetric } from '../api/sqf'
import { useFilter } from '../context/FilterContext'

export function useSeasonalCard() {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    queryKey: ['sqf', 'seasonal', selectedNode?.apiDepth, selectedNode?.code, selectedDate],
    queryFn: () =>
      getSeasonalMetric(
        selectedNode!.apiDepth,
        selectedDate,
        selectedNode!.code || undefined
      ),
    enabled: isLoaded,
    staleTime: 0,
  })
}

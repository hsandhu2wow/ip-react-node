import { useQuery } from '@tanstack/react-query'
import { getDetailCard } from '../api/sqf'
import { useFilter } from '../../../shared/context/FilterContext'

/**
 * Fetches detail cards for a specific metric type.
 * @param metric Card name from the URL param, e.g. "sales"
 */
export function useDetailsCard(metric: string | undefined) {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    queryKey: ['sqf', 'detail-card', metric, selectedNode?.apiDepth, selectedNode?.code, selectedDate],
    queryFn: () =>
      getDetailCard(
        metric!,
        selectedNode!.apiDepth,
        selectedDate,
        selectedNode!.code || undefined
      ),
    enabled: isLoaded && !!metric,
    staleTime: 0,
  })
}

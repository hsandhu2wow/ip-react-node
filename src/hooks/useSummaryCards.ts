import { useQuery } from '@tanstack/react-query'
import { getSummaryCards } from '../api/sqf'
import { useFilter } from '../context/FilterContext'

/**
 * Fetches summary metric cards for the current filter selection.
 * Auto-refetches whenever selectedNode or selectedDate changes.
 */
export function useSummaryCards() {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    queryKey: ['sqf', 'summary-cards', selectedNode?.apiDepth, selectedNode?.code, selectedDate],
    queryFn: () =>
      getSummaryCards(
        selectedNode!.apiDepth,
        selectedDate,
        selectedNode!.code || undefined
      ),
    enabled: isLoaded,
    staleTime: 0,
  })
}

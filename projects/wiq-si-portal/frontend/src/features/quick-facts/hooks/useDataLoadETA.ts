import { useQuery } from '@tanstack/react-query'
import { getDataLoadETA } from '../api/sqf'
import { mapToETAMap } from '../utils/eta'

export function useDataLoadETA() {
  return useQuery({
    queryKey: ['sqf', 'data-load-eta'],
    queryFn: async () => mapToETAMap(await getDataLoadETA()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })
}

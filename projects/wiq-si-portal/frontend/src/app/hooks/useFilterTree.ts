import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getUniversalFilter } from '../../features/quick-facts/api/sqf'
import { useFilter } from '../../shared/context/FilterContext'

/**
 * Loads the location hierarchy tree from the backend (cached forever).
 * Calls initTree on FilterContext once data arrives.
 */
export function useFilterTree() {
  const { initTree } = useFilter()

  const query = useQuery({
    queryKey: ['sqf', 'filter-tree'],
    queryFn: getUniversalFilter,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  useEffect(() => {
    if (query.data) {
      initTree(query.data)
    }
  }, [query.data, initTree])

  return query
}

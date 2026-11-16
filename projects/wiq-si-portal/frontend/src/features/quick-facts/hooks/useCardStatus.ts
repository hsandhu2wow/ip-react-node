import { useQuery } from '@tanstack/react-query'
import { getSQFCardStatus } from '../api/sqf'

/**
 * Loads the available metric cards configuration (cached forever).
 * Used to know which cards to show and their ordering.
 */
export function useCardStatus() {
  return useQuery({
    queryKey: ['sqf', 'card-status'],
    queryFn: getSQFCardStatus,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

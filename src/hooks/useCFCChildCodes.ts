import { useQuery } from '@tanstack/react-query'
import { getCFCChildCodes } from '../api/sqf'

export function useCFCChildCodes(enabled = true) {
  return useQuery({
    queryKey: ['sqf', 'cfc-child-codes'],
    queryFn: getCFCChildCodes,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

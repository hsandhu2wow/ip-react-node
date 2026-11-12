import { useQuery } from '@tanstack/react-query'
import { getSupportEmail } from '../api/sqf'

export function useSupportEmail() {
  return useQuery({
    queryKey: ['support-email', 'SQF'],
    queryFn: () => getSupportEmail('SQF'),
    staleTime: Infinity,
  })
}

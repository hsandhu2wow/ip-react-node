import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUserDetails } from '../../shared/api/users'
import { useAuth } from '../../shared/context/AuthContext'
import { useCFCChildCodes } from '../../features/quick-facts/hooks/useCFCChildCodes'
import { buildNavGroups } from './navItems'

export function useNavGroups() {
  const { user: authUser } = useAuth()
  const { data: user } = useQuery({ queryKey: ['user-details'], queryFn: getUserDetails, staleTime: Infinity })
  const { data: cfcCodes } = useCFCChildCodes()
  return useMemo(() => {
    const isCfc = cfcCodes ? cfcCodes.includes(String(user?.sqf_area_of_responsibility || '')) : undefined
    return buildNavGroups(user, isCfc, user?.portal || authUser.portal)
  }, [user, cfcCodes, authUser.portal])
}

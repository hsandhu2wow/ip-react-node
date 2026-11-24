import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { IUserDetails } from '../../shared/api/users'
import { getUserDetails } from '../../shared/api/users'
import { getDashboardNavigationSettings } from '../../shared/api/dashboardNavigation'
import { useAuth } from '../../shared/context/AuthContext'
import { useCFCChildCodes } from '../../features/quick-facts/hooks/useCFCChildCodes'
import { buildNavGroups, type NavGroup } from './navItems'

export interface NavGroupsResult {
  groups: NavGroup[]
  user: IUserDetails | undefined
  isCfc: boolean | undefined
  dashboardSettingsError: boolean
}

export function useNavGroups() {
  const { user: authUser } = useAuth()
  const { data: user } = useQuery({ queryKey: ['user-details'], queryFn: getUserDetails, staleTime: Infinity })
  const { data: cfcCodes } = useCFCChildCodes()
  const portal = user?.portal || authUser.portal
  const dashboardSettings = useQuery({
    queryKey: ['dashboard-navigation-settings'],
    queryFn: getDashboardNavigationSettings,
    staleTime: Infinity,
    enabled: Boolean(user && portal !== 'SI'),
  })
  const dashboardSegregation = dashboardSettings.isError
    ? undefined
    : dashboardSettings.data?.dashboard_segregation ?? portal === 'SI'

  const isCfc = useMemo(
    () => cfcCodes ? cfcCodes.includes(String(user?.sqf_area_of_responsibility || '')) : undefined,
    [cfcCodes, user],
  )
  const groups = useMemo(
    () => buildNavGroups(user, isCfc, portal, dashboardSegregation),
    [user, isCfc, portal, dashboardSegregation],
  )

  return useMemo(() => {
    return { groups, user, isCfc, dashboardSettingsError: dashboardSettings.isError }
  }, [groups, user, isCfc, dashboardSettings.isError])
}

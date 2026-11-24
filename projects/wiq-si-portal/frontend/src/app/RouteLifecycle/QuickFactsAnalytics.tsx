import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { getUserDetails } from '../../shared/api/users'
import { useFilter } from '../../shared/context/FilterContext'
import { pushRouteAnalytics } from './routeAnalytics'

export function QuickFactsAnalytics() {
  const { pathname, search } = useLocation()
  const { selectedNode } = useFilter()
  const { data: user, isSuccess } = useQuery({
    queryKey: ['user-details'],
    queryFn: getUserDetails,
    staleTime: Infinity,
  })
  const lastEventKey = useRef<string | null>(null)

  useEffect(() => {
    if (!isSuccess || !selectedNode) return

    const eventKey = `${pathname}${search}:${selectedNode.code}`
    if (lastEventKey.current === eventKey) return
    lastEventKey.current = eventKey

    pushRouteAnalytics({ user, selectedLocation: selectedNode.code })
  }, [isSuccess, pathname, search, selectedNode, user])

  return null
}

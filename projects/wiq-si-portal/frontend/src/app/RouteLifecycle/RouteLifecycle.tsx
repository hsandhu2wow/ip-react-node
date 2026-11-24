import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { getUserDetails, updateIntroVideoFlag } from '../../shared/api/users'
import type { IUserDetails } from '../../shared/api/users'
import { IntroVideoDialog } from '../../shared/components/IntroVideoDialog/IntroVideoDialog'
import { pushRouteAnalytics } from './routeAnalytics'

interface IntroVideo {
  type: 'bqf' | 'sqf' | 'dashboards' | 'psim'
  title: string
  url: string
  flag?: 'bqf_video_flag' | 'sqf_video_flag' | 'dashboards_video_flag'
}

function getIntroVideo(pathname: string, user?: IUserDetails): IntroVideo | null {
  if (pathname.startsWith('/bqf') && user?.bqf_video && !user.bqf_video_flag) {
    return { type: 'bqf', title: 'Welcome to Insights Portal', url: user.bqf_video, flag: 'bqf_video_flag' }
  }
  if (pathname.startsWith('/quick-facts') && user?.sqf_video && !user.sqf_video_flag) {
    return { type: 'sqf', title: 'Welcome to Insights Portal', url: user.sqf_video, flag: 'sqf_video_flag' }
  }
  if (pathname.startsWith('/dashboards') && user?.dashboards_video && !user.dashboards_video_flag) {
    return {
      type: 'dashboards',
      title: 'Welcome to Insights Portal. Click play for an overview of the site.',
      url: user.dashboards_video,
      flag: 'dashboards_video_flag',
    }
  }
  if (
    pathname.startsWith('/price-simulator') &&
    user?.psim_video &&
    localStorage.getItem('psimVideoFlag') !== 'yes' &&
    localStorage.getItem('corsErrorHappened') === 'yes'
  ) {
    return { type: 'psim', title: 'Welcome to Pricing Simulator', url: user.psim_video }
  }
  return null
}

export function RouteLifecycle() {
  const { pathname, search } = useLocation()
  const queryClient = useQueryClient()
  const { data: user, isSuccess } = useQuery({
    queryKey: ['user-details'],
    queryFn: getUserDetails,
    staleTime: Infinity,
  })
  const lastRouteKey = useRef<string | null>(null)
  const [dismissedVideoKey, setDismissedVideoKey] = useState<string | null>(null)
  const video = getIntroVideo(pathname, user)
  const videoKey = video ? `${video.type}:${pathname}` : null

  useEffect(() => {
    if (!isSuccess) return

    const routeKey = `${pathname}${search}`
    if (lastRouteKey.current === routeKey) return
    lastRouteKey.current = routeKey

    if (pathname.startsWith('/quick-facts')) return
    const dashboardType = pathname.startsWith('/dashboards') && pathname.includes('/info')
      ? 'Information Page'
      : undefined
    pushRouteAnalytics({ user, dashboardTitle: undefined, dashboardType })
  }, [isSuccess, pathname, search, user])

  const closeVideo = useCallback(async () => {
    if (!video || !videoKey) return

    if (video.type === 'psim') {
      localStorage.setItem('psimVideoFlag', 'yes')
    } else if (video.flag) {
      await updateIntroVideoFlag({ [video.flag]: 1 })
      queryClient.setQueryData<IUserDetails>(['user-details'], current => ({
        ...current,
        [video.flag!]: 1,
      }))
    }
    setDismissedVideoKey(videoKey)
  }, [queryClient, video, videoKey])

  return video && videoKey !== dismissedVideoKey ? (
    <IntroVideoDialog
      open
      title={video.title}
      videoUrl={video.url}
      onClose={closeVideo}
    />
  ) : null
}

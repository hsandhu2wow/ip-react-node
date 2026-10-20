import client from './client'
import type { WfPageData, WfSubscriptionKey, WfUserSubscription } from '../types/wf.types'

/** Returns Weekly Facts page data for the given location code */
export async function getWeeklyFacts(code: string): Promise<WfPageData> {
  const res = await client.get<WfPageData>(`/wf/${code}`)
  return res.data
}

/** Returns My Plan page data for the given location code */
export async function getMyPlan(code: string): Promise<WfPageData> {
  const res = await client.get<WfPageData>(`/myPlan/${code}`)
  return res.data
}

/** Returns the user's saved email subscription preferences (Angular WeeklyFactsService.getUserSubscription) */
export async function getUserSubscriptions(key: WfSubscriptionKey): Promise<WfUserSubscription> {
  const res = await client.get<WfUserSubscription>(`/${key}/userSubscriptions`)
  return res.data
}

/** Saves email subscription preferences as multipart form data (Angular WeeklyFactsService.updateUserSubscription) */
export async function updateUserSubscriptions(
  key: WfSubscriptionKey,
  locations: string[],
  selectedViews: string[]
): Promise<unknown> {
  const formData = new FormData()
  formData.append('locations', JSON.stringify(locations))
  formData.append('selected_views', JSON.stringify(selectedViews))
  const res = await client.post(`/${key}/updateUserSubscriptions`, formData)
  return res.data
}

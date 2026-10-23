import client from './client'
import type { WfMetric, WfPageData, WfUserSubscriptions } from '../types/wf.types'

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

function subscriptionKey(metric: WfMetric): 'wf' | 'myplan' {
  return metric === 'weekly' ? 'wf' : 'myplan'
}

export async function getTrendSubscriptions(metric: WfMetric): Promise<WfUserSubscriptions> {
  const res = await client.get<WfUserSubscriptions>(`/${subscriptionKey(metric)}/userSubscriptions`)
  return res.data
}

export async function updateTrendSubscriptions(
  metric: WfMetric,
  locations: string[],
  views: string[],
): Promise<unknown> {
  const form = new FormData()
  form.append('locations', JSON.stringify(locations))
  form.append('selected_views', JSON.stringify(views))
  const res = await client.post<unknown>(`/${subscriptionKey(metric)}/updateUserSubscriptions`, form)
  return res.data
}

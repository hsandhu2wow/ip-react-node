import client from './client'
import type { WfPageData } from '../types/wf.types'

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

import client from './client'

/** Row returned by GET /users/userSearch/{name}; employee_name is "Name <email>" */
export interface IUserSearchResult {
  employee_name: string
  employee_number: string
  [key: string]: unknown
}

/** Angular UserService.searchUsers — errors resolve to an empty list. */
export async function searchUsers(name: string): Promise<IUserSearchResult[]> {
  try {
    const res = await client.get<IUserSearchResult[]>(`/users/userSearch/${name}`)
    return res.data
  } catch {
    return []
  }
}

/** Subset of GET /getUserdetails (Angular IUserDetails) used by Quick Facts */
export interface IUserDetails {
  employee_number?: string
  name?: string
  email?: string
  success_factors_role?: string
  profile_photo?: string
  switch_account_url?: string
  logoutUrl?: string
  new_tags?: string[]
  Store_Insights_Role?: string
  portal?: string
  sqf?: number
  sqf_enabled?: boolean
  sqa?: number
  quick_assist_enabled?: boolean | 0 | 1
  sqf_area_of_responsibility?: string
  store_insights_role_desc?: string
  wf?: number
  weekly_facts_enabled?: boolean | 0 | 1
  my_plan_enabled?: boolean | 0 | 1
  bqf?: number
  admin?: number
  psf?: number
  psf_enabled?: boolean | 0 | 1
  act?: number
  sqf_video?: string
  bqf_video?: string
  dashboards_video?: string
  psim_video?: string
  sqf_video_flag?: number
  bqf_video_flag?: number
  dashboards_video_flag?: number
  /** Server-derived: global Stella setting plus ai_insights_whitelisted_users */
  is_stella_enabled?: boolean
  [key: string]: unknown
}

export type IntroVideoFlagUpdate = Partial<
  Pick<IUserDetails, 'sqf_video_flag' | 'bqf_video_flag' | 'dashboards_video_flag'>
>

export async function updateIntroVideoFlag(payload: IntroVideoFlagUpdate): Promise<unknown> {
  return (await client.post('/updatevideoflag', payload)).data
}

let userDetailsPromise: Promise<IUserDetails> | null = null

/** Angular UserService.getUserData — fetched once and cached; failures resolve to {} and allow a retry. */
export function getUserDetails(): Promise<IUserDetails> {
  if (!userDetailsPromise) {
    userDetailsPromise = client
      .get<IUserDetails>('/getUserdetails')
      .then(res => res.data || {})
      .catch(() => {
        userDetailsPromise = null
        return {}
      })
  }
  return userDetailsPromise
}

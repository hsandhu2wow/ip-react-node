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
  Store_Insights_Role?: string
  portal?: string
  [key: string]: unknown
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

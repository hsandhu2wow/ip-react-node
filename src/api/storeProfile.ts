import client from './client'

export interface IQFProfileRole {
  role: string
  name?: string
}

export interface IQFStoreAddress {
  BuildingName?: string
  StreetName?: string
  City?: string
  State?: string
  PostalCode?: string
  Latitude?: string
  Longitude?: string
  SitePhoneNumber?: string
  fullAddress?: string
  [key: string]: string | undefined
}

export interface IQFStoreProfile {
  title?: string
  jsId?: string
  error?: boolean
  storeManagerDetails?: { name?: string; profilePhoto?: string }
  roles?: IQFProfileRole[]
  profile?: Record<string, string | undefined>
  storeAddress?: IQFStoreAddress | null
}

/** Angular SqfCardsService.fetchStoreProfileCard */
export async function getStoreProfileCard(node: { code: string; name: string }): Promise<IQFStoreProfile> {
  try {
    const res = await client.get<IQFStoreProfile>(`/sqf/storeProfileDetails/${node.code}`)
    const data = res.data
    const a = data.storeAddress!
    a.fullAddress = `${a.BuildingName} ${a.StreetName} ${a.City} ${a.State} ${a.PostalCode}`.trim().replace('  ', ' ')
    return { title: node.name, jsId: 'js-profile-card', ...data }
  } catch {
    return { error: true }
  }
}

/** Angular SqfCardsService.fetchRoleNames */
export async function getStoreProfileRoleNames(code: string): Promise<IQFProfileRole[]> {
  const res = await client.get<IQFProfileRole[]>(`/sqf/storeProfileRoleDetails/${code}`)
  return res.data
}

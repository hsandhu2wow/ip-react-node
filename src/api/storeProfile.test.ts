import { describe, it, expect, vi } from 'vitest'
const get = vi.fn()
vi.mock('./client', () => ({ default: { get: (...a: unknown[]) => get(...a) } }))
import { getStoreProfileCard } from './storeProfile'

describe('getStoreProfileCard (Angular fetchStoreProfileCard)', () => {
  it('builds fullAddress, title and jsId', async () => {
    get.mockResolvedValue({ data: { roles: [], profile: {}, storeManagerDetails: {}, storeAddress: { BuildingName: '', StreetName: 'Cnr Park', City: 'Sydney', State: 'NSW', PostalCode: '2000' } } })
    const card = await getStoreProfileCard({ code: '1248', name: 'Town Hall - 1248' })
    expect(get).toHaveBeenCalledWith('/sqf/storeProfileDetails/1248')
    expect(card.storeAddress?.fullAddress).toBe('Cnr Park Sydney NSW 2000')
    expect(card.title).toBe('Town Hall - 1248')
    expect(card.jsId).toBe('js-profile-card')
  })

  it('returns an error card when the request fails or the address is missing', async () => {
    get.mockRejectedValueOnce(new Error('500'))
    expect((await getStoreProfileCard({ code: '1', name: 'a' })).error).toBe(true)
    get.mockResolvedValueOnce({ data: { storeAddress: null } })
    expect((await getStoreProfileCard({ code: '1', name: 'a' })).error).toBe(true)
  })
})

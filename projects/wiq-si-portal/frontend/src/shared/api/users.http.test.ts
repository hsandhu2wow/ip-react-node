import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IUserDetails } from './users'
import { updateIntroVideoFlag } from './users'

describe('updateIntroVideoFlag', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts the selected intro-video flag as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await updateIntroVideoFlag({ sqf_video_flag: 1 })

    const [url, request] = fetchMock.mock.calls[0] as [string | URL, RequestInit]
    expect(String(url)).toContain('/updatevideoflag')
    expect(request).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ sqf_video_flag: 1 }),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('exposes Angular intro-video URLs and persisted flags in the user contract', () => {
    const user: IUserDetails = {
      sqf_video: 'https://drive.google.com/file/d/sqf/view',
      bqf_video: 'https://drive.google.com/file/d/bqf/view',
      dashboards_video: 'https://drive.google.com/file/d/dashboards/view',
      psim_video: 'https://drive.google.com/file/d/psim/view',
      sqf_video_flag: 1,
      bqf_video_flag: 0,
      dashboards_video_flag: 1,
    }

    expect(user.sqf_video_flag).toBe(1)
  })

  it('surfaces failed flag updates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('failed', { status: 500 })))

    await expect(updateIntroVideoFlag({ sqf_video_flag: 1 })).rejects.toThrow('HTTP 500')
  })
})

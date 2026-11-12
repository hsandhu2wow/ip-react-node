import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../../../shared/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import client from '../../../shared/api/client'
import {
  getWeeklyFacts,
  getMyPlan,
  getTrendSubscriptions,
  updateTrendSubscriptions,
  getUserSubscriptions,
  updateUserSubscriptions,
} from './trend'
import type { WfMetric, WfPageData, WfUserSubscriptions } from '../types/wf.types'

const mockClient = vi.mocked(client)

describe('trend API', () => {
  it('reads preferences through the subscription dialog key contract', async () => {
    const data = { subscribed_locations: ['1001'], subscribed_views: ['week_overview'] }
    mockClient.get.mockResolvedValue({ data })
    await expect(getUserSubscriptions('myplan')).resolves.toEqual(data)
    expect(mockClient.get).toHaveBeenCalledWith('/myplan/userSubscriptions')
  })

  it('saves preferences through the subscription dialog key contract', async () => {
    mockClient.post.mockResolvedValue({ data: [] })
    await updateUserSubscriptions('wf', ['National', 'w_retail'], ['week_overview', 'monthly_trend'])
    const [url, body] = mockClient.post.mock.calls[0]
    expect(url).toBe('/wf/updateUserSubscriptions')
    if (!(body instanceof FormData)) throw new Error('Expected a FormData payload')
    expect(body.get('locations')).toBe('["National","w_retail"]')
    expect(body.get('selected_views')).toBe('["week_overview","monthly_trend"]')
  })
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWeeklyFacts', () => {
    it('calls client.get with /wf/{code} and returns res.data', async () => {
      const mockData: WfPageData = {
        cards: [],
        refreshTime: '2024-01-01T00:00:00Z',
      }
      mockClient.get.mockResolvedValue({
        data: mockData,
      })

      const result = await getWeeklyFacts('National')

      expect(mockClient.get).toHaveBeenCalledWith('/wf/National')
      expect(result).toEqual(mockData)
    })

    it('returns WfPageData with full structure', async () => {
      const mockData: WfPageData = {
        config: { ai_insights_enabled: true },
        cards: [
          {
            key: 'card1',
            displayName: 'Test Card',
            cardContents: {
              tableData: {
                headers: [],
                data: [],
              },
            },
          },
        ],
        refreshTime: '2024-01-01T00:00:00Z',
        title: 'Weekly Facts',
      }
      mockClient.get.mockResolvedValue({
        data: mockData,
      })

      const result = await getWeeklyFacts('Store001')

      expect(result).toEqual(mockData)
      expect(result.cards).toHaveLength(1)
      expect(result.title).toBe('Weekly Facts')
    })
  })

  describe('getMyPlan', () => {
    it('calls client.get with /myPlan/{code} and returns res.data', async () => {
      const mockData: WfPageData = {
        cards: [],
        refreshTime: '2024-01-01T00:00:00Z',
      }
      mockClient.get.mockResolvedValue({
        data: mockData,
      })

      const result = await getMyPlan('National')

      expect(mockClient.get).toHaveBeenCalledWith('/myPlan/National')
      expect(result).toEqual(mockData)
    })

    it('returns WfPageData with full structure', async () => {
      const mockData: WfPageData = {
        config: { ai_insights_enabled: false },
        cards: [
          {
            key: 'plan1',
            displayName: 'Plan Card',
            cardContents: {
              tableData: {
                headers: [],
                data: [],
              },
            },
          },
        ],
        refreshTime: '2024-01-01T00:00:00Z',
        title: 'My Plan',
      }
      mockClient.get.mockResolvedValue({
        data: mockData,
      })

      const result = await getMyPlan('Region002')

      expect(result).toEqual(mockData)
      expect(result.cards).toHaveLength(1)
      expect(result.title).toBe('My Plan')
    })
  })

  describe.each<{ metric: WfMetric; prefix: string }>([
    { metric: 'weekly', prefix: '/wf' },
    { metric: 'myPlan', prefix: '/myplan' },
  ])('$metric subscriptions', ({ metric, prefix }) => {
    it('reads subscriptions with the correct endpoint casing and returns res.data', async () => {
      const subscriptions: WfUserSubscriptions = {
        subscribed_locations: ['Store001'],
        subscribed_views: ['sales', 'hours'],
        is_store_user: true,
      }
      mockClient.get.mockResolvedValue({ data: subscriptions })

      await expect(getTrendSubscriptions(metric)).resolves.toEqual(subscriptions)

      expect(mockClient.get).toHaveBeenCalledExactlyOnceWith(`${prefix}/userSubscriptions`)
    })

    it('propagates subscription read rejections', async () => {
      const error = new Error('Subscription read failed')
      mockClient.get.mockRejectedValueOnce(error)

      await expect(getTrendSubscriptions(metric)).rejects.toBe(error)
    })

    it('posts real FormData with JSON arrays and returns res.data', async () => {
      const locations = ['Store001', 'Store002']
      const views = ['sales', 'hours']
      const response = { success: true }
      mockClient.post.mockResolvedValue({ data: response })

      await expect(updateTrendSubscriptions(metric, locations, views)).resolves.toEqual(response)

      expect(mockClient.post).toHaveBeenCalledExactlyOnceWith(
        `${prefix}/updateUserSubscriptions`,
        expect.any(FormData),
      )
      const form = mockClient.post.mock.calls[0][1]
      if (!(form instanceof FormData)) throw new Error('Expected a FormData payload')
      expect(Array.from(form.entries())).toEqual([
        ['locations', JSON.stringify(locations)],
        ['selected_views', JSON.stringify(views)],
      ])
    })

    it('serializes empty arrays when clearing subscriptions', async () => {
      mockClient.post.mockResolvedValue({ data: null })

      await expect(updateTrendSubscriptions(metric, [], [])).resolves.toBeNull()

      const form = mockClient.post.mock.calls[0][1]
      if (!(form instanceof FormData)) throw new Error('Expected a FormData payload')
      expect(form.get('locations')).toBe('[]')
      expect(form.get('selected_views')).toBe('[]')
    })

    it('propagates subscription update rejections', async () => {
      const error = new Error('Subscription update failed')
      mockClient.post.mockRejectedValueOnce(error)

      await expect(updateTrendSubscriptions(metric, ['Store001'], ['sales'])).rejects.toBe(error)
    })
  })
})

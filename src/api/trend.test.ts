import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import client from './client'
import { getWeeklyFacts, getMyPlan, getUserSubscriptions, updateUserSubscriptions } from './trend'
import type { WfPageData } from '../types/wf.types'

const mockClient = vi.mocked(client)

describe('trend API', () => {
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

  describe('subscriptions', () => {
    it('GETs /{key}/userSubscriptions', async () => {
      const data = { subscribed_locations: ['1001'], subscribed_views: ['week_overview'] }
      mockClient.get.mockResolvedValue({ data })

      await expect(getUserSubscriptions('myplan')).resolves.toEqual(data)
      expect(mockClient.get).toHaveBeenCalledWith('/myplan/userSubscriptions')
    })

    it('POSTs multipart form data with JSON-stringified locations and selected_views', async () => {
      mockClient.post.mockResolvedValue({ data: [] })

      await updateUserSubscriptions('wf', ['National', 'w_retail'], ['week_overview', 'monthly_trend'])

      const [url, body] = mockClient.post.mock.calls[0]
      expect(url).toBe('/wf/updateUserSubscriptions')
      expect(body).toBeInstanceOf(FormData)
      const form = body as FormData
      expect(form.get('locations')).toBe('["National","w_retail"]')
      expect(form.get('selected_views')).toBe('["week_overview","monthly_trend"]')
    })
  })
})

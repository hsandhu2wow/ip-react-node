import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
  },
}))

import client from './client'
import { getWeeklyFacts, getMyPlan } from './trend'
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
})

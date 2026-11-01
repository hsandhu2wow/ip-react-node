// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import {
  getMyPlan, getWeeklyFacts, getTrendSubscriptions, updateTrendSubscriptions,
} from './trend'

beforeAll(() => vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } }))
afterAll(() => vi.unstubAllGlobals())

describe('trend HTTP contracts', () => {
  it.each([
    { read: getWeeklyFacts, endpoint: 'wf' },
    { read: getMyPlan, endpoint: 'myPlan' },
  ])('reads $endpoint using exact backend casing', async ({ read, endpoint }) => {
    const data = { cards: [], refreshTime: '2026-10-30T00:00:00Z' }
    server.use(http.get(`*/api/${endpoint}/fixture-store`, () => HttpResponse.json(data)))
    await expect(read('fixture-store')).resolves.toEqual(data)
  })

  it.each([
    { metric: 'weekly' as const, key: 'wf' },
    { metric: 'myPlan' as const, key: 'myplan' },
  ])('reads and saves $metric subscription preferences through HTTP', async ({ metric, key }) => {
    const data = { subscribed_locations: ['fixture-store'], subscribed_views: ['sales'] }
    server.use(
      http.get(`*/api/${key}/userSubscriptions`, () => HttpResponse.json(data)),
      http.post(`*/api/${key}/updateUserSubscriptions`, async ({ request }) => {
        expect(request.credentials).toBe('include')
        expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/)
        const form = await request.formData()
        expect(Array.from(form.entries())).toEqual([
          ['locations', '["fixture-store"]'], ['selected_views', '["sales"]'],
        ])
        return HttpResponse.json({ saved: true })
      }),
    )
    await expect(getTrendSubscriptions(metric)).resolves.toEqual(data)
    await expect(updateTrendSubscriptions(metric, ['fixture-store'], ['sales']))
      .resolves.toEqual({ saved: true })
  })
})

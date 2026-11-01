// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { getFeedbackIssueTypes, submitFeedback } from './feedback'
import { getNPSSurveyFlag, submitNPSSurvey } from './nps'
import { submitRecognize } from './recognition'

beforeAll(() => vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } }))
afterAll(() => vi.unstubAllGlobals())

describe('shared submission HTTP contracts', () => {
  it('loads feedback options and posts files/fields to the exact trailing-slash endpoint', async () => {
    server.use(
      http.get('*/api/feedbackIssuesType/weekly', () => HttpResponse.json(['Incorrect data'])),
      http.post('*/api/feedbackPopup/', async ({ request }) => {
        expect(new URL(request.url).pathname).toBe('/api/feedbackPopup/')
        const form = await request.formData()
        expect(form.get('feedback')).toBe('undefined')
        expect(form.get('contactMe')).toBe('false')
        expect(form.get('issueType')).toBe('Incorrect data')
        expect(form.get('url')).toBe('/quick-facts/weekly?code=fixture')
        const image = form.get('image0')
        expect(image).toBeInstanceOf(File)
        if (image instanceof File) expect(await image.text()).toBe('fixture')
        return HttpResponse.json({ saved: true })
      }),
    )
    await expect(getFeedbackIssueTypes('weekly')).resolves.toEqual(['Incorrect data'])
    await expect(submitFeedback({
      images: [new File(['fixture'], 'fixture.png', { type: 'image/png' })],
      reason: 'Fixture reason', contactMe: false, issueTypeSelected: 'Incorrect data',
      requestOrigin: 'weekly', url: '/quick-facts/weekly?code=fixture',
    })).resolves.toEqual({ saved: true })
  })

  it('preserves NPS endpoint slashes and serializes the optional survey fields', async () => {
    server.use(
      http.get('*/api/triggerNPSSurvey/', () => HttpResponse.json({ sqf: 1 })),
      http.post('*/api/npsSurvey/', async ({ request }) => {
        expect(new URL(request.url).pathname).toBe('/api/npsSurvey/')
        expect(Object.fromEntries(await request.formData())).toEqual({
          feedback: 'Fixture feedback', qaRating: '5', qaFeedback: 'Fixture detail',
          requestOrigin: 'sqf', campaignId: 'fixture', url: '/quick-facts/summary',
        })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await expect(getNPSSurveyFlag()).resolves.toEqual({ sqf: 1 })
    await expect(submitNPSSurvey({
      feedback: 'Fixture feedback', qaRating: '5', qaFeedback: 'Fixture detail',
      requestOrigin: 'sqf', campaignId: 'fixture', url: '/quick-facts/summary',
    })).resolves.toBe('')
  })

  it('preserves recognition access-validation errors for the confirmation flow', async () => {
    server.use(http.post('*/api/sqf/recognize', async ({ request }) => {
      expect((await request.formData()).get('qf_access_validation')).toBe('Y')
      return HttpResponse.json({ status: 'NoQfAccess' }, { status: 403 })
    }))
    const form = new FormData()
    form.append('qf_access_validation', 'Y')
    await expect(submitRecognize(form)).rejects.toMatchObject({
      response: { status: 403, data: { status: 'NoQfAccess' } },
    })
  })
})

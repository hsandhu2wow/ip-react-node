// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { getFeedbackIssueTypes, submitFeedback } from './feedback'
import { getNPSSurveyFlag, submitNPSSurvey } from './nps'
import { submitRecognize } from './recognition'
import { getAlerts, getPopUpAlerts, markPopUpAlertsRead } from './alerts'

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

  it('keeps the Quick Facts alert filter quirk and maps alert icons', async () => {
    const alert = (id: number, type: string, flags: Record<string, number | null>) =>
      ({ id, type, active: 1, sqf: 0, sqa: 0, wf: 0, myplan: 0, bi: 0, bqf: 0, psf: 0, removable: 1, text: `Alert ${id}`, ...flags })
    const served = [
      alert(1, 'new', { sqf: 1 }),
      alert(2, 'warning', { sqf: 1, active: 0 }),
      alert(3, 'danger', { wf: 1, active: 0 }),
      alert(4, 'success', { myplan: 1 }),
      alert(5, 'info', { sqa: 1 }),
      alert(6, 'info', { bi: 1 }),
    ]
    server.use(
      http.get('*/api/alerts', () => HttpResponse.json(served)),
      http.get('*/api/popUpAlerts', () => HttpResponse.json(served)),
    )
    const expected = [
      { id: 1, icon: 'new_releases' },
      { id: 3, icon: 'priority_high' },
      { id: 4, icon: 'done' },
      { id: 5, icon: 'info' },
    ]
    expect((await getAlerts()).map(({ id, icon }) => ({ id, icon }))).toEqual(expected)
    expect((await getPopUpAlerts()).map(({ id, icon }) => ({ id, icon }))).toEqual(expected)
  })

  it('treats empty alert responses as no alerts', async () => {
    server.use(
      http.get('*/api/alerts', () => new HttpResponse(null, { status: 204 })),
      http.get('*/api/popUpAlerts', () => HttpResponse.json([])),
    )
    await expect(getAlerts()).resolves.toEqual([])
    await expect(getPopUpAlerts()).resolves.toEqual([])
  })

  it('posts acknowledged pop-up alerts as a JSON payload field', async () => {
    const popups = [{ id: 7, type: 'info', icon: 'info', active: 1, sqf: 1, removable: 0, text: 'Fixture' }]
    server.use(http.post('*/api/popUpAlerts/read', async ({ request }) => {
      const form = await request.formData()
      expect([...form.keys()]).toEqual(['payload'])
      expect(JSON.parse(String(form.get('payload')))).toEqual(popups)
      return HttpResponse.json({ status: 'ok' })
    }))
    await expect(markPopUpAlertsRead(popups)).resolves.toEqual({ status: 'ok' })
  })
})

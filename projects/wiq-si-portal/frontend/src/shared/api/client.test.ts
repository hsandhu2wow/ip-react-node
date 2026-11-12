// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { createHttpClient, HttpError, isHttpError } from './client'
import { server } from '../../test/server'

// Keep native File/FormData paired with Node Fetch for multipart transport tests.
beforeAll(() => vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } }))
afterAll(() => vi.unstubAllGlobals())
afterEach(() => vi.restoreAllMocks())

describe('Fetch transport', () => {
  const client = () => createHttpClient({ baseURL: '/api' })

  it('joins the API prefix and preserves session credentials', async () => {
    let credentials: RequestCredentials | undefined
    server.use(http.get('*/api/check', ({ request }) => {
      credentials = request.credentials
      return HttpResponse.json({ ready: true })
    }))
    await expect(client().get('/check')).resolves.toEqual({ data: { ready: true } })
    expect(credentials).toBe('include')
  })

  it('supports a configured absolute backend URL and trailing base slash', async () => {
    server.use(http.get('https://backend.example.test/api/check', () => HttpResponse.json([1])))
    await expect(createHttpClient({ baseURL: 'https://backend.example.test/api/' }).get('/check'))
      .resolves.toEqual({ data: [1] })
  })

  it('uses the current origin when no API prefix is configured', async () => {
    server.use(http.get(`${window.location.origin}/check`, () => HttpResponse.json({ ok: true })))
    await expect(createHttpClient({ baseURL: '' }).get('/check')).resolves.toEqual({ data: { ok: true } })
  })

  it('returns explicit text without interpreting JSON-looking text', async () => {
    server.use(http.get('*/api/check', () => HttpResponse.text('"help@example.test"')))
    await expect(client().get('/check', { responseType: 'text' }))
      .resolves.toEqual({ data: '"help@example.test"' })
  })

  it('preserves empty and non-JSON success responses', async () => {
    server.use(http.post('*/api/check', () => new HttpResponse(null, { status: 204 })))
    await expect(client().post('/check')).resolves.toEqual({ data: '' })
    server.use(http.post('*/api/check', () => HttpResponse.text('Saved')))
    await expect(client().post('/check')).resolves.toEqual({ data: 'Saved' })
  })

  it('accepts JSON from legacy endpoints with a text content type', async () => {
    server.use(http.get('*/api/check', () => HttpResponse.text('{"saved":true}')))
    await expect(client().get('/check')).resolves.toEqual({ data: { saved: true } })
  })

  it('submits multipart fields and files with the browser-generated boundary', async () => {
    const form = new FormData()
    form.append('locations', JSON.stringify(['fixture-store']))
    form.append('image0', new File(['image'], 'fixture.png', { type: 'image/png' }))
    server.use(http.post('*/api/check', async ({ request }) => {
      expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/)
      const received = await request.formData()
      expect(received.get('locations')).toBe('["fixture-store"]')
      const file = received.get('image0')
      expect(file).toBeInstanceOf(File)
      if (file instanceof File) {
        expect(file.name).toBe('fixture.png')
        expect(await file.text()).toBe('image')
      }
      return HttpResponse.json({ saved: true })
    }))
    await expect(client().post('/check', form)).resolves.toEqual({ data: { saved: true } })
  })

  it.each([401, 404, 500])('rejects HTTP %s with the structured backend payload', async status => {
    const data = { errorTitle: 'Unavailable', errorMsg: 'Fixture selection failed' }
    server.use(http.get('*/api/check', () => HttpResponse.json(data, { status })))
    const error: unknown = await client().get('/check').catch((error: unknown) => error)
    expect(isHttpError(error)).toBe(true)
    expect(error).toBeInstanceOf(HttpError)
    expect(error).toMatchObject({ response: { status, data } })
  })

  it('rejects non-JSON HTTP errors instead of treating them as successful data', async () => {
    server.use(http.get('*/api/check', () => HttpResponse.text('Session expired', { status: 403 })))
    await expect(client().get('/check')).rejects.toMatchObject({
      response: { status: 403, data: 'Session expired' },
    })
  })

  it('surfaces malformed JSON and network failures', async () => {
    server.use(http.get('*/api/check', () => new HttpResponse('{', {
      headers: { 'Content-Type': 'application/json' },
    })))
    await expect(client().get('/check')).rejects.toBeInstanceOf(SyntaxError)
    server.use(http.get('*/api/check', () => HttpResponse.error()))
    await expect(client().get('/check')).rejects.toBeInstanceOf(TypeError)
  })

  it('retains the HTTP status when an error body contains malformed JSON', async () => {
    server.use(http.get('*/api/check', () => new HttpResponse('{', {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })))
    await expect(client().get('/check')).rejects.toMatchObject({ response: { status: 502, data: '{' } })
  })

  it('aborts timed-out requests and clears its timer', async () => {
    const clear = vi.spyOn(globalThis, 'clearTimeout')
    server.use(http.get('*/api/check', async () => {
      await delay(80)
      return HttpResponse.json({})
    }))
    await expect(createHttpClient({ baseURL: '/api', timeout: 10 }).get('/check'))
      .rejects.toMatchObject({ name: 'TimeoutError' })
    expect(clear).toHaveBeenCalled()
  })

  it('honors caller cancellation', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(client().get('/check', { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
  })
})

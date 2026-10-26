import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { buildSlideRequests, presentationName } from './gcpSlides'
import client from '../api/client'
import type { PreviewCard } from '../components/shared/RecognizeDialog/recognize'

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }))

describe('gcpSlides', () => {
  it('names presentations Quick_Facts_Card_M_d_yy_h_mm_a', () => {
    expect(presentationName(new Date(2024, 2, 5, 14, 7))).toBe('Quick_Facts_Card_3_5_24_2_07_PM')
  })

  describe('Google Slides export workflow', () => {
    type TokenResponse = { access_token?: string; error?: string; error_description?: string }
    type TokenOptions = { client_id: string; scope: string; callback: (response: TokenResponse) => void }
    const card: PreviewCard = {
      jsId: 'sales-card', cardName: 'sales', cardType: 'summary', level: 'National', title: 'Sales',
    }
    const pageSize = () => ({
      width: { magnitude: 9144000, unit: 'EMU' },
      height: { magnitude: 5143500, unit: 'EMU' },
    })

    function setup() {
      const tokenClient = {
        callback: (_response: TokenResponse) => {},
        error_callback: (_error: { message?: string; type?: string }) => {},
        requestAccessToken: vi.fn(),
      }
      const files = {
        list: vi.fn().mockResolvedValue({ result: { files: [{ id: 'existing-folder' }] } }),
        create: vi.fn().mockImplementation(async (request: { resource: { mimeType: string } }) => ({
          result: request.resource.mimeType === 'application/vnd.google-apps.folder'
            ? { id: 'new-folder' }
            : { id: 'presentation', webViewLink: 'https://slides.example.test/presentation' },
        })),
      }
      const presentations = {
        get: vi.fn().mockImplementation(async () => ({
          result: { slides: [{ objectId: 'default-slide' }], pageSize: pageSize() },
        })),
        batchUpdate: vi.fn().mockResolvedValue({}),
      }
      const gapiClient = {
        init: vi.fn().mockResolvedValue(undefined),
        setToken: vi.fn(),
        getToken: vi.fn<() => { access_token: string } | null>().mockReturnValue(null),
        drive: { files },
        slides: { presentations },
      }
      const gapi = {
        load: vi.fn((_name: string, options: { callback: () => void; onerror: (error: unknown) => void }) => options.callback()),
        client: gapiClient,
      }
      const initTokenClient = vi.fn((_options: TokenOptions) => tokenClient)
      vi.stubGlobal('gapi', gapi)
      vi.stubGlobal('google', { accounts: { oauth2: { initTokenClient } } })
      const append = <T extends Node>(node: T): T => Node.prototype.appendChild.call(document.head, node) as T
      const appendScript = vi.spyOn(document.head, 'appendChild').mockImplementation(node => {
        const result = append(node)
        queueMicrotask(() => node.dispatchEvent(new Event('load')))
        return result
      })
      const open = vi.spyOn(window, 'open').mockReturnValue(null)
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.mocked(client.post).mockReset().mockImplementation(async url => ({
        data: url === '/uploadImageForSlide'
          ? { status: 'success', url: 'https://images.example.test/sales.jpeg' }
          : { status: 'success' },
      }))
      const canvas = document.createElement('canvas')
      vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,YWJj')
      const callback = vi.fn()
      const showSnack = vi.fn()
      return {
        tokenClient, files, presentations, gapiClient, gapi, initTokenClient,
        appendScript, open, consoleError, consoleLog, canvas, callback, showSnack,
      }
    }

    beforeEach(() => {
      vi.resetModules()
      vi.useFakeTimers()
      vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-api-key')
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
    })

    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
      document.head.querySelectorAll('script').forEach(script => script.remove())
    })

    async function start(context: ReturnType<typeof setup>, cards: PreviewCard[] = [card]) {
      const { initSlideCreation } = await import('./gcpSlides')
      initSlideCreation('summary', cards, [context.canvas], context.callback, context.showSnack)
      await vi.runAllTimersAsync()
      return initSlideCreation
    }

    async function authorize(context: ReturnType<typeof setup>) {
      context.tokenClient.callback({ access_token: 'test-token' })
      await vi.runAllTimersAsync()
    }

    it('uploads the image, reuses a Drive folder, builds titled slides, then opens and cleans up after completion', async () => {
      const context = setup()
      const invalidCard: PreviewCard = { ...card, error: { generic: true } }
      await start(context, [invalidCard, card])

      expect(context.appendScript).toHaveBeenCalledTimes(2)
      expect(context.gapiClient.init).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        discoveryDocs: [
          'https://slides.googleapis.com/$discovery/rest?version=v1',
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        ],
      })
      expect(context.initTokenClient).toHaveBeenCalledWith(expect.objectContaining({
        client_id: 'test-client-id',
        scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive',
      }))
      expect(context.tokenClient.requestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' })
      expect(client.post).not.toHaveBeenCalled()

      context.tokenClient.callback({ access_token: 'test-token' })
      await vi.advanceTimersByTimeAsync(499)
      expect(client.post).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)

      expect(context.gapiClient.setToken).toHaveBeenCalledWith({ access_token: 'test-token' })
      expect(context.canvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 1)
      const upload = vi.mocked(client.post).mock.calls[0]
      expect(upload[0]).toBe('/uploadImageForSlide')
      const file = (upload[1] as FormData).get('image') as File
      expect(file.name).toBe('sales-card.jpeg')
      expect(file.type).toBe('image/jpeg')
      expect(file.size).toBe(3)
      expect(context.files.create).toHaveBeenCalledExactlyOnceWith({
        resource: {
          name: expect.stringMatching(/^Quick_Facts_Card_/),
          mimeType: 'application/vnd.google-apps.presentation',
          parents: ['existing-folder'],
        },
        fields: 'id, webViewLink',
      })
      expect(context.presentations.get).toHaveBeenCalledWith({ presentationId: 'presentation' })
      expect(context.presentations.batchUpdate).toHaveBeenCalledWith({
        presentationId: 'presentation',
        requests: buildSlideRequests([card], 'default-slide', pageSize(), ['https://images.example.test/sales.jpeg']),
      })
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.open).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(100)
      expect(context.open).toHaveBeenCalledWith('https://slides.example.test/presentation', '_blank')
      const deletion = vi.mocked(client.post).mock.calls[1]
      expect(deletion[0]).toBe('/deleteImageForSlide')
      expect((deletion[1] as FormData).get('url')).toBe('https://images.example.test/sales.jpeg')
      expect(context.showSnack).not.toHaveBeenCalled()
    })

    it('creates a missing folder and reuses loaded SDKs and the OAuth client on later exports', async () => {
      const context = setup()
      context.files.list.mockResolvedValue({ result: { files: [] } })
      const initSlideCreation = await start(context)
      await authorize(context)
      expect(context.files.create).toHaveBeenCalledWith({
        resource: { name: 'QuickFacts', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      })
      expect(context.files.create).toHaveBeenCalledWith(expect.objectContaining({
        resource: expect.objectContaining({ parents: ['new-folder'] }),
      }))

      context.gapiClient.getToken.mockReturnValue({ access_token: 'existing-token' })
      const secondCallback = vi.fn()
      initSlideCreation(null, [card], [context.canvas], secondCallback, context.showSnack)
      await vi.runAllTimersAsync()
      expect(context.tokenClient.requestAccessToken).toHaveBeenLastCalledWith({ prompt: '' })
      await authorize(context)
      expect(secondCallback).toHaveBeenCalledOnce()
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.appendScript).toHaveBeenCalledTimes(2)
      expect(context.gapiClient.init).toHaveBeenCalledOnce()
      expect(context.initTokenClient).toHaveBeenCalledOnce()
    })

    it('reports missing configuration without loading scripts or requesting authorization', async () => {
      const context = setup()
      vi.stubEnv('VITE_GOOGLE_API_KEY', '')
      await start(context)
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.showSnack).toHaveBeenCalledWith('Missing Client and API key', 'error')
      expect(context.appendScript).not.toHaveBeenCalled()
      expect(context.tokenClient.requestAccessToken).not.toHaveBeenCalled()
    })

    it('reports script failures and retries a failed script on the next export', async () => {
      const context = setup()
      const append = <T extends Node>(node: T): T => Node.prototype.appendChild.call(document.head, node) as T
      context.appendScript.mockImplementationOnce(node => {
        const result = append(node)
        queueMicrotask(() => node.dispatchEvent(new Event('error')))
        return result
      })
      const initSlideCreation = await start(context)
      expect(context.showSnack).toHaveBeenCalledWith('Failed to load https://apis.google.com/js/api.js', 'error')
      expect(context.callback).toHaveBeenCalledOnce()
      initSlideCreation(null, [card], [context.canvas], vi.fn(), context.showSnack)
      await vi.runAllTimersAsync()
      expect(context.appendScript).toHaveBeenCalledTimes(3)
      expect(context.tokenClient.requestAccessToken).toHaveBeenCalledOnce()
    })

    it('unwraps SDK initialization errors and retries initialization on a later export', async () => {
      const context = setup()
      context.gapiClient.init.mockRejectedValueOnce({ result: { error: { message: 'SDK unavailable' } } })
      const initSlideCreation = await start(context)
      expect(context.showSnack).toHaveBeenCalledWith('SDK unavailable', 'error')
      expect(context.tokenClient.requestAccessToken).not.toHaveBeenCalled()
      initSlideCreation(null, [card], [context.canvas], vi.fn(), context.showSnack)
      await vi.runAllTimersAsync()
      expect(context.gapiClient.init).toHaveBeenCalledTimes(2)
      expect(context.tokenClient.requestAccessToken).toHaveBeenCalledOnce()
    })

    it('handles gapi loader errors before requesting an OAuth token', async () => {
      const context = setup()
      context.gapi.load.mockImplementationOnce((_name, options) => options.onerror(new Error('loader failed')))
      await start(context)
      expect(context.showSnack).toHaveBeenCalledWith('loader failed', 'error')
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.initTokenClient).not.toHaveBeenCalled()
    })

    it.each([
      { error: 'access_denied', error_description: 'Consent declined' },
      { error: 'access_denied' },
    ])('reports OAuth rejection $error_description without generating a presentation', async response => {
      const context = setup()
      await start(context)
      context.tokenClient.callback(response)
      await vi.runAllTimersAsync()
      expect(context.showSnack).toHaveBeenCalledWith(response.error_description || response.error, 'error')
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.gapiClient.setToken).not.toHaveBeenCalled()
      expect(client.post).not.toHaveBeenCalled()
    })

    it.each([{ message: 'Popup blocked' }, { type: 'popup_closed' }])('reports OAuth popup failures: %j', async error => {
      const context = setup()
      await start(context)
      context.tokenClient.error_callback(error)
      expect(context.showSnack).toHaveBeenCalledWith('message' in error ? error.message : error.type, 'error')
      expect(context.callback).toHaveBeenCalledOnce()
      expect(client.post).not.toHaveBeenCalled()
    })

    it('reports upload failures and never completes twice or opens an incomplete presentation', async () => {
      const context = setup()
      vi.mocked(client.post).mockResolvedValueOnce({ data: { status: 'error', message: 'Upload rejected' } })
      await start(context)
      await authorize(context)
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.showSnack).toHaveBeenCalledWith('Upload rejected', 'error')
      expect(context.presentations.batchUpdate).not.toHaveBeenCalled()
      expect(context.open).not.toHaveBeenCalled()
      expect(client.post).toHaveBeenCalledTimes(1)
    })

    it.each([
      { result: { error: { message: 'Slides denied' } } },
      { error: { message: 'Slides denied' } },
      new Error('Slides denied'),
    ])('reports failed slide updates without opening or scheduling deletion: %j', async error => {
      const context = setup()
      context.presentations.batchUpdate.mockRejectedValueOnce(error)
      await start(context)
      await authorize(context)
      expect(context.showSnack).toHaveBeenCalledWith('Slides denied', 'error')
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.open).not.toHaveBeenCalled()
      expect(client.post).toHaveBeenCalledTimes(1)
    })

    it('reports network upload errors without updating the presentation', async () => {
      const context = setup()
      vi.mocked(client.post).mockRejectedValueOnce(new Error('Network unavailable'))
      await start(context)
      await authorize(context)
      expect(context.showSnack).toHaveBeenCalledWith('Network unavailable', 'error')
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.presentations.batchUpdate).not.toHaveBeenCalled()
      expect(context.open).not.toHaveBeenCalled()
    })

    it.each(['response', 'network'])('logs temporary-image cleanup %s failures without undoing success', async failure => {
      const context = setup()
      vi.mocked(client.post).mockImplementation(async url => {
        if (url === '/uploadImageForSlide') return { data: { status: 'success', url: 'https://images.example.test/sales.jpeg' } }
        if (failure === 'network') throw new Error('Cleanup unavailable')
        return { data: { status: 'error' } }
      })
      await start(context)
      await authorize(context)
      expect(context.consoleLog).toHaveBeenCalledWith('Unable to delete temporary google slide images')
      expect(context.callback).toHaveBeenCalledOnce()
      expect(context.open).toHaveBeenCalledOnce()
      expect(context.showSnack).not.toHaveBeenCalled()
    })
  })

  it('deletes the default slide and adds a titled image slide per card', () => {
    const pageSize = { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 5143500, unit: 'EMU' } }
    const requests = buildSlideRequests(
      [{ cardName: 'a', cardType: 'summary', level: 'National', title: 'Sales' }],
      'p',
      pageSize,
      ['https://img/0.jpeg'],
    )
    expect(requests[0]).toEqual({ deleteObject: { objectId: 'p' } })
    expect(requests).toHaveLength(5)
    const { createImage } = requests[2] as { createImage: { url: string; elementProperties: { size: unknown; transform: { translateX: number } } } }
    expect(createImage.url).toBe('https://img/0.jpeg')
    expect(createImage.elementProperties.transform.translateX).toBeCloseTo((9144000 * 0.37) / 12700)
    expect(createImage.elementProperties.size).toEqual({
      height: { magnitude: 5143500 * 0.99, unit: 'EMU' },
      width: { magnitude: 9144000 * 0.6, unit: 'EMU' },
    })
    expect(requests[3]).toEqual({ insertText: { objectId: 'title-0', text: 'National Sales summary Card' } })
  })
})

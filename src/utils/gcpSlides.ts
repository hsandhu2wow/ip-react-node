/**
 * Port of Angular GCPSlidesService (src/app/services/gcp-slides.service.ts).
 *
 * Angular used the deprecated `gapi.auth2`; this uses Google Identity Services
 * (`google.accounts.oauth2.initTokenClient`) with the same scopes, and the gapi
 * client (discovery docs) for the Slides and Drive calls.
 */
import client from '../api/client'
import type { PreviewCard } from '../components/shared/RecognizeDialog/recognize'
import { formatDatePattern } from './datePattern'

type SlideCard = PreviewCard
type ShowSnack = (message: string, type?: 'success' | 'error' | 'info') => void

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any
    google?: any
  }
}

const DISCOVERY_DOCS = [
  'https://slides.googleapis.com/$discovery/rest?version=v1',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
]
const SCOPES = 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive'
const GAPI_SRC = 'https://apis.google.com/js/api.js'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

const scriptLoads: Record<string, Promise<void>> = {}
function loadScript(src: string): Promise<void> {
  if (!scriptLoads[src]) {
    scriptLoads[src] = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        delete scriptLoads[src]
        reject(new Error(`Failed to load ${src}`))
      }
      document.head.appendChild(script)
    })
  }
  return scriptLoads[src]
}

let gapiClientReady: Promise<void> | null = null
let tokenClient: any = null

interface SlideJob {
  cards: SlideCard[]
  canvases: HTMLCanvasElement[]
  callback: (() => void) | null
  showSnack: ShowSnack
}

function handleError(job: SlideJob, response: { error?: any }) {
  if (response && response.error) {
    console.error(response.error)
    job.callback?.()
    job.callback = null
    job.showSnack(response.error.message, 'error')
  }
}

/**
 * Angular initSlideCreation(cardType, cards, canvases, callback). `cardType` is unused
 * there too; `showSnack` replaces UtilityProviderService.displaySnackMessage.
 */
export function initSlideCreation(
  _cardType: unknown,
  cards: SlideCard[],
  canvases: HTMLCanvasElement[],
  callback: () => void,
  showSnack: ShowSnack,
) {
  const job: SlideJob = {
    cards: cards.filter(card => card && !card.error),
    canvases,
    callback,
    showSnack,
  }
  void initClient(job)
}

async function initClient(job: SlideJob) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!apiKey || !clientId) {
    handleError(job, { error: { message: 'Missing Client and API key' } })
    return
  }
  try {
    await Promise.all([loadScript(GAPI_SRC), loadScript(GIS_SRC)])
    if (!gapiClientReady) {
      gapiClientReady = new Promise<void>((resolve, reject) => {
        window.gapi.load('client', {
          callback: () =>
            window.gapi.client.init({ apiKey, discoveryDocs: DISCOVERY_DOCS }).then(resolve, reject),
          onerror: reject,
        })
      }).catch(error => {
        gapiClientReady = null
        throw error
      })
    }
    await gapiClientReady
  } catch (error: any) {
    handleError(job, { error: error?.result?.error ?? error ?? {} })
    return
  }
  signIn(job, clientId)
}

/** Replaces gapi.auth2 sign-in: request an access token, then generate (updateSigninStatus). */
function signIn(job: SlideJob, clientId: string) {
  const onToken = (response: any) => {
    if (response?.error) {
      handleError(job, { error: { message: response.error_description || response.error } })
      return
    }
    window.gapi.client.setToken({ access_token: response.access_token })
    setTimeout(() => {
      generateSlide(job).catch(error => handleError(job, { error: error?.result?.error ?? error?.error ?? error }))
    }, 500)
  }
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: () => {},
    })
  }
  tokenClient.callback = onToken
  tokenClient.error_callback = (error: any) => handleError(job, { error: { message: error?.message || error?.type } })
  tokenClient.requestAccessToken({ prompt: window.gapi.client.getToken() ? '' : 'consent' })
}

async function generateSlide(job: SlideJob) {
  // Upload images and create the presentation in parallel
  const [uploadImageURLs, presentation] = await Promise.all([readCard(job), handleDrive()])
  await uploadImageToSlide(job, presentation.id, presentation.deleteSlideId, presentation.pageSize, uploadImageURLs)
  if (job.callback) {
    job.callback()
    job.callback = null
  }
  setTimeout(() => {
    window.open(presentation.link, '_blank')
    const formData = new FormData()
    formData.append('url', uploadImageURLs[0])
    client.post('/deleteImageForSlide', formData).then(
      res => {
        if (res.data?.status === 'error') console.log('Unable to delete temporary google slide images')
      },
      () => console.log('Unable to delete temporary google slide images'),
    )
  }, 100)
}

async function handleDrive() {
  const folderId = await createDriveFolder()
  return createDrivePresentation(folderId)
}

function readCard(job: SlideJob): Promise<string[]> {
  return Promise.all(job.canvases.map((canvas, index) => uploadImageToDrive(job, canvas, job.cards[index])))
}

async function createDriveFolder(): Promise<string> {
  const folders = await window.gapi.client.drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false and name contains 'QuickFacts'",
    fields: 'files(id, name)',
    spaces: 'drive',
  })
  if (!folders.result.files || !folders.result.files.length || !folders.result.files[0].id) {
    const folder = await window.gapi.client.drive.files.create({
      resource: { name: 'QuickFacts', mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    return folder.result.id
  }
  return folders.result.files[0].id
}

async function uploadImageToDrive(job: SlideJob, canvas: HTMLCanvasElement, card: SlideCard): Promise<string> {
  const imgURL = canvas.toDataURL('image/jpeg', 1.0)
  const blobBin = atob(imgURL.split(',')[1])
  const array = new Uint8Array(blobBin.length)
  for (let i = 0; i < blobBin.length; i++) {
    array[i] = blobBin.charCodeAt(i)
  }
  const blob = new Blob([array], { type: 'image/jpeg' })
  const name = `${card.jsId}.jpeg`
  const file = new File([blob], name, { type: blob.type })
  const formData = new FormData()
  formData.append('image', file, name)
  const { data: uploadResponse } = await client.post('/uploadImageForSlide', formData)
  if (uploadResponse.status === 'error') {
    handleError(job, { error: uploadResponse })
    throw { error: uploadResponse }
  }
  return uploadResponse.url
}

async function createDrivePresentation(folderId: string) {
  const newPresentation = await window.gapi.client.drive.files.create({
    resource: {
      name: presentationName(),
      mimeType: 'application/vnd.google-apps.presentation',
      parents: [folderId],
    },
    fields: 'id, webViewLink',
  })
  const presentation = await window.gapi.client.slides.presentations.get({
    presentationId: newPresentation.result.id,
  })
  return {
    id: newPresentation.result.id as string,
    link: newPresentation.result.webViewLink as string,
    deleteSlideId: presentation.result.slides[0].objectId as string,
    pageSize: presentation.result.pageSize,
  }
}

/** 'Quick_Facts_Card_' + DatePipe 'M_d_yy_h_mm_a' */
export function presentationName(now: Date = new Date()): string {
  return 'Quick_Facts_Card_' + formatDatePattern(now, 'M_d_yy_h_mm_a')
}

interface Dimension { magnitude: number; unit: string }

/** batchUpdate requests: delete the default slide, then one titled image slide per card. */
export function buildSlideRequests(
  cards: SlideCard[],
  deleteSlideId: string,
  pageSize: { width: Dimension; height: Dimension },
  uploadImageURLs: string[],
): Record<string, unknown>[] {
  const pageId = 'quick-facts-page'
  const requests: Record<string, unknown>[] = [{ deleteObject: { objectId: deleteSlideId } }]
  const translateX = (pageSize.width.magnitude * 0.37) / 12700
  pageSize.height.magnitude = pageSize.height.magnitude * 0.99
  pageSize.width.magnitude = pageSize.width.magnitude * 0.6

  cards.forEach((card, index) => {
    const createSlide = {
      insertionIndex: index,
      objectId: pageId + index,
      slideLayoutReference: { predefinedLayout: 'ONE_COLUMN_TEXT' },
      placeholderIdMappings: [
        { layoutPlaceholder: { type: 'TITLE', index: 0 }, objectId: 'title-' + index },
        { layoutPlaceholder: { type: 'BODY', index: 0 }, objectId: 'body-' + index },
      ],
    }
    const createImage = {
      url: uploadImageURLs[index],
      elementProperties: {
        pageObjectId: createSlide.objectId,
        size: { height: pageSize.height, width: pageSize.width },
        transform: { scaleX: 1, scaleY: 1, translateX, translateY: 0, unit: 'PT' },
      },
    }
    const insertText = {
      objectId: 'title-' + index,
      text: `${card.level} ${card.title} ${card.cardType} Card`,
    }
    const updateTextStyle = {
      objectId: 'title-' + index,
      style: { fontSize: { magnitude: 18, unit: 'PT' } },
      fields: 'fontSize',
    }
    requests.push({ createSlide }, { createImage }, { insertText }, { updateTextStyle })
  })
  return requests
}

async function uploadImageToSlide(
  job: SlideJob,
  presentationId: string,
  deleteSlideId: string,
  pageSize: { width: Dimension; height: Dimension },
  uploadImageURLs: string[],
) {
  return window.gapi.client.slides.presentations.batchUpdate({
    presentationId,
    requests: buildSlideRequests(job.cards, deleteSlideId, pageSize, uploadImageURLs),
  })
}

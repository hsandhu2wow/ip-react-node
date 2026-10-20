import client from './client'

/** GET /triggerNPSSurvey/ (Angular HelpService.getNPSSurveyFlag) */
export interface INpsSurveyFlag {
  triggerNPSPopup?: string
  sqf?: number
  campaignId?: string
  [key: string]: unknown
}

export interface NpsSurveyPayload {
  feedback?: string
  qaRating?: string
  qaFeedback?: string
  requestOrigin: string
  campaignId: string
  /** Router URL (path + query string), mirrors Angular `router.url` */
  url: string
}

export async function getNPSSurveyFlag(): Promise<INpsSurveyFlag> {
  const res = await client.get<INpsSurveyFlag>('/triggerNPSSurvey/')
  return res.data || {}
}

/** Angular HelpService.submitNPSSurvey — multipart POST /npsSurvey */
export async function submitNPSSurvey(req: NpsSurveyPayload): Promise<unknown> {
  const form = new FormData()
  if (req.feedback) form.append('feedback', req.feedback)
  form.append('requestOrigin', req.requestOrigin)
  form.append('campaignId', req.campaignId)
  if (req.qaRating) form.append('qaRating', req.qaRating)
  if (req.qaFeedback) form.append('qaFeedback', req.qaFeedback)
  form.append('url', req.url)
  const res = await client.post('/npsSurvey', form)
  return res.data
}

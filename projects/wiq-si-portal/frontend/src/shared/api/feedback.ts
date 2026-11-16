import client from './client'

/** Angular HelpService.getIssuesTypeDropDownOptions — GET /feedbackIssuesType/{pageSection} */
export async function getFeedbackIssueTypes(pageSection: string): Promise<string[]> {
  const res = await client.get<string[]>(`/feedbackIssuesType/${pageSection}`)
  return res.data
}

export interface FeedbackPayload {
  images: File[]
  reason: string
  contactMe: boolean
  requestOrigin: string
  issueTypeSelected: string
  /** Router URL (path + query string), mirrors Angular `router.url`. */
  url: string
  feedback?: string
  dashboardId?: string
  application_names?: string
}

/**
 * Angular HelpService.submitFeedbackPopup — multipart POST /feedbackPopup/.
 * Flask registers the route with a trailing slash; without it Flask answers 308 and the
 * redirect points at the proxied backend host, which the browser blocks as cross-origin.
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<unknown> {
  const formData = new FormData()
  payload.images.forEach((image, i) => formData.append(`image${i}`, image, image.name))
  formData.append('reason', payload.reason)
  // Angular always appends `feedback`; when unset FormData stringifies it to 'undefined'.
  formData.append('feedback', String(payload.feedback))
  formData.append('contactMe', String(payload.contactMe))
  formData.append('requestOrigin', payload.requestOrigin)
  formData.append('issueType', payload.issueTypeSelected)
  if (payload.dashboardId) formData.append('dashboardId', payload.dashboardId)
  if (payload.application_names) formData.append('application_names', payload.application_names)
  formData.append('url', payload.url)
  const res = await client.post('/feedbackPopup/', formData)
  return res.data
}

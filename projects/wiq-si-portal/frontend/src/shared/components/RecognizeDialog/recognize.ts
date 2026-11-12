import type { ISQFMetricCard, ISQFCardError } from '../../types/sqf.types'
import { formatDatePattern, parseIsoDate } from '../../utils/datePattern'

/** Angular ISQFCard fields read by the preview/recognise flow (not all are on ISQFMetricCard). */
export type PreviewCard = Omit<ISQFMetricCard, 'chartData' | 'tableData' | 'error' | 'cardType'> & {
  error?: ISQFCardError | null
  cardType: string
  id?: string
  title?: string
  level?: string
}

/** Angular IRecognizeFormData */
export interface IRecognizeFormData {
  cardPdf: Blob
  cardLevel: string
  cardTitle: string
  cardType: string
  cardId: string
  cardCode: string
  cardDesc: string
  filterDate: string
  attachmentName: string
  headerText?: string
}

/** QfPreviewComponent.openRecognitionForm field derivation. */
export function buildRecognizeFormData(card: PreviewCard, selectedDate: string, cardPdf: Blob): IRecognizeFormData {
  const filterDate = selectedDate ? formatDatePattern(parseIsoDate(selectedDate), 'dd-MM-yyyy') : ''
  let cardTitle
  let cardLevel
  let cardCode
  if (card.apiType === 'generic') {
    cardTitle = card.cardTitle
    cardLevel = card.location
    cardCode = card.childCode
  } else {
    cardTitle = card.title
    cardLevel = card.level
    cardCode = card.cardCode
  }
  return {
    cardPdf,
    cardLevel: cardLevel as string,
    cardTitle: cardTitle as string,
    cardType: card.cardType,
    cardId: card.id as string,
    cardCode: cardCode as string,
    cardDesc: cardLevel as string,
    filterDate,
    attachmentName: cardLevel + ' - ' + card.cardType + ' - ' + filterDate + '.pdf',
  }
}

/** Email between "<" and ">" in a userSearch employee_name. */
export function parseEmployeeEmail(employeeName: string): string {
  return employeeName.split(/[<>]/)[1]
}

export interface RecognizeSubmission {
  receipientEmail: string
  lineManagerEmail: string | null
  receipientEmployeeNumber: string
  lineManagerEmployeeNumber: string
  qfAccessValidation: 'Y' | 'N'
  body: string
}

/**
 * QfRecognizeInlineComponent.submitRecognition payload. FormData.append stringifies
 * null/undefined exactly as Angular's (e.g. cc_to "null" when no line manager).
 */
export function buildRecognizePayload(data: IRecognizeFormData, s: RecognizeSubmission): FormData {
  const requestData = new FormData()
  const append = (key: string, value: unknown) => requestData.append(key, String(value))
  requestData.append('CardPDF', data.cardPdf, data.attachmentName)
  append('send_to', s.receipientEmail)
  append('cc_to', s.lineManagerEmail)
  append('recipient_emp_number', s.receipientEmployeeNumber)
  append('line_manager_emp_number', s.lineManagerEmployeeNumber)
  append('qf_access_validation', s.qfAccessValidation)
  append('card_level', data.cardLevel)
  append('card_title', data.cardTitle)
  append('card_type', data.cardType)
  append('card_id', data.cardId)
  append('card_desc', data.cardDesc)
  append('card_code', data.cardCode)
  append('filter_date', data.filterDate)
  append('body', s.body)
  return requestData
}

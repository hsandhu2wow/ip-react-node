import { formatDatePattern } from '../../utils/datePattern'
import type { PreviewCard } from '../RecognizeDialog/recognize'

/** QfPreviewComponent export filename: `${title}-${cardType}_${M_d_yy_h_mm}` */
export function previewFileName(card: PreviewCard, now: Date = new Date()): string {
  const cardTitle = card.apiType === 'generic' ? card.cardTitle : card.title
  return `${cardTitle}-${card.cardType}_${formatDatePattern(now, 'M_d_yy_h_mm')}`
}

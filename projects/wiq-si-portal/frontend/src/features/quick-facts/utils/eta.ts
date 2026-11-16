import type { ETAMap, IDataLoadETA, ISQFCardError } from '../../../shared/types/sqf.types'
import { formatDate, getYesterdayDate } from '../../../shared/utils/formatters'

// Maps METRIC field from API to card name keys used in the app
const METRIC_KEY_MAP: Record<string, string> = {
  Sales: 'sales',
  Stockloss: 'stockloss',
  'Online-Sales': 'online',
  VOC: 'voc',
  WMD: 'wmd',
  Wages: 'wages',
  Event: 'seasonal',
  LSM: 'lsm',
  Availability: 'availability',
  StoreProcess: 'storeprocess',
  RT3: 'rt3',
}

/**
 * Builds the ETA map from getDataLoadETA (mirrors Angular SqfFilterService.getCardsETA).
 * Expected_Time is UTC; the resulting Date is normalised onto the user's local "today".
 */
export function mapToETAMap(raw: IDataLoadETA[], now = new Date()): ETAMap {
  const eta: ETAMap = {}
  raw.forEach(entry => {
    const [hh, mm, ss] = entry.Expected_Time.split(':').map(t => parseInt(t))
    const todayLocalStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let cutOff = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh, mm, ss)
    )
    const cutOffLocalStart = new Date(cutOff.getFullYear(), cutOff.getMonth(), cutOff.getDate())
    const dayDiff = Math.round((cutOffLocalStart.getTime() - todayLocalStart.getTime()) / 86_400_000)
    if (dayDiff !== 0) cutOff = new Date(cutOff.getTime() - dayDiff * 86_400_000)
    eta[METRIC_KEY_MAP[entry.METRIC] || entry.METRIC] = { time: cutOff }
  })
  return eta
}

/** Formats a Date as Angular's 'h:mm a', e.g. "7:30 AM" */
export function formatTimeHMMA(d: Date): string {
  const h = d.getHours() % 12 || 12
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`
}

/** Mirrors Angular SqfCardsService.getETAString — only for yesterday's data. */
export function getETAString(eta: ETAMap | undefined, cardName: string, selectedDate: string): string | null {
  const etaTime = eta?.[cardName]
  if (!etaTime) return null
  if (selectedDate !== formatDate(getYesterdayDate())) return null
  return `${etaTime.day ? etaTime.day + ' ' : ''}${formatTimeHMMA(etaTime.time)}`
}

/**
 * Stamps error.cutOffTime/cutOffAt on cards whose status is 'error-NoDataFound'
 * (mirrors the catchError branches of Angular SqfCardsService card fetches).
 */
export function stampCutOffTimes<T extends { status?: string; cardName: string; error?: ISQFCardError | null }>(
  cards: T[],
  eta: ETAMap | undefined,
  selectedDate: string
): T[] {
  return cards.map(card => {
    if (card.status !== 'error-NoDataFound' || !card.error) return card
    const cutOffTime = getETAString(eta, card.cardName, selectedDate)
    return {
      ...card,
      error: {
        ...card.error,
        cutOffTime,
        cutOffAt: cutOffTime ? eta?.[card.cardName]?.time.getTime() : undefined,
      },
    }
  })
}

import client from '../../../shared/api/client'
import type {
  ISQFGenericFilter,
  ISQFMetricCard,
  ISQFCardsResponse,
  IAvailableMetricCards,
  IDataLoadETA,
} from '../../../shared/types/sqf.types'

/** Returns the hierarchy tree for the filter dropdown */
export async function getUniversalFilter(): Promise<ISQFGenericFilter[]> {
  const res = await client.get<ISQFGenericFilter[]>('/sqf/getUniversalFilterGeneric')
  return res.data
}

/** Stores near the given coordinates (Angular SqfStoreLocatorService.locateStore) */
export async function getNearbyStores(lat: number, lng: number): Promise<ISQFGenericFilter[]> {
  const res = await client.get<ISQFGenericFilter[]>(`/sqf/getNearbyStores/${lat}/${lng}`)
  return res.data
}

/** Returns ETA timestamps for each metric's data load */
export async function getDataLoadETA(): Promise<IDataLoadETA[]> {
  const res = await client.get<IDataLoadETA[]>('/sqf/getDataLoadETA')
  return res.data
}

/** Support email shown in card error states (Angular HelpService.getSupportEmail('SQF')) */
export async function getSupportEmail(portal: 'SQF' | 'BQF' = 'SQF'): Promise<string> {
  const res = await client.get<string>(`/supportEmail/${portal}`, { responseType: 'text' })
  return res.data
}

type CardsResponse = ISQFCardsResponse

/**
 * SqfMetricCardService.mapData: every successful (non-hasError) generic card gets
 * `jsId = js-${cardName}-${cardType}-card-${index}` and `apiType = 'generic'`. The jsId
 * is the DOM id used to capture cards for export/recognise.
 */
export function mapGenericCards(response: CardsResponse): CardsResponse {
  const mapList = (cards: ISQFMetricCard[]) => {
    let index = 0
    return cards.map(card =>
      card && !(card as { hasError?: boolean }).hasError
        ? {
            ...card,
            jsId: `js-${card.cardName}-${card.cardType}-card-${index++}`,
            apiType: 'generic',
            tableOnly: !card.chartData && !!card.tableData,
          }
        : card,
    )
  }
  const mapValue = (value: unknown): unknown => {
    if (Array.isArray(value)) return mapList(value)
    if (value && typeof value === 'object' && Array.isArray((value as { cards?: unknown }).cards)) {
      const wrapped = value as { cards: ISQFMetricCard[] }
      return { ...wrapped, cards: mapList(wrapped.cards) }
    }
    return value
  }
  if (Array.isArray(response)) return mapList(response)
  if (!response || typeof response !== 'object') return response
  const obj = response as unknown as Record<string, unknown>
  if ('WTD' in obj || 'YDAY' in obj) {
    const out: Record<string, unknown> = { ...obj }
    for (const period of ['WTD', 'YDAY']) {
      if (period in obj) out[period] = mapValue(obj[period])
    }
    return out as unknown as CardsResponse
  }
  return mapValue(obj) as CardsResponse
}

/** Angular UserService.getCFCChildCodes — directory used by legacy card availability. */
export async function getCFCChildCodes(): Promise<string[]> {
  const res = await client.get<{ cfc_codes: string[] }>('/sqf/getCFCChildCodes')
  return res.data.cfc_codes
}

/** Returns which cards are available and their configuration */
export async function getSQFCardStatus(): Promise<IAvailableMetricCards> {
  const res = await client.get<IAvailableMetricCards>('/sqf/getSQFMetricCardsStatus')
  return res.data
}

/**
 * Returns summary metric cards for the selected location and date.
 * @param apiDepth  0 = national (no code), >0 = regional/store (requires code)
 * @param date      "yyyy-MM-dd"
 * @param code      Location code (omit or undefined when apiDepth === 0)
 */
export async function getSummaryCards(
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFCardsResponse> {
  const path = apiDepth && code
    ? `/sqf/summaryCards/${apiDepth}/${date}/${code}`
    : `/sqf/summaryCards/0/${date}`
  const res = await client.get<ISQFCardsResponse>(path)
  return mapGenericCards(res.data)
}

/**
 * Returns detail cards for a specific metric type.
 * @param metric   Card name, e.g. "sales", "stockloss"
 * @param apiDepth 0 = national (no code), >0 = regional/store
 * @param date     "yyyy-MM-dd"
 * @param code     Location code (omit when apiDepth === 0)
 */
export async function getDetailCard(
  metric: string,
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFCardsResponse> {
  const path = apiDepth && code
    ? `/sqf/detailCard/${metric}/${apiDepth}/${date}/${code}`
    : `/sqf/detailCard/${metric}/0/${date}`
  const res = await client.get<ISQFCardsResponse>(path)
  return mapGenericCards(res.data)
}

export { fetchSeasonalCards, getSeasonalMetric, mapSeasonalCards } from './seasonal'

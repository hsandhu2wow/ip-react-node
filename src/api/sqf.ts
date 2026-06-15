import client from './client'
import type {
  ISQFGenericFilter,
  ISQFMetricCard,
  IAvailableMetricCards,
  IDataLoadETA,
} from '../types/sqf.types'

/** Returns the hierarchy tree for the filter dropdown */
export async function getUniversalFilter(): Promise<ISQFGenericFilter[]> {
  const res = await client.get<ISQFGenericFilter[]>('/sqf/getUniversalFilterGeneric')
  return res.data
}

/** Returns ETA timestamps for each metric's data load */
export async function getDataLoadETA(): Promise<IDataLoadETA[]> {
  const res = await client.get<IDataLoadETA[]>('/sqf/getDataLoadETA')
  return res.data
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
): Promise<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/summaryCards/${apiDepth}/${date}/${code}`
    : `/sqf/summaryCards/0/${date}`
  const res = await client.get<ISQFMetricCard[]>(path)
  return res.data
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
): Promise<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/detailCard/${metric}/${apiDepth}/${date}/${code}`
    : `/sqf/detailCard/${metric}/0/${date}`
  const res = await client.get<ISQFMetricCard[]>(path)
  return res.data
}

/**
 * Returns the seasonal metric card.
 */
export async function getSeasonalMetric(
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/seasonalMetric/${apiDepth}/${date}/${code}`
    : `/sqf/seasonalMetric/0/${date}`
  const res = await client.get<ISQFMetricCard[]>(path)
  return res.data
}

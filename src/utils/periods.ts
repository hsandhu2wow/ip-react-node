import type { ISQFMetricCard, Period } from '../types/sqf.types'

const PERIODS: Period[] = ['WTD', 'YDAY']

export interface NormalizedPeriods {
  periods: Partial<Record<Period, ISQFMetricCard[]>>
  sortBy: Partial<Record<Period, string>>
}

/**
 * Normalises a summaryCards/detailCard response into per-period card arrays.
 * Accepts { WTD, YDAY } where each value is a card array or { cards, sortBy },
 * and a legacy plain array (treated as WTD). Invalid period values are dropped.
 */
export function normalizePeriods(raw: unknown): NormalizedPeriods {
  const result: NormalizedPeriods = { periods: {}, sortBy: {} }
  if (Array.isArray(raw)) {
    result.periods.WTD = raw as ISQFMetricCard[]
    return result
  }
  if (!raw || typeof raw !== 'object') return result

  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.cards)) {
    result.periods.WTD = obj.cards as ISQFMetricCard[]
    if (typeof obj.sortBy === 'string') result.sortBy.WTD = obj.sortBy
    return result
  }
  for (const period of PERIODS) {
    const value = obj[period]
    if (Array.isArray(value)) {
      result.periods[period] = value as ISQFMetricCard[]
    } else if (value && typeof value === 'object' && Array.isArray((value as { cards?: unknown }).cards)) {
      const wrapped = value as { cards: ISQFMetricCard[]; sortBy?: string }
      result.periods[period] = wrapped.cards
      if (wrapped.sortBy) result.sortBy[period] = wrapped.sortBy
    }
  }
  return result
}

/** Returns the selected period if available, otherwise the first available one. */
export function resolveActivePeriod(selected: Period, available: Period[]): Period {
  if (available.length === 0 || available.includes(selected)) return selected
  return available[0]
}

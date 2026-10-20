import { useMemo } from 'react'
import { useFilter } from '../context/FilterContext'
import { normalizePeriods, resolveActivePeriod } from '../utils/periods'
import type { ISQFMetricCard, Period } from '../types/sqf.types'

export interface PeriodCards {
  cards: ISQFMetricCard[]
  activePeriod: Period
  availablePeriods: Period[]
  /** True until data has loaded, so the toggle isn't hidden prematurely */
  hasMultiplePeriods: boolean
  sortBy?: string
}

/**
 * Picks the active period's cards out of a (possibly multi-period) response.
 * Falls back to the first available period if the selected one is missing.
 */
export function usePeriodCards(raw: unknown): PeriodCards {
  const { selectedPeriod } = useFilter()
  const selected: Period = selectedPeriod ?? 'WTD'

  const normalized = useMemo(() => normalizePeriods(raw), [raw])
  const availablePeriods = (['WTD', 'YDAY'] as Period[]).filter(p => normalized.periods[p])
  const activePeriod = resolveActivePeriod(selected, availablePeriods)

  return {
    cards: normalized.periods[activePeriod] ?? [],
    activePeriod,
    availablePeriods,
    hasMultiplePeriods: raw === undefined || availablePeriods.length > 1,
    sortBy: normalized.sortBy[activePeriod],
  }
}

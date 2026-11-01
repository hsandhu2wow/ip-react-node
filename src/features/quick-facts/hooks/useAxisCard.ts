import { resolveChildCardForAxis, isLegacyBreakdownCard } from '../utils/breakdown'
import type { BreakdownAxis, ISQFMetricCard } from '../../../shared/types/sqf.types'

/**
 * Resolves which child card to render for the global breakdown axis.
 * Axis-driven cards ignore their own dropdowns; an unresolved axis returns
 * null so the caller shows the filter-error state instead of stale data.
 * Without an `axis` (or for legacy cards) returns axisDriven=false and the
 * caller falls back to per-card dropdown selection.
 */
export function useAxisCard(card: ISQFMetricCard | undefined, axis: BreakdownAxis | undefined) {
  const axisDriven = !!(
    card?.cards && card.filterKeys && axis && !isLegacyBreakdownCard(card)
  )
  if (!axisDriven || !card || !axis) return { axisDriven: false, axisCard: null }

  return { axisDriven: true, axisCard: resolveChildCardForAxis(card, axis) }
}

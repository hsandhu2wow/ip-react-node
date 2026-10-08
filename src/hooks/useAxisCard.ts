import { useRef } from 'react'
import { resolveChildCardForAxis, isLegacyBreakdownCard } from '../utils/breakdown'
import type { BreakdownAxis, ISQFMetricCard } from '../types/sqf.types'

/**
 * Resolves which child card to render for the global breakdown axis.
 * Axis-driven cards ignore their own dropdowns; if the axis can't be resolved
 * (partial backend rollout) the previously resolved card keeps showing.
 * Without an `axis` (or for legacy cards) returns axisDriven=false and the
 * caller falls back to per-card dropdown selection.
 */
export function useAxisCard(card: ISQFMetricCard | undefined, axis: BreakdownAxis | undefined) {
  const last = useRef<{ name?: string; card: ISQFMetricCard | null }>({ card: null })

  const axisDriven = !!(
    card?.cards && card.filterKeys && axis && !isLegacyBreakdownCard(card)
  )
  if (!axisDriven || !card || !axis) return { axisDriven: false, axisCard: null }

  const resolved = resolveChildCardForAxis(card, axis)
  if (resolved) last.current = { name: card.cardName, card: resolved }
  const axisCard = resolved ?? (last.current.name === card.cardName ? last.current.card : null)
  return { axisDriven: true, axisCard }
}

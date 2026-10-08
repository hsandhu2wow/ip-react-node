import type { BreakdownAxis, ISQFMetricCard } from '../types/sqf.types'

// The backend's raw key for the childLevel axis is 'hierarchy'; the department
// axis can surface as either 'department' or 'proposition'.
const AXIS_KEYS: Record<BreakdownAxis, string[]> = {
  childLevel: ['hierarchy'],
  department: ['department', 'proposition'],
}
const ALL_AXIS_KEYS = ['hierarchy', 'department', 'proposition']

/**
 * Resolves the card.cards[] entry for the global breakdown axis. Dimensions
 * without an axis option default to their first dropdown option. Returns null
 * when this card has no option for the axis (partial backend rollout).
 */
export function resolveChildCardForAxis(
  card: ISQFMetricCard,
  axis: BreakdownAxis
): ISQFMetricCard | null {
  if (!card?.filterKeys || !card.dropdowns || !card.cards) return null
  let axisFound = false
  const filters: Record<string, string> = {}
  for (const [colKey, dropdownKey] of Object.entries(card.filterKeys)) {
    const dropdown = card.dropdowns.find(d => d.key === dropdownKey)
    if (!dropdown || !dropdown.data?.length) return null
    const wanted = dropdown.data.find(o => AXIS_KEYS[axis].includes(o.key))
    if (wanted) {
      axisFound = true
      filters[colKey] = wanted.key
    } else {
      filters[colKey] = dropdown.data[0].key
    }
  }
  if (!axisFound) return null
  return (
    card.cards.find(c => Object.keys(filters).every(k => c.keys?.[k] === filters[k])) ?? null
  )
}

/**
 * True for cards that predate the axis migration (no dropdown offers an axis
 * option, e.g. an ETD/WTD time-period dropdown); they keep their own dropdown.
 */
export function isLegacyBreakdownCard(card: ISQFMetricCard): boolean {
  if (!card?.filterKeys || !card.dropdowns || !card.cards) return false
  return Object.values(card.filterKeys).every(dropdownKey => {
    const dropdown = card.dropdowns!.find(d => d.key === dropdownKey)
    return !dropdown?.data?.some(o => ALL_AXIS_KEYS.includes(o.key))
  })
}

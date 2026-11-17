import type { IAvailableMetricCards } from '../../../shared/types/sqf.types'

/** Angular sqf-cards.service maxCardSeq */
const MAX_CARD_SEQ = 100

/** Angular getCardSequence: configured sequence, with 0 or missing falling back to 100 */
export function getCardSequence(cardStatus: IAvailableMetricCards, cardName: string): number {
  return cardStatus[cardName]?.sequence || MAX_CARD_SEQ
}

/**
 * Angular sqf-summary-home renders generic cards in config-key order, then the seasonal and
 * profile cards, and lays them out with CSS `order: getCardSequence(name)` (ties keep DOM order).
 * Cards missing from the config come after configured ones, in API order.
 */
export function orderSummaryCards<T>(
  cardStatus: IAvailableMetricCards,
  generic: Array<{ name: string; value: T }>,
  trailing: Array<{ name: string; value: T }> = [],
): T[] {
  const keys = Object.keys(cardStatus)
  const keyRank = (name: string) => {
    const i = keys.indexOf(name)
    return i < 0 ? keys.length : i
  }
  return [...[...generic].sort((a, b) => keyRank(a.name) - keyRank(b.name)), ...trailing]
    .sort((a, b) => getCardSequence(cardStatus, a.name) - getCardSequence(cardStatus, b.name))
    .map(slot => slot.value)
}

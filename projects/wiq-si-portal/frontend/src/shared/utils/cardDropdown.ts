import type { IAvailableMetricCards, IQFTree } from '../types/sqf.types'

export interface CardDropdownItem {
  name: string
  displayName: string
}

/**
 * Mirrors Angular SqfCardsService.getOrderedCardDropDown: cards with a details page
 * available at the current depth and CFC selection, ordered by sequence.
 */
export function getOrderedCardDropDown(cardStatus: IAvailableMetricCards | undefined, apiDepth = 0, isCFC = false): CardDropdownItem[] {
  if (!cardStatus) return []
  return Object.keys(cardStatus)
    .filter(name => {
      const cfg = cardStatus[name]
      return Number(cfg.details) === 1 && apiDepth <= (cfg.details_last_level ?? 99) && (!cfg.show_only_cfc || isCFC) && (!cfg.hide_cfc || !isCFC)
    })
    .sort((a, b) => (cardStatus[b].sequence === null ? -1 : cardStatus[a].sequence - cardStatus[b].sequence))
    .map(name => ({ name, displayName: cardStatus[name].titleText || name }))
}

export function isCFCNode(node: Pick<IQFTree, 'code' | 'level_desc'> | null | undefined, codes: string[] = []): boolean {
  const code = node?.level_desc === 'category' ? node.code.split('-')[0] : node?.code
  return code !== undefined && codes.includes(code)
}

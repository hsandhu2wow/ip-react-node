import { useMemo } from 'react'
import { useSummaryCards } from './useSummaryCards'
import { useCardStatus } from './useCardStatus'
import { useFilter } from '../context/FilterContext'
import { usePeriodCards } from './usePeriodCards'
import type { ISQFMetricCard, IAvailableMetricCards } from '../types/sqf.types'

export interface EnrichedSummaryResult {
  data: ISQFMetricCard[]
  isLoading: boolean
  isError: boolean
  cardStatus: IAvailableMetricCards
}

/**
 * Fetches summary cards and enriches each card with `isDetailsPageAvailable`,
 * matching the logic in Angular's SqfCardsService.setupCommonProps().
 *
 * isDetailsPageAvailable = true when:
 *   - cardStatus[cardName].details is true, AND
 *   - selectedNode.apiDepth <= cardStatus[cardName].details_last_level
 */
export function useEnrichedSummaryCards(): EnrichedSummaryResult {
  const { selectedNode } = useFilter()
  const summaryQuery = useSummaryCards()
  const periodCards = usePeriodCards(summaryQuery.data)
  const statusQuery = useCardStatus()

  const cardStatus = statusQuery.data ?? {}
  const apiDepth = selectedNode?.apiDepth ?? 0

  const data = useMemo<ISQFMetricCard[]>(
    () =>
      periodCards.cards.map(card => ({
        ...card,
        isDetailsPageAvailable:
          !!cardStatus[card.cardName]?.details &&
          apiDepth <= (cardStatus[card.cardName]?.details_last_level ?? 99),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodCards.cards, cardStatus, apiDepth]
  )

  return {
    data,
    isLoading: summaryQuery.isLoading || statusQuery.isLoading,
    isError: summaryQuery.isError || statusQuery.isError,
    cardStatus,
  }
}

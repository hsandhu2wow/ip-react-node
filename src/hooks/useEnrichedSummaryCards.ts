import { useMemo } from 'react'
import { useSummaryCards } from './useSummaryCards'
import { useCardStatus } from './useCardStatus'
import { useFilter } from '../context/FilterContext'
import { usePeriodCards } from './usePeriodCards'
import { useDataLoadETA } from './useDataLoadETA'
import { stampCutOffTimes } from '../utils/eta'
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
  const { selectedNode, selectedDate } = useFilter()
  const summaryQuery = useSummaryCards()
  const periodCards = usePeriodCards(summaryQuery.data)
  const statusQuery = useCardStatus()
  const etaQuery = useDataLoadETA()

  const cardStatus = statusQuery.data ?? {}
  const apiDepth = selectedNode?.apiDepth ?? 0

  const data = useMemo<ISQFMetricCard[]>(
    () =>
      stampCutOffTimes(periodCards.cards, etaQuery.data, selectedDate).map(card => ({
        ...card,
        isDetailsPageAvailable:
          !!cardStatus[card.cardName]?.details &&
          apiDepth <= (cardStatus[card.cardName]?.details_last_level ?? 99),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodCards.cards, cardStatus, apiDepth, etaQuery.data, selectedDate]
  )

  return {
    data,
    isLoading: summaryQuery.isLoading || statusQuery.isLoading,
    isError: summaryQuery.isError || statusQuery.isError,
    cardStatus,
  }
}

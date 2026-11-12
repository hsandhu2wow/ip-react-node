// src/components/cards/CardSidebar/CardSidebar.tsx
import type { BreakdownAxis, IAvailableMetricCards, ISQFMetricCard, ISeasonalCard } from '../../../../shared/types/sqf.types'
import { SeasonalSummaryCard } from '../SeasonalCard/SeasonalCard'
import { SummaryCard } from '../SummaryCard/SummaryCard'
import styles from './CardSidebar.module.scss'

interface Props {
  /** Enriched summary cards (details-enabled ones are listed, like Angular's details-home sidebar) */
  cards: ISQFMetricCard[]
  seasonalCard?: ISeasonalCard
  /** The cardName from the current URL :type param */
  selectedType: string
  /** Card config — drives ordering via `sequence` (Angular getCardSequence, default 100) */
  cardStatus?: IAvailableMetricCards
  axis?: BreakdownAxis
  supportEmail?: string
}

export function CardSidebar({ cards, seasonalCard, selectedType, cardStatus, axis, supportEmail }: Props) {
  const seq = (c: ISQFMetricCard) => cardStatus?.[c.cardName]?.sequence ?? 100
  // Angular filterGenericAvailableCards('summary', true) hides cards without a details page
  const hasDetails = (c: ISQFMetricCard) =>
    cardStatus?.[c.cardName] ? !!cardStatus[c.cardName].details : !!c.isDetailsPageAvailable
  const generic = cards.filter(c => !c.hidden && hasDetails(c))
  const visible: Array<ISQFMetricCard | ISeasonalCard> = cardStatus?.seasonal?.summary && seasonalCard && !seasonalCard.hidden
    ? [seasonalCard, ...generic] : generic
  visible.sort((a, b) => {
    const order = (card: ISQFMetricCard | ISeasonalCard) => 'type' in card ? cardStatus?.seasonal?.sequence || 100 : seq(card)
    return order(a) - order(b)
  })
  if (visible.length === 0) return null

  return (
    <nav className={styles.sidebar} aria-label="Card types">
      {visible.map(card => {
        const isSelected = card.cardName === selectedType
        return (
          <div
            key={card.cardName}
            className={`${styles.item} ${isSelected ? '' : styles.itemGrayed}`}
            data-selected={isSelected}
            aria-current={isSelected ? 'page' : undefined}
          >
            {'type' in card ? <SeasonalSummaryCard card={card} supportEmail={supportEmail} /> : <SummaryCard card={card} axis={axis} supportEmail={supportEmail} />}
          </div>
        )
      })}
    </nav>
  )
}

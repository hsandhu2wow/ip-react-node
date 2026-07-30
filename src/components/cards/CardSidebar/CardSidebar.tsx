// src/components/cards/CardSidebar/CardSidebar.tsx
import type { ISQFMetricCard } from '../../../types/sqf.types'
import { SummaryCard } from '../SummaryCard/SummaryCard'
import styles from './CardSidebar.module.css'

interface Props {
  /** Enriched summary cards — only those with isDetailsPageAvailable=true are shown */
  cards: ISQFMetricCard[]
  /** The cardName from the current URL :type param */
  selectedType: string
}

export function CardSidebar({ cards, selectedType }: Props) {
  const available = cards.filter(c => c.isDetailsPageAvailable && !c.hidden)
  if (available.length === 0) return null

  return (
    <nav className={styles.sidebar} aria-label="Card types">
      {available.map(card => {
        const isSelected = card.cardName === selectedType
        return (
          <div
            key={card.cardName}
            className={`${styles.item} ${isSelected ? '' : styles.itemGrayed}`}
            data-selected={isSelected}
            aria-current={isSelected ? 'page' : undefined}
          >
            <SummaryCard card={card} />
          </div>
        )
      })}
    </nav>
  )
}

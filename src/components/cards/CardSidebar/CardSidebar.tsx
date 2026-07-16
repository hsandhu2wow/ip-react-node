// src/components/cards/CardSidebar/CardSidebar.tsx
import { Link } from 'react-router-dom'
import type { ISQFMetricCard } from '../../../types/sqf.types'
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
        const kpi = card.infoNumbers?.[0]
        return (
          <Link
            key={card.cardName}
            to={`/quick-facts/details/${card.cardName}`}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
            data-selected={isSelected}
            aria-current={isSelected ? 'page' : undefined}
            style={{ borderLeftColor: card.cardHeader || undefined }}
          >
            <div className={styles.itemTitle}>{card.cardTitle || card.cardName}</div>
            {kpi && (
              <div className={styles.itemKpi}>
                <span>{kpi.displayValue}</span>{' '}
                <span>{kpi.text}</span>
              </div>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

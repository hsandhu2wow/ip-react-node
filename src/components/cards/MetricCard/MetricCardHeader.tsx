// src/components/cards/MetricCard/MetricCardHeader.tsx
import type { ISQFMetricCard } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

export function MetricCardHeader({ card }: { card: ISQFMetricCard }) {
  const color = card.infoNumbers?.[0]?.color || 'neutral'
  return (
    <div className={`${styles.header} ${styles[color]}`}>
      <div>
        <div className={styles.cardTitle}>{card.cardTitle || card.cardHeader}</div>
        <div className={styles.subTitle}>
          {card.location && <span>{card.location}</span>}
          {card.reportingPeriod && <span>{card.reportingPeriod}</span>}
        </div>
      </div>
    </div>
  )
}

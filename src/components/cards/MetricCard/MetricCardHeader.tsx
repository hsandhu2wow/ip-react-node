// src/components/cards/MetricCard/MetricCardHeader.tsx
import type { ISQFMetricCard } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

export function MetricCardHeader({ card }: { card: ISQFMetricCard }) {
  // cardHeader is a hex color string from the backend (e.g. "#219653"), used as border-top-color
  const borderColor = card.cardHeader || 'var(--color-neutral)'
  return (
    <div className={styles.header} style={{ borderTopColor: borderColor }}>
      <div>
        <div className={styles.cardTitle}>{card.cardTitle}</div>
        <div className={styles.subTitle}>
          {card.location && <span>{card.location.split('-')[0].trim()}</span>}
          {card.reportingPeriod && <span>{card.reportingPeriod}</span>}
        </div>
      </div>
    </div>
  )
}

// src/components/cards/MetricCard/MetricCardFooter.tsx
import { Link } from 'react-router-dom'
import type { ISQFMetricCard } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

export function MetricCardFooter({ card }: { card: ISQFMetricCard }) {
  return (
    <div className={styles.footer}>
      {card.isDetailsPageAvailable && (
        <div className={styles.footerLinks}>
          <Link
            to={`/quick-facts/details/${card.cardName}`}
            className={styles.detailsLink}
          >
            See details →
          </Link>
        </div>
      )}
      <div className={styles.footerMeta}>
        <span className={styles.updateDate}>
          {card.reportingPeriod || ''}
        </span>
      </div>
    </div>
  )
}

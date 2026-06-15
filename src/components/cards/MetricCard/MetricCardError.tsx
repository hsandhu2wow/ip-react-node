// src/components/cards/MetricCard/MetricCardError.tsx
import type { ISQFCardError } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

interface Props {
  error: ISQFCardError
  cardTitle?: string
}

export function MetricCardError({ error, cardTitle }: Props) {
  return (
    <div className={styles.errorCard} data-testid="metric-card-error">
      <div className={styles.errorTitle}>{cardTitle || 'Data unavailable'}</div>

      {error.cutOffTime ? (
        <div className={styles.errorMsg}>
          <p>Data is being loaded and will be available by:</p>
          <strong>{error.cutOffTime}</strong>
        </div>
      ) : error.wmd ? (
        <div className={styles.errorMsg}>
          <p>Wasted Markdown data is currently unavailable.</p>
        </div>
      ) : (
        <div className={styles.errorMsg}>
          <p>Data is currently unavailable for this selection.</p>
          {error.support_email && (
            <p>
              Contact{' '}
              <a href={`mailto:${error.support_email}`}>{error.support_email}</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

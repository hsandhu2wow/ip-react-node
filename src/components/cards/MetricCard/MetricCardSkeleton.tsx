// src/components/cards/MetricCard/MetricCardSkeleton.tsx
import styles from './MetricCard.module.css'

export function MetricCardSkeleton() {
  return (
    <div
      className={`${styles.card} ${styles.skeleton}`}
      data-testid="metric-card-skeleton"
      aria-label="Loading metric card"
    >
      <div className={`skeleton-block ${styles.skeletonBar}`} />
      <div className={styles.skeletonContent}>
        <div className={`skeleton-block ${styles.skeletonTitle}`} />
        <div className={`skeleton-block ${styles.skeletonSubtitle}`} />
        <div className={`skeleton-block ${styles.skeletonKpi}`} />
        <div className={`skeleton-block ${styles.skeletonChart}`} />
      </div>
    </div>
  )
}

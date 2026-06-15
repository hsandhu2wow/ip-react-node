// src/components/cards/MetricCard/MetricCardKpiRow.tsx
import { Fragment } from 'react'
import type { ISQFInfoNumber } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

export function MetricCardKpiRow({ infoNumbers }: { infoNumbers?: ISQFInfoNumber[] }) {
  if (!infoNumbers?.length) return null
  return (
    <div className={styles.kpiRow}>
      {infoNumbers.map((kpi, i) => (
        <Fragment key={i}>
          {i > 0 && <div className={styles.kpiDivider} />}
          <div className={styles.kpiCol}>
            <div className={`${styles.kpiValue} ${styles[kpi.color || 'neutral']}`}>{kpi.val}</div>
            <div className={styles.kpiLabel}>{kpi.label}</div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

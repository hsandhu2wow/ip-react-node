// src/components/cards/MetricCard/MetricCard.tsx
import type { ISQFMetricCard } from '../../../types/sqf.types'
import { MetricCardSkeleton } from './MetricCardSkeleton'
import { MetricCardError } from './MetricCardError'
import { MetricCardHeader } from './MetricCardHeader'
import { MetricCardKpiRow } from './MetricCardKpiRow'
import { MetricCardChart } from './MetricCardChart'
import { MetricCardTable } from './MetricCardTable'
import { MetricCardTabs } from './MetricCardTabs'
import { MetricCardFooter } from './MetricCardFooter'
import styles from './MetricCard.module.css'

interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
}

export function MetricCard({ card, isLoading }: Props) {
  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null
  if (card.error) return <MetricCardError error={card.error} cardTitle={card.cardTitle} />

  return (
    <div className={styles.card} id={card.jsId}>
      <MetricCardHeader card={card} />
      <MetricCardKpiRow infoNumbers={card.infoNumbers} />
      {card.tabs ? (
        <MetricCardTabs tabs={card.tabs} isSummary cardName={card.cardName} />
      ) : card.chartData ? (
        <MetricCardChart chartData={card.chartData} />
      ) : null}
      {card.tableData && <MetricCardTable tableData={card.tableData} isSummary />}
      <MetricCardFooter card={card} />
    </div>
  )
}

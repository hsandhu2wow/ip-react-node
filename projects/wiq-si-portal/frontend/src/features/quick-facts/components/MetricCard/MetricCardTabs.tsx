// src/components/cards/MetricCard/MetricCardTabs.tsx
import { useState } from 'react'
import type { ISQFTabData } from '../../../../shared/types/sqf.types'
import { MetricCardChart } from './MetricCardChart'
import { MetricCardTable } from './MetricCardTable'
import { useOptionalFilter } from '../../../../shared/context/FilterContext'
import { sendQFDataToAnalytics } from '../../../../shared/utils/analytics'
import styles from './MetricCard.module.scss'

export function MetricCardTabs({ tabs, isSummary = false, expanded = false, cardName }: { tabs: ISQFTabData[]; isSummary?: boolean; expanded?: boolean; cardName?: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const locationCode = useOptionalFilter()?.selectedNode?.code
  const selectedIdx = activeIdx < tabs.length ? activeIdx : 0
  const active = tabs[selectedIdx]
  if (!active) return null

  // Angular sqf-tabs tabChanged (mat-tab-group selectedTabChange)
  function selectTab(i: number) {
    if (i === selectedIdx) return
    setActiveIdx(i)
    sendQFDataToAnalytics(`tabChangeQF${isSummary ? 'Summary' : 'Details'}Card`, `${tabs[i].tabName ?? tabs[i].label}-${cardName}`, locationCode)
  }
  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Metric details">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === selectedIdx}
            className={`${styles.tab} ${i === selectedIdx ? styles.tabActive : ''}`}
            onClick={() => selectTab(i)}
          >
            {tab.tabName ?? tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        {active.chartData && <MetricCardChart chartData={active.chartData} />}
        {active.tableData && (
          <div className={`${styles.tabTable} ${active.tableData.tableWithoutHeaders ? styles.tabTablePlain : ''}`}>
            <MetricCardTable key={selectedIdx} tableData={active.tableData} isSummary={isSummary} expanded={expanded} inTabs />
          </div>
        )}
        {active.richText && <div className={styles.tabRichText} dangerouslySetInnerHTML={{ __html: active.richText }} />}
        {active.reportingTime && <div className={styles.tabReportingTime} dangerouslySetInnerHTML={{ __html: active.reportingTime }} />}
      </div>
    </>
  )
}

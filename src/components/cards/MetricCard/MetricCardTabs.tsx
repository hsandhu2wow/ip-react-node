// src/components/cards/MetricCard/MetricCardTabs.tsx
import { useState } from 'react'
import type { ISQFTabData } from '../../../types/sqf.types'
import { MetricCardChart } from './MetricCardChart'
import { MetricCardTable } from './MetricCardTable'
import styles from './MetricCard.module.css'

export function MetricCardTabs({ tabs }: { tabs: ISQFTabData[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = tabs[activeIdx]
  return (
    <>
      <div className={styles.tabs}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`${styles.tab} ${i === activeIdx ? styles.tabActive : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active.chartData && <MetricCardChart chartData={active.chartData} />}
      {active.tableData && <MetricCardTable tableData={active.tableData} />}
    </>
  )
}

// src/components/cards/MetricCard/MetricCardChart.tsx
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import type { ISQFChartData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function MetricCardChart({ chartData }: { chartData: ISQFChartData }) {
  // Guard: backend can return datasets/labels as non-array values at runtime.
  // Array.isArray() rejects {}, null, undefined — not just null/undefined.
  const safeData = {
    labels: Array.isArray(chartData?.labels) ? chartData.labels : [],
    datasets: Array.isArray(chartData?.datasets) ? chartData.datasets : [],
  }

  // Don't render an empty chart — nothing to show
  if (safeData.datasets.length === 0) return null

  return (
    <div className={styles.chartArea}>
      <Bar
        data={safeData as any}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, datalabels: { display: false } } as any,
          scales: { x: { grid: { display: false } }, y: { display: false } },
        }}
        height={146}
      />
    </div>
  )
}

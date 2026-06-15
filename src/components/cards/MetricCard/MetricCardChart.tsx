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
  // Guard: backend may return chartData without labels/datasets at runtime
  const safeData = {
    labels: chartData.labels ?? [],
    datasets: chartData.datasets ?? [],
  }
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

// src/components/cards/MetricCard/MetricCardChart.tsx
import { Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import type { ISQFChartData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

/** Transform the backend's custom datasets object into standard Chart.js datasets array */
function buildChartJsData(chartData: ISQFChartData) {
  const labels = chartData.chartOptions?.labels ?? []
  const datasets: object[] = []

  const dsKeys = Object.keys(chartData.datasets || {}).filter(k => k !== 'needle')

  dsKeys.forEach((key, index) => {
    const ds = chartData.datasets[key]
    const rows = ds?.data || ds?._data
    if (!Array.isArray(rows)) return

    const values = rows.map(r => r.value)
    const colors = rows.map(r => r.color)

    datasets.push({
      data: values,
      backgroundColor: colors,
      hoverBackgroundColor: colors,
      borderWidth: 0,
      barThickness: ds.barThickness ?? (index === 0 ? 15 : 28),
      categoryPercentage: index === 1 ? 1 : 0.8,
      barPercentage: index === 1 ? 1 : 0.9,
    })
  })

  return { labels, datasets }
}

export function MetricCardChart({ chartData }: { chartData: ISQFChartData }) {
  if (!chartData?.datasets || !chartData.chartOptions) return null

  const { chartType } = chartData
  const data = buildChartJsData(chartData)

  if (data.datasets.length === 0) return null

  const isHorizontal = chartType === 'horizontalBar'
  const isPie = chartType === 'pie'
  const isDoughnutOrGauge = chartType === 'doughnut' || chartType === 'gauge'

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false } as object,
    },
  }

  if (isPie || isDoughnutOrGauge) {
    return (
      <div className={styles.chartArea}>
        {isPie
          ? <Pie data={data as any} options={baseOptions} height={146} />
          : <Doughnut data={data as any} options={baseOptions} height={146} />
        }
      </div>
    )
  }

  const barOptions = {
    ...baseOptions,
    indexAxis: (isHorizontal ? 'y' : 'x') as 'x' | 'y',
    scales: {
      [isHorizontal ? 'y' : 'x']: {
        stacked: chartData.chartOptions.stacked ?? false,
        grid: { display: false },
      },
      [isHorizontal ? 'x' : 'y']: {
        display: false,
        ticks: { beginAtZero: true },
        grid: { display: false },
      },
    },
  }

  return (
    <div className={styles.chartArea}>
      <Bar data={data as any} options={barOptions as any} height={146} />
    </div>
  )
}


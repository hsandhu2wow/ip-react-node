// src/components/cards/MetricCard/MetricCardChart.tsx
import { Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type { ISQFChartData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels)

/** Transform the backend's custom datasets object into standard Chart.js datasets array */
function buildChartJsData(chartData: ISQFChartData) {
  const labels = chartData.chartOptions?.labels ?? []
  const datasets: object[] = []
  const dataLabels: (string | undefined)[][] = []
  const tooltipData: (string | undefined)[][] = []

  const dsKeys = Object.keys(chartData.datasets || {}).filter(k => k !== 'needle')

  dsKeys.forEach((key, index) => {
    const ds = chartData.datasets[key]
    const rows = ds?.data || ds?._data
    if (!Array.isArray(rows)) return

    const values = rows.map(r => r.value)
    const colors = rows.map(r => r.color)
    dataLabels.push(rows.map(r => r.dataLabel))
    tooltipData.push(rows.map(r => r.tooltip))

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

  return { labels, datasets, dataLabels, tooltipData }
}

export function MetricCardChart({ chartData, height = 146 }: { chartData: ISQFChartData; height?: number }) {
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
      <div className={styles.chartArea} style={{ height }}>
        {isPie
          ? <Pie data={data as any} options={baseOptions} />
          : <Doughnut data={data as any} options={baseOptions} />
        }
      </div>
    )
  }

  const { dataLabels, tooltipData } = data
  const chartOptions = chartData.chartOptions
  const showCustomTooltip = !!chartOptions.showCustomTooltip

  // Only show the datalabel of the bar with the highest value at each index
  // when there are multiple datasets (matches Angular's barLabelToggle)
  const barLabelToggle = (context: any) => {
    if (context.chart.config.data.datasets.length === 1) return true
    const values = context.chart.config.data.datasets.map((ds: any) => ds.data[context.dataIndex])
    const maxValueIndex = values.indexOf(Math.max(...values))
    return maxValueIndex === context.datasetIndex
  }

  const barLabelFormatter = (_value: unknown, context: any) => {
    if (chartOptions.hasFixedDataLabel && chartOptions.displayDataLabelIndex !== undefined) {
      return dataLabels[chartOptions.displayDataLabelIndex]?.[context.dataIndex] ?? null
    }
    if (context.chart.config.data.datasets.length === 1) {
      return dataLabels[0]?.[context.dataIndex] ?? null
    }
    return dataLabels[context.datasetIndex]?.[context.dataIndex] ?? null
  }

  const barOptions = {
    ...baseOptions,
    indexAxis: (isHorizontal ? 'y' : 'x') as 'x' | 'y',
    layout: {
      padding: isHorizontal ? { top: 10, left: 20, right: 25 } : { top: 16 },
    },
    plugins: {
      ...baseOptions.plugins,
      datalabels: {
        color: '#4A4A4A',
        anchor: 'end' as const,
        offset: 0,
        align: 'end' as const,
        clamp: true,
        display: barLabelToggle,
        formatter: barLabelFormatter,
        font: { size: 11 },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        displayColors: chartOptions.displayColors ?? false,
        callbacks: {
          title: () => '',
          label: (context: any) => {
            if (showCustomTooltip) {
              return context.datasetIndex === 0 ? tooltipData[0]?.[context.dataIndex] : undefined
            }
            return tooltipData[context.datasetIndex]?.[context.dataIndex]
          },
        },
      },
    },
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
    <div className={styles.chartArea} style={{ height }}>
      <Bar data={data as any} options={barOptions as any} />
    </div>
  )
}


// src/components/cards/MetricCard/MetricCardChart.tsx
import { memo, useMemo } from 'react'
import { Bar, Pie, Doughnut } from 'react-chartjs-2'
import type { Chart, Plugin } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type { ISQFChartData } from '../../../../shared/types/sqf.types'
import styles from './MetricCard.module.scss'
import { xAxisLabelHoverPlugin } from '../../chart-plugins/xAxisLabelHover'

// Angular sqf-layout registers xAxisLabelHoverPlugin globally
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels, xAxisLabelHoverPlugin)

/** Shared by every bar chart so bars always grow from their baseline on load */
export const BAR_ANIMATION = {
  duration: 800,
  easing: 'easeOutQuart',
  // Chart.js 4 also animates x/width from 0 (left→right sweep); Angular only grew bars from the baseline
  x: { duration: 0 },
  width: { duration: 0 },
} as const
const HORIZONTAL_BAR_ANIMATION = {
  duration: 800,
  easing: 'easeOutQuart',
  y: { duration: 0 },
  height: { duration: 0 },
} as const

/** Gauge/pie-only chartOptions keys (not in the shared ISQFChartData type) */
type PieChartOptions = ISQFChartData['chartOptions'] & {
  labels?: (string | string[])[]
  gradientColors?: string[]
  emptyGaugeColor?: string
  hideScale?: boolean
  showTooltipColorIndex?: number
}
type NeedleData = { value: number; color: string; dataLabel: string | string[] }

// Mirrors Angular SqfPieChartComponent.gaugeNeedlePlugin: centre label(s) under
// the gauge plus a needle (angle = -90° + 90° × value) and a 5px pivot dot.
const gaugeNeedlePlugin: Plugin<'doughnut'> = {
  id: 'gaugeNeedle',
  afterDatasetsDraw(chart: Chart<'doughnut'>) {
    const { ctx, data } = chart
    const needleData = (data.datasets[0] as { needleData?: NeedleData } | undefined)?.needleData
    if (!needleData) return
    const centerX = chart.chartArea.left + chart.chartArea.width / 2
    const centerY = chart.chartArea.top + chart.chartArea.height
    const needleLength = chart.chartArea.height * 1.05
    const angle = -Math.PI / 2 + (Math.PI / 2) * needleData.value
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (Array.isArray(needleData.dataLabel)) {
      needleData.dataLabel.forEach((value, index) => {
        ctx.font = index === 0 ? 'bold 13px Arial' : '12px Arial'
        const topMargin = index === 0 ? 20 : 30 + 5 * index
        ctx.fillText(value, centerX, centerY + topMargin)
      })
    } else {
      ctx.font = 'bold 13px Arial'
      ctx.fillText(needleData.dataLabel, centerX, centerY + 20)
    }
    ctx.translate(centerX, centerY)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(needleLength, 0)
    ctx.strokeStyle = needleData.color
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
    ctx.fillStyle = needleData.color
    ctx.fill()
  },
}

/** Builds Chart.js data/options for Angular SqfPieChartComponent (pie / doughnut / gauge). */
function buildPieConfig(chartData: ISQFChartData) {
  const chartOptions = chartData.chartOptions as PieChartOptions
  const isGauge = chartData.chartType === 'gauge'
  const bar1 = chartData.datasets?.Bar_1
  const rows = bar1?.data || bar1?._data
  if (!rows) return null

  const colors = rows.map(r => r.color)
  const dataLabels = rows.map(r => r.dataLabel)
  const tooltips = rows.map(r => r.tooltip)

  // Gauge fill: left→right linear gradient across the chart area, then the empty colour
  const gaugeColor = (context: { chart: Chart }) => {
    const { chart } = context
    if (!chart.chartArea) return undefined
    const { ctx, chartArea: { left, right } } = chart
    const grad = ctx.createLinearGradient(left, 0, right, 0)
    const g = chartOptions.gradientColors ?? []
    grad.addColorStop(0, g[0])
    grad.addColorStop(0.5, g[1])
    grad.addColorStop(1, g[2])
    return [grad, chartOptions.emptyGaugeColor]
  }

  const dataset: Record<string, unknown> = {
    data: rows.map(r => r.value),
    backgroundColor: isGauge ? gaugeColor : colors,
    hoverBackgroundColor: isGauge ? gaugeColor : colors,
    borderWidth: 0,
  }
  if ('needle' in chartData.datasets) dataset.needleData = chartData.datasets.needle

  const labelFormatter = (_value: unknown, context: any) => {
    if (chartOptions.hasFixedDataLabel) {
      return chartOptions.displayDataLabelIndex === 0 ? dataLabels[context.dataIndex] : undefined
    }
    if (context.chart.config.data.datasets.length === 1) {
      return context.datasetIndex === 0 && dataLabels[context.dataIndex] ? dataLabels[context.dataIndex] : null
    }
    return undefined
  }

  const tooltipIdx = chartOptions.showTooltipColorIndex ?? 0
  const options: Record<string, unknown> = {
    layout: { padding: 'padding' in chartOptions ? chartOptions.padding : { top: 16, left: 24, right: 12 } },
    maintainAspectRatio: false,
    aspectRatio: 1.46,
    animation: { animateRotate: true, animateScale: false },
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#4A4A4A',
        anchor: 'center',
        offset: 0,
        align: 'center',
        clamp: true,
        display: !isGauge,
        formatter: labelFormatter,
        labels: { title: { font: { size: 11 } } },
      },
      tooltip: {
        displayColors: chartOptions.displayColors,
        position: 'nearest',
        callbacks: {
          title: () => null,
          labelColor: chartOptions.showCustomTooltip
            ? () => ({ backgroundColor: colors[tooltipIdx], borderColor: colors[tooltipIdx] })
            : undefined,
          label: (context: any) =>
            chartOptions.showCustomTooltip ? tooltips[tooltipIdx] : tooltips[context.dataIndex],
        },
      },
    },
  }
  if (isGauge) {
    options.circumference = 180
    options.rotation = 270
    options.cutout = '60%'
  }
  // Angular adds a category x-axis unless hideScale — on the gauge it draws the
  // baseline and the "Start" / "Target" labels at either end.
  if (!chartOptions.hideScale) {
    options.scales = {
      x: {
        grid: { display: false },
        border: { display: true },
        display: !('hideLabels' in chartOptions),
        type: 'category',
      },
    }
  }

  const data = { labels: chartOptions.labels ?? [], datasets: [dataset] }
  return { data, options, isGauge }
}

const GAUGE_PLUGINS = [gaugeNeedlePlugin]
const NO_PLUGINS: Plugin<'doughnut'>[] = []

function PieChart({ chartData }: { chartData: ISQFChartData }) {
  // Stable data/options so react-chartjs-2 only updates the chart when chartData changes
  const config = useMemo(() => buildPieConfig(chartData), [chartData])
  if (!config) return null
  const { data, options, isGauge } = config
  return (
    <div className={styles.pieChart} style={{ height: 180 }}>
      {chartData.chartType === 'pie'
        ? <Pie data={data as any} options={options as any} />
        : <Doughnut data={data as any} options={options as any} plugins={isGauge ? GAUGE_PLUGINS : NO_PLUGINS} />}
    </div>
  )
}

/** Transform the backend's custom datasets object into standard Chart.js datasets array */
function buildChartJsData(chartData: ISQFChartData) {
  const labels = chartData.chartOptions?.labels ?? []
  const datasets: object[] = []
  const dataLabels: (string | undefined)[][] = []
  const tooltipData: (string | undefined)[][] = []

  const dsKeys = Object.keys(chartData.datasets || {}).filter(k => k !== 'needle')
  const { showOnlyDataSet } = chartData.chartOptions ?? {}
  const isHorizontal = chartData.chartType === 'horizontalBar'

  // Mirrors Angular SqfBarChartComponent.getBarThickness
  const barThickness = (key: string, index: number) => {
    const ds = chartData.datasets[key]
    if (ds && 'barThickness' in ds) return ds.barThickness
    if (index === 0) return showOnlyDataSet ? 28 : isHorizontal ? 13 : 15
    return 28
  }

  dsKeys.forEach((key, index) => {
    const ds = chartData.datasets[key]
    const rows = ds?.data || ds?._data
    if (!Array.isArray(rows)) return

    // showOnlyDataSet zeroes every dataset except the named one (Angular generateBarChartData)
    const multiVal = showOnlyDataSet && showOnlyDataSet !== `Bar_${index + 1}` ? 0 : 1
    const values = rows.map(r => r.value * multiVal)
    const colors = rows.map(r => r.color)
    dataLabels.push(rows.map(r => r.dataLabel))
    tooltipData.push(rows.map(r => r.tooltip))

    datasets.push({
      data: values,
      backgroundColor: colors,
      hoverBackgroundColor: colors,
      pointBorderColor: colors,
      borderWidth: 0,
      barThickness: barThickness(key, index),
      categoryPercentage: index === 1 ? 1 : 0.8,
      barPercentage: index === 1 ? 1 : 0.9,
    })
  })

  return { labels, datasets, dataLabels, tooltipData }
}

/**
 * Container sizes mirror Angular: bar charts get `height` (146px summary /
 * 156px details) via .qf-bar-chart; pie/doughnut/gauge are always 180px tall
 * (.qf-gauge-chart, set by both card templates).
 */
export const MetricCardChart = memo(function MetricCardChart({ chartData, height = 146 }: { chartData: ISQFChartData; height?: number }) {
  if (!chartData?.datasets || !chartData.chartOptions) return null

  const { chartType } = chartData
  if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'gauge') {
    return <PieChart chartData={chartData} />
  }
  return <BarChart chartData={chartData} height={height} />
})

function BarChart({ chartData, height }: { chartData: ISQFChartData; height: number }) {
  // Stable data/options so react-chartjs-2 only updates the chart when chartData changes
  const config = useMemo(() => buildBarConfig(chartData), [chartData])
  if (!config) return null
  return (
    <div className={styles.barChart} style={{ height }}>
      <Bar data={config.data as any} options={config.options as any} />
    </div>
  )
}

function buildBarConfig(chartData: ISQFChartData) {
  const { chartType } = chartData
  const data = buildChartJsData(chartData)

  if (data.datasets.length === 0) return null

  const isHorizontal = chartType === 'horizontalBar'

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: isHorizontal ? HORIZONTAL_BAR_ANIMATION : BAR_ANIMATION,
    plugins: {
      legend: { display: false },
      datalabels: { display: false } as object,
    },
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

  const indexAxis = (isHorizontal ? 'y' : 'x') as 'x' | 'y'
  const barOptions = {
    ...baseOptions,
    indexAxis,
    layout: {
      padding:
        'padding' in chartOptions
          ? chartOptions.padding
          : isHorizontal ? { top: 10, left: 20, right: 25 } : { top: 16 },
    },
    interaction: { mode: 'point' as const, axis: indexAxis },
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
        yAlign: (isHorizontal ? 'center' : 'top') as 'center' | 'top',
        position: 'average' as const,
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
    // Mirrors Angular getAxisConfig — note any `hideLabels` key (even false) hides the index axis
    scales: {
      [indexAxis]: {
        stacked: chartOptions.stacked ?? false,
        grid: { display: false },
        border: { display: true },
        display: !('hideLabels' in chartOptions),
      },
      [isHorizontal ? 'x' : 'y']: {
        stacked: false,
        display: false,
        beginAtZero: true,
        ticks: { display: false },
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  return { data, options: barOptions }
}


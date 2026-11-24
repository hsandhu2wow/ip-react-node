import DOMPurify from 'dompurify'
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart, Doughnut } from 'react-chartjs-2'
import type { IQuickFactsMixedChart, IQuickFactsTitleWidget } from '../../../../shared/types/sqf.types'
import { xAxisLabelHoverPlugin } from '../../chart-plugins/xAxisLabelHover'
import styles from './TitleWidget.module.scss'

ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  ChartDataLabels,
  xAxisLabelHoverPlugin,
)

type ChartValue = number | null
type MixedChartData = ChartData<'bar' | 'line', ChartValue[], string>

function buildMixedChart(chart: IQuickFactsMixedChart): {
  data: MixedChartData
  options: ChartOptions<'bar' | 'line'>
} | null {
  const labels = chart.config?.x_axis?.labels ?? []
  const general = chart.config?.general ?? {}
  const horizontal = general.bar_chart_orientation === 'horizontal'
  const axisKey = horizontal ? 'xAxisID' : 'yAxisID'
  const datasets: MixedChartData['datasets'] = []
  const tooltipRows: Array<Array<string | null | undefined>> = []

  for (const line of Object.values(chart.lines ?? {})) {
    datasets.push({
      type: 'line',
      data: line.data,
      label: line.legend,
      borderColor: line.colour,
      backgroundColor: line.colour,
      pointBorderColor: line.data_point_outline_colour ?? line.colour,
      pointRadius: general.show_data_points ? 3 : 0,
      borderDash: line.line_type === 'dashed' ? [10, 5] : [],
      borderWidth: 2,
      fill: false,
      [axisKey]: 'line',
    })
    tooltipRows.push(line.tooltip_data ?? [])
  }

  for (const line of Object.values(chart.lines_secondary ?? {})) {
    datasets.push({
      type: 'line',
      data: line.data,
      label: line.legend,
      borderColor: line.colour,
      backgroundColor: line.colour,
      pointBorderColor: line.data_point_outline_colour ?? line.colour,
      pointRadius: general.show_data_points ? 3 : 0,
      borderDash: line.line_type === 'dashed' ? [10, 5] : [],
      borderWidth: 2,
      fill: false,
      [axisKey]: 'line_secondary',
    })
    tooltipRows.push(line.tooltip_data ?? [])
  }

  for (const bar of Object.values(chart.bars ?? {})) {
    const colors = bar.data.map(row => row.colour)
    datasets.push({
      type: 'bar',
      data: bar.data.map(row => row.value),
      label: bar.legend,
      backgroundColor: colors,
      hoverBackgroundColor: colors,
      borderWidth: 0,
      categoryPercentage: bar.hidden ? 0 : bar.categoryPercentage ?? 0.9,
      barPercentage: bar.hidden ? 0 : bar.barPercentage ?? 0.9,
      hidden: bar.hidden,
      [axisKey]: 'bar',
    })
    tooltipRows.push(bar.data.map(row => row.tooltip))
  }

  for (const bar of Object.values(chart.bars_secondary ?? {})) {
    const colors = bar.data.map(row => row.colour)
    datasets.push({
      type: 'bar',
      data: bar.data.map(row => row.value),
      label: bar.legend,
      backgroundColor: colors,
      hoverBackgroundColor: colors,
      borderWidth: 0,
      categoryPercentage: bar.hidden ? 0 : bar.categoryPercentage ?? 0.9,
      barPercentage: bar.hidden ? 0 : bar.barPercentage ?? 0.9,
      hidden: bar.hidden,
      [axisKey]: 'bars_secondary',
    })
    tooltipRows.push(bar.data.map(row => row.tooltip))
  }

  const targetLines = Object.values(chart.target_lines ?? {})
  for (const target of targetLines) {
    if (target.target_line_value === null || target.target_line_value === undefined) continue
    datasets.push({
      type: 'line',
      data: labels.map(() => target.target_line_value),
      label: target.target_line_label ?? '',
      borderColor: target.hidden ? 'transparent' : target.target_line_colour ?? '#666666',
      backgroundColor: target.target_line_colour ?? '#666666',
      borderDash: target.hidden ? [1, 100] : [10, 5],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      [axisKey]: target.target_line_axis ?? (chart.lines ? 'line' : 'bar'),
    })
    tooltipRows.push([])
  }

  if (!datasets.length) return null

  const stacked = general.bar_chart_type !== 'side_by_side'
  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: general.chart_size === 'small' ? 2.5 : 1.125,
    animation: false,
    indexAxis: horizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false, axis: horizontal ? 'y' : 'x' },
    plugins: {
      legend: { display: false },
      datalabels: { display: general.show_bar_data_points ?? false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: context => {
            const value = tooltipRows[context.datasetIndex]?.[context.dataIndex]
            if (general.show_custom_tooltip) return value ?? ''
            const label = context.dataset.label ? `${context.dataset.label}: ` : ''
            return `${label}${value ?? context.raw ?? ''}`
          },
        },
      },
    },
    scales: {
      x: { type: horizontal ? 'linear' : 'category', stacked },
      y: { type: horizontal ? 'category' : 'linear', stacked },
      bar: { type: 'linear', axis: horizontal ? 'x' : 'y', position: 'left' },
      bars_secondary: { type: 'linear', axis: horizontal ? 'x' : 'y', position: 'right' },
      line: { type: 'linear', axis: horizontal ? 'x' : 'y', position: 'right' },
      line_secondary: { type: 'linear', axis: horizontal ? 'x' : 'y', position: 'right' },
    },
  }

  return { data: { labels, datasets }, options }
}

function MixedChart({ chart }: { chart: IQuickFactsMixedChart }) {
  const segments = chart.data ?? []
  if (chart.chart_type === 'doughnut') {
    if (!segments.length) return null
    return (
      <Doughnut
        data={{
          labels: segments.map(segment => segment.legend ?? ''),
          datasets: [{
            data: segments.map(segment => segment.value),
            backgroundColor: segments.map(segment => segment.colour),
            borderWidth: 0,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          rotation: chart.config?.general?.rotation,
          circumference: chart.config?.general?.circumference,
          cutout: chart.config?.general?.cutout ?? '60%',
          plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } },
        }}
      />
    )
  }

  const config = buildMixedChart(chart)
  if (!config) return null
  return <Chart type="bar" data={config.data} options={config.options} />
}

interface Props {
  card: IQuickFactsTitleWidget | null | undefined
}

export function TitleWidget({ card }: Props) {
  if (!card || card.card_identifier !== 'widget_card' || card.hasError) return null

  const contents = card.card_contents
  const chart = contents?.mixed_chart
  const dialLabel = chart?.data?.find(segment => segment.legend)?.legend ?? ''
  const caption = chart?.caption

  if (!contents?.card_header_title && !contents?.rich_text && !chart) return null

  return (
    <section className={styles.widget} aria-label="Quick Facts title widget">
      {contents.card_header_title && <div className={styles.label}>{contents.card_header_title}</div>}
      {contents.rich_text && (
        <div
          className={styles.stats}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contents.rich_text) }}
        />
      )}
      {chart && (
        <div className={styles.dialGroup}>
          <div className={styles.dial} role="img" aria-label={`${contents.card_header_title ?? 'Quick Facts'} chart`}>
            <MixedChart chart={chart} />
          </div>
          {(dialLabel || caption) && (
            <div className={styles.dialText}>
              {dialLabel && <span className={styles.dialPercent}>{dialLabel}</span>}
              {caption && <span className={styles.dialCaption}>{caption}</span>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

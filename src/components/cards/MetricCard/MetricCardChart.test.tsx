import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ISQFChartData } from '../../../types/sqf.types'
import { MetricCardChart } from './MetricCardChart'
import { MetricCardTabs } from './MetricCardTabs'

interface Dataset {
  data: number[]
  backgroundColor: string[]
  hoverBackgroundColor: string[]
  barThickness: number
  categoryPercentage: number
  barPercentage: number
}

interface LabelContext {
  datasetIndex: number
  dataIndex: number
  chart: { config: { data: { datasets: Dataset[] } } }
}

interface ChartProps {
  data: { labels: string[]; datasets: Dataset[] }
  options: {
    indexAxis?: 'x' | 'y'
    scales?: Record<string, { stacked?: boolean; display?: boolean }>
    plugins: {
      datalabels: {
        display: boolean | ((context: LabelContext) => boolean)
        formatter?: (value: unknown, context: LabelContext) => string | null
      }
      tooltip?: {
        displayColors: boolean
        callbacks: {
          title: () => string
          label: (context: Pick<LabelContext, 'datasetIndex' | 'dataIndex'>) => string | undefined
        }
      }
    }
  }
}

interface GaugeCanvas {
  ctx: {
    save: () => void; restore: () => void; fillText: (text: string, x: number, y: number) => void
    translate: (x: number, y: number) => void; rotate: (angle: number) => void
    beginPath: () => void; moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void
    stroke: () => void; arc: (x: number, y: number, radius: number, start: number, end: number) => void
    fill: () => void
  }
  chartArea: { left: number; top: number; width: number; height: number }
  data: CircularProps['data']
}

interface CircularProps {
  data: {
    labels: string[]
    datasets: {
      data: number[]
      needleData?: { value: number; color: string; dataLabel: string | string[] }
      backgroundColor: string[] | ((context: {
        chart: {
          chartArea?: { left: number; right: number }
          ctx: { createLinearGradient: (x: number, y: number, x2: number, y2: number) => { addColorStop: (offset: number, color: string) => void } }
        }
      }) => unknown)
    }[]
  }
  options: {
    circumference?: number; rotation?: number; cutout?: string
    scales?: { x: { display: boolean } }
    plugins: {
      datalabels: { formatter: (value: number, context: LabelContext) => string | null | undefined; display: boolean }
      tooltip: { callbacks: {
        title: () => null
        label: (context: { dataIndex: number }) => string | undefined
        labelColor?: () => { backgroundColor: string; borderColor: string }
      } }
    }
  }
  plugins?: { afterDatasetsDraw: (chart: GaugeCanvas) => void }[]
}

const charts = vi.hoisted(() => ({
  Bar: vi.fn<(props: ChartProps) => void>(),
  Pie: vi.fn<(props: CircularProps) => void>(),
  Doughnut: vi.fn<(props: CircularProps) => void>(),
}))

vi.mock('react-chartjs-2', () => ({
  Bar: (props: ChartProps) => { charts.Bar(props); return <div aria-label="Bar chart" /> },
  Pie: (props: CircularProps) => { charts.Pie(props); return <div aria-label="Pie chart" /> },
  Doughnut: (props: CircularProps) => { charts.Doughnut(props); return <div aria-label="Doughnut chart" /> },
}))

function fixture(extra: Partial<ISQFChartData> = {}): ISQFChartData {
  return {
    chartType: 'bar',
    chartOptions: { labels: ['Sales', 'Wages'] },
    datasets: {
      actual: { data: [
        { value: 20, color: '#219653', dataLabel: '20K', tooltip: 'Actual sales' },
        { value: 10, color: '#eb5757', dataLabel: '10K', tooltip: 'Actual wages' },
      ] },
      plan: { _data: [
        { value: 15, color: '#ddd', dataLabel: '15K', tooltip: 'Planned sales' },
        { value: 25, color: '#ccc', dataLabel: '25K', tooltip: 'Planned wages' },
      ], barThickness: 32 },
      needle: {
        data: [{ value: 99, color: '#000', dataLabel: 'Needle' }],
        needleData: { value: 99, color: '#000', dataLabel: 'Needle' },
      },
    },
    ...extra,
  }
}

function barProps() {
  return charts.Bar.mock.calls.at(-1)![0]
}

function context(props: ChartProps, datasetIndex: number, dataIndex: number): LabelContext {
  return { datasetIndex, dataIndex, chart: { config: { data: props.data } } }
}

describe('MetricCardChart', () => {
  beforeEach(() => vi.clearAllMocks())

  it('transforms data and legacy _data datasets, excluding the gauge needle', () => {
    render(<MetricCardChart chartData={fixture()} height={200} />)
    const props = barProps()
    expect(props.data.labels).toEqual(['Sales', 'Wages'])
    expect(props.data.datasets).toHaveLength(2)
    expect(props.data.datasets[0]).toMatchObject({
      data: [20, 10], backgroundColor: ['#219653', '#eb5757'],
      hoverBackgroundColor: ['#219653', '#eb5757'],
      barThickness: 15, categoryPercentage: 0.8, barPercentage: 0.9,
    })
    expect(props.data.datasets[1]).toMatchObject({
      data: [15, 25], barThickness: 32, categoryPercentage: 1, barPercentage: 1,
    })
    expect(screen.getByLabelText('Bar chart').parentElement).toHaveStyle({ height: '200px' })
    expect(props.options.indexAxis).toBe('x')
    expect(props.options.scales?.x.stacked).toBe(false)
  })

  it('configures horizontal stacked bars and tooltip color keys', () => {
    render(<MetricCardChart chartData={fixture({
      chartType: 'horizontalBar', chartOptions: { stacked: true, displayColors: true },
    })} />)
    const props = barProps()
    expect(props.data.labels).toEqual([])
    expect(props.options.indexAxis).toBe('y')
    expect(props.options.scales?.y.stacked).toBe(true)
    expect(props.options.scales?.x.display).toBe(false)
    expect(props.options.plugins.tooltip?.displayColors).toBe(true)
  })

  it('labels only the greatest bar at each index using its backend label', () => {
    render(<MetricCardChart chartData={fixture()} />)
    const props = barProps()
    const { display, formatter } = props.options.plugins.datalabels
    expect(typeof display).toBe('function')
    if (typeof display !== 'function' || !formatter) throw new Error('Bar label callbacks missing')
    expect(display(context(props, 0, 0))).toBe(true)
    expect(display(context(props, 1, 0))).toBe(false)
    expect(display(context(props, 0, 1))).toBe(false)
    expect(display(context(props, 1, 1))).toBe(true)
    expect(formatter(25, context(props, 1, 1))).toBe('25K')
    expect(formatter(0, context(props, 1, 5))).toBeNull()
  })

  it('always labels a single dataset and handles missing data labels', () => {
    render(<MetricCardChart chartData={fixture({
      datasets: { actual: { data: [{ value: 5, color: '#219653', dataLabel: 'Five' }, { value: 10, color: '#219653' }] } },
    })} />)
    const props = barProps()
    const { display, formatter } = props.options.plugins.datalabels
    if (typeof display !== 'function' || !formatter) throw new Error('Bar label callbacks missing')
    expect(display(context(props, 0, 0))).toBe(true)
    expect(formatter(5, context(props, 0, 0))).toBe('Five')
    expect(formatter(10, context(props, 0, 1))).toBeNull()
  })

  it('uses the configured dataset for fixed labels', () => {
    render(<MetricCardChart chartData={fixture({
      chartOptions: { hasFixedDataLabel: true, displayDataLabelIndex: 1 },
    })} />)
    const props = barProps()
    expect(props.options.plugins.datalabels.formatter?.(20, context(props, 0, 0))).toBe('15K')
    expect(props.options.plugins.datalabels.formatter?.(0, context(props, 0, 5))).toBeNull()
  })

  it('returns each dataset tooltip unless the custom tooltip uses only the first', () => {
    const { rerender } = render(<MetricCardChart chartData={fixture()} />)
    let callbacks = barProps().options.plugins.tooltip!.callbacks
    expect(callbacks.title()).toBe('')
    expect(callbacks.label({ datasetIndex: 1, dataIndex: 0 })).toBe('Planned sales')
    expect(callbacks.label({ datasetIndex: 9, dataIndex: 0 })).toBeUndefined()
    rerender(<MetricCardChart chartData={fixture({ chartOptions: { showCustomTooltip: true } })} />)
    callbacks = barProps().options.plugins.tooltip!.callbacks
    expect(callbacks.label({ datasetIndex: 0, dataIndex: 0 })).toBe('Actual sales')
    expect(callbacks.label({ datasetIndex: 1, dataIndex: 0 })).toBeUndefined()
  })

  it.each(['pie', 'doughnut', 'gauge'] as const)('renders %s using the appropriate circular chart', chartType => {
    const circularData = fixture({ chartType });
    circularData.datasets = { Bar_1: circularData.datasets.actual };
    render(<MetricCardChart chartData={circularData} />)
    expect(screen.getByLabelText(chartType === 'pie' ? 'Pie chart' : 'Doughnut chart')).toBeInTheDocument()
    const props = (chartType === 'pie' ? charts.Pie : charts.Doughnut).mock.calls[0][0]
    expect(props.options.plugins.datalabels.display).toBe(chartType !== 'gauge')
    expect(charts.Bar).not.toHaveBeenCalled()
  })

  it('renders nothing when no plottable datasets remain', () => {
    const { container } = render(<MetricCardChart chartData={fixture({
      datasets: { empty: {}, needle: { needleData: { value: 5, color: '#000', dataLabel: '' } } },
    })} />)
    expect(container).toBeEmptyDOMElement()
    expect(charts.Bar).not.toHaveBeenCalled()
  })

  it('switches a tabbed card from its chart to a table without retaining the old view', () => {
    render(<MetricCardTabs tabs={[
      { label: 'Graph', chartData: fixture() },
      { label: 'Table', tableData: { headers: ['Sales'], data: [{ column0: { displayValue: '20K sales' } }] } },
    ]} />)
    expect(screen.getByLabelText('Bar chart')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Table' }))
    expect(screen.queryByLabelText('Bar chart')).not.toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '20K sales' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Graph' }))
    expect(screen.getByLabelText('Bar chart')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('uses pie labels and configured custom tooltip colors without bar label rules', () => {
    const options = { labels: ['Actual', 'Plan'], showCustomTooltip: true, showTooltipColorIndex: 1 }
    const chart = fixture({ chartType: 'pie', chartOptions: options })
    chart.datasets = { Bar_1: chart.datasets.actual }
    const { rerender } = render(<MetricCardChart chartData={chart} />)
    let props = charts.Pie.mock.calls.at(-1)![0]
    const labelContext = (datasetCount = 1, dataIndex = 0): LabelContext => ({
      datasetIndex: 0, dataIndex,
      chart: { config: { data: { datasets: Array.from({ length: datasetCount }, () => barPropsDataset()) } } },
    })
    function barPropsDataset(): Dataset {
      return { data: [], backgroundColor: [], hoverBackgroundColor: [], barThickness: 0, categoryPercentage: 1, barPercentage: 1 }
    }
    expect(props.data.datasets[0].data).toEqual([20, 10])
    expect(props.options.plugins.datalabels.formatter(20, labelContext())).toBe('20K')
    expect(props.options.plugins.datalabels.formatter(20, labelContext(1, 9))).toBeNull()
    expect(props.options.plugins.datalabels.formatter(20, labelContext(2))).toBeUndefined()
    expect(props.options.plugins.tooltip.callbacks.title()).toBeNull()
    expect(props.options.plugins.tooltip.callbacks.label({ dataIndex: 0 })).toBe('Actual wages')
    expect(props.options.plugins.tooltip.callbacks.labelColor?.()).toEqual({ backgroundColor: '#eb5757', borderColor: '#eb5757' })
    for (const displayDataLabelIndex of [0, 1]) {
      rerender(<MetricCardChart chartData={{
        ...chart, chartOptions: { hasFixedDataLabel: true, displayDataLabelIndex },
      }} />)
      props = charts.Pie.mock.calls.at(-1)![0]
      expect(props.options.plugins.datalabels.formatter(20, labelContext())).toBe(displayDataLabelIndex === 0 ? '20K' : undefined)
      expect(props.options.plugins.tooltip.callbacks.label({ dataIndex: 0 })).toBe('Actual sales')
    }
  })

  it.each(['Target', ['Target', '95%', 'Plan']])('draws a gauge needle and its %j label at the chart geometry', dataLabel => {
    const chart = fixture({ chartType: 'gauge' })
    const needle = { value: 1, color: '#123', dataLabel, data: [] }
    chart.datasets = { Bar_1: chart.datasets.actual, needle }
    const chartOptions = { ...chart.chartOptions, gradientColors: ['#111', '#222', '#333'], emptyGaugeColor: '#eee', hideScale: true }
    chart.chartOptions = chartOptions
    render(<MetricCardChart chartData={chart} />)
    const props = charts.Doughnut.mock.calls.at(-1)![0]
    expect(props.options).toMatchObject({ circumference: 180, rotation: 270, cutout: '60%' })
    expect(props.options.scales).toBeUndefined()
    const addColorStop = vi.fn()
    const gradient = { addColorStop }
    const createLinearGradient = vi.fn().mockReturnValue(gradient)
    const fill = props.data.datasets[0].backgroundColor
    if (typeof fill !== 'function') throw new Error('Missing gauge gradient callback')
    expect(fill({ chart: { ctx: { createLinearGradient } } })).toBeUndefined()
    expect(fill({ chart: { chartArea: { left: 10, right: 210 }, ctx: { createLinearGradient } } })).toEqual([gradient, '#eee'])
    expect(createLinearGradient).toHaveBeenCalledWith(10, 0, 210, 0)
    expect(addColorStop.mock.calls).toEqual([[0, '#111'], [0.5, '#222'], [1, '#333']])
    const ctx = {
      save: vi.fn(), restore: vi.fn(), fillText: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    }
    const draw = props.plugins?.[0].afterDatasetsDraw
    if (!draw) throw new Error('Missing gauge needle plugin')
    draw({ ctx, data: props.data, chartArea: { left: 10, top: 5, width: 200, height: 100 } })
    expect(ctx.translate).toHaveBeenCalledWith(110, 105)
    expect(ctx.rotate).toHaveBeenCalledWith(0)
    expect(ctx.lineTo).toHaveBeenCalledWith(105, 0)
    expect(ctx.arc).toHaveBeenCalledWith(110, 105, 5, 0, Math.PI * 2)
    expect(ctx.fillText.mock.calls).toEqual(typeof dataLabel === 'string'
      ? [[dataLabel, 110, 125]]
      : [[dataLabel[0], 110, 125], [dataLabel[1], 110, 140], [dataLabel[2], 110, 145]])
    ctx.save.mockClear()
    draw({ ctx, data: { labels: [], datasets: [] }, chartArea: { left: 0, top: 0, width: 0, height: 0 } })
    expect(ctx.save).not.toHaveBeenCalled()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { IQuickFactsTitleWidget } from '../../../../shared/types/sqf.types'
import { TitleWidget } from './TitleWidget'

const charts = vi.hoisted(() => ({
  Chart: vi.fn(),
  Doughnut: vi.fn(),
}))

vi.mock('react-chartjs-2', () => ({
  Chart: (props: unknown) => {
    charts.Chart(props)
    return <canvas data-testid="mixed-chart" />
  },
  Doughnut: (props: unknown) => {
    charts.Doughnut(props)
    return <canvas data-testid="doughnut-chart" />
  },
}))

const widget: IQuickFactsTitleWidget = {
  card_identifier: 'widget_card',
  card_position: 0,
  metric_key: 'monthly_profit',
  card_contents: {
    card_header_title: 'Profit summary',
    rich_text: '<strong>API value</strong><script>window.injected = true</script>',
    mixed_chart: {
      chart_type: 'doughnut',
      config: { general: { cutout: '60%' } },
      data: [
        { value: 37, colour: '#e0e0e0' },
        { value: 63, colour: '#219653', legend: '63%' },
      ],
      caption: 'of YTD budget',
    },
  },
}

describe('TitleWidget', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the title, sanitized rich text, doughnut, legend label, and caption', () => {
    render(<TitleWidget card={widget} />)

    expect(screen.getByText('Profit summary')).toBeInTheDocument()
    expect(screen.getByText('API value').tagName).toBe('STRONG')
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    expect(screen.getByText('63%')).toBeInTheDocument()
    expect(screen.getByText('of YTD budget')).toBeInTheDocument()
  })

  it('renders mixed bar and line series with Angular axis and target-line settings', () => {
    const mixed: IQuickFactsTitleWidget = {
      ...widget,
      card_contents: {
        card_header_title: 'Monthly results',
        mixed_chart: {
          config: {
            general: { bar_chart_orientation: 'horizontal', bar_chart_type: 'stacked', show_custom_tooltip: true },
            x_axis: { labels: ['North', 'South'] },
          },
          bars: {
            actual: { legend: 'Actual', data: [{ value: 4, colour: '#219653', tooltip: 'Four' }, { value: 5, colour: '#219653' }] },
          },
          lines: {
            target: { legend: 'Target', data: [6, 6], colour: '#00308c' },
          },
          target_lines: {
            goal: { target_line_value: 5, target_line_axis: 'bar', target_line_label: 'Goal', target_line_colour: '#555' },
          },
        },
      },
    }

    render(<TitleWidget card={mixed} />)

    const [{ data, options }] = charts.Chart.mock.calls.at(-1)!
    expect(options.indexAxis).toBe('y')
    expect(data.datasets.map((dataset: { label: string; type?: string }) => [dataset.label, dataset.type])).toEqual([
      ['Target', 'line'],
      ['Actual', 'bar'],
      ['Goal', 'line'],
    ])
    expect(options.plugins.tooltip.callbacks.label({
      datasetIndex: 1,
      dataIndex: 0,
      dataset: data.datasets[1],
      chart: { data },
    })).toBe('Four')
  })

  it.each([
    { label: 'missing', card: undefined },
    { label: 'errored', card: { ...widget, hasError: true } },
    {
      label: 'non-widget',
      card: { ...widget, card_identifier: 'metric_card' } as unknown as IQuickFactsTitleWidget,
    },
  ])('renders nothing for a $label widget', ({ card }) => {
    const { container } = render(<TitleWidget card={card} />)

    expect(container.firstChild).toBeNull()
  })
})

import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeasonalBarChart } from './SeasonalBarChart'
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'

const bar = vi.hoisted(() => vi.fn())
vi.mock('react-chartjs-2', () => ({ Bar: (props: unknown) => { bar(props); return <canvas aria-label="Seasonal Sales" /> } }))
it('plots daily sales as fixed green bars with the legacy axes and Sales tooltip', () => {
  render(<SeasonalBarChart chartData={[{ day: 'Mon', sales: 1234 }]} />)
  expect(screen.getByLabelText('Seasonal Sales')).toBeInTheDocument()
  const props = bar.mock.calls[0][0] as { data: ChartData<'bar'>; options: ChartOptions<'bar'> }
  expect(props.data).toMatchObject({ labels: ['Mon'], datasets: [{ label: 'Sales', data: [1234], barThickness: 15, backgroundColor: '#219653', pointBorderColor: '#219653' }] })
  expect(props.options).toMatchObject({ aspectRatio: 1.46, layout: { padding: { top: 8 } }, plugins: {
    legend: { display: false }, datalabels: { display: false }, tooltip: { mode: 'index', intersect: false },
  }, scales: { x: { grid: { display: false } }, y: { ticks: { display: false }, grid: { display: false }, border: { display: false } } } })
  const callbacks = props.options.plugins!.tooltip!.callbacks!
  expect(callbacks.label!.call({} as never, { raw: 1234 } as TooltipItem<'bar'>)).toBe('Sales: $1.2K')
  expect(callbacks.title!.call({} as never, [])).toBeNull()
})

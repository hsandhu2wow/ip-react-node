import { describe, it, expect, vi } from 'vitest'
import type { Chart } from 'chart.js'
import { xAxisLabelHoverPlugin } from './xAxisLabelHover'

function fakeChart() {
  const el = (i: number) => ({ i })
  return {
    chartArea: { left: 0, right: 300, top: 0, bottom: 100 },
    options: {},
    scales: { x: { getValueForPixel: (x: number) => x / 100 } },
    getSortedVisibleDatasetMetas: () => [{ index: 0, data: [el(0), el(1), el(2)] }],
    setActiveElements: vi.fn(),
    tooltip: { setActiveElements: vi.fn() },
    update: vi.fn(),
  }
}

const fire = (chart: ReturnType<typeof fakeChart>, type: string, x: number, y: number) =>
  xAxisLabelHoverPlugin.afterEvent!(chart as unknown as Chart, { event: { type, x, y } } as never, {})

describe('xAxisLabelHoverPlugin (Angular sqf/chart-plugins)', () => {
  it('activates the bar tooltip when hovering an x-axis label', () => {
    const chart = fakeChart()
    fire(chart, 'mousemove', 140, 110)
    const active = [{ datasetIndex: 0, index: 1, element: { i: 1 } }]
    expect(chart.setActiveElements).toHaveBeenCalledWith(active)
    expect(chart.tooltip.setActiveElements).toHaveBeenCalledWith(active, { x: 140, y: 100 })
    expect(chart.update).toHaveBeenCalled()
  })

  it('ignores moves inside the plot area, below the label band and non-mousemove events', () => {
    const chart = fakeChart()
    fire(chart, 'mousemove', 140, 50)
    fire(chart, 'mousemove', 140, 131)
    fire(chart, 'click', 140, 110)
    expect(chart.setActiveElements).not.toHaveBeenCalled()
  })
})

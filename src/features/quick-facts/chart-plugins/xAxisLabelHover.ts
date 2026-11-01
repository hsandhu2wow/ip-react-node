import type { ActiveElement, Plugin } from 'chart.js'

/** Port of Angular sqf/chart-plugins/x-axis-label-hover.plugin.ts: hovering an x-axis label shows that bar's tooltip. */
export const xAxisLabelHoverPlugin: Plugin = {
  id: 'xAxisLabelHover',
  afterEvent(chart, args) {
    const event = args.event
    if (event.type !== 'mousemove') return

    const { chartArea, options, scales } = chart
    const indexAxis = (options as { indexAxis?: string }).indexAxis || 'x'
    const categoryScale = indexAxis === 'y' ? scales.y : scales.x
    const { x, y } = event as { x: number; y: number }

    // Label band height below the plot area (same 30px as Angular)
    const isOnXAxisLabels =
      y >= chartArea.bottom && y <= chartArea.bottom + 30 && x >= chartArea.left && x <= chartArea.right
    if (!isOnXAxisLabels) return

    const value = categoryScale.getValueForPixel(x)
    if (value == null || isNaN(value as number)) return

    const index = Math.round(value as number)
    const active = chart
      .getSortedVisibleDatasetMetas()
      .map(meta => {
        const element = meta.data && meta.data[index]
        return element ? { datasetIndex: meta.index, index, element } : null
      })
      .filter(Boolean) as ActiveElement[]
    if (!active.length) return

    chart.setActiveElements(active)
    chart.tooltip?.setActiveElements(active, { x, y: chartArea.bottom })
    chart.update()
  },
}

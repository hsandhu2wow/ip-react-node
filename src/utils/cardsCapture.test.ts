import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPageCanvases, ignoreElements, markScrollContainerForPreview } from './cardsCapture'

vi.mock('html2canvas-pro', () => ({
  default: vi.fn(async (el: HTMLElement) => {
    const canvas = document.createElement('canvas')
    canvas.dataset.classes = el.className
    canvas.dataset.container = document.getElementById('qf-scroll-container')?.className
    return canvas
  }),
}))

describe('Weekly Facts page capture', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('captures the page without the scroll container classes, then restores them', async () => {
    document.body.innerHTML =
      '<div id="js-weekly-card" class="wf-home"><div id="qf-scroll-container" class="_wrap_x qf-scroll-container"></div></div>'

    markScrollContainerForPreview()
    const [canvas] = await getPageCanvases([{ jsId: 'js-weekly-card' } as never])

    expect(canvas.dataset.container).toBe('qf-summary-card__preview-wf')
    expect(canvas.dataset.classes).toContain('js-weekly-card__preview')
    expect(document.getElementById('qf-scroll-container')!.className).toBe('_wrap_x qf-scroll-container')
    expect(document.getElementById('js-weekly-card')!.className).toBe('wf-home')
  })

  it('excludes transient KPI tooltips without hiding table content', () => {
    const tooltip = document.createElement('span')
    tooltip.setAttribute('role', 'tooltip')
    expect(ignoreElements(tooltip)).toBe(true)
    expect(ignoreElements(document.createElement('td'))).toBe(false)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import html2canvas from 'html2canvas-pro'
import {
  cropCanvas, findCommonContainer, getCardsCanvases, getPageCanvases, ignoreElements,
  markScrollContainerForPreview, restoreScrollContainer,
} from './cardsCapture'

vi.mock('html2canvas-pro', () => ({
  default: vi.fn(async (el: HTMLElement) => {
    const canvas = document.createElement('canvas')
    canvas.dataset.classes = el.className
    canvas.dataset.container = document.getElementById('qf-scroll-container')?.className
    return canvas
  }),
}))

describe('Weekly Facts page capture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('captures the page without the scroll container classes, then restores them', async () => {
    document.body.innerHTML =
      '<div id="js-weekly-card" class="wf-home"><div id="qf-scroll-container" class="_wrap_x qf-scroll-container"></div></div>'

    markScrollContainerForPreview()
    const [canvas] = await getPageCanvases([{ jsId: 'js-weekly-card' }])

    expect(canvas.dataset.container).toBe('qf-summary-card__preview-wf')
    expect(canvas.dataset.classes).toContain('js-weekly-card__preview')
    expect(document.getElementById('qf-scroll-container')!.className).toBe('_wrap_x qf-scroll-container')
    expect(document.getElementById('js-weekly-card')!.className).toBe('wf-home')
  })

  it('restores all page classes and the original scroll container after capture fails', async () => {
    document.body.innerHTML =
      '<div id="first" class="original"></div><div id="second"></div><div id="qf-scroll-container" class="scroll"></div>'
    const error = new Error('capture failed')
    vi.mocked(html2canvas).mockRejectedValueOnce(error)
    markScrollContainerForPreview()
    markScrollContainerForPreview()

    await expect(getPageCanvases([{ jsId: 'first' }, { jsId: 'second' }])).rejects.toBe(error)

    expect(document.getElementById('first')!.className).toBe('original')
    expect(document.getElementById('second')!.className).toBe('')
    expect(document.getElementById('qf-scroll-container')!.className).toBe('scroll')
    expect(document.getElementById('qf-scroll-container')!.hasAttribute('data-qf-original-class')).toBe(false)
    expect(html2canvas).toHaveBeenCalledTimes(1)
  })

  it('skips missing page roots and tolerates absent or unmarked scroll containers', async () => {
    markScrollContainerForPreview()
    restoreScrollContainer()
    expect(await getPageCanvases([{ jsId: '' }, { jsId: 'missing' }])).toEqual([])
    document.body.innerHTML = '<div id="qf-scroll-container" class="unchanged"></div>'
    restoreScrollContainer()
    expect(document.getElementById('qf-scroll-container')!.className).toBe('unchanged')
    expect(html2canvas).not.toHaveBeenCalled()
  })

  it('excludes transient KPI tooltips without hiding table content', () => {
    const tooltip = document.createElement('span')
    tooltip.setAttribute('role', 'tooltip')
    expect(ignoreElements(tooltip)).toBe(true)
    expect(ignoreElements(document.createElement('td'))).toBe(false)
  })

  it.each([
    ['id', 'cdk-overlay-container'],
    ['class', 'cdk-live-announcer-element'],
    ['class', 'cdk-visually-hidden'],
    ['data-testid', 'dialog-backdrop'],
    ['role', 'status'],
  ])('excludes transient nodes with %s=%s', (attribute, value) => {
    const node = document.createElement('div')
    node.setAttribute(attribute, value)
    expect(ignoreElements(node)).toBe(true)
  })
})

describe('card capture workflows', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  function rect(element: HTMLElement, x: number, y: number, width: number, height: number) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(x, y, width, height))
  }

  it('captures a shared ancestor once and crops each card using its position and canvas scaling', async () => {
    document.body.innerHTML = '<section id="container"><div><article id="a" class="existing"></article></div><article id="b"></article></section>'
    const container = document.getElementById('container')!
    const a = document.getElementById('a')!
    const b = document.getElementById('b')!
    rect(container, 10, 20, 200, 300)
    rect(a, 20, 40, 80, 60)
    rect(b, 30, 150, 100, 100)
    const source = Object.assign(document.createElement('canvas'), { width: 400, height: 900 })
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    vi.mocked(html2canvas).mockImplementationOnce(async element => {
      expect(element).toBe(container)
      expect(a.className).toContain('qf-details-card__preview')
      expect(b.className).toContain('qf-summary-card__preview-wf')
      return source
    })
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(80)

    const canvases = await getCardsCanvases([{ jsId: 'a' }, { jsId: 'missing' }, { jsId: '' }, { jsId: 'b' }])

    expect(html2canvas).toHaveBeenCalledExactlyOnceWith(container, {
      ignoreElements, scale: 2, scrollY: -80, logging: false,
    })
    expect(canvases.map(canvas => [canvas.width, canvas.height])).toEqual([[160, 180], [200, 300]])
    expect(drawImage).toHaveBeenNthCalledWith(1, source, 20, 60, 160, 180, 0, 0, 160, 180)
    expect(drawImage).toHaveBeenNthCalledWith(2, source, 40, 390, 200, 300, 0, 0, 200, 300)
    expect(a.className).toBe('existing qf-details-card__preview-wf qf-summary-card__preview-wf')
    expect(b.className).toBe('qf-details-card__preview-wf qf-summary-card__preview-wf')
  })

  it('captures unrelated roots sequentially, retaining card order and cleaning preview classes', async () => {
    document.body.innerHTML = '<section><article id="a"></article></section><aside><article id="b"></article></aside>'
    const a = document.getElementById('a')!
    const b = document.getElementById('b')!
    let resolveFirst!: (canvas: HTMLCanvasElement) => void
    const first = document.createElement('canvas')
    const second = document.createElement('canvas')
    vi.mocked(html2canvas)
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockResolvedValueOnce(second)

    const capture = getCardsCanvases([{ jsId: 'a' }, { jsId: 'b' }])
    await vi.waitFor(() => { expect(html2canvas).toHaveBeenCalledTimes(1) })
    expect(html2canvas).toHaveBeenNthCalledWith(1, a, expect.objectContaining({ scale: 2, ignoreElements }))
    resolveFirst(first)
    expect(await capture).toEqual([first, second])
    expect(html2canvas).toHaveBeenNthCalledWith(2, b, expect.objectContaining({ scale: 2, ignoreElements }))
    expect(a.classList.contains('qf-details-card__preview')).toBe(false)
    expect(b.classList.contains('qf-summary-card__preview')).toBe(false)
  })

  it.each([false, true])('cleans every target when %s shared-container capture fails', async shared => {
    document.body.innerHTML = shared
      ? '<section><article id="a"></article><article id="b"></article></section>'
      : '<article id="a"></article><article id="b"></article>'
    const error = new Error('renderer failed')
    vi.mocked(html2canvas).mockRejectedValueOnce(error)

    await expect(getCardsCanvases([{ jsId: 'a' }, { jsId: 'b' }])).rejects.toBe(error)

    for (const id of ['a', 'b']) {
      const element = document.getElementById(id)!
      expect(element.classList.contains('qf-details-card__preview')).toBe(false)
      expect(element.classList.contains('qf-summary-card__preview')).toBe(false)
    }
  })

  it('returns no canvases without rendering when targets cannot be found', async () => {
    expect(await getCardsCanvases([{ jsId: '' }, { jsId: 'missing' }])).toEqual([])
    expect(html2canvas).not.toHaveBeenCalled()
  })

  it('does not capture the whole document or disconnected trees as a shared container', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    expect(findCommonContainer([a, b])).toBeNull()
    expect(findCommonContainer([a])).toBeNull()
    document.body.append(a)
    document.head.append(b)
    expect(findCommonContainer([a, b])).toBeNull()
    b.remove()
  })

  it('clamps tiny crops to one pixel and tolerates unavailable canvas contexts', () => {
    const container = document.createElement('section')
    const element = document.createElement('article')
    rect(container, 0, 0, 100, 100)
    rect(element, 0, 0, 0.1, 0)
    const source = Object.assign(document.createElement('canvas'), { width: 100, height: 100 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const cropped = cropCanvas(source, container, element)

    expect([cropped.width, cropped.height]).toEqual([1, 1])
  })
})

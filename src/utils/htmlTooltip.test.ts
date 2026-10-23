import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hideHtmlTooltip, isHtmlTooltip, showHtmlTooltip } from './htmlTooltip'

describe('HTML tooltips', () => {
  let host: HTMLDivElement

  const panel = () => document.querySelector<HTMLDivElement>('.wf-html-tooltip-panel')!

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 500)
    vi.stubGlobal('innerHeight', 300)
    host = document.createElement('div')
    document.body.appendChild(host)
    showHtmlTooltip(host, '<strong>Metric info</strong>', 100, 100)
    Object.defineProperties(panel(), {
      offsetWidth: { configurable: true, value: 120 },
      offsetHeight: { configurable: true, value: 40 },
    })
  })

  afterEach(() => {
    hideHtmlTooltip(host)
    host.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('distinguishes HTML tooltips from plain text and missing content', () => {
    expect(isHtmlTooltip('<p>Info</p>')).toBe(true)
    expect(isHtmlTooltip('Plain info')).toBe(false)
    expect(isHtmlTooltip('')).toBe(false)
    expect(isHtmlTooltip(null)).toBe(false)
    expect(isHtmlTooltip(undefined)).toBe(false)
  })

  it('renders backend HTML beside the pointer and reuses a single panel', () => {
    const originalPanel = panel()
    showHtmlTooltip(host, '<em>Updated info</em>', 100, 100)
    expect(panel().querySelector('em')).toHaveTextContent('Updated info')
    expect(panel().style.display).toBe('block')
    expect(panel().style.transform).toBe('translate(108px, 80px)')
    expect(panel()).toBe(originalPanel)
    expect(document.querySelectorAll('.wf-html-tooltip-panel')).toHaveLength(1)
  })

  it('positions to the left when there is insufficient space on the right', () => {
    showHtmlTooltip(host, '<p>Info</p>', 480, 10)
    expect(panel().style.transform).toBe('translate(352px, 8px)')
  })

  it('falls below or above the pointer when neither side fits', () => {
    Object.defineProperty(panel(), 'offsetWidth', { configurable: true, value: 400 })
    showHtmlTooltip(host, '<p>Info</p>', 250, 100)
    expect(panel().style.transform).toBe('translate(8px, 116px)')
    showHtmlTooltip(host, '<p>Info</p>', 250, 280)
    expect(panel().style.transform).toBe('translate(8px, 224px)')
  })

  it('ignores stale mouseleave events from a different host', () => {
    const other = document.createElement('div')
    showHtmlTooltip(other, '<p>Other info</p>', 20, 20)
    hideHtmlTooltip(host)
    expect(panel().style.display).toBe('block')
    hideHtmlTooltip(other)
    expect(panel().style.display).toBe('none')
  })

  it('avoids sticky columns and invalidates their cached boundary on resize', () => {
    const table = document.createElement('table')
    table.innerHTML = '<tbody><tr><td style="position: sticky; left: 0px">Metric</td><td>Value</td></tr></tbody>'
    host.appendChild(table)
    const [sticky, target] = table.querySelectorAll('td')
    const bounds = vi.spyOn(sticky, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 20))
    showHtmlTooltip(target, '<p>Info</p>', 210, 100)
    expect(panel().style.transform).toBe('translate(218px, 80px)')
    showHtmlTooltip(target, '<p>Info</p>', 480, 100)
    expect(bounds).toHaveBeenCalledTimes(1)
    bounds.mockReturnValue(new DOMRect(0, 0, 400, 20))
    window.dispatchEvent(new Event('resize'))
    showHtmlTooltip(target, '<p>Info</p>', 480, 100)
    expect(bounds).toHaveBeenCalledTimes(2)
    expect(panel().style.transform).toBe('translate(372px, 116px)')
    hideHtmlTooltip(target)
  })
})

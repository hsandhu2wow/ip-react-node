import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Footer } from './Footer'

function scrollTo(y: number) {
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true })
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

const renderAt = (path: string) =>
  render(<MemoryRouter initialEntries={[path]}><Footer /></MemoryRouter>)

describe('Footer', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    scrollTo(0)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('hides footer on scroll down and shows footer + back-to-top on scroll up', () => {
    renderAt('/quick-facts/summary')
    const footer = document.getElementById('footer')!
    const btt = document.getElementById('btnBackToTop')!
    scrollTo(300)
    expect(footer.classList.contains('footer-hidden')).toBe(true)
    expect(footer.style.visibility).toBe('hidden')
    expect(btt.style.visibility).toBe('hidden')
    scrollTo(200)
    expect(footer.classList.contains('footer-hidden')).toBe(false)
    expect(footer.style.visibility).toBe('visible')
    expect(btt.style.visibility).toBe('visible')
  })

  it('hides back-to-top on weekly routes', () => {
    renderAt('/quick-facts/weekly')
    expect(screen.getByText('Back to top').parentElement).toHaveAttribute('hidden')
  })

  it('shows back-to-top at the bottom, responds to resizing and scrolls smoothly on click', () => {
    vi.useFakeTimers()
    let resize = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resize = callback }
      observe() {}
      disconnect = disconnect
    })
    vi.spyOn(document.body, 'scrollHeight', 'get').mockReturnValue(window.innerHeight + 200)
    const smoothScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { unmount } = renderAt('/quick-facts/summary')
    const btt = screen.getByText('Back to top').parentElement!
    scrollTo(200)
    expect(btt).toHaveStyle({ visibility: 'visible' })
    resize()
    expect(btt).toHaveStyle({ visibility: 'visible' })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 150 })
    resize()
    expect(btt).toHaveStyle({ visibility: 'hidden' })
    fireEvent.click(btt)
    act(() => vi.advanceTimersByTime(10))
    expect(smoothScroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(btt).toHaveStyle({ display: 'none' })
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})

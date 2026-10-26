import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Footer } from './Footer'

vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })

function scrollTo(y: number) {
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true })
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

const renderAt = (path: string) =>
  render(<MemoryRouter initialEntries={[path]}><Footer /></MemoryRouter>)

describe('Footer', () => {
  beforeEach(() => scrollTo(0))

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
})

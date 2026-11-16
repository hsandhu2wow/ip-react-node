import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { STELLA_URL, StellaPanel, HEADER_NAV_ATTR } from './StellaPanel'
import { StellaProvider, useStella } from '../../context/StellaContext'

function StellaButton() {
  const { enabled, open, toggle } = useStella()
  return enabled ? <button aria-pressed={open} onClick={toggle}>Stella</button> : null
}

function renderPanel({ enabled = true } = {}) {
  function Harness() {
    const [mounted, setMounted] = useState(true)
    return (
      <StellaProvider enabled={enabled}>
        <div {...{ [HEADER_NAV_ATTR]: '' }} data-testid="header" />
        <StellaButton />
        <button onClick={() => setMounted(false)}>Leave page</button>
        {mounted && <StellaPanel><p>Page content</p></StellaPanel>}
      </StellaProvider>
    )
  }
  return render(<Harness />)
}

const drawer = () => screen.getByTestId('stella-panel')
const content = () => screen.getByText('Page content').parentElement as HTMLElement
const toggle = () => fireEvent.click(screen.getByRole('button', { name: 'Stella' }))

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1440)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StellaPanel (Angular AiInsightsPanelComponent)', () => {
  it('embeds the Stella iframe for enabled users and keeps it mounted while closed', () => {
    renderPanel()
    const iframe = screen.getByTitle('Stella')
    expect(iframe).toHaveAttribute('src', STELLA_URL)
    expect(STELLA_URL).toBe('https://lb.prod.stella.wiqretail.com/stella/')
    expect(drawer()).toHaveAttribute('aria-hidden', 'true')
    expect(content().style.marginRight).toBe('')
  })

  it('renders only the page content when Stella is disabled', () => {
    renderPanel({ enabled: false })
    expect(screen.queryByTitle('Stella')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Stella' })).not.toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('opens at the 500px default width, pushing the page content aside', () => {
    renderPanel()
    toggle()
    expect(drawer()).toHaveAttribute('aria-hidden', 'false')
    expect(drawer().className).toContain('opened')
    expect(drawer().style.width).toBe('500px')
    expect(content().style.marginRight).toBe('500px')
    expect(screen.getByTestId('stella-resize-handle').style.right).toBe('492px')
    toggle()
    expect(drawer()).toHaveAttribute('aria-hidden', 'true')
    expect(content().style.marginRight).toBe('')
    expect(screen.queryByTestId('stella-resize-handle')).not.toBeInTheDocument()
  })

  it('clamps the width between 410px and the viewport minus 400px', () => {
    vi.stubGlobal('innerWidth', 700)
    renderPanel()
    toggle()
    expect(drawer().style.width).toBe('410px')
    act(() => {
      vi.stubGlobal('innerWidth', 1600)
      window.dispatchEvent(new Event('resize'))
    })
    // The width already clamped to 410 stays there when the viewport grows again
    expect(drawer().style.width).toBe('410px')
  })

  it('resizes by dragging the handle and stops at the viewport limit', () => {
    renderPanel()
    toggle()
    const handle = screen.getByTestId('stella-resize-handle')
    fireEvent.mouseDown(handle, { clientX: 1000 })
    expect(screen.getByTitle('Stella').className).toContain('resizing')
    fireEvent.mouseMove(document, { clientX: 900 })
    expect(drawer().style.width).toBe('600px')
    expect(content().style.marginRight).toBe('600px')
    fireEvent.mouseMove(document, { clientX: 0 })
    expect(drawer().style.width).toBe('1040px')
    fireEvent.mouseMove(document, { clientX: 2000 })
    expect(drawer().style.width).toBe('410px')
    fireEvent.mouseUp(document)
    expect(screen.getByTitle('Stella').className).not.toContain('resizing')
    fireEvent.mouseMove(document, { clientX: 900 })
    expect(drawer().style.width).toBe('410px')
  })

  it('starts below the header region and follows it as the page scrolls', () => {
    renderPanel()
    const header = screen.getByTestId('header')
    const rect = vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ bottom: 97 } as DOMRect)
    toggle()
    expect(drawer().style.top).toBe('97px')
    expect(screen.getByTestId('stella-resize-handle').style.top).toBe('97px')
    rect.mockReturnValue({ bottom: 49 } as DOMRect)
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(drawer().style.top).toBe('49px')
  })

  it('closes when the page hosting the panel unmounts', () => {
    renderPanel()
    toggle()
    expect(screen.getByRole('button', { name: 'Stella' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Leave page' }))
    expect(screen.getByRole('button', { name: 'Stella' })).toHaveAttribute('aria-pressed', 'false')
  })
})

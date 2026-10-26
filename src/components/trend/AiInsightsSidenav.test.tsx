import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AiInsightsSidenav } from './AiInsightsSidenav'

describe('AiInsightsSidenav', () => {
  it('renders nothing but the content when closed', () => {
    render(
      <AiInsightsSidenav open={false} onClose={() => {}} insightsHtml="<p>hidden</p>">
        <div>page</div>
      </AiInsightsSidenav>
    )
    expect(screen.getByText('page')).toBeInTheDocument()
    expect(screen.queryByTestId('ai-insights-sidenav')).not.toBeInTheDocument()
  })

  it('renders the default header and the insights HTML when open', () => {
    render(
      <AiInsightsSidenav open onClose={() => {}} insightsHtml="<h3>Key highlights</h3><ul><li>Sales up</li></ul>">
        <div>page</div>
      </AiInsightsSidenav>
    )
    const panel = screen.getByTestId('ai-insights-sidenav')
    expect(panel).toHaveTextContent('AI Insights')
    expect(panel).toHaveTextContent('Beta')
    expect(screen.getByRole('heading', { level: 3, name: 'Key highlights' })).toBeInTheDocument()
    expect(screen.getByText('Sales up').tagName).toBe('LI')
  })

  it('uses the configured header and calls onClose from the close button', () => {
    const onClose = vi.fn()
    render(
      <AiInsightsSidenav open onClose={onClose} header="Store AI Insights">
        <div>page</div>
      </AiInsightsSidenav>
    )
    expect(screen.getByTestId('ai-insights-sidenav')).toHaveTextContent('Store AI Insights')
    fireEvent.click(screen.getByLabelText('Close AI Insights'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('resizes within bounds, pushes content and stops dragging on mouseup', () => {
    const improve = vi.fn()
    const { unmount } = render(
      <AiInsightsSidenav open onClose={vi.fn()} onHelpUsImprove={improve}>
        <div>page</div>
      </AiInsightsSidenav>
    )
    const panel = screen.getByRole('complementary')
    const content = screen.getByText('page').parentElement
    const handle = screen.getByTestId('ai-insights-resize-handle')
    fireEvent.mouseMove(document, { clientX: 20 })
    expect(panel).toHaveStyle({ width: '500px' })
    fireEvent.mouseDown(handle, { clientX: 600 })
    fireEvent.mouseMove(document, { clientX: 550 })
    expect(panel).toHaveStyle({ width: '550px' })
    expect(content).toHaveStyle({ marginRight: '550px' })
    expect(document.body).toHaveClass('resizing')
    fireEvent.mouseMove(document, { clientX: 0 })
    expect(panel).toHaveStyle({ width: '800px' })
    fireEvent.mouseMove(document, { clientX: 1000 })
    expect(panel).toHaveStyle({ width: '410px' })
    fireEvent.mouseUp(document)
    expect(document.body).not.toHaveClass('resizing')
    fireEvent.mouseMove(document, { clientX: 300 })
    expect(panel).toHaveStyle({ width: '410px' })
    fireEvent.click(screen.getByRole('button', { name: 'Help us improve' }))
    expect(improve).toHaveBeenCalledOnce()
    unmount()
    fireEvent.mouseMove(document, { clientX: 0 })
    expect(document.body).not.toHaveClass('resizing')
  })
})

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
})

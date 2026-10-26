import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useMemo, useState } from 'react'
import {
  DEFAULT_TREND_ACTIONS,
  TrendActionsProvider,
  useRegisterTrendActions,
  useTrendActions,
  type TrendActions,
} from './TrendActionsContext'

function Consumer() {
  const actions = useTrendActions()
  return (
    <div>
      <span data-testid="state">
        {`${actions.subscriptionEnabled}|${actions.aiInsightsEnabled}|${actions.aiButtonText}|${actions.aiInsightsOpen}`}
      </span>
      <button onClick={actions.toggleAiInsights}>toggle</button>
    </div>
  )
}

function Page() {
  const [open, setOpen] = useState(false)
  const actions = useMemo<TrendActions>(
    () => ({
      subscriptionEnabled: true,
      openSubscription: () => {},
      aiInsightsEnabled: true,
      aiButtonText: 'Smart Insights',
      aiInsightsOpen: open,
      toggleAiInsights: () => setOpen(o => !o),
    }),
    [open]
  )
  useRegisterTrendActions(actions)
  return null
}

describe('TrendActionsContext', () => {
  it('returns safe defaults outside the provider', () => {
    render(<Consumer />)
    expect(screen.getByTestId('state')).toHaveTextContent('false|false|AI Insights|false')
    expect(() => DEFAULT_TREND_ACTIONS.openSubscription()).not.toThrow()
    expect(() => fireEvent.click(screen.getByText('toggle'))).not.toThrow()
  })

  it('returns defaults inside the provider until a page registers', () => {
    render(
      <TrendActionsProvider>
        <Consumer />
      </TrendActionsProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('false|false|AI Insights|false')
  })

  it('publishes registered actions and clears them when the page unmounts', async () => {
    const { rerender } = render(
      <TrendActionsProvider>
        <Consumer />
        <Page />
      </TrendActionsProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('true|true|Smart Insights|false')
    fireEvent.click(screen.getByText('toggle'))
    expect(await screen.findByText('true|true|Smart Insights|true')).toBeInTheDocument()

    rerender(
      <TrendActionsProvider>
        <Consumer />
      </TrendActionsProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('false|false|AI Insights|false')
  })
})

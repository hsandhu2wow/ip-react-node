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
      <span data-testid="state">{`${actions.subscriptionEnabled}|${actions.banner?.text ?? ''}`}</span>
      <button onClick={actions.openSubscription}>subscribe</button>
    </div>
  )
}

function Page() {
  const [opened, setOpened] = useState(false)
  const actions = useMemo<TrendActions>(
    () => ({
      subscriptionEnabled: true,
      openSubscription: () => setOpened(true),
      banner: opened ? { text: 'Subscribed', type: 'info' } : undefined,
    }),
    [opened]
  )
  useRegisterTrendActions(actions)
  return null
}

describe('TrendActionsContext', () => {
  it('returns safe defaults outside the provider', () => {
    render(<Consumer />)
    expect(screen.getByTestId('state')).toHaveTextContent('false|')
    expect(() => DEFAULT_TREND_ACTIONS.openSubscription()).not.toThrow()
    expect(() => fireEvent.click(screen.getByText('subscribe'))).not.toThrow()
  })

  it('returns defaults inside the provider until a page registers', () => {
    render(
      <TrendActionsProvider>
        <Consumer />
      </TrendActionsProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('false|')
  })

  it('publishes registered actions and clears them when the page unmounts', async () => {
    const { rerender } = render(
      <TrendActionsProvider>
        <Consumer />
        <Page />
      </TrendActionsProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('true|')
    fireEvent.click(screen.getByText('subscribe'))
    expect(await screen.findByText('true|Subscribed')).toBeInTheDocument()

    rerender(
      <TrendActionsProvider>
        <Consumer />
      </TrendActionsProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('false|')
  })
})

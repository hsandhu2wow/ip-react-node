import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageLoadedProvider, useNotifyPageLoaded, usePageLoaded } from './PageLoadedContext'

function Probe() {
  return <span data-testid="loaded">{String(usePageLoaded())}</span>
}

function Page({ ready }: { ready: boolean }) {
  useNotifyPageLoaded(ready)
  return null
}

describe('PageLoadedContext', () => {
  it('latches once any page reports its primary data loaded', () => {
    const { rerender } = render(<PageLoadedProvider><Page ready={false} /><Probe /></PageLoadedProvider>)
    expect(screen.getByTestId('loaded')).toHaveTextContent('false')
    rerender(<PageLoadedProvider><Page ready /><Probe /></PageLoadedProvider>)
    expect(screen.getByTestId('loaded')).toHaveTextContent('true')
    rerender(<PageLoadedProvider><Page ready={false} /><Probe /></PageLoadedProvider>)
    expect(screen.getByTestId('loaded')).toHaveTextContent('true')
    rerender(<PageLoadedProvider><Probe /></PageLoadedProvider>)
    expect(screen.getByTestId('loaded')).toHaveTextContent('true')
  })

  it('is inert outside the provider', () => {
    render(<><Page ready /><Probe /></>)
    expect(screen.getByTestId('loaded')).toHaveTextContent('false')
  })
})

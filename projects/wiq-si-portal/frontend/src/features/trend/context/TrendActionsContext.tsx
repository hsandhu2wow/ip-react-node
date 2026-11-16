// src/context/TrendActionsContext.tsx
//
// Bridges the Weekly Facts / My Plan page (TrendPage) and the header actions in
// FilterBar — the React equivalent of the flags/triggers Angular keeps on
// SqfFilterService (isEmailSubscriptionEnabled, triggerOpenSubscriptionPopup) and the
// Weekly Facts response banner. Stella lives in shared/context/StellaContext.
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { WfBanner } from '../types/wf.types'

export interface TrendActions {
  banner?: WfBanner
  /** The banner stays registered once dismissed: it still replaces admin alerts (Angular AlertList shows nothing) */
  bannerDismissed?: boolean
  dismissBanner?: () => void
  subscriptionEnabled: boolean
  openSubscription: () => void
}

const noop = () => {}

export const DEFAULT_TREND_ACTIONS: TrendActions = {
  subscriptionEnabled: false,
  openSubscription: noop,
}

const TrendActionsContext = createContext<TrendActions>(DEFAULT_TREND_ACTIONS)
const RegisterTrendActionsContext = createContext<((actions: TrendActions | null) => void) | null>(null)

export function TrendActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<TrendActions | null>(null)
  return (
    <RegisterTrendActionsContext.Provider value={setActions}>
      <TrendActionsContext.Provider value={actions ?? DEFAULT_TREND_ACTIONS}>{children}</TrendActionsContext.Provider>
    </RegisterTrendActionsContext.Provider>
  )
}

/** Header-side consumer. Returns safe defaults (everything disabled, no-op handlers) outside the provider. */
export function useTrendActions(): TrendActions {
  return useContext(TrendActionsContext)
}

/**
 * Page-side registration. `actions` should be memoised; it is published whenever it
 * changes and cleared on unmount (Angular WeeklyFactsHomeComponent.resetAIInsightsData in ngOnDestroy).
 */
export function useRegisterTrendActions(actions: TrendActions): void {
  const register = useContext(RegisterTrendActionsContext)
  useEffect(() => {
    register?.(actions)
  }, [register, actions])
  useEffect(() => () => register?.(null), [register])
}

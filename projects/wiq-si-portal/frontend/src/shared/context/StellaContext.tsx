import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Port of the Stella state on Angular SqfFilterService (is_stella_enabled_for_user,
 * isSidenavOpen, toggleSidenav). The FilterBar button toggles it; the per-page
 * StellaPanel renders the drawer and closes it again when the page unmounts.
 */
export interface StellaContextValue {
  enabled: boolean
  open: boolean
  toggle: () => void
  close: () => void
}

const noop = () => {}
const StellaContext = createContext<StellaContextValue>({ enabled: false, open: false, toggle: noop, close: noop })

export function StellaProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(value => !value), [])
  const close = useCallback(() => setOpen(false), [])
  const value = useMemo(() => ({ enabled, open: enabled && open, toggle, close }), [enabled, open, toggle, close])
  return <StellaContext.Provider value={value}>{children}</StellaContext.Provider>
}

export function useStella() {
  return useContext(StellaContext)
}

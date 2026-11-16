// Angular AlertsService.pageLoaded$: each Quick Facts page announces when its primary data has
// loaded so the layout can fetch admin alerts without competing with critical-path requests.
// The layout only needs the first announcement (Angular `take(1)`), so the flag latches.
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface PageLoadedState {
  loaded: boolean
  notify: () => void
}

const PageLoadedContext = createContext<PageLoadedState | null>(null)

export function PageLoadedProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false)
  const [state] = useState(() => ({ notify: () => setLoaded(true) }))
  return <PageLoadedContext.Provider value={{ loaded, notify: state.notify }}>{children}</PageLoadedContext.Provider>
}

export function usePageLoaded(): boolean {
  return useContext(PageLoadedContext)?.loaded ?? false
}

/** Page-side: call with `true` once the page's primary data has loaded (Angular notifyPageLoaded). */
export function useNotifyPageLoaded(ready: boolean): void {
  const notify = useContext(PageLoadedContext)?.notify
  useEffect(() => {
    if (ready) notify?.()
  }, [ready, notify])
}

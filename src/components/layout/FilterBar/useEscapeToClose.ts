import { useEffect } from 'react'

/** mat-menu / mat-datepicker close on Escape; mirrors that for the filter-bar popups. */
export function useEscapeToClose(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])
}

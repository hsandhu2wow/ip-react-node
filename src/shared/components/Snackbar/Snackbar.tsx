import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Snackbar.module.scss'

/** Mirrors Angular UtilityProviderService.displaySnackMessage */
export type SnackType = 'success' | 'error' | 'info'
export type SnackHorizontal = 'left' | 'center' | 'right'
export type SnackVertical = 'top' | 'bottom'

interface Snack {
  id: number
  message: string
  type: SnackType
  horizontal: SnackHorizontal
  vertical: SnackVertical
}

type ShowSnack = (message: string, type?: SnackType, horizontal?: SnackHorizontal, vertical?: SnackVertical) => void

const SnackbarContext = createContext<ShowSnack | null>(null)

const DURATION_MS = 5000

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<Snack | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const nextId = useRef(0)

  const show = useCallback<ShowSnack>((message, type = 'success', horizontal = 'right', vertical = 'bottom') => {
    clearTimeout(timer.current)
    setSnack({ id: ++nextId.current, message, type, horizontal, vertical })
    timer.current = setTimeout(() => setSnack(null), DURATION_MS)
  }, [])

  return (
    <SnackbarContext.Provider value={show}>
      {children}
      {snack && createPortal(
        <div
          key={snack.id}
          role="status"
          className={`${styles.container} ${styles[snack.horizontal]} ${styles[snack.vertical]}`}
        >
          <div className={`${styles.snack} ${styles[snack.type]}`}>
            {snack.type === 'info' && <span className={`material-icons ${styles.icon}`}>check_circle</span>}
            <span>{snack.message}</span>
          </div>
        </div>,
        document.body,
      )}
    </SnackbarContext.Provider>
  )
}

/** Falls back to a no-op outside the provider so isolated component tests don't need it. */
export function useSnackbar(): ShowSnack {
  return useContext(SnackbarContext) ?? noop
}
const noop: ShowSnack = () => {}

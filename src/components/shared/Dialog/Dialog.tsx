import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Dialog.module.css'

/**
 * Angular MatDialog panel classes used by Quick Facts dialogs.
 * - modal-size-60: preview dialog; modal-size-90: Weekly Facts page preview; help-feedback: feedback popup (styles.scss / app.scss)
 * - modal-size-550: recognise dialog
 */
export type DialogSize = 'modal-size-60' | 'modal-size-90' | 'modal-size-550' | 'help-feedback' | 'confirm' | 'auto'

const SIZE_CLASS: Record<DialogSize, string> = {
  'modal-size-60': styles.size60,
  'modal-size-90': styles.size90,
  'modal-size-550': styles.size550,
  'help-feedback': styles.helpFeedback,
  confirm: styles.confirm,
  auto: '',
}

interface DialogProps {
  open: boolean
  onClose: () => void
  size?: DialogSize
  /** MatDialog disableClose — backdrop click / Escape do nothing */
  disableClose?: boolean
  ariaLabel?: string
  className?: string
  children: ReactNode
}

/** Minimal MatDialog equivalent: portal, dark backdrop, centred panel, Escape to close. */
export function Dialog({ open, onClose, size = 'auto', disableClose, ariaLabel, className, children }: DialogProps) {
  useEffect(() => {
    if (!open || disableClose) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, disableClose, onClose])

  if (!open) return null
  return createPortal(
    <div
      className={styles.backdrop}
      data-testid="dialog-backdrop"
      onClick={disableClose ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`${styles.panel} ${SIZE_CLASS[size]} ${className ?? ''}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  message: ReactNode
  subMessage?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Angular confirmation dialog (No / Yes). */
export function ConfirmDialog({
  open, message, subMessage, confirmText = 'Yes', cancelText = 'No', onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} size="confirm" ariaLabel="Confirm">
      <div className={styles.confirmBody}>
        <p className={styles.confirmMessage}>{message}</p>
        {subMessage && <p className={styles.confirmMessage}>{subMessage}</p>}
      </div>
      <div className={styles.confirmActions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>{cancelText}</button>
        <button type="button" className={styles.btnPrimary} onClick={onConfirm}>{confirmText}</button>
      </div>
    </Dialog>
  )
}

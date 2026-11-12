import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { WfAlert } from '../types/wf.types';
import styles from './TrendInfoDialog.module.scss';

export const TREND_ALERT_ICONS: Record<string, string | undefined> = {
  new: 'new_releases',
  warning: 'error',
  error: 'priority_high',
  info: 'info_outlined',
  success: 'done',
};

interface TrendInfoDialogProps {
  alert: WfAlert;
  refreshTimeLabel?: string;
  onClose: () => void;
}

export function TrendInfoDialog({ alert, refreshTimeLabel, onClose }: TrendInfoDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
        );
        const first = focusable?.[0];
        const last = focusable?.[focusable.length - 1];
        if (!first || !last) return;
        const outside = !dialogRef.current?.contains(document.activeElement);
        if (outside || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className={styles.backdrop}
      data-testid="trend-info-backdrop"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={alert.title ? titleId : undefined}
        aria-label={alert.title ? undefined : 'Information'}
      >
        <div className={styles.header}>
          {alert.title && (
            <div id={titleId} className={styles.title}>
              <span className={`material-icons ${styles.icon}`} aria-hidden="true">{TREND_ALERT_ICONS[alert.type]}</span>
              {alert.title}
            </div>
          )}
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <span className={`material-icons ${styles.icon}`} aria-hidden="true">close</span>
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: alert.text }} />
          {refreshTimeLabel && <div><strong>Last updated: </strong>{refreshTimeLabel}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

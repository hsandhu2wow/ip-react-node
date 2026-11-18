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

const SCROLL_BLOCK_CLASS = 'global-scrollblock';

// Angular MatDialog's CDK BlockScrollStrategy: pin <html> at the current scroll
// offset and keep its scrollbar, so the page does not widen while the dialog is open.
function blockDocumentScroll(): () => void {
  const root = document.documentElement;
  const overflows = root.scrollHeight > window.innerHeight || root.scrollWidth > window.innerWidth;
  if (root.classList.contains(SCROLL_BLOCK_CLASS) || !overflows) return () => {};
  const { scrollX, scrollY } = window;
  const previous = { left: root.style.left, top: root.style.top };
  root.style.left = `${-scrollX}px`;
  root.style.top = `${-scrollY}px`;
  root.classList.add(SCROLL_BLOCK_CLASS);
  return () => {
    const body = document.body;
    const previousBehavior = { root: root.style.scrollBehavior, body: body.style.scrollBehavior };
    root.style.left = previous.left;
    root.style.top = previous.top;
    root.classList.remove(SCROLL_BLOCK_CLASS);
    root.style.scrollBehavior = body.style.scrollBehavior = 'auto';
    window.scroll(scrollX, scrollY);
    root.style.scrollBehavior = previousBehavior.root;
    body.style.scrollBehavior = previousBehavior.body;
  };
}

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
    const unblockScroll = blockDocumentScroll();
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
      unblockScroll();
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

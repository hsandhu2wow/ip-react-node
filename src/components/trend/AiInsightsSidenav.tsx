// src/components/trend/AiInsightsSidenav.tsx
//
// Port of the Weekly Facts / My Plan AI Insights mat-sidenav (weekly-facts-home.component
// html/scss) plus Angular's ResizableDrawerDirective: a right-hand "side" mode drawer
// (500px, drag-resizable 410–800px) that pushes the page content left while open.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './AiInsightsSidenav.module.css'

export const AI_SIDENAV_DEFAULT_WIDTH = 500
const AI_SIDENAV_MIN_WIDTH = 410
const AI_SIDENAV_MAX_WIDTH = 800

interface Props {
  open: boolean
  onClose: () => void
  /** `ai_insights.header` — falls back to 'AI Insights' */
  header?: string
  /** `ai_insights.insights` — backend HTML rendered as-is */
  insightsHtml?: string
  /** "Help us improve" opens the feedback popup (Angular HelpFeedbackComponent, header 'WFAIPanel') */
  onHelpUsImprove?: () => void
  children: ReactNode
}

export function AiInsightsSidenav({ open, onClose, header, insightsHtml, onHelpUsImprove, children }: Props) {
  const [width, setWidth] = useState(AI_SIDENAV_DEFAULT_WIDTH)
  const resizing = useRef<{ startX: number; startWidth: number } | null>(null)

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (!resizing.current) return
    const next = resizing.current.startWidth - (event.clientX - resizing.current.startX)
    setWidth(Math.min(Math.max(next, AI_SIDENAV_MIN_WIDTH), AI_SIDENAV_MAX_WIDTH))
    document.body.classList.add('resizing')
  }, [])

  const onMouseUp = useCallback(() => {
    resizing.current = null
    document.body.classList.remove('resizing')
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      onMouseUp()
    }
  }, [open, onMouseMove, onMouseUp])

  return (
    <div className={styles.container}>
      <div className={styles.content} style={open ? { marginRight: width } : undefined}>
        {children}
      </div>
      {open && (
        <>
          <div
            className={styles.resizeHandle}
            style={{ right: width + 9 }}
            data-testid="ai-insights-resize-handle"
            onMouseDown={event => {
              resizing.current = { startX: event.clientX, startWidth: width }
              event.preventDefault()
            }}
          />
          <aside className={styles.sidenav} style={{ width }} aria-label="AI Insights" data-testid="ai-insights-sidenav">
            <div className={styles.inner}>
              <div className={styles.header}>
                <span className={styles.title}>
                  <span className={`material-icons ${styles.titleIcon}`}>auto_awesome</span>
                  {header || 'AI Insights'}
                  <span className={styles.betaTag}>Beta</span>
                </span>
                <div className={styles.actions}>
                  {onHelpUsImprove && (
                    <button type="button" className={styles.helpBtn} onClick={onHelpUsImprove}>
                      Help us improve
                    </button>
                  )}
                  <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close AI Insights">
                    <span className="material-icons">close</span>
                  </button>
                </div>
              </div>
              {insightsHtml && (
                // Angular binds this via DomSanitizer.bypassSecurityTrustHtml (trusted backend HTML).
                <div className={styles.insights} dangerouslySetInnerHTML={{ __html: insightsHtml }} />
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

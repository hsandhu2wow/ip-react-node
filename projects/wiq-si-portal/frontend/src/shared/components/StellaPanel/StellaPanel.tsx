// Port of Angular AiInsightsPanelComponent + ResizableDrawerDirective
// (sqf/components/shared/ai-insights-panel, sqf/directives/resizable-drawer.directive.ts).
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { useStella } from '../../context/StellaContext'
import styles from './StellaPanel.module.scss'

export const STELLA_URL = 'https://lb.prod.stella.wiqretail.com/stella/'

/**
 * Marks the elements of the page header (filter bar, banners) the drawer sits below.
 * Angular measured the sticky #header-nav wrapper; here the filter bar is sticky on its
 * own and banners scroll away, so the gap is the lowest visible header edge.
 */
export const HEADER_NAV_ATTR = 'data-header-nav'

const MIN_WIDTH = 410
const MIN_VISIBLE_CONTENT_WIDTH = 400
const DEFAULT_WIDTH = 500

function clampWidth(width: number) {
  const max = Math.max(window.innerWidth - MIN_VISIBLE_CONTENT_WIDTH, MIN_WIDTH)
  return Math.min(Math.max(width, MIN_WIDTH), max)
}

function headerBottom() {
  const edges = Array.from(document.querySelectorAll(`[${HEADER_NAV_ATTR}]`), el => el.getBoundingClientRect().bottom)
  return Math.max(0, ...edges)
}

export function StellaPanel({ children }: { children: ReactNode }) {
  const { enabled, open, close } = useStella()
  const [width, setWidth] = useState(() => clampWidth(DEFAULT_WIDTH))
  const [resizing, setResizing] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  // Angular ngOnDestroy: the drawer does not emit (closed) when destroyed while open
  useEffect(() => close, [close])

  useEffect(() => {
    const onResize = () => setWidth(clampWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!open) return
    // The viewport may have changed while the drawer was closed
    setWidth(clampWidth)
    const applyTop = () => {
      const top = `${headerBottom()}px`
      if (drawerRef.current) drawerRef.current.style.top = top
      if (handleRef.current) handleRef.current.style.top = top
    }
    applyTop()
    window.addEventListener('scroll', applyTop, { passive: true })
    window.addEventListener('resize', applyTop)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(applyTop)
    observer?.observe(document.body)
    return () => {
      window.removeEventListener('scroll', applyTop)
      window.removeEventListener('resize', applyTop)
      observer?.disconnect()
    }
  }, [open])

  function startResize(event: ReactMouseEvent) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = width
    setResizing(true)
    const onMove = (e: MouseEvent) => setWidth(clampWidth(startWidth - (e.clientX - startX)))
    const onUp = () => {
      setResizing(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  if (!enabled) return <>{children}</>

  return (
    <div className={styles.container}>
      <div
        className={`${styles.content} ${resizing ? '' : styles.animated}`}
        style={open ? { marginRight: width } : undefined}
      >
        {children}
      </div>
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${open ? styles.opened : ''}`}
        style={{ width }}
        aria-label="Stella"
        aria-hidden={!open}
        data-testid="stella-panel"
      >
        {/* Dragging over the iframe would swallow the mouse events that drive the resize */}
        <iframe title="Stella" src={STELLA_URL} className={`${styles.iframe} ${resizing ? styles.resizing : ''}`} />
      </aside>
      {open && (
        <div
          ref={handleRef}
          className={styles.resizeHandle}
          style={{ right: width - 8 }}
          onMouseDown={startResize}
          data-testid="stella-resize-handle"
        />
      )}
    </div>
  )
}

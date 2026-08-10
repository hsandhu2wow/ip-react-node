// src/utils/htmlTooltip.ts
//
// Renders a floating panel with backend-provided HTML content on hover, for table
// cells/headers whose `tooltip` value is an HTML string (the native `title` attribute
// only supports plain text and would otherwise leak the raw markup to the user).
//
// Ported from store-insights' AppHtmlTooltipDirective (Angular). The content is
// trusted as-is (not sanitized), matching how this same backend-provided HTML is
// already rendered elsewhere via dangerouslySetInnerHTML for cell displayValue.
//
// A single floating panel is created once and reused by every hoverable cell/header
// (only one tooltip can ever be visible at a time) — this avoids DOM churn on every
// mouseenter/mouseleave while the mouse moves quickly across many cells.

let sharedPanel: HTMLDivElement | null = null;
let activeHost: Element | null = null;
let stickyBoundaryCache = new WeakMap<Element, number>();
let resizeListenerAttached = false;

export function isHtmlTooltip(tooltip: string | null | undefined): boolean {
  return !!tooltip && tooltip.includes('<');
}

function getOrCreatePanel(): HTMLDivElement {
  if (!sharedPanel) {
    const panel = document.createElement('div');
    panel.className = 'wf-html-tooltip-panel';
    panel.style.position = 'fixed';
    panel.style.left = '0px';
    panel.style.top = '0px';
    panel.style.zIndex = '10000';
    panel.style.display = 'none';
    document.body.appendChild(panel);
    sharedPanel = panel;
  }
  return sharedPanel;
}

function attachResizeInvalidation(): void {
  if (resizeListenerAttached) return;
  resizeListenerAttached = true;
  window.addEventListener('resize', () => {
    stickyBoundaryCache = new WeakMap<Element, number>();
  });
}

// Finds the right edge of any sticky-positioned column (e.g. wf-table's frozen
// metric-name/first column) within the host's table, so the panel never renders on
// top of it. Result is cached per table.
function getStickyLeftBoundary(host: Element): number {
  const table = host.closest('table');
  if (!table) return 0;

  const cached = stickyBoundaryCache.get(table);
  if (cached !== undefined) return cached;

  attachResizeInvalidation();

  let maxRight = 0;
  table.querySelectorAll('td, th').forEach((cell) => {
    const style = window.getComputedStyle(cell);
    if (style.position === 'sticky' && style.left !== 'auto') {
      maxRight = Math.max(maxRight, cell.getBoundingClientRect().right);
    }
  });

  stickyBoundaryCache.set(table, maxRight);
  return maxRight;
}

function positionPanel(panel: HTMLDivElement, host: Element, pointerX: number, pointerY: number): void {
  const hostRect = host.getBoundingClientRect();
  const panelWidth = panel.offsetWidth;
  const panelHeight = panel.offsetHeight;
  const minLeft = getStickyLeftBoundary(host) + 8;

  let left: number;
  let top: number;
  const fitsRight = pointerX + 8 + panelWidth <= window.innerWidth - 8;
  const fitsLeft = pointerX - 8 - panelWidth >= minLeft;

  if (fitsRight) {
    left = pointerX + 8;
    top = pointerY - panelHeight / 2;
  } else if (fitsLeft) {
    left = pointerX - panelWidth - 8;
    top = pointerY - panelHeight / 2;
  } else {
    left = Math.min(Math.max(minLeft, hostRect.left), window.innerWidth - panelWidth - 8);
    top = pointerY + 16;
    if (top + panelHeight > window.innerHeight - 8) {
      top = pointerY - panelHeight - 16;
    }
  }

  left = Math.max(8, left);
  top = Math.max(8, top);

  panel.style.transform = `translate(${left}px, ${top}px)`;
}

export function showHtmlTooltip(host: Element, html: string, clientX: number, clientY: number): void {
  activeHost = host;
  const panel = getOrCreatePanel();
  panel.innerHTML = html;
  panel.style.display = 'block';
  positionPanel(panel, host, clientX, clientY);
}

export function hideHtmlTooltip(host: Element): void {
  if (activeHost !== host) return;
  if (sharedPanel) {
    sharedPanel.style.display = 'none';
  }
  activeHost = null;
}

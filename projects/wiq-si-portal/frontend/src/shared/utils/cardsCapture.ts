/**
 * Port of Angular QfCardsPreviewService card capture (getCardsCanvases).
 * Cards are located by `jsId` (rendered as the card root's DOM id), the Angular
 * `*__preview` classes are added (see SummaryCard/DetailsCard module CSS) and the
 * cards are rendered with html2canvas-pro.
 */
import type { ISQFMetricCard } from '../types/sqf.types'

type Html2Canvas = (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>

export const PREVIEW_CLASSES = [
  'qf-details-card__preview',
  'qf-summary-card__preview',
  'qf-details-card__preview-wf',
  'qf-summary-card__preview-wf',
] as const

/** Angular removes only these two after capture. */
const CLEANUP_CLASSES = ['qf-details-card__preview', 'qf-summary-card__preview']

/**
 * Angular skips CDK overlay / live-announcer / visually-hidden nodes; the React
 * equivalents are portalled dialogs, snackbars and transient tooltips.
 */
export function ignoreElements(el: Element): boolean {
  return (
    el.id === 'cdk-overlay-container' ||
    !!el.classList?.contains('cdk-live-announcer-element') ||
    !!el.classList?.contains('cdk-visually-hidden') ||
    el.getAttribute?.('data-testid') === 'dialog-backdrop' ||
    el.getAttribute?.('role') === 'status' ||
    el.getAttribute?.('role') === 'tooltip'
  )
}

const SCROLL_CONTAINER_ID = 'qf-scroll-container'
const ORIGINAL_CLASS_ATTR = 'data-qf-original-class'

/**
 * QfCardsPreviewService.triggerPreview side effect on the Weekly Facts scroll container:
 * replacing its classes drops the max-height/overflow so the whole table is captured.
 * The original classes (CSS-module hashed in React) are kept so they can be restored.
 */
export function markScrollContainerForPreview(doc: Document = document) {
  const element = doc.getElementById(SCROLL_CONTAINER_ID)
  if (element) {
    if (!element.hasAttribute(ORIGINAL_CLASS_ATTR)) {
      element.setAttribute(ORIGINAL_CLASS_ATTR, element.className)
    }
    element.className = 'qf-summary-card__preview-wf'
  }
}

/** getPageCanvases cleanup: Angular resets the container to `qf-scroll-container`. */
export function restoreScrollContainer(doc: Document = document) {
  const element = doc.getElementById(SCROLL_CONTAINER_ID)
  if (element && element.hasAttribute(ORIGINAL_CLASS_ATTR)) {
    element.className = element.getAttribute(ORIGINAL_CLASS_ATTR) ?? SCROLL_CONTAINER_ID
    element.removeAttribute(ORIGINAL_CLASS_ATTR)
  }
}

/** Port of QfCardsPreviewService.getPageCanvases (Weekly Facts / My Plan page export). */
export async function getPageCanvases(cards: Pick<ISQFMetricCard, 'jsId'>[], doc: Document = document): Promise<HTMLCanvasElement[]> {
  const { default: html2canvas } = (await import('html2canvas-pro')) as unknown as { default: Html2Canvas }
  const targetElements = cards
    .filter(card => card.jsId)
    .map(card => doc.getElementById(card.jsId as string))
    .filter((domElement): domElement is HTMLElement => !!domElement)
  targetElements.forEach(domElement => domElement.classList.add('js-weekly-card__preview'))
  try {
    return await captureElementsSequentially(html2canvas, targetElements, { scale: 2, logging: false })
  } finally {
    targetElements.forEach(element => element.classList.remove('js-weekly-card__preview'))
    restoreScrollContainer(doc)
  }
}

export async function getCardsCanvases(cards: Pick<ISQFMetricCard, 'jsId'>[], doc: Document = document): Promise<HTMLCanvasElement[]> {
  const { default: html2canvas } = (await import('html2canvas-pro')) as unknown as { default: Html2Canvas }
  const domElements: HTMLElement[] = []
  const targetElements = cards
    .filter(card => card.jsId)
    .map(card => doc.getElementById(card.jsId as string))
    .filter((domElement): domElement is HTMLElement => !!domElement)
  targetElements.forEach(domElement => {
    domElements.push(domElement)
    domElement.classList.add(...PREVIEW_CLASSES)
  })
  const captureOptions = {
    scale: 2,
    scrollY: -window.scrollY,
    logging: false,
  }
  try {
    // One html2canvas pass over the shared container (then cropping each card) pays the
    // document-clone cost once instead of once per card.
    const commonContainer = findCommonContainer(targetElements, doc)
    if (commonContainer) {
      const containerCanvas = await captureElement(html2canvas, commonContainer, captureOptions)
      return targetElements.map(element => cropCanvas(containerCanvas, commonContainer, element, doc))
    }
    return await captureElementsSequentially(html2canvas, targetElements, captureOptions)
  } finally {
    domElements.forEach(element => element.classList.remove(...CLEANUP_CLASSES))
  }
}

/**
 * Nearest common ancestor of all elements, unless it is body/html (which would mean
 * cloning the whole page anyway).
 */
export function findCommonContainer(elements: HTMLElement[], doc: Document = document): HTMLElement | null {
  if (elements.length < 2) {
    return null
  }
  let common: Node | null = elements[0]
  for (let i = 1; i < elements.length && common; i++) {
    common = commonAncestor(common, elements[i])
  }
  if (!common || !(common instanceof HTMLElement) || common === doc.body || common === doc.documentElement) {
    return null
  }
  return common
}

function commonAncestor(a: Node, b: Node): Node | null {
  const ancestorsOfA = new Set<Node>()
  for (let node: Node | null = a; node; node = node.parentNode) {
    ancestorsOfA.add(node)
  }
  for (let node: Node | null = b; node; node = node.parentNode) {
    if (ancestorsOfA.has(node)) {
      return node
    }
  }
  return null
}

async function captureElement(html2canvas: Html2Canvas, element: HTMLElement, options: Record<string, unknown>) {
  return html2canvas(element, { ignoreElements, ...options })
}

/** Crops the region of `element` out of a canvas captured from `container`. */
export function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  container: HTMLElement,
  element: HTMLElement,
  doc: Document = document,
): HTMLCanvasElement {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  const scaleX = sourceCanvas.width / containerRect.width
  const scaleY = sourceCanvas.height / containerRect.height
  const sx = (elementRect.left - containerRect.left) * scaleX
  const sy = (elementRect.top - containerRect.top) * scaleY
  const sw = elementRect.width * scaleX
  const sh = elementRect.height * scaleY
  const cropped = doc.createElement('canvas')
  cropped.width = Math.max(1, Math.round(sw))
  cropped.height = Math.max(1, Math.round(sh))
  const ctx = cropped.getContext('2d')
  ctx?.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height)
  return cropped
}

async function captureElementsSequentially(
  html2canvas: Html2Canvas,
  elements: HTMLElement[],
  options: Record<string, unknown>,
) {
  const canvases: HTMLCanvasElement[] = []
  for (const element of elements) {
    canvases.push(await html2canvas(element, { ignoreElements, ...options }))
    // Yield so the browser can paint/respond between captures.
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  return canvases
}

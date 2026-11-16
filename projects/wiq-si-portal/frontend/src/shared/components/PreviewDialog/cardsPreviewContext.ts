import { createContext, useContext, useEffect, useRef } from 'react'
import type { PreviewCard } from '../RecognizeDialog/recognize'

/** Angular DocExportType values handled by QfPreviewComponent for Quick Facts cards */
export type DocExportType = 'pdf' | 'print' | 'recognize' | 'slide'

export interface CardsPreviewContextValue {
  /**
   * Opens the preview dialog. With `cards` it mirrors QfCardsPreviewService.previewAndProcess
   * (card-level actions); without, it mirrors triggerPreview (header actions) and uses the
   * cards registered by the current page. Resolves once the dialog is open.
   */
  preview: (mode: DocExportType, cards?: PreviewCard[]) => Promise<void>
  /**
   * Registers the current page's displayed-cards provider; returns an unregister fn.
   * `pageData` mirrors previewAndProcessPageData (Weekly Facts whole-page landscape export).
   */
  registerPageCards: (getCards: () => PreviewCard[], options?: PageCardsOptions) => () => void
}

export interface PageCardsOptions {
  pageData?: boolean
}

const noopValue: CardsPreviewContextValue = {
  preview: () => Promise.resolve(),
  registerPageCards: () => () => {},
}

export const CardsPreviewContext = createContext<CardsPreviewContextValue | null>(null)

export function useCardsPreview(): CardsPreviewContextValue {
  return useContext(CardsPreviewContext) ?? noopValue
}

/**
 * Page-side subscription to header preview triggers (Angular previewTriggered$ subscribers in
 * sqf-summary-home / sqf-details-home). `getCards` is read lazily when a preview is triggered.
 */
export function usePreviewPageCards(getCards: () => PreviewCard[], options?: PageCardsOptions) {
  const { registerPageCards } = useCardsPreview()
  const ref = useRef(getCards)
  const pageData = !!options?.pageData
  useEffect(() => {
    ref.current = getCards
  })
  useEffect(() => registerPageCards(() => ref.current(), { pageData }), [registerPageCards, pageData])
}

/** Renderless form of usePreviewPageCards, for pages with early returns. */
export function PreviewPageCards({ getCards, pageData }: { getCards: () => PreviewCard[]; pageData?: boolean }) {
  usePreviewPageCards(getCards, { pageData })
  return null
}

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CardsPreviewContext, type DocExportType, type PageCardsOptions } from './cardsPreviewContext'
import { PreviewDialog } from './PreviewDialog'
import { markScrollContainerForPreview } from '../../utils/cardsCapture'
import type { PreviewCard } from '../RecognizeDialog/recognize'

interface PreviewRequest {
  id: number
  docExportType: DocExportType
  cards: PreviewCard[]
  pageData: boolean
}

/** React counterpart of Angular QfCardsPreviewService (dialog host + page trigger bus). */
export function CardsPreviewProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PreviewRequest | null>(null)
  const pageCards = useRef<{ getCards: () => PreviewCard[]; pageData: boolean } | null>(null)
  const nextId = useRef(0)

  const previewAndProcess = useCallback((docExportType: DocExportType, cards: PreviewCard[], pageData = false) => {
    setRequest({
      id: ++nextId.current,
      docExportType,
      // previewAndProcessPageData passes the page card through unfiltered
      cards: pageData ? cards : cards.filter(card => card && card.jsId),
      pageData,
    })
    // Resolves after the dialog has rendered (MatDialogRef.afterOpened equivalent)
    return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }, [])

  const preview = useCallback(
    (docExportType: DocExportType, cards?: PreviewCard[]) => {
      if (cards) return previewAndProcess(docExportType, cards)
      // triggerPreview: only pages subscribed to previewTriggered$ respond
      markScrollContainerForPreview()
      const page = pageCards.current
      if (!page) return Promise.resolve()
      return previewAndProcess(docExportType, page.getCards(), page.pageData)
    },
    [previewAndProcess],
  )

  const registerPageCards = useCallback((getCards: () => PreviewCard[], options?: PageCardsOptions) => {
    const page = { getCards, pageData: !!options?.pageData }
    pageCards.current = page
    return () => {
      if (pageCards.current === page) pageCards.current = null
    }
  }, [])

  const value = useMemo(() => ({ preview, registerPageCards }), [preview, registerPageCards])
  const close = useCallback(() => setRequest(null), [])

  return (
    <CardsPreviewContext.Provider value={value}>
      {children}
      {request && (
        <PreviewDialog
          key={request.id}
          docExportType={request.docExportType}
          cards={request.cards}
          pageData={request.pageData}
          orientation={request.pageData ? 'landscape' : 'portrait'}
          onClose={close}
        />
      )}
    </CardsPreviewContext.Provider>
  )
}

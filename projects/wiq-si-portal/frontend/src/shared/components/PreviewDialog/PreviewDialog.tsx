import { useCallback, useEffect, useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { useSnackbar } from '../Snackbar/Snackbar'
import { useOptionalFilter } from '../../context/FilterContext'
import { getCardsCanvases, getPageCanvases } from '../../utils/cardsCapture'
import { downloadPDF, getPDFFile, printPDF, type PdfOrientation } from '../../utils/pdf'
import { previewFileName } from './previewFileName'
import { initSlideCreation } from '../../utils/gcpSlides'
import { RecognizeDialog } from '../RecognizeDialog/RecognizeDialog'
import { buildRecognizeFormData, type IRecognizeFormData, type PreviewCard } from '../RecognizeDialog/recognize'
import type { DocExportType } from './cardsPreviewContext'
import styles from './PreviewDialog.module.scss'

interface Props {
  docExportType: DocExportType
  cards: PreviewCard[]
  orientation?: PdfOrientation
  /** previewAndProcessPageData: whole-page capture in a modal-size-90 dialog */
  pageData?: boolean
  onClose: () => void
}

/** Port of Angular QfPreviewComponent (panelClass modal-size-60, disableClose). */
export function PreviewDialog({ docExportType, cards, orientation = 'portrait', pageData = false, onClose }: Props) {
  const showSnack = useSnackbar()
  const selectedDate = useOptionalFilter()?.selectedDate ?? ''
  const [generating, setGenerating] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [printSrc, setPrintSrc] = useState('')
  const [recognizeFormData, setRecognizeFormData] = useState<IRecognizeFormData | null>(null)
  const [showRecognizeForm, setShowRecognizeForm] = useState(false)

  const closeModal = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    let cancelled = false
    let processTimer: ReturnType<typeof setTimeout> | undefined
    let printUrl: string | undefined
    const onPrintFocus = () => closeModal()
    const fail = () => {
      if (cancelled) return
      setGenerating(false)
      showSnack('Unable to generate preview, Please Contact Support', 'error')
      closeModal()
    }
    const timer = setTimeout(async () => {
      try {
        const capture = pageData ? getPageCanvases : getCardsCanvases
        const canvases = cards.length ? await capture(cards) : null
        if (cancelled) return
        if (!canvases || !canvases.length) {
          fail()
          return
        }
        setImages(canvases.map(canvas => canvas.toDataURL('image/jpeg', 1.0)))
        const name = previewFileName(cards[0])

        processTimer = setTimeout(async () => {
          if (cancelled) return
          try {
            if (docExportType === 'pdf') {
              await downloadPDF(canvases, name, orientation, () => {
                if (cancelled) return
                setGenerating(false)
                closeModal()
              })
            } else if (docExportType === 'slide') {
              initSlideCreation(undefined, cards, canvases, () => {
                if (cancelled) return
                setGenerating(false)
                closeModal()
              }, showSnack)
            } else if (docExportType === 'recognize') {
              const card = cards[0]
              await getPDFFile(canvases, pdfContents => {
                if (cancelled) return
                setRecognizeFormData(buildRecognizeFormData(card, selectedDate, pdfContents))
                setShowRecognizeForm(true)
                setGenerating(false)
              })
            } else {
              await printPDF(canvases, name, orientation, url => {
                if (cancelled) {
                  URL.revokeObjectURL(url)
                  return
                }
                printUrl = url
                setPrintSrc(url)
                setGenerating(false)
                window.addEventListener('focus', onPrintFocus, { once: true })
              })
            }
          } catch {
            fail()
          }
        })
      } catch {
        fail()
      }
    }, 100)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(processTimer)
      window.removeEventListener('focus', onPrintFocus)
      if (printUrl) URL.revokeObjectURL(printUrl)
    }
    // Runs once per dialog instance, like ngOnInit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dialog open onClose={closeModal} size={pageData ? 'modal-size-90' : 'modal-size-60'} disableClose ariaLabel="Quick Facts preview">
      <div className={styles.surface}>
        {!showRecognizeForm && (
          <div className={styles.preview}>
            <div className={styles.header}>
              <span
                className={`material-icons ${styles.close}`}
                role="button"
                aria-label="Close"
                tabIndex={0}
                onClick={closeModal}
                onKeyDown={e => e.key === 'Enter' && closeModal()}
              >
                close
              </span>
            </div>
            <div className={styles.container}>
              {generating && (
                <div className={styles.uploading}>
                  <img className={styles.uploadingGif} src="/assets/images/upload.gif" alt="uploading" />
                  <p className={styles.uploadingText}>Generating...</p>
                </div>
              )}
              {images.map((src, i) => (
                <div key={i} className={styles.card}>
                  <img className={styles.cardImg} src={src} alt="Quick Facts Card" />
                </div>
              ))}
              <iframe hidden src={printSrc || undefined} title="Print Quick Facts" />
            </div>
          </div>
        )}
        {showRecognizeForm && !generating && recognizeFormData && (
          <RecognizeDialog recognizeFormData={recognizeFormData} onClose={closeModal} />
        )}
      </div>
    </Dialog>
  )
}

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { PreviewDialog } from './PreviewDialog'
import type { IRecognizeFormData, PreviewCard } from '../RecognizeDialog/recognize'

const capture = vi.fn()
const download = vi.fn()
const print = vi.fn()
const pdfFile = vi.fn()
const showSnack = vi.fn()
const slides = vi.fn()
const recognition = vi.fn<(data: IRecognizeFormData) => void>()
vi.mock('../../../utils/cardsCapture', () => ({
  getCardsCanvases: (...args: unknown[]) => capture(...args),
  getPageCanvases: (...args: unknown[]) => capture(...args),
}))
vi.mock('../../../utils/pdf', () => ({
  downloadPDF: (...args: unknown[]) => download(...args),
  printPDF: (...args: unknown[]) => print(...args),
  getPDFFile: (...args: unknown[]) => pdfFile(...args),
}))
vi.mock('../Snackbar/Snackbar', () => ({ useSnackbar: () => showSnack }))
vi.mock('../../../utils/gcpSlides', () => ({
  initSlideCreation: (...args: unknown[]) => slides(...args),
}))
vi.mock('../RecognizeDialog/RecognizeDialog', () => ({
  RecognizeDialog: ({ recognizeFormData, onClose }: { recognizeFormData: IRecognizeFormData; onClose: () => void }) => {
    recognition(recognizeFormData)
    return <button onClick={onClose}>Close recognition</button>
  },
}))

const cards: PreviewCard[] = [{ cardName: 'sales_v4', cardTitle: 'NSW', cardType: 'DETAIL', jsId: 'sales' }]
const flushPreview = async () => {
  await act(async () => { await vi.advanceTimersByTimeAsync(200) })
}

describe('PreviewDialog failures', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetAllMocks()
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,a')
    capture.mockResolvedValue([canvas])
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.onfocus = null
  })

  it.each(['empty', 'rejected'])('closes an %s capture with an explicit error instead of generating forever', async failure => {
    if (failure === 'empty') capture.mockResolvedValue([])
    else capture.mockRejectedValue(new Error('Capture failed'))
    const onClose = vi.fn()
    render(<PreviewDialog docExportType="pdf" cards={cards} onClose={onClose} />)
    await flushPreview()
    expect(showSnack).toHaveBeenCalledWith('Unable to generate preview, Please Contact Support', 'error')
    expect(screen.queryByText('Generating...')).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it.each(['pdf', 'print', 'recognize'] as const)('reports a rejected %s operation and releases the busy state', async docExportType => {
    const operation = docExportType === 'pdf' ? download : docExportType === 'print' ? print : pdfFile
    operation.mockRejectedValue(new Error('PDF failed'))
    const onClose = vi.fn()
    render(<PreviewDialog docExportType={docExportType} cards={cards} onClose={onClose} />)
    await flushPreview()
    expect(showSnack).toHaveBeenCalledWith('Unable to generate preview, Please Contact Support', 'error')
    expect(screen.queryByText('Generating...')).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('preserves the existing window focus handler and revokes the print URL on close', async () => {
    const previousFocus = vi.fn()
    window.onfocus = previousFocus
    const revoke = vi.fn()
    vi.stubGlobal('URL', { revokeObjectURL: revoke })
    print.mockImplementation(async (_canvases, _name, _orientation, callback) => callback('blob:print-preview'))
    const onClose = vi.fn()
    const { unmount } = render(<PreviewDialog docExportType="print" cards={cards} onClose={onClose} />)
    await flushPreview()
    expect(window.onfocus).toBe(previousFocus)
    act(() => window.dispatchEvent(new Event('focus')))
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:print-preview')
  })

  it.each(['pdf', 'slide'] as const)('closes after successful %s export with its preview images', async docExportType => {
    const operation = docExportType === 'pdf' ? download : slides
    const onClose = vi.fn()
    operation.mockImplementation((_canvases, _name, _orientation, callback) => callback())
    render(<PreviewDialog docExportType={docExportType} cards={cards} pageData orientation="landscape" onClose={onClose} />)
    await flushPreview()
    expect(screen.getByAltText('Quick Facts Card')).toHaveAttribute('src', 'data:image/jpeg;base64,a')
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByText('Generating...')).not.toBeInTheDocument()
    expect(showSnack).not.toHaveBeenCalled()
    if (docExportType === 'pdf') expect(download).toHaveBeenCalledWith(
      expect.any(Array), expect.any(String), 'landscape', expect.any(Function)
    )
    else expect(slides).toHaveBeenCalledWith(undefined, cards, expect.any(Array), expect.any(Function), showSnack)
  })

  it('hands the generated PDF and card metadata to recognition before closing', async () => {
    const blob = new Blob(['fixture PDF'], { type: 'application/pdf' })
    pdfFile.mockImplementation(async (_canvases, callback) => callback(blob))
    const onClose = vi.fn()
    render(<PreviewDialog docExportType="recognize" cards={cards} onClose={onClose} />)
    await flushPreview()
    expect(recognition).toHaveBeenCalledWith(expect.objectContaining({ cardPdf: blob, cardType: 'DETAIL', filterDate: '' }))
    expect(screen.queryByAltText('Quick Facts Card')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close recognition' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not begin a capture after the preview is unmounted', async () => {
    const { unmount } = render(<PreviewDialog docExportType="pdf" cards={cards} onClose={vi.fn()} />)
    unmount()
    await flushPreview()
    expect(capture).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
    expect(showSnack).not.toHaveBeenCalled()
  })
})

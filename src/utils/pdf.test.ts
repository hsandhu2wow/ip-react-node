import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { computeImagePlacement, downloadPDF, getPDFFile, printPDF, setCustomVerticalPosition } from './pdf'

const sdk = vi.hoisted(() => {
  const pdf = {
    internal: { pageSize: { getWidth: () => 297, getHeight: () => 420 } },
    addImage: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn<(type: string) => Blob | URL>(),
    save: vi.fn(),
    autoPrint: vi.fn(),
  }
  return { pdf, constructor: vi.fn(function () { return pdf }) }
})

vi.mock('jspdf', () => ({ default: sdk.constructor }))

// A3 portrait in mm
const A3_W = 297
const A3_H = 420
const PX_TO_MM = 0.264583

describe('computeImagePlacement (PdfGenerationService maths)', () => {
  it('keeps a small image at natural size (px→mm / 2 + 10), centred horizontally, top at 1/6 of free space', () => {
    const p = computeImagePlacement(800, 600, A3_W, A3_H)
    const w = (800 * PX_TO_MM) / 2 + 10
    const h = (600 * PX_TO_MM) / 2 + 10
    expect(p.width).toBeCloseTo(w)
    expect(p.height).toBeCloseTo(h)
    expect(p.posX).toBeCloseTo((A3_W - w) / 2)
    expect(p.posY).toBeCloseTo((A3_H - h) / 6)
  })

  describe('PDF export workflows', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      sdk.pdf.addImage.mockReset()
      sdk.pdf.addPage.mockReset()
      sdk.pdf.output.mockReset()
      sdk.pdf.save.mockReset()
      setCustomVerticalPosition(6)
    })

    afterEach(() => {
      setCustomVerticalPosition(6)
    })

    function canvas(width: number, height: number) {
      return Object.assign(document.createElement('canvas'), { width, height })
    }

    it('renders each canvas on its own portrait page and delivers the generated blob', async () => {
      const canvases = [canvas(800, 600), canvas(3000, 9000)]
      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      sdk.pdf.output.mockReturnValue(blob)
      const callback = vi.fn()
      const order: string[] = []
      sdk.pdf.addImage.mockImplementation(() => { order.push('image') })
      sdk.pdf.addPage.mockImplementation(() => { order.push('page') })

      await getPDFFile(canvases, callback)

      expect(sdk.constructor).toHaveBeenCalledWith('portrait', 'mm', 'a3')
      const placement = computeImagePlacement(800, 600, A3_W, A3_H)
      expect(sdk.pdf.addImage).toHaveBeenNthCalledWith(
        1, canvases[0], 'JPEG', placement.posX, placement.posY, placement.width, placement.height,
      )
      expect(sdk.pdf.addImage).toHaveBeenNthCalledWith(2, canvases[1], 'JPEG', 0, 0, A3_W, A3_H)
      expect(order).toEqual(['image', 'page', 'image'])
      expect(sdk.pdf.output).toHaveBeenCalledWith('blob')
      expect(callback).toHaveBeenCalledExactlyOnceWith(blob)
    })

    it('downloads a landscape PDF using custom vertical placement before notifying completion', async () => {
      setCustomVerticalPosition(2)
      const image = canvas(800, 600)
      const callback = vi.fn(() => { expect(sdk.pdf.save).toHaveBeenCalledWith('Weekly Facts.pdf') })

      await downloadPDF([image], 'Weekly Facts.pdf', 'landscape', callback)

      const placement = computeImagePlacement(image.width, image.height, A3_W, A3_H, 2)
      expect(sdk.constructor).toHaveBeenCalledWith('landscape', 'mm', 'a3')
      expect(sdk.pdf.addImage).toHaveBeenCalledWith(
        image, 'JPEG', placement.posX, placement.posY, placement.width, placement.height,
      )
      expect(sdk.pdf.addPage).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledOnce()
    })

    it('enables auto-print and returns the printable blob URL as a string', async () => {
      const url = new URL('blob:https://example.test/printable')
      sdk.pdf.output.mockImplementation(type => {
        expect(sdk.pdf.autoPrint).toHaveBeenCalledOnce()
        expect(type).toBe('bloburl')
        return url
      })
      const callback = vi.fn()

      await printPDF([canvas(100, 100)], 'print', 'portrait', callback)

      expect(callback).toHaveBeenCalledExactlyOnceWith(url.toString())
      expect(sdk.pdf.save).not.toHaveBeenCalled()
    })

    it('supports empty exports and omitted callbacks', async () => {
      await getPDFFile([])
      await downloadPDF([], 'empty.pdf', 'portrait')
      await printPDF([], 'empty', 'landscape')

      expect(sdk.pdf.addImage).not.toHaveBeenCalled()
      expect(sdk.pdf.addPage).not.toHaveBeenCalled()
      expect(sdk.pdf.save).toHaveBeenCalledWith('empty.pdf')
      expect(sdk.pdf.autoPrint).toHaveBeenCalledOnce()
    })

    it('propagates rendering failures without saving or notifying completion', async () => {
      const error = new Error('invalid image')
      sdk.pdf.addImage.mockImplementation(() => { throw error })
      const callback = vi.fn()

      await expect(downloadPDF([canvas(100, 100)], 'failed.pdf', 'portrait', callback)).rejects.toBe(error)

      expect(sdk.pdf.save).not.toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
    })

    it('propagates output and save failures without invoking success callbacks', async () => {
      const callback = vi.fn()
      const outputError = new Error('output failed')
      sdk.pdf.output.mockImplementation(() => { throw outputError })
      await expect(getPDFFile([], callback)).rejects.toBe(outputError)

      const saveError = new Error('save failed')
      sdk.pdf.save.mockImplementation(() => { throw saveError })
      await expect(downloadPDF([], 'failed.pdf', 'portrait', callback)).rejects.toBe(saveError)
      expect(callback).not.toHaveBeenCalled()
    })
  })

  it('scales an over-wide image down to page width, preserving ratio, at x=0', () => {
    const p = computeImagePlacement(3000, 1000, A3_W, A3_H)
    const w = (3000 * PX_TO_MM) / 2 + 10
    const h = (1000 * PX_TO_MM) / 2 + 10
    expect(p.width).toBe(A3_W)
    expect(p.height).toBeCloseTo(h * (A3_W / w))
    expect(p.posX).toBe(0)
  })

  it('caps the height at the page after width scaling (ratio not re-applied, as in Angular)', () => {
    const p = computeImagePlacement(3000, 9000, A3_W, A3_H)
    expect(p.width).toBe(A3_W)
    expect(p.height).toBe(A3_H)
    expect(p.posY).toBe(0)
  })

  it('scales an over-tall image down to page height and centres it', () => {
    const p = computeImagePlacement(1000, 4000, A3_W, A3_H)
    const w = (1000 * PX_TO_MM) / 2 + 10
    const h = (4000 * PX_TO_MM) / 2 + 10
    expect(p.height).toBe(A3_H)
    expect(p.width).toBeCloseTo(w * (A3_H / h))
    expect(p.posX).toBeCloseTo((A3_W - p.width) / 2)
    expect(p.posY).toBe(0)
  })

  it('honours a custom vertical position factor', () => {
    const p = computeImagePlacement(800, 600, A3_W, A3_H, 2)
    expect(p.posY).toBeCloseTo((A3_H - p.height) / 2)
  })
})

/**
 * Port of Angular PdfGenerationService (src/app/services/pdf-generation.service.ts).
 * jsPDF is loaded on demand, as in Angular.
 */
import type { jsPDF } from 'jspdf'

export type PdfOrientation = 'portrait' | 'landscape'

const PIXEL_TO_MILLIMETER = 0.264583
let posYFactor = 6

export function setCustomVerticalPosition(customPosYFactor: number) {
  posYFactor = customPosYFactor
}

export interface ImagePlacement {
  posX: number
  posY: number
  width: number
  height: number
}

/** Size/position maths for one canvas on one page (all values in mm). */
export function computeImagePlacement(
  canvasWidth: number,
  canvasHeight: number,
  pdfScreenWidth: number,
  pdfScreenHeight: number,
  yFactor: number = posYFactor,
): ImagePlacement {
  const imageWidth = (canvasWidth * PIXEL_TO_MILLIMETER) / 2 + 10
  const imageHeight = (canvasHeight * PIXEL_TO_MILLIMETER) / 2 + 10
  let pdfImgWidth = imageWidth
  let pdfImgHeight = imageHeight
  if (imageWidth > pdfScreenWidth) {
    const ratio = pdfScreenWidth / imageWidth
    pdfImgWidth = pdfScreenWidth
    pdfImgHeight = imageHeight * ratio
    if (pdfImgHeight > pdfScreenHeight) {
      pdfImgHeight = pdfScreenHeight
    }
  } else if (imageHeight > pdfScreenHeight) {
    const ratio = pdfScreenHeight / imageHeight
    pdfImgHeight = pdfScreenHeight
    pdfImgWidth = imageWidth * ratio
    if (pdfImgWidth > pdfScreenWidth) {
      pdfImgWidth = pdfScreenWidth
    }
  }
  const posX = pdfImgWidth < pdfScreenWidth ? (pdfScreenWidth - pdfImgWidth) / 2 : 0
  const posY = pdfImgHeight < pdfScreenHeight ? (pdfScreenHeight - pdfImgHeight) / yFactor : 0
  return { posX, posY, width: pdfImgWidth, height: pdfImgHeight }
}

async function generatePDF(canvases: HTMLCanvasElement[], _title: string, orientation: PdfOrientation): Promise<jsPDF> {
  const { default: JsPDF } = await import('jspdf')
  // Angular passes `orientation ? 'a3' : 'a4'` — orientation is always set, so this is always A3.
  const pdf = new JsPDF(orientation, 'mm', orientation ? 'a3' : 'a4')
  canvases.forEach((canvas, index) => {
    const pdfScreenWidth = pdf.internal.pageSize.getWidth()
    const pdfScreenHeight = pdf.internal.pageSize.getHeight()
    const { posX, posY, width, height } = computeImagePlacement(
      canvas.width,
      canvas.height,
      pdfScreenWidth,
      pdfScreenHeight,
    )
    pdf.addImage(canvas, 'JPEG', posX, posY, width, height)
    if (index + 1 !== canvases.length) {
      pdf.addPage()
    }
  })
  return pdf
}

export async function getPDFFile(canvases: HTMLCanvasElement[], callback?: (pdf: Blob) => void) {
  const pdf = await generatePDF(canvases, 'title', 'portrait')
  const pdfContents = pdf.output('blob')
  callback?.(pdfContents)
}

export async function downloadPDF(
  canvases: HTMLCanvasElement[],
  title: string,
  orientation: PdfOrientation,
  callback?: () => void,
) {
  const pdf = await generatePDF(canvases, title, orientation)
  pdf.save(title)
  callback?.()
}

export async function printPDF(
  canvases: HTMLCanvasElement[],
  title: string,
  orientation: PdfOrientation,
  callback?: (blobUrl: string) => void,
) {
  const pdf = await generatePDF(canvases, title, orientation)
  pdf.autoPrint()
  callback?.(String(pdf.output('bloburl')))
}

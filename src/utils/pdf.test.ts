import { describe, it, expect } from 'vitest'
import { computeImagePlacement } from './pdf'

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

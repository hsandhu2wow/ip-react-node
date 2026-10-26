import { describe, it, expect } from 'vitest'
import { buildSlideRequests, presentationName } from './gcpSlides'

describe('gcpSlides', () => {
  it('names presentations Quick_Facts_Card_M_d_yy_h_mm_a', () => {
    expect(presentationName(new Date(2024, 2, 5, 14, 7))).toBe('Quick_Facts_Card_3_5_24_2_07_PM')
  })

  it('deletes the default slide and adds a titled image slide per card', () => {
    const pageSize = { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 5143500, unit: 'EMU' } }
    const requests = buildSlideRequests(
      [{ cardName: 'a', cardType: 'summary', level: 'National', title: 'Sales' }],
      'p',
      pageSize,
      ['https://img/0.jpeg'],
    )
    expect(requests[0]).toEqual({ deleteObject: { objectId: 'p' } })
    expect(requests).toHaveLength(5)
    const { createImage } = requests[2] as { createImage: { url: string; elementProperties: { size: unknown; transform: { translateX: number } } } }
    expect(createImage.url).toBe('https://img/0.jpeg')
    expect(createImage.elementProperties.transform.translateX).toBeCloseTo((9144000 * 0.37) / 12700)
    expect(createImage.elementProperties.size).toEqual({
      height: { magnitude: 5143500 * 0.99, unit: 'EMU' },
      width: { magnitude: 9144000 * 0.6, unit: 'EMU' },
    })
    expect(requests[3]).toEqual({ insertText: { objectId: 'title-0', text: 'National Sales summary Card' } })
  })
})

import { describe, it, expect } from 'vitest'
import { buildRecognizeFormData, buildRecognizePayload, parseEmployeeEmail, type PreviewCard } from './recognize'

const pdf = new Blob(['%PDF'], { type: 'application/pdf' })

describe('parseEmployeeEmail', () => {
  it('extracts the address between < and >', () => {
    expect(parseEmployeeEmail('Jane Citizen <jcitizen@woolworths.com.au>')).toBe('jcitizen@woolworths.com.au')
  })
  it('returns undefined when there is no address', () => {
    expect(parseEmployeeEmail('Jane Citizen')).toBeUndefined()
  })
})

describe('buildRecognizeFormData', () => {
  it('uses cardTitle/location/childCode for generic cards', () => {
    const card = {
      apiType: 'generic', cardName: 'sales_v4', cardType: 'summary', cardTitle: 'Sales',
      location: 'National', childCode: 'NAT', cardCode: 'X', id: '42',
    } as PreviewCard
    const data = buildRecognizeFormData(card, '2024-01-09', pdf)
    expect(data).toMatchObject({
      cardTitle: 'Sales', cardLevel: 'National', cardDesc: 'National', cardCode: 'NAT',
      cardType: 'summary', cardId: '42', filterDate: '09-01-2024',
      attachmentName: 'National - summary - 09-01-2024.pdf',
    })
    expect(data.cardPdf).toBe(pdf)
  })

  it('uses title/level/cardCode for non-generic cards', () => {
    const card = {
      cardName: 'x', cardType: 'details', title: 'Wastage', level: 'Store 1001', cardCode: 'C1', id: '7',
    } as PreviewCard
    const data = buildRecognizeFormData(card, '2024-12-31', pdf)
    expect(data).toMatchObject({
      cardTitle: 'Wastage', cardLevel: 'Store 1001', cardCode: 'C1',
      attachmentName: 'Store 1001 - details - 31-12-2024.pdf',
    })
  })
})

describe('buildRecognizePayload', () => {
  const data = buildRecognizeFormData(
    { apiType: 'generic', cardName: 'sales_v4', cardType: 'summary', cardTitle: 'Sales', location: 'National', childCode: 'NAT', id: '42' } as PreviewCard,
    '2024-01-09',
    pdf,
  )

  it('sends exactly Angular’s multipart fields, in order', () => {
    const fd = buildRecognizePayload(data, {
      receipientEmail: 'a@woolworths.com.au', lineManagerEmail: 'm@woolworths.com.au',
      receipientEmployeeNumber: '111', lineManagerEmployeeNumber: '222',
      qfAccessValidation: 'Y', body: 'Great work',
    })
    expect([...fd.keys()]).toEqual([
      'CardPDF', 'send_to', 'cc_to', 'recipient_emp_number', 'line_manager_emp_number',
      'qf_access_validation', 'card_level', 'card_title', 'card_type', 'card_id', 'card_desc',
      'card_code', 'filter_date', 'body',
    ])
    expect(fd.get('send_to')).toBe('a@woolworths.com.au')
    expect(fd.get('cc_to')).toBe('m@woolworths.com.au')
    expect(fd.get('card_level')).toBe('National')
    expect(fd.get('card_desc')).toBe('National')
    expect(fd.get('card_code')).toBe('NAT')
    expect(fd.get('card_id')).toBe('42')
    expect(fd.get('filter_date')).toBe('09-01-2024')
    expect(fd.get('body')).toBe('Great work')
    const file = fd.get('CardPDF') as File
    expect(file.name).toBe('National - summary - 09-01-2024.pdf')
  })

  it('stringifies a missing line manager as "null" and empty emp number as "" like FormData in Angular', () => {
    const fd = buildRecognizePayload(data, {
      receipientEmail: 'a@woolworths.com.au', lineManagerEmail: null,
      receipientEmployeeNumber: '111', lineManagerEmployeeNumber: '',
      qfAccessValidation: 'N', body: 'x',
    })
    expect(fd.get('cc_to')).toBe('null')
    expect(fd.get('line_manager_emp_number')).toBe('')
    expect(fd.get('qf_access_validation')).toBe('N')
  })
})

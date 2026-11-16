import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api/users', () => ({
  getUserDetails: vi.fn(async () => ({ employee_number: '123', Store_Insights_Role: '675' })),
}))

import { sendQFDataToAnalytics } from './analytics'

describe('sendQFDataToAnalytics (SqfCardsService)', () => {
  beforeEach(() => {
    delete (window as unknown as { dataLayer?: unknown }).dataLayer
  })

  it('pushes a quick_facts_element_click event with user details', async () => {
    await sendQFDataToAnalytics('periodChangeWTD', 'sales', '1001')
    const layer = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer
    expect(layer).toHaveLength(1)
    expect(layer[0]).toMatchObject({
      event: 'quick_facts_element_click',
      employeeNumber: '123',
      siRole: '675',
      quickFactEventType: 'periodChangeWTD',
      quickFactCardType: 'sales',
      selectedLocation: '1001',
    })
    expect(typeof layer[0]['gtm.start']).toBe('number')
  })
})

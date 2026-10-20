import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as sqf from './sqf'
import client from './client'
import { seasonalAPI } from '../test/fixtures/seasonal'
import { formatDate, getYesterdayDate } from '../utils/formatters'

vi.mock('./client', () => ({ default: { get: vi.fn() } }))
const options = {
  node: { apiDepth: 0, code: 'AU', level_desc: 'National' }, date: '2026-10-18',
  config: { titleText: 'Summer Event', summary: 1, details: 1, sequence: 4,
    summary_start_level: 0, summary_last_level: 6, details_start_level: 0, details_last_level: 5 },
}
beforeEach(() => vi.mocked(client.get).mockReset().mockResolvedValue({ data: [seasonalAPI] }))

describe('seasonal mapping (Angular ISeasonalCardAPI)', () => {
  it('maps legacy KPIs, chart values and non-UNK rows without generic-card conversion', async () => {
    const [card] = await sqf.fetchSeasonalCards(options)
    expect(card).toMatchObject({
      error: null, id: '12', jsId: 'js-seasonal-summary-card-0', type: 'seasonal', title: 'Summer Event', level: 'National',
      status: 'Green', infoMainNumberFull: 12.345, infoMainNumber: '12.35%', infoSubNumber: '0%',
      infoMainNumberText: 'Sell Thru By Commitment ', infoSubDetails: 'Sell thru by SOH',
      infoAdditional1: '1.2K', infoAdditional1Text: 'Sales QTY', infoAdditional2: '$12.3K', infoAdditional2Text: 'Sales',
      reportingPeriod: 'Event-to-date', zero_sales_soh_articles: 8, seq: 4, isDetailsPageAvailable: true, canDrillDown: true,
      chartData: [{ day: 'Mon', sales: 1245 }],
    })
    expect(card.tableData).toEqual([expect.objectContaining({
      state: 'zulu FOCUS', parentCode: 'AU', salesETD: '$1.2K', salesETDUnFormatted: 1200.75,
      salesLyETD: '$2K', salesVsLyETD: '-40.25%', salesVsLyETDColorVal: 'negative',
      sellThruByCommitment: '12.35%', sellThruByCommitmentColorVal: 'positive', sellThruBySOH: '0%',
      sellThruBySOHColorVal: 'positive', salesQtyTy: 25, salesQtyTyVsLyPerc: '-2.50%', soh: 14, optimized_sell_thru: '25.25%',
    })])
    expect(client.get).toHaveBeenCalledWith('/sqf/seasonalMetric/0/2026-10-18')
  })

  it('maps Category details, chart fallback, table-only and absent KPI values', async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [{ ...seasonalAPI, cardType: 'details', LEVEL: 'Category',
      metrics_chart: undefined, SELL_THRU_BY_COMMITMENT_TY: '', SALES_TY: '', SALES_QTY_TY: 0, isTableOnly: true }] })
    const [card] = await sqf.fetchSeasonalCards({ ...options, forDetails: true, node: { ...options.node, apiDepth: 5, code: '1234-10' } })
    expect(card).toMatchObject({ infoMainNumberFull: null, infoMainNumber: ' - ', infoAdditional1: ' - ',
      infoAdditional2: ' - ', infoAdditional2Text: '', tableOnly: true, canDrillDown: false, status: 'White',
      chartData: [{ day: 'Tue', sales: 98 }], jsId: 'js-seasonal-details-card-0' })
    expect(client.get).toHaveBeenCalledWith('/sqf/seasonalMetricDetails/5/2026-10-18/1234-10')
  })

  it('hides unavailable, out-of-level and CFC-restricted cards without requesting data', async () => {
    expect(await sqf.fetchSeasonalCards({ ...options, config: undefined })).toEqual([{ hidden: true }])
    expect(await sqf.fetchSeasonalCards({ ...options, config: { ...options.config, details: 0 }, forDetails: true })).toEqual([{ hidden: true }])
    for (const extra of [
      { config: { ...options.config, summary_start_level: 2 } },
      { node: { ...options.node, apiDepth: 7 } },
      { config: { ...options.config, show_only_cfc: true } },
      { config: { ...options.config, hide_cfc: true }, node: { ...options.node, level_desc: 'category', code: '1234-10' }, cfcChildCodes: ['1234'] },
    ]) {
      expect(await sqf.fetchSeasonalCards({ ...options, ...extra })).toEqual([expect.objectContaining({ hidden: true, title: 'Summer Event', error: expect.objectContaining({ level: true }) })])
    }
    expect(client.get).not.toHaveBeenCalled()
  })

  it.each([
    ['error-NoDataForThisLevel', { hidden: true }],
    ['error-NoDataFoundForSelection', { error: { generic: 'Not for this selection', supportEmail: 'help@example.com' } }],
    ['error-wmd', { error: { wmd: true, supportEmail: 'help@example.com' } }],
    ['error-NoDataFound', { error: { generic: true, cutOffTime: null, supportEmail: 'help@example.com' } }],
  ])('handles %s responses like the common legacy fetch', async (status, expected) => {
    vi.mocked(client.get).mockResolvedValue({ data: { status, message: 'Not for this selection', support_email: 'help@example.com' } })
    expect((await sqf.fetchSeasonalCards(options))[0]).toMatchObject(expected)
  })

  it('preserves hidden and generic error envelopes from the common fetch', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ data: { hidden: true } })
    expect(await sqf.fetchSeasonalCards(options)).toEqual([{ hidden: true }])
    vi.mocked(client.get).mockResolvedValueOnce({ data: {
      status: 'error-NoDataFound', isGenericCardApi: true, cardType: 'summary', title: 'Generic seasonal error',
      error: { generic: false, support_email: 'generic@example.com' },
    } })
    const [card] = await sqf.fetchSeasonalCards({ ...options, date: formatDate(getYesterdayDate()),
      eta: { seasonal: { time: new Date('2026-10-19T09:30:00') } } })
    expect(card).toMatchObject({ title: 'Generic seasonal error', isGenericCardApi: true,
      error: { cutOffTime: '9:30 AM', generic: false, supportEmail: 'generic@example.com' } })
  })

  it('uses yesterday-only ETA and maps network failures to a generic support error', async () => {
    vi.mocked(client.get).mockResolvedValueOnce({ data: { status: 'error-NoDataFound' } })
    const [card] = await sqf.fetchSeasonalCards({ ...options, date: formatDate(getYesterdayDate()),
      eta: { seasonal: { time: new Date('2026-10-19T08:30:00'), day: 'Tomorrow' } } })
    expect(card.error).toMatchObject({ cutOffTime: 'Tomorrow 8:30 AM', generic: false })
    vi.mocked(client.get).mockRejectedValueOnce({ response: { data: { support_email: 'network@example.com' } } })
    expect((await sqf.fetchSeasonalCards(options))[0].error).toMatchObject({ generic: true, supportEmail: 'network@example.com' })
  })
})

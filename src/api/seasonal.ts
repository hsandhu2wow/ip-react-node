import client from './client'
import type { ETAMap, IAvailableCardConfig, ISeasonalCard, ISeasonalCardAPI, ISeasonalTableAPI, ISQFCardError } from '../types/sqf.types'
import { beautify, colorVal, REPORTING_PERIODS } from '../utils/formatters'
import { isCFCNode } from '../utils/cardDropdown'
import { getETAString } from '../utils/eta'

export interface SeasonalRequest {
  node: { apiDepth: number; code: string; level_desc: string }
  date: string
  config?: IAvailableCardConfig
  forDetails?: boolean
  cfcChildCodes?: string[]
  eta?: ETAMap
  supportEmail?: string
}

const percentage = (value?: string) => value ? `${beautify(parseFloat(value).toFixed(2), 2, false)}%` : null
// Legacy colorVal treats zero/missing as positive; the generic React helper uses neutral.
const legacyColor = (value?: string) => colorVal(value || '') === 'negative' ? 'negative' : 'positive'

function mapTable(row: ISeasonalTableAPI) {
  return {
    state: row.CHILD_DESC, parentCode: row.PARENT_CODE,
    salesETD: beautify(parseInt(row.SALES_TY), 1, true), salesETDUnFormatted: parseFloat(row.SALES_TY),
    salesLyETD: row.SALES_LY ? beautify(parseInt(row.SALES_LY), 1, true) : null,
    salesVsLyETD: row.SALES_TY_LY_DIFF_PERC ? `${parseFloat(row.SALES_TY_LY_DIFF_PERC)}%` : null,
    salesVsLyETDColorVal: legacyColor(row.SALES_TY_LY_DIFF_PERC),
    sellThruByCommitment: percentage(row.SELL_THRU_BY_COMMITMENT_TY),
    sellThruByCommitmentColorVal: legacyColor(row.SELL_THRU_BY_COMMITMENT_TY),
    sellThruBySOH: percentage(row.SELL_THRU_BY_SOH_TY), sellThruBySOHColorVal: legacyColor(row.SELL_THRU_BY_SOH_TY),
    salesQtyTy: row.SALES_QTY_TY ? parseInt(row.SALES_QTY_TY) : ' - ', salesQtyTyColorVal: legacyColor(row.SALES_QTY_TY),
    salesQtyTyVsLyPerc: row.SALES_QTY_TY_VS_LY_PERC ? `${row.SALES_QTY_TY_VS_LY_PERC}%` : ' - ',
    salesQtyTyVsLyPercColorVal: legacyColor(row.SALES_QTY_TY_VS_LY_PERC),
    soh: row.SOH ? parseInt(row.SOH) : null,
    optimized_sell_thru: row.OPTIMISED_SELL_THRU ? `${parseFloat(row.OPTIMISED_SELL_THRU)}%` : null,
  }
}

export function mapSeasonalCards(raw: ISeasonalCardAPI[], request: SeasonalRequest): ISeasonalCard[] {
  return raw.map((card, index) => setupCommonProps({
    id: card.Card_id, jsId: `js-seasonal-${card.cardType}-card-${index}`,
    type: 'seasonal', cardName: 'seasonal', title: request.config?.titleText,
    level: card.CHILD_DESC, isPinned: card.isPinned, parentLevel: card.parentLevel, parentCode: card.parentCode,
    cardLevel: card.LEVEL, cardCode: card.CHILD_CODE, cardType: card.cardType, error: null,
    status: card.isTableOnly ? 'White' : 'Green', updatedAt: card.updated_time,
    infoMainNumberFull: card.SELL_THRU_BY_COMMITMENT_TY ? parseFloat(card.SELL_THRU_BY_COMMITMENT_TY) : null,
    infoMainNumber: percentage(card.SELL_THRU_BY_COMMITMENT_TY) ?? ' - ', infoMainNumberText: 'Sell Thru By Commitment ',
    infoSubNumber: percentage(card.SELL_THRU_BY_SOH_TY) ?? ' - ', infoSubDetails: 'Sell thru by SOH',
    infoAdditional1: card.SALES_QTY_TY ? beautify(card.SALES_QTY_TY, 1, false) : ' - ', infoAdditional1Text: 'Sales QTY',
    infoAdditional2: card.SALES_TY ? beautify(card.SALES_TY, 1, true) : ' - ',
    infoAdditional2Text: card.LEVEL === 'Category' && request.forDetails ? '' : 'Sales',
    chartData: (card.metrics_chart || card.metrics_main || []).map(row => ({ day: row.Day, sales: parseInt(row.Sales) })),
    tableData: card.metrics_table.filter(row => row.CHILD_DESC !== 'UNK').map(mapTable),
    tableOnly: card.isTableOnly, canDrillDown: card.isTableOnly ? false : undefined,
    reportingPeriod: REPORTING_PERIODS.ETD,
    zero_sales_soh_articles: card.ZERO_SALES_SOH_ARTICLES ? parseInt(card.ZERO_SALES_SOH_ARTICLES) : null,
  }, request))
}

function setupCommonProps(card: ISeasonalCard, { config, node }: SeasonalRequest): ISeasonalCard {
  const summary = card.cardType.toLowerCase() === 'summary'
  const start = config?.[summary ? 'summary_start_level' : 'details_start_level']
  const last = config?.[summary ? 'summary_last_level' : 'details_last_level']
  return {
    ...card, isGenericCardApi: false, seq: config?.sequence,
    ...(summary ? { isDetailsPageAvailable: !!config?.details && node.apiDepth <= (config.details_last_level ?? -1) } : {}),
    canDrillDown: card.canDrillDown === undefined
      ? start !== undefined && last !== undefined && start <= node.apiDepth && node.apiDepth <= last
      : String(card.canDrillDown) === 'true',
  }
}

interface SeasonalErrorResponse extends Partial<Omit<ISeasonalCard, 'error'>> {
  error?: ISQFCardError & { support_email?: string }
  status?: string
  message?: string
  support_email?: string
  hidden?: boolean
}

/** Raw legacy endpoint (summary or details), before the Seasonal/common-card mapping. */
export async function getSeasonalMetric(apiDepth: number, date: string, code?: string, forDetails = false) {
  const path = apiDepth ? `${apiDepth}/${date}/${code}` : `0/${date}`
  const res = await client.get<ISeasonalCardAPI[] | SeasonalErrorResponse>(
    `/sqf/${forDetails ? 'seasonalMetricDetails' : 'seasonalMetric'}/${path}`,
  )
  return res.data
}

export async function fetchSeasonalCards(request: SeasonalRequest): Promise<ISeasonalCard[]> {
  const { config, node, forDetails, cfcChildCodes = [], date } = request
  const structure = forDetails ? 'details' : 'summary'
  if (!config?.[structure]) return [{ hidden: true } as ISeasonalCard]
  const base: ISeasonalCard = { type: 'seasonal', cardName: 'seasonal', title: config.titleText || 'seasonal', cardType: structure }
  const isCFC = isCFCNode(node, cfcChildCodes)
  if ((config.hide_cfc && isCFC) || (config.show_only_cfc && !isCFC) ||
    (config[`${structure}_start_level`] ?? -Infinity) > node.apiDepth || node.apiDepth > (config[`${structure}_last_level`] ?? Infinity)) {
    return [{ ...base, hidden: true, error: { level: true, supportEmail: request.supportEmail } }]
  }
  const errorCards = (res: SeasonalErrorResponse): ISeasonalCard[] => {
    if (res.hidden) return [res as ISeasonalCard]
    if (res.isGenericCardApi) {
      return [{ ...base, ...res, error: {
        ...res.error, supportEmail: res.error?.support_email || res.error?.supportEmail || res.support_email || request.supportEmail,
        ...(res.status === 'error-NoDataFound' ? { cutOffTime: getETAString(request.eta, 'seasonal', date) } : {}),
      } }]
    }
    if (res.status === 'error-NoDataForThisLevel') return [{ ...base, hidden: true, isGenericCardApi: false }]
    const supportEmail = res.support_email || request.supportEmail
    if (res.status === 'error-NoDataFoundForSelection') return [{ ...base, isGenericCardApi: false, error: { generic: res.message, supportEmail } }]
    if (res.status === 'error-wmd') return [{ ...base, isGenericCardApi: false, error: { wmd: true, supportEmail } }]
    const cutOffTime = res.status === 'error-NoDataFound' ? getETAString(request.eta, 'seasonal', date) : null
    return [setupCommonProps({ ...base, status: res.status, error: { cutOffTime, generic: !cutOffTime, supportEmail } }, request)]
  }
  try {
    const raw = await getSeasonalMetric(node.apiDepth, date, node.code, forDetails)
    if (!Array.isArray(raw)) return errorCards(raw)
    return mapSeasonalCards(raw, request)
  } catch (error) {
    const e = error as { response?: { data?: SeasonalErrorResponse }; error?: SeasonalErrorResponse; res?: SeasonalErrorResponse }
    return errorCards(e.res || e.response?.data || e.error || {})
  }
}

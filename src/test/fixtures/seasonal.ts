import type { ISeasonalCardAPI } from '../../types/sqf.types'

export const seasonalAPI: ISeasonalCardAPI = {
  APP_LEVEL: 'SQF', Budget_TY: '', Card_Name: 'Seasonal', Card_id: '12',
  CHILD_DESC: 'National', CHILD_CODE: 'AU', LEVEL: 'National', cardType: 'summary',
  isPinned: false, parentLevel: '', parentCode: '', table_column_name: '',
  updated_time: '2026-10-18T07:30:00', SELL_THRU_BY_COMMITMENT_TY: '12.345',
  SELL_THRU_BY_SOH_TY: '0', SALES_QTY_TY: '1234', SALES_TY: '12345.67', ZERO_SALES_SOH_ARTICLES: '8',
  metrics_chart: [{ Day: 'Mon', Sales: '1245.99' }], metrics_main: [{ Day: 'Tue', Sales: '98' }],
  metrics_table: [{
    CHILD_CODE: 'A', CHILD_DESC: 'zulu FOCUS', PARENT_CODE: 'AU', SALES_TY: '1200.75',
    SALES_LY: '2000', SALES_TY_LY_DIFF_PERC: '-40.25', SELL_THRU_BY_COMMITMENT_TY: '12.345',
    SELL_THRU_BY_SOH_TY: '0', SALES_QTY_TY: '25', SALES_QTY_TY_VS_LY_PERC: '-2.50',
    SOH: '14', OPTIMISED_SELL_THRU: '25.25',
  }, { CHILD_CODE: 'UNK', CHILD_DESC: 'UNK', PARENT_CODE: 'AU', SALES_TY: '0' }],
}

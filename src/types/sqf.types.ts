// src/types/sqf.types.ts

/** Raw API response from getUniversalFilterGeneric */
export interface ISQFGenericFilter {
  name: string
  code: string
  level: number | string
  level_desc: string
  children?: ISQFGenericFilter[]
  leafChildren?: ISQFGenericFilter[]
  selected?: boolean
  nonClickable?: boolean
  alwaysHidden?: boolean
}

/** Processed tree node used throughout the UI */
export interface IQFTree {
  name: string
  code: string
  level: string
  level_desc: string
  depth: number
  apiDepth: number
  children?: IQFTree[]
  expandable: boolean
  parent?: IQFTree
  selected?: boolean
  leafChildren?: ISQFGenericFilter[] | null
  alwaysHidden?: boolean
  hidden?: boolean
  isChecked?: boolean
  nonClickable?: boolean
}

/** KPI value displayed in a card */
export interface ISQFInfoNumber {
  val: string | number
  label: string
  color?: 'positive' | 'negative' | 'neutral'
}

/** Chart.js compatible data structure */
export interface ISQFChartData {
  labels?: string[]
  datasets?: Array<{
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    label?: string
    type?: string
  }>
}

/** Table data returned by the backend */
export interface ISQFTableData {
  headers?: string[]
  rows?: Array<(string | number | null)[]>
  /** Optional footer row (totals) */
  footer?: (string | number | null)[]
}

/** One tab within a tabbed metric card */
export interface ISQFTabData {
  label: string
  chartData?: ISQFChartData
  tableData?: ISQFTableData
  infoNumbers?: ISQFInfoNumber[]
}

/** Error payload from the backend (mapped from Angular's error handling) */
export interface ISQFCardError {
  cutOffTime?: string | null
  generic?: boolean
  level?: boolean
  wmd?: boolean
  support_email?: string
}

/** Core metric card shape — returned by /sqf/summaryCards and /sqf/detailCard */
export interface ISQFMetricCard {
  cardName: string
  cardType: 'summary' | 'details'
  cardTitle?: string
  cardHeader?: string
  reportingPeriod?: string
  seq?: number
  location?: string
  infoNumbers?: ISQFInfoNumber[]
  chartData?: ISQFChartData
  tableData?: ISQFTableData
  tabs?: ISQFTabData[]
  error?: ISQFCardError
  hidden?: boolean
  isDetailsPageAvailable?: boolean
  canDrillDown?: boolean
  childCode?: string
  jsId?: string
  // Tabbed/filtered card variant
  cards?: ISQFMetricCard[]
  filterKeys?: string[]
  dropdowns?: Array<{ key: string; data: Array<{ key: string; label: string }> }>
  // Computed at fetch time
  isGenericCardApi?: boolean
  apiType?: string
  tableOnly?: boolean
  sortByVal?: number
}

/** Config entry from getSQFMetricCardsStatus */
export interface IAvailableCardConfig {
  titleText?: string
  sequence: number
  summary?: boolean
  details?: boolean
  summary_start_level?: number
  summary_last_level?: number
  details_start_level?: number
  details_last_level?: number
  is_generic_api?: boolean
  hide_cfc?: boolean
  show_only_cfc?: boolean
}

/** Map of cardName → config, from getSQFMetricCardsStatus */
export type IAvailableMetricCards = Record<string, IAvailableCardConfig>

/** One entry from getDataLoadETA */
export interface IDataLoadETA {
  METRIC: string
  Expected_Time: string // "HH:MM:SS" UTC
}

/** Computed ETA map keyed by metric name */
export type ETAMap = Record<string, { time: Date; day?: string }>

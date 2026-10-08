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

/** KPI value displayed in a card — matches actual backend shape */
export interface ISQFInfoNumber {
  displayValue: string | number
  text: string
  color?: string        // HEX color string e.g. "#219653", NOT a class name
  infoMessage?: string
  val?: number          // raw numeric value used for sorting in DetailsPage
}

/** Chart data from the backend — custom format transformed into Chart.js by our component */
export interface ISQFChartDataRow {
  value: number
  color: string
  dataLabel?: string
  tooltip?: string
}

export interface ISQFChartDataset {
  data?: ISQFChartDataRow[]
  _data?: ISQFChartDataRow[]    // some responses use _data
  barThickness?: number
  needleData?: { value: number; color: string; dataLabel: string | string[] }
}

export interface ISQFChartData {
  chartType: 'bar' | 'horizontalBar' | 'pie' | 'doughnut' | 'gauge'
  chartOptions: {
    labels?: string[]
    stacked?: boolean
    displayColors?: boolean
    showCustomTooltip?: boolean
    hasFixedDataLabel?: boolean
    displayDataLabelIndex?: number
    padding?: object
    hideLabels?: boolean
    showOnlyDataSet?: string
  }
  datasets: Record<string, ISQFChartDataset>
}

/** Table data returned by the backend — rows are objects keyed by column0, column1, etc. */
export interface ISQFTableCell {
  displayValue?: string | number
  color?: string
  cssClass?: string
}

export interface ISQFTableRow {
  [key: string]: ISQFTableCell | unknown   // column0, column1, ... keys
  breakdown_table_data?: ISQFTableRow[]
  key?: string
  customFontWeight?: number
}

export interface ISQFTableData {
  type?: 'basic' | 'nested' | 'comments'
  headers?: Array<string | { text: string; tooltip?: string }>
  data?: ISQFTableRow[]
  footer?: ISQFTableRow[]
  sortCol?: string
  sortOrder?: string
  freeze_first_column?: boolean
  columnWidth?: string[]
  hasHTMLHeaders?: boolean
  headersCssClass?: string[]
  scrollHelpText?: { desktop?: string; mobile?: string }
  /** @deprecated legacy field — backend now uses `data` */
  rows?: Array<(string | number | null)[]>
}

/** One tab within a tabbed metric card */
export interface ISQFTabData {
  label: string
  chartData?: ISQFChartData
  tableData?: ISQFTableData
  infoNumbers?: ISQFInfoNumber[]
}

/** One item in an expandable list section of a summary card */
export interface IExpandableListItem {
  header: string        // raw HTML shown as the clickable row header
  content?: string      // raw HTML shown when expanded
  isExpanded?: boolean  // whether item starts expanded
}

/** Error payload from the backend (mapped from Angular's error handling) */
export interface ISQFCardError {
  cutOffTime?: string | null
  generic?: boolean
  level?: boolean
  wmd?: boolean
  /** Human-readable error heading, e.g. "Data refresh failed, we are currently investigating" */
  message?: string
  supportEmail?: string
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
  cardCode?: string
  jsId?: string
  // Tabbed/filtered card variant
  cards?: ISQFMetricCard[]
  filterKeys?: Record<string, string>   // { cardKeysColKey → dropdownKey }
  dropdowns?: Array<{ key: string; icon?: string; data: Array<{ key: string; text: string }> }>
  // Computed at fetch time
  isGenericCardApi?: boolean
  apiType?: string
  tableOnly?: boolean
  sortByVal?: number
  // Card content extensions
  updatedTime?: string                              // ISO date or displayable time string from API
  dataInfo?: { title: string; body: string }        // "Metrics Info" popup content
  subHeading?: string                               // label above KPI numbers
  customInfoNumbers?: string                        // raw HTML replacing infoNumbers display
  richText?: string                                 // raw HTML block after chart
  expandable_list?: IExpandableListItem[]
  customDrillDownText?: string                      // overrides "details" label in footer link
  autoExpandForMobile?: boolean                     // auto-expand table on mobile
  keys?: Record<string, string>                     // identifies this card within a filtered card.cards[]
}

/** Config entry from getSQFMetricCardsStatus */
export interface IAvailableCardConfig {
  titleText?: string
  sequence: number
  summary?: boolean | number   // API returns 0/1
  details?: boolean | number   // API returns 0/1
  summary_start_level?: number
  summary_last_level?: number
  details_start_level?: number
  details_last_level?: number
  is_generic_api?: boolean | number
  hide_cfc?: boolean | number
  show_only_cfc?: boolean | number
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

/** Reporting period offered by the Quick Facts filter */
export type Period = 'WTD' | 'YDAY'

/** Global breakdown axis: one level down the hierarchy, or departments */
export type BreakdownAxis = 'childLevel' | 'department'

/** Per-period value: a bare card array, or the original { cards, sortBy } shape */
export type ISQFPeriodValue = ISQFMetricCard[] | { cards: ISQFMetricCard[]; sortBy?: string }

/** summaryCards / detailCard response: only periods that have data are present */
export type ISQFPeriodResponse = Partial<Record<Period, ISQFPeriodValue>>

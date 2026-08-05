// src/types/wf.types.ts

export interface WfMetricsInfo {
  title: string;
  body: string;
  label?: string;
}

export interface WfVarianceFlag {
  text: string;
  value: boolean;
}

export interface WfBanner {
  type: string;
  text: string;
}

export interface WfTableHeader {
  text: string;
  val: string;
  tooltip?: string;
  alert?: boolean;
  colSpan?: number;
  cssClass?: string;
  columnWidth?: string;
  colType?: string;
}

export interface WfTableCell {
  columnid: number;
  color?: string;
  displayValue: string;
  value: string | number;
  tooltip?: string;
  backgroundColor?: string;
  borderLeftColor?: string;
  borderRightColor?: string;
  infoMessage?: string;
  alert?: boolean;
  tags?: string;
  cssClass?: string;
  rowSpan?: number;
}

export type WfTableRow = WfTableCell[];

export interface WfTableData {
  headers: WfTableHeader[] | string[];
  data: WfTableRow[];
  sortCol?: string;
  sortOrder?: string;
  type?: string;
  colType?: string;
  kpiFilterEnabled?: boolean;
  measureColumnId?: number;
  defaultExpanded?: boolean;
}

export interface WfCardContents {
  seq?: number;
  weekNo?: string;
  month?: string;
  infoMessage?: string;
  timePeriod?: string;
  tableData: WfTableData;
  filterKey?: string;
}

export interface WfCardData {
  cardContents?: WfCardContents | WfCardContents[];
  displayName: string;
  mobileDisplayName?: string;
  key: string;
  hasFiscalWeeks?: boolean;
  hasMobileView?: boolean;
  hasHistoryData?: boolean;
  mobileDateFilterTabName?: string;
  dateFilterValues?: string[];
  dateFilterLabel?: string;
  dateFilterKey?: string;
  durationLabel?: string;
  half_year?: string;
}

export interface WfPageData {
  config?: { ai_insights_enabled?: boolean };
  cards: WfCardData[];
  label?: string;
  level?: string;
  childCode?: string;
  childDesc?: string;
  parentCode?: string;
  parentDesc?: string;
  refreshFiscalPeriod?: string;
  refreshTime: string;
  jsId?: string;
  title?: string;
  cardType?: string;
  banner?: WfBanner;
  toolkit_link?: string;
  usage_dashboard_link?: string;
  is_web_subscription_enabled?: boolean;
  available_views?: string[];
  metricsInfo?: WfMetricsInfo;
  varianceFlag?: WfVarianceFlag;
}

export interface WfError {
  errorTitle?: string;
  errorMsg?: string;
  email?: string;
  subErrorMsg?: string;
}

export type WfMetric = 'weekly' | 'myPlan';

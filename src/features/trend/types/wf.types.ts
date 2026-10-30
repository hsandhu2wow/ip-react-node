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

export interface WfAlert {
  type: string;
  title?: string;
  text: string;
}

export interface WfLink {
  displayText: string;
  link: string;
}

export interface WfHierarchyDropdown {
  allowedViews?: string[];
  label?: string;
  filterDropdown: { displayValue: string; filterKey: string }[];
}

export interface WfTableHeader {
  text: string;
  val: string;
  tooltip?: string;
  alert?: WfAlert;
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
  alert?: WfAlert;
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
  [key: string]: unknown;
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
  mobileInfo?: string;
  key: string;
  toggleChildLevelKey?: string;
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

export interface WfPageConfig {
  ai_insights_enabled?: boolean;
}

export interface WfAiInsights {
  header?: string;
  insights?: string;
  button_text?: string;
}

export interface WfPageData {
  config?: WfPageConfig;
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
  toolkit_link?: WfLink;
  usage_dashboard_link?: WfLink;
  hierarchyDropdown?: WfHierarchyDropdown;
  is_web_subscription_enabled?: boolean;
  available_views?: string[];
  metricsInfo?: WfMetricsInfo;
  varianceFlag?: WfVarianceFlag;
  ai_insights?: WfAiInsights;
}

/** Response of GET /{wf|myplan}/userSubscriptions */
export interface WfUserSubscription {
  subscribed_locations: string[];
  subscribed_views: string[];
  is_store_user?: boolean;
}

/** Subscription endpoints key: Angular WeeklyFactsService uses 'wf' for weekly, 'myplan' for My Plan */
export type WfSubscriptionKey = 'wf' | 'myplan';

export interface WfError {
  errorTitle?: string;
  errorMsg?: string;
  email?: string;
  subErrorMsg?: string;
}

export type WfMetric = 'weekly' | 'myPlan';

export type WfUserSubscriptions = WfUserSubscription;

import { useMemo, useState } from 'react';
import { useTrendData } from '../../hooks/useTrendData';
import { TrendTable } from '../../components/trend/TrendTable';
import type { WfCardContents, WfCardData, WfMetric } from '../../types/wf.types';
import styles from './TrendPage.module.css';

const METRIC_DISPLAY_NAMES: Record<WfMetric, string> = {
  weekly: 'Weekly Facts',
  myPlan: 'My Plan',
};

interface TrendPageProps {
  metric: WfMetric;
}

function formatLastUpdated(refreshTime: string): string {
  const date = new Date(refreshTime);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getSelectedTab(activeCard: WfCardData | undefined, selectedDateFilter: string): WfCardContents | undefined {
  if (!activeCard) return undefined;
  if (Array.isArray(activeCard.cardContents)) {
    const dateFilterKey = activeCard.dateFilterKey || 'weekNo';
    const filterValue = selectedDateFilter || activeCard.dateFilterValues?.[0] || '';
    return activeCard.cardContents.find(
      (c) => (c as unknown as Record<string, string>)[dateFilterKey] === filterValue
    );
  }
  if (activeCard.cardContents) {
    return activeCard.cardContents;
  }
  return undefined;
}

export function TrendPage({ metric }: TrendPageProps) {
  const { data: wfData, isLoading, isError } = useTrendData(metric);
  const [selectedTabKey, setSelectedTabKey] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [showVariance, setShowVariance] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const tabs = useMemo(() => wfData?.cards ?? [], [wfData]);
  const activeCard = useMemo(
    () => tabs.find((c) => c.key === (selectedTabKey || tabs[0]?.key)),
    [tabs, selectedTabKey]
  );
  const selectedTab = useMemo(() => getSelectedTab(activeCard, selectedDateFilter), [activeCard, selectedDateFilter]);
  const tableData = selectedTab?.tableData;

  if (isLoading) {
    return (
      <div className={styles.loading} data-testid="trend-page-loading">
        Loading…
      </div>
    );
  }

  if (isError || !wfData) {
    return (
      <div className={styles.errorBanner} data-testid="trend-page-error">
        Unable to load data. Please try again later.
      </div>
    );
  }

  const metricDisplayName = METRIC_DISPLAY_NAMES[metric];
  const durationLabel = activeCard?.durationLabel || 'Time period';
  const showVarianceToggleEnabled = !!wfData.varianceFlag;
  const showVarianceLabel = wfData.varianceFlag?.text || 'Show variance';
  const kpiFilterEnabled = tableData?.kpiFilterEnabled === true;

  return (
    <div>
      <div className={styles.toolbar}>
        {tabs.length > 1 && (
          <select
            aria-label="Select tab"
            value={activeCard?.key}
            onChange={(e) => {
              setSelectedTabKey(e.target.value);
              setSelectedDateFilter('');
            }}
          >
            {tabs.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.displayName}
              </option>
            ))}
          </select>
        )}
        {!isError && activeCard?.hasHistoryData && (activeCard.dateFilterValues?.length ?? 0) > 0 && (
          <label>
            {activeCard.dateFilterLabel || 'Fiscal week'}:
            <select
              aria-label="Select date"
              value={selectedDateFilter || activeCard.dateFilterValues?.[0] || ''}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            >
              {activeCard.dateFilterValues?.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
        {!isError && showVarianceToggleEnabled && (
          <label>
            <input
              type="checkbox"
              checked={showVariance}
              onChange={(e) => setShowVariance(e.target.checked)}
            />
            {showVarianceLabel}
          </label>
        )}
        {kpiFilterEnabled && (
          <label>
            <input
              type="checkbox"
              checked={isExpanded}
              onChange={(e) => setIsExpanded(e.target.checked)}
            />
            Show all rows
          </label>
        )}
      </div>

      <div className={styles.headerBlock}>
        <div className={styles.title}>
          {metricDisplayName} - {activeCard?.displayName}
        </div>
        <div className={styles.subHeaderRow}>
          <span>
            {durationLabel}: {selectedTab?.timePeriod}
          </span>
          <span>
            {wfData.metricsInfo && (
              <span className={styles.metricsInfo}>{wfData.metricsInfo.label || 'Metrics Info'}</span>
            )}
            {' '}
            {wfData.refreshFiscalPeriod
              ? `Last updated: ${wfData.refreshFiscalPeriod} (${formatLastUpdated(wfData.refreshTime)})`
              : `Last updated: ${formatLastUpdated(wfData.refreshTime)}`}
          </span>
        </div>
        {selectedTab?.infoMessage && <div className={styles.infoMessage}>{selectedTab.infoMessage}</div>}
        {wfData.is_web_subscription_enabled && (
          <div className={styles.subscriptionLink}>Subscription preferences</div>
        )}
      </div>

      {tableData && <TrendTable tableData={tableData} isExpanded={isExpanded} showVariance={showVariance} />}
    </div>
  );
}

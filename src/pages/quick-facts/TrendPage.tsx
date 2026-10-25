import { useCallback, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useTrendData } from '../../hooks/useTrendData';
import { TrendTable } from '../../components/trend/TrendTable';
import type { WfAlert, WfError, WfMetric } from '../../types/wf.types';
import { createTrendSelection, updateTrendSelection } from '../../utils/trendSelection';
import { useAuth } from '../../context/AuthContext';
import { TrendInfoDialog } from '../../components/trend/TrendInfoDialog';
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

export function TrendPage({ metric }: TrendPageProps) {
  const { user } = useAuth();
  const { data: wfData, isLoading, isError, error } = useTrendData(metric);
  const [previousData, setPreviousData] = useState(wfData);
  const [previousMetric, setPreviousMetric] = useState(metric);
  const [selection, setSelection] = useState(() => createTrendSelection(wfData));
  const [showVariance, setShowVariance] = useState(wfData?.varianceFlag?.value ?? false);
  const [showChildLevel, setShowChildLevel] = useState(false);
  const [popup, setPopup] = useState<WfAlert | null>(null);
  const closePopup = useCallback(() => setPopup(null), []);

  if (previousData !== wfData || previousMetric !== metric) {
    setPreviousData(wfData);
    setPreviousMetric(metric);
    setSelection(createTrendSelection(wfData));
    setShowVariance(wfData?.varianceFlag?.value ?? false);
    setPopup(null);
  }

  const tabs = useMemo(() => wfData?.cards ?? [], [wfData]);
  const activeCard = useMemo(
    () => tabs.find((c) => c.key === selection.cardKey),
    [tabs, selection.cardKey]
  );
  const selectedTab = selection.contents;
  const tableData = selectedTab?.tableData;
  const defaultExpanded = tableData?.kpiFilterEnabled
    ? tableData.defaultExpanded ?? false
    : true;
  const [previousTable, setPreviousTable] = useState(tableData);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  if (previousTable !== tableData || previousData !== wfData || previousMetric !== metric) {
    setPreviousTable(tableData);
    setIsExpanded(defaultExpanded);
  }

  if (isLoading) {
    return (
      <div className={styles.loading} data-testid="trend-page-loading">
        Loading…
      </div>
    );
  }

  if (isError || !wfData) {
    const details = isAxiosError<WfError>(error) ? error.response?.data : undefined;
    return (
      <div className={styles.errorBanner} data-testid="trend-page-error" role="alert">
        {details?.errorTitle && <div className={styles.errorTitle}>{details.errorTitle}</div>}
        <div>{details?.errorMsg || 'Unable to load data. Please try again later.'}</div>
        {(details?.subErrorMsg || details?.email) && (
          <p>
            {details.subErrorMsg}{' '}
            {details.email && <a href={`mailto:${details.email}`}>{details.email}</a>}
          </p>
        )}
      </div>
    );
  }

  const metricDisplayName = METRIC_DISPLAY_NAMES[metric];
  const durationLabel = activeCard?.durationLabel || 'Time period';
  const showVarianceToggleEnabled = !!wfData.varianceFlag;
  const showVarianceLabel = wfData.varianceFlag?.text || 'Show variance';
  const kpiFilterEnabled = tableData?.kpiFilterEnabled === true;
  const hierarchyDropdown = wfData.hierarchyDropdown;
  const showHierarchy = hierarchyDropdown?.allowedViews?.includes(selection.cardKey) === true;

  return (
    <div className={styles.wrapperContent}>
      <div className={styles.wfHome}>
        <div className={styles.toolbar}>
          {tabs.length > 1 && (
            <select
              className={styles.select}
              aria-label="Select tab"
              value={activeCard?.key}
              onChange={(e) => {
                setSelection(updateTrendSelection(wfData, selection, { type: 'view', value: e.target.value }));
              }}
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.displayName}
                </option>
              ))}
            </select>
          )}
          {activeCard?.hasHistoryData && (activeCard.dateFilterValues?.length ?? 0) > 0 && (
            <label className={styles.selectLabel}>
              {activeCard.dateFilterLabel || 'Fiscal week'}:
              <select
                className={styles.select}
                aria-label="Select date"
                value={selection.date}
                onChange={(e) => setSelection(updateTrendSelection(wfData, selection, { type: 'date', value: e.target.value }))}
              >
                {activeCard.dateFilterValues?.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {showHierarchy && hierarchyDropdown && (
            <label className={styles.selectLabel}>
              {hierarchyDropdown.label || 'View'}:
              <select
                className={styles.select}
                aria-label={hierarchyDropdown.label || 'View'}
                value={selection.hierarchy}
                onChange={(e) => setSelection(updateTrendSelection(wfData, selection, { type: 'hierarchy', value: e.target.value }))}
              >
                {hierarchyDropdown.filterDropdown.map(option => (
                  <option key={option.filterKey} value={option.filterKey}>{option.displayValue}</option>
                ))}
              </select>
            </label>
          )}
          {showVarianceToggleEnabled && (
            <label className={styles.toggleLabel}>
              <span
                className={[styles.toggleSwitch, showVariance ? styles.toggleSwitchOn : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={showVariance}
                  onChange={(e) => setShowVariance(e.target.checked)}
                />
                <span className={styles.toggleThumb} />
              </span>
              {showVarianceLabel}
            </label>
          )}
          {activeCard?.toggleChildLevelKey && (
            <label className={styles.toggleLabel}>
              <span className={[styles.toggleSwitch, showChildLevel ? styles.toggleSwitchOn : ''].filter(Boolean).join(' ')}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={showChildLevel}
                  onChange={(event) => {
                    setShowChildLevel(event.target.checked);
                    setIsExpanded(defaultExpanded);
                  }}
                />
                <span className={styles.toggleThumb} />
              </span>
              {activeCard.toggleChildLevelKey}
            </label>
          )}
          {kpiFilterEnabled && (
            <label className={styles.toggleLabel}>
              <span
                className={[styles.toggleSwitch, isExpanded ? styles.toggleSwitchOn : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={isExpanded}
                  onChange={(e) => setIsExpanded(e.target.checked)}
                />
                <span className={styles.toggleThumb} />
              </span>
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
                <button
                  type="button"
                  className={styles.metricsInfo}
                  onClick={() => setPopup({
                    type: 'info', title: wfData.metricsInfo?.title,
                    text: wfData.metricsInfo?.body || '',
                  })}
                >
                  {wfData.metricsInfo.label || 'Metrics Info'}
                </button>
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

        {tableData && (
          <TrendTable
            tableData={tableData}
            isExpanded={isExpanded}
            showVariance={showVariance}
            onAlert={setPopup}
            displayContext={{
              parentCode: wfData.parentCode,
              childCode: wfData.childCode,
              hierarchyNode: selection.hierarchy,
              selectedDateFilter: selection.date,
              toggleChildLevelKey: activeCard?.toggleChildLevelKey,
              showChildLevel,
              isWfmPortal: user.portal === '360FM',
            }}
          />
        )}
      </div>
      {popup && <TrendInfoDialog alert={popup} onClose={closePopup} />}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useTrendData } from '../../hooks/useTrendData';
import { TrendTable } from '../../components/trend/TrendTable';
import type { WfAlert, WfError, WfMetric, WfPageData } from '../../types/wf.types';
import { createTrendSelection, updateTrendSelection, updateMobileTrendSelection } from '../../utils/trendSelection';
import { TrendMobileFilters } from '../../components/trend/TrendMobileFilters';
import { useAuth } from '../../context/AuthContext';
import { TrendInfoDialog } from '../../components/trend/TrendInfoDialog';
import { SubscriptionDialog } from '../../components/trend/SubscriptionDialog';
import { AiInsightsSidenav } from '../../components/trend/AiInsightsSidenav';
import { FeedbackDialog } from '../../components/shared/FeedbackDialog/FeedbackDialog';
import { PreviewPageCards } from '../../components/shared/PreviewDialog/cardsPreviewContext';
import { buildAvailableViews, getSubscriptionDisplayName, getSubscriptionKey } from '../../components/trend/subscription';
import { useRegisterTrendActions } from '../../context/TrendActionsContext';
import { useOptionalFilter } from '../../context/FilterContext';
import type { PreviewCard } from '../../components/shared/RecognizeDialog/recognize';
import { sendQFDataToAnalytics } from '../../utils/analytics';
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const [previousData, setPreviousData] = useState(wfData);
  const [previousMetric, setPreviousMetric] = useState(metric);
  const [pageVersion, setPageVersion] = useState(0);
  const [desktopSelection, setDesktopSelection] = useState(() => createTrendSelection(wfData));
  const [mobileSelection, setMobileSelection] = useState(() => createTrendSelection(wfData, true));
  const selection = isMobile ? mobileSelection : desktopSelection;
  const setSelection = isMobile ? setMobileSelection : setDesktopSelection;
  const [showVariance, setShowVariance] = useState(wfData?.varianceFlag?.value ?? false);
  const [showChildLevel, setShowChildLevel] = useState(false);
  const [popup, setPopup] = useState<WfAlert | null>(null);
  const closePopup = useCallback(() => setPopup(null), []);
  const [aiFeedbackOpen, setAiFeedbackOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const dismissBanner = useCallback(() => setBannerDismissed(true), []);

  if (previousData !== wfData || previousMetric !== metric) {
    setPreviousData(wfData);
    setPreviousMetric(metric);
    setPageVersion(version => version + 1);
    setDesktopSelection(createTrendSelection(wfData));
    setMobileSelection(createTrendSelection(wfData, true));
    setShowVariance(wfData?.varianceFlag?.value ?? false);
    setPopup(null);
    setAiInsightsOpen(false);
    setAiFeedbackOpen(false);
    setSubscriptionOpen(false);
    setBannerDismissed(false);
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

  const subscriptionEnabled = !isError && !!wfData?.is_web_subscription_enabled;
  const aiInsightsEnabled = !isError && !!wfData?.config?.ai_insights_enabled;
  const openSubscription = useCallback(() => setSubscriptionOpen(true), []);
  const toggleAiInsights = useCallback(() => setAiInsightsOpen(open => !open), []);
  const trendActions = useMemo(() => ({
    banner: !isLoading && !isError && !bannerDismissed ? wfData?.banner : undefined,
    dismissBanner,
    subscriptionEnabled, openSubscription, aiInsightsEnabled,
    aiButtonText: wfData?.ai_insights?.button_text || 'AI Insights',
    aiInsightsOpen: aiInsightsEnabled && aiInsightsOpen, toggleAiInsights,
  }), [isLoading, isError, bannerDismissed, wfData?.banner, dismissBanner, subscriptionEnabled,
    openSubscription, aiInsightsEnabled, wfData?.ai_insights?.button_text, aiInsightsOpen, toggleAiInsights]);
  useRegisterTrendActions(trendActions);
  const [deepLinkHandled, setDeepLinkHandled] = useState(() => window.location.hash !== '#EmailSubscription');
  const isSubscriptionDialogOpen = subscriptionOpen || (!deepLinkHandled && !!wfData);
  const closeSubscription = useCallback(() => {
    setSubscriptionOpen(false);
    setDeepLinkHandled(true);
  }, []);
  const filter = useOptionalFilter();
  const locationCode = filter?.selectedNode?.code;
  const track = useCallback((event: string, cardName: string | undefined) => {
    if (!locationCode) return;
    void sendQFDataToAnalytics(`${metric}${event}`, cardName, locationCode)
      .catch(error => console.error('Unable to send Weekly Facts/My Plan analytics', error));
  }, [metric, locationCode]);
  const initialEvent = useRef<{ data: WfPageData; metric: WfMetric; location: string } | null>(null);
  useEffect(() => {
    if (isLoading || isError || !wfData || !filter?.isLoaded || !locationCode) return;
    if (initialEvent.current?.data === wfData && initialEvent.current.metric === metric &&
      initialEvent.current.location === locationCode) return;
    initialEvent.current = { data: wfData, metric, location: locationCode };
    // Angular's desktop initializer emits tabChanged before its mobile initializer runs.
    const first = createTrendSelection(wfData);
    if (first.contents) track('TabChanged', wfData.cards[0]?.displayName);
  }, [wfData, metric, isLoading, isError, filter?.isLoaded, locationCode, track]);
  const availableViews = useMemo(() => buildAvailableViews(wfData), [wfData]);
  const addAdditionalHierarchyNode =
    user.portal === 'SI' && filter?.treeNodes[0]?.code === 'National' && metric === 'weekly';

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
  const showHierarchy = hierarchyDropdown?.allowedViews?.includes(isMobile ? 'mobile' : selection.cardKey) === true;
  const hierarchyControl = showHierarchy && hierarchyDropdown ? (
    <label className={styles.selectLabel}>
      {!isMobile && `${hierarchyDropdown.label || 'View'}:`}
      <select
        className={styles.select}
        aria-label={hierarchyDropdown.label || 'View'}
        value={selection.hierarchy}
        onChange={event => {
          const value = event.target.value;
          const next = updateTrendSelection(wfData, selection, { type: 'hierarchy', value });
          setSelection(next);
          if (next.contents?.filterKey === value) track('HierarchyDropdownChanged', activeCard?.displayName);
        }}
      >
        {hierarchyDropdown.filterDropdown.map(option => (
          <option key={option.filterKey} value={option.filterKey}>{option.displayValue}</option>
        ))}
      </select>
    </label>
  ) : undefined;

  return (
    <AiInsightsSidenav
      open={trendActions.aiInsightsOpen}
      onClose={() => setAiInsightsOpen(false)}
      header={wfData.ai_insights?.header}
      insightsHtml={wfData.ai_insights?.insights}
      onHelpUsImprove={() => setAiFeedbackOpen(true)}
    >
      <FeedbackDialog open={aiFeedbackOpen} onClose={() => setAiFeedbackOpen(false)} header="WFAIPanel" />
      <PreviewPageCards
        pageData
        getCards={() => [
          { title: 'WeeklyFacts', cardType: activeCard?.displayName, jsId: `js-${metric}-card` } as PreviewCard,
        ]}
      />
    <div className={styles.wrapperContent}>
      <div className={`${styles.wfHome} wf-home`} id={`js-${metric}-card`}>
        {!isMobile && <div className={styles.toolbar}>
          {tabs.length > 1 && (
            <select
              className={styles.select}
              aria-label="Select tab"
              value={activeCard?.key}
              onChange={(e) => {
                const next = updateTrendSelection(wfData, selection, { type: 'view', value: e.target.value });
                setSelection(next);
                if (next.contents) track('TabChanged', tabs.find(card => card.key === next.cardKey)?.displayName);
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
                onChange={(e) => {
                  setSelection(updateTrendSelection(wfData, selection, { type: 'date', value: e.target.value }));
                  track('DateFilterChanged', `${activeCard.displayName} - ${e.target.value}`);
                }}
              >
                {activeCard.dateFilterValues?.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {hierarchyControl}
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
          {(wfData.toolkit_link || wfData.usage_dashboard_link) && (
            <div className={styles.resourceLinks}>
              {[wfData.toolkit_link, wfData.usage_dashboard_link].map((link, index) => link && (
                <a key={index} href={link.link} target="_blank" rel="noopener noreferrer">
                  {link.displayText}<span className="material-icons" aria-hidden="true">open_in_new</span>
                </a>
              ))}
            </div>
          )}
        </div>}

        {isMobile ? (
          <>
            {activeCard && (
              <TrendMobileFilters
                key={pageVersion}
                tabs={tabs.filter(card => card.hasMobileView).map(card => ({
                  key: card.key, name: card.mobileDateFilterTabName || '', dates: card.dateFilterValues || [],
                }))}
                tab={activeCard.mobileDateFilterTabName || ''}
                date={selection.date}
                onChange={(tab, date) => {
                  setSelection(updateMobileTrendSelection(wfData, selection, metric, tab, date));
                  track('MobileFilterChanged', tab);
                }}
                hierarchy={hierarchyControl}
              />
            )}
            {showVarianceToggleEnabled && (
              <button type="button" className={styles.mobileVariance}
                aria-label={`${showVarianceLabel} ${showVariance ? 'On' : 'Off'}`} aria-pressed={showVariance}
                onClick={() => setShowVariance(value => !value)}>
                <span><span className="material-icons" aria-hidden="true">trending_up</span>{showVarianceLabel}</span>
                <span>{showVariance ? 'On' : 'Off'}</span>
                <span aria-hidden="true" className={`${styles.toggleSwitch} ${showVariance ? styles.toggleSwitchOn : ''}`}>
                  <span className={styles.toggleThumb} />
                </span>
              </button>
            )}
            <div className={styles.mobileHeader}>
              <strong>{activeCard ? activeCard.mobileDisplayName ?? activeCard.displayName : 'No Mobile details available'}</strong>
              {activeCard?.mobileInfo && (
                <button type="button" className={styles.metricsInfo} aria-label="Mobile metrics info" onClick={() => setPopup({
                  type: 'info', title: 'Info',
                  text: `${activeCard.mobileInfo}<div><strong>Last updated:</strong> ${formatLastUpdated(wfData.refreshTime)}</div><hr />${wfData.metricsInfo?.body || ''}`,
                })}><span className="material-icons" aria-hidden="true">info_outlined</span></button>
              )}
              <span className={styles.mobileTime}>{selectedTab?.timePeriod}</span>
            </div>
          </>
        ) : <div className={styles.headerBlock}>
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
        </div>}

        {tableData && (
          <TrendTable
            tableData={tableData}
            isExpanded={isExpanded}
            showVariance={showVariance}
            onAlert={setPopup}
            displayContext={{
              isMobile,
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
      {subscriptionEnabled && (
        <SubscriptionDialog
          open={isSubscriptionDialogOpen}
          onClose={closeSubscription}
          subscriptionKey={getSubscriptionKey(metric)}
          displayName={getSubscriptionDisplayName(metric)}
          availableViews={availableViews}
          addAdditionalHierarchyNode={addAdditionalHierarchyNode}
        />
      )}
    </AiInsightsSidenav>
  );
}

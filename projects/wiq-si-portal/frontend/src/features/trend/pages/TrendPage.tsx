import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isHttpError } from '../../../shared/api/client';
import { useTrendData } from '../hooks/useTrendData';
import { TrendTable } from '../components/TrendTable';
import type { WfAlert, WfError, WfMetric, WfPageData } from '../types/wf.types';
import { createTrendSelection, updateTrendSelection, updateMobileTrendSelection } from '../utils/trendSelection';
import { TrendMobileFilters } from '../components/TrendMobileFilters';
import { useAuth } from '../../../shared/context/AuthContext';
import { TrendInfoDialog } from '../components/TrendInfoDialog';
import { SubscriptionDialog } from '../components/SubscriptionDialog';
import { AiInsightsSidenav } from '../components/AiInsightsSidenav';
import { FeedbackDialog } from '../../../shared/components/FeedbackDialog/FeedbackDialog';
import { PreviewPageCards } from '../../../shared/components/PreviewDialog/cardsPreviewContext';
import { buildAvailableViews, getSubscriptionDisplayName, getSubscriptionKey } from '../components/subscription';
import { useRegisterTrendActions } from '../context/TrendActionsContext';
import { useOptionalFilter } from '../../../shared/context/FilterContext';
import type { PreviewCard } from '../../../shared/components/RecognizeDialog/recognize';
import { sendQFDataToAnalytics } from '../../../shared/utils/analytics';
import { getUserDetails, type IUserDetails } from '../../../shared/api/users';
import { TrendMetricTabs } from '../components/TrendMetricTabs';
import { TrendSelect } from '../components/TrendSelect';
import styles from './TrendPage.module.scss';

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
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const isMobile = viewportWidth <= 767;
  const isCompact = viewportWidth <= 768;
  useEffect(() => {
    const resize = () => setViewportWidth(window.innerWidth);
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
  const breadcrumbs = [];
  let breadcrumbNode = filter?.selectedNode;
  while (breadcrumbNode) {
    if (!breadcrumbNode.hidden) breadcrumbs.unshift(breadcrumbNode);
    breadcrumbNode = breadcrumbNode.parent;
  }
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
  const [userDetails, setUserDetails] = useState<IUserDetails | null>(null);
  useEffect(() => {
    if (!filter?.isLoaded) return;
    let active = true;
    void getUserDetails().then(details => {
      if (active) setUserDetails(details);
    }).catch(error => console.error('Unable to load Weekly Facts/My Plan feature controls', error));
    return () => { active = false; };
  }, [filter?.isLoaded]);
  const availableMetrics: WfMetric[] = [
    ...(userDetails?.weekly_facts_enabled ? ['weekly' as const] : []),
    ...(userDetails?.my_plan_enabled ? ['myPlan' as const] : []),
  ];
  const availableViews = useMemo(() => buildAvailableViews(wfData), [wfData]);
  const portal = userDetails?.portal || user.portal;
  const addAdditionalHierarchyNode =
    portal === 'SI' && userDetails?.sqf_area_of_responsibility === 'National' && metric === 'weekly';
  const isTrendPortal = ['SI', 'METRO'].includes(portal);
  const pageTitle = isTrendPortal ? 'Trend' : availableMetrics.length === 1 && availableMetrics[0] === 'myPlan' ? 'My Plan' : 'Weekly Facts';
  const poweredBy = availableMetrics.map(value => METRIC_DISPLAY_NAMES[value]).join(' and ');
  const heading = (
    <h1 className={styles.pageTitle}>
      {pageTitle}
      {isTrendPortal && poweredBy && <><span className={styles.titleDot}>·</span><span className={styles.poweredBy}>powered by {poweredBy}</span></>}
    </h1>
  );
  const metricTabs = availableMetrics.length > 1 && (
    <div className={styles.metricTabs}>
      <TrendMetricTabs metric={metric} available={availableMetrics} />
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.loading} data-testid="trend-page-loading">
        Loading…
      </div>
    );
  }

  if (isError || !wfData) {
    const details = isHttpError<WfError>(error) ? error.response.data : undefined;
    return (
      <>
      {heading}
      <AiInsightsSidenav open={false} onClose={() => setAiInsightsOpen(false)}>
      <div className={`${styles.wrapperContent} ${styles.errorWrapper} ${metric === 'weekly' ? styles.weeklyWrapper : ''}`}>
        <div className={`${styles.wfHome} wf-home`}>
          <div className={styles.topControls}>{metricTabs}</div>
          <div className={styles.errorRow} data-testid="trend-page-error" role="alert">
            <img className={styles.errorImage} src="/assets/images/weekly-facts-no-data.svg" alt="Processing" />
            {details?.errorTitle && <div className={styles.errorTitle}>{details.errorTitle}</div>}
            <div className={styles.errorMessage}>
              {details?.errorMsg || 'Unable to load data. Please try again later.'}
              <p className={styles.errorSupport}>
                {details?.subErrorMsg}{' '}
                {details?.email && <a href={`mailto:${details.email}`}>{details.email}</a>}
              </p>
            </div>
          </div>
        </div>
      </div>
      </AiInsightsSidenav>
      </>
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
    <div className={styles.selectLabel}>
      {!isCompact && `${hierarchyDropdown.label || 'View'}:`}
      <TrendSelect
        ariaLabel={hierarchyDropdown.label || 'View'}
        value={selection.hierarchy}
        onChange={value => {
          const next = updateTrendSelection(wfData, selection, { type: 'hierarchy', value });
          setSelection(next);
          if (next.contents?.filterKey === value) track('HierarchyDropdownChanged', activeCard?.displayName);
        }}
        options={hierarchyDropdown.filterDropdown.map(option => ({ value: option.filterKey, label: option.displayValue }))}
      />
    </div>
  ) : undefined;

  return (
    <>
    {heading}
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
    <div className={`${styles.wrapperContent} ${metric === 'weekly' ? styles.weeklyWrapper : ''}`}>
      <div className={`${styles.wfHome} wf-home`} id={`js-${metric}-card`}>
        <div className={styles.topControls}>
        <div className={styles.controlGroup}>
        {metricTabs}
        {!isCompact && <div className={styles.toolbar}>
          {tabs.length > 1 && availableMetrics.length === 1 ? (
            <div className={styles.viewTabs} role="group" aria-label="Select view">
              {tabs.map(tab => <button key={tab.key} type="button" aria-pressed={tab.key === selection.cardKey}
                onClick={() => {
                  const next = updateTrendSelection(wfData, selection, { type: 'view', value: tab.key });
                  setSelection(next);
                  if (next.contents) track('TabChanged', tab.displayName);
                }}>{tab.displayName}</button>)}
            </div>
          ) : tabs.length > 1 && (
            <div className={styles.selectLabel}>
            {wfData.label && <span>{wfData.label}</span>}
            <TrendSelect
              ariaLabel="Select tab"
              value={activeCard?.key || ''}
              onChange={value => {
                const next = updateTrendSelection(wfData, selection, { type: 'view', value });
                setSelection(next);
                if (next.contents) track('TabChanged', tabs.find(card => card.key === next.cardKey)?.displayName);
              }}
              options={tabs.map(tab => ({ value: tab.key, label: tab.displayName }))}
            />
            </div>
          )}
          {activeCard?.hasHistoryData && (activeCard.dateFilterValues?.length ?? 0) > 0 && (
            <div className={styles.selectLabel}>
              {activeCard.dateFilterLabel || 'Fiscal week'}
              <TrendSelect
                ariaLabel="Select date"
                value={selection.date}
                onChange={value => {
                  setSelection(updateTrendSelection(wfData, selection, { type: 'date', value }));
                  track('DateFilterChanged', `${activeCard.displayName} - ${value}`);
                }}
                options={(activeCard.dateFilterValues || []).map(value => ({ value, label: value }))}
              />
            </div>
          )}
          {hierarchyControl}
          {!showHierarchy && <span className={styles.mobileFilterSpacer} aria-hidden="true" />}
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
        </div>}
        </div>
          {!isCompact && (
            <div className={styles.resourceLinks}>
              {[wfData.toolkit_link, wfData.usage_dashboard_link].map((link, index) => link && (
                <a key={index} href={link.link} target="_blank" rel="noopener noreferrer">
                  {link.displayText}<span className="material-icons" aria-hidden="true">open_in_new</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {isCompact ? (
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
              <div className={styles.mobileHeading}>
              <strong>{activeCard ? activeCard.mobileDisplayName ?? activeCard.displayName : 'No Mobile details available'}</strong>
              {activeCard?.mobileInfo && (
                <button type="button" className={styles.metricsInfo} aria-label="Mobile metrics info" onClick={() => setPopup({
                  type: 'info', title: 'Info',
                  text: `${activeCard.mobileInfo}<div><strong>Last updated:</strong> ${formatLastUpdated(wfData.refreshTime)}</div><hr />${wfData.metricsInfo?.body || ''}`,
                })}><span className="material-icons" aria-hidden="true">info_outlined</span></button>
              )}
              </div>
              <span className={styles.mobileTime}>{selectedTab?.timePeriod}</span>
            </div>
          </>
        ) : <div className={styles.headerBlock}>
          <div className={styles.title}>
            {metricDisplayName} - {activeCard?.displayName}
          </div>
          <div className={styles.subHeaderRow}>
            <div className={styles.breadcrumbRow}>
              <span><strong>{durationLabel}:</strong> {selectedTab?.timePeriod}</span>
              {breadcrumbs.length > 1 && <>
                <span className={styles.divider} />
                <nav aria-label="Location breadcrumbs" className={styles.breadcrumbs}>
                  {breadcrumbs.map((node, index) => <span key={node.code}>
                    {index > 0 && <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>}
                    {index === breadcrumbs.length - 1
                      ? <strong aria-current="location">{node.name}</strong>
                      : <button type="button" onClick={() => filter?.setSelectedNode(node)}>{node.name}</button>}
                  </span>)}
                </nav>
              </>}
            </div>
            <div className={styles.metadata}>
              {wfData.metricsInfo && (
                <button
                  type="button"
                  className={styles.metricsInfo}
                  onClick={() => setPopup({
                    type: 'info', title: wfData.metricsInfo?.title,
                    text: wfData.metricsInfo?.body || '',
                  })}
                >
                  <span className="material-icons" aria-hidden="true">info_outlined</span>
                  {wfData.metricsInfo.label || 'Metrics Info'}
                </button>
              )}
              {wfData.metricsInfo && <span className={styles.divider} />}
              <span className={styles.updated}><strong>Last updated:</strong>{' '}
                {wfData.refreshFiscalPeriod
                  ? `${wfData.refreshFiscalPeriod} (${formatLastUpdated(wfData.refreshTime)})`
                  : formatLastUpdated(wfData.refreshTime)}
              </span>
              {selectedTab?.infoMessage && <span className={styles.infoMessage}>
                <span className="material-icons" aria-hidden="true">info_outlined</span>{selectedTab.infoMessage}
              </span>}
            </div>
          </div>
        </div>}

        {tableData && (
          <TrendTable
            tableData={tableData}
            isExpanded={isExpanded}
            showVariance={showVariance}
            metric={metric}
            onToggleExpanded={kpiFilterEnabled ? () => setIsExpanded(expanded => !expanded) : undefined}
            onAlert={setPopup}
            displayContext={{
              isMobile,
              isCompact,
              parentCode: wfData.parentCode,
              childCode: wfData.childCode,
              hierarchyNode: selection.hierarchy,
              selectedDateFilter: selection.date,
              toggleChildLevelKey: activeCard?.toggleChildLevelKey,
              showChildLevel,
              isWfmPortal: portal === '360FM',
              isStore: filter?.selectedNode?.level === '5',
            }}
          />
        )}
      </div>
      {popup && <TrendInfoDialog alert={popup} onClose={closePopup} />}
    </div>
      {subscriptionEnabled && (
        <SubscriptionDialog
          open={isSubscriptionDialogOpen && (!filter || userDetails !== null)}
          onClose={closeSubscription}
          subscriptionKey={getSubscriptionKey(metric)}
          displayName={getSubscriptionDisplayName(metric)}
          availableViews={availableViews}
          isStoreUser={userDetails?.store_insights_role_desc === 'Store'}
          areaOfResponsibility={userDetails?.sqf_area_of_responsibility}
          addAdditionalHierarchyNode={addAdditionalHierarchyNode}
        />
      )}
    </AiInsightsSidenav>
    </>
  );
}

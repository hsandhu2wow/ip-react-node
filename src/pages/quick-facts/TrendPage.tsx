import { useCallback, useMemo, useState } from 'react';
import { useTrendData } from '../../hooks/useTrendData';
import { TrendTable } from '../../components/trend/TrendTable';
import { SubscriptionDialog } from '../../components/trend/SubscriptionDialog';
import { AiInsightsSidenav } from '../../components/trend/AiInsightsSidenav';
import { FeedbackDialog } from '../../components/shared/FeedbackDialog/FeedbackDialog';
import { PreviewPageCards } from '../../components/shared/PreviewDialog/cardsPreviewContext';
import {
  buildAvailableViews,
  getSubscriptionDisplayName,
  getSubscriptionKey,
} from '../../components/trend/subscription';
import { useRegisterTrendActions } from '../../context/TrendActionsContext';
import { useAuth } from '../../context/AuthContext';
import { useOptionalFilter } from '../../context/FilterContext';
import type { PreviewCard } from '../../components/shared/RecognizeDialog/recognize';
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
    return activeCard.cardContents.find((c) => {
      if (dateFilterKey === 'month') return c.month === filterValue;
      return c.weekNo === filterValue;
    });
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
  const [aiFeedbackOpen, setAiFeedbackOpen] = useState(false);

  const tabs = useMemo(() => wfData?.cards ?? [], [wfData]);
  const activeCard = useMemo(
    () => tabs.find((c) => c.key === (selectedTabKey || tabs[0]?.key)),
    [tabs, selectedTabKey]
  );
  const selectedTab = useMemo(() => getSelectedTab(activeCard, selectedDateFilter), [activeCard, selectedDateFilter]);
  const tableData = selectedTab?.tableData;

  // Header actions (Angular SqfFilterService flags set in setInitialDesktopData)
  const subscriptionEnabled = !!wfData?.is_web_subscription_enabled;
  const aiInsightsEnabled = !!wfData?.config?.ai_insights_enabled;
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const openSubscription = useCallback(() => setSubscriptionOpen(true), []);
  const toggleAiInsights = useCallback(() => setAiInsightsOpen((open) => !open), []);
  const trendActions = useMemo(
    () => ({
      subscriptionEnabled,
      openSubscription,
      aiInsightsEnabled,
      aiButtonText: wfData?.ai_insights?.button_text || 'AI Insights',
      aiInsightsOpen: aiInsightsEnabled && aiInsightsOpen,
      toggleAiInsights,
    }),
    [subscriptionEnabled, openSubscription, aiInsightsEnabled, wfData?.ai_insights?.button_text, aiInsightsOpen, toggleAiInsights]
  );
  useRegisterTrendActions(trendActions);

  // Angular's `#EmailSubscription` deep link opens the popup once (after the page has loaded).
  const [deepLinkHandled, setDeepLinkHandled] = useState(() => window.location.hash !== '#EmailSubscription');
  const isSubscriptionDialogOpen = subscriptionOpen || (!deepLinkHandled && !!wfData);
  const closeSubscription = useCallback(() => {
    setSubscriptionOpen(false);
    setDeepLinkHandled(true);
  }, []);

  const { user } = useAuth();
  const filter = useOptionalFilter();
  const availableViews = useMemo(() => buildAvailableViews(wfData), [wfData]);
  // Angular: portal SI + national area of responsibility + Weekly Facts. React has no user
  // details endpoint yet, so the national check uses the top of the user's location tree.
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
          // weekly-facts-home previewTriggered$ subscriber: wfData with title/cardType/jsId
          { title: 'WeeklyFacts', cardType: activeCard?.displayName, jsId: `js-${metric}-card` } as PreviewCard,
        ]}
      />
      <div className={styles.wrapperContent}>
        <div className={`${styles.wfHome} wf-home`} id={`js-${metric}-card`}>
          <div className={styles.toolbar}>
            {tabs.length > 1 && (
              <select
                className={styles.select}
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
            {activeCard?.hasHistoryData && (activeCard.dateFilterValues?.length ?? 0) > 0 && (
              <label className={styles.selectLabel}>
                {activeCard.dateFilterLabel || 'Fiscal week'}:
                <select
                  className={styles.select}
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
                  <span className={styles.metricsInfo}>{wfData.metricsInfo.label || 'Metrics Info'}</span>
                )}
                {' '}
                {wfData.refreshFiscalPeriod
                  ? `Last updated: ${wfData.refreshFiscalPeriod} (${formatLastUpdated(wfData.refreshTime)})`
                  : `Last updated: ${formatLastUpdated(wfData.refreshTime)}`}
              </span>
            </div>
            {selectedTab?.infoMessage && <div className={styles.infoMessage}>{selectedTab.infoMessage}</div>}
          </div>

          {tableData && <TrendTable tableData={tableData} isExpanded={isExpanded} showVariance={showVariance} />}
        </div>
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendPage } from './TrendPage';
import * as useTrendDataModule from '../../hooks/useTrendData';
import type { WfCardData, WfMetric, WfPageData } from '../../types/wf.types';
import { TrendActionsProvider, useTrendActions } from '../../context/TrendActionsContext';
import { CardsPreviewContext, type CardsPreviewContextValue } from '../../components/shared/PreviewDialog/cardsPreviewContext';

vi.mock('../../hooks/useTrendData');
vi.mock('../../api/trend', () => ({
  getUserSubscriptions: vi.fn(() => new Promise(() => {})),
  updateUserSubscriptions: vi.fn(),
}));

/** Stand-in for the FilterBar header buttons that consume the trend actions. */
function HeaderActions() {
  const actions = useTrendActions();
  return (
    <div>
      {actions.subscriptionEnabled && <button onClick={actions.openSubscription}>Subscription preferences</button>}
      {actions.aiInsightsEnabled && (
        <button aria-pressed={actions.aiInsightsOpen} onClick={actions.toggleAiInsights}>
          {actions.aiButtonText}
        </button>
      )}
    </div>
  );
}

function renderWithActions(metric: 'weekly' | 'myPlan' = 'weekly') {
  return render(
    <TrendActionsProvider>
      <HeaderActions />
      <TrendPage metric={metric} />
    </TrendActionsProvider>
  );
}

const baseWfData: WfPageData = {
  refreshTime: '2026-08-04T10:00:00Z',
  is_web_subscription_enabled: false,
  cards: [
    {
      key: 'sales',
      displayName: 'Sales',
      hasHistoryData: true,
      dateFilterValues: ['2026-08-04'],
      dateFilterKey: 'weekNo',
      durationLabel: 'Fiscal week',
      cardContents: {
        weekNo: '2026-08-04',
        timePeriod: 'Aug 4, 2026',
        tableData: {
          headers: [{ text: 'Group', val: '0' }],
          data: [],
        },
      },
    },
  ],
};

describe('TrendPage mobile selection', () => {
  const mobileData: WfPageData = {
    refreshTime: '2026-10-21T12:00:00',
    parentCode: 'parent',
    childCode: 'child',
    varianceFlag: { text: 'Show variance', value: true },
    cards: [
      { key: 'desktop', displayName: 'Desktop only', cardContents: { timePeriod: 'Desktop period', tableData: { headers: [], data: [] } } },
      {
        key: 'week', displayName: 'Weekly Overview', mobileDisplayName: 'Week', mobileInfo: 'Mobile explanation',
        hasMobileView: true, hasHistoryData: true, mobileDateFilterTabName: 'Week',
        dateFilterKey: 'weekNo', dateFilterValues: ['W2', 'W1'],
        cardContents: ['W2', 'W1'].map(weekNo => ({
          weekNo, timePeriod: `Period ${weekNo}`,
          tableData: {
            headers: [
              { text: 'Group', val: 'group' }, { text: 'Measure', val: 'measure' },
              { text: 'Parent result', val: 'parent' }, { text: 'Child result', val: 'child' },
              { text: 'Unrelated result', val: 'unrelated' },
            ],
            data: [[{ columnid: 1, value: weekNo, displayValue: `Result ${weekNo}` }]],
          },
        })),
      },
    ],
  };
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 767);
    vi.mocked(useTrendDataModule.useTrendData).mockReturnValue({
      data: mobileData, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendDataModule.useTrendData>);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts on a permitted mobile card and projects only relevant columns', () => {
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Week', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Result W2')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Select tab' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Child result' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Unrelated result' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Older period' }));
    expect(screen.getByText('Result W1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Older period' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Newer period' }));
    expect(screen.getByText('Result W2')).toBeInTheDocument();
  });

  it('opens mobile info with refresh metadata and toggles variance from the full row', () => {
    render(<TrendPage metric="myPlan" />);
    const variance = screen.getByRole('button', { name: 'Show variance On' });
    fireEvent.click(variance);
    expect(screen.getByRole('button', { name: 'Show variance Off' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mobile metrics info' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Mobile explanation');
    expect(screen.getByRole('dialog')).toHaveTextContent('Last updated:');
  });

  it('changes between mobile and desktop at the Angular 767/768 boundary', () => {
    vi.stubGlobal('innerWidth', 768);
    render(<TrendPage metric="weekly" />);
    expect(screen.getByRole('combobox', { name: 'Select tab' })).toBeInTheDocument();
    vi.stubGlobal('innerWidth', 767);
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('button', { name: 'Select mobile date' })).toBeInTheDocument();
    vi.stubGlobal('innerWidth', 769);
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('combobox', { name: 'Select tab' })).toBeInTheDocument();
  });

  it('does not display a desktop-only table when no mobile cards are available', () => {
    vi.mocked(useTrendDataModule.useTrendData).mockReturnValue({
      data: { ...mobileData, cards: [mobileData.cards[0]] }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendDataModule.useTrendData>);
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('No Mobile details available')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('commits My Plan Half Year cards and resets mobile history on a new response', () => {
    const plans: WfPageData = {
      ...mobileData,
      cards: [
        mobileData.cards[1],
        ...['H2', 'H1'].map(half => ({
          key: half, displayName: `Plan ${half}`, hasMobileView: true,
          mobileDateFilterTabName: 'Half Year', dateFilterKey: 'half_year',
          half_year: half, dateFilterValues: ['H2', 'H1'],
          cardContents: { timePeriod: `Fiscal ${half}`, tableData: { headers: [], data: [] } },
        })),
      ],
    };
    const query = vi.mocked(useTrendDataModule.useTrendData);
    query.mockReturnValue({ data: plans, isLoading: false, isError: false } as ReturnType<typeof useTrendDataModule.useTrendData>);
    const { rerender } = render(<TrendPage metric="myPlan" />);
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getAllByRole('tab', { name: 'Half Year' })[0]);
    fireEvent.click(screen.getByRole('option', { name: 'H1' }));
    expect(screen.getByText('Fiscal H1')).toBeInTheDocument();
    expect(screen.getByText('Plan H1', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select mobile date' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    query.mockReturnValue({ data: { ...plans }, isLoading: false, isError: false } as ReturnType<typeof useTrendDataModule.useTrendData>);
    rerender(<TrendPage metric="myPlan" />);
    expect(screen.getByText('Result W2')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Choose period' })).not.toBeInTheDocument();
  });

  it('uses the mobile hierarchy flag and combines its selection with the current date', () => {
    const week = mobileData.cards[1];
    const contents = Array.isArray(week.cardContents) ? week.cardContents : [];
    const query = vi.mocked(useTrendDataModule.useTrendData);
    query.mockReturnValue({
      data: {
        ...mobileData,
        hierarchyDropdown: {
          allowedViews: ['mobile', 'week'], label: 'View',
          filterDropdown: [{ displayValue: 'Stores', filterKey: 'stores' }, { displayValue: 'Groups', filterKey: 'groups' }],
        },
        cards: [{
          ...week,
          cardContents: contents.flatMap(content => ['stores', 'groups'].map(filterKey => ({
            ...content, filterKey, timePeriod: `${content.weekNo} ${filterKey}`,
          }))),
        }],
      }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendDataModule.useTrendData>);
    render(<TrendPage metric="weekly" />);
    expect(screen.queryByRole('button', { name: 'Older period' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'View' }), { target: { value: 'groups' } });
    expect(screen.getByText('W2 groups')).toBeInTheDocument();
  });
});

describe('TrendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByTestId('trend-page-loading')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByTestId('trend-page-error')).toBeInTheDocument();
  });

  it.each([404, 500])('shows the Weekly/MyPlan %s error payload and removes stale content', (status) => {
    const query = useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>;
    query.mockReturnValue({ data: baseWfData, isLoading: false, isError: false });
    const { rerender } = render(<TrendPage metric="weekly" />);
    query.mockReturnValue({
      data: baseWfData, isLoading: false, isError: true,
      error: {
        isAxiosError: true,
        response: {
          status,
          data: {
            errorTitle: 'Refresh failed',
            errorMsg: 'Fixture data is not available',
            subErrorMsg: 'Please contact support',
            email: 'fixture-support@example.invalid',
          },
        },
      },
    });
    rerender(<TrendPage metric="weekly" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Refresh failed');
    expect(screen.getByText('Fixture data is not available')).toBeInTheDocument();
    expect(screen.getByText(/Please contact support/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'fixture-support@example.invalid' }))
      .toHaveAttribute('href', 'mailto:fixture-support@example.invalid');
    expect(screen.queryByText('Weekly Facts - Sales')).not.toBeInTheDocument();
  });

  it('renders the title as "Weekly Facts - <card displayName>" for the weekly metric', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Weekly Facts - Sales')).toBeInTheDocument();
  });

  it('renders the title as "My Plan - <card displayName>" for the myPlan metric', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="myPlan" />);
    expect(screen.getByText('My Plan - Sales')).toBeInTheDocument();
  });

  it('renders duration label and time period', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Fiscal week: Aug 4, 2026')).toBeInTheDocument();
  });

  it('renders last updated with formatted refreshTime', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('does not expose subscription when is_web_subscription_enabled is false', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    renderWithActions();
    expect(screen.queryByText(/Subscription preferences/)).not.toBeInTheDocument();
  });

  it('opens the subscription dialog through the trend actions when enabled', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { ...baseWfData, is_web_subscription_enabled: true },
      isLoading: false,
      isError: false,
    });
    renderWithActions('myPlan');
    expect(screen.queryByText('My Plan subscription preferences')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Subscription preferences' }));
    expect(screen.getByText('My Plan subscription preferences')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('My Plan subscription preferences')).not.toBeInTheDocument();
  });

  it('toggles the AI Insights panel with ai_insights content when enabled', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        ...baseWfData,
        config: { ai_insights_enabled: true },
        ai_insights: { button_text: 'Smart Insights', insights: '<p>Sales are up</p>' },
      },
      isLoading: false,
      isError: false,
    });
    renderWithActions();
    const button = screen.getByRole('button', { name: 'Smart Insights' });
    expect(screen.queryByTestId('ai-insights-sidenav')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('ai-insights-sidenav')).toHaveTextContent('AI Insights');
    expect(screen.getByText('Sales are up')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByTestId('ai-insights-sidenav')).not.toBeInTheDocument();
  });

  it('does not expose AI Insights when config.ai_insights_enabled is off', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { ...baseWfData, ai_insights: { insights: '<p>x</p>' } },
      isLoading: false,
      isError: false,
    });
    renderWithActions();
    expect(screen.queryByRole('button', { name: 'AI Insights' })).not.toBeInTheDocument();
  });

  it('keeps the enabled AI drawer available without content and resets on response/metric transitions', () => {
    const query = vi.mocked(useTrendDataModule.useTrendData);
    const data: WfPageData = { ...baseWfData, config: { ai_insights_enabled: true } };
    query.mockReturnValue({ data, isLoading: false, isError: false } as ReturnType<typeof query>);
    const { rerender } = renderWithActions();
    fireEvent.click(screen.getByRole('button', { name: 'AI Insights' }));
    expect(screen.getByTestId('ai-insights-sidenav')).toHaveTextContent('Beta');
    fireEvent.click(screen.getByRole('button', { name: 'Close AI Insights' }));
    expect(screen.getByRole('button', { name: 'AI Insights' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'AI Insights' }));
    query.mockReturnValue({ data: { ...data }, isLoading: false, isError: false } as ReturnType<typeof query>);
    const page = (metric: WfMetric) => (
      <TrendActionsProvider><HeaderActions /><TrendPage metric={metric} /></TrendActionsProvider>
    );
    rerender(page('weekly'));
    expect(screen.queryByTestId('ai-insights-sidenav')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'AI Insights' }));
    rerender(page('myPlan'));
    expect(screen.queryByTestId('ai-insights-sidenav')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI Insights' })).toHaveAttribute('aria-pressed', 'false');
  });

  it.each<WfMetric>(['weekly', 'myPlan'])('registers the selected %s view for whole-page preview', (metric) => {
    vi.mocked(useTrendDataModule.useTrendData).mockReturnValue({
      data: {
        ...baseWfData,
        cards: [
          baseWfData.cards[0],
          { ...baseWfData.cards[0], key: 'inventory', displayName: 'Inventory' },
        ],
      },
      isLoading: false, isError: false,
    } as ReturnType<typeof useTrendDataModule.useTrendData>);
    const registerPageCards = vi.fn<CardsPreviewContextValue['registerPageCards']>(() => () => {});
    const { container } = render(
      <CardsPreviewContext.Provider value={{ preview: () => Promise.resolve(), registerPageCards }}>
        <TrendPage metric={metric} />
      </CardsPreviewContext.Provider>,
    );
    expect(registerPageCards).toHaveBeenCalledWith(expect.any(Function), { pageData: true });
    const getCards = registerPageCards.mock.calls[0][0];
    expect(getCards()).toEqual([{ title: 'WeeklyFacts', cardType: 'Sales', jsId: `js-${metric}-card` }]);
    expect(container.querySelector(`#js-${metric}-card`)).toHaveTextContent(`${metric === 'weekly' ? 'Weekly Facts' : 'My Plan'} - Sales`);
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'inventory' } });
    expect(getCards()).toEqual([{ title: 'WeeklyFacts', cardType: 'Inventory', jsId: `js-${metric}-card` }]);
    expect(container.querySelector(`#js-${metric}-card`)).toHaveTextContent('Inventory');
  });

  it('removes stale header actions and closes AI Insights when a response fails', () => {
    const query = vi.mocked(useTrendDataModule.useTrendData);
    const data = {
      ...baseWfData, is_web_subscription_enabled: true,
      config: { ai_insights_enabled: true },
      ai_insights: { button_text: 'Smart Insights', insights: '<p>Sales are up</p>' },
    };
    query.mockReturnValue({ data, isLoading: false, isError: false } as ReturnType<typeof query>);
    const { rerender } = renderWithActions();
    fireEvent.click(screen.getByRole('button', { name: 'Smart Insights' }));
    expect(screen.getByTestId('ai-insights-sidenav')).toBeInTheDocument();
    query.mockReturnValue({ data, isLoading: false, isError: true } as ReturnType<typeof query>);
    rerender(
      <TrendActionsProvider>
        <HeaderActions />
        <TrendPage metric="weekly" />
      </TrendActionsProvider>,
    );
    expect(screen.getByTestId('trend-page-error')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subscription preferences' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Smart Insights' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-insights-sidenav')).not.toBeInTheDocument();
  });

  it('switches tabs when a different tab is selected', () => {
    const multiTabData = {
      ...baseWfData,
      cards: [
        baseWfData.cards[0],
        {
          key: 'inventory',
          displayName: 'Inventory',
          hasHistoryData: true,
          dateFilterValues: ['2026-08-04'],
          dateFilterKey: 'weekNo',
          durationLabel: 'Fiscal week',
          cardContents: {
            weekNo: '2026-08-04',
            timePeriod: 'Aug 4, 2026',
            tableData: { headers: [{ text: 'Group', val: '0' }], data: [] },
          },
        },
      ],
    };
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: multiTabData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Weekly Facts - Sales')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'inventory' } });
    expect(screen.getByText('Weekly Facts - Inventory')).toBeInTheDocument();
  });

  it('resolves the correct cardContents entry from an array when a date filter is selected', () => {
    const multiDateData = {
      ...baseWfData,
      cards: [
        {
          ...baseWfData.cards[0],
          dateFilterValues: ['2026-08-04', '2026-07-28'],
          cardContents: [
            {
              weekNo: '2026-08-04',
              timePeriod: 'Aug 4, 2026',
              tableData: { headers: [{ text: 'Group', val: '0' }], data: [] },
            },
            {
              weekNo: '2026-07-28',
              timePeriod: 'Jul 28, 2026',
              tableData: { headers: [{ text: 'Group', val: '0' }], data: [] },
            },
          ],
        },
      ],
    };
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: multiDateData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Fiscal week: Aug 4, 2026')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Select date'), { target: { value: '2026-07-28' } });
    expect(screen.getByText('Fiscal week: Jul 28, 2026')).toBeInTheDocument();
  });

  it.each(['monthNo', 'halfNo'])('selects Weekly history using the backend %s key', (dateFilterKey) => {
    const card: WfCardData = {
      ...baseWfData.cards[0],
      dateFilterKey,
      dateFilterValues: ['Latest', 'Previous'],
      cardContents: ['Latest', 'Previous'].map(value => ({
        [dateFilterKey]: value,
        timePeriod: `${value} period`,
        tableData: { headers: [], data: [] },
      })),
    };
    vi.mocked(useTrendDataModule.useTrendData).mockReturnValue({
      data: { ...baseWfData, cards: [card] },
      isLoading: false, isError: false,
    } as ReturnType<typeof useTrendDataModule.useTrendData>);
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Fiscal week: Latest period')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Select date'), { target: { value: 'Previous' } });
    expect(screen.getByText('Fiscal week: Previous period')).toBeInTheDocument();
  });

  it.each<WfMetric>(['weekly', 'myPlan'])('applies %s variance and KPI defaults and resets them for a new response', (metric) => {
    const page: WfPageData = {
      ...baseWfData,
      varianceFlag: { text: 'Show variance', value: true },
      cards: [{
        ...baseWfData.cards[0],
        cardContents: {
          tableData: {
            headers: ['Group', 'Metric', 'Value'],
            kpiFilterEnabled: true,
            data: [
              [
                { columnid: 0, displayValue: 'Group', value: '', rowSpan: 2 },
                { columnid: 1, displayValue: 'KPI metric', value: '', tags: 'KPI' },
                { columnid: 2, displayValue: '10', value: 10 },
              ],
              [
                { columnid: 0, displayValue: 'Group', value: '', rowSpan: 0 },
                { columnid: 1, displayValue: 'Other metric', value: '' },
                { columnid: 2, displayValue: '20', value: 20 },
              ],
            ],
          },
        },
      }],
    };
    const mockQuery = (data: WfPageData) => {
      (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
        data, isLoading: false, isError: false,
      });
    };
    mockQuery(page);
    const { rerender } = render(<TrendPage metric={metric} />);
    expect(screen.getByRole('checkbox', { name: 'Show variance' })).toBeChecked();
    expect(screen.queryByText('Other metric')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show variance' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show all rows' }));
    expect(screen.getByText('Other metric')).toBeInTheDocument();
    mockQuery({ ...page });
    rerender(<TrendPage metric={metric} />);
    expect(screen.getByRole('checkbox', { name: 'Show variance' })).toBeChecked();
    expect(screen.queryByText('Other metric')).not.toBeInTheDocument();
  });

  it('clears a previous view and date when a different location response arrives', () => {
    const first: WfPageData = {
      ...baseWfData,
      cards: [
        baseWfData.cards[0],
        {
          key: 'old-view', displayName: 'Old view', hasHistoryData: true,
          dateFilterValues: ['Old latest', 'Old previous'],
          cardContents: ['Old latest', 'Old previous'].map(weekNo => ({
            weekNo, timePeriod: weekNo, tableData: { headers: [], data: [] },
          })),
        },
      ],
    };
    const query = vi.mocked(useTrendDataModule.useTrendData);
    query.mockReturnValue({ data: first, isLoading: false, isError: false } as ReturnType<typeof query>);
    const { rerender } = render(<TrendPage metric="weekly" />);
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'old-view' } });
    fireEvent.change(screen.getByLabelText('Select date'), { target: { value: 'Old previous' } });
    const next: WfPageData = {
      ...baseWfData,
      cards: [{
        key: 'new-view', displayName: 'New view', hasHistoryData: true,
        dateFilterValues: ['New latest'],
        cardContents: [{
          weekNo: 'New latest', timePeriod: 'New location period',
          tableData: { headers: [], data: [] },
        }],
      }],
    };
    query.mockReturnValue({ data: next, isLoading: false, isError: false } as ReturnType<typeof query>);
    rerender(<TrendPage metric="weekly" />);
    expect(screen.getByText('Weekly Facts - New view')).toBeInTheDocument();
    expect(screen.getByLabelText('Select date')).toHaveValue('New latest');
    expect(screen.getByText('Time period: New location period')).toBeInTheDocument();
  });

  it('uses the newly selected table expansion default while retaining the page variance choice', () => {
    const tableData = {
      headers: ['Group', 'Metric', 'Value'],
      kpiFilterEnabled: true,
      data: [[
        { columnid: 0, displayValue: 'Group', value: '', rowSpan: 1 },
        { columnid: 1, displayValue: 'Detail measure', value: '' },
        { columnid: 2, displayValue: '42', value: 42 },
      ]],
    };
    const page: WfPageData = {
      ...baseWfData,
      varianceFlag: { text: 'Show variance', value: true },
      cards: [
        {
          key: 'expanded', displayName: 'Expanded',
          cardContents: { tableData: { ...tableData, defaultExpanded: true } },
        },
        {
          key: 'collapsed', displayName: 'Collapsed',
          cardContents: { tableData: { ...tableData, defaultExpanded: false } },
        },
      ],
    };
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: page, isLoading: false, isError: false,
    });
    render(<TrendPage metric="myPlan" />);
    expect(screen.getByText('Detail measure')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show variance' }));
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'collapsed' } });
    expect(screen.queryByText('Detail measure')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Show variance' })).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'expanded' } });
    expect(screen.getByText('Detail measure')).toBeInTheDocument();
  });

  it.each<WfMetric>(['weekly', 'myPlan'])('renders and changes permitted hierarchy data for %s', (metric) => {
    const data: WfPageData = {
      ...baseWfData,
      hierarchyDropdown: {
        label: 'Breakdown view', allowedViews: ['trend'],
        filterDropdown: [
          { displayValue: 'Stores', filterKey: 'stores' },
          { displayValue: 'Groups', filterKey: 'groups' },
        ],
      },
      cards: [{
        key: 'trend', displayName: 'Trend',
        cardContents: ['stores', 'groups'].map(filterKey => ({
          filterKey, timePeriod: `${filterKey} period`,
          tableData: { headers: [], data: [] },
        })),
      }, baseWfData.cards[0]],
    };
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data, isLoading: false, isError: false,
    });
    const { rerender } = render(<TrendPage metric={metric} />);
    expect(screen.getByLabelText('Breakdown view')).toHaveValue('stores');
    expect(screen.getByText('Time period: stores period')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Breakdown view'), { target: { value: 'groups' } });
    expect(screen.getByText('Time period: groups period')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'sales' } });
    expect(screen.queryByLabelText('Breakdown view')).not.toBeInTheDocument();
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { ...data }, isLoading: false, isError: false,
    });
    rerender(<TrendPage metric={metric} />);
    expect(screen.getByLabelText('Breakdown view')).toHaveValue('stores');
  });

  it('switches desktop peer/child columns only when the active card offers the switch', () => {
    const page: WfPageData = {
      ...baseWfData,
      cards: [{
        key: 'trend', displayName: 'Trend', toggleChildLevelKey: 'Show stores',
        cardContents: {
          tableData: {
            headers: [
              { text: 'Group', val: 'group' }, { text: 'Metric', val: 'metric' },
              { text: 'Peer column', val: 'peer', colType: 'peerNode' },
              { text: 'Child column', val: 'child', colType: 'childNode' },
            ],
            data: [[
              { columnid: 0, displayValue: 'Group A', value: '', rowSpan: 1 },
              { columnid: 1, displayValue: 'Sales', value: '' },
              { columnid: 2, displayValue: 'Peer value', value: '' },
              { columnid: 3, displayValue: 'Child value', value: '' },
            ]],
          },
        },
      }, { ...baseWfData.cards[0] }],
    };
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: page, isLoading: false, isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Peer value')).toBeInTheDocument();
    expect(screen.queryByText('Child value')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show stores' }));
    expect(screen.getByText('Child value')).toBeInTheDocument();
    expect(screen.queryByText('Peer value')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Select tab'), { target: { value: 'sales' } });
    expect(screen.queryByRole('checkbox', { name: 'Show stores' })).not.toBeInTheDocument();
  });

  it('opens Weekly metrics and cell/header alerts in the source-specific popup', () => {
    const data: WfPageData = {
      ...baseWfData,
      metricsInfo: { title: 'Metrics explanation', body: '<strong>Fixture explanation</strong>' },
      cards: [{
        key: 'alert-view', displayName: 'Alert view',
        cardContents: {
          tableData: {
            headers: [{ text: 'Value', val: 'value', alert: { type: 'warning', title: 'Header notice', text: 'Header body' } }],
            data: [[{
              columnid: 0, rowSpan: 1, value: 1, displayValue: 'One',
              alert: { type: 'error', title: 'Cell notice', text: 'Cell body' },
            }]],
          },
        },
      }],
    };
    const query = useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>;
    query.mockReturnValue({ data, isLoading: false, isError: false });
    const { rerender } = render(<TrendPage metric="weekly" />);
    fireEvent.click(screen.getByRole('button', { name: 'Metrics Info' }));
    expect(screen.getByRole('dialog', { name: 'Metrics explanation' })).toHaveTextContent('Fixture explanation');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Header notice' }));
    expect(screen.getByRole('dialog', { name: 'Header notice' })).toHaveTextContent('Header body');
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cell notice' }));
    expect(screen.getByRole('dialog', { name: 'Cell notice' })).toHaveTextContent('Cell body');
    query.mockReturnValue({ data: { ...data }, isLoading: false, isError: false });
    rerender(<TrendPage metric="weekly" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

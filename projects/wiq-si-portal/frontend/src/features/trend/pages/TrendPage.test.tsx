import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendPage } from './TrendPage';
import * as useTrendDataModule from '../hooks/useTrendData';
import type { WfCardData, WfMetric, WfPageData } from '../types/wf.types';
import { TrendActionsProvider, useTrendActions } from '../context/TrendActionsContext';
import { CardsPreviewContext, type CardsPreviewContextValue } from '../../../shared/components/PreviewDialog/cardsPreviewContext';
import { HttpError } from '../../../shared/api/client';
import { StellaProvider, useStella } from '../../../shared/context/StellaContext';
import { PageLoadedProvider, usePageLoaded } from '../../../shared/context/PageLoadedContext';

vi.mock('../hooks/useTrendData');
vi.mock('../api/trend', () => ({
  getUserSubscriptions: vi.fn(() => new Promise(() => {})),
  updateUserSubscriptions: vi.fn(),
}));

/** Stand-in for the FilterBar header buttons that consume the trend actions. */
function HeaderActions() {
  const actions = useTrendActions();
  return (
    <div>
      {actions.subscriptionEnabled && <button onClick={actions.openSubscription}>Subscription preferences</button>}
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

function choose(name: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name }));
  fireEvent.click(screen.getByRole('option', { name: option }));
}

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

  it('keeps desktop table projection at 768px while source CSS shows mobile controls', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.mocked(useTrendDataModule.useTrendData).mockReturnValue({
      data: { ...mobileData, cards: [mobileData.cards[1], mobileData.cards[0]] }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendDataModule.useTrendData>);
    render(<TrendPage metric="weekly" />);
    expect(screen.getByRole('button', { name: 'Select mobile date' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Select tab' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Unrelated result' })).toBeInTheDocument();
    vi.stubGlobal('innerWidth', 767);
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('button', { name: 'Select mobile date' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Unrelated result' })).not.toBeInTheDocument();
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
    choose('View', 'Groups');
    expect(screen.getByText('W2 groups')).toBeInTheDocument();
  });
});

describe('TrendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the page title and a 64px spinner while fetching (Angular mat-spinner.spinnerStyle)', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trend');
    const loading = screen.getByTestId('trend-page-loading');
    expect(loading.className).toContain('loadingWrapper');
    expect(loading.className).toContain('weeklyWrapper');
    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(loading).toContainElement(spinner);
    expect(spinner).toHaveStyle({ width: '64px', height: '64px' });
    expect(loading).not.toHaveTextContent('Loading…');
  });

  it.each([
    ['is loading', { data: undefined, isLoading: true, isError: false }, 'false'],
    ['failed', { data: undefined, isLoading: false, isError: true }, 'false'],
    ['loaded', { data: baseWfData, isLoading: false, isError: false }, 'true'],
  ])('sets the alert-list page-loaded signal when data %s (Angular notifyPageLoaded)', (_state, result, expected) => {
    vi.mocked(useTrendDataModule.useTrendData).mockReturnValue(result as ReturnType<typeof useTrendDataModule.useTrendData>);
    function Probe() { return <span data-testid="page-loaded">{String(usePageLoaded())}</span>; }
    render(<PageLoadedProvider><TrendPage metric="weekly" /><Probe /></PageLoadedProvider>);
    expect(screen.getByTestId('page-loaded')).toHaveTextContent(expected);
  });

  describe('Stella panel (Angular app-ai-insights-panel wraps weekly-facts-home)', () => {
    function StellaToggle() {
      const { open, toggle } = useStella();
      return <button aria-pressed={open} onClick={toggle}>Stella</button>;
    }
    const page = (metric: WfMetric) => (
      <StellaProvider enabled><StellaToggle /><TrendPage metric={metric} /></StellaProvider>
    );
    const query = () => vi.mocked(useTrendDataModule.useTrendData);

    it.each([
      ['loading', { data: undefined, isLoading: true, isError: false }, 'trend-page-loading'],
      ['error', { data: undefined, isLoading: false, isError: true }, 'trend-page-error'],
      ['loaded', { data: baseWfData, isLoading: false, isError: false }, 'js-weekly-card'],
    ])('wraps the %s content below the title', (_state, result, contentId) => {
      query().mockReturnValue(result as ReturnType<typeof useTrendDataModule.useTrendData>);
      const { container } = render(page('weekly'));
      const panel = screen.getByTestId('stella-panel');
      const content = screen.queryByTestId(contentId) ?? container.querySelector(`#${contentId}`);
      expect(panel.parentElement).toContainElement(content as HTMLElement);
      expect(panel.parentElement).not.toContainElement(screen.getByRole('heading', { level: 1 }));
    });

    it('closes Stella when switching between Weekly Facts and My Plan (Angular recreates the page)', () => {
      query().mockReturnValue({ data: baseWfData, isLoading: false, isError: false } as ReturnType<typeof useTrendDataModule.useTrendData>);
      const { rerender } = render(page('weekly'));
      fireEvent.click(screen.getByRole('button', { name: 'Stella' }));
      expect(screen.getByRole('button', { name: 'Stella' })).toHaveAttribute('aria-pressed', 'true');
      rerender(page('weekly'));
      expect(screen.getByRole('button', { name: 'Stella' })).toHaveAttribute('aria-pressed', 'true');
      rerender(page('myPlan'));
      expect(screen.getByRole('button', { name: 'Stella' })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('shows error state on fetch failure', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByTestId('trend-page-error')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Processing' }))
      .toHaveAttribute('src', '/assets/images/weekly-facts-no-data.svg');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trend');
    expect(screen.getByTestId('trend-page-error').closest('.wf-home')).not.toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load data. Please try again later.');
  });

  it.each([404, 500])('shows the Weekly/MyPlan %s error payload and removes stale content', (status) => {
    const query = useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>;
    query.mockReturnValue({ data: baseWfData, isLoading: false, isError: false });
    const { rerender } = render(<TrendPage metric="weekly" />);
    query.mockReturnValue({
      data: baseWfData, isLoading: false, isError: true,
      error: new HttpError({
          status, data: {
            errorTitle: 'Refresh failed',
            errorMsg: 'Fixture data is not available',
            subErrorMsg: 'Please contact support',
            email: 'fixture-support@example.invalid',
          },
      }, '/wf/fixture'),
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
    expect(screen.getByText('Fiscal week:').parentElement).toHaveTextContent('Fiscal week: Aug 4, 2026');
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
    choose('Select tab', 'Inventory');
    expect(getCards()).toEqual([{ title: 'WeeklyFacts', cardType: 'Inventory', jsId: `js-${metric}-card` }]);
    expect(container.querySelector(`#js-${metric}-card`)).toHaveTextContent('Inventory');
  });

  it('removes stale header actions when a response fails', () => {
    const query = vi.mocked(useTrendDataModule.useTrendData);
    const data = { ...baseWfData, is_web_subscription_enabled: true };
    query.mockReturnValue({ data, isLoading: false, isError: false } as ReturnType<typeof query>);
    const { rerender } = renderWithActions();
    expect(screen.getByRole('button', { name: 'Subscription preferences' })).toBeInTheDocument();
    query.mockReturnValue({ data, isLoading: false, isError: true } as ReturnType<typeof query>);
    rerender(
      <TrendActionsProvider>
        <HeaderActions />
        <TrendPage metric="weekly" />
      </TrendActionsProvider>,
    );
    expect(screen.getByTestId('trend-page-error')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subscription preferences' })).not.toBeInTheDocument();
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
    choose('Select tab', 'Inventory');
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
    expect(screen.getByText('Fiscal week:').parentElement).toHaveTextContent('Fiscal week: Aug 4, 2026');
    choose('Select date', '2026-07-28');
    expect(screen.getByText('Fiscal week:').parentElement).toHaveTextContent('Fiscal week: Jul 28, 2026');
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
    expect(screen.getByText('Fiscal week:').parentElement).toHaveTextContent('Fiscal week: Latest period');
    choose('Select date', 'Previous');
    expect(screen.getByText('Fiscal week:').parentElement).toHaveTextContent('Fiscal week: Previous period');
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
    fireEvent.click(screen.getByRole('button', { name: 'Expand all measures' }));
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
    choose('Select tab', 'Old view');
    choose('Select date', 'Old previous');
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
    expect(screen.getByRole('combobox', { name: 'Select date' })).toHaveTextContent('New latest');
    expect(screen.getByText('Time period:').parentElement).toHaveTextContent('Time period: New location period');
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
    choose('Select tab', 'Collapsed');
    expect(screen.queryByText('Detail measure')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Show variance' })).not.toBeChecked();
    choose('Select tab', 'Expanded');
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
    expect(screen.getByRole('combobox', { name: 'Breakdown view' })).toHaveTextContent('Stores');
    expect(screen.getByText('Time period:').parentElement).toHaveTextContent('Time period: stores period');
    choose('Breakdown view', 'Groups');
    expect(screen.getByText('Time period:').parentElement).toHaveTextContent('Time period: groups period');
    choose('Select tab', 'Sales');
    expect(screen.queryByLabelText('Breakdown view')).not.toBeInTheDocument();
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { ...data }, isLoading: false, isError: false,
    });
    rerender(<TrendPage metric={metric} />);
    expect(screen.getByRole('combobox', { name: 'Breakdown view' })).toHaveTextContent('Stores');
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
    choose('Select tab', 'Sales');
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

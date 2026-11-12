import { StrictMode, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TrendPage } from './TrendPage';
import { FilterProvider, useFilter } from '../../../shared/context/FilterContext';
import { TrendActionsProvider, useTrendActions } from '../context/TrendActionsContext';
import { useTrendData } from '../hooks/useTrendData';
import { getUserDetails } from '../../../shared/api/users';
import { getUserSubscriptions, updateUserSubscriptions } from '../api/trend';
import type { WfMetric, WfPageData } from '../types/wf.types';

vi.mock('../hooks/useTrendData');
vi.mock('../api/trend', () => ({
  getUserSubscriptions: vi.fn(),
  updateUserSubscriptions: vi.fn(),
}));
vi.mock('../../../shared/api/users', () => ({
  getUserDetails: vi.fn(async () => ({ employee_number: 'fixture-employee', Store_Insights_Role: 'fixture-role' })),
}));

const tableData = { headers: ['Group', 'Measure'], data: [] };
const data: WfPageData = {
  refreshTime: '2026-10-21T12:00:00',
  toolkit_link: { displayText: 'Planning toolkit', link: 'https://example.invalid/toolkit' },
  usage_dashboard_link: { displayText: 'Usage dashboard', link: 'https://example.invalid/usage' },
  cards: [
    {
      key: 'week', displayName: 'Weekly Overview', hasHistoryData: true,
      hasMobileView: true, mobileDateFilterTabName: 'Week',
      dateFilterValues: ['W2', 'W1'], dateFilterKey: 'weekNo',
      cardContents: ['W2', 'W1'].flatMap(weekNo => ['stores', 'groups'].map(filterKey => ({
        weekNo, filterKey, tableData, timePeriod: `${weekNo} ${filterKey}`,
      }))),
    },
    {
      key: 'month', displayName: 'Monthly Overview', hasHistoryData: true,
      hasMobileView: true, mobileDateFilterTabName: 'Month',
      dateFilterValues: ['M2', 'M1'], dateFilterKey: 'monthNo',
      cardContents: ['M2', 'M1'].map(monthNo => ({ monthNo, tableData })),
    },
  ],
  hierarchyDropdown: {
    label: 'View', allowedViews: ['week', 'mobile'],
    filterDropdown: [{ filterKey: 'stores', displayValue: 'Stores' }, { filterKey: 'groups', displayValue: 'Groups' }],
  },
};

function InitialiseFilter() {
  const { isLoaded, initTree } = useFilter();
  useEffect(() => {
    if (!isLoaded) initTree([{
      code: 'fixture-national', name: 'Synthetic National', level: 0, level_desc: 'National', children: [],
    }]);
  }, [isLoaded, initTree]);
  return null;
}

function SubscriptionAction() {
  const actions = useTrendActions();
  return actions.subscriptionEnabled && <button onClick={actions.openSubscription}>Subscription preferences</button>;
}

function TestPage({ metric = 'weekly', storeTree = false }: { metric?: WfMetric; storeTree?: boolean }) {
  return (
    <MemoryRouter>
      <FilterProvider>
        <TrendActionsProvider>
          {storeTree ? <InitialiseStoreFilter /> : <InitialiseFilter />}
          <SubscriptionAction />
          <TrendPage metric={metric} />
        </TrendActionsProvider>
      </FilterProvider>
    </MemoryRouter>
  );
}

function InitialiseStoreFilter() {
  const { initTree } = useFilter();
  useEffect(() => initTree([{
    code: 'National', name: 'Synthetic National', level: 0, level_desc: 'National',
    children: [{ code: 'fixture-store', name: 'Synthetic Store', level: 5, level_desc: 'Store', children: [] }],
  }]), [initTree]);
  return null;
}

function CurrentLocation() {
  const { pathname, search } = useLocation();
  return <output data-testid="route">{pathname}{search}</output>;
}

function choose(name: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name }));
  fireEvent.click(screen.getByRole('option', { name: option }));
}

function InitialiseHierarchy() {
  const { initTree } = useFilter();
  useEffect(() => initTree([{
    code: 'fixture-national', name: 'Synthetic National', level: 1, level_desc: 'National',
    children: [{ code: 'fixture-state', name: 'Synthetic State', level: 2, level_desc: 'State', children: [] }],
  }]), [initTree]);
  return null;
}

describe('Angular metric and view controls', () => {
  it.each<WfMetric>(['weekly', 'myPlan'])('keeps the enabled metric navigation on a failed %s page', async metric => {
    vi.mocked(getUserDetails).mockResolvedValue({
      weekly_facts_enabled: true, my_plan_enabled: true, portal: 'SI',
    });
    vi.mocked(useTrendData).mockReturnValue({
      data, isLoading: false, isError: true, error: new Error('Offline'),
    } as ReturnType<typeof useTrendData>);
    render(
      <MemoryRouter initialEntries={[`/quick-facts/${metric === 'weekly' ? 'weekly' : 'myplan'}?code=fixture-national&period=YDAY`]}>
        <FilterProvider><InitialiseFilter /><TrendPage metric={metric} /><CurrentLocation /></FilterProvider>
      </MemoryRouter>,
    );
    const target = metric === 'weekly' ? 'My Plan' : 'Weekly Facts';
    const targetPath = metric === 'weekly' ? 'myplan' : 'weekly';
    fireEvent.click(await screen.findByRole('link', { name: target }));
    expect(screen.getByTestId('route')).toHaveTextContent(`/quick-facts/${targetPath}?code=fixture-national&period=YDAY`);
    expect(screen.getByRole('alert')).toContainElement(screen.getByRole('img', { name: 'Processing' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Select tab' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Planning toolkit' })).not.toBeInTheDocument();
  });

  it('opens the source view listbox and commits its selection without a native select popup', () => {
    render(<TestPage />);
    const trigger = screen.getByRole('combobox', { name: 'Select tab' });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox', { name: 'Select tab' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Monthly Overview' }));
    expect(trigger).toHaveTextContent('Monthly Overview');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByText('Weekly Facts - Monthly Overview')).toBeInTheDocument();
  });

  it('places the child-level switch before variance, matching source keyboard and visual order', () => {
    vi.mocked(useTrendData).mockReturnValue({
      data: { ...data, varianceFlag: { text: 'Show variance', value: false },
        cards: [{ ...data.cards[0], toggleChildLevelKey: 'Child level' }] },
      isLoading: false, isError: false,
    } as ReturnType<typeof useTrendData>);
    render(<TestPage />);
    const switches = screen.getAllByRole('checkbox');
    expect(switches[0]).toBe(screen.getByRole('checkbox', { name: 'Child level' }));
    expect(switches[1]).toBe(screen.getByRole('checkbox', { name: 'Show variance' }));
  });

  it('uses the fetched portal for table layout instead of the demo authentication portal', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      portal: '360FM', weekly_facts_enabled: true, my_plan_enabled: true,
    });
    render(<TestPage />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Weekly Facts' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveClass('wf-table-wfm');
  });

  it('navigates through location breadcrumbs without losing date and period parameters', () => {
    render(
      <MemoryRouter initialEntries={['/quick-facts/weekly?code=fixture-state&date=2026-10-25&period=YDAY']}>
        <FilterProvider><InitialiseHierarchy /><TrendPage metric="weekly" /><CurrentLocation /></FilterProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Location breadcrumbs' })).toHaveTextContent('Synthetic State');
    fireEvent.click(screen.getByRole('button', { name: 'Synthetic National' }));
    expect(screen.getByTestId('route')).toHaveTextContent('/quick-facts/weekly?code=fixture-national&date=2026-10-25&period=YDAY');
    expect(screen.queryByRole('navigation', { name: 'Location breadcrumbs' })).not.toBeInTheDocument();
  });

  it('switches enabled metrics while preserving location and query parameters', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      weekly_facts_enabled: true, my_plan_enabled: true, portal: 'SI',
    });
    render(
      <MemoryRouter initialEntries={['/quick-facts/weekly?code=fixture-national&period=YDAY']}>
        <FilterProvider><InitialiseFilter /><TrendPage metric="weekly" /><CurrentLocation /></FilterProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('link', { name: 'My Plan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Weekly Facts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trend');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('powered by Weekly Facts and My Plan');
    fireEvent.click(screen.getByRole('link', { name: 'My Plan' }));
    expect(screen.getByTestId('route')).toHaveTextContent('/quick-facts/myplan?code=fixture-national&period=YDAY');
  });

  it('offers source view buttons for a single enabled metric instead of a view dropdown', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      weekly_facts_enabled: true, my_plan_enabled: false, portal: 'SI',
    });
    render(<TestPage />);
    expect(await screen.findByRole('button', { name: 'Monthly Overview' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My Plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Select tab' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Monthly Overview' }));
    expect(screen.getByRole('button', { name: 'Monthly Overview' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Weekly Facts - Monthly Overview')).toBeInTheDocument();
  });
});

function events() {
  return (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer || [];
}

beforeEach(() => {
  vi.mocked(getUserDetails).mockResolvedValue({ employee_number: 'fixture-employee', Store_Insights_Role: 'fixture-role' });
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('dataLayer', []);
  vi.mocked(useTrendData).mockReturnValue({ data, isLoading: false, isError: false } as ReturnType<typeof useTrendData>);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Source subscription profile integration', () => {
  it.each<WfMetric>(['weekly', 'myPlan'])('offers national pseudo-locations only for Weekly Facts, not %s indiscriminately', async metric => {
    vi.mocked(getUserDetails).mockResolvedValue({
      portal: 'SI', sqf_area_of_responsibility: 'National', weekly_facts_enabled: true, my_plan_enabled: true,
    });
    vi.mocked(useTrendData).mockReturnValue({
      data: { ...data, is_web_subscription_enabled: true }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendData>);
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: [], subscribed_views: [] });
    render(<TestPage metric={metric} />);
    await screen.findByRole('link', { name: 'My Plan' });
    fireEvent.click(screen.getByRole('button', { name: 'Subscription preferences' }));
    expect(!!screen.queryByRole('checkbox', { name: 'W-Retail' })).toBe(metric === 'weekly');
    expect(!!screen.queryByRole('checkbox', { name: 'Metro' })).toBe(metric === 'weekly');
  });

  it('waits for the fetched profile before initializing an early-opened subscription dialog', async () => {
    let resolveProfile!: (value: Awaited<ReturnType<typeof getUserDetails>>) => void;
    vi.mocked(getUserDetails).mockReturnValue(new Promise(resolve => { resolveProfile = resolve; }));
    vi.mocked(useTrendData).mockReturnValue({
      data: { ...data, is_web_subscription_enabled: true }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendData>);
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: [], subscribed_views: [] });
    render(<TestPage storeTree />);
    fireEvent.click(screen.getByRole('button', { name: 'Subscription preferences' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(async () => resolveProfile({
      portal: 'SI', store_insights_role_desc: 'Store', sqf_area_of_responsibility: 'fixture-store',
    }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });

  it.each<WfMetric>(['weekly', 'myPlan'])('uses Store responsibility without a location picker for %s', async metric => {
    vi.mocked(getUserDetails).mockResolvedValue({
      portal: 'SI', store_insights_role_desc: 'Store', sqf_area_of_responsibility: 'fixture-store',
      weekly_facts_enabled: true, my_plan_enabled: true,
    });
    vi.mocked(useTrendData).mockReturnValue({
      data: { ...data, is_web_subscription_enabled: true, available_views: ['week'] }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendData>);
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: [], subscribed_views: ['week'] });
    vi.mocked(updateUserSubscriptions).mockResolvedValue(undefined);
    render(<TestPage metric={metric} storeTree />);
    await screen.findByRole('link', { name: 'My Plan' });
    fireEvent.click(screen.getByRole('button', { name: 'Subscription preferences' }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Weekly Overview' })).toBeChecked());
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    expect(screen.queryByText(/for your preferred locations/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    await waitFor(() => expect(updateUserSubscriptions).toHaveBeenCalledWith(
      metric === 'weekly' ? 'wf' : 'myplan', ['fixture-store'], ['week'],
    ));
  });

  it('uses the account responsibility, not the visible tree root, for national subscription nodes', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      portal: 'SI', sqf_area_of_responsibility: 'fixture-store', weekly_facts_enabled: true, my_plan_enabled: true,
    });
    vi.mocked(useTrendData).mockReturnValue({
      data: { ...data, is_web_subscription_enabled: true }, isLoading: false, isError: false,
    } as ReturnType<typeof useTrendData>);
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: [], subscribed_views: [] });
    render(<TestPage storeTree />);
    await screen.findByRole('link', { name: 'My Plan' });
    fireEvent.click(screen.getByRole('button', { name: 'Subscription preferences' }));
    expect(screen.getByRole('tree')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'W-Retail' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Metro' })).not.toBeInTheDocument();
  });
});

describe('Weekly/My Plan configured links', () => {
  it('renders source labels and targets with safe new-tab handling on desktop only', () => {
    render(<TestPage />);
    const toolkit = screen.getByRole('link', { name: 'Planning toolkit' });
    expect(toolkit).toHaveAttribute('href', 'https://example.invalid/toolkit');
    expect(toolkit).toHaveAttribute('target', '_blank');
    expect(toolkit).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Usage dashboard' })).toHaveAttribute('href', 'https://example.invalid/usage');
    vi.stubGlobal('innerWidth', 767);
    fireEvent(window, new Event('resize'));
    expect(screen.queryByRole('link', { name: 'Planning toolkit' })).not.toBeInTheDocument();
  });

  it('omits absent links without inventing a title or a second link', () => {
    const usageOnly: WfPageData = { ...data, toolkit_link: undefined };
    vi.mocked(useTrendData).mockReturnValue({ data: usageOnly, isLoading: false, isError: false } as ReturnType<typeof useTrendData>);
    const { rerender } = render(<TestPage />);
    expect(screen.queryByRole('link', { name: 'Planning toolkit' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    const noLinks: WfPageData = { ...usageOnly, usage_dashboard_link: undefined };
    vi.mocked(useTrendData).mockReturnValue({ data: noLinks, isLoading: false, isError: false } as ReturnType<typeof useTrendData>);
    rerender(<TestPage />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('Weekly/My Plan analytics', () => {
  it('uses the real source event envelope for initialization without StrictMode duplicates', async () => {
    const { rerender } = render(<StrictMode><TestPage /></StrictMode>);
    await waitFor(() => expect(events()).toHaveLength(1));
    expect(events()[0]).toMatchObject({
      event: 'quick_facts_element_click', employeeNumber: 'fixture-employee', siRole: 'fixture-role',
      quickFactEventType: 'weeklyTabChanged', quickFactCardType: 'Weekly Overview', selectedLocation: 'fixture-national',
    });
    rerender(<StrictMode><TestPage /></StrictMode>);
    expect(events()).toHaveLength(1);
    vi.mocked(useTrendData).mockReturnValue({ data: { ...data }, isLoading: false, isError: false } as ReturnType<typeof useTrendData>);
    rerender(<StrictMode><TestPage /></StrictMode>);
    await waitFor(() => expect(events()).toHaveLength(2));
    rerender(<StrictMode><TestPage metric="myPlan" /></StrictMode>);
    await waitFor(() => expect(events()).toHaveLength(3));
    expect(events().at(-1)).toMatchObject({
      quickFactEventType: 'myPlanTabChanged', quickFactCardType: 'Weekly Overview', selectedLocation: 'fixture-national',
    });
  });

  it('emits exact desktop My Plan view, date and successful hierarchy change events', async () => {
    render(<TestPage metric="myPlan" />);
    await waitFor(() => expect(events()).toHaveLength(1));
    choose('View', 'Groups');
    await waitFor(() => expect(events()).toHaveLength(2));
    expect(events().at(-1)).toMatchObject({
      quickFactEventType: 'myPlanHierarchyDropdownChanged', quickFactCardType: 'Weekly Overview', selectedLocation: 'fixture-national',
    });
    choose('Select tab', 'Monthly Overview');
    await waitFor(() => expect(events()).toHaveLength(3));
    expect(events().at(-1)?.quickFactEventType).toBe('myPlanTabChanged');
    choose('Select date', 'M1');
    await waitFor(() => expect(events()).toHaveLength(4));
    expect(events().at(-1)).toMatchObject({
      quickFactEventType: 'myPlanDateFilterChanged', quickFactCardType: 'Monthly Overview - M1',
    });
  });

  it('does not track mobile tab preview/cancel but tracks a committed date once', async () => {
    vi.stubGlobal('innerWidth', 360);
    render(<TestPage />);
    await waitFor(() => expect(events()).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getByRole('option', { name: 'W2' }));
    expect(events()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(events()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    fireEvent.click(screen.getByRole('option', { name: 'M1' }));
    await waitFor(() => expect(events()).toHaveLength(2));
    expect(events().at(-1)).toMatchObject({
      quickFactEventType: 'weeklyMobileFilterChanged', quickFactCardType: 'Month', selectedLocation: 'fixture-national',
    });
  });

  it('does not track loading/error pages or unmatched hierarchy choices', async () => {
    vi.mocked(useTrendData).mockReturnValue({ data, isLoading: false, isError: true } as ReturnType<typeof useTrendData>);
    const { rerender } = render(<TestPage />);
    expect(events()).toHaveLength(0);
    vi.mocked(useTrendData).mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useTrendData>);
    rerender(<TestPage />);
    expect(events()).toHaveLength(0);
    const unmatchedData: WfPageData = {
      ...data, cards: [{ ...data.cards[0], cardContents: [{ filterKey: 'stores', weekNo: 'W2', tableData }] }],
    };
    vi.mocked(useTrendData).mockReturnValue({
      data: unmatchedData,
      isLoading: false, isError: false,
    } as ReturnType<typeof useTrendData>);
    rerender(<TestPage />);
    await waitFor(() => expect(events()).toHaveLength(1));
    choose('View', 'Groups');
    expect(events()).toHaveLength(1);
  });

  it('reports an analytics failure without interrupting the page', async () => {
    const error = new Error('Synthetic analytics failure');
    vi.mocked(getUserDetails).mockRejectedValueOnce(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestPage />);
    await waitFor(() => expect(log).toHaveBeenCalledWith('Unable to send Weekly Facts/My Plan analytics', error));
    expect(events()).toHaveLength(0);
    expect(screen.getByText('Weekly Facts - Weekly Overview')).toBeInTheDocument();
    choose('Select tab', 'Monthly Overview');
    await waitFor(() => expect(events()).toHaveLength(1));
  });
});

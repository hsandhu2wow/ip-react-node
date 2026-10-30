import { StrictMode, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrendPage } from './TrendPage';
import { FilterProvider, useFilter } from '../../../shared/context/FilterContext';
import { TrendActionsProvider } from '../context/TrendActionsContext';
import { useTrendData } from '../hooks/useTrendData';
import { getUserDetails } from '../../../shared/api/users';
import type { WfMetric, WfPageData } from '../types/wf.types';

vi.mock('../hooks/useTrendData');
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

function TestPage({ metric = 'weekly' }: { metric?: WfMetric }) {
  return (
    <MemoryRouter>
      <FilterProvider>
        <TrendActionsProvider>
          <InitialiseFilter />
          <TrendPage metric={metric} />
        </TrendActionsProvider>
      </FilterProvider>
    </MemoryRouter>
  );
}

function events() {
  return (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer || [];
}

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('dataLayer', []);
  vi.mocked(useTrendData).mockReturnValue({ data, isLoading: false, isError: false } as ReturnType<typeof useTrendData>);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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
    fireEvent.change(screen.getByRole('combobox', { name: 'View' }), { target: { value: 'groups' } });
    await waitFor(() => expect(events()).toHaveLength(2));
    expect(events().at(-1)).toMatchObject({
      quickFactEventType: 'myPlanHierarchyDropdownChanged', quickFactCardType: 'Weekly Overview', selectedLocation: 'fixture-national',
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Select tab' }), { target: { value: 'month' } });
    await waitFor(() => expect(events()).toHaveLength(3));
    expect(events().at(-1)?.quickFactEventType).toBe('myPlanTabChanged');
    fireEvent.change(screen.getByRole('combobox', { name: 'Select date' }), { target: { value: 'M1' } });
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
    fireEvent.change(screen.getByRole('combobox', { name: 'View' }), { target: { value: 'groups' } });
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
    fireEvent.change(screen.getByRole('combobox', { name: 'Select tab' }), { target: { value: 'month' } });
    await waitFor(() => expect(events()).toHaveLength(1));
  });
});

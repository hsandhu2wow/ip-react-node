import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendPage } from './TrendPage';
import * as useTrendDataModule from '../../hooks/useTrendData';
import type { WfCardData, WfMetric, WfPageData } from '../../types/wf.types';

vi.mock('../../hooks/useTrendData');

const baseWfData = {
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

  it('does not render subscription link when is_web_subscription_enabled is false', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.queryByText(/Subscription preferences/)).not.toBeInTheDocument();
  });

  it('renders subscription link when is_web_subscription_enabled is true', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { ...baseWfData, is_web_subscription_enabled: true },
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText(/Subscription preferences/)).toBeInTheDocument();
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
});

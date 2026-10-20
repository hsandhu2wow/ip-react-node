import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendPage } from './TrendPage';
import * as useTrendDataModule from '../../hooks/useTrendData';
import { TrendActionsProvider, useTrendActions } from '../../context/TrendActionsContext';

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
});

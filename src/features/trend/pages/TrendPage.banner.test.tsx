import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { QuickFactsLayout } from '../../../app/layout/QuickFactsLayout/QuickFactsLayout';
import { TrendPage } from './TrendPage';
import { useTrendData } from '../hooks/useTrendData';
import type { WfMetric, WfPageData } from '../types/wf.types';

vi.mock('../hooks/useTrendData');
vi.mock('../../../app/layout/FilterBar/FilterBar', () => ({ FilterBar: () => <div data-testid="filter-bar" /> }));
vi.mock('../../../app/layout/Footer/Footer', () => ({ Footer: () => null }));

const data: WfPageData = {
  refreshTime: '2026-10-21T12:00:00',
  cards: [{ key: 'week', displayName: 'Week', cardContents: { tableData: { headers: [], data: [] } } }],
  banner: { type: 'info', text: 'Read the <a href="https://example.invalid/guide">planning guide</a>' },
};

function Navigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate('/summary')}>Summary</button><Outlet /></>;
}

function Page({ metric = 'weekly' }: { metric?: WfMetric }) {
  return (
    <MemoryRouter initialEntries={['/trend']}>
      <Routes>
        <Route element={<Navigation />}>
          <Route element={<QuickFactsLayout />}>
            <Route path="/trend" element={<TrendPage metric={metric} />} />
            <Route path="/summary" element={<div>Summary content</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function response(nextData = data, isLoading = false, isError = false) {
  vi.mocked(useTrendData).mockReturnValue({ data: nextData, isLoading, isError } as ReturnType<typeof useTrendData>);
}

beforeEach(() => response());

describe('Weekly/My Plan layout banners', () => {
  it('renders rich text below the shared filter and dismisses until the next response', () => {
    const { rerender } = render(<Page />);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByRole('link', { name: 'planning guide' })).toHaveAttribute('href', 'https://example.invalid/guide');
    expect(within(alert).getByText('error')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('filter-bar').compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(within(alert).getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(<Page />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    response({ ...data, banner: { type: 'warning', text: 'New notification' } });
    rerender(<Page />);
    expect(screen.getByRole('alert')).toHaveTextContent('New notification');
    rerender(<Page metric="myPlan" />);
    expect(screen.getByRole('alert')).toHaveTextContent('New notification');
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }));
    expect(screen.getByText('Summary content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears stale notifications on empty responses, loading, errors and metric changes', () => {
    const { rerender } = render(<Page />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    response(data, true);
    rerender(<Page />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    response(data, false, true);
    rerender(<Page />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load data.');
    expect(screen.queryByRole('link', { name: 'planning guide' })).not.toBeInTheDocument();
    response({ ...data, banner: { type: 'info', text: '' } });
    rerender(<Page />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    response({ ...data, banner: undefined });
    rerender(<Page metric="myPlan" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps safe HTML but removes active markup as Angular innerHTML does', () => {
    response({
      ...data,
      banner: {
        type: 'danger',
        text: '<strong>Notice</strong><img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a>',
      },
    });
    render(<Page />);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Notice').tagName).toBe('STRONG');
    expect(alert.querySelector('script')).toBeNull();
    expect(alert.querySelector('[onerror]')).toBeNull();
    expect(within(alert).getByText('Unsafe link')).not.toHaveAttribute('href');
  });
});

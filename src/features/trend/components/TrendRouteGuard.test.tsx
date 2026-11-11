import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrendRouteGuard } from './TrendRouteGuard';
import { getUserDetails } from '../../../shared/api/users';
import { getCFCChildCodes } from '../../quick-facts/api/sqf';

vi.mock('../../../shared/api/users', () => ({ getUserDetails: vi.fn() }));
vi.mock('../../quick-facts/api/sqf', () => ({ getCFCChildCodes: vi.fn() }));

function renderGuard(metric: 'weekly' | 'myPlan') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/quick-facts/weekly?code=1']}>
        <Routes>
          <Route path="/quick-facts/weekly" element={<TrendRouteGuard metric={metric}><div>trend page</div></TrendRouteGuard>} />
          <Route path="/quick-facts/summary" element={<div>daily page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TrendRouteGuard', () => {
  beforeEach(() => {
    vi.mocked(getCFCChildCodes).mockResolvedValue(['CFC1']);
  });

  it('renders the page for an enabled Weekly user', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({ wf: 1, weekly_facts_enabled: true });
    renderGuard('weekly');
    expect(await screen.findByText('trend page')).toBeInTheDocument();
  });

  it('checks the My Plan flag for the My Plan route', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({ wf: 1, weekly_facts_enabled: true, my_plan_enabled: false });
    renderGuard('myPlan');
    expect(await screen.findByText('daily page')).toBeInTheDocument();
  });

  it('redirects users without the wf role or who are CFC-restricted', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({ weekly_facts_enabled: true });
    const first = renderGuard('weekly');
    expect(await screen.findByText('daily page')).toBeInTheDocument();
    first.unmount();
    vi.mocked(getUserDetails).mockResolvedValue({ wf: 1, weekly_facts_enabled: true, sqf_area_of_responsibility: 'CFC1' });
    renderGuard('weekly');
    expect(await screen.findByText('daily page')).toBeInTheDocument();
  });

  it('shows an error instead of redirecting when user details failed to load', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({});
    renderGuard('weekly');
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to verify access');
  });
});

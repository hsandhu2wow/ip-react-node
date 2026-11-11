import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickFactsLayout } from './QuickFactsLayout';
import { getUserDetails } from '../../../shared/api/users';
import { getCFCChildCodes } from '../../../features/quick-facts/api/sqf';

vi.mock('../../../shared/api/users');
vi.mock('../../../features/quick-facts/api/sqf', () => ({ getCFCChildCodes: vi.fn() }));
vi.mock('../FilterBar/FilterBar', () => ({ FilterBar: () => <div>Filter</div> }));
vi.mock('../Footer/Footer', () => ({ Footer: () => null }));

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="route">{pathname}{search}</output>;
}
function renderLayout(path = '/quick-facts/myplan?code=fixture-state') {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/quick-facts" element={<QuickFactsLayout />}>
            <Route path="myplan" element={<div>My Plan page</div>} />
            <Route path="summary" element={<div>Daily page</div>} />
          </Route>
        </Routes>
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.mocked(getUserDetails).mockResolvedValue({
    portal: 'SI', sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: true,
    wf: 1, weekly_facts_enabled: true, my_plan_enabled: true, sqf_area_of_responsibility: 'fixture-state',
  });
  vi.mocked(getCFCChildCodes).mockResolvedValue([]);
});
describe('Trend mobile page navigation', () => {
  it('restores source section tabs on Trend without restoring the removed summary page bar', async () => {
    renderLayout();
    expect(await screen.findByRole('navigation', { name: 'Insights sections' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trend' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Trend' })).toHaveAttribute('href', '/quick-facts/weekly?code=fixture-state');
    expect(screen.getByRole('link', { name: 'Weekly' })).toHaveAttribute('href', '/weekly?code=fixture-state');
    fireEvent.click(screen.getByRole('link', { name: 'Daily' }));
    expect(screen.getByTestId('route')).toHaveTextContent('/quick-facts/summary?code=fixture-state');
    expect(screen.queryByRole('navigation', { name: 'Insights sections' })).not.toBeInTheDocument();
  });

  it('does not expose Quick Assist or Trend sections for a CFC responsibility', async () => {
    vi.mocked(getCFCChildCodes).mockResolvedValue(['fixture-state']);
    renderLayout();
    expect(await screen.findByRole('link', { name: 'Daily' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Weekly' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Trend' })).not.toBeInTheDocument();
  });

  it('uses the source non-SI wording and hides disabled sections', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({
      portal: '360FM', wf: 1, weekly_facts_enabled: true, my_plan_enabled: false,
    });
    renderLayout();
    expect(await screen.findByRole('link', { name: 'Weekly Facts' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Daily' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Quick Assist' })).not.toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IUserDetails } from '../../../shared/api/users';
import { QuickFactsLayout } from './QuickFactsLayout';
import { getUserDetails } from '../../../shared/api/users';
import { getCFCChildCodes } from '../../../features/quick-facts/api/sqf';
import { useStella } from '../../../shared/context/StellaContext';
import { buildNavGroups } from '../navItems';
import { useNavGroups } from '../useNavGroups';
import { fullAccessUser } from '../navTestFixture';

vi.mock('../../../shared/api/users');
vi.mock('../../../features/quick-facts/api/sqf', () => ({ getCFCChildCodes: vi.fn() }));
vi.mock('../FilterBar/FilterBar', () => ({ FilterBar: () => <div data-testid="filter-bar">Filter</div> }));
vi.mock('../Footer/Footer', () => ({ Footer: () => null }));
vi.mock('../useNavGroups', () => ({ useNavGroups: vi.fn() }));

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="route">{pathname}{search}</output>;
}
function StellaProbe() {
  return <output data-testid="stella">{useStella().enabled ? 'enabled' : 'disabled'}</output>;
}
function navResult(user: IUserDetails, isCfc: boolean) {
  return {
    groups: buildNavGroups(user, isCfc, user.portal ?? 'SI', user.portal === 'SI'),
    user,
    isCfc,
    dashboardSettingsError: false,
  };
}
function renderLayout(path = '/quick-facts/myplan?code=fixture-state') {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/quick-facts" element={<QuickFactsLayout />}>
            <Route path="myplan" element={<div>My Plan page</div>} />
            <Route path="summary" element={<div>Daily page</div>} />
            <Route path="details/:type" element={<StellaProbe />} />
          </Route>
        </Routes>
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  const user = {
    portal: 'SI', sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: true,
    wf: 1, weekly_facts_enabled: true, my_plan_enabled: true, sqf_area_of_responsibility: 'fixture-state',
  };
  vi.mocked(getUserDetails).mockResolvedValue(user);
  vi.mocked(getCFCChildCodes).mockResolvedValue([]);
  vi.mocked(useNavGroups).mockReturnValue(navResult(user, false));
});
describe('Quick Facts mobile page navigation', () => {
  it('renders the shared page-bar before filters and does not render Trend-only tabs', async () => {
    renderLayout();
    const pageBar = await screen.findByRole('navigation', { name: 'Quick Facts navigation' });
    expect(screen.getByRole('link', { name: 'Trend' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Trend' })).toHaveAttribute('href', '/quick-facts/weekly?code=fixture-state');
    const filterBar = screen.getByTestId('filter-bar');
    expect(pageBar.compareDocumentPosition(filterBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Insights sections' })).not.toBeInTheDocument();
  });

  it('excludes Quick Assist and My Plan from the CFC SI page bar', async () => {
    vi.mocked(useNavGroups).mockReturnValue(navResult(fullAccessUser, true));
    renderLayout();
    expect(await screen.findByText('My Plan page')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Quick Facts navigation' })).not.toBeInTheDocument();
  });

  it('uses non-SI page-bar labels', async () => {
    const user = { ...fullAccessUser, portal: '360FM' };
    vi.mocked(getUserDetails).mockResolvedValue(user);
    vi.mocked(useNavGroups).mockReturnValue(navResult(user, false));
    renderLayout();
    expect(await screen.findByRole('link', { name: 'Quick Facts New!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Weekly Facts New!' })).toBeInTheDocument();
  });
});

describe('Stella availability (Angular SqfFilterService.is_stella_enabled_for_user)', () => {
  it('enables Stella for users whose details flag it', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({ portal: 'SI', is_stella_enabled: true });
    renderLayout('/quick-facts/details/sales');
    expect(await screen.findByText('enabled')).toBeInTheDocument();
  });

  it('keeps Stella disabled without the flag', async () => {
    vi.mocked(getUserDetails).mockResolvedValue({ portal: 'SI' });
    renderLayout('/quick-facts/details/sales');
    await vi.waitFor(() => expect(getUserDetails).toHaveBeenCalled());
    expect(screen.getByTestId('stella')).toHaveTextContent('disabled');
  });
});

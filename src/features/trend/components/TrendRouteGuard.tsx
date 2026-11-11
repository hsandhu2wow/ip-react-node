import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserDetails } from '../../../shared/api/users';
import { useCFCChildCodes } from '../../quick-facts/hooks/useCFCChildCodes';
import type { WfMetric } from '../types/wf.types';

/**
 * Gates Weekly Facts / My Plan on the fetched account (numeric `wf` role, the
 * per-feature enabled flag, and the CFC exclusion) — the same rule the mobile
 * navigation uses to show the Trend entry. Denied users return to Daily.
 */
export function TrendRouteGuard({ metric, children }: { metric: WfMetric; children: ReactNode }) {
  const { search } = useLocation();
  const { data: user, isError } = useQuery({ queryKey: ['user-details'], queryFn: getUserDetails, staleTime: Infinity });
  const { data: cfcCodes, isError: cfcError } = useCFCChildCodes();

  // getUserDetails resolves {} on failure, so an empty object means access could not be verified
  if (isError || cfcError || (user && Object.keys(user).length === 0)) {
    return <div role="alert">Unable to verify access to this page.</div>;
  }
  if (!user || !cfcCodes) return null;

  const isCfc = cfcCodes.includes(String(user.sqf_area_of_responsibility || ''));
  const enabled = metric === 'weekly' ? user.weekly_facts_enabled : user.my_plan_enabled;
  if (!user.wf || !enabled || isCfc) {
    return <Navigate to={{ pathname: '/quick-facts/summary', search }} replace />;
  }
  return <>{children}</>;
}

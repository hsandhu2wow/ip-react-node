import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { getUserDetails } from '../../../shared/api/users';
import { useCFCChildCodes } from '../../quick-facts/hooks/useCFCChildCodes';
import styles from './TrendMobileNavigation.module.scss';

export function TrendMobileNavigation() {
  const { search } = useLocation();
  const { data: user, isError } = useQuery({ queryKey: ['user-details'], queryFn: getUserDetails, staleTime: Infinity });
  const { data: cfcCodes, isError: cfcError } = useCFCChildCodes();
  if (isError || cfcError) return <div role="alert">Unable to load insights navigation.</div>;
  if (!user || !cfcCodes) return null;
  const isSI = ['SI', 'METRO'].includes(user.portal || '');
  const isCfc = cfcCodes.includes(String(user.sqf_area_of_responsibility || ''));
  const showTrend = !!user.wf && !!user.weekly_facts_enabled && !isCfc;
  const sections = [
    ...(user.sqf === 1 && user.sqf_enabled
      ? [{ label: isSI ? 'Daily' : 'Quick Facts', to: '/quick-facts/summary' }] : []),
    ...(user.sqa && user.quick_assist_enabled && !isCfc
      ? [{ label: isSI ? 'Weekly' : 'Quick Assist', to: '/weekly' }] : []),
    ...(showTrend ? [{ label: isSI ? 'Trend' : 'Weekly Facts', to: '/quick-facts/weekly' }] : []),
  ];
  if (!sections.length) return null;
  return (
    <nav className={styles.navigation} aria-label="Insights sections">
      {sections.map(section => <Link key={section.label}
        to={{ pathname: section.to, search }} aria-current={section.to === '/quick-facts/weekly' ? 'page' : undefined}>
        {section.label}
      </Link>)}
    </nav>
  );
}

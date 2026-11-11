import { Link, useLocation } from 'react-router-dom';
import type { WfMetric } from '../types/wf.types';
import styles from './TrendMetricTabs.module.scss';

export const TREND_METRIC_NAMES: Record<WfMetric, string> = {
  weekly: 'Weekly Facts',
  myPlan: 'My Plan',
};

export function TrendMetricTabs({ metric, available }: { metric: WfMetric; available: WfMetric[] }) {
  const { search } = useLocation();
  return (
    <nav className={styles.tabs} aria-label="Select metric">
      {available.map(value => (
        <Link key={value} to={{ pathname: `/quick-facts/${value === 'myPlan' ? 'myplan' : 'weekly'}`, search }}
          aria-current={value === metric ? 'page' : undefined}>
          {TREND_METRIC_NAMES[value]}
        </Link>
      ))}
    </nav>
  );
}

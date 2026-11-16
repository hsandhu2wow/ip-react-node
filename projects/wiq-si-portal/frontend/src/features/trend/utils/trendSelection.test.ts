import { describe, expect, it } from 'vitest';
import type { WfCardData, WfPageData } from '../types/wf.types';
import { createTrendSelection, updateTrendSelection, updateMobileTrendSelection } from './trendSelection';

function page(cards: WfCardData[]): WfPageData {
  return {
    refreshTime: '2026-10-01T12:00:00',
    hierarchyDropdown: {
      label: 'View', allowedViews: ['trend', 'history'],
      filterDropdown: [
        { displayValue: 'Stores', filterKey: 'stores' },
        { displayValue: 'Groups', filterKey: 'groups' },
      ],
    },
    cards,
  };
}

const tableData = { headers: [], data: [] };
const trend: WfCardData = {
  key: 'trend', displayName: 'Trend',
  cardContents: [
    { filterKey: 'stores', timePeriod: 'Store trend', tableData },
    { filterKey: 'groups', timePeriod: 'Group trend', tableData },
  ],
};
const history: WfCardData = {
  key: 'history', displayName: 'History', hasHistoryData: true,
  dateFilterKey: 'monthNo', dateFilterValues: ['M2', 'M1', 'Missing'],
  cardContents: [
    { monthNo: 'M2', filterKey: 'stores', timePeriod: 'Store M2', tableData },
    { monthNo: 'M2', filterKey: 'groups', timePeriod: 'Group M2', tableData },
    { monthNo: 'M1', filterKey: 'stores', timePeriod: 'Store M1', tableData },
    { monthNo: 'M1', filterKey: 'groups', timePeriod: 'Group M1', tableData },
  ],
};

describe('trend selection', () => {
  it('starts mobile on the first mobile card and its first contents, not a desktop-only view', () => {
    const data = page([trend, { ...history, hasMobileView: true }]);
    const selection = createTrendSelection(data, true);
    expect(selection.cardKey).toBe('history');
    expect(selection.date).toBe('M2');
    expect(selection.contents?.timePeriod).toBe('Store M2');
    expect(createTrendSelection(page([trend]), true).contents).toBeUndefined();
    expect(createTrendSelection(undefined, true).cardKey).toBe('');
  });

  it('commits a mobile tab/date using wire-defined history keys and hierarchy fallback', () => {
    const data = page([
      { ...history, hasMobileView: true, mobileDateFilterTabName: 'Month' },
      { ...trend, hasMobileView: true, mobileDateFilterTabName: 'Trend' },
    ]);
    let selection = updateMobileTrendSelection(data, createTrendSelection(data, true), 'weekly', 'Month', 'M1');
    expect(selection.contents?.timePeriod).toBe('Store M1');
    selection = updateMobileTrendSelection(data, selection, 'weekly', 'Trend', 'M2');
    expect(selection.cardKey).toBe('trend');
    expect(selection.contents?.timePeriod).toBe('Store trend');
    expect(updateMobileTrendSelection(data, selection, 'weekly', 'Missing', 'M1')).toBe(selection);
  });

  it('selects the matching My Plan card for card-level Half Year dates', () => {
    const data = page(['H2', 'H1'].map(half => ({
      key: half, displayName: half, hasMobileView: true, mobileDateFilterTabName: 'Half Year',
      dateFilterKey: 'half_year', half_year: half, dateFilterValues: ['H2', 'H1'],
      cardContents: { tableData, timePeriod: `Plan ${half}` },
    })));
    const selection = updateMobileTrendSelection(data, createTrendSelection(data, true), 'myPlan', 'Half Year', 'H1');
    expect(selection.cardKey).toBe('H1');
    expect(selection.contents?.timePeriod).toBe('Plan H1');
  });

  it('initially falls back to the first hierarchy option for hierarchy arrays', () => {
    const selection = createTrendSelection(page([trend]));
    expect(selection.hierarchy).toBe('stores');
    expect(selection.contents?.timePeriod).toBe('Store trend');
    expect(selection.cardKey).toBe('trend');
  });

  it('initially gives the first history match precedence over hierarchy', () => {
    const data = page([history]);
    data.hierarchyDropdown!.filterDropdown.reverse();
    const selection = createTrendSelection(data);
    expect(selection.hierarchy).toBe('groups');
    expect(selection.date).toBe('M2');
    expect(selection.contents?.timePeriod).toBe('Store M2');
  });

  it('combines the selected history and hierarchy on hierarchy changes', () => {
    const data = page([history]);
    let selection = updateTrendSelection(data, createTrendSelection(data), { type: 'date', value: 'M1' });
    selection = updateTrendSelection(data, selection, { type: 'hierarchy', value: 'groups' });
    expect(selection.contents?.timePeriod).toBe('Group M1');
    expect(selection.date).toBe('M1');
    selection = updateTrendSelection(data, selection, { type: 'date', value: 'M2' });
    expect(selection.contents?.timePeriod).toBe('Store M2');
  });

  it('uses hierarchy fallback on a missing date only for an allowed view', () => {
    const data = page([history]);
    let selection = updateTrendSelection(data, createTrendSelection(data), { type: 'hierarchy', value: 'groups' });
    selection = updateTrendSelection(data, selection, { type: 'date', value: 'Missing' });
    expect(selection.contents?.timePeriod).toBe('Group M2');
    data.hierarchyDropdown!.allowedViews = [];
    selection = updateTrendSelection(data, selection, { type: 'date', value: 'M1' });
    const previous = selection.contents;
    selection = updateTrendSelection(data, selection, { type: 'date', value: 'Missing' });
    expect(selection.contents).toBe(previous);
    expect(selection.date).toBe('Missing');
  });

  it('retains previous contents when a hierarchy/date pair has no matching data', () => {
    const data = page([history]);
    const selection = createTrendSelection(data);
    const next = updateTrendSelection(data, selection, { type: 'hierarchy', value: 'unavailable' });
    expect(next.contents).toBe(selection.contents);
    expect(next.hierarchy).toBe('unavailable');
  });

  it('switches views with reset history but preserved hierarchy', () => {
    const data = page([trend, history]);
    const selection = updateTrendSelection(data, createTrendSelection(data), { type: 'hierarchy', value: 'groups' });
    const next = updateTrendSelection(data, selection, { type: 'view', value: 'history' });
    expect(next.hierarchy).toBe('groups');
    expect(next.date).toBe('M2');
    expect(next.contents?.timePeriod).toBe('Store M2');
  });

  it('supports default weekNo, object contents and missing content without fabricated table data', () => {
    const weekly: WfCardData = {
      key: 'week', displayName: 'Week', dateFilterValues: ['W1'],
      cardContents: [{ weekNo: 'W1', timePeriod: 'Week 1', tableData }],
    };
    expect(createTrendSelection(page([weekly])).contents?.timePeriod).toBe('Week 1');
    const object: WfCardData = {
      key: 'object', displayName: 'Object', cardContents: { timePeriod: 'Object', tableData },
    };
    const data = page([object, { key: 'empty', displayName: 'Empty' }]);
    const selection = createTrendSelection(data);
    expect(updateTrendSelection(data, selection, { type: 'hierarchy', value: 'groups' }).contents?.timePeriod).toBe('Object');
    expect(updateTrendSelection(data, selection, { type: 'view', value: 'empty' }).contents).toBeUndefined();
    expect(createTrendSelection(page([])).contents).toBeUndefined();
  });
});

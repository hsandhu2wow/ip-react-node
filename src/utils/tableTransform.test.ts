// src/utils/tableTransform.test.ts
import { describe, it, expect } from 'vitest';
import { filterTableData } from './tableTransform';
import type { WfTableData, WfTableHeader, WfTableCell } from '../types/wf.types';

function cell(columnid: number, overrides: Partial<WfTableCell> = {}): WfTableCell {
  return { columnid, displayValue: `v${columnid}`, value: `v${columnid}`, ...overrides };
}

const headers: WfTableHeader[] = [
  { text: 'Group', val: '0' },
  { text: 'Metric', val: '1' },
  { text: 'Value', val: '2' },
];

describe('filterTableData', () => {
  it('keeps only columns with colType in the allowed set', () => {
    const headersWithColType: WfTableHeader[] = [
      { text: 'Group', val: '0', colType: '' },
      { text: 'Hidden', val: '1', colType: 'toggleChildLevelKey' },
      { text: 'Value', val: '2', colType: 'selectedNode' },
    ];
    const data: WfTableData = {
      headers: headersWithColType,
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(2)]],
    };
    const result = filterTableData(data, true);
    expect(result.headers.map((h) => h.text)).toEqual(['Group', 'Value']);
    expect(result.rows[0].map((c) => c.columnid)).toEqual([0, 2]);
  });

  it('groups rows and finalizes rowSpan on the first row of each group', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1, displayValue: 'Group A' }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1, displayValue: 'Group B' }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows[0][0].rowSpan).toBe(2);
    expect(result.rows[1][0].rowSpan).toBe(0);
    expect(result.rows[2][0].rowSpan).toBe(1);
  });

  it('filters out non-KPI rows when kpiFilterEnabled and not expanded', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      measureColumnId: 1,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: '' }), cell(2)],
      ],
    };
    const result = filterTableData(data, false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0][0].rowSpan).toBe(1);
  });

  it('keeps all rows when isExpanded is true even with kpiFilterEnabled', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      measureColumnId: 1,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: '' }), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows).toHaveLength(2);
  });

  it('marks isGroupEnd on the last row of a multi-row group, but not on the final table row', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows[0].isGroupEnd).toBeFalsy();
    expect(result.rows[1].isGroupEnd).toBe(true);
    expect(result.rows[2].isGroupEnd).toBeFalsy();
    // last row of the whole table is never marked, even though it ends a group
    expect(result.rows[3].isGroupEnd).toBeFalsy();
  });

  it('marks singleton group spacers except after the final table row', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows.map(row => !!row.isGroupEnd)).toEqual([true, true, false]);
  });

  it('handles consecutive empty KPI groups and an empty final group without mutating input', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 2 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
      ],
    };
    const original = structuredClone(data);
    const result = filterTableData(data, false);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.map(row => row[0].rowSpan)).toEqual([2, 0]);
    expect(data).toEqual(original);
  });

  it('projects sparse and reordered cells by original columnid, preserving wire order', () => {
    const data: WfTableData = {
      headers: [
        { text: 'Group', val: '0' },
        { text: 'Hidden', val: '1', colType: 'excluded' },
        { text: 'Value', val: '2', colType: 'selectedNode' },
      ],
      data: [
        [cell(0, { rowSpan: 1 }), cell(2), cell(1)],
        [cell(0, { rowSpan: 1 }), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows.map(row => row.map(item => item.columnid))).toEqual([[0, 2], [0, 2]]);
  });

  it('uses source KPI substring matching on the configured measure column', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      measureColumnId: 2,
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(2, { tags: 'Other,KPI - priority' })]],
    };
    expect(filterTableData(data, false).rows).toHaveLength(1);
  });

  it('handles empty table without throwing', () => {
    const data: WfTableData = {
      headers,
      data: [],
    };
    const result = filterTableData(data, true);
    expect(result.headers).toEqual(headers);
    expect(result.rows).toEqual([]);
  });

  it('correctly finalizes rowSpan for a group with 3+ rows', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1, displayValue: 'Group A' }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1, displayValue: 'Group B' }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0][0].rowSpan).toBe(3);
    expect(result.rows[1][0].rowSpan).toBe(0);
    expect(result.rows[2][0].rowSpan).toBe(0);
    expect(result.rows[2].isGroupEnd).toBe(true);
    expect(result.rows[3][0].rowSpan).toBe(1);
  });

  it('combines KPI filtering with grouping, keeping only KPI rows and adjusting rowSpan', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      measureColumnId: 1,
      data: [
        [cell(0, { rowSpan: 1, displayValue: 'Group A' }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: '' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 1, displayValue: 'Group B' }), cell(1, { tags: 'KPI' }), cell(2)],
      ],
    };
    const result = filterTableData(data, false);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0][0].rowSpan).toBe(2);
    expect(result.rows[0][0].displayValue).toBe('Group A');
    expect(result.rows[0][1].tags).toBe('KPI');
    expect(result.rows[1][0].rowSpan).toBe(0);
    expect(result.rows[1][1].tags).toBe('KPI');
    expect(result.rows[1].isGroupEnd).toBe(true);
    expect(result.rows[2][0].rowSpan).toBe(1);
    expect(result.rows[2][0].displayValue).toBe('Group B');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendTable } from './TrendTable';
import type { WfTableData, WfTableCell } from '../../types/wf.types';

function cell(columnid: number, overrides: Partial<WfTableCell> = {}): WfTableCell {
  return { columnid, displayValue: `v${columnid}`, value: `v${columnid}`, ...overrides };
}

const tableData: WfTableData = {
  headers: [
    { text: 'Group', val: '0' },
    { text: 'Metric', val: '1' },
    { text: 'Value', val: '2' },
  ],
  data: [
    [cell(0, { rowSpan: 1, displayValue: 'Group A' }), cell(1, { displayValue: 'Sales' }), cell(2, { displayValue: '$100' })],
    [cell(0, { rowSpan: 0 }), cell(1, { displayValue: 'Units' }), cell(2, { displayValue: '50' })],
  ],
};

describe('TrendTable', () => {
  it('renders headers and cell values', () => {
    render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Metric')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('Units')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('applies wf-table--show-variance class when showVariance is true', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={true} />);
    expect(container.querySelector('table')?.className).toContain('wf-table--show-variance');
  });

  it('does not apply wf-table--show-variance class when showVariance is false', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    expect(container.querySelector('table')?.className).not.toContain('wf-table--show-variance');
  });

  it('renders a spacer row after a multi-row group', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    const rows = container.querySelectorAll('tbody tr');
    // 2 data rows; no spacer since the group's rowSpan-2 group is also the last group in the table
    // (per tableTransform's rule: never mark isGroupEnd on the last row of the whole table)
    expect(rows.length).toBe(2);
  });
});

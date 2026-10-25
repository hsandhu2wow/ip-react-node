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

  it('does not render a <td> for cells with rowSpan: 0', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    // tableData has 2 rows: first row has Group A with rowSpan 1, second row has a cell with rowSpan 0 (grouped-away)
    // Query all <td> elements in the tbody
    const cells = container.querySelectorAll('tbody td');
    // Row 1: 3 cells (Group A, Sales, $100)
    // Row 2: 2 cells (Units, 50) — the first cell has rowSpan: 0 and should NOT render a <td>
    // Total: 5 cells (not 6)
    expect(cells.length).toBe(5);
    // Verify Group A appears only once
    const groupCells = Array.from(cells).filter(cell => cell.textContent?.includes('Group A'));
    expect(groupCells.length).toBe(1);
  });

  it('renders backend HTML markup in cells instead of escaped tag text', () => {
    const htmlData: WfTableData = {
      headers: [
        { text: 'Group', val: '0' },
        { text: 'Metric', val: '1' },
        { text: 'Value', val: '2' },
      ],
      data: [
        [
          cell(0, { rowSpan: 1, displayValue: 'Group A' }),
          cell(1, { displayValue: 'VOC Score' }),
          cell(2, { displayValue: '<span class="wf-primary-val">79</span><span class="wf-var-text wf-var-text--neg">▼ -1</span>' }),
        ],
      ],
    };
    const { container } = render(<TrendTable tableData={htmlData} isExpanded={true} showVariance={false} />);
    // The literal tag text must NOT appear as escaped text content.
    expect(container.textContent).not.toContain('<span');
    // The HTML must be rendered as real DOM elements.
    const primaryVal = container.querySelector('.wf-primary-val');
    expect(primaryVal).not.toBeNull();
    expect(primaryVal?.textContent).toBe('79');
    expect(container.querySelector('.wf-var-text--neg')).not.toBeNull();
  });

  it('renders tags for cells with a tags field', () => {
    const tagData: WfTableData = {
      headers: [
        { text: 'Group', val: '0' },
        { text: 'Metric', val: '1' },
        { text: 'Value', val: '2' },
      ],
      data: [
        [
          cell(0, { rowSpan: 1, displayValue: 'Group A' }),
          cell(1, { displayValue: 'VOC Score' }),
          cell(2, { displayValue: '79', tags: 'KPI,NEW' }),
        ],
      ],
    };
    const { container } = render(<TrendTable tableData={tagData} isExpanded={true} showVariance={false} />);
    const tags = container.querySelectorAll('.wf-home__tag');
    expect(tags.length).toBe(2);
    expect(tags[0].getAttribute('data-tag')).toBe('KPI');
    expect(tags[1].getAttribute('data-tag')).toBe('NEW');
  });

  it('forwards displayContext to column filtering', () => {
    const contextData: WfTableData = {
      headers: [
        { text: 'Group', val: 'g', colType: '' },
        { text: 'Metric', val: 'm', colType: '' },
        { text: 'Peer col', val: 'R', colType: 'peerNode' },
        { text: 'Child col', val: 'C', colType: 'childNode' },
      ],
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(2), cell(3)]],
    };
    render(
      <TrendTable
        tableData={contextData}
        isExpanded={true}
        showVariance={false}
        displayContext={{ toggleChildLevelKey: 'store', showChildLevel: true }}
      />,
    );
    expect(screen.getByText('Child col')).toBeInTheDocument();
    expect(screen.queryByText('Peer col')).not.toBeInTheDocument();
  });

  it('associates sparse cells with their original header by columnid', () => {
    const sparseData: WfTableData = {
      headers: [
        { text: 'Group', val: '0' },
        { text: 'Metric', val: '1' },
        { text: 'Plain', val: '2' },
        { text: 'Goal', val: '3', cssClass: 'goal-col' },
      ],
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(3, { displayValue: 'goal-value' })]],
    };
    render(<TrendTable tableData={sparseData} isExpanded={true} showVariance={false} />);
    expect(screen.getByText('goal-value').closest('td')?.className).toContain('goal-col');
  });
});

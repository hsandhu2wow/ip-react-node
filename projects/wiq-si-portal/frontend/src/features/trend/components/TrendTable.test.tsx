import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TrendTable } from './TrendTable';
import type { WfTableData, WfTableCell } from '../types/wf.types';

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
  describe('plain-text tooltips', () => {
    const data: WfTableData = {
      headers: [
        { text: 'Group', val: '0' },
        { text: 'Measure', val: '1' },
        { text: 'Result', val: '2', tooltip: 'Last completed week' },
      ],
      kpiFilterEnabled: true,
      data: [
        [cell(0), cell(1), cell(2, { displayValue: 'Plain result', tooltip: 'Cell definition' })],
        [cell(0), cell(1), cell(2, { displayValue: 'Unavailable result', tooltip: '<b>Suppressed</b>', infoMessage: 'Info instead' })],
      ],
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024);
      vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768);
    });

    afterEach(() => {
      cleanup();
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it.each(['weekly', 'myPlan'] as const)('uses Material-style tooltips instead of native titles on %s', (metric) => {
      const { container } = render(<TrendTable metric={metric} tableData={data} isExpanded showVariance={false} onToggleExpanded={vi.fn()} />);
      expect(container.querySelector('[title]')).toBeNull();
      const targets = [
        [screen.getByRole('columnheader', { name: 'Result' }).firstElementChild!, 'Last completed week', 'right'],
        [screen.getByText('Plain result').closest('td')!.firstElementChild!, 'Cell definition', 'right'],
        [screen.getByText('info_outlined'), 'Info instead', 'below'],
        [screen.getByRole('button', { name: 'Collapse to KPI only' }), 'Collapse to KPI only', 'below'],
      ] as const;
      for (const [host, message, side] of targets) {
        fireEvent.mouseEnter(host);
        const surface = screen.getByText(message, { selector: '.mat-mdc-tooltip-surface' });
        expect(surface.closest('[role="tooltip"]')).toHaveClass(`mat-mdc-tooltip-panel-${side}`);
        if (host.tagName !== 'BUTTON') expect(host).toHaveAttribute('aria-description', message);
        fireEvent.mouseLeave(host);
        vi.advanceTimersByTime(75);
        expect(surface).not.toBeInTheDocument();
      }
    });

    it('dismisses both nested tooltips when the expand button stops click propagation', () => {
      const toggle = vi.fn();
      render(<TrendTable tableData={data} isExpanded showVariance={false} onToggleExpanded={toggle} />);
      const expand = screen.getByRole('button', { name: 'Collapse to KPI only' });
      fireEvent.mouseEnter(expand);
      expect(document.querySelectorAll('.mat-mdc-tooltip-surface')).toHaveLength(2);
      vi.advanceTimersByTime(150);
      fireEvent.click(expand);
      vi.advanceTimersByTime(75);
      expect(document.querySelector('.mat-mdc-tooltip-surface')).toBeNull();
      expect(toggle).toHaveBeenCalledOnce();
    });

    it('keeps the source below placement for string-only headers', () => {
      render(<TrendTable tableData={{ headers: ['Group', 'Measure', 'Result'], data: [] }} isExpanded showVariance={false} />);
      fireEvent.mouseEnter(screen.getByRole('columnheader', { name: 'Result' }).firstElementChild!);
      expect(screen.getByText('Result', { selector: '.mat-mdc-tooltip-surface' }).closest('[role="tooltip"]'))
        .toHaveClass('mat-mdc-tooltip-panel-below');
    });

    it('keeps the tooltip open when leaving the React host for its body-mounted overlay', () => {
      render(<TrendTable tableData={data} isExpanded showVariance={false} />);
      const host = screen.getByText('Plain result').closest('td')!.firstElementChild!;
      fireEvent.mouseEnter(host);
      const surface = screen.getByText('Cell definition', { selector: '.mat-mdc-tooltip-surface' });
      fireEvent.mouseLeave(host, { relatedTarget: surface });
      vi.advanceTimersByTime(75);
      expect(surface).toBeInTheDocument();
    });

    it('removes visible tooltips immediately when their table unmounts', () => {
      const { unmount } = render(<TrendTable tableData={data} isExpanded showVariance={false} />);
      fireEvent.mouseEnter(screen.getByText('Plain result').closest('td')!.firstElementChild!);
      expect(screen.getByText('Cell definition', { selector: '.mat-mdc-tooltip-surface' })).toBeInTheDocument();
      unmount();
      expect(document.querySelector('.mat-mdc-tooltip-surface')).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it.each(['weekly', 'myPlan'] as const)('shows %s HTML tooltips only over the inner header and cell content', (metric) => {
    render(<TrendTable metric={metric} isExpanded showVariance={false} tableData={{
      headers: [{ text: 'Group', val: '0' }, { text: 'Measure', val: '1' }, { text: 'Result', val: '2', tooltip: '<b>Header detail</b>' }],
      data: [[cell(0), cell(1), cell(2, { displayValue: 'Fixture result', tooltip: '<b>Cell detail</b>' })]],
    }} />);
    const header = screen.getByRole('columnheader', { name: 'Result' });
    const value = screen.getByText('Fixture result').closest('td')!;
    const panel = () => document.querySelector<HTMLElement>('.wf-html-tooltip-panel');

    for (const [target, detail] of [[header, 'Header detail'], [value, 'Cell detail']] as const) {
      fireEvent.mouseEnter(target, { clientY: 100 });
      expect(panel()?.style.display).not.toBe('block');
      fireEvent.mouseEnter(target.firstElementChild!, { clientY: 100 });
      expect(panel()).toHaveTextContent(detail);
      expect(panel()).toHaveStyle({ display: 'block' });
      fireEvent.mouseLeave(target.firstElementChild!);
      expect(panel()).toHaveStyle({ display: 'none' });
    }
  });

  it('keeps an HTML tooltip on rerender and hides it when its host unmounts', () => {
    const data: WfTableData = {
      headers: tableData.headers,
      data: [[cell(0), cell(1), cell(2, { displayValue: 'Fixture result', tooltip: '<b>Cell detail</b>' })]],
    };
    const { rerender, unmount } = render(<TrendTable tableData={data} isExpanded showVariance={false} />);
    fireEvent.mouseEnter(screen.getByText('Fixture result').closest('td')!.firstElementChild!, { clientY: 100 });
    const panel = document.querySelector('.wf-html-tooltip-panel');
    expect(panel).toHaveStyle({ display: 'block' });
    rerender(<TrendTable tableData={data} isExpanded showVariance />);
    expect(panel).toHaveStyle({ display: 'block' });
    unmount();
    expect(panel).toHaveStyle({ display: 'none' });
  });

  it('suppresses the cell HTML tooltip when an info message is present', () => {
    render(<TrendTable isExpanded showVariance={false} tableData={{
      headers: tableData.headers,
      data: [[cell(0), cell(1), cell(2, { displayValue: 'Fixture result', tooltip: '<b>Suppressed detail</b>', infoMessage: 'Info instead' })]],
    }} />);
    fireEvent.mouseEnter(screen.getByText('Fixture result').closest('td')!.firstElementChild!, { clientY: 100 });
    expect(document.querySelector<HTMLElement>('.wf-html-tooltip-panel')?.style.display).not.toBe('block');
  });

  it('keeps a cell alert inline with its value and opens the corresponding popup', () => {
    const alert = { type: 'warning' as const, title: 'Result notice', text: 'Fixture explanation' };
    const onAlert = vi.fn();
    render(<TrendTable isExpanded showVariance={false} onAlert={onAlert} tableData={{
      headers: ['Group', 'Measure', 'Current', 'Previous'],
      data: [[cell(0), cell(1), cell(2, { displayValue: 'Fixture result', alert }), cell(3)]],
    }} />);
    const button = screen.getByRole('button', { name: 'Result notice' });
    expect(screen.getByText('Fixture result').closest('.wf-table__value-cell')).toContainElement(button);
    fireEvent.click(button);
    expect(onAlert).toHaveBeenCalledExactlyOnceWith(alert);
  });

  it('hides zero-span headers and keeps double-goal metric and value columns distinct', () => {
    const data: WfTableData = {
      headers: [
        { text: 'Goals', val: '0', colSpan: 2 },
        { text: 'Hidden continuation', val: '1', colSpan: 0 },
        { text: 'Measure', val: '2', columnWidth: '145px' },
        { text: 'Result', val: '3', columnWidth: '160px' },
      ],
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(2, { displayValue: 'Measure name' }), cell(3, { displayValue: 'Result value' })]],
    };
    render(<TrendTable tableData={data} isExpanded showVariance />);
    expect(screen.queryByRole('columnheader', { name: 'Hidden continuation' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Goals' })).toHaveAttribute('colspan', '2');
    expect(screen.getByRole('columnheader', { name: 'Result' })).toHaveStyle({ width: '160px', minWidth: '160px', maxWidth: '160px' });
    expect(screen.getByText('Measure name').closest('.metric-name')).not.toBeNull();
    expect(screen.getByText('Result value').closest('td')).toHaveClass('right-align');
    expect(screen.getByText('v1').closest('td')).toHaveClass('wf-table__goals');
  });

  it('places the KPI expand control in the measure header and exposes its state', () => {
    const toggle = vi.fn();
    const { rerender } = render(
      <TrendTable tableData={{ ...tableData, kpiFilterEnabled: true }} isExpanded={false} showVariance={false} onToggleExpanded={toggle} />
    );
    const expand = screen.getByRole('button', { name: 'Expand all measures' });
    expect(expand.closest('th')).toHaveTextContent('Metric');
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(expand);
    expect(toggle).toHaveBeenCalledOnce();
    rerender(<TrendTable tableData={{ ...tableData, kpiFilterEnabled: true }} isExpanded showVariance={false} onToggleExpanded={toggle} />);
    expect(screen.getByRole('button', { name: 'Collapse to KPI only' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('uses the three-column and WFM source layout conditions without rotating WFM groups', () => {
    const { rerender } = render(<TrendTable tableData={tableData} isExpanded showVariance />);
    expect(screen.getByRole('table')).toHaveClass('wf-table-three-col', 'wf-table-fixed');
    expect(screen.getByText('$100').closest('td')).toHaveClass('left-align');
    expect(screen.getByText('Group A').closest('.transform-text')).not.toBeNull();
    rerender(<TrendTable tableData={tableData} isExpanded showVariance displayContext={{ isWfmPortal: true, isStore: true }} />);
    expect(screen.getByRole('table')).toHaveClass('wf-table-wfm', 'wf-table-wfm__store');
    expect(screen.getByText('Group A').closest('.transform-text')).toBeNull();
  });

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

  it('marks tags on the 360FM portal with the Angular wf-home__tag-WFM hook', () => {
    const tagData: WfTableData = {
      headers: tableData.headers,
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(2, { tags: 'KPI' })]],
    };
    const { container, rerender } = render(<TrendTable tableData={tagData} isExpanded showVariance={false} />);
    expect(container.querySelector('.wf-home__tag-WFM')).toBeNull();
    rerender(<TrendTable tableData={tagData} isExpanded showVariance={false} displayContext={{ isWfmPortal: true }} />);
    expect(container.querySelector('.wf-home__tag')).toHaveClass('wf-home__tag-WFM');
  });

  it('marks the first header with the Angular per-metric hook class', () => {
    const { rerender } = render(<TrendTable tableData={tableData} isExpanded showVariance={false} />);
    expect(screen.getByRole('columnheader', { name: 'Group' })).toHaveClass('wf-table__wf-first');
    expect(screen.getByRole('columnheader', { name: 'Metric' })).not.toHaveClass('wf-table__wf-first');
    rerender(<TrendTable tableData={tableData} isExpanded showVariance={false} metric="myPlan" />);
    expect(screen.getByRole('columnheader', { name: 'Group' })).toHaveClass('wf-table__myplan-first');
    expect(screen.getByRole('columnheader', { name: 'Group' })).not.toHaveClass('wf-table__wf-first');
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

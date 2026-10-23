// src/utils/tableTransform.ts
import type { WfTableData, WfTableHeader, WfTableCell } from '../types/wf.types';

const ALLOWED_COL_TYPES = new Set(['', 'parentNode', 'selectedNode', 'peerNode', 'childNode']);

export interface FilteredTableRow extends Array<WfTableCell> {
  isGroupEnd?: boolean;
}

export interface FilteredTableResult {
  headers: WfTableHeader[];
  rows: FilteredTableRow[];
}

function normalizeHeaders(headers: WfTableData['headers']): WfTableHeader[] {
  const isHeaderString = typeof headers[0] === 'string';
  if (isHeaderString) {
    return (headers as string[]).map((text) => ({ text, val: text, colType: '' }));
  }
  return headers as WfTableHeader[];
}

function getAllowedColumnIndexes(headers: WfTableHeader[]): number[] {
  return headers.reduce<number[]>((acc, header, idx) => {
    const colType = header.colType || '';
    if (ALLOWED_COL_TYPES.has(colType)) {
      acc.push(idx);
    }
    return acc;
  }, []);
}

export function filterTableData(tableData: WfTableData, isExpanded: boolean): FilteredTableResult {
  const normalizedHeaders = normalizeHeaders(tableData.headers);
  const allowedIndexes = getAllowedColumnIndexes(normalizedHeaders);
  const filteredHeaders = allowedIndexes.map((idx) => normalizedHeaders[idx]);

  const measureColumnId = tableData.measureColumnId ?? 1;
  const kpiFilterEnabled = tableData.kpiFilterEnabled === true;

  const filtered: FilteredTableRow[] = [];
  let currentGroupStartIdx = -1;
  let groupVisibleCount = 0;

  const finalizeGroup = () => {
    if (currentGroupStartIdx !== -1) {
      const groupCell = filtered[currentGroupStartIdx]?.find((c) => c.columnid === 0);
      if (groupCell) {
        groupCell.rowSpan = groupVisibleCount;
      }
    }
  };

  for (const row of tableData.data) {
    const originalGroupCell = row.find((c) => c.columnid === 0);
    const isNewGroup = !!originalGroupCell && (originalGroupCell.rowSpan ?? 0) > 0;

    if (isNewGroup) {
      finalizeGroup();
      groupVisibleCount = 0;
      currentGroupStartIdx = filtered.length;
    }

    const displayRow: FilteredTableRow = row
      .filter((cell) => allowedIndexes.includes(cell.columnid))
      .map((cell) => ({ ...cell }));
    const measureCell = displayRow.find((c) => c.columnid === measureColumnId);
    const isKpi = !!measureCell?.tags?.includes('KPI');

    const keepRow = !kpiFilterEnabled || isExpanded || isKpi;
    if (keepRow) {
      groupVisibleCount++;
      const groupCell = displayRow.find((c) => c.columnid === 0);
      if (groupCell) {
        groupCell.rowSpan = groupVisibleCount === 1 ? 1 : 0;
      }
      filtered.push(displayRow);
    }
  }
  finalizeGroup();

  // Second pass: compute isGroupEnd for spacer rows.
  let remaining = 0;
  filtered.forEach((row, idx) => {
    const groupCell = row[0];
    if (groupCell?.rowSpan && groupCell.rowSpan > 1) {
      remaining = groupCell.rowSpan - 1;
    } else if (remaining > 0) {
      remaining--;
    }
    row.isGroupEnd = remaining === 0 && idx !== filtered.length - 1;
  });

  return { headers: filteredHeaders, rows: filtered };
}

export function getCellBorderStyle(cell: WfTableCell): Record<string, string> {
  if (cell.borderLeftColor) {
    return { borderLeft: `4px solid ${cell.borderLeftColor}` };
  }
  if (cell.borderRightColor) {
    return { borderRight: `4px solid ${cell.borderRightColor}` };
  }
  if (cell.backgroundColor) {
    return { backgroundColor: cell.backgroundColor };
  }
  return {};
}

export function getHeaderTooltip(header: WfTableHeader): string {
  if (header.tooltip) {
    return header.tooltip.replace(/<[^>]*>/g, '');
  }
  return (header.text || '').replace(/<[^>]*>/g, '');
}

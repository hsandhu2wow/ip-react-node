// src/utils/tableTransform.ts
import type { WfTableData, WfTableHeader, WfTableCell } from '../types/wf.types';

const ALLOWED_COL_TYPES = ['', 'parentNode', 'selectedNode', 'peerNode', 'childNode'];
const CHILD_LEVEL_COL_TYPES = ['', 'parentNode', 'selectedNode', 'childNode'];
const PEER_LEVEL_COL_TYPES = ['', 'parentNode', 'selectedNode', 'peerNode'];

export interface WfTableDisplayContext {
  isMobile?: boolean;
  parentCode?: string;
  childCode?: string;
  hierarchyNode?: string;
  selectedDateFilter?: string;
  isWfmPortal?: boolean;
  toggleChildLevelKey?: string;
  showChildLevel?: boolean;
}

export interface FilteredTableRow extends Array<WfTableCell> {
  isGroupEnd?: boolean;
}

export interface FilteredTableResult {
  headers: WfTableHeader[];
  /** Original header index (cell columnid) for each entry in `headers`. */
  columnIds: number[];
  rows: FilteredTableRow[];
}

function normalizeHeaders(headers: WfTableData['headers']): WfTableHeader[] {
  const isHeaderString = typeof headers[0] === 'string';
  if (isHeaderString) {
    return (headers as string[]).map((text) => ({ text, val: text, colType: '' }));
  }
  return headers as WfTableHeader[];
}

// Absent context values never match, so missing header fields cannot select columns.
function matches(value: unknown, target: string | undefined): boolean {
  return target != null && value === target;
}

function getMobileColumnIndexes(headers: WfTableData['headers'], context: WfTableDisplayContext): number[] {
  const isHeaderString = typeof headers[0] === 'string';
  const { parentCode, childCode, selectedDateFilter } = context;
  const hierarchy = !context.hierarchyNode || context.isWfmPortal ? childCode : context.hierarchyNode;
  return headers.reduce<number[]>((acc, header, idx) => {
    const headerVal = isHeaderString ? (header as string) : (header as WfTableHeader).val;
    const headerText = isHeaderString ? undefined : (header as WfTableHeader).text;
    if (
      idx === 0 ||
      idx === 1 ||
      (headerVal !== '' &&
        (matches(headerVal, parentCode) ||
          (matches(headerVal, childCode) && childCode === hierarchy) ||
          matches(headerText, selectedDateFilter))) ||
      matches(headerVal, selectedDateFilter) ||
      (childCode !== hierarchy && matches(headerVal, hierarchy))
    ) {
      acc.push(idx);
    }
    return acc;
  }, []);
}

function getDesktopColumnIndexes(headers: WfTableHeader[], context: WfTableDisplayContext): number[] {
  let colTypesToKeep = ALLOWED_COL_TYPES;
  if (context.toggleChildLevelKey != null && context.toggleChildLevelKey !== '') {
    colTypesToKeep = context.showChildLevel ? CHILD_LEVEL_COL_TYPES : PEER_LEVEL_COL_TYPES;
  }
  return headers.reduce<number[]>((acc, header, idx) => {
    if (colTypesToKeep.includes(header.colType || '')) {
      acc.push(idx);
    }
    return acc;
  }, []);
}

export function filterTableData(
  tableData: WfTableData,
  isExpanded: boolean,
  context: WfTableDisplayContext = {},
): FilteredTableResult {
  const normalizedHeaders = normalizeHeaders(tableData.headers);
  const allowedIndexes = context.isMobile
    ? getMobileColumnIndexes(tableData.headers, context)
    : getDesktopColumnIndexes(normalizedHeaders, context);
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

  return { headers: filteredHeaders, columnIds: allowedIndexes, rows: filtered };
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

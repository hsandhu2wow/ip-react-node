import { Fragment } from 'react';
import { filterTableData, getCellBorderStyle, getHeaderTooltip } from '../../utils/tableTransform';
import type { WfTableData } from '../../types/wf.types';
import styles from './TrendTable.module.css';

interface TrendTableProps {
  tableData: WfTableData;
  isExpanded: boolean;
  showVariance: boolean;
}

export function TrendTable({ tableData, isExpanded, showVariance }: TrendTableProps) {
  const { headers, rows } = filterTableData(tableData, isExpanded);
  const tableClassName = [styles.table, 'wf-table', showVariance ? 'wf-table--show-variance' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.tableWrapper}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.val}
                className={[styles.headerCell, header.cssClass]
                  .filter(Boolean)
                  .join(' ')}
                colSpan={header.colSpan}
                title={getHeaderTooltip(header)}
              >
                {header.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <Fragment key={`row-${rowIdx}`}>
              <tr>
                {row.map((cell, cellIdx) => {
                  const header = headers[cellIdx];
                  if (cell.rowSpan === 0) {
                    return null;
                  }
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className={[styles.dataCell, header?.cssClass, cell.cssClass]
                        .filter(Boolean)
                        .join(' ')}
                      style={getCellBorderStyle(cell)}
                      rowSpan={cell.rowSpan}
                      title={cell.tooltip}
                    >
                      {cell.displayValue}
                    </td>
                  );
                })}
              </tr>
              {row.isGroupEnd && (
                <tr className={styles.spacerRow}>
                  <td colSpan={headers.length} />
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

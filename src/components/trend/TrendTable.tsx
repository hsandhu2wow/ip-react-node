import { Fragment } from 'react';
import { filterTableData, getCellBorderStyle, getHeaderTooltip } from '../../utils/tableTransform';
import type { WfTableData } from '../../types/wf.types';
import styles from './TrendTable.module.css';

interface TrendTableProps {
  tableData: WfTableData;
  isExpanded: boolean;
  showVariance: boolean;
}

function getTags(tags: string | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
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
            {headers.map((header, headerIdx) => {
              const isFirstOrSecond = headerIdx === 0 || headerIdx === 1;
              return (
                <th
                  key={header.val || headerIdx}
                  className={[
                    'wf-table__header',
                    styles.headerCell,
                    header.cssClass,
                    headerIdx === 1 ? 'wf-table__metric-name-header' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  colSpan={header.colSpan || 1}
                  title={getHeaderTooltip(header)}
                  style={isFirstOrSecond ? { position: 'sticky', left: headerIdx === 0 ? 0 : undefined } : undefined}
                >
                  <div className={[styles.thDiv, headerIdx === 1 ? 'metric-name' : ''].filter(Boolean).join(' ')}>
                    <span dangerouslySetInnerHTML={{ __html: header.text }} />
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <Fragment key={`row-${rowIdx}`}>
              <tr className={styles.rowLarge}>
                {row.map((cell, cellIdx) => {
                  const header = headers[cellIdx];
                  if (cell.rowSpan === 0) {
                    return null;
                  }
                  const tags = getTags(cell.tags);
                  const isFirstOrSecond = cellIdx === 0 || cellIdx === 1;
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className={['wf-table__data', styles.dataCell, header?.cssClass, cell.cssClass]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        ...getCellBorderStyle(cell),
                        ...(isFirstOrSecond ? { position: 'sticky', left: cellIdx === 0 ? 0 : undefined } : {}),
                      }}
                      rowSpan={cell.rowSpan || 1}
                      title={cell.infoMessage ? undefined : cell.tooltip}
                    >
                      <div className={[styles.tdDiv, cellIdx === 0 ? 'transform-text' : ''].filter(Boolean).join(' ')}>
                        <div className={cellIdx === 1 ? 'metric-name' : ''}>
                          <span
                            className={cellIdx > 1 ? 'wf-table__kpi-value' : ''}
                            style={cell.color ? { color: cell.color } : undefined}
                            dangerouslySetInnerHTML={{ __html: cell.displayValue }}
                          />
                        </div>
                        {(cell.infoMessage || tags.length > 0) && (
                          <div className={styles.metaRow}>
                            {cell.infoMessage && (
                              <span className={styles.infoIcon} title={cell.infoMessage}>
                                ⓘ
                              </span>
                            )}
                            {tags.length > 0 && (
                              <div className="wf-table__tags">
                                {tags.map((tag) => (
                                  <span key={tag} className="wf-home__tag" data-tag={tag}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
              {row.isGroupEnd && (
                <tr className={['wf-table__spacer-row', styles.spacerRow].join(' ')}>
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

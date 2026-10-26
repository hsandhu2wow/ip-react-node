import { Fragment } from 'react';
import { filterTableData, getCellBorderStyle, getHeaderTooltip } from '../../utils/tableTransform';
import type { WfTableDisplayContext } from '../../utils/tableTransform';
import { isHtmlTooltip, showHtmlTooltip, hideHtmlTooltip } from '../../utils/htmlTooltip';
import type { WfAlert, WfTableData } from '../../types/wf.types';
import { TREND_ALERT_ICONS } from './TrendInfoDialog';
import styles from './TrendTable.module.css';

interface TrendTableProps {
  tableData: WfTableData;
  isExpanded: boolean;
  showVariance: boolean;
  displayContext?: WfTableDisplayContext;
  onAlert?: (alert: WfAlert) => void;
}

function getTags(tags: string | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function htmlTooltipHandlers(html: string | null | undefined) {
  if (!html) return {};
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => showHtmlTooltip(e.currentTarget, html, e.clientX, e.clientY),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => hideHtmlTooltip(e.currentTarget),
  };
}

export function TrendTable({ tableData, isExpanded, showVariance, displayContext, onAlert }: TrendTableProps) {
  const { headers, columnIds, rows } = filterTableData(tableData, isExpanded, displayContext);
  const tableClassName = [styles.table, 'wf-table', showVariance ? 'wf-table--show-variance' : '']
    .filter(Boolean)
    .join(' ');

  return (
    // id/class swapped by QfCardsPreviewService.triggerPreview during print/download
    <div className={`${styles.tableWrapper} qf-scroll-container`} id="qf-scroll-container">
      <table className={tableClassName}>
        <thead>
          <tr>
            {headers.map((header, headerIdx) => {
              const isFirstOrSecond = headerIdx === 0 || headerIdx === 1;
              const htmlTooltip = isHtmlTooltip(header.tooltip) ? header.tooltip! : null;
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
                  title={htmlTooltip ? undefined : getHeaderTooltip(header)}
                  style={isFirstOrSecond ? { position: 'sticky', left: headerIdx === 0 ? 0 : undefined } : undefined}
                  {...htmlTooltipHandlers(htmlTooltip)}
                >
                  <div className={[styles.thDiv, headerIdx === 1 ? 'metric-name' : ''].filter(Boolean).join(' ')}>
                    {header.alert && onAlert && (
                      <button
                        type="button"
                        className={styles.alertButton}
                        aria-label={header.alert.title || 'Header alert'}
                        onClick={event => { event.stopPropagation(); if (header.alert) onAlert(header.alert); }}
                      >
                        <span className="material-icons" aria-hidden="true">{TREND_ALERT_ICONS[header.alert.type]}</span>
                      </button>
                    )}
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
                  const header = headers[columnIds.indexOf(cell.columnid)];
                  if (cell.rowSpan === 0) {
                    return null;
                  }
                  const tags = getTags(cell.tags);
                  const isFirstOrSecond = cellIdx === 0 || cellIdx === 1;
                  const cellClasses = ['wf-table__data', styles.dataCell, header?.cssClass, cell.cssClass]
                    .filter(Boolean)
                    .join(' ');
                  const isGoalCell = /(^|\s)(wf-table__goals|goal-tracker)(\s|$)/.test(cellClasses);
                  const isValueCell = cellIdx > 1 && !isGoalCell;
                  const htmlTooltip = !cell.infoMessage && isHtmlTooltip(cell.tooltip) ? cell.tooltip! : null;
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className={cellClasses}
                      style={{
                        ...getCellBorderStyle(cell),
                        ...(isFirstOrSecond ? { position: 'sticky', left: cellIdx === 0 ? 0 : undefined } : {}),
                      }}
                      rowSpan={cell.rowSpan || 1}
                      title={cell.infoMessage || htmlTooltip ? undefined : cell.tooltip}
                      {...htmlTooltipHandlers(htmlTooltip)}
                    >
                      {cell.alert && onAlert && (
                        <button
                          type="button"
                          className={styles.alertButton}
                          aria-label={cell.alert.title || 'Cell alert'}
                          onClick={event => { event.stopPropagation(); if (cell.alert) onAlert(cell.alert); }}
                        >
                          <span className="material-icons" aria-hidden="true">{TREND_ALERT_ICONS[cell.alert.type]}</span>
                        </button>
                      )}
                      <div
                        className={[
                          styles.tdDiv,
                          cellIdx === 0 ? 'transform-text' : '',
                          isValueCell ? 'wf-table__value-cell' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
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

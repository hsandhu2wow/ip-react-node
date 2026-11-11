import { Fragment } from 'react';
import { filterTableData, getCellBorderStyle, getHeaderTooltip } from '../utils/tableTransform';
import type { WfTableDisplayContext } from '../utils/tableTransform';
import { isHtmlTooltip, showHtmlTooltip, hideHtmlTooltip } from '../../../shared/utils/htmlTooltip';
import type { WfAlert, WfMetric, WfTableData } from '../types/wf.types';
import { TREND_ALERT_ICONS } from './TrendInfoDialog';
import styles from './TrendTable.module.scss';

interface TrendTableProps {
  tableData: WfTableData;
  isExpanded: boolean;
  showVariance: boolean;
  displayContext?: WfTableDisplayContext;
  onAlert?: (alert: WfAlert) => void;
  onToggleExpanded?: () => void;
  metric?: WfMetric;
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

export function TrendTable({ tableData, isExpanded, showVariance, displayContext, onAlert, onToggleExpanded, metric = 'weekly' }: TrendTableProps) {
  const { headers, columnIds, rows } = filterTableData(tableData, isExpanded, displayContext);
  const doubleGoals = headers[0]?.colSpan === 2;
  const metricIndex = doubleGoals ? 2 : 1;
  const threeColumns = !displayContext?.isMobile && !doubleGoals && headers.length === 3;
  const isWfm = displayContext?.isWfmPortal === true;
  const tableClassName = [
    styles.table, 'wf-table', isWfm ? 'wf-table-wfm' : 'wf-table-fixed',
    isWfm && displayContext?.isStore ? 'wf-table-wfm__store' : '',
    threeColumns ? 'wf-table-three-col' : '',
    displayContext?.isMobile ? 'wf-table-mobile' : '',
    showVariance ? 'wf-table--show-variance' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const firstWidth = headers[0]?.columnWidth || (isWfm ? '84px'
    : metric === 'myPlan' && !displayContext?.isMobile && !displayContext?.isCompact ? '44px' : '32px');
  const secondOffset = doubleGoals ? `calc(${firstWidth} + ${headers[1]?.columnWidth || '44px'})` : firstWidth;

  return (
    // id/class swapped by QfCardsPreviewService.triggerPreview during print/download
    <div className={`${styles.tableWrapper} qf-scroll-container`} id="qf-scroll-container">
      <table className={tableClassName}>
        <thead>
          <tr>
            {headers.map((header, headerIdx) => {
              if (header.colSpan === 0) return null;
              const isMetric = headerIdx === metricIndex;
              const width = header.columnWidth || (headerIdx === 0 ? firstWidth : isMetric ? '145px' : undefined);
              const htmlTooltip = isHtmlTooltip(header.tooltip) ? header.tooltip! : null;
              return (
                <th
                  key={header.val || headerIdx}
                  className={[
                    'wf-table__header',
                    styles.headerCell,
                    header.cssClass,
                    isMetric ? 'wf-table__metric-name-header' : '',
                    headerIdx > metricIndex ? threeColumns ? 'left-align' : 'right-align' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  colSpan={header.colSpan ?? 1}
                  title={htmlTooltip ? undefined : getHeaderTooltip(header)}
                  style={{
                    ...(width ? { width, minWidth: width, maxWidth: width } : {}),
                    ...(headerIdx <= metricIndex ? {
                      position: 'sticky', left: headerIdx === 0 ? 0 : headerIdx === metricIndex ? secondOffset : firstWidth,
                    } : {}),
                  }}
                  {...htmlTooltipHandlers(htmlTooltip)}
                >
                  <div className={styles.thDiv}>
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
                    <span className={isMetric ? 'metric-name' : undefined} dangerouslySetInnerHTML={{ __html: header.text }} />
                    {headerIdx === 1 && tableData.kpiFilterEnabled && onToggleExpanded && (
                      <button type="button" className={styles.expandButton}
                        aria-label={isExpanded ? 'Collapse to KPI only' : 'Expand all measures'}
                        title={isExpanded ? 'Collapse to KPI only' : 'Expand all measures'}
                        aria-expanded={isExpanded}
                        onClick={event => { event.stopPropagation(); onToggleExpanded(); }}>
                        <span className="material-icons" aria-hidden="true">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                      </button>
                    )}
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
                  const index = columnIds.indexOf(cell.columnid);
                  const header = headers[index];
                  if (cell.rowSpan === 0) {
                    return null;
                  }
                  const tags = getTags(cell.tags);
                  const isMetric = index === metricIndex;
                  const cellClasses = [
                    'wf-table__data', styles.dataCell, header?.cssClass, cell.cssClass,
                    index < metricIndex ? 'wf-table__goals' : '',
                    index > metricIndex ? threeColumns ? 'left-align' : 'right-align' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const isGoalCell = /(^|\s)(wf-table__goals|goal-tracker)(\s|$)/.test(cellClasses);
                  const isValueCell = index > metricIndex && !isGoalCell;
                  const htmlTooltip = !cell.infoMessage && isHtmlTooltip(cell.tooltip) ? cell.tooltip! : null;
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className={cellClasses}
                      style={{
                        ...getCellBorderStyle(cell),
                        ...(index <= metricIndex ? {
                          position: 'sticky', left: index === 0 ? 0 : index === metricIndex ? secondOffset : firstWidth,
                        } : {}),
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
                          index === 0 && !isWfm ? 'transform-text' : '',
                          isValueCell ? 'wf-table__value-cell' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className={isMetric ? 'metric-name' : ''}>
                          <span
                            className={index > metricIndex ? 'wf-table__kpi-value' : ''}
                            style={cell.color ? { color: cell.color } : undefined}
                            dangerouslySetInnerHTML={{ __html: cell.displayValue }}
                          />
                        </div>
                        {(cell.infoMessage || tags.length > 0) && (
                          <div className={styles.metaRow}>
                            {cell.infoMessage && (
                              <span className={`material-icons ${styles.infoIcon}`} title={cell.infoMessage}>
                                info_outlined
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

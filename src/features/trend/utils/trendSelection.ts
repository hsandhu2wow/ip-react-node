import type { WfCardData, WfCardContents, WfMetric, WfPageData } from '../types/wf.types';

export interface TrendSelection {
  cardKey: string;
  date: string;
  hierarchy: string;
  contents?: WfCardContents;
}

type TrendSelectionAction = { type: 'view' | 'date' | 'hierarchy'; value: string };

function initialContents(card: WfCardData | undefined, date: string, hierarchy: string): WfCardContents | undefined {
  if (!Array.isArray(card?.cardContents)) return card?.cardContents;
  const dateMatch = date
    ? card.cardContents.find(contents => contents[card.dateFilterKey || 'weekNo'] === date)
    : undefined;
  return dateMatch || (hierarchy
    ? card.cardContents.find(contents => contents.filterKey === hierarchy)
    : undefined);
}

export function createTrendSelection(page: WfPageData | undefined, isMobile = false): TrendSelection {
  const card = isMobile ? page?.cards.find(item => item.hasMobileView) : page?.cards[0];
  const hierarchy = page?.hierarchyDropdown?.filterDropdown[0]?.filterKey || '';
  const date = card?.dateFilterValues?.[0] || '';
  return {
    cardKey: card?.key || '',
    hierarchy,
    date,
    contents: isMobile && Array.isArray(card?.cardContents)
      ? card.cardContents[0]
      : initialContents(card, date, hierarchy),
  };
}

export function updateMobileTrendSelection(
  page: WfPageData, selection: TrendSelection, metric: WfMetric, tab: string, date: string,
): TrendSelection {
  const card = page.cards.find(item => metric === 'myPlan' && tab === 'Half Year'
    ? item.dateFilterKey === 'half_year' && item.half_year === date
    : item.hasMobileView && (item.mobileDateFilterTabName || '') === tab);
  if (!card) return selection;
  return updateTrendSelection(page, { ...selection, cardKey: card.key }, { type: 'date', value: date });
}

export function updateTrendSelection(
  page: WfPageData, selection: TrendSelection, action: TrendSelectionAction
): TrendSelection {
  const cardKey = action.type === 'view' ? action.value : selection.cardKey;
  const card = page.cards.find(item => item.key === cardKey);
  if (action.type === 'view') {
    const date = card?.dateFilterValues?.[0] || '';
    return { ...selection, cardKey, date, contents: initialContents(card, date, selection.hierarchy) };
  }

  const next = {
    ...selection,
    date: action.type === 'date' ? action.value : selection.date,
    hierarchy: action.type === 'hierarchy' ? action.value : selection.hierarchy,
  };
  if (!Array.isArray(card?.cardContents)) return { ...next, contents: card?.cardContents };
  const hierarchyAllowed = page.hierarchyDropdown?.allowedViews?.includes(cardKey) === true;
  const dateKey = card.dateFilterKey || 'weekNo';
  const contents = action.type === 'hierarchy'
    ? card.cardContents.find(item => item.filterKey === next.hierarchy &&
      (!card.hasHistoryData || !hierarchyAllowed || item[dateKey] === next.date))
    : (card.hasHistoryData
      ? card.cardContents.find(item => item[dateKey] === next.date)
      : undefined) || (hierarchyAllowed && next.hierarchy
      ? card.cardContents.find(item => item.filterKey === next.hierarchy)
      : undefined);

  // Angular leaves the displayed table unchanged when a filter finds no match.
  return { ...next, contents: contents ?? selection.contents };
}

import type { WfCardData, WfCardContents, WfPageData } from '../types/wf.types';

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

export function createTrendSelection(page: WfPageData | undefined): TrendSelection {
  const card = page?.cards[0];
  const hierarchy = page?.hierarchyDropdown?.filterDropdown[0]?.filterKey || '';
  const date = card?.dateFilterValues?.[0] || '';
  return {
    cardKey: card?.key || '',
    hierarchy,
    date,
    contents: initialContents(card, date, hierarchy),
  };
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

// src/components/trend/subscription.ts
// Pure helpers ported from Angular WeeklyFactsHomeComponent.openSubscriptionPopup and
// EmailSubscriptionPopupComponent (store-insights).
import type { WfMetric, WfPageData, WfSubscriptionKey } from '../types/wf.types'

export interface SubscriptionView {
  name: string
  displayName: string
  checked: boolean
}

/** WeeklyFactsService.openSubscriptionPopup: 'wf' for weekly, 'myplan' for My Plan */
export function getSubscriptionKey(metric: WfMetric): WfSubscriptionKey {
  return metric === 'weekly' ? 'wf' : 'myplan'
}

export function getSubscriptionDisplayName(metric: WfMetric): string {
  return metric === 'weekly' ? 'Weekly Facts' : 'My Plan'
}

/** Views offered = page cards (in card order) whose key is listed in `available_views`. */
export function buildAvailableViews(pageData: WfPageData | undefined): SubscriptionView[] {
  if (!pageData?.available_views) return []
  const available = pageData.available_views
  return pageData.cards
    .filter(card => available.includes(card.key))
    .map(card => ({ displayName: card.displayName, name: card.key, checked: false }))
}

/** Delivery schedule note ("Please note you will be receiving emails on …"). */
export function buildPsNote(key: WfSubscriptionKey, views: SubscriptionView[]): { label: string; text: string }[] {
  if (key === 'myplan') return [{ label: 'Monthly Overview:', text: 'Every 2nd Tuesday of the Fiscal Month' }]
  const note: { label: string; text: string }[] = []
  views.forEach(view => {
    if (view.name === 'week_overview' || view.name === 'weekly_trend') {
      note.push({ label: 'Weekly Overview:', text: 'Every Monday, Tuesday and Wednesday' })
    }
    if (view.name === 'monthly_trend') {
      note.push({ label: 'Monthly Trend:', text: 'Every 2nd Monday of the Fiscal Month' })
    }
  })
  return note
}

/** Views are mandatory: when any views are offered, at least one must stay checked. */
export function isViewSelectionInvalid(views: SubscriptionView[]): boolean {
  return views.length > 0 && !views.some(view => view.checked)
}

/**
 * Locations are mandatory only when subscribing for the first time (no saved locations,
 * i.e. initialNodes is '[]'); existing subscribers may deselect everything to unsubscribe.
 */
export function isLocationSelectionInvalid(isStoreUser: boolean, selectedCount: number, initialNodes: string): boolean {
  return !isStoreUser && selectedCount === 0 && initialNodes === '[]'
}

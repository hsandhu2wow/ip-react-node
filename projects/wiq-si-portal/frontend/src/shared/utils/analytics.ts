import { getUserDetails } from '../api/users'

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] }

/** Angular SqfCardsService.sendQFDataToAnalytics — GA4 event via the GTM dataLayer. */
export async function sendQFDataToAnalytics(eventType: string, cardName: string | undefined, location: string | undefined) {
  const start = new Date().getTime()
  const user = await getUserDetails()
  const w = window as DataLayerWindow
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({
    'gtm.start': start,
    event: 'quick_facts_element_click',
    employeeNumber: user.employee_number,
    siRole: user.Store_Insights_Role,
    quickFactEventType: eventType,
    quickFactCardType: cardName,
    selectedLocation: location,
  })
}

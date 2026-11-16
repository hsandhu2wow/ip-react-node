import client from './client'

/** Angular services/alerts/typings/IAlert.d.ts — admin-managed banner and pop-up alerts. */
export interface IAlert {
  id: number
  type: string
  active?: number | null
  sqf?: number | null
  sqa?: number | null
  wf?: number | null
  myplan?: number | null
  bi?: number | null
  bqf?: number | null
  psf?: number | null
  removable?: number
  text?: string
  hyperText?: string
  icon?: string
  created_at?: string
  expiry_date?: string
  pop_up?: number | null
}

const ICONS: Record<string, string> = {
  new: 'new_releases',
  warning: 'error',
  danger: 'priority_high',
  info: 'info',
  success: 'done',
}

// AlertsService.getAlerts('quick-facts'): `active` only guards `sqf` (operator precedence),
// so inactive sqa/wf/myplan alerts are kept — preserved for parity.
function quickFactsAlerts(data: unknown): IAlert[] {
  if (!Array.isArray(data)) return []
  return (data as IAlert[])
    .filter(alert => (alert.active && alert.sqf) || alert.sqa || alert.wf || alert.myplan)
    .map(alert => ({ ...alert, icon: ICONS[alert.type] }))
}

/** GET /alerts (Angular AlertsService.getAlerts for the quick-facts route) */
export async function getAlerts(): Promise<IAlert[]> {
  return quickFactsAlerts((await client.get<IAlert[]>('/alerts')).data)
}

/** GET /popUpAlerts (Angular AlertsService.getPopUpAlerts for the quick-facts route) */
export async function getPopUpAlerts(): Promise<IAlert[]> {
  return quickFactsAlerts((await client.get<IAlert[]>('/popUpAlerts')).data)
}

/** POST /popUpAlerts/read — multipart `payload` holding the acknowledged alerts as JSON */
export async function markPopUpAlertsRead(alerts: IAlert[]): Promise<unknown> {
  const form = new FormData()
  form.append('payload', JSON.stringify(alerts))
  return (await client.post('/popUpAlerts/read', form)).data
}

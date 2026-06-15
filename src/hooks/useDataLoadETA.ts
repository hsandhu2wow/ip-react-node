import { useQuery } from '@tanstack/react-query'
import { getDataLoadETA } from '../api/sqf'
import type { ETAMap, IDataLoadETA } from '../types/sqf.types'

// Maps METRIC field from API to card name keys used in the app
const METRIC_KEY_MAP: Record<string, string> = {
  Sales: 'sales',
  Stockloss: 'stockloss',
  'Online-Sales': 'online',
  VOC: 'voc',
  WMD: 'wmd',
  Wages: 'wages',
  Event: 'seasonal',
  LSM: 'lsm',
  Availability: 'availability',
  StoreProcess: 'storeprocess',
  RT3: 'rt3',
}

function mapToETAMap(raw: IDataLoadETA[]): ETAMap {
  const eta: ETAMap = {}
  raw.forEach(entry => {
    const [hh, mm, ss] = entry.Expected_Time.split(':').map(Number)
    // Construct the cut-off time using today's UTC date + the API's UTC time
    const now = new Date()
    const cutOff = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh, mm, ss)
    )
    const key = METRIC_KEY_MAP[entry.METRIC] || entry.METRIC
    eta[key] = { time: cutOff }
  })
  return eta
}

export function useDataLoadETA() {
  return useQuery({
    queryKey: ['sqf', 'data-load-eta'],
    queryFn: async () => {
      const raw = await getDataLoadETA()
      return mapToETAMap(raw)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })
}

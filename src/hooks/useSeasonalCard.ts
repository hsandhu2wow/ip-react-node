import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSeasonalCards } from '../api/sqf'
import { useFilter } from '../context/FilterContext'
import { useCFCChildCodes } from './useCFCChildCodes'
import { useDataLoadETA } from './useDataLoadETA'
import { useSupportEmail } from './useSupportEmail'
import type { IAvailableCardConfig } from '../types/sqf.types'
import { stampCutOffTimes } from '../utils/eta'

export function useSeasonalCard(config?: IAvailableCardConfig, forDetails = false, enabled = true) {
  const { selectedNode, selectedDate, isLoaded } = useFilter()
  const eta = useDataLoadETA().data
  const supportEmail = useSupportEmail().data
  const available = isLoaded && !!selectedNode && enabled && !!config?.[forDetails ? 'details' : 'summary']
  const needsCFC = !!(config?.hide_cfc || config?.show_only_cfc)
  const cfcQuery = useCFCChildCodes(available && needsCFC)
  const query = useQuery({
    queryKey: ['sqf', 'seasonal', forDetails ? 'details' : 'summary', selectedNode?.apiDepth, selectedNode?.code, selectedDate, config, cfcQuery.data],
    queryFn: () => fetchSeasonalCards({
      node: selectedNode!, date: selectedDate, config, forDetails,
      cfcChildCodes: cfcQuery.data, supportEmail,
    }),
    enabled: available && (!needsCFC || cfcQuery.isSuccess),
    staleTime: 0,
  })
  const data = useMemo(() => query.data && stampCutOffTimes(query.data, eta, selectedDate).map(card =>
    card.status === 'error-NoDataFound' && card.error
      ? { ...card, error: { ...card.error, generic: !card.error.cutOffTime } }
      : card,
  ), [query.data, eta, selectedDate])
  return { ...query, data, isLoading: query.isLoading || (available && needsCFC && cfcQuery.isLoading), isError: query.isError || (available && needsCFC && cfcQuery.isError) }
}

// src/context/FilterContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { IQFTree } from '../types/sqf.types'
import { formatDate, getYesterdayDate } from '../utils/formatters'
import { flattenTree, findNodeByCode, getFirstSelectableNode, addParents } from '../utils/tree'
import { processFilterResponse } from '../utils/tree'
import type { ISQFGenericFilter, Period, BreakdownAxis } from '../types/sqf.types'

interface FilterContextType {
  /** Flat list of all selectable nodes — used by the location dropdown */
  treeNodes: IQFTree[]
  /** Currently selected location node */
  selectedNode: IQFTree | null
  /** Currently selected date as "yyyy-MM-dd" */
  selectedDate: string
  /** True once the tree is loaded and a node is selected */
  isLoaded: boolean
  /** Called by useFilterTree once the raw API response arrives */
  initTree: (raw: ISQFGenericFilter[]) => void
  setSelectedNode: (node: IQFTree) => void
  setSelectedDate: (date: string) => void
  /** Reporting period shown on cards (WTD / YDAY). Persisted in ?period= */
  selectedPeriod: Period
  /** Breakdown axis for cards (child level / department). Persisted in ?axis=; never reset on navigation */
  selectedBreakdownAxis: BreakdownAxis
  setSelectedPeriod: (period: Period) => void
  setSelectedBreakdownAxis: (axis: BreakdownAxis) => void
  /** Increments on every user breakdown selection (Angular breakdownAxisUpdated$ emissions) */
  breakdownAxisChangeCount: number
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [treeNodes, setTreeNodes] = useState<IQFTree[]>([])
  const code = searchParams.get('code')
  const selectedNode = useMemo(
    () => (code ? findNodeByCode(treeNodes, code) : null) || getFirstSelectableNode(treeNodes),
    [treeNodes, code],
  )
  const [defaultDate] = useState(() => formatDate(getYesterdayDate()))
  const selectedDate = searchParams.get('date') || defaultDate

  /**
   * Called once by useFilterTree when the raw filter response arrives.
   * Processes the tree and sets parent refs; the selected node follows ?code=.
   */
  const initTree = useCallback(
    (raw: ISQFGenericFilter[]) => {
      const tree = processFilterResponse(raw)
      if (!tree) return // empty/invalid API response — stay in loading state
      addParents(tree)
      setTreeNodes(flattenTree(tree))
    },
    []
  )

  const setSelectedNode = useCallback(
    (node: IQFTree) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('code', node.code)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setSelectedDate = useCallback(
    (date: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('date', date)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const selectedPeriod: Period = searchParams.get('period') === 'YDAY' ? 'YDAY' : 'WTD'
  const selectedBreakdownAxis: BreakdownAxis = searchParams.get('axis') === 'department' ? 'department' : 'childLevel'

  const setSelectedPeriod = useCallback(
    (period: Period) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('period', period)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const [breakdownAxisChangeCount, setBreakdownAxisChangeCount] = useState(0)

  const setSelectedBreakdownAxis = useCallback(
    (axis: BreakdownAxis) => {
      setBreakdownAxisChangeCount(c => c + 1)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('axis', axis)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const isLoaded = treeNodes.length > 0 && selectedNode !== null

  return (
    <FilterContext.Provider
      value={{
        treeNodes,
        selectedNode,
        selectedDate,
        isLoaded,
        initTree,
        setSelectedNode,
        setSelectedDate,
        selectedPeriod,
        selectedBreakdownAxis,
        setSelectedPeriod,
        setSelectedBreakdownAxis,
        breakdownAxisChangeCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter(): FilterContextType {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilter must be used within a FilterProvider')
  return ctx
}

/** Like useFilter, but returns null outside a FilterProvider (e.g. isolated card renders). */
export function useOptionalFilter(): FilterContextType | null {
  return useContext(FilterContext)
}

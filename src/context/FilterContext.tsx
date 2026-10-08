// src/context/FilterContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
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
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [treeNodes, setTreeNodes] = useState<IQFTree[]>([])
  const [selectedNode, setSelectedNodeState] = useState<IQFTree | null>(null)

  // Initialise date from URL ?date= param, defaulting to yesterday
  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    return searchParams.get('date') || formatDate(getYesterdayDate())
  })

  /**
   * Called once by useFilterTree when the raw filter response arrives.
   * Processes the tree, sets parent refs, and restores the node from ?code= param.
   */
  const initTree = useCallback(
    (raw: ISQFGenericFilter[]) => {
      const tree = processFilterResponse(raw)
      if (!tree) return // empty/invalid API response — stay in loading state
      addParents(tree)
      const flat = flattenTree(tree)
      setTreeNodes(flat)

      const code = searchParams.get('code')
      const restoredNode = code ? findNodeByCode(flat, code) : null
      const defaultNode = restoredNode || getFirstSelectableNode(flat)
      if (defaultNode) setSelectedNodeState(defaultNode)
    },
    // searchParams is stable for the lifetime of this context mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const setSelectedNode = useCallback(
    (node: IQFTree) => {
      setSelectedNodeState(node)
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
      setSelectedDateState(date)
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

  const [selectedPeriod, setSelectedPeriodState] = useState<Period>(() =>
    searchParams.get('period') === 'YDAY' ? 'YDAY' : 'WTD'
  )
  const [selectedBreakdownAxis, setSelectedAxisState] = useState<BreakdownAxis>(() =>
    searchParams.get('axis') === 'department' ? 'department' : 'childLevel'
  )

  const setSelectedPeriod = useCallback(
    (period: Period) => {
      setSelectedPeriodState(period)
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

  const setSelectedBreakdownAxis = useCallback(
    (axis: BreakdownAxis) => {
      setSelectedAxisState(axis)
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

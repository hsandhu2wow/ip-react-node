import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return { ...actual, useMemo: (fn: () => any) => fn() }
})
vi.mock('./useSummaryCards', () => ({
  useSummaryCards: vi.fn(),
}))
vi.mock('./useCardStatus', () => ({
  useCardStatus: vi.fn(),
}))
vi.mock('../context/FilterContext', () => ({
  useFilter: vi.fn(),
}))

import { useEnrichedSummaryCards } from './useEnrichedSummaryCards'
import { useSummaryCards } from './useSummaryCards'
import { useCardStatus } from './useCardStatus'
import { useFilter } from '../context/FilterContext'

const mockUseSummaryCards = useSummaryCards as ReturnType<typeof vi.fn>
const mockUseCardStatus = useCardStatus as ReturnType<typeof vi.fn>
const mockUseFilter = useFilter as ReturnType<typeof vi.fn>

function setup({
  cards = [],
  cardStatus = {},
  apiDepth = 2,
  isCardsLoading = false,
  isStatusLoading = false,
}: {
  cards?: any[]
  cardStatus?: Record<string, any>
  apiDepth?: number
  isCardsLoading?: boolean
  isStatusLoading?: boolean
} = {}) {
  mockUseSummaryCards.mockReturnValue({ data: cards, isLoading: isCardsLoading, isError: false })
  mockUseCardStatus.mockReturnValue({ data: cardStatus, isLoading: isStatusLoading, isError: false })
  mockUseFilter.mockReturnValue({ selectedNode: { apiDepth }, isLoaded: true })
  return useEnrichedSummaryCards()
}

describe('useEnrichedSummaryCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets isDetailsPageAvailable=true when details=true and apiDepth within limit', () => {
    const result = setup({
      cards: [{ cardName: 'sales', cardType: 'summary' }],
      cardStatus: { sales: { details: true, details_last_level: 3, sequence: 1 } },
      apiDepth: 2,
    })
    expect(result.data?.[0].isDetailsPageAvailable).toBe(true)
  })

  it('sets isDetailsPageAvailable=false when details=false', () => {
    const result = setup({
      cards: [{ cardName: 'sales', cardType: 'summary' }],
      cardStatus: { sales: { details: false, details_last_level: 3, sequence: 1 } },
      apiDepth: 2,
    })
    expect(result.data?.[0].isDetailsPageAvailable).toBe(false)
  })

  it('sets isDetailsPageAvailable=false when apiDepth exceeds details_last_level', () => {
    const result = setup({
      cards: [{ cardName: 'sales', cardType: 'summary' }],
      cardStatus: { sales: { details: true, details_last_level: 1, sequence: 1 } },
      apiDepth: 2,
    })
    expect(result.data?.[0].isDetailsPageAvailable).toBe(false)
  })

  it('returns empty array when cards are undefined', () => {
    const result = setup({ cards: undefined as any })
    expect(result.data).toEqual([])
  })

  it('isLoading=true while either query is pending', () => {
    const result = setup({ isCardsLoading: true })
    expect(result.isLoading).toBe(true)
  })

  it('isLoading=true when cardStatus query is pending', () => {
    const result = setup({ isStatusLoading: true })
    expect(result.isLoading).toBe(true)
  })

  it('isLoading=false when both queries resolve', () => {
    const result = setup({ isCardsLoading: false, isStatusLoading: false })
    expect(result.isLoading).toBe(false)
  })

  it('returns cardStatus for consumers to use', () => {
    const cardStatus = { sales: { details: true, details_last_level: 3, sequence: 1 } }
    const result = setup({ cardStatus })
    expect(result.cardStatus).toEqual(cardStatus)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../shared/context/FilterContext', () => ({ useFilter: vi.fn() }))
vi.mock('../../hooks/useFilterTree', () => ({ useFilterTree: vi.fn() }))
vi.mock('../../../features/quick-facts/hooks/useSummaryCards', () => ({ useSummaryCards: vi.fn() }))
vi.mock('../../../features/quick-facts/hooks/useDetailsCard', () => ({ useDetailsCard: vi.fn() }))
const sendAnalytics = vi.fn()
vi.mock('../../../shared/utils/analytics', () => ({ sendQFDataToAnalytics: (...a: unknown[]) => sendAnalytics(...a) }))
vi.mock('./LocationTree', () => ({ LocationTree: () => null }))
vi.mock('../../../shared/components/FeedbackDialog/FeedbackDialog', () => ({
  FeedbackDialog: ({ open, header }: { open: boolean; header?: string }) =>
    open ? <div data-testid="feedback-dialog">{header ?? 'no-header'}</div> : null,
}))
vi.mock('../../../features/trend/context/TrendActionsContext', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../features/trend/context/TrendActionsContext')>()),
  useTrendActions: vi.fn(),
}))
vi.mock('../../../features/quick-facts/hooks/useCFCChildCodes', () => ({ useCFCChildCodes: () => ({ data: undefined }) }))
vi.mock('../../../features/quick-facts/hooks/useCardStatus', () => ({
  useCardStatus: () => ({
    data: {
      stockloss: { titleText: 'Stock Loss', sequence: 2, details: 1, details_last_level: 5 },
      sales: { titleText: 'Sales', sequence: 1, details: 1, details_last_level: 5 },
      voc: { titleText: 'VOC', sequence: 3, details: 0 },
      cfc: { titleText: 'CFC', sequence: 4, details: 1, show_only_cfc: 1 },
    },
  }),
}))

import { FilterBar } from './FilterBar'
import { useFilter } from '../../../shared/context/FilterContext'
import { useSummaryCards } from '../../../features/quick-facts/hooks/useSummaryCards'
import { useDetailsCard } from '../../../features/quick-facts/hooks/useDetailsCard'
import { useTrendActions, DEFAULT_TREND_ACTIONS } from '../../../features/trend/context/TrendActionsContext'

const mockFilter = useFilter as ReturnType<typeof vi.fn>
const mockSummary = useSummaryCards as ReturnType<typeof vi.fn>
const mockDetails = useDetailsCard as ReturnType<typeof vi.fn>
const mockTrendActions = useTrendActions as ReturnType<typeof vi.fn>

const setPeriod = vi.fn()
const setAxis = vi.fn()
const card = { cardName: 'a', cardType: 'summary' }

function setup(opts: { path?: string; levelDesc?: string; summary?: unknown } = {}) {
  mockFilter.mockReturnValue({
    selectedNode: { name: 'N', code: '1', level_desc: opts.levelDesc ?? 'National', children: [{ level_desc: 'Zone' }] },
    selectedDate: '2026-10-01',
    isLoaded: true,
    setSelectedNode: vi.fn(),
    setSelectedDate: vi.fn(),
    selectedPeriod: 'WTD',
    selectedBreakdownAxis: 'childLevel',
    setSelectedPeriod: setPeriod,
    setSelectedBreakdownAxis: setAxis,
  })
  mockSummary.mockReturnValue({ data: opts.summary ?? { WTD: [card], YDAY: [card] } })
  mockDetails.mockReturnValue({ data: undefined })
  if (!mockTrendActions.getMockImplementation()) mockTrendActions.mockReturnValue(DEFAULT_TREND_ACTIONS)
  return render(
    <MemoryRouter initialEntries={[opts.path ?? '/quick-facts/summary']}>
      <FilterBar />
    </MemoryRouter>
  )
}

describe('FilterBar period/breakdown controls', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows both controls on the summary page with two periods', () => {
    setup()
    expect(screen.getByLabelText('Reporting period')).toBeDefined()
    expect(screen.getByLabelText('Breakdown').textContent).toContain('Zones')
  })

  it('hides the period control when only one period came back', () => {
    setup({ summary: { WTD: [card] } })
    expect(screen.queryByLabelText('Reporting period')).toBeNull()
  })

  it('hides the breakdown control at Store level', () => {
    setup({ levelDesc: 'Store' })
    expect(screen.queryByLabelText('Breakdown')).toBeNull()
  })

  it('hides both controls on other pages', () => {
    setup({ path: '/quick-facts/weekly' })
    expect(screen.queryByLabelText('Reporting period')).toBeNull()
    expect(screen.queryByLabelText('Breakdown')).toBeNull()
  })

  it('updates period and axis on selection', () => {
    setup()
    fireEvent.click(screen.getByLabelText('Reporting period'))
    fireEvent.click(screen.getByRole('option', { name: 'Day' }))
    expect(setPeriod).toHaveBeenCalledWith('YDAY')
    fireEvent.click(screen.getByLabelText('Breakdown'))
    fireEvent.click(screen.getByRole('option', { name: 'Departments' }))
    expect(setAxis).toHaveBeenCalledWith('department')
  })

  it('sends Angular period/axis analytics with an empty card name on the summary page', () => {
    setup()
    fireEvent.click(screen.getByLabelText('Reporting period'))
    fireEvent.click(screen.getByRole('option', { name: 'Day' }))
    expect(sendAnalytics).toHaveBeenCalledWith('periodChangeYDAY', '', '1')
    fireEvent.click(screen.getByLabelText('Breakdown'))
    fireEvent.click(screen.getByRole('option', { name: 'Departments' }))
    expect(sendAnalytics).toHaveBeenCalledWith('breakdownAxisChangeDepartment', '', '1')
  })

  it('sends the details card name with axis analytics on a details page', () => {
    mockDetails.mockReturnValue({ data: undefined })
    setup({ path: '/quick-facts/details/sales' })
    fireEvent.click(screen.getByLabelText('Breakdown'))
    fireEvent.click(screen.getByRole('option', { name: 'Departments' }))
    expect(sendAnalytics).toHaveBeenCalledWith('breakdownAxisChangeDepartment', 'sales', '1')
  })
})

describe('FilterBar layout parity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders period before the date, then breakdown (Angular order)', () => {
    setup()
    const order = ['Reporting period', 'Breakdown'].map(l => screen.getByLabelText(l))
    const date = screen.getByText('01 Oct')
    expect(order[0].compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(date.compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows a card-type dropdown on details pages ordered by sequence', () => {
    setup({ path: '/quick-facts/details/stockloss' })
    const trigger = screen.getByLabelText('Card type')
    expect(trigger.textContent).toContain('Stock Loss')
    fireEvent.click(trigger)
    const items = screen.getAllByRole('menuitem')
    expect(items.map(i => i.textContent)).toEqual(['Sales', 'Stock Loss'])
    expect(items[0].getAttribute('href')).toBe('/quick-facts/details/sales')
  })

  it('hides the card-type dropdown on the summary page', () => {
    setup()
    expect(screen.queryByLabelText('Card type')).toBeNull()
  })
})

describe('FilterBar header actions (Angular sqf-filter right section)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTrendActions.mockReset()
  })

  it('opens the feedback popup with the selected card type as header on details pages', () => {
    setup({ path: '/quick-facts/details/sales' })
    fireEvent.click(screen.getByLabelText('Send feedback'))
    expect(screen.getByTestId('feedback-dialog').textContent).toBe('Sales')
  })

  it('hides AI insights and subscription buttons when not enabled', () => {
    setup({ path: '/quick-facts/weekly' })
    expect(screen.queryByText('AI Insights')).toBeNull()
    expect(screen.queryByLabelText('Subscription preferences')).toBeNull()
  })

  it('shows AI insights and subscription buttons from trend actions', () => {
    const toggleAiInsights = vi.fn()
    const openSubscription = vi.fn()
    mockTrendActions.mockReturnValue({
      ...DEFAULT_TREND_ACTIONS,
      aiInsightsEnabled: true,
      aiButtonText: 'Ask AI',
      subscriptionEnabled: true,
      toggleAiInsights,
      openSubscription,
    })
    setup({ path: '/quick-facts/weekly' })
    fireEvent.click(screen.getByText('Ask AI'))
    fireEvent.click(screen.getByLabelText('Subscription preferences'))
    expect(toggleAiInsights).toHaveBeenCalledOnce()
    expect(openSubscription).toHaveBeenCalledOnce()
  })

  it('mobile menu offers subscription (when enabled) and feedback', () => {
    const openSubscription = vi.fn()
    mockTrendActions.mockReturnValue({ ...DEFAULT_TREND_ACTIONS, subscriptionEnabled: true, openSubscription })
    setup({ path: '/quick-facts/weekly' })
    fireEvent.click(screen.getByLabelText('More options'))
    fireEvent.click(screen.getByRole('menuitem', { name: /Subscription preferences/ }))
    expect(openSubscription).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByLabelText('More options'))
    fireEvent.click(screen.getByRole('menuitem', { name: /Give Feedback/ }))
    expect(screen.getByTestId('feedback-dialog')).toBeDefined()
  })
})

// Angular SqfLayoutComponent.onScroll → SqfCardsService.makeFilterSticky, and
// SqfFilterComponent.onScroll closing the kebab menu.
describe('FilterBar scroll behaviour (Angular makeFilterSticky)', () => {
  function scrollTo(y: number) {
    Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true })
    act(() => { window.dispatchEvent(new Event('scroll')) })
  }
  function setPageSize(innerWidth: number, scrollHeight = 3000) {
    Object.defineProperty(window, 'innerWidth', { value: innerWidth, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    Object.defineProperty(document.body, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true })
  }
  const bar = () => screen.getByTestId('filter-bar')

  beforeEach(() => {
    vi.clearAllMocks()
    scrollTo(0)
  })

  it('tucks the bar behind content while scrolling down past its height on desktop and restores it on scroll up', () => {
    setPageSize(1440)
    setup()
    vi.spyOn(bar(), 'getBoundingClientRect').mockReturnValue({ height: 49 } as DOMRect)
    scrollTo(30)
    expect(bar().style.zIndex).toBe('')
    scrollTo(400)
    expect(bar().style.zIndex).toBe('-1')
    scrollTo(300)
    expect(bar().style.zIndex).toBe('')
  })

  it('hides as soon as the page scrolls down on mobile', () => {
    setPageSize(390)
    setup()
    scrollTo(10)
    expect(bar().style.zIndex).toBe('-1')
  })

  it('ignores downward scrolls on pages with under 50px of scroll range', () => {
    setPageSize(390, 840)
    setup()
    scrollTo(30)
    expect(bar().style.zIndex).toBe('')
  })

  it('closes the mobile kebab menu on scroll', () => {
    setPageSize(390)
    setup({ path: '/quick-facts/weekly' })
    fireEvent.click(screen.getByLabelText('More options'))
    expect(screen.getByRole('menuitem', { name: /Give Feedback/ })).toBeDefined()
    scrollTo(20)
    expect(screen.queryByRole('menuitem', { name: /Give Feedback/ })).toBeNull()
  })
})

describe('FilterBar date picker positioning', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps the panel 8px inside the viewport when it would overflow on the left (CDK viewport margin)', () => {
    const { container } = setup()
    const original = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    const button = screen.getByRole('button', { expanded: false, name: /today/ })
    const wrap = button.parentElement as HTMLElement
    const label = button.querySelector('span:nth-child(2)') as HTMLElement
    wrap.getBoundingClientRect = () => ({ left: 120, right: 260, top: 0, bottom: 0, width: 140, height: 0, x: 120, y: 0, toJSON: () => ({}) })
    label.getBoundingClientRect = () => ({ left: 150, right: 190, top: 0, bottom: 0, width: 40, height: 0, x: 150, y: 0, toJSON: () => ({}) })
    fireEvent.click(button)
    const panel = container.querySelector('[style*="left"]') as HTMLElement
    expect(panel.style.left).toBe('-112px')
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: original })
  })
})

describe('FilterBar popups close on Escape (mat-menu / mat-datepicker)', () => {
  beforeEach(() => vi.clearAllMocks())

  const escape = () => fireEvent.keyDown(document, { key: 'Escape' })

  it('closes the location, date, period, breakdown and kebab popups', () => {
    setup()
    const location = screen.getByRole('button', { name: /location_on/ })
    const date = screen.getByRole('button', { name: /today/ })
    for (const trigger of [
      location,
      date,
      screen.getByLabelText('Reporting period'),
      screen.getByLabelText('Breakdown'),
      screen.getByLabelText('More options'),
    ]) {
      fireEvent.click(trigger)
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      escape()
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    }
  })

  it('closes the card-type menu on details pages', () => {
    setup({ path: '/quick-facts/details/sales' })
    const trigger = screen.getByLabelText('Card type')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    escape()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})

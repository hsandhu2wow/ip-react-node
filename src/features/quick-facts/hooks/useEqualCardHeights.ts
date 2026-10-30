import { useLayoutEffect, type RefObject } from 'react'

/**
 * Gives every collapsed card in the grid the height of the tallest collapsed card, so cards with
 * data and cards showing an error/empty state line up. Expanded cards keep their natural height.
 */
export function useEqualCardHeights(gridRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    let frame = 0
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule())
    const apply = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.metric-card-slot > *'))
      cards.forEach(card => resize?.observe(card))
      cards.forEach(card => { card.style.minHeight = '' })
      const collapsed = cards.filter(card => card.dataset.expanded !== 'true')
      const tallest = Math.max(0, ...collapsed.map(card => card.offsetHeight))
      if (tallest > 0) collapsed.forEach(card => { card.style.minHeight = `${tallest}px` })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    apply()
    resize?.observe(grid)
    const mutation = new MutationObserver(schedule)
    mutation.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-expanded'] })

    return () => {
      cancelAnimationFrame(frame)
      resize?.disconnect()
      mutation.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridRef, ...deps])
}

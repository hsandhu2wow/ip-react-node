import { afterEach, describe, expect, it, vi } from 'vitest'
import { installStaleChunkRecovery } from './staleChunkRecovery'

describe('installStaleChunkRecovery', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('prevents a preload error and reloads only once per session', () => {
    const reload = vi.fn()
    const uninstall = installStaleChunkRecovery(reload)

    const first = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(first)
    expect(first.defaultPrevented).toBe(true)
    expect(sessionStorage.getItem('si-stale-chunk-reload')).toBe('1')
    expect(reload).toHaveBeenCalledTimes(1)

    const second = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(second)
    expect(second.defaultPrevented).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    uninstall()
  })

  it('does not reload when the session guard is already set', () => {
    sessionStorage.setItem('si-stale-chunk-reload', '1')
    const reload = vi.fn()
    const uninstall = installStaleChunkRecovery(reload)

    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))

    expect(reload).not.toHaveBeenCalled()
    uninstall()
  })
})

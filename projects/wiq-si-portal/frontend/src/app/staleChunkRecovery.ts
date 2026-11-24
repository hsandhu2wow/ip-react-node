const SESSION_GUARD = 'si-stale-chunk-reload'

export function installStaleChunkRecovery(
  reload: () => void = () => window.location.reload(),
): () => void {
  const handlePreloadError = (event: Event) => {
    event.preventDefault()
    if (sessionStorage.getItem(SESSION_GUARD)) return

    sessionStorage.setItem(SESSION_GUARD, '1')
    reload()
  }

  window.addEventListener('vite:preloadError', handlePreloadError)
  return () => window.removeEventListener('vite:preloadError', handlePreloadError)
}

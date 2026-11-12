// Port of Angular's per-BU theming (index.html inline script, prebuild.js BUCKET_URL / SITE_TITLE,
// nav.service logoLabel). Values are injected at build time per BU via VITE_BUCKET_URL / VITE_SITE_TITLE.

const DEFAULT_BUCKET_URL = '/assets/'
const DEFAULT_SITE_TITLE = 'Insights Portal'

/** Bucket URL with a guaranteed trailing slash (prebuild.js behaviour). */
export function normalizeBucketUrl(url?: string): string {
  const trimmed = url?.trim()
  if (!trimmed) return DEFAULT_BUCKET_URL
  return trimmed.replace(/\/?(\?|#|$)/, '/$1')
}

export const BUCKET_URL = normalizeBucketUrl(import.meta.env.VITE_BUCKET_URL)
export const SITE_TITLE = import.meta.env.VITE_SITE_TITLE?.trim() || DEFAULT_SITE_TITLE

/** Angular NavService.logoLabel. */
export function logoLabelForPortal(portal?: string): string {
  if (portal === '360FM') return '360 FM Insights Portal'
  if (portal === 'PEOPLE') return 'People Insights Portal'
  return 'Insights Portal'
}

/** Injects the BU favicon, apple-touch icon and env.css theme, and sets the document title. */
export function applyThemeAssets(doc: Document = document, bucketUrl: string = BUCKET_URL, title: string = SITE_TITLE) {
  doc.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[data-theme-asset]').forEach((el) => el.remove())
  const add = (attrs: Record<string, string>) => {
    const link = doc.createElement('link')
    Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v))
    link.setAttribute('data-theme-asset', '')
    doc.head.appendChild(link)
  }
  add({ rel: 'icon', type: 'image/x-icon', href: `${bucketUrl}favicon.ico` })
  add({ rel: 'stylesheet', href: `${bucketUrl}env.css` })
  add({ rel: 'apple-touch-icon', sizes: '120x120', href: `${bucketUrl}home.png` })
  doc.title = title
}

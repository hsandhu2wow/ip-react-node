import { describe, expect, it } from 'vitest'
import { applyThemeAssets, logoLabelForPortal, normalizeBucketUrl } from './theme'

describe('theme config', () => {
  it('normalizes the bucket URL with a trailing slash and a local default', () => {
    expect(normalizeBucketUrl('https://storage.googleapis.com/bigw-theme-assets')).toBe('https://storage.googleapis.com/bigw-theme-assets/')
    expect(normalizeBucketUrl('https://x.com/b/')).toBe('https://x.com/b/')
    expect(normalizeBucketUrl('')).toBe('/assets/')
    expect(normalizeBucketUrl(undefined)).toBe('/assets/')
  })

  it('labels the logo per portal like Angular', () => {
    expect(logoLabelForPortal('360FM')).toBe('360 FM Insights Portal')
    expect(logoLabelForPortal('PEOPLE')).toBe('People Insights Portal')
    expect(logoLabelForPortal('BIGW')).toBe('Insights Portal')
  })

  it('applies favicon, theme css, touch icon and title from the bucket, replacing earlier ones', () => {
    document.head.innerHTML = '<link rel="icon" href="/old.ico">'
    applyThemeAssets(document, 'https://b.example/assets/', 'BIGW Insights')
    applyThemeAssets(document, 'https://b.example/assets/', 'BIGW Insights')
    expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(1)
    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('https://b.example/assets/favicon.ico')
    expect(document.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe('https://b.example/assets/env.css')
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe('https://b.example/assets/home.png')
    expect(document.title).toBe('BIGW Insights')
  })
})

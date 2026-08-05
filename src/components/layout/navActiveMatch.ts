/**
 * Given the current pathname and a flat list of candidate nav-item prefixes,
 * returns the longest prefix that matches (exact match or `prefix + '/'`).
 *
 * This avoids the "prefix collision" bug where a short prefix (e.g. `/quick-facts`)
 * would incorrectly match a pathname that's actually owned by a more specific,
 * longer sibling prefix (e.g. `/quick-facts/weekly`).
 */
export function getActivePrefix(pathname: string, prefixes: string[]): string {
  const matches = prefixes.filter((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
  return matches.sort((a, b) => b.length - a.length)[0] || ''
}

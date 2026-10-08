import type { IQFTree } from '../types/sqf.types'

// Portal-specific display terms for generic backend level_desc values.
const LEVEL_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  BIGW: { Zone: 'Regions', Group: 'Areas', Department: 'Business' },
}

export function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies'
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es'
  return word + 's'
}

/** Plural label for the level one step below the selected node. */
export function childLevelLabel(node: IQFTree | null | undefined, portal?: string): string {
  const child = node?.children?.[0] ?? node?.leafChildren?.[0]
  const desc = child?.level_desc || 'Department'
  return (portal && LEVEL_LABEL_OVERRIDES[portal]?.[desc]) || pluralize(desc)
}

/** True when there is no further childLevel/department axis to break down by. */
export function hidesBreakdownAxis(node: IQFTree | null | undefined): boolean {
  return node?.level_desc === 'Store' || node?.level_desc === 'Department'
}

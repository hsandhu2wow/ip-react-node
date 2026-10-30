import { describe, it, expect } from 'vitest'
import { pluralize, childLevelLabel, hidesBreakdownAxis } from './levelLabels'
import type { IQFTree } from '../types/sqf.types'

const node = (level_desc: string, childDesc?: string): IQFTree =>
  ({
    name: 'n', code: 'c', level: '1', level_desc, depth: 0, apiDepth: 0, expandable: true,
    children: childDesc ? [{ level_desc: childDesc } as IQFTree] : undefined,
  })

describe('pluralize', () => {
  it('handles y, sibilants and default', () => {
    expect(pluralize('Category')).toBe('Categories')
    expect(pluralize('Boy')).toBe('Boys')
    expect(pluralize('Zone')).toBe('Zones')
    expect(pluralize('Branch')).toBe('Branches')
    expect(pluralize('Store')).toBe('Stores')
  })
})

describe('childLevelLabel', () => {
  it('pluralizes the child level_desc', () => {
    expect(childLevelLabel(node('National', 'State'))).toBe('States')
  })
  it('applies BIGW overrides', () => {
    expect(childLevelLabel(node('National', 'Zone'), 'BIGW')).toBe('Regions')
    expect(childLevelLabel(node('Zone', 'Group'), 'BIGW')).toBe('Areas')
    expect(childLevelLabel(node('Zone', 'Zone'), 'SUPER')).toBe('Zones')
  })
  it('defaults to Departments without children', () => {
    expect(childLevelLabel(node('Store'))).toBe('Departments')
    expect(childLevelLabel(null)).toBe('Departments')
  })
})

describe('hidesBreakdownAxis', () => {
  it('hides at Store and Department level only', () => {
    expect(hidesBreakdownAxis(node('Store'))).toBe(true)
    expect(hidesBreakdownAxis(node('Department'))).toBe(true)
    expect(hidesBreakdownAxis(node('Zone'))).toBe(false)
  })
})

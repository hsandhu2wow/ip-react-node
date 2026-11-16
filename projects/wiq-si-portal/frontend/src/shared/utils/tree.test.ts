// src/utils/tree.test.ts
import { describe, it, expect } from 'vitest'
import type { ISQFGenericFilter } from '../types/sqf.types'
import {
  processFilterResponse,
  flattenTree,
  findNodeByCode,
  addParents,
  getFirstSelectableNode,
} from './tree'

const NATIONAL_RESPONSE: ISQFGenericFilter[] = [
  {
    name: 'National',
    code: 'National',
    level: 0,
    level_desc: 'National',
    children: [
      {
        name: 'NSW',
        code: 'NSW',
        level: 1,
        level_desc: 'State',
        children: [
          {
            name: 'Store 1234',
            code: '1234',
            level: 3,
            level_desc: 'Store',
            children: [],
          },
        ],
      },
    ],
  },
]

const MULTI_NODE_RESPONSE: ISQFGenericFilter[] = [
  { name: 'Retail', code: 'w_retail', level: 1, level_desc: 'Division', children: [] },
  { name: 'Metro', code: 'metro', level: 1, level_desc: 'Division', children: [] },
]

describe('processFilterResponse', () => {
  it('converts single-root response to a tree', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)!
    expect(tree.code).toBe('National')
    expect(tree.children).toHaveLength(1)
    expect(tree.children![0].code).toBe('NSW')
  })

  it('wraps multi-root response in a hidden root node', () => {
    const tree = processFilterResponse(MULTI_NODE_RESPONSE)!
    expect(tree.alwaysHidden).toBe(true)
    expect(tree.children).toHaveLength(2)
    expect(tree.children![0].code).toBe('w_retail')
  })

  it('materializes store leaf departments with composite codes and Angular API depth', () => {
    const tree = processFilterResponse([{
      name: 'Store', code: '1234', level: 3, level_desc: 'Store',
      leafChildren: [
        { name: 'Produce', code: '10', level: 4, level_desc: 'Department' },
        { name: 'Bakery', code: '1234-20', level: 4, level_desc: 'Department', nonClickable: true },
      ],
    }])!
    addParents(tree)
    const flat = flattenTree(tree)
    const department = findNodeByCode(flat, '1234-10')
    expect(department).toMatchObject({
      name: 'Produce', code: '1234-10', level: 'department', level_desc: 'Department',
      apiDepth: 5, depth: 1, expandable: false,
    })
    expect(department?.parent).toBe(tree)
    expect(findNodeByCode(flat, '1234-20')?.nonClickable).toBe(true)
  })
})

describe('flattenTree', () => {
  it('returns all non-hidden nodes in depth-first order', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)!
    const flat = flattenTree(tree)
    const codes = flat.map(n => n.code)
    expect(codes).toContain('National')
    expect(codes).toContain('NSW')
    expect(codes).toContain('1234')
  })

  it('excludes hidden/alwaysHidden nodes', () => {
    const tree = processFilterResponse(MULTI_NODE_RESPONSE)!
    const flat = flattenTree(tree)
    // root node is hidden, but its children are not
    expect(flat.some(n => n.alwaysHidden)).toBe(false)
  })
})

describe('findNodeByCode', () => {
  it('finds a node by code in a flat list', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)!
    const flat = flattenTree(tree)
    const node = findNodeByCode(flat, '1234')
    expect(node).not.toBeNull()
    expect(node!.level_desc).toBe('Store')
  })

  it('returns null when code not found', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)!
    const flat = flattenTree(tree)
    expect(findNodeByCode(flat, 'NOT_EXISTS')).toBeNull()
  })
})

describe('addParents', () => {
  it('sets parent references on children', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)!
    addParents(tree)
    expect(tree.children![0].parent).toBe(tree)
    expect(tree.children![0].children![0].parent).toBe(tree.children![0])
  })
})

describe('getFirstSelectableNode', () => {
  it('returns the first non-hidden selectable node', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)!
    addParents(tree)
    const node = getFirstSelectableNode(flattenTree(tree))
    expect(node).not.toBeNull()
    expect(node!.code).toBe('National')
  })
})

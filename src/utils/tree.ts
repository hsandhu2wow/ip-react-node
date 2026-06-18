// src/utils/tree.ts
import type { ISQFGenericFilter, IQFTree } from '../types/sqf.types'

/**
 * Converts the raw API response from getUniversalFilterGeneric into an IQFTree.
 * Mirrors Angular SqfFilterService.convertToMultiNodeTree / convertToGenericTree.
 */
export function processFilterResponse(res: ISQFGenericFilter[]): IQFTree | null {
  if (!Array.isArray(res) || res.length === 0) return null
  if (res.length > 1) {
    return convertToMultiNodeTree(res)
  }
  return convertToSingleTree(res[0], 0)
}

function convertToSingleTree(req: ISQFGenericFilter, depth: number): IQFTree {
  const hasChildren = !!(req.children && req.children.length)
  const hasLeafChildren = !!req.leafChildren?.length
  const expandable = hasChildren || hasLeafChildren
  const isLastNode = !hasChildren

  return {
    name: isLastNode
      ? req.name ? `${req.name} - ${req.code}` : 'n/a'
      : req.name || 'n/a',
    code: req.code,
    level: String(req.level),
    level_desc: String(req.level_desc),
    apiDepth: Number(req.level) || depth,
    depth,
    children: (req.children || []).map(child => convertToSingleTree(child, depth + 1)),
    expandable,
    leafChildren: req.leafChildren || null,
    alwaysHidden: req.alwaysHidden,
  }
}

function convertToMultiNodeTree(reqs: ISQFGenericFilter[]): IQFTree {
  const children = reqs.map(req => convertToSingleTree(req, 1))
  return {
    name: 'n/a',
    code: '',
    level: 'root',
    level_desc: 'root',
    depth: 0,
    apiDepth: 0,
    children,
    expandable: true,
    alwaysHidden: true,
    hidden: true,
  }
}

/**
 * Recursively sets .parent on every child node.
 * Must be called after processFilterResponse.
 */
export function addParents(node: IQFTree, parent?: IQFTree): void {
  if (parent) node.parent = parent
  ;(node.children || []).forEach(child => addParents(child, node))
}

/**
 * Returns a flat array of all non-hidden, non-alwaysHidden nodes (depth-first).
 */
export function flattenTree(node: IQFTree): IQFTree[] {
  const result: IQFTree[] = []
  if (!node.alwaysHidden && !node.hidden) {
    result.push(node)
  }
  ;(node.children || []).forEach(child => {
    result.push(...flattenTree(child))
  })
  return result
}

/**
 * Finds a node by code in a flat array (from flattenTree).
 */
export function findNodeByCode(nodes: IQFTree[], code: string): IQFTree | null {
  return nodes.find(n => n.code === code) || null
}

/**
 * Returns the first selectable node from a flat list.
 * Prefers nodes with a non-empty code.
 */
export function getFirstSelectableNode(nodes: IQFTree[]): IQFTree | null {
  return nodes.find(n => n.code !== '' && !n.alwaysHidden && !n.hidden) || null
}

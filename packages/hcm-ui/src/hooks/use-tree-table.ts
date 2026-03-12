'use client';

import { useState, useCallback, useMemo } from 'react';

import { useSelection } from './use-selection';
import type { UseSelectionReturn } from './use-selection';

// ── Types ──

export interface TreeNode<TData> {
  /** Unique identifier */
  id: string;
  /** The row data */
  data: TData;
  /** Child nodes */
  children?: TreeNode<TData>[];
}

export interface FlatTreeNode<TData> {
  /** Unique identifier */
  id: string;
  /** The row data */
  data: TData;
  /** Nesting depth (0 = root) */
  depth: number;
  /** Whether this node has children */
  hasChildren: boolean;
  /** Whether this node is currently expanded */
  isExpanded: boolean;
  /** Whether this node matches the search term */
  isMatched: boolean;
  /** Whether this node is an ancestor of a matched node (for auto-expanding) */
  isOnMatchPath: boolean;
  /** Parent node ID (null for root nodes) */
  parentId: string | null;
}

export type SearchMode = 'highlight' | 'filter';

/** Built-in selection policies */
export type SelectionPolicy = 'independent' | 'cascade' | 'leaf-only';

/** Custom selection policy function */
export type SelectionPolicyFn<TData> = (context: {
  /** The node being toggled */
  toggledNode: FlatTreeNode<TData>;
  /** Was this node selected before the toggle? */
  wasSelected: boolean;
  /** Current selected keys (before this toggle) */
  selectedKeys: Set<string>;
  /** All flat nodes */
  flatNodes: FlatTreeNode<TData>[];
  /** Get all ancestor IDs of a node */
  getAncestorIds: (nodeId: string) => string[];
  /** Get all descendant IDs of a node */
  getDescendantIds: (nodeId: string) => string[];
}) => Set<string>;

export interface UseTreeTableOptions<TData> {
  /** The tree data */
  nodes: TreeNode<TData>[];
  /** Selection policy — built-in string or custom function */
  selectionPolicy?: SelectionPolicy | SelectionPolicyFn<TData>;
  /** Selection mode */
  selectionMode?: 'single' | 'multi';
  /** Initial expanded node IDs. Default: [] (all collapsed) */
  initialExpanded?: string[];
  /** Expand all nodes on mount? Overrides initialExpanded. Default: false */
  defaultExpandAll?: boolean;
  /** Search match function — return true if node matches search term */
  searchFn?: (node: TData, searchTerm: string) => boolean;
  /** Search behavior mode. Default: 'highlight' */
  searchMode?: SearchMode;
  /** Initial selected keys */
  initialSelectedKeys?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: Set<string>) => void;
}

export interface UseTreeTableReturn<TData> {
  /** Flattened, visible nodes (respects expand/collapse + search filter) */
  flatNodes: FlatTreeNode<TData>[];
  /** All flattened nodes (ignoring expand/collapse — for internal use) */
  allFlatNodes: FlatTreeNode<TData>[];
  /** Selection state and actions */
  selection: UseSelectionReturn;
  /** Toggle a node's selection (applies policy) */
  toggleNode: (nodeId: string) => void;
  /** Toggle expand/collapse for a node */
  toggleExpand: (nodeId: string) => void;
  /** Expand all nodes */
  expandAll: () => void;
  /** Collapse all nodes */
  collapseAll: () => void;
  /** Expand all ancestors of a node (reveal it) */
  expandToNode: (nodeId: string) => void;
  /** Set search term */
  setSearch: (term: string) => void;
  /** Current search term */
  searchTerm: string;
  /** Get all ancestor IDs of a node */
  getAncestorIds: (nodeId: string) => string[];
  /** Get all descendant IDs of a node */
  getDescendantIds: (nodeId: string) => string[];
}

// ── Internal: build lookup maps from tree ──

interface NodeMeta {
  parentId: string | null;
  childIds: string[];
  depth: number;
  hasChildren: boolean;
}

function buildNodeMap<TData>(
  nodes: TreeNode<TData>[],
  parentId: string | null = null,
  depth = 0,
  map: Map<string, NodeMeta> = new Map(),
): Map<string, NodeMeta> {
  for (const node of nodes) {
    const childIds = node.children?.map((c) => c.id) ?? [];
    map.set(node.id, {
      parentId,
      childIds,
      depth,
      hasChildren: childIds.length > 0,
    });
    if (node.children) {
      buildNodeMap(node.children, node.id, depth + 1, map);
    }
  }
  return map;
}

function buildDataMap<TData>(
  nodes: TreeNode<TData>[],
  map: Map<string, TData> = new Map(),
): Map<string, TData> {
  for (const node of nodes) {
    map.set(node.id, node.data);
    if (node.children) {
      buildDataMap(node.children, map);
    }
  }
  return map;
}

function collectAllIds<TData>(nodes: TreeNode<TData>[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) {
      ids.push(...collectAllIds(node.children));
    }
  }
  return ids;
}

// ── Hook ──

export function useTreeTable<TData>(
  options: UseTreeTableOptions<TData>,
): UseTreeTableReturn<TData> {
  const {
    nodes,
    selectionPolicy = 'independent',
    selectionMode = 'multi',
    initialExpanded = [],
    defaultExpandAll = false,
    searchFn,
    searchMode = 'highlight',
    initialSelectedKeys = [],
    onSelectionChange,
  } = options;

  // ── Expand/collapse state ──

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpandAll) {
      return new Set(collectAllIds(nodes));
    }
    return new Set(initialExpanded);
  });

  // ── Search state ──

  const [searchTerm, setSearch] = useState('');

  // ── Lookup maps (memoized on nodes) ──

  const nodeMap = useMemo(() => buildNodeMap(nodes), [nodes]);
  const dataMap = useMemo(() => buildDataMap(nodes), [nodes]);

  // ── Ancestor/descendant helpers ──

  const getAncestorIds = useCallback(
    (nodeId: string): string[] => {
      const ancestors: string[] = [];
      let currentId = nodeMap.get(nodeId)?.parentId ?? null;
      while (currentId !== null) {
        ancestors.push(currentId);
        currentId = nodeMap.get(currentId)?.parentId ?? null;
      }
      return ancestors;
    },
    [nodeMap],
  );

  const getDescendantIds = useCallback(
    (nodeId: string): string[] => {
      const descendants: string[] = [];
      const stack = [...(nodeMap.get(nodeId)?.childIds ?? [])];
      while (stack.length > 0) {
        const id = stack.pop()!;
        descendants.push(id);
        const meta = nodeMap.get(id);
        if (meta?.childIds) {
          stack.push(...meta.childIds);
        }
      }
      return descendants;
    },
    [nodeMap],
  );

  // ── Search matching ──

  const matchedIds = useMemo<Set<string>>(() => {
    if (!searchTerm || !searchFn) return new Set();

    const matched = new Set<string>();
    for (const [id, data] of dataMap) {
      if (searchFn(data, searchTerm)) {
        matched.add(id);
      }
    }
    return matched;
  }, [searchTerm, searchFn, dataMap]);

  // IDs on the match path (ancestors of matched nodes)
  const matchPathIds = useMemo<Set<string>>(() => {
    if (matchedIds.size === 0) return new Set();

    const onPath = new Set<string>();
    for (const id of matchedIds) {
      for (const ancestorId of getAncestorIds(id)) {
        onPath.add(ancestorId);
      }
    }
    return onPath;
  }, [matchedIds, getAncestorIds]);

  // ── Flatten tree ──

  const allFlatNodes = useMemo<FlatTreeNode<TData>[]>(() => {
    const result: FlatTreeNode<TData>[] = [];

    function walk(treeNodes: TreeNode<TData>[], parentId: string | null, depth: number) {
      for (const node of treeNodes) {
        const meta = nodeMap.get(node.id)!;
        const isMatched = matchedIds.has(node.id);
        const isOnMatchPath = matchPathIds.has(node.id);

        result.push({
          id: node.id,
          data: node.data,
          depth,
          hasChildren: meta.hasChildren,
          isExpanded: expandedIds.has(node.id),
          isMatched,
          isOnMatchPath,
          parentId,
        });

        if (node.children) {
          walk(node.children, node.id, depth + 1);
        }
      }
    }

    walk(nodes, null, 0);
    return result;
  }, [nodes, nodeMap, expandedIds, matchedIds, matchPathIds]);

  // ── Visible flat nodes (respects expand/collapse + search filter) ──

  const flatNodes = useMemo<FlatTreeNode<TData>[]>(() => {
    const isSearchActive = searchTerm !== '' && searchFn != null;

    // In filter mode with active search, only show matched nodes + their ancestor path
    const filterVisible =
      isSearchActive && searchMode === 'filter' ? new Set([...matchedIds, ...matchPathIds]) : null;

    const result: FlatTreeNode<TData>[] = [];

    function walk(
      treeNodes: TreeNode<TData>[],
      parentId: string | null,
      depth: number,
      parentVisible: boolean,
    ) {
      for (const node of treeNodes) {
        // In filter mode, skip nodes not in the visible set
        if (filterVisible && !filterVisible.has(node.id)) {
          continue;
        }

        // Node is visible if parent is visible (or it's root)
        if (!parentVisible && depth > 0) continue;

        const isExpanded = expandedIds.has(node.id);
        const isMatched = matchedIds.has(node.id);
        const isOnMatchPath = matchPathIds.has(node.id);

        // In highlight mode with search, auto-expand nodes on match path
        const effectiveExpanded =
          isSearchActive && searchMode === 'highlight' ? isExpanded || isOnMatchPath : isExpanded;

        const meta = nodeMap.get(node.id)!;

        result.push({
          id: node.id,
          data: node.data,
          depth,
          hasChildren: meta.hasChildren,
          isExpanded: effectiveExpanded,
          isMatched,
          isOnMatchPath,
          parentId,
        });

        if (node.children) {
          walk(node.children, node.id, depth + 1, effectiveExpanded);
        }
      }
    }

    walk(nodes, null, 0, true);
    return result;
  }, [nodes, nodeMap, expandedIds, matchedIds, matchPathIds, searchTerm, searchFn, searchMode]);

  // ── Selection ──

  const selection = useSelection({
    mode: selectionMode,
    initialKeys: initialSelectedKeys,
    onSelectionChange,
  });

  // ── Toggle node selection (with policy) ──

  const toggleNode = useCallback(
    (nodeId: string) => {
      const wasSelected = selection.state.isSelected(nodeId);

      // ── Built-in policies ──
      if (typeof selectionPolicy === 'string') {
        switch (selectionPolicy) {
          case 'independent': {
            selection.toggleRow(nodeId);
            return;
          }

          case 'cascade': {
            const descendants = getDescendantIds(nodeId);
            const ancestors = getAncestorIds(nodeId);

            if (wasSelected) {
              // Deselect self + all descendants
              const toRemove = new Set([nodeId, ...descendants]);
              const next = new Set(selection.state.selectedKeys);
              for (const id of toRemove) {
                next.delete(id);
              }
              // Also deselect ancestors if none of their children remain selected
              for (const ancestorId of ancestors) {
                const siblingIds = nodeMap.get(ancestorId)?.childIds ?? [];
                const anyChildSelected = siblingIds.some((cid) => next.has(cid));
                if (!anyChildSelected) {
                  next.delete(ancestorId);
                }
              }
              selection.replaceSelection(Array.from(next));
            } else {
              // Select self + all descendants + all ancestors
              const toAdd = [nodeId, ...descendants, ...ancestors];
              const next = new Set(selection.state.selectedKeys);
              for (const id of toAdd) {
                next.add(id);
              }
              selection.replaceSelection(Array.from(next));
            }
            return;
          }

          case 'leaf-only': {
            const meta = nodeMap.get(nodeId);
            if (meta?.hasChildren) return; // Non-leaf — ignore
            selection.toggleRow(nodeId);
            return;
          }
        }
      }

      // ── Custom policy function ──
      if (typeof selectionPolicy === 'function') {
        const node = allFlatNodes.find((n) => n.id === nodeId);
        if (!node) return;

        const newKeys = selectionPolicy({
          toggledNode: node,
          wasSelected,
          selectedKeys: new Set(selection.state.selectedKeys),
          flatNodes: allFlatNodes,
          getAncestorIds,
          getDescendantIds,
        });

        selection.replaceSelection(Array.from(newKeys));
      }
    },
    [selectionPolicy, selection, nodeMap, allFlatNodes, getAncestorIds, getDescendantIds],
  );

  // ── Expand/collapse actions ──

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(collectAllIds(nodes)));
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const expandToNode = useCallback(
    (nodeId: string) => {
      const ancestors = getAncestorIds(nodeId);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const id of ancestors) {
          next.add(id);
        }
        return next;
      });
    },
    [getAncestorIds],
  );

  return {
    flatNodes,
    allFlatNodes,
    selection,
    toggleNode,
    toggleExpand,
    expandAll,
    collapseAll,
    expandToNode,
    setSearch,
    searchTerm,
    getAncestorIds,
    getDescendantIds,
  };
}

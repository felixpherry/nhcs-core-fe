import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTreeTable } from './use-tree-table';
import type { TreeNode, SelectionPolicyFn } from './use-tree-table';

// ── Test data ──

interface Org {
  name: string;
  code: string;
}

/**
 * Tree structure:
 *
 * HQ (1)
 * ├── Finance (1a)
 * │   ├── Accounting (1a-i)
 * │   └── Treasury (1a-ii)
 * └── HR (1b)
 *     ├── Recruitment (1b-i)
 *     └── Payroll (1b-ii)
 * Branch (2)
 * └── Operations (2a)
 *     └── Logistics (2a-i)
 */
const testTree: TreeNode<Org>[] = [
  {
    id: '1',
    data: { name: 'Headquarters', code: 'HQ' },
    children: [
      {
        id: '1a',
        data: { name: 'Finance Division', code: 'FIN' },
        children: [
          { id: '1a-i', data: { name: 'Accounting Dept', code: 'ACC' } },
          { id: '1a-ii', data: { name: 'Treasury Dept', code: 'TRE' } },
        ],
      },
      {
        id: '1b',
        data: { name: 'HR Division', code: 'HR' },
        children: [
          { id: '1b-i', data: { name: 'Recruitment Dept', code: 'REC' } },
          { id: '1b-ii', data: { name: 'Payroll Dept', code: 'PAY' } },
        ],
      },
    ],
  },
  {
    id: '2',
    data: { name: 'Branch Office', code: 'BRN' },
    children: [
      {
        id: '2a',
        data: { name: 'Operations', code: 'OPS' },
        children: [{ id: '2a-i', data: { name: 'Logistics', code: 'LOG' } }],
      },
    ],
  },
];

// Total node count: 9

function defaultOptions() {
  return { nodes: testTree };
}

// ── Tests ──

describe('useTreeTable', () => {
  // ────────────────────────────────────────
  // Flattening
  // ────────────────────────────────────────

  describe('flattening', () => {
    it('only shows root nodes when nothing is expanded', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.flatNodes).toHaveLength(2);
      expect(result.current.flatNodes[0]!.id).toBe('1');
      expect(result.current.flatNodes[0]!.depth).toBe(0);
      expect(result.current.flatNodes[1]!.id).toBe('2');
      expect(result.current.flatNodes[1]!.depth).toBe(0);
    });

    it('allFlatNodes contains every node in the tree', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.allFlatNodes).toHaveLength(10);
    });

    it('sets correct depth for nested nodes', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), defaultExpandAll: true }),
      );

      const nodeById = (id: string) => result.current.flatNodes.find((n) => n.id === id);

      expect(nodeById('1')!.depth).toBe(0);
      expect(nodeById('1a')!.depth).toBe(1);
      expect(nodeById('1a-i')!.depth).toBe(2);
    });

    it('sets hasChildren correctly', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), defaultExpandAll: true }),
      );

      const nodeById = (id: string) => result.current.flatNodes.find((n) => n.id === id);

      expect(nodeById('1')!.hasChildren).toBe(true);
      expect(nodeById('1a')!.hasChildren).toBe(true);
      expect(nodeById('1a-i')!.hasChildren).toBe(false);
    });

    it('sets parentId correctly', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), defaultExpandAll: true }),
      );

      const nodeById = (id: string) => result.current.flatNodes.find((n) => n.id === id);

      expect(nodeById('1')!.parentId).toBeNull();
      expect(nodeById('1a')!.parentId).toBe('1');
      expect(nodeById('1a-i')!.parentId).toBe('1a');
    });

    it('preserves data on flat nodes', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.flatNodes[0]!.data).toEqual({
        name: 'Headquarters',
        code: 'HQ',
      });
    });
  });

  // ────────────────────────────────────────
  // Expand / collapse
  // ────────────────────────────────────────

  describe('expand / collapse', () => {
    it('expands a node to reveal children', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      act(() => result.current.toggleExpand('1'));

      expect(result.current.flatNodes).toHaveLength(4); // HQ, Finance, HR, Branch
      expect(result.current.flatNodes.map((n) => n.id)).toEqual(['1', '1a', '1b', '2']);
    });

    it('collapses a node to hide children', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      act(() => result.current.toggleExpand('1'));
      expect(result.current.flatNodes).toHaveLength(4);

      act(() => result.current.toggleExpand('1'));
      expect(result.current.flatNodes).toHaveLength(2);
    });

    it('expanding parent does not auto-expand grandchildren', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      act(() => result.current.toggleExpand('1'));

      // Finance is visible but collapsed — its children should not be visible
      const financeNode = result.current.flatNodes.find((n) => n.id === '1a');
      expect(financeNode!.isExpanded).toBe(false);
      expect(result.current.flatNodes.find((n) => n.id === '1a-i')).toBeUndefined();
    });

    it('multi-level expand shows grandchildren', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      act(() => result.current.toggleExpand('1'));
      act(() => result.current.toggleExpand('1a'));

      expect(result.current.flatNodes.map((n) => n.id)).toEqual([
        '1',
        '1a',
        '1a-i',
        '1a-ii',
        '1b',
        '2',
      ]);
    });

    it('defaultExpandAll expands everything on mount', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), defaultExpandAll: true }),
      );

      expect(result.current.flatNodes).toHaveLength(10);
    });

    it('initialExpanded expands specific nodes on mount', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), initialExpanded: ['1', '1b'] }),
      );

      // Root expanded: HQ shows Finance, HR. HR expanded: shows Recruitment, Payroll. Branch visible.
      expect(result.current.flatNodes.map((n) => n.id)).toEqual([
        '1',
        '1a',
        '1b',
        '1b-i',
        '1b-ii',
        '2',
      ]);
    });

    it('expandAll expands every node', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      act(() => result.current.expandAll());

      expect(result.current.flatNodes).toHaveLength(10);
    });

    it('collapseAll collapses every node', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), defaultExpandAll: true }),
      );

      act(() => result.current.collapseAll());

      expect(result.current.flatNodes).toHaveLength(2);
    });

    it('expandToNode expands all ancestors of target', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      // Payroll (1b-ii) is deeply nested — expand to it
      act(() => result.current.expandToNode('1b-ii'));

      // HQ and HR should be expanded, but not Finance
      const ids = result.current.flatNodes.map((n) => n.id);
      expect(ids).toContain('1b-ii');
      expect(ids).toContain('1b');
      expect(ids).toContain('1b-i'); // sibling of target, visible because parent is expanded
      expect(ids).not.toContain('1a-i'); // Finance's children still collapsed
    });
  });

  // ────────────────────────────────────────
  // Ancestor / descendant helpers
  // ────────────────────────────────────────

  describe('helpers', () => {
    it('getAncestorIds returns ancestors bottom-up', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.getAncestorIds('1a-i')).toEqual(['1a', '1']);
    });

    it('getAncestorIds returns empty for root', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.getAncestorIds('1')).toEqual([]);
    });

    it('getDescendantIds returns all descendants', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      const descendants = result.current.getDescendantIds('1');
      expect(descendants).toHaveLength(6);
      expect(descendants).toContain('1a');
      expect(descendants).toContain('1a-i');
      expect(descendants).toContain('1a-ii');
      expect(descendants).toContain('1b');
      expect(descendants).toContain('1b-i');
      expect(descendants).toContain('1b-ii');
    });

    it('getDescendantIds returns empty for leaf', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.getDescendantIds('1a-i')).toEqual([]);
    });
  });

  // ────────────────────────────────────────
  // Selection — independent policy
  // ────────────────────────────────────────

  describe('selection — independent', () => {
    it('toggles a single node without affecting others', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'independent' }),
      );

      act(() => result.current.toggleNode('1a'));

      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      expect(result.current.selection.state.isSelected('1')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
    });

    it('toggles off without affecting others', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'independent' }),
      );

      act(() => result.current.toggleNode('1'));
      act(() => result.current.toggleNode('1a'));
      act(() => result.current.toggleNode('1'));

      expect(result.current.selection.state.isSelected('1')).toBe(false);
      expect(result.current.selection.state.isSelected('1a')).toBe(true);
    });
  });

  // ────────────────────────────────────────
  // Selection — cascade policy
  // ────────────────────────────────────────

  describe('selection — cascade', () => {
    it('selecting a node selects all descendants and ancestors', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'cascade' }),
      );

      act(() => result.current.toggleNode('1a'));

      // Self
      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      // Descendants
      expect(result.current.selection.state.isSelected('1a-i')).toBe(true);
      expect(result.current.selection.state.isSelected('1a-ii')).toBe(true);
      // Ancestor
      expect(result.current.selection.state.isSelected('1')).toBe(true);
      // Unrelated
      expect(result.current.selection.state.isSelected('1b')).toBe(false);
      expect(result.current.selection.state.isSelected('2')).toBe(false);
    });

    it('deselecting a node deselects all descendants', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'cascade' }),
      );

      // Select Finance (selects HQ, Finance, Accounting, Treasury)
      act(() => result.current.toggleNode('1a'));
      // Deselect Finance
      act(() => result.current.toggleNode('1a'));

      expect(result.current.selection.state.isSelected('1a')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-ii')).toBe(false);
    });

    it('deselecting a child deselects ancestor when no siblings remain', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'cascade' }),
      );

      // Select Accounting leaf (selects Accounting, Finance, HQ)
      act(() => result.current.toggleNode('1a-i'));
      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      expect(result.current.selection.state.isSelected('1')).toBe(true);

      // Deselect Accounting — Treasury is not selected, so Finance should deselect too
      act(() => result.current.toggleNode('1a-i'));

      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
      expect(result.current.selection.state.isSelected('1a')).toBe(false);
      expect(result.current.selection.state.isSelected('1')).toBe(false);
    });

    it('deselecting one child keeps ancestor if sibling still selected', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'cascade' }),
      );

      // Select Finance division (selects HQ, Finance, Accounting, Treasury)
      act(() => result.current.toggleNode('1a'));

      // Deselect Accounting only — Treasury still selected
      act(() => result.current.toggleNode('1a-i'));

      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
      // Finance stays because Treasury is still selected
      expect(result.current.selection.state.isSelected('1a-ii')).toBe(true);
      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      expect(result.current.selection.state.isSelected('1')).toBe(true);
    });

    it('selecting root selects entire subtree', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'cascade' }),
      );

      act(() => result.current.toggleNode('1'));

      // HQ has 6 descendants + itself = 7
      expect(result.current.selection.state.selectedKeys.size).toBe(7);
      expect(result.current.selection.state.isSelected('1')).toBe(true);
      expect(result.current.selection.state.isSelected('1b-ii')).toBe(true);
    });
  });

  // ────────────────────────────────────────
  // Selection — leaf-only policy
  // ────────────────────────────────────────

  describe('selection — leaf-only', () => {
    it('selects leaf nodes', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'leaf-only' }),
      );

      act(() => result.current.toggleNode('1a-i'));

      expect(result.current.selection.state.isSelected('1a-i')).toBe(true);
    });

    it('ignores toggle on non-leaf nodes', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'leaf-only' }),
      );

      act(() => result.current.toggleNode('1a'));

      expect(result.current.selection.state.isSelected('1a')).toBe(false);
      expect(result.current.selection.state.isEmpty).toBe(true);
    });

    it('ignores toggle on root nodes', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'leaf-only' }),
      );

      act(() => result.current.toggleNode('1'));

      expect(result.current.selection.state.isSelected('1')).toBe(false);
    });

    it('allows multiple leaf selections', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), selectionPolicy: 'leaf-only' }),
      );

      act(() => result.current.toggleNode('1a-i'));
      act(() => result.current.toggleNode('1b-ii'));
      act(() => result.current.toggleNode('2a-i'));

      expect(result.current.selection.state.selectedKeys.size).toBe(3);
    });
  });

  // ────────────────────────────────────────
  // Selection — custom policy
  // ────────────────────────────────────────

  describe('selection — custom policy (trustee menu pattern)', () => {
    // Trustee menu: check cascades UP to ancestors, uncheck cascades DOWN to descendants
    const trusteePolicy: SelectionPolicyFn<Org> = ({
      toggledNode,
      wasSelected,
      selectedKeys,
      getAncestorIds,
      getDescendantIds,
    }) => {
      const next = new Set(selectedKeys);

      if (wasSelected) {
        // Uncheck: cascade DOWN
        next.delete(toggledNode.id);
        for (const id of getDescendantIds(toggledNode.id)) {
          next.delete(id);
        }
      } else {
        // Check: cascade UP
        next.add(toggledNode.id);
        for (const id of getAncestorIds(toggledNode.id)) {
          next.add(id);
        }
      }

      return next;
    };

    it('selecting a child selects all ancestors', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionPolicy: trusteePolicy,
        }),
      );

      act(() => result.current.toggleNode('1a-i'));

      expect(result.current.selection.state.isSelected('1a-i')).toBe(true);
      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      expect(result.current.selection.state.isSelected('1')).toBe(true);
    });

    it('selecting a child does NOT select siblings', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionPolicy: trusteePolicy,
        }),
      );

      act(() => result.current.toggleNode('1a-i'));

      expect(result.current.selection.state.isSelected('1a-ii')).toBe(false);
      expect(result.current.selection.state.isSelected('1b')).toBe(false);
    });

    it('selecting a parent does NOT select children', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionPolicy: trusteePolicy,
        }),
      );

      act(() => result.current.toggleNode('1a'));

      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      expect(result.current.selection.state.isSelected('1')).toBe(true);
      // Children NOT selected
      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-ii')).toBe(false);
    });

    it('deselecting a parent deselects all descendants', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionPolicy: trusteePolicy,
        }),
      );

      // Select two children under Finance
      act(() => result.current.toggleNode('1a-i'));
      act(() => result.current.toggleNode('1a-ii'));

      // Deselect Finance — should deselect both children
      act(() => result.current.toggleNode('1a'));

      expect(result.current.selection.state.isSelected('1a')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-ii')).toBe(false);
      // HQ was selected by cascade-up, should remain (not a descendant of Finance)
      expect(result.current.selection.state.isSelected('1')).toBe(true);
    });

    it('deselecting a leaf does not affect siblings', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionPolicy: trusteePolicy,
        }),
      );

      act(() => result.current.toggleNode('1a-i'));
      act(() => result.current.toggleNode('1a-ii'));

      // Deselect Accounting only
      act(() => result.current.toggleNode('1a-i'));

      expect(result.current.selection.state.isSelected('1a-i')).toBe(false);
      expect(result.current.selection.state.isSelected('1a-ii')).toBe(true);
      expect(result.current.selection.state.isSelected('1a')).toBe(true);
    });
  });

  // ────────────────────────────────────────
  // Selection — initial keys + callback
  // ────────────────────────────────────────

  describe('selection — initialKeys and callback', () => {
    it('seeds selection with initialSelectedKeys', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          initialSelectedKeys: ['1a', '2'],
        }),
      );

      expect(result.current.selection.state.isSelected('1a')).toBe(true);
      expect(result.current.selection.state.isSelected('2')).toBe(true);
      expect(result.current.selection.state.selectedKeys.size).toBe(2);
    });

    it('calls onSelectionChange when selection changes', () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionPolicy: 'independent',
          onSelectionChange,
        }),
      );

      act(() => result.current.toggleNode('1'));

      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1']));
    });
  });

  // ────────────────────────────────────────
  // Selection — single mode
  // ────────────────────────────────────────

  describe('selection — single mode', () => {
    it('only keeps one node selected', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          selectionMode: 'single',
          selectionPolicy: 'independent',
        }),
      );

      act(() => result.current.toggleNode('1'));
      act(() => result.current.toggleNode('2'));

      expect(result.current.selection.state.isSelected('1')).toBe(false);
      expect(result.current.selection.state.isSelected('2')).toBe(true);
      expect(result.current.selection.state.selectedKeys.size).toBe(1);
    });
  });

  // ────────────────────────────────────────
  // Search — highlight mode
  // ────────────────────────────────────────

  describe('search — highlight mode', () => {
    const searchFn = (data: Org, term: string) =>
      data.name.toLowerCase().includes(term.toLowerCase());

    it('marks matching nodes with isMatched', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'highlight',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Accounting'));

      const accNode = result.current.flatNodes.find((n) => n.id === '1a-i');
      expect(accNode!.isMatched).toBe(true);

      const hqNode = result.current.flatNodes.find((n) => n.id === '1');
      expect(hqNode!.isMatched).toBe(false);
    });

    it('marks ancestors of matched nodes with isOnMatchPath', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'highlight',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Accounting'));

      const financeNode = result.current.flatNodes.find((n) => n.id === '1a');
      expect(financeNode!.isOnMatchPath).toBe(true);

      const hqNode = result.current.flatNodes.find((n) => n.id === '1');
      expect(hqNode!.isOnMatchPath).toBe(true);

      // HR is not on the path to Accounting
      const hrNode = result.current.flatNodes.find((n) => n.id === '1b');
      expect(hrNode!.isOnMatchPath).toBe(false);
    });

    it('auto-expands nodes on match path', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'highlight',
          // Start fully collapsed
        }),
      );

      act(() => result.current.setSearch('Payroll'));

      // Payroll (1b-ii) is nested under HQ > HR
      // Both should be auto-expanded to reveal it
      const ids = result.current.flatNodes.map((n) => n.id);
      expect(ids).toContain('1b-ii'); // Payroll visible
      expect(ids).toContain('1b'); // HR visible
      expect(ids).toContain('1'); // HQ visible
    });

    it('shows full tree in highlight mode (non-matching nodes still visible)', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'highlight',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Accounting'));

      // All 9 nodes should still be visible
      expect(result.current.flatNodes).toHaveLength(10);
    });

    it('clears search results when search term is empty', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'highlight',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Accounting'));
      act(() => result.current.setSearch(''));

      const allNotMatched = result.current.flatNodes.every((n) => !n.isMatched && !n.isOnMatchPath);
      expect(allNotMatched).toBe(true);
    });
  });

  // ────────────────────────────────────────
  // Search — filter mode
  // ────────────────────────────────────────

  describe('search — filter mode', () => {
    const searchFn = (data: Org, term: string) =>
      data.name.toLowerCase().includes(term.toLowerCase());

    it('hides non-matching branches', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'filter',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Accounting'));

      const ids = result.current.flatNodes.map((n) => n.id);
      // Should show: HQ (ancestor), Finance (ancestor), Accounting (match)
      expect(ids).toContain('1');
      expect(ids).toContain('1a');
      expect(ids).toContain('1a-i');
      // Should NOT show: Treasury, HR, Branch, etc.
      expect(ids).not.toContain('1a-ii');
      expect(ids).not.toContain('1b');
      expect(ids).not.toContain('2');
    });

    it('shows multiple matches with their ancestor paths', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'filter',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Dept'));

      const ids = result.current.flatNodes.map((n) => n.id);
      // All 4 "Dept" nodes + their ancestor paths
      expect(ids).toContain('1a-i'); // Accounting Dept
      expect(ids).toContain('1a-ii'); // Treasury Dept
      expect(ids).toContain('1b-i'); // Recruitment Dept
      expect(ids).toContain('1b-ii'); // Payroll Dept
      expect(ids).toContain('1a'); // Finance (ancestor)
      expect(ids).toContain('1b'); // HR (ancestor)
      expect(ids).toContain('1'); // HQ (ancestor)
      // Branch has no "Dept" — should be hidden
      expect(ids).not.toContain('2');
      expect(ids).not.toContain('2a');
    });

    it('shows all nodes when search is cleared', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'filter',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('Accounting'));
      act(() => result.current.setSearch(''));

      expect(result.current.flatNodes).toHaveLength(10);
    });

    it('shows no results when nothing matches', () => {
      const { result } = renderHook(() =>
        useTreeTable({
          ...defaultOptions(),
          searchFn,
          searchMode: 'filter',
          defaultExpandAll: true,
        }),
      );

      act(() => result.current.setSearch('zzzzzzz'));

      expect(result.current.flatNodes).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────
  // Search term state
  // ────────────────────────────────────────

  describe('search state', () => {
    it('tracks current searchTerm', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.searchTerm).toBe('');

      act(() => result.current.setSearch('hello'));

      expect(result.current.searchTerm).toBe('hello');
    });
  });

  // ────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty tree', () => {
      const { result } = renderHook(() => useTreeTable({ nodes: [] as TreeNode<Org>[] }));

      expect(result.current.flatNodes).toHaveLength(0);
      expect(result.current.allFlatNodes).toHaveLength(0);
    });

    it('handles single root with no children', () => {
      const singleNode: TreeNode<Org>[] = [{ id: '1', data: { name: 'Root', code: 'R' } }];

      const { result } = renderHook(() => useTreeTable({ nodes: singleNode }));

      expect(result.current.flatNodes).toHaveLength(1);
      expect(result.current.flatNodes[0]!.hasChildren).toBe(false);
      expect(result.current.flatNodes[0]!.depth).toBe(0);
    });

    it('toggleExpand on leaf node has no visible effect', () => {
      const { result } = renderHook(() =>
        useTreeTable({ ...defaultOptions(), defaultExpandAll: true }),
      );

      const before = result.current.flatNodes.length;
      act(() => result.current.toggleExpand('1a-i'));
      const after = result.current.flatNodes.length;

      expect(after).toBe(before);
    });

    it('getAncestorIds for non-existent node returns empty', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.getAncestorIds('non-existent')).toEqual([]);
    });

    it('getDescendantIds for non-existent node returns empty', () => {
      const { result } = renderHook(() => useTreeTable(defaultOptions()));

      expect(result.current.getDescendantIds('non-existent')).toEqual([]);
    });
  });
});

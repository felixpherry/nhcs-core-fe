import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from './use-selection';

describe('useSelection', () => {
  // ── Initial state ──

  describe('initial state', () => {
    it('starts empty by default', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));

      expect(result.current.state.selectedKeys.size).toBe(0);
      expect(result.current.state.isEmpty).toBe(true);
    });

    it('starts with initialKeys', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a', 'b'] }));

      expect(result.current.state.selectedKeys.size).toBe(2);
      expect(result.current.state.isSelected('a')).toBe(true);
      expect(result.current.state.isSelected('b')).toBe(true);
      expect(result.current.state.isSelected('c')).toBe(false);
      expect(result.current.state.isEmpty).toBe(false);
    });
  });

  // ── Multi mode ──

  describe('multi mode', () => {
    it('toggleRow adds and removes keys', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(true);

      act(() => result.current.toggleRow('b'));
      expect(result.current.state.selectedKeys.size).toBe(2);

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(false);
      expect(result.current.state.selectedKeys.size).toBe(1);
    });

    it('toggleAll selects all, then deselects all', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));

      const allKeys = ['a', 'b', 'c'];

      act(() => result.current.toggleAll(allKeys));
      expect(result.current.state.selectedKeys.size).toBe(3);

      act(() => result.current.toggleAll(allKeys));
      expect(result.current.state.selectedKeys.size).toBe(0);
    });

    it('toggleAll selects remaining when partially selected', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a'] }));

      act(() => result.current.toggleAll(['a', 'b', 'c']));
      expect(result.current.state.selectedKeys.size).toBe(3);
    });

    it('clear empties selection', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a', 'b'] }));

      act(() => result.current.clear());
      expect(result.current.state.isEmpty).toBe(true);
    });

    it('selectKeys adds keys without removing existing', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a'] }));

      act(() => result.current.selectKeys(['b', 'c']));
      expect(result.current.state.selectedKeys.size).toBe(3);
      expect(result.current.state.isSelected('a')).toBe(true);
      expect(result.current.state.isSelected('b')).toBe(true);
    });

    it('replaceSelection overwrites everything', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a', 'b'] }));

      act(() => result.current.replaceSelection(['x', 'y']));
      expect(result.current.state.selectedKeys.size).toBe(2);
      expect(result.current.state.isSelected('a')).toBe(false);
      expect(result.current.state.isSelected('x')).toBe(true);
    });
  });

  // ── Single mode ──

  describe('single mode', () => {
    it('selecting a row clears previous selection', () => {
      const { result } = renderHook(() => useSelection({ mode: 'single' }));

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(true);

      act(() => result.current.toggleRow('b'));
      expect(result.current.state.isSelected('a')).toBe(false);
      expect(result.current.state.isSelected('b')).toBe(true);
      expect(result.current.state.selectedKeys.size).toBe(1);
    });

    it('clicking same row toggles off when not required', () => {
      const { result } = renderHook(() => useSelection({ mode: 'single', required: false }));

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(true);

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isEmpty).toBe(true);
    });

    it('clicking same row does NOT toggle off when required', () => {
      const { result } = renderHook(() => useSelection({ mode: 'single', required: true }));

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(true);

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(true);
      expect(result.current.state.selectedKeys.size).toBe(1);
    });

    it('selectKeys in single mode only keeps the last key', () => {
      const { result } = renderHook(() => useSelection({ mode: 'single' }));

      act(() => result.current.selectKeys(['a', 'b', 'c']));
      expect(result.current.state.selectedKeys.size).toBe(1);
      expect(result.current.state.isSelected('c')).toBe(true);
    });
  });

  // ── Required guard ──

  describe('required guard', () => {
    it('multi: cannot deselect the last item when required', () => {
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', required: true, initialKeys: ['a'] }),
      );

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(true);
      expect(result.current.state.selectedKeys.size).toBe(1);
    });

    it('multi: can deselect one if others remain when required', () => {
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', required: true, initialKeys: ['a', 'b'] }),
      );

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isSelected('a')).toBe(false);
      expect(result.current.state.selectedKeys.size).toBe(1);
    });

    it('clear does nothing when required', () => {
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', required: true, initialKeys: ['a'] }),
      );

      act(() => result.current.clear());
      expect(result.current.state.selectedKeys.size).toBe(1);
    });

    it('toggleAll does not deselect all when required', () => {
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', required: true, initialKeys: ['a', 'b'] }),
      );

      // First toggleAll selects all — already all selected, so tries to deselect
      act(() => result.current.toggleAll(['a', 'b']));
      // Should NOT deselect because required
      expect(result.current.state.selectedKeys.size).toBe(2);
    });
  });

  // ── isAllSelected / isPartiallySelected ──

  describe('isAllSelected and isPartiallySelected', () => {
    it('isAllSelected returns false when empty', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));

      expect(result.current.state.isAllSelected(['a', 'b', 'c'])).toBe(false);
    });

    it('isAllSelected returns true when all keys are selected', () => {
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', initialKeys: ['a', 'b', 'c'] }),
      );

      expect(result.current.state.isAllSelected(['a', 'b', 'c'])).toBe(true);
    });

    it('isAllSelected returns false when only some keys are selected', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a'] }));

      expect(result.current.state.isAllSelected(['a', 'b', 'c'])).toBe(false);
    });

    it('isAllSelected returns false for empty allKeys', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a'] }));

      expect(result.current.state.isAllSelected([])).toBe(false);
    });

    it('isPartiallySelected returns false when empty', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));

      expect(result.current.state.isPartiallySelected(['a', 'b', 'c'])).toBe(false);
    });

    it('isPartiallySelected returns true when some but not all are selected', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a'] }));

      expect(result.current.state.isPartiallySelected(['a', 'b', 'c'])).toBe(true);
    });

    it('isPartiallySelected returns false when all are selected', () => {
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', initialKeys: ['a', 'b', 'c'] }),
      );

      expect(result.current.state.isPartiallySelected(['a', 'b', 'c'])).toBe(false);
    });

    it('isPartiallySelected returns false for empty allKeys', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi', initialKeys: ['a'] }));

      expect(result.current.state.isPartiallySelected([])).toBe(false);
    });

    it('updates correctly after toggleRow', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));
      const allKeys = ['a', 'b', 'c'];

      act(() => result.current.toggleRow('a'));
      expect(result.current.state.isPartiallySelected(allKeys)).toBe(true);
      expect(result.current.state.isAllSelected(allKeys)).toBe(false);

      act(() => result.current.toggleRow('b'));
      act(() => result.current.toggleRow('c'));
      expect(result.current.state.isPartiallySelected(allKeys)).toBe(false);
      expect(result.current.state.isAllSelected(allKeys)).toBe(true);
    });

    it('updates correctly after toggleAll', () => {
      const { result } = renderHook(() => useSelection({ mode: 'multi' }));
      const allKeys = ['a', 'b', 'c'];

      act(() => result.current.toggleAll(allKeys));
      expect(result.current.state.isAllSelected(allKeys)).toBe(true);
      expect(result.current.state.isPartiallySelected(allKeys)).toBe(false);

      act(() => result.current.toggleAll(allKeys));
      expect(result.current.state.isAllSelected(allKeys)).toBe(false);
      expect(result.current.state.isPartiallySelected(allKeys)).toBe(false);
    });
  });

  // ── Callback ──

  describe('onSelectionChange callback', () => {
    it('fires on toggleRow', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', onSelectionChange: onChange }),
      );

      act(() => result.current.toggleRow('a'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new Set(['a']));
    });

    it('fires on toggleAll', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useSelection({ mode: 'multi', onSelectionChange: onChange }),
      );

      act(() => result.current.toggleAll(['a', 'b']));
      expect(onChange).toHaveBeenCalledWith(new Set(['a', 'b']));
    });

    it('fires on clear', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useSelection({
          mode: 'multi',
          initialKeys: ['a'],
          onSelectionChange: onChange,
        }),
      );

      act(() => result.current.clear());
      expect(onChange).toHaveBeenCalledWith(new Set());
    });

    it('does NOT fire on clear when required (no-op)', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useSelection({
          mode: 'multi',
          required: true,
          initialKeys: ['a'],
          onSelectionChange: onChange,
        }),
      );

      act(() => result.current.clear());
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

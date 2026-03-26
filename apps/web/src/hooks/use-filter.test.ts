import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from './use-filter';

interface TestFilter extends Record<string, unknown> {
  status: string;
  search: string;
  tags: string[];
}

const DEFAULTS: TestFilter = {
  status: '',
  search: '',
  tags: [],
};

describe('useFilter', () => {
  // ══════════════════════════════════════════════════════════════
  // Initial state
  // ══════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('starts with default values for both draft and applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      expect(result.current.draft).toEqual(DEFAULTS);
      expect(result.current.applied).toEqual(DEFAULTS);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.activeCount).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Draft operations
  // ══════════════════════════════════════════════════════════════

  describe('draft operations', () => {
    it('setDraftFieldValue updates a single draft field', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));

      expect(result.current.draft.status).toBe('active');
      expect(result.current.applied.status).toBe(''); // applied unchanged
    });

    it('setDraft replaces entire draft', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraft({ status: 'active', search: 'hello', tags: ['a'] }));

      expect(result.current.draft).toEqual({
        status: 'active',
        search: 'hello',
        tags: ['a'],
      });
      expect(result.current.applied).toEqual(DEFAULTS);
    });

    it('resetDraft reverts draft to current applied values', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      // Apply some filters first
      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());

      // Change draft further
      act(() => result.current.setDraftFieldValue('search', 'test'));
      expect(result.current.draft.search).toBe('test');

      // Reset draft → should go back to applied (status: 'active', search: '')
      act(() => result.current.resetDraft());

      expect(result.current.draft).toEqual({ status: 'active', search: '', tags: [] });
    });

    it('resetFields resets specific draft fields to defaults', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraft({ status: 'active', search: 'hello', tags: ['a'] }));
      act(() => result.current.resetFields(['status', 'tags']));

      expect(result.current.draft.status).toBe('');
      expect(result.current.draft.tags).toEqual([]);
      expect(result.current.draft.search).toBe('hello'); // untouched
    });

    it('resetFields ignores unknown field names', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.resetFields(['nonexistent']));

      expect(result.current.draft.status).toBe('active');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Apply / Reset
  // ══════════════════════════════════════════════════════════════

  describe('apply and reset', () => {
    it('apply copies draft to applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());

      expect(result.current.applied.status).toBe('active');
      expect(result.current.isDirty).toBe(false);
    });

    it('resetApplied clears both draft and applied to defaults', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());
      expect(result.current.applied.status).toBe('active');

      act(() => result.current.resetApplied());

      expect(result.current.draft).toEqual(DEFAULTS);
      expect(result.current.applied).toEqual(DEFAULTS);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Dirty tracking
  // ══════════════════════════════════════════════════════════════

  describe('dirty tracking', () => {
    it('is dirty when draft differs from applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      expect(result.current.isDirty).toBe(true);
    });

    it('is not dirty after apply', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());
      expect(result.current.isDirty).toBe(false);
    });

    it('is not dirty after resetDraft', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.resetDraft());
      expect(result.current.isDirty).toBe(false);
    });

    it('is not dirty when draft is changed back to match applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.setDraftFieldValue('status', ''));
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Active count
  // ══════════════════════════════════════════════════════════════

  describe('active count', () => {
    it('counts non-empty applied fields', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraft({ status: 'active', search: 'test', tags: [] }));
      act(() => result.current.apply());

      // status: 'active' ✓, search: 'test' ✓, tags: [] ✗
      expect(result.current.activeCount).toBe(2);
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns 0 when no filters are applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      expect(result.current.activeCount).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('does not count draft-only changes', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('status', 'active'));

      // Draft changed but not applied — activeCount stays 0
      expect(result.current.activeCount).toBe(0);
    });

    it('counts non-empty arrays as active', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('tags', ['a', 'b']));
      act(() => result.current.apply());

      expect(result.current.activeCount).toBe(1);
    });

    it('uses custom isFieldActive when provided', () => {
      // Custom: only count 'status' as active, ignore everything else
      const isFieldActive = (key: keyof TestFilter, value: unknown) => {
        if (key === 'status') return value !== '';
        return false;
      };

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, isFieldActive }));

      act(() => result.current.setDraft({ status: 'active', search: 'test', tags: ['a'] }));
      act(() => result.current.apply());

      // Only status counts
      expect(result.current.activeCount).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Lifecycle callbacks
  // ══════════════════════════════════════════════════════════════

  describe('onApply', () => {
    it('is called with applied values when apply() is called', () => {
      const onApply = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onApply }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());

      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onApply).toHaveBeenCalledWith({
        status: 'active',
        search: '',
        tags: [],
      });
    });

    it('is not called on setDraftFieldValue', () => {
      const onApply = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onApply }));

      act(() => result.current.setDraftFieldValue('status', 'active'));

      expect(onApply).not.toHaveBeenCalled();
    });

    it('is not called on resetApplied', () => {
      const onApply = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onApply }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());
      onApply.mockClear();

      act(() => result.current.resetApplied());

      // resetApplied fires onReset, not onApply
      expect(onApply).not.toHaveBeenCalled();
    });
  });

  describe('onReset', () => {
    it('is called when resetApplied() is called', () => {
      const onReset = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onReset }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());
      act(() => result.current.resetApplied());

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('is not called on apply', () => {
      const onReset = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onReset }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      act(() => result.current.apply());

      expect(onReset).not.toHaveBeenCalled();
    });
  });

  describe('onDraftChange', () => {
    it('is called with new draft values on setDraftFieldValue', () => {
      const onDraftChange = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onDraftChange }));

      act(() => result.current.setDraftFieldValue('status', 'active'));

      expect(onDraftChange).toHaveBeenCalledTimes(1);
      expect(onDraftChange).toHaveBeenCalledWith({
        status: 'active',
        search: '',
        tags: [],
      });
    });

    it('is called with new draft values on setDraft', () => {
      const onDraftChange = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onDraftChange }));

      act(() => result.current.setDraft({ status: 'active', search: 'hello', tags: [] }));

      expect(onDraftChange).toHaveBeenCalledTimes(1);
      expect(onDraftChange).toHaveBeenCalledWith({
        status: 'active',
        search: 'hello',
        tags: [],
      });
    });

    it('is not called on resetDraft (not a user edit)', () => {
      const onDraftChange = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onDraftChange }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      onDraftChange.mockClear();

      act(() => result.current.resetDraft());

      // resetDraft is "undo my edits", not "user edited a field"
      expect(onDraftChange).not.toHaveBeenCalled();
    });

    it('is not called on resetFields', () => {
      const onDraftChange = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onDraftChange }));

      act(() => result.current.setDraftFieldValue('status', 'active'));
      onDraftChange.mockClear();

      act(() => result.current.resetFields(['status']));

      expect(onDraftChange).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Combined
  // ══════════════════════════════════════════════════════════════

  describe('full workflow', () => {
    it('edit → apply → edit more → resetDraft → apply again', () => {
      const onApply = vi.fn();

      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS, onApply }));

      // Edit draft
      act(() => result.current.setDraftFieldValue('status', 'active'));
      expect(result.current.isDirty).toBe(true);

      // Apply
      act(() => result.current.apply());
      expect(result.current.isDirty).toBe(false);
      expect(result.current.activeCount).toBe(1);

      // Edit more
      act(() => result.current.setDraftFieldValue('search', 'test'));
      expect(result.current.isDirty).toBe(true);

      // Discard draft edits
      act(() => result.current.resetDraft());
      expect(result.current.isDirty).toBe(false);
      expect(result.current.draft.search).toBe(''); // reverted
      expect(result.current.applied.status).toBe('active'); // unchanged

      // Edit and apply again
      act(() => result.current.setDraftFieldValue('tags', ['a']));
      act(() => result.current.apply());

      expect(onApply).toHaveBeenCalledTimes(2);
      expect(result.current.activeCount).toBe(2); // status + tags
    });
  });
});

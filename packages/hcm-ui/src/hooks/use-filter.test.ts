import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from './use-filter';

interface TestFilter extends Record<string, unknown> {
  search: string;
  status: string | null;
  groupId: number | null;
  tags: string[];
}

const DEFAULTS: TestFilter = {
  search: '',
  status: null,
  groupId: null,
  tags: [],
};

describe('useFilter', () => {
  // ── Initial state ──

  describe('initial state', () => {
    it('starts with default values for both draft and applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      expect(result.current.draft).toEqual(DEFAULTS);
      expect(result.current.applied).toEqual(DEFAULTS);
      expect(result.current.activeCount).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ── Draft operations ──

  describe('draft operations', () => {
    it('setDraftFieldValue updates a single field', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('search', 'acme'));
      expect(result.current.draft.search).toBe('acme');
      // Applied unchanged
      expect(result.current.applied.search).toBe('');
    });

    it('setDraft replaces entire draft', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() =>
        result.current.setDraft({
          search: 'test',
          status: 'T',
          groupId: 5,
          tags: ['a'],
        }),
      );

      expect(result.current.draft.search).toBe('test');
      expect(result.current.draft.status).toBe('T');
      expect(result.current.draft.groupId).toBe(5);
      expect(result.current.draft.tags).toEqual(['a']);
      // Applied still defaults
      expect(result.current.applied).toEqual(DEFAULTS);
    });

    it('changing draft makes isDirty true', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      expect(result.current.isDirty).toBe(false);

      act(() => result.current.setDraftFieldValue('search', 'test'));
      expect(result.current.isDirty).toBe(true);
    });
  });

  // ── Apply ──

  describe('apply', () => {
    it('copies draft into applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('search', 'acme'));
      act(() => result.current.setDraftFieldValue('status', 'T'));
      act(() => result.current.apply());

      expect(result.current.applied.search).toBe('acme');
      expect(result.current.applied.status).toBe('T');
    });

    it('isDirty becomes false after apply', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('search', 'acme'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.apply());
      expect(result.current.isDirty).toBe(false);
    });

    it('activeCount updates after apply', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('search', 'acme'));
      // Not applied yet — activeCount still 0
      expect(result.current.activeCount).toBe(0);

      act(() => result.current.apply());
      expect(result.current.activeCount).toBe(1);
    });
  });

  // ── Reset draft ──

  describe('resetDraft', () => {
    it('reverts draft back to applied', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      // Apply a filter
      act(() => result.current.setDraftFieldValue('search', 'acme'));
      act(() => result.current.apply());

      // Make a new draft change
      act(() => result.current.setDraftFieldValue('search', 'something else'));
      expect(result.current.draft.search).toBe('something else');
      expect(result.current.isDirty).toBe(true);

      // Reset draft — goes back to applied
      act(() => result.current.resetDraft());
      expect(result.current.draft.search).toBe('acme');
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ── Reset applied ──

  describe('resetApplied', () => {
    it('clears everything back to defaults', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      // Apply some filters
      act(() => result.current.setDraftFieldValue('search', 'acme'));
      act(() => result.current.setDraftFieldValue('status', 'T'));
      act(() => result.current.apply());

      expect(result.current.activeCount).toBe(2);

      // Reset
      act(() => result.current.resetApplied());
      expect(result.current.draft).toEqual(DEFAULTS);
      expect(result.current.applied).toEqual(DEFAULTS);
      expect(result.current.activeCount).toBe(0);
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ── Reset fields ──

  describe('resetFields', () => {
    it('resets specific draft fields to defaults', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => {
        result.current.setDraftFieldValue('search', 'acme');
        result.current.setDraftFieldValue('status', 'T');
        result.current.setDraftFieldValue('groupId', 5);
      });

      // Reset only search and status
      act(() => result.current.resetFields(['search', 'status']));

      expect(result.current.draft.search).toBe('');
      expect(result.current.draft.status).toBeNull();
      // groupId untouched
      expect(result.current.draft.groupId).toBe(5);
    });

    it('does not affect applied values', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => result.current.setDraftFieldValue('search', 'acme'));
      act(() => result.current.apply());

      act(() => result.current.resetFields(['search']));
      // Draft reset
      expect(result.current.draft.search).toBe('');
      // Applied unchanged
      expect(result.current.applied.search).toBe('acme');
    });
  });

  // ── Active count ──

  describe('activeCount', () => {
    it('counts non-empty applied values', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => {
        result.current.setDraftFieldValue('search', 'acme');
        result.current.setDraftFieldValue('status', 'T');
        result.current.setDraftFieldValue('groupId', 3);
      });
      act(() => result.current.apply());

      expect(result.current.activeCount).toBe(3);
    });

    it('does not count null, empty string, or empty array', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      act(() => {
        result.current.setDraftFieldValue('search', '');
        result.current.setDraftFieldValue('status', null);
        result.current.setDraftFieldValue('tags', []);
      });
      act(() => result.current.apply());

      expect(result.current.activeCount).toBe(0);
    });

    it('supports custom isFieldActive', () => {
      const { result } = renderHook(() =>
        useFilter({
          defaultValues: DEFAULTS,
          isFieldActive: (key, value) => {
            // Only count 'search' as active
            if (key === 'search') return typeof value === 'string' && value.length > 0;
            return false;
          },
        }),
      );

      act(() => {
        result.current.setDraftFieldValue('search', 'acme');
        result.current.setDraftFieldValue('status', 'T');
      });
      act(() => result.current.apply());

      // Only search counts
      expect(result.current.activeCount).toBe(1);
    });
  });

  // ── Integration: useFieldVisibility bridge ──

  describe('resetFields as useFieldVisibility bridge', () => {
    it('simulates hide field → reset draft flow', () => {
      const { result } = renderHook(() => useFilter({ defaultValues: DEFAULTS }));

      // User sets filters
      act(() => {
        result.current.setDraftFieldValue('search', 'acme');
        result.current.setDraftFieldValue('status', 'T');
        result.current.setDraftFieldValue('groupId', 5);
      });

      // User hides the status field → onFieldsHidden calls resetFields
      act(() => result.current.resetFields(['status']));

      expect(result.current.draft.status).toBeNull();
      expect(result.current.draft.search).toBe('acme');
      expect(result.current.draft.groupId).toBe(5);

      // User applies — status won't be in the query
      act(() => result.current.apply());
      expect(result.current.applied.status).toBeNull();
      expect(result.current.activeCount).toBe(2);
    });
  });
});

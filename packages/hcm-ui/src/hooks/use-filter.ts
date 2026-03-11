'use client';

import { useState, useCallback, useMemo } from 'react';

// ── Types ──

export interface UseFilterOptions<TFilter extends Record<string, unknown>> {
  /** Default/empty filter values */
  defaultValues: TFilter;
  /** Count a field as "active" if it differs from this */
  isFieldActive?: (key: keyof TFilter, value: unknown) => boolean;
}

export interface UseFilterReturn<TFilter extends Record<string, unknown>> {
  /** Current draft values (user is editing these) */
  draft: TFilter;
  /** Currently applied values (table is filtered by these) */
  applied: TFilter;
  /** Update a single draft field */
  setDraftFieldValue: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;
  /** Replace entire draft */
  setDraft: (values: TFilter) => void;
  /** Copy draft → applied */
  apply: () => void;
  /** Revert draft back to current applied values */
  resetDraft: () => void;
  /** Clear all filters (both draft and applied) back to defaults */
  resetApplied: () => void;
  /** Reset specific fields in draft to defaults */
  resetFields: (fieldNames: string[]) => void;
  /** Number of active (non-default) applied filters */
  activeCount: number;
  /** Whether any filter is applied */
  hasActiveFilters: boolean;
  /** Whether draft differs from applied */
  isDirty: boolean;
}

// ── Default "is active" check ──

function defaultIsFieldActive(_key: string, value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

// ── Deep equality check (simple, covers our use case) ──

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => isEqual(aObj[key], bObj[key]));
}

// ── Hook ──

export function useFilter<TFilter extends Record<string, unknown>>(
  options: UseFilterOptions<TFilter>,
): UseFilterReturn<TFilter> {
  const { defaultValues, isFieldActive } = options;

  const checkActive = isFieldActive ?? defaultIsFieldActive;

  const [draft, setDraftState] = useState<TFilter>(() => ({ ...defaultValues }));
  const [applied, setApplied] = useState<TFilter>(() => ({ ...defaultValues }));

  const setDraftFieldValue = useCallback(<K extends keyof TFilter>(key: K, value: TFilter[K]) => {
    setDraftState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDraft = useCallback((values: TFilter) => {
    setDraftState({ ...values });
  }, []);

  const apply = useCallback(() => {
    setApplied({ ...draft });
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraftState({ ...applied });
  }, [applied]);

  const resetApplied = useCallback(() => {
    setDraftState({ ...defaultValues });
    setApplied({ ...defaultValues });
  }, [defaultValues]);

  const resetFields = useCallback(
    (fieldNames: string[]) => {
      setDraftState((prev) => {
        const next = { ...prev };
        for (const name of fieldNames) {
          if (name in defaultValues) {
            (next as Record<string, unknown>)[name] = defaultValues[name as keyof TFilter];
          }
        }
        return next;
      });
    },
    [defaultValues],
  );

  // ── Derived state ──

  const activeCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(applied)) {
      if (checkActive(key, applied[key as keyof TFilter])) {
        count++;
      }
    }
    return count;
  }, [applied, checkActive]);

  const hasActiveFilters = activeCount > 0;

  const isDirty = useMemo(() => !isEqual(draft, applied), [draft, applied]);

  return {
    draft,
    applied,
    setDraftFieldValue,
    setDraft,
    apply,
    resetDraft,
    resetApplied,
    resetFields,
    activeCount,
    hasActiveFilters,
    isDirty,
  };
}

'use client';

import { useState } from 'react';
import { isEqual } from '@/lib/is-equal';

// ── Types ──

export interface UseFilterOptions<TFilter extends Record<string, unknown>> {
  /** Default/empty filter values */
  defaultValues: TFilter;
  /** Count a field as "active" if it differs from this */
  isFieldActive?: (key: keyof TFilter, value: unknown) => boolean;

  // ── Lifecycle callbacks ──

  /** Called after draft is copied to applied (via apply()) */
  onApply?: (values: TFilter) => void;
  /** Called after filters are reset to defaults (via resetApplied()) */
  onReset?: () => void;
  /** Called when draft values change (via setDraftFieldValue or setDraft) */
  onDraftChange?: (values: TFilter) => void;
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

// ── Hook ──

export function useFilter<TFilter extends Record<string, unknown>>(
  options: UseFilterOptions<TFilter>,
): UseFilterReturn<TFilter> {
  const { defaultValues, isFieldActive, onApply, onReset, onDraftChange } = options;

  const checkActive = isFieldActive ?? defaultIsFieldActive;

  const [draft, setDraftState] = useState<TFilter>(() => ({ ...defaultValues }));
  const [applied, setApplied] = useState<TFilter>(() => ({ ...defaultValues }));

  // ── Draft operations ──

  const setDraftFieldValue = <K extends keyof TFilter>(key: K, value: TFilter[K]) => {
    setDraftState((prev) => {
      const next = { ...prev, [key]: value };
      onDraftChange?.(next);
      return next;
    });
  };

  const setDraft = (values: TFilter) => {
    const next = { ...values };
    setDraftState(next);
    onDraftChange?.(next);
  };

  // ── Apply / Reset ──

  const apply = () => {
    const snapshot = { ...draft };
    setApplied(snapshot);
    onApply?.(snapshot);
  };

  const resetDraft = () => {
    setDraftState({ ...applied });
  };

  const resetApplied = () => {
    setDraftState({ ...defaultValues });
    setApplied({ ...defaultValues });
    onReset?.();
  };

  const resetFields = (fieldNames: string[]) => {
    setDraftState((prev) => {
      const next = { ...prev };
      for (const name of fieldNames) {
        if (name in defaultValues) {
          (next as Record<string, unknown>)[name] = defaultValues[name as keyof TFilter];
        }
      }
      return next;
    });
  };

  // ── Derived state ──

  let activeCount = 0;
  for (const key of Object.keys(applied)) {
    if (checkActive(key, applied[key as keyof TFilter])) {
      activeCount++;
    }
  }

  const hasActiveFilters = activeCount > 0;

  const isDirty = !isEqual(draft, applied);

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

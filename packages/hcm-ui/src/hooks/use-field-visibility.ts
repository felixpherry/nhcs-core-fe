'use client';

import { useState, useCallback, useMemo } from 'react';

// ── Types ──

export interface UseFieldVisibilityOptions {
  /** Unique key for persistence (e.g. 'company-filter', 'employee-filter') */
  scopeKey: string;
  /** All available field IDs */
  allFieldIds: string[];
  /** Which fields are visible by default */
  defaultVisibleFieldIds?: string[];
  /** Load saved visibility from storage */
  load?: (scopeKey: string) => string[] | null;
  /** Save visibility to storage */
  save?: (scopeKey: string, visibleIds: string[]) => void;
  /** Callback when fields are hidden — use to reset their values */
  onFieldsHidden?: (hiddenFieldIds: string[]) => void;
}

export interface UseFieldVisibilityReturn {
  /** Currently visible field IDs */
  visibleIds: Set<string>;
  /** Toggle a single field */
  toggle: (fieldId: string) => void;
  /** Show all fields */
  showAll: () => void;
  /** Hide all fields */
  hideAll: () => void;
  /** Reset to default visibility */
  resetToDefaults: () => void;
  /** Check if a specific field is visible */
  isVisible: (fieldId: string) => boolean;
  /** Derived state */
  areAllVisible: boolean;
  areNoneVisible: boolean;
  visibleCount: number;
}

// ── Hook ──

export function useFieldVisibility(options: UseFieldVisibilityOptions): UseFieldVisibilityReturn {
  const { scopeKey, allFieldIds, defaultVisibleFieldIds, load, save, onFieldsHidden } = options;

  // Default: all fields visible if no defaults specified
  const defaults = useMemo(
    () => new Set(defaultVisibleFieldIds ?? allFieldIds),
    [defaultVisibleFieldIds, allFieldIds],
  );

  // Initialize from persisted state or defaults
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => {
    if (load) {
      const saved = load(scopeKey);
      if (saved) return new Set(saved);
    }
    return new Set(defaults);
  });

  // Persist when visibility changes
  const updateVisibility = useCallback(
    (next: Set<string>, hiddenIds?: string[]) => {
      setVisibleIds(next);
      save?.(scopeKey, Array.from(next));
      if (hiddenIds && hiddenIds.length > 0) {
        onFieldsHidden?.(hiddenIds);
      }
    },
    [scopeKey, save, onFieldsHidden],
  );

  const toggle = useCallback(
    (fieldId: string) => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        if (next.has(fieldId)) {
          next.delete(fieldId);
          updateVisibility(next, [fieldId]);
        } else {
          next.add(fieldId);
          updateVisibility(next);
        }
        return next;
      });
    },
    [updateVisibility],
  );

  const showAll = useCallback(() => {
    updateVisibility(new Set(allFieldIds));
  }, [allFieldIds, updateVisibility]);

  const hideAll = useCallback(() => {
    const newlyHidden = allFieldIds.filter((id) => visibleIds.has(id));
    updateVisibility(new Set(), newlyHidden);
  }, [allFieldIds, visibleIds, updateVisibility]);

  const resetToDefaults = useCallback(() => {
    const willBeHidden = Array.from(visibleIds).filter((id) => !defaults.has(id));
    updateVisibility(new Set(defaults), willBeHidden);
  }, [visibleIds, defaults, updateVisibility]);

  const isVisible = useCallback((fieldId: string) => visibleIds.has(fieldId), [visibleIds]);

  // ── Derived state ──

  const areAllVisible = visibleIds.size === allFieldIds.length;
  const areNoneVisible = visibleIds.size === 0;
  const visibleCount = visibleIds.size;

  return {
    visibleIds,
    toggle,
    showAll,
    hideAll,
    resetToDefaults,
    isVisible,
    areAllVisible,
    areNoneVisible,
    visibleCount,
  };
}

'use client';

import { useState, useCallback, useMemo } from 'react';

// ── Types ──

export interface SelectionState {
  selectedKeys: Set<string>;
  isSelected: (key: string) => boolean;
  isAllSelected: (allKeys: string[]) => boolean;
  isPartiallySelected: (allKeys: string[]) => boolean;
  isEmpty: boolean;
}

export interface UseSelectionOptions {
  mode: 'single' | 'multi';
  initialKeys?: string[];
  required?: boolean;
  onSelectionChange?: (selectedKeys: Set<string>) => void;
}

export interface UseSelectionReturn {
  state: SelectionState;
  toggleRow: (key: string) => void;
  toggleAll: (allKeys: string[]) => void;
  selectOnly: (key: string) => void;
  clear: () => void;
  selectKeys: (keys: string[]) => void;
  replaceSelection: (keys: string[]) => void;
}

// ── Hook ──

export function useSelection(options: UseSelectionOptions): UseSelectionReturn {
  const { mode, initialKeys = [], required = false, onSelectionChange } = options;

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set(initialKeys));

  // Wrap setSelectedKeys to fire callback
  const updateKeys = useCallback(
    (next: Set<string>) => {
      setSelectedKeys(next);
      onSelectionChange?.(next);
    },
    [onSelectionChange],
  );

  const toggleRow = useCallback(
    (key: string) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);

        if (mode === 'single') {
          if (next.has(key)) {
            // Toggle off — only if not required
            if (!required) {
              next.clear();
            }
            // If required, do nothing — can't deselect
          } else {
            // Select this one, clear others
            next.clear();
            next.add(key);
          }
        } else {
          // Multi mode
          if (next.has(key)) {
            // Don't allow deselect if required and it's the last one
            if (required && next.size === 1) {
              return prev;
            }
            next.delete(key);
          } else {
            next.add(key);
          }
        }

        onSelectionChange?.(next);
        return next;
      });
    },
    [mode, required, onSelectionChange],
  );

  const toggleAll = useCallback(
    (allKeys: string[]) => {
      setSelectedKeys((prev) => {
        // If all are selected, deselect all (unless required)
        const allSelected = allKeys.length > 0 && allKeys.every((k) => prev.has(k));

        let next: Set<string>;
        if (allSelected) {
          if (required) return prev; // Can't clear all if required
          next = new Set<string>();
        } else {
          next = new Set(allKeys);
        }

        onSelectionChange?.(next);
        return next;
      });
    },
    [required, onSelectionChange],
  );

  const selectOnly = useCallback(
    (key: string) => {
      const next = new Set([key]);
      updateKeys(next);
    },
    [updateKeys],
  );

  const clear = useCallback(() => {
    if (required) return; // Can't clear if required
    updateKeys(new Set());
  }, [required, updateKeys]);

  const selectKeys = useCallback(
    (keys: string[]) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const key of keys) {
          if (mode === 'single') {
            next.clear();
          }
          next.add(key);
        }
        onSelectionChange?.(next);
        return next;
      });
    },
    [mode, onSelectionChange],
  );

  const replaceSelection = useCallback(
    (keys: string[]) => {
      const next = new Set(keys);
      updateKeys(next);
    },
    [updateKeys],
  );

  // ── Derived state ──

  const state = useMemo<SelectionState>(
    () => ({
      selectedKeys,
      isSelected: (key: string) => selectedKeys.has(key),
      isAllSelected: (allKeys: string[]) =>
        allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k)),
      isPartiallySelected: (allKeys: string[]) => {
        if (allKeys.length === 0) return false;
        const someSelected = allKeys.some((k) => selectedKeys.has(k));
        const allSelected = allKeys.every((k) => selectedKeys.has(k));
        return someSelected && !allSelected;
      },
      isEmpty: selectedKeys.size === 0,
    }),
    [selectedKeys],
  );

  return {
    state,
    toggleRow,
    toggleAll,
    selectOnly,
    clear,
    selectKeys,
    replaceSelection,
  };
}

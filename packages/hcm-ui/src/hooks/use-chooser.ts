'use client';

import { useState, useCallback, useRef, useMemo } from 'react';

import { useSelection } from './use-selection';
import type { UseSelectionReturn } from './use-selection';

// ── Types ──

export interface UseChooserOptions<TData, TValue = TData> {
  /** Selection mode */
  mode: 'single' | 'multi';
  /** Block confirm when selection is empty */
  required?: boolean;
  /** Extract unique string key from a table row */
  rowKey: (row: TData) => string;
  /** Project full table row → form value shape. Called only at confirm time. */
  mapSelected: (row: TData) => TValue;
  /** Called when user confirms selection */
  onConfirm?: (result: ChooserResult<TValue>) => void;
  /** Called when user cancels (after revert) */
  onCancel?: () => void;
}

export interface ChooserResult<TValue> {
  /** The selected keys (always authoritative) */
  selectedKeys: string[];
  /** Projected items from captured rows (best-effort — only includes rows seen in table) */
  selectedItems: TValue[];
}

export interface UseChooserReturn<TData, TValue> {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Open the dialog. Optionally pre-select keys (overrides current selection). */
  open: (preselectedKeys?: string[]) => void;
  /** Close the dialog without saving (reverts selection to pre-open state) */
  cancel: () => void;
  /** Confirm selection and close. Returns false if required validation fails. */
  confirm: () => boolean;
  /** Whether confirm is currently allowed (false when required + empty) */
  canConfirm: boolean;
  /** Selection state and actions — pass to DataTable */
  selection: UseSelectionReturn;
  /** Feed table data into the row cache. Call whenever table data changes. */
  trackRows: (rows: TData[]) => void;
  /** Remove a key from selection (for use outside dialog, e.g. chip × button) */
  remove: (key: string) => void;
  /** The current confirmed result (null before first confirm) */
  result: ChooserResult<TValue> | null;
}

// ── Hook ──

export function useChooser<TData, TValue = TData>(
  options: UseChooserOptions<TData, TValue>,
): UseChooserReturn<TData, TValue> {
  const { mode, required = false, rowKey, mapSelected, onConfirm, onCancel } = options;

  // ── Dialog state ──

  const [isOpen, setIsOpen] = useState(false);

  // ── Snapshot for cancel/revert ──

  const snapshotRef = useRef<string[]>([]);

  // ── Row object cache ──
  // Accumulates TData objects as the table renders pages.
  // Keyed by rowKey(row). Never cleared during a session — only on open().

  const rowCacheRef = useRef<Map<string, TData>>(new Map());

  // ── Confirmed result (persisted across open/close cycles) ──

  const [result, setResult] = useState<ChooserResult<TValue> | null>(null);

  // ── Selection (delegates to useSelection) ──

  const selection = useSelection({
    mode,
    required,
  });

  // ── Open ──

  const open = useCallback(
    (preselectedKeys?: string[]) => {
      const keys = preselectedKeys ?? [];

      // Snapshot current selection for cancel/revert
      snapshotRef.current = keys;

      // Seed selection with pre-selected keys
      selection.replaceSelection(keys);

      // Clear row cache for fresh session
      rowCacheRef.current = new Map();

      setIsOpen(true);
    },
    [selection],
  );

  // ── Cancel ──

  const cancel = useCallback(() => {
    // Revert selection to snapshot
    selection.replaceSelection(snapshotRef.current);
    setIsOpen(false);
    onCancel?.();
  }, [selection, onCancel]);

  // ── Confirm ──

  const confirm = useCallback((): boolean => {
    // Required validation
    if (required && selection.state.isEmpty) {
      return false;
    }

    // Build result from captured rows
    const selectedKeys = Array.from(selection.state.selectedKeys);
    const selectedItems: TValue[] = [];

    for (const key of selectedKeys) {
      const row = rowCacheRef.current.get(key);
      if (row) {
        selectedItems.push(mapSelected(row));
      }
    }

    const chooserResult: ChooserResult<TValue> = {
      selectedKeys,
      selectedItems,
    };

    setResult(chooserResult);
    setIsOpen(false);
    onConfirm?.(chooserResult);

    return true;
  }, [required, selection.state, mapSelected, onConfirm]);

  // ── Can confirm (for disabled button state) ──

  const canConfirm = useMemo(() => {
    if (required && selection.state.isEmpty) return false;
    return true;
  }, [required, selection.state.isEmpty]);

  // ── Track rows (feed table data into cache) ──

  const trackRows = useCallback(
    (rows: TData[]) => {
      for (const row of rows) {
        const key = rowKey(row);
        rowCacheRef.current.set(key, row);
      }
    },
    [rowKey],
  );

  // ── Remove (for use outside dialog, e.g. chip × in the form) ──

  const remove = useCallback(
    (key: string) => {
      selection.toggleRow(key);
    },
    [selection],
  );

  return {
    isOpen,
    open,
    cancel,
    confirm,
    canConfirm,
    selection,
    trackRows,
    remove,
    result,
  };
}

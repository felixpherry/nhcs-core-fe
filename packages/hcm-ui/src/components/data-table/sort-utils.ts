import type { ColumnConfig } from './column-types';

// ── TanStack Table sorting state ──

export interface SortingState {
  id: string;
  desc: boolean;
}

// ── Backend orderBys format ──

export interface OrderBy {
  item1: string;
  item2: boolean; // true = ascending
}

// ── Sort mapping ──

export interface SortMapping {
  /** Column ID → backend sort key */
  [columnId: string]: string;
}

/**
 * Build a sort mapping from column configs.
 * Maps column id → sortKey (or accessorKey as fallback).
 */
export function buildSortMapping<TData>(columns: ColumnConfig<TData>[]): SortMapping {
  const mapping: SortMapping = {};

  for (const col of columns) {
    if (col.sortable && col.sortKey) {
      mapping[col.id] = col.sortKey;
    } else if (col.sortable && col.accessorKey) {
      mapping[col.id] = col.accessorKey;
    }
  }

  return mapping;
}

/**
 * Convert TanStack Table sorting state to backend orderBys format.
 *
 * Note: item2 is INVERTED from TanStack's `desc`.
 * TanStack: desc=true means descending
 * Backend:  item2=true means ascending
 */
export function sortingToOrderBys(sorting: SortingState[], mapping: SortMapping): OrderBy[] {
  return sorting
    .filter((sort) => mapping[sort.id])
    .map((sort) => ({
      item1: mapping[sort.id]!,
      item2: !sort.desc, // Invert: TanStack desc=true → backend item2=false
    }));
}

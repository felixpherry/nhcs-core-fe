'use client';

import { useState } from 'react';
import type { ColumnConfig } from '../components/data-table/column-types';
import {
  buildSortMapping,
  sortingToOrderBys,
  type SortingState,
  type OrderBy,
} from '../components/data-table/sort-utils';
import { useSelection, type UseSelectionOptions, type UseSelectionReturn } from './use-selection';

// ── Types ──

export interface UseDataTableOptions<TData> {
  columns: ColumnConfig<TData>[];
  getRowId: (row: TData) => string;

  // ── Controlled data (from your query) ──

  /** Row data to display. Defaults to `[]`. */
  data?: TData[];
  /** Total row count across all pages (for pagination). Defaults to `0`. */
  totalCount?: number;
  /** Whether the initial query is loading (no data yet). Defaults to `false`. */
  isLoading?: boolean;
  /** Whether a background refetch is in progress (has stale data). Defaults to `false`. */
  isFetching?: boolean;

  // ── Pagination ──

  defaultPageSize?: number;
  pageSizeOptions?: number[];

  /** Controlled page number (1-based). When set, internal page state is bypassed. */
  page?: number;
  /** Called when page changes. Required when `page` is controlled. */
  onPageChange?: (page: number) => void;
  /** Controlled page size. When set, internal pageSize state is bypassed. */
  pageSize?: number;
  /** Called when page size changes. Required when `pageSize` is controlled. */
  onPageSizeChange?: (size: number) => void;

  // ── Sorting ──

  defaultSorting?: SortingState[];

  // ── Selection ──

  selection?: Omit<UseSelectionOptions, 'mode'> & { mode?: 'single' | 'multi' };
}

export interface UseDataTableReturn<TData> {
  // ── Data ──
  data: TData[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isEmpty: boolean;

  // ── Pagination ──
  page: number;
  pageSize: number;
  pageCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
  canPreviousPage: boolean;
  canNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;

  // ── Sorting ──
  sorting: SortingState[];
  setSorting: (sorting: SortingState[]) => void;
  toggleSort: (columnId: string) => void;
  orderBys: OrderBy[];
  clearSorting: () => void;

  // ── Query state (read this to build your tRPC input) ──
  queryState: {
    page: number;
    pageSize: number;
    orderBys: OrderBy[];
  };

  // ── Column visibility ──
  visibleColumns: ColumnConfig<TData>[];
  columnVisibility: Record<string, boolean>;
  toggleColumnVisibility: (columnId: string) => void;

  // ── Selection ──
  selection: UseSelectionReturn | null;

  // ── Columns ──
  columns: ColumnConfig<TData>[];
  getRowId: (row: TData) => string;
}

// ── Hook ──

export function useDataTable<TData>(
  options: UseDataTableOptions<TData>,
): UseDataTableReturn<TData> {
  const {
    columns,
    getRowId,
    // Controlled data
    data: controlledData,
    totalCount: controlledTotalCount,
    isLoading: controlledIsLoading,
    isFetching: controlledIsFetching,
    // Pagination
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    defaultSorting = [],
    selection: selectionOptions,
    // Controlled pagination
    page: controlledPage,
    onPageChange,
    pageSize: controlledPageSize,
    onPageSizeChange,
  } = options;

  // ── Data (controlled via props — no internal state needed) ──

  const data = controlledData ?? [];
  const totalCount = controlledTotalCount ?? 0;
  const isLoading = controlledIsLoading ?? false;
  const isFetching = controlledIsFetching ?? false;

  // ── Pagination ──

  const isPageControlled = controlledPage !== undefined;
  const isPageSizeControlled = controlledPageSize !== undefined;

  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);

  const page = isPageControlled ? controlledPage : internalPage;
  const pageSize = isPageSizeControlled ? controlledPageSize : internalPageSize;

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const canPreviousPage = page > 1;
  const canNextPage = page < pageCount;

  const setPage = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, pageCount || 1));
    if (isPageControlled) {
      onPageChange?.(clamped);
    } else {
      setInternalPage(clamped);
    }
  };

  const setPageSize = (size: number) => {
    if (isPageSizeControlled) {
      onPageSizeChange?.(size);
    } else {
      setInternalPageSize(size);
    }
    // Reset to page 1 when page size changes
    if (isPageControlled) {
      onPageChange?.(1);
    } else {
      setInternalPage(1);
    }
  };

  const previousPage = () => setPage(page - 1);
  const nextPage = () => setPage(page + 1);

  // ── Sorting ──

  const [sorting, setSorting] = useState<SortingState[]>(defaultSorting);

  const sortMapping = buildSortMapping(columns);
  const orderBys = sortingToOrderBys(sorting, sortMapping);

  const toggleSort = (columnId: string) => {
    setSorting((prev) => {
      const existing = prev.find((s) => s.id === columnId);
      if (!existing) {
        return [...prev, { id: columnId, desc: false }];
      }
      if (!existing.desc) {
        return prev.map((s) => (s.id === columnId ? { ...s, desc: true } : s));
      }
      return prev.filter((s) => s.id !== columnId);
    });
    setPage(1);
  };

  const clearSorting = () => {
    setSorting([]);
    setPage(1);
  };

  // ── Column visibility ──

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    for (const col of columns) {
      vis[col.id] = col.visible ?? true;
    }
    return vis;
  });

  const visibleColumns = columns.filter((col) => columnVisibility[col.id] !== false);

  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // ── Selection ──

  const selectionHook = useSelection({
    mode: selectionOptions?.mode ?? 'multi',
    initialKeys: selectionOptions?.initialKeys,
    required: selectionOptions?.required,
    onSelectionChange: selectionOptions?.onSelectionChange,
  });

  const selection = selectionOptions ? selectionHook : null;

  // ── Query state ──

  const queryState = { page, pageSize, orderBys };

  // ── Derived ──

  const isEmpty = !isLoading && data.length === 0;

  return {
    data,
    totalCount,
    isLoading,
    isFetching,
    isEmpty,

    page,
    pageSize,
    pageCount,
    setPage,
    setPageSize,
    pageSizeOptions,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,

    sorting,
    setSorting,
    toggleSort,
    orderBys,
    clearSorting,

    queryState,

    visibleColumns,
    columnVisibility,
    toggleColumnVisibility,

    selection,

    columns,
    getRowId,
  };
}

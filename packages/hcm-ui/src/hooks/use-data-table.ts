'use client';

import { useState, useCallback, useMemo } from 'react';
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
  /** Column definitions */
  columns: ColumnConfig<TData>[];
  /** Unique row key extractor — REQUIRED */
  getRowId: (row: TData) => string;
  /** Data to display */
  data: TData[];
  /** Total count from server (for pagination) */
  totalCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Refetching state (subsequent fetches) */
  isFetching?: boolean;
  /** Default page size */
  defaultPageSize?: number;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Default sorting */
  defaultSorting?: SortingState[];
  /** Selection options — omit to disable selection */
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
    data,
    totalCount,
    isLoading,
    isFetching = false,
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    defaultSorting = [],
    selection: selectionOptions,
  } = options;

  // ── Pagination ──

  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  const canPreviousPage = page > 1;
  const canNextPage = page < pageCount;

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.max(1, Math.min(newPage, pageCount)));
    },
    [pageCount],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1); // Reset to page 1 when changing page size
  }, []);

  const previousPage = useCallback(() => {
    setPageState((prev) => Math.max(1, prev - 1));
  }, []);

  const nextPage = useCallback(() => {
    setPageState((prev) => Math.min(pageCount, prev + 1));
  }, [pageCount]);

  // ── Sorting ──

  const [sorting, setSorting] = useState<SortingState[]>(defaultSorting);

  const sortMapping = useMemo(() => buildSortMapping(columns), [columns]);

  const orderBys = useMemo(() => sortingToOrderBys(sorting, sortMapping), [sorting, sortMapping]);

  const toggleSort = useCallback((columnId: string) => {
    setSorting((prev) => {
      const existing = prev.find((s) => s.id === columnId);
      if (!existing) {
        // Not sorted → ascending
        return [...prev, { id: columnId, desc: false }];
      }
      if (!existing.desc) {
        // Ascending → descending
        return prev.map((s) => (s.id === columnId ? { ...s, desc: true } : s));
      }
      // Descending → remove sort
      return prev.filter((s) => s.id !== columnId);
    });
    // Reset to page 1 when sort changes
    setPageState(1);
  }, []);

  const clearSorting = useCallback(() => {
    setSorting([]);
    setPageState(1);
  }, []);

  // ── Column visibility ──

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    for (const col of columns) {
      vis[col.id] = col.visible ?? true;
    }
    return vis;
  });

  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.id] !== false),
    [columns, columnVisibility],
  );

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  // ── Selection ──

  const selectionHook = selectionOptions
    ? useSelection({
        mode: selectionOptions.mode ?? 'multi',
        initialKeys: selectionOptions.initialKeys,
        required: selectionOptions.required,
        onSelectionChange: selectionOptions.onSelectionChange,
      })
    : null;

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

    visibleColumns,
    columnVisibility,
    toggleColumnVisibility,

    selection: selectionHook,

    columns,
    getRowId,
  };
}

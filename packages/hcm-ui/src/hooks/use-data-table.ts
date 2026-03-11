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
  columns: ColumnConfig<TData>[];
  getRowId: (row: TData) => string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  defaultSorting?: SortingState[];
  selection?: Omit<UseSelectionOptions, 'mode'> & { mode?: 'single' | 'multi' };
}

export interface UseDataTableReturn<TData> {
  // ── Reactive data (set by the page after query) ──
  _setData: (data: TData[], totalCount: number) => void;
  _setLoading: (isLoading: boolean, isFetching: boolean) => void;

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
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    defaultSorting = [],
    selection: selectionOptions,
  } = options;

  // ── Data (set externally via _setData) ──
  const [data, setDataState] = useState<TData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const _setData = useCallback((newData: TData[], newTotalCount: number) => {
    setDataState(newData);
    setTotalCount(newTotalCount);
  }, []);

  const _setLoading = useCallback((loading: boolean, fetching: boolean) => {
    setIsLoading(loading);
    setIsFetching(fetching);
  }, []);

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
      setPageState(Math.max(1, Math.min(newPage, pageCount || 1)));
    },
    [pageCount],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
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
        return [...prev, { id: columnId, desc: false }];
      }
      if (!existing.desc) {
        return prev.map((s) => (s.id === columnId ? { ...s, desc: true } : s));
      }
      return prev.filter((s) => s.id !== columnId);
    });
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
  // Always call the hook to satisfy Rules of Hooks (no conditional hook calls).
  // Gate the return value instead — consumers see `selection: null` when not configured.
  const selectionHook = useSelection({
    mode: selectionOptions?.mode ?? 'multi',
    initialKeys: selectionOptions?.initialKeys,
    required: selectionOptions?.required,
    onSelectionChange: selectionOptions?.onSelectionChange,
  });

  const selection = selectionOptions ? selectionHook : null;

  // ── Query state (for building tRPC input) ──
  const queryState = useMemo(
    () => ({
      page,
      pageSize,
      orderBys,
    }),
    [page, pageSize, orderBys],
  );

  // ── Derived ──
  const isEmpty = !isLoading && data.length === 0;

  return {
    _setData,
    _setLoading,

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

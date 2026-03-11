'use client';

import { useEffect } from 'react';
import type { UseDataTableReturn } from './use-data-table';
import type { OrderBy } from '../components/data-table/sort-utils';

// ── Types ──

export interface TableQueryInput {
  page: number;
  limit: number;
  orderBys?: OrderBy[];
  [key: string]: unknown;
}

export interface TableQueryResult<TData> {
  data: TData[];
  totalCount: number;
}

export interface UseRemoteTableQueryOptions<TData, TResponse> {
  table: UseDataTableReturn<TData>;
  queryResult: {
    data: TResponse | undefined;
    isLoading: boolean;
    isFetching: boolean;
  };
  extractData: (response: TResponse) => TableQueryResult<TData>;
}

// ── Helper: Build tRPC input ──

export function buildTableInput<TFilter extends Record<string, unknown>>(opts: {
  page: number;
  pageSize: number;
  orderBys: OrderBy[];
  filters?: TFilter;
}): TableQueryInput {
  return {
    page: opts.page,
    limit: opts.pageSize,
    ...(opts.orderBys.length > 0 ? { orderBys: opts.orderBys } : {}),
    ...(opts.filters ?? {}),
  };
}

// ── Hook ──

export function useRemoteTableQuery<TData, TResponse>(
  options: UseRemoteTableQueryOptions<TData, TResponse>,
): void {
  const { table, queryResult, extractData } = options;

  // Sync loading state
  useEffect(() => {
    table._setLoading(queryResult.isLoading, queryResult.isFetching);
  }, [queryResult.isLoading, queryResult.isFetching, table]);

  // Sync data
  useEffect(() => {
    if (queryResult.data) {
      const extracted = extractData(queryResult.data);
      table._setData(extracted.data, extracted.totalCount);
    }
  }, [queryResult.data, extractData, table]);
}

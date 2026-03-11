'use client';

import { useMemo } from 'react';
import type { UseDataTableOptions } from './use-data-table';
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

export interface UseRemoteTableQueryOptions<
  TData,
  TResponse,
  TFilter extends Record<string, unknown>,
> {
  /** The tRPC query hook result — e.g. trpc.company.list.useQuery(input) */
  queryResult: {
    data: TResponse | undefined;
    isLoading: boolean;
    isFetching: boolean;
  };
  /** Extract data + totalCount from the query response */
  extractData: (response: TResponse) => TableQueryResult<TData>;
  /** Current filter state (applied, not draft) */
  filters?: TFilter;
}

export interface UseRemoteTableQueryReturn<TData> {
  /** Props to spread into useDataTable */
  tableProps: Pick<UseDataTableOptions<TData>, 'data' | 'totalCount' | 'isLoading' | 'isFetching'>;
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

export function useRemoteTableQuery<
  TData,
  TResponse,
  TFilter extends Record<string, unknown> = Record<string, unknown>,
>(
  options: UseRemoteTableQueryOptions<TData, TResponse, TFilter>,
): UseRemoteTableQueryReturn<TData> {
  const { queryResult, extractData } = options;

  const extracted = useMemo(() => {
    if (!queryResult.data) {
      return { data: [] as TData[], totalCount: 0 };
    }
    return extractData(queryResult.data);
  }, [queryResult.data, extractData]);

  return {
    tableProps: {
      data: extracted.data,
      totalCount: extracted.totalCount,
      isLoading: queryResult.isLoading,
      isFetching: queryResult.isFetching,
    },
  };
}

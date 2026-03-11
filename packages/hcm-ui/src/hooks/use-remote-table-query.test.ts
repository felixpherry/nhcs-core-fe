import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRemoteTableQuery, buildTableInput } from './use-remote-table-query';
import { useDataTable } from './use-data-table';
import { createColumns } from '../components/data-table/column-types';

interface Company {
  companyId: number;
  companyCode: string;
  companyName: string;
}

interface BackendResponse {
  data: Company[];
  count: number;
}

const COLUMNS = createColumns<Company>([
  { id: 'code', accessorKey: 'companyCode', header: 'Code' },
  { id: 'name', accessorKey: 'companyName', header: 'Name' },
]);

const SAMPLE_DATA: Company[] = [
  { companyId: 1, companyCode: 'ACM', companyName: 'Acme' },
  { companyId: 2, companyCode: 'GLB', companyName: 'Globe' },
];

const extractData = (res: BackendResponse) => ({
  data: res.data,
  totalCount: res.count,
});

describe('buildTableInput', () => {
  it('builds basic input with page and limit', () => {
    const input = buildTableInput({
      page: 1,
      pageSize: 10,
      orderBys: [],
    });

    expect(input).toEqual({
      page: 1,
      limit: 10,
    });
  });

  it('includes orderBys when present', () => {
    const input = buildTableInput({
      page: 2,
      pageSize: 25,
      orderBys: [
        { item1: 'companyCode', item2: true },
        { item1: 'companyName', item2: false },
      ],
    });

    expect(input).toEqual({
      page: 2,
      limit: 25,
      orderBys: [
        { item1: 'companyCode', item2: true },
        { item1: 'companyName', item2: false },
      ],
    });
  });

  it('omits orderBys when empty', () => {
    const input = buildTableInput({
      page: 1,
      pageSize: 10,
      orderBys: [],
    });

    expect(input).not.toHaveProperty('orderBys');
  });

  it('flattens filters into input', () => {
    const input = buildTableInput({
      page: 1,
      pageSize: 10,
      orderBys: [],
      filters: {
        companyCode: 'ACM',
        isActive: 'T',
        groupId: null,
      },
    });

    expect(input).toEqual({
      page: 1,
      limit: 10,
      companyCode: 'ACM',
      isActive: 'T',
      groupId: null,
    });
  });

  it('combines orderBys and filters', () => {
    const input = buildTableInput({
      page: 1,
      pageSize: 10,
      orderBys: [{ item1: 'companyCode', item2: true }],
      filters: { companyCode: 'ACM' },
    });

    expect(input).toEqual({
      page: 1,
      limit: 10,
      orderBys: [{ item1: 'companyCode', item2: true }],
      companyCode: 'ACM',
    });
  });
});

describe('useRemoteTableQuery', () => {
  it('syncs data and totalCount from query result into table', () => {
    const queryResult = {
      data: { data: SAMPLE_DATA, count: 25 } as BackendResponse,
      isLoading: false,
      isFetching: false,
    };

    const { result } = renderHook(() => {
      const table = useDataTable<Company>({
        columns: COLUMNS,
        getRowId: (row) => String(row.companyId),
      });
      useRemoteTableQuery({ table, queryResult, extractData });
      return table;
    });

    expect(result.current.data).toEqual(SAMPLE_DATA);
    expect(result.current.totalCount).toBe(25);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it('returns empty data when query has no data yet', () => {
    const queryResult = {
      data: undefined,
      isLoading: true,
      isFetching: true,
    };

    const { result } = renderHook(() => {
      const table = useDataTable<Company>({
        columns: COLUMNS,
        getRowId: (row) => String(row.companyId),
      });
      useRemoteTableQuery({ table, queryResult, extractData });
      return table;
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
  });

  it('passes through loading states', () => {
    const queryResult = {
      data: { data: SAMPLE_DATA, count: 25 } as BackendResponse,
      isLoading: false,
      isFetching: true, // refetching
    };

    const { result } = renderHook(() => {
      const table = useDataTable<Company>({
        columns: COLUMNS,
        getRowId: (row) => String(row.companyId),
      });
      useRemoteTableQuery({ table, queryResult, extractData });
      return table;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);
  });

  it('updates when query data changes', () => {
    const initialResult = {
      data: { data: SAMPLE_DATA, count: 25 } as BackendResponse,
      isLoading: false,
      isFetching: false,
    };

    const { result, rerender } = renderHook(
      ({ queryResult }) => {
        const table = useDataTable<Company>({
          columns: COLUMNS,
          getRowId: (row) => String(row.companyId),
        });
        useRemoteTableQuery({ table, queryResult, extractData });
        return table;
      },
      { initialProps: { queryResult: initialResult } },
    );

    expect(result.current.totalCount).toBe(25);

    // Simulate new data arriving
    const newData: Company[] = [
      ...SAMPLE_DATA,
      { companyId: 3, companyCode: 'NEW', companyName: 'New Co' },
    ];

    rerender({
      queryResult: {
        data: { data: newData, count: 30 },
        isLoading: false,
        isFetching: false,
      },
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.totalCount).toBe(30);
  });
});

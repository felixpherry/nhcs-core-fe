'use client';

import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import {
  useDataTable,
  useFilter,
  useRemoteTableQuery,
  buildTableInput,
  DataTable,
  DataTableToolbar,
  DataTableSearch,
  DataTableActions,
  DataTablePagination,
  Button,
} from '@nhcs/hcm-ui';
import { companyColumns } from './column';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';

// ── Filter defaults ──

interface CompanyFilter extends Record<string, unknown> {
  companyCode: string | null;
  companyName: string | null;
  companyAlias: string | null;
  companyGroupId: number | null;
  isActive: 'T' | 'F' | null;
}

const FILTER_DEFAULTS: CompanyFilter = {
  companyCode: null,
  companyName: null,
  companyAlias: null,
  companyGroupId: null,
  isActive: null,
};

export function CompanyList() {
  // ── Filters ──
  const filter = useFilter({ defaultValues: FILTER_DEFAULTS });

  // ── Table state (pagination, sorting) ──
  // We need a temporary table to get page/pageSize/orderBys for the query input.
  // But useDataTable needs data from the query. Chicken-and-egg.
  // Solution: manage page/sort state locally, build input, query, then pass to table.

  const table = useDataTable<Company>({
    columns: companyColumns,
    getRowId: (row) => String(row.companyId),
    data: [], // replaced by remoteQuery below
    totalCount: 0, // replaced by remoteQuery below
    isLoading: true, // replaced by remoteQuery below
    selection: { mode: 'multi' },
  });

  // ── Build query input from table state ──
  const input = buildTableInput({
    page: table.page,
    pageSize: table.pageSize,
    orderBys: table.orderBys,
    filters: filter.applied,
  });

  // ── tRPC query ──
  const query = trpc.organizationDevelopment.company.list.useQuery(input);
  console.log(query.data);

  // ── Wire query to table ──
  const remoteQuery = useRemoteTableQuery<Company, typeof query.data>({
    queryResult: query,
    extractData: (res) => ({
      data: (res?.data as Company[]) ?? [],
      totalCount: (res?.count as number) ?? 0,
    }),
  });

  // ── Merge remote data into table ──
  // Override the placeholder values with real data
  const tableWithData = useDataTable<Company>({
    columns: companyColumns,
    getRowId: (row) => String(row.companyId),
    ...remoteQuery.tableProps,
    selection: { mode: 'multi' },
  });

  // ── Search (debounced filter on companyName) ──
  const handleSearch = useCallback(
    (value: string) => {
      filter.setDraftFieldValue('companyName', value || null);
      filter.apply();
    },
    [filter],
  );

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Company</h1>

      <DataTable table={tableWithData}>
        <DataTableToolbar>
          <DataTableSearch
            value={filter.draft.companyName ?? ''}
            onChange={handleSearch}
            placeholder="Search company..."
          />
          <DataTableActions>
            <Button>Add Company</Button>
          </DataTableActions>
        </DataTableToolbar>
      </DataTable>

      <DataTablePagination table={tableWithData} />
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import {
  useDataTable,
  useRemoteTableQuery,
  buildTableInput,
  DataTable,
  DataTableToolbar,
  DataTableSearch,
  DataTableActions,
  DataTablePagination,
  Button,
} from '@nhcs/hcm-ui';
import { companyColumns } from './columns';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';

// ── Filter type ──

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
  const [search, setSearch] = useState('');

  // ── Table hook — owns ALL state ──
  const table = useDataTable<Company>({
    columns: companyColumns,
    getRowId: (row) => String(row.companyId),
    selection: { mode: 'multi' },
  });

  // ── Build query input from table's state ──
  const input = buildTableInput({
    ...table.queryState,
    filters: {
      ...FILTER_DEFAULTS,
      companyName: search || null,
    },
  });

  // ── tRPC query ──
  const query = trpc.organizationDevelopment.company.list.useQuery(input);

  // ── Wire query → table (auto-syncs data + loading) ──
  useRemoteTableQuery({
    table,
    queryResult: query,
    extractData: (res) => ({
      data: (res?.data as Company[]) ?? [],
      totalCount: (res?.count as number) ?? 0,
    }),
  });

  // ── Search handler ──
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      table.setPage(1);
    },
    [table],
  );

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Company</h1>

      <DataTable table={table}>
        <DataTableToolbar>
          <DataTableSearch value={search} onChange={handleSearch} placeholder="Search company..." />
          <DataTableActions>
            <Button>Add Company</Button>
          </DataTableActions>
        </DataTableToolbar>
      </DataTable>

      <DataTablePagination table={table} />
    </div>
  );
}

'use client';

import { useState, useCallback, useMemo } from 'react';
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
  ConfirmDialog,
  PageHeader,
  Button,
} from '@nhcs/hcm-ui';
import { createCompanyColumns, type CompanyRowActions } from './columns';
import { CompanyFormDialog, type FormMode } from './company-form-dialog';
import { CompanyFilterDialog } from './company-filter-dialog';
import type {
  Company,
  CompanyFilter,
} from '@nhcs/api/src/routers/organization-development/company/company.schema';

export function CompanyList() {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<CompanyFilter | null>(null);
  const utils = trpc.useUtils();

  // ── Form dialog state ──

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: FormMode;
    company: Company | null;
  }>({
    open: false,
    mode: 'add',
    company: null,
  });

  // ── Delete confirm state ──

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    company: Company | null;
    loading: boolean;
  }>({
    open: false,
    company: null,
    loading: false,
  });

  // ── Status toggle confirm state ──

  const [statusState, setStatusState] = useState<{
    open: boolean;
    company: Company | null;
    loading: boolean;
  }>({
    open: false,
    company: null,
    loading: false,
  });

  // ── Mutations ──

  const deleteMutation = trpc.organizationDevelopment.company.remove.useMutation();
  const statusMutation = trpc.organizationDevelopment.company.changeStatus.useMutation();

  // ── Row actions ──

  const rowActions: CompanyRowActions = useMemo(
    () => ({
      onView: (company) => setFormState({ open: true, mode: 'view', company }),
      onEdit: (company) => setFormState({ open: true, mode: 'edit', company }),
      onDelete: (company) => setDeleteState({ open: true, company, loading: false }),
      onToggleStatus: (company) => setStatusState({ open: true, company, loading: false }),
    }),
    [],
  );

  // ── Columns ──

  const columns = useMemo(() => createCompanyColumns(rowActions), [rowActions]);

  // ── Table hook ──

  const table = useDataTable<Company>({
    columns,
    getRowId: (row) => String(row.companyId),
    selection: { mode: 'multi' },
  });

  // ── Build query input ──

  const input = buildTableInput({
    ...table.queryState,
    filters: {
      companyName: search || null,
      ...(advancedFilter ?? {}),
    },
  });

  // ── tRPC query ──

  const query = trpc.organizationDevelopment.company.list.useQuery(input);

  // ── Wire query → table ──

  useRemoteTableQuery({
    table,
    queryResult: query,
    extractData: (res) => ({
      data: (res?.data as Company[]) ?? [],
      totalCount: (res?.count as number) ?? 0,
    }),
  });

  // ── Invalidate list ──

  const invalidateList = useCallback(() => {
    utils.organizationDevelopment.company.list.invalidate();
  }, [utils]);

  // ── Search handler ──

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      table.setPage(1);
    },
    [table],
  );

  // ── Advanced filter handlers ──

  const handleApplyFilter = useCallback(
    (filter: CompanyFilter) => {
      setAdvancedFilter(filter);
      if (filter.companyName) {
        setSearch(filter.companyName);
      } else if (filter.companyCode) {
        setSearch(filter.companyCode);
      }
      table.setPage(1);
    },
    [table],
  );

  const handleResetFilter = useCallback(() => {
    setAdvancedFilter(null);
    setSearch('');
    table.setPage(1);
  }, [table]);

  // ── Delete handler ──

  const handleDelete = useCallback(async () => {
    if (!deleteState.company) return;

    setDeleteState((prev) => ({ ...prev, loading: true }));

    try {
      await deleteMutation.mutateAsync({ id: deleteState.company.companyId });
      setDeleteState({ open: false, company: null, loading: false });
      invalidateList();
    } catch {
      setDeleteState((prev) => ({ ...prev, loading: false }));
    }
  }, [deleteState.company, deleteMutation, invalidateList]);

  // ── Status toggle handler ──

  const handleToggleStatus = useCallback(async () => {
    if (!statusState.company) return;

    const newStatus = statusState.company.isActive === 'T' ? 'F' : 'T';
    setStatusState((prev) => ({ ...prev, loading: true }));

    try {
      await statusMutation.mutateAsync({
        id: statusState.company.companyId,
        status: newStatus,
      });
      setStatusState({ open: false, company: null, loading: false });
      invalidateList();
    } catch {
      setStatusState((prev) => ({ ...prev, loading: false }));
    }
  }, [statusState.company, statusMutation, invalidateList]);

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Company" />

      <DataTable
        table={table}
        onRowClick={(row) => setFormState({ open: true, mode: 'view', company: row })}
      >
        <DataTableToolbar>
          <DataTableSearch value={search} onChange={handleSearch} placeholder="Search company..." />
          <DataTableActions>
            <Button variant="outline" onClick={() => setFilterOpen(true)}>
              Advanced Filter
            </Button>
            <Button onClick={() => setFormState({ open: true, mode: 'add', company: null })}>
              Add Company
            </Button>
          </DataTableActions>
        </DataTableToolbar>
      </DataTable>

      <DataTablePagination table={table} />

      {/* ── Form Dialog ── */}
      <CompanyFormDialog
        open={formState.open}
        onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
        mode={formState.mode}
        company={formState.company}
        onSuccess={invalidateList}
      />

      {/* ── Advanced Filter Dialog ── */}
      <CompanyFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((prev) => ({ ...prev, open }))}
        title="Delete Company"
        description={
          deleteState.company
            ? `Are you sure you want to delete "${deleteState.company.companyCode} — ${deleteState.company.companyName}"? This action cannot be undone.`
            : ''
        }
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteState.loading}
        onConfirm={handleDelete}
      />

      {/* ── Status Toggle Confirmation ── */}
      <ConfirmDialog
        open={statusState.open}
        onOpenChange={(open) => setStatusState((prev) => ({ ...prev, open }))}
        title="Change Status"
        description={
          statusState.company
            ? `Are you sure you want to ${statusState.company.isActive === 'T' ? 'deactivate' : 'activate'} "${statusState.company.companyCode} — ${statusState.company.companyName}"?`
            : ''
        }
        confirmLabel={statusState.company?.isActive === 'T' ? 'Deactivate' : 'Activate'}
        variant={statusState.company?.isActive === 'T' ? 'destructive' : 'default'}
        loading={statusState.loading}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const [statusFilter, setStatusFilter] = useState('T');
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

  // ── Delete / Status — just track which company, derive open from !== null ──

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToToggle, setCompanyToToggle] = useState<Company | null>(null);

  // ── Mutations — loading comes from isPending ──

  const deleteMutation = trpc.organizationDevelopment.company.remove.useMutation({
    onSuccess: () => {
      setCompanyToDelete(null);
      invalidateList();
    },
  });

  const statusMutation = trpc.organizationDevelopment.company.changeStatus.useMutation({
    onSuccess: () => {
      setCompanyToToggle(null);
      invalidateList();
    },
  });

  // ── Row actions ──

  const rowActions: CompanyRowActions = useMemo(
    () => ({
      onView: (company) => setFormState({ open: true, mode: 'view', company }),
      onEdit: (company) => setFormState({ open: true, mode: 'edit', company }),
      onDelete: (company) => setCompanyToDelete(company),
      onToggleStatus: (company) => setCompanyToToggle(company),
    }),
    [],
  );

  // ── Columns ──

  const columns = useMemo(() => createCompanyColumns(rowActions), [rowActions]);

  // ── Table hook ──

  const table = useDataTable<Company>({
    columns,
    getRowId: (row) => String(row.companyId),
  });

  // ── Build query input ──

  const input = buildTableInput({
    ...table.queryState,
    filters: {
      companyName: search || null,
      isActive: statusFilter === 'all' ? null : statusFilter,
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

  // ── Advanced filter handlers (Fix 4: no search sync) ──

  const handleApplyFilter = useCallback(
    (filter: CompanyFilter) => {
      setAdvancedFilter(filter);
      table.setPage(1);
    },
    [table],
  );

  const handleResetFilter = useCallback(() => {
    setAdvancedFilter(null);
    table.setPage(1);
  }, [table]);

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Company" />

      <DataTable table={table}>
        <DataTableToolbar>
          <DataTableSearch value={search} onChange={handleSearch} placeholder="Search company..." />

          {/* Fix 2: shadcn Select instead of raw <select> */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              table.setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="T">Active</SelectItem>
              <SelectItem value="F">Inactive</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

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

      {/* ── Delete Confirmation (Fix 1: derived open, mutation.isPending) ── */}
      <ConfirmDialog
        open={!!companyToDelete}
        onOpenChange={(open) => {
          if (!open) setCompanyToDelete(null);
        }}
        title="Delete Company"
        description={
          companyToDelete
            ? `Are you sure you want to delete "${companyToDelete.companyCode} — ${companyToDelete.companyName}"? This action cannot be undone.`
            : ''
        }
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (companyToDelete) {
            deleteMutation.mutate({ id: companyToDelete.companyId });
          }
        }}
      />

      {/* ── Status Toggle Confirmation (Fix 1: derived open, mutation.isPending) ── */}
      <ConfirmDialog
        open={!!companyToToggle}
        onOpenChange={(open) => {
          if (!open) setCompanyToToggle(null);
        }}
        title="Change Status"
        description={
          companyToToggle
            ? `Are you sure you want to ${companyToToggle.isActive === 'T' ? 'deactivate' : 'activate'} "${companyToToggle.companyCode} — ${companyToToggle.companyName}"?`
            : ''
        }
        confirmLabel={companyToToggle?.isActive === 'T' ? 'Deactivate' : 'Activate'}
        variant={companyToToggle?.isActive === 'T' ? 'destructive' : 'default'}
        loading={statusMutation.isPending}
        onConfirm={() => {
          if (companyToToggle) {
            statusMutation.mutate({
              id: companyToToggle.companyId,
              status: companyToToggle.isActive === 'T' ? 'F' : 'T',
            });
          }
        }}
      />
    </div>
  );
}

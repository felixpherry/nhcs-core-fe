'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';
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
import { CompanyFormDialog } from './company-form-dialog';
import { CompanyFilterDialog } from './company-filter-dialog';
import type {
  Company,
  CompanyFilter,
} from '@nhcs/api/src/routers/organization-development/company/company.schema';
import { toast } from 'sonner';

// ── Form state discriminated union ──

type FormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; company: Company }
  | { mode: 'view'; company: Company };

export function CompanyList() {
  // ── URL state ──

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault('T'));
  const [urlPage, setUrlPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [urlPageSize, setUrlPageSize] = useQueryState('pageSize', parseAsInteger.withDefault(10));

  // ── Non-URL state ──

  const [filterOpen, setFilterOpen] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<CompanyFilter | null>(null);
  const utils = trpc.useUtils();

  // ── Form state ──

  const [formState, setFormState] = useState<FormState>({ mode: 'closed' });

  const formOpen = formState.mode !== 'closed';
  const formCompany =
    formState.mode === 'edit' || formState.mode === 'view' ? formState.company : null;
  const formKey =
    formState.mode === 'closed'
      ? 'closed'
      : formState.mode === 'create'
        ? 'create'
        : `${formState.company.companyId}-${formState.mode}`;

  // ── Delete / Status ──

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToToggle, setCompanyToToggle] = useState<Company | null>(null);

  // ── Mutations ──

  const deleteMutation = trpc.organizationDevelopment.company.remove.useMutation({
    onSuccess: () => {
      setCompanyToDelete(null);
      invalidateList();
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete company');
    },
  });

  const statusMutation = trpc.organizationDevelopment.company.changeStatus.useMutation({
    onSuccess: () => {
      setCompanyToToggle(null);
      invalidateList();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change status');
    },
  });

  // ── Row actions ──

  const rowActions: CompanyRowActions = useMemo(
    () => ({
      onView: (company) => setFormState({ mode: 'view', company }),
      onEdit: (company) => setFormState({ mode: 'edit', company }),
      onDelete: (company) => setCompanyToDelete(company),
      onToggleStatus: (company) => setCompanyToToggle(company),
    }),
    [],
  );

  // ── Columns ──

  const columns = useMemo(() => createCompanyColumns(rowActions), [rowActions]);

  // ── Table hook — controlled pagination via URL ──

  const table = useDataTable<Company>({
    columns,
    getRowId: (row) => String(row.companyId),
    page: urlPage,
    onPageChange: setUrlPage,
    pageSize: urlPageSize,
    onPageSizeChange: setUrlPageSize,
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
      setSearch(value || null);
      table.setPage(1);
    },
    [setSearch, table],
  );

  // ── Advanced filter handlers ──

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
            <Button onClick={() => setFormState({ mode: 'create' })}>Add Company</Button>
          </DataTableActions>
        </DataTableToolbar>
        <DataTablePagination />
      </DataTable>

      <CompanyFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) setFormState({ mode: 'closed' });
        }}
        mode={formState.mode === 'closed' ? 'create' : formState.mode}
        company={formCompany}
        onSuccess={invalidateList}
      />

      <CompanyFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

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
            const newStatus = companyToToggle.isActive === 'T' ? 'F' : 'T';
            const actionLabel = newStatus === 'F' ? 'deactivated' : 'activated';
            statusMutation.mutate(
              { id: companyToToggle.companyId, status: newStatus },
              {
                onSuccess: () => {
                  toast.success(`Company ${actionLabel} successfully`);
                },
              },
            );
          }
        }}
      />
    </div>
  );
}

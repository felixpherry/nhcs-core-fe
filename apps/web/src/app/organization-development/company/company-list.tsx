'use client';

import { useState } from 'react';
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';
import { trpc } from '@/lib/trpc';
import {
  useCrudDialog,
  useDataTable,
  DataTable,
  DataTableContent,
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
import { createCompanyColumns } from './columns';
import { CompanyFormDialog } from './company-form-dialog';
import { CompanyFilterDialog } from './company-filter-dialog';
import type {
  Company,
  CompanyFilter,
} from '@nhcs/api/src/routers/organization-development/company/company.schema';
import { toast } from 'sonner';

export function CompanyList() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [statusFilter, setStatusFilter] = useQueryState('status', parseAsString.withDefault('T'));
  const [urlPage, setUrlPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [urlPageSize, setUrlPageSize] = useQueryState('pageSize', parseAsInteger.withDefault(10));

  const [filterOpen, setFilterOpen] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<CompanyFilter | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToToggle, setCompanyToToggle] = useState<Company | null>(null);
  const utils = trpc.useUtils();

  const crud = useCrudDialog<Company>({
    onIsOpenChange({ isOpen }) {
      if (!isOpen) utils.organizationDevelopment.company.list.invalidate();
    },
  });

  const deleteMutation = trpc.organizationDevelopment.company.remove.useMutation({
    onSuccess: () => {
      setCompanyToDelete(null);
      utils.organizationDevelopment.company.list.invalidate();
      toast.success('Company deleted successfully');
    },
    onError: (error) => toast.error(error.message || 'Failed to delete company'),
  });

  const statusMutation = trpc.organizationDevelopment.company.changeStatus.useMutation({
    onSuccess: () => {
      setCompanyToToggle(null);
      utils.organizationDevelopment.company.list.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Failed to change status'),
  });

  const columns = createCompanyColumns({
    onView: (company) => crud.openView(String(company.companyId), company),
    onEdit: (company) => crud.openEdit(String(company.companyId), company),
    onDelete: (company) => setCompanyToDelete(company),
    onToggleStatus: (company) => setCompanyToToggle(company),
  });

  const query = trpc.organizationDevelopment.company.list.useQuery({
    page: urlPage,
    limit: urlPageSize,
    orderBys: [],
    // ...{
    //   companyName: search || null,
    //   isActive: statusFilter === 'all' ? null : statusFilter,
    //   ...(advancedFilter ?? {}),
    // },
  });

  const table = useDataTable<Company>({
    columns,
    getRowId: (row) => String(row.companyId),
    page: urlPage,
    onPageChange: setUrlPage,
    pageSize: urlPageSize,
    onPageSizeChange: setUrlPageSize,
    data: (query.data?.data as Company[]) ?? [],
    totalCount: (query.data?.count as number) ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  });

  const handleSearch = (value: string) => {
    setSearch(value || null);
    table.setPage(1);
  };

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
            <Button onClick={crud.openCreate}>Add Company</Button>
          </DataTableActions>
        </DataTableToolbar>
        <DataTableContent />
        <DataTablePagination />
      </DataTable>

      <CompanyFormDialog crud={crud} />

      <CompanyFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={(filter) => {
          setAdvancedFilter(filter);
          table.setPage(1);
        }}
        onReset={() => {
          setAdvancedFilter(null);
          table.setPage(1);
        }}
      />

      <ConfirmDialog
        open={!!companyToDelete}
        onOpenChange={(open) => !open && setCompanyToDelete(null)}
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
          if (companyToDelete) deleteMutation.mutate({ id: companyToDelete.companyId });
        }}
      />

      <ConfirmDialog
        open={!!companyToToggle}
        onOpenChange={(open) => !open && setCompanyToToggle(null)}
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
              { onSuccess: () => toast.success(`Company ${actionLabel} successfully`) },
            );
          }
        }}
      />
    </div>
  );
}

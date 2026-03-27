'use client';

import { useState } from 'react';
import { useQueryState, parseAsInteger } from 'nuqs';
import { trpc } from '@/lib/trpc';
import { createCompanyColumns } from '../_configs/columns';
import { CompanyFormDialog } from './company-form-dialog';
import { CompanyFilterDialog } from './company-filter-dialog';
import type {
  Company,
  CompanyFilter,
} from '@nhcs/api/src/routers/organization-development/company/company.schema';
import { toast } from 'sonner';
import { useCrudDialog } from '@/hooks/use-crud-dialog';
import { useDataTable } from '@/hooks/use-data-table';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { Button } from '@/components/ui';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Filter, Plus } from 'lucide-react';

export function CompanyList() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));

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
    page,
    limit: perPage,
    orderBys: [],
    ...(advancedFilter ?? {}),
  });

  const { table } = useDataTable({
    data: (query.data?.data as Company[]) ?? [],
    columns,
    pageCount: Math.ceil(((query.data?.count as number) ?? 0) / perPage),
    getRowId: (row) => String(row.companyId),
    initialState: {},
  });

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Company List" />

      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Button variant="secondary" onClick={() => setFilterOpen(true)}>
            <Filter />
            Advanced Filter
          </Button>
          <Button onClick={crud.openCreate}>
            <Plus />
            Add
          </Button>
        </DataTableToolbar>
      </DataTable>

      <CompanyFormDialog crud={crud} />

      <CompanyFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={(filter) => setAdvancedFilter(filter)}
        onReset={() => setAdvancedFilter(null)}
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

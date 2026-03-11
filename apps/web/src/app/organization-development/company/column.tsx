import { createColumns } from '@nhcs/hcm-ui';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';

export const companyColumns = createColumns<Company>([
  {
    id: 'companyCode',
    accessorKey: 'companyCode',
    header: 'Company Code',
    sortable: true,
  },
  {
    id: 'companyName',
    accessorKey: 'companyName',
    header: 'Company Name',
    sortable: true,
  },
  {
    id: 'companyAlias',
    accessorKey: 'companyAlias',
    header: 'Alias',
    sortable: true,
  },
  {
    id: 'companyGroupName',
    accessorKey: 'companyGroupName',
    header: 'Company Group',
    sortable: true,
    sortKey: 'companyGroupId', // display name, sort by ID
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: 'Address',
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Status',
    cell: 'status-badge',
  },
]);

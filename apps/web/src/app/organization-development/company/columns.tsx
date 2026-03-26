'use client';

import { PencilIcon, TrashIcon } from 'lucide-react';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';
import { Button, Checkbox } from '@/components/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';

export interface CompanyRowActions {
  onEdit: (company: Company) => void;
  onView: (company: Company) => void;
  onDelete: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
}

export function createCompanyColumns(actions: CompanyRowActions): ColumnDef<Company>[] {
  return [
    {
      id: 'actions',
      header: 'Actions',
      size: 80,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              actions.onEdit(row.original);
            }}
            title="Edit"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              actions.onDelete(row.original);
            }}
            title="Delete"
          >
            <TrashIcon className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
    {
      id: 'active',
      accessorKey: 'isActive',
      header: 'Active',
      size: 60,
      enableSorting: false,
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isActive === 'T'}
          onCheckedChange={() => actions.onToggleStatus(row.original)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: 'companyCode',
      accessorKey: 'companyCode',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Company Code" />,
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto p-0 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            actions.onView(row.original);
          }}
        >
          {row.original.companyCode}
        </Button>
      ),
      meta: { label: 'Company Code' },
    },
    {
      id: 'companyName',
      accessorKey: 'companyName',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Company Name" />,
      meta: { label: 'Company Name' },
    },
    {
      id: 'companyAlias',
      accessorKey: 'companyAlias',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Alias" />,
      meta: { label: 'Alias' },
    },
    {
      id: 'companyGroupName',
      accessorKey: 'companyGroupName',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Company Group" />,
      meta: { label: 'Company Group' },
    },
    {
      id: 'address',
      accessorKey: 'address',
      header: 'Address',
      enableSorting: false,
      meta: { label: 'Address' },
    },
    {
      id: 'stateName',
      accessorKey: 'stateName',
      header: 'State',
      enableSorting: false,
      meta: { label: 'State' },
    },
    {
      id: 'cityName',
      accessorKey: 'cityName',
      header: 'City',
      enableSorting: false,
      meta: { label: 'City' },
    },
    {
      id: 'districtName',
      accessorKey: 'districtName',
      header: 'District',
      enableSorting: false,
      meta: { label: 'District' },
    },
    {
      id: 'subDistrictName',
      accessorKey: 'subDistrictName',
      header: 'Sub District',
      enableSorting: false,
      meta: { label: 'Sub District' },
    },
    {
      id: 'zipCode',
      accessorKey: 'zipCode',
      header: 'Zip Code',
      enableSorting: false,
      meta: { label: 'Zip Code' },
    },
    {
      id: 'phoneNumber',
      accessorKey: 'phoneNumber',
      header: 'Phone Number',
      enableSorting: false,
      meta: { label: 'Phone Number' },
    },
    {
      id: 'onChangeDate',
      accessorKey: 'onChangeDate',
      header: 'Status Changed Date',
      enableSorting: false,
      meta: { label: 'Status Changed Date' },
    },
    {
      id: 'createdName',
      accessorKey: 'createdName',
      header: 'Created By',
      enableSorting: false,
      meta: { label: 'Created By' },
    },
    {
      id: 'createdDate',
      accessorKey: 'createdDate',
      header: 'Created At',
      enableSorting: false,
      meta: { label: 'Created At' },
    },
    {
      id: 'updatedName',
      accessorKey: 'updatedName',
      header: 'Updated By',
      enableSorting: false,
      meta: { label: 'Updated By' },
    },
    {
      id: 'updatedDate',
      accessorKey: 'updatedDate',
      header: 'Updated At',
      enableSorting: false,
      meta: { label: 'Updated At' },
    },
  ];
}

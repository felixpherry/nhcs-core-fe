import { PencilIcon, TrashIcon } from 'lucide-react';
import { createColumns, Button, Checkbox, StatusBadge } from '@nhcs/hcm-ui';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';

// ── Row action callbacks (injected by company-list.tsx) ──

export interface CompanyRowActions {
  onEdit: (company: Company) => void;
  onView: (company: Company) => void;
  onDelete: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
}

export function createCompanyColumns(actions: CompanyRowActions) {
  return createColumns<Company>([
    // ── 1. Actions ──
    {
      id: 'actions',
      header: 'Actions',
      cell: (_value, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              actions.onEdit(row);
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
              actions.onDelete(row);
            }}
            title="Delete"
          >
            <TrashIcon className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },

    // ── 2. Active toggle ──
    {
      id: 'active',
      header: 'Active',
      accessorKey: 'isActive',
      cell: (_value, row) => (
        <Checkbox
          checked={row.isActive === 'T'}
          onCheckedChange={() => actions.onToggleStatus(row)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },

    // ── 3-6. Core fields ──
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
      sortKey: 'companyGroupId',
    },

    // ── 7-12. Address fields ──
    {
      id: 'address',
      accessorKey: 'address',
      header: 'Address',
    },
    {
      id: 'stateName',
      accessorKey: 'stateName',
      header: 'State',
    },
    {
      id: 'cityName',
      accessorKey: 'cityName',
      header: 'City',
    },
    {
      id: 'districtName',
      accessorKey: 'districtName',
      header: 'District',
    },
    {
      id: 'subDistrictName',
      accessorKey: 'subDistrictName',
      header: 'Sub District',
    },
    {
      id: 'zipCode',
      accessorKey: 'zipCode',
      header: 'Zip Code',
    },

    // ── 13. Phone ──
    {
      id: 'phoneNumber',
      accessorKey: 'phoneNumber',
      header: 'Phone Number',
    },

    // ── 14. Status Changed Date ──
    {
      id: 'onChangeDate',
      accessorKey: 'onChangeDate',
      header: 'Status Changed Date',
      cell: 'date',
    },

    // ── 15-18. Audit fields ──
    {
      id: 'createdName',
      accessorKey: 'createdName',
      header: 'Created By',
    },
    {
      id: 'createdDate',
      accessorKey: 'createdDate',
      header: 'Created At',
      cell: 'date',
    },
    {
      id: 'updatedName',
      accessorKey: 'updatedName',
      header: 'Updated By',
    },
    {
      id: 'updatedDate',
      accessorKey: 'updatedDate',
      header: 'Updated At',
      cell: 'date',
    },

    // ── 19. Status badge ──
    {
      id: 'status',
      accessorKey: 'isActive',
      header: 'Status',
      cell: (value) => (
        <StatusBadge
          status={value === 'T' ? 'ACTIVE' : 'INACTIVE'}
          variantMap={{ ACTIVE: 'default', INACTIVE: 'secondary' }}
        />
      ),
    },
  ]);
}

import { PencilIcon, TrashIcon } from 'lucide-react';
import { createColumns, Button, Checkbox } from '@nhcs/hcm-ui';
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
      align: 'center',
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
      align: 'center',
      accessorKey: 'isActive',
      cell: (_value, row) => (
        <Checkbox
          checked={row.isActive === 'T'}
          onCheckedChange={() => actions.onToggleStatus(row)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },

    // ── 3. Company Code (clickable → view) — Fix 9: Button variant="link" ──
    {
      id: 'companyCode',
      accessorKey: 'companyCode',
      header: 'Company Code',
      sortable: true,
      cell: (_value, row) => (
        <Button
          variant="link"
          className="h-auto p-0 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            actions.onView(row);
          }}
        >
          {row.companyCode}
        </Button>
      ),
    },

    // ── 4-6. Core fields ──
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

    // ── Fix 7: Removed redundant StatusBadge column ──
    // Active checkbox toggle already shows active/inactive state.
    // No need for a separate StatusBadge column.
  ]);
}

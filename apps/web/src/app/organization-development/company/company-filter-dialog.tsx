'use client';

import { useReducer, useCallback, useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Label,
} from '@nhcs/hcm-ui';
import {
  CompanyGroupChooser,
  type CompanyGroupFormValue,
  type CompanyGroupQueryParams,
  AreaChooser,
  type AreaFormValue,
  type AreaQueryParams,
} from '@nhcs/features';
import type { CompanyFilter } from '@nhcs/api/src/routers/organization-development/company/company.schema';

// ── Types ──

type SearchByType = 'code' | 'name' | '';

interface FilterFormState {
  searchByType: SearchByType;
  searchByValue: string;
  companyGroup: CompanyGroupFormValue | null;
  address: string;
  area: AreaFormValue | null;
  isActive: 'T' | 'F' | '';
  companyAlias: string;
}

type FilterAction =
  | { type: 'SET_SEARCH_BY_TYPE'; value: SearchByType }
  | { type: 'SET_SEARCH_BY_VALUE'; value: string }
  | { type: 'SET_COMPANY_GROUP'; value: CompanyGroupFormValue | null }
  | { type: 'SET_ADDRESS'; value: string }
  | { type: 'SET_AREA'; value: AreaFormValue | null }
  | { type: 'SET_STATUS'; value: 'T' | 'F' | '' }
  | { type: 'SET_ALIAS'; value: string }
  | { type: 'RESET' };

const initialState: FilterFormState = {
  searchByType: '',
  searchByValue: '',
  companyGroup: null,
  address: '',
  area: null,
  isActive: '',
  companyAlias: '',
};

function filterReducer(state: FilterFormState, action: FilterAction): FilterFormState {
  switch (action.type) {
    case 'SET_SEARCH_BY_TYPE':
      return { ...state, searchByType: action.value, searchByValue: '' };
    case 'SET_SEARCH_BY_VALUE':
      return { ...state, searchByValue: action.value };
    case 'SET_COMPANY_GROUP':
      return { ...state, companyGroup: action.value };
    case 'SET_ADDRESS':
      return { ...state, address: action.value };
    case 'SET_AREA':
      return { ...state, area: action.value };
    case 'SET_STATUS':
      return { ...state, isActive: action.value };
    case 'SET_ALIAS':
      return { ...state, companyAlias: action.value };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

function buildFilterPayload(state: FilterFormState): CompanyFilter {
  return {
    companyCode: state.searchByType === 'code' ? state.searchByValue || null : null,
    companyName: state.searchByType === 'name' ? state.searchByValue || null : null,
    companyGroupId: state.companyGroup?.companyGroupId ?? null,
    address: state.address || null,
    stateId: state.area?.stateId || null,
    cityId: state.area?.cityId || null,
    districtId: state.area?.districtId || null,
    subDistrictId: state.area?.subDistrictId || null,
    isActive: state.isActive || null,
    companyAlias: state.companyAlias || null,
  };
}

// ── Props ──

export interface CompanyFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filter: CompanyFilter) => void;
  onReset: () => void;
}

// ── Field wrapper ──

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="font-semibold">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ── Component ──

export function CompanyFilterDialog({
  open,
  onOpenChange,
  onApply,
  onReset,
}: CompanyFilterDialogProps) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // ── Chooser query states ──

  const [cgQuery, setCgQuery] = useState<CompanyGroupQueryParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  const [areaQuery, setAreaQuery] = useState<AreaQueryParams>({
    page: 1,
    limit: 10,
    searchBy: 'state',
    value: '',
  });

  const cgList = trpc.common.companyGroup.list.useQuery(cgQuery);
  const areaList = trpc.common.area.list.useQuery(areaQuery);

  // ── Validate company group code ──

  const validateCompanyGroupCode = useCallback(
    async (code: string): Promise<CompanyGroupFormValue | null> => {
      try {
        const result = await cgList.refetch();
        const data = result.data?.data ?? [];
        const match = data.find((item) => item.companyGroupCode === code);
        if (!match) return null;
        return {
          companyGroupId: match.companyGroupId,
          companyGroupCode: match.companyGroupCode ?? '',
          companyGroupName: match.companyGroupName ?? '',
        };
      } catch {
        return null;
      }
    },
    [cgList],
  );

  // ── Handlers ──

  const handleApply = useCallback(() => {
    onApply(buildFilterPayload(state));
    onOpenChange(false);
  }, [state, onApply, onOpenChange]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    onReset();
    onOpenChange(false);
  }, [onReset, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Advanced Filter</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ── Search By ── */}
          <FilterField label="Search">
            <div className="flex items-center gap-2">
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={state.searchByType}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_SEARCH_BY_TYPE',
                    value: e.target.value as SearchByType,
                  })
                }
              >
                <option value="">--Choose--</option>
                <option value="code">Code</option>
                <option value="name">Name</option>
              </select>
              <Input
                value={state.searchByValue}
                onChange={(e) => dispatch({ type: 'SET_SEARCH_BY_VALUE', value: e.target.value })}
                placeholder="Input value"
                disabled={!state.searchByType}
                className="flex-1"
              />
            </div>
          </FilterField>

          {/* ── Company Group ── */}
          <FilterField label="Company Group">
            <CompanyGroupChooser
              value={state.companyGroup}
              onChange={(val) => dispatch({ type: 'SET_COMPANY_GROUP', value: val })}
              listData={cgList.data?.data ?? []}
              listCount={cgList.data?.count ?? 0}
              isLoading={cgList.isLoading}
              onQueryChange={setCgQuery}
              validateCode={validateCompanyGroupCode}
            />
          </FilterField>

          {/* ── Address ── */}
          <FilterField label="Address">
            <Input
              value={state.address}
              onChange={(e) => dispatch({ type: 'SET_ADDRESS', value: e.target.value })}
              placeholder="Enter address"
            />
          </FilterField>

          {/* ── State/Area ── */}
          <FilterField label="State/Area">
            <AreaChooser
              value={state.area}
              onChange={(val) => dispatch({ type: 'SET_AREA', value: val })}
              listData={areaList.data?.data ?? []}
              listCount={areaList.data?.count ?? 0}
              isLoading={areaList.isLoading}
              onQueryChange={setAreaQuery}
            />
          </FilterField>

          {/* ── Status ── */}
          <FilterField label="Status">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={state.isActive}
              onChange={(e) =>
                dispatch({
                  type: 'SET_STATUS',
                  value: e.target.value as 'T' | 'F' | '',
                })
              }
            >
              <option value="">All</option>
              <option value="T">Active</option>
              <option value="F">Inactive</option>
            </select>
          </FilterField>

          {/* ── Company Alias ── */}
          <FilterField label="Company Alias">
            <Input
              value={state.companyAlias}
              onChange={(e) => dispatch({ type: 'SET_ALIAS', value: e.target.value })}
              placeholder="Enter alias"
            />
          </FilterField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply Filter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

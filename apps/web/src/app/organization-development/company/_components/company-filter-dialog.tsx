'use client';

import { useState } from 'react';
import type { CompanyFilter } from '@nhcs/api/src/routers/organization-development/company/company.schema';
import { Chooser } from '@/components/chooser';
import type { CompanyGroup } from './company-group-chooser-table';
import { CompanyGroupChooserTable } from './company-group-chooser-table';
import type { Area } from './area-chooser-table';
import { AreaChooserTable } from './area-chooser-table';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

type SearchByType = 'code' | 'name' | 'none';

interface FilterState {
  searchByType: SearchByType;
  searchByValue: string;
  companyGroup: CompanyGroup | null;
  address: string;
  area: Area | null;
  isActive: 'T' | 'F' | 'all';
  companyAlias: string;
}

const initialState: FilterState = {
  searchByType: 'none',
  searchByValue: '',
  companyGroup: null,
  address: '',
  area: null,
  isActive: 'all',
  companyAlias: '',
};

function buildFilterPayload(state: FilterState): CompanyFilter {
  return {
    companyCode: state.searchByType === 'code' ? state.searchByValue || null : null,
    companyName: state.searchByType === 'name' ? state.searchByValue || null : null,
    companyGroupId: state.companyGroup?.companyGroupId ?? null,
    address: state.address || null,
    stateId: state.area?.stateId || null,
    cityId: state.area?.cityId || null,
    districtId: state.area?.districtId || null,
    subDistrictId: state.area?.subDistrictId || null,
    isActive: state.isActive === 'all' ? null : state.isActive,
    companyAlias: state.companyAlias || null,
  };
}

export interface CompanyFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filter: CompanyFilter) => void;
  onReset: () => void;
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function CompanyFilterDialog({
  open,
  onOpenChange,
  onApply,
  onReset,
}: CompanyFilterDialogProps) {
  const [state, setState] = useState<FilterState>(initialState);
  const [cgChooserOpen, setCgChooserOpen] = useState(false);
  const [areaChooserOpen, setAreaChooserOpen] = useState(false);

  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    onApply(buildFilterPayload(state));
    onOpenChange(false);
  }

  function handleReset() {
    setState(initialState);
    onReset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Advanced Filter</DialogTitle>
          <DialogDescription>Filter company records by multiple criteria.</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <FilterField label="Search">
            <div className="flex items-center gap-2">
              <Select
                value={state.searchByType}
                onValueChange={(v) => {
                  update('searchByType', v as SearchByType);
                  update('searchByValue', '');
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">--Choose--</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={state.searchByValue}
                onChange={(e) => update('searchByValue', e.target.value)}
                placeholder="Input value"
                disabled={state.searchByType === 'none'}
                className="flex-1"
              />
            </div>
          </FilterField>

          <FilterField label="Company Group">
            <div className="flex items-center gap-2">
              <Input
                value={
                  state.companyGroup
                    ? `${state.companyGroup.companyGroupCode} - ${state.companyGroup.companyGroupName}`
                    : ''
                }
                placeholder="Select company group"
                readOnly
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setCgChooserOpen(true)}>
                <span className="sr-only">Search</span>
                🔍
              </Button>
              {state.companyGroup && (
                <Button variant="ghost" size="icon" onClick={() => update('companyGroup', null)}>
                  ✕
                </Button>
              )}
            </div>
          </FilterField>

          <Chooser
            open={cgChooserOpen}
            onOpenChange={setCgChooserOpen}
            title="Select Company Group"
            mode="single"
            getRowId={(row: CompanyGroup) => String(row.companyGroupId)}
            initialSelectedIds={
              state.companyGroup ? [String(state.companyGroup.companyGroupId)] : []
            }
            onConfirm={(rows) => update('companyGroup', rows[0] ?? null)}
          >
            {(ctx) => (
              <CompanyGroupChooserTable
                isSelected={ctx.isSelected}
                toggleRow={ctx.toggleRow}
                enabled={cgChooserOpen}
              />
            )}
          </Chooser>

          <FilterField label="Address">
            <Input
              value={state.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Enter address"
            />
          </FilterField>

          <FilterField label="State/Area">
            <div className="flex items-center gap-2">
              <Input
                value={
                  state.area
                    ? `${state.area.stateName} - ${state.area.cityName} - ${state.area.districtName}`
                    : ''
                }
                placeholder="Select area"
                readOnly
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setAreaChooserOpen(true)}>
                🔍
              </Button>
              {state.area && (
                <Button variant="ghost" size="icon" onClick={() => update('area', null)}>
                  ✕
                </Button>
              )}
            </div>
          </FilterField>

          <Chooser
            open={areaChooserOpen}
            onOpenChange={setAreaChooserOpen}
            title="Select Area"
            className="max-w-4xl"
            mode="single"
            getRowId={(row: Area) => String(row.areaId)}
            initialSelectedIds={state.area ? [String(state.area.areaId)] : []}
            onConfirm={(rows) => update('area', rows[0] ?? null)}
          >
            {(ctx) => (
              <AreaChooserTable
                isSelected={ctx.isSelected}
                toggleRow={ctx.toggleRow}
                enabled={areaChooserOpen}
              />
            )}
          </Chooser>

          <FilterField label="Status">
            <Select
              value={state.isActive}
              onValueChange={(v) => update('isActive', v as 'T' | 'F' | 'all')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="T">Active</SelectItem>
                <SelectItem value="F">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Company Alias">
            <Input
              value={state.companyAlias}
              onChange={(e) => update('companyAlias', e.target.value)}
              placeholder="Enter alias"
            />
          </FilterField>
        </DialogBody>

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

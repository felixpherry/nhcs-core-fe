'use client';

import { ChooserField } from '@/components/chooser-field';
import {
  Button,
  Checkbox,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useChooser } from '@/hooks/use-chooser';
import { useState, useEffect, useCallback } from 'react';

// ── Types ──

export interface Area {
  areaId: number;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
  districtId: string | null;
  districtName: string | null;
  subDistrictId: string | null;
  subDistrictName: string | null;
  zipCode: string | null;
}

export interface AreaFormValue {
  areaId: number;
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  subDistrictId: string;
  subDistrictName: string;
  zipCode: string;
}

export type AreaSearchBy = 'state' | 'city' | 'district' | 'subdistrict';

export interface AreaQueryParams {
  page: number;
  limit: number;
  searchBy: AreaSearchBy;
  value: string;
}

export interface AreaChooserProps {
  /** Current selected value */
  value: AreaFormValue | null;
  /** Called when value changes — consumer uses this to fill cascading fields */
  onChange: (value: AreaFormValue | null) => void;
  /** List data from consumer's tRPC query */
  listData: Area[];
  /** Total count from consumer's tRPC query */
  listCount: number;
  /** Loading state from consumer's tRPC query */
  isLoading: boolean;
  /** Called when internal search/page/searchBy changes */
  onQueryChange: (params: AreaQueryParams) => void;

  // ── Form field props ──

  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  id?: string;
}

// ── Helpers ──

const PAGE_SIZE = 10;

const SEARCH_BY_OPTIONS: { label: string; value: AreaSearchBy }[] = [
  { label: 'State', value: 'state' },
  { label: 'City', value: 'city' },
  { label: 'District', value: 'district' },
  { label: 'Sub District', value: 'subdistrict' },
];

function mapAreaToFormValue(area: Area): AreaFormValue {
  return {
    areaId: area.areaId,
    stateId: area.stateId ?? '',
    stateName: area.stateName ?? '',
    cityId: area.cityId ?? '',
    cityName: area.cityName ?? '',
    districtId: area.districtId ?? '',
    districtName: area.districtName ?? '',
    subDistrictId: area.subDistrictId ?? '',
    subDistrictName: area.subDistrictName ?? '',
    zipCode: area.zipCode ?? '',
  };
}

// ── Component ──

export function AreaChooser({
  value,
  onChange,
  listData,
  listCount,
  isLoading,
  onQueryChange,
  label = 'State/Area',
  required = false,
  disabled = false,
  readOnly = false,
  error,
  id,
}: AreaChooserProps) {
  // ── Internal dialog state ──

  const [searchBy, setSearchBy] = useState<AreaSearchBy>('state');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  // ── Notify consumer when query params change ──

  useEffect(() => {
    onQueryChange({ page, limit: PAGE_SIZE, searchBy, value: searchValue });
  }, [searchBy, searchValue, page, onQueryChange]);

  // ── Chooser hook ──

  const chooser = useChooser<Area, AreaFormValue>({
    mode: 'single',
    required,
    rowKey: (row) => String(row.areaId),
    mapSelected: mapAreaToFormValue,
    onConfirm: (result) => {
      onChange(result.selectedItems[0] ?? null);
    },
  });

  // ── Track rows when data changes ──

  useEffect(() => {
    if (listData.length > 0) {
      chooser.trackRows(listData);
    }
  }, [listData, chooser.trackRows]);

  // ── Reset search/page when dialog opens ──

  const originalOpen = chooser.open;
  const handleOpen = useCallback(
    (preselectedKeys?: string[]) => {
      setSearchBy('state');
      setSearchValue('');
      setPage(1);
      originalOpen(preselectedKeys);
    },
    [originalOpen],
  );

  // ── Pagination ──

  const totalPages = Math.ceil(listCount / PAGE_SIZE);

  // ── No code typing for Area — disableCodeInput: true ──
  // ── No right label — getLabel omitted ──
  // ── Left display shows stateName ──

  const noopValidate = async (): Promise<AreaFormValue | null> => null;

  return (
    <ChooserField
      chooser={{ ...chooser, open: handleOpen }}
      validateCode={noopValidate}
      getCode={(item) => item.stateName}
      getKey={(item) => String(item.areaId)}
      value={value}
      onChange={onChange}
      label={label}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      disableCodeInput
      error={error}
      id={id}
      placeholder="Click to search"
      dialogTitle="Choose State"
    >
      <div className="space-y-4">
        {/* ── Search By Filter ── */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium shrink-0">Search:</label>
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={searchBy}
            onChange={(e) => {
              setSearchBy(e.target.value as AreaSearchBy);
              setSearchValue('');
              setPage(1);
            }}
          >
            {SEARCH_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Input
            type="text"
            placeholder="Input value"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setPage(1);
            }}
            className="flex-1"
          />
        </div>

        {/* ── Table ── */}
        <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Sub District</TableHead>
                <TableHead>Zip Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : listData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                listData.map((item) => {
                  const key = String(item.areaId);
                  const isSelected = chooser.selection.state.isSelected(key);

                  return (
                    <TableRow
                      key={item.areaId}
                      data-state={isSelected ? 'selected' : undefined}
                      className="cursor-pointer"
                      onClick={() => chooser.selection.toggleRow(key)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => chooser.selection.toggleRow(key)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>{item.stateName}</TableCell>
                      <TableCell>{item.cityName}</TableCell>
                      <TableCell>{item.districtName}</TableCell>
                      <TableCell>{item.subDistrictName}</TableCell>
                      <TableCell>{item.zipCode}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </ChooserField>
  );
}

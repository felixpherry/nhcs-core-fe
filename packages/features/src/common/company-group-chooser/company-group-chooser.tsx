'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChooserField,
  useChooser,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Button,
} from '@nhcs/hcm-ui';

// ── Types ──

export interface CompanyGroup {
  companyGroupId: number;
  companyGroupCode: string | null;
  companyGroupName: string | null;
}

export interface CompanyGroupFormValue {
  companyGroupId: number;
  companyGroupCode: string;
  companyGroupName: string;
}

export interface CompanyGroupQueryParams {
  page: number;
  limit: number;
  search: string;
}

export interface CompanyGroupChooserProps {
  /** Current selected value */
  value: CompanyGroupFormValue | null;
  /** Called when value changes */
  onChange: (value: CompanyGroupFormValue | null) => void;
  /** List data from consumer's tRPC query */
  listData: CompanyGroup[];
  /** Total count from consumer's tRPC query */
  listCount: number;
  /** Loading state from consumer's tRPC query */
  isLoading: boolean;
  /** Called when internal search/page changes — consumer should update their query params */
  onQueryChange: (params: CompanyGroupQueryParams) => void;
  /** Validate a typed code — consumer calls their own tRPC endpoint */
  validateCode: (code: string) => Promise<CompanyGroupFormValue | null>;

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

// ── Component ──

export function CompanyGroupChooser({
  value,
  onChange,
  listData,
  listCount,
  isLoading,
  onQueryChange,
  validateCode,
  label = 'Company Group',
  required = false,
  disabled = false,
  readOnly = false,
  error,
  id,
}: CompanyGroupChooserProps) {
  // ── Internal dialog state ──

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ── Notify consumer when search/page changes ──

  useEffect(() => {
    onQueryChange({ page, limit: PAGE_SIZE, search });
  }, [search, page, onQueryChange]);

  // ── Chooser hook ──

  const chooser = useChooser<CompanyGroup, CompanyGroupFormValue>({
    mode: 'single',
    required,
    rowKey: (row) => String(row.companyGroupId),
    mapSelected: (row) => ({
      companyGroupId: row.companyGroupId,
      companyGroupCode: row.companyGroupCode ?? '',
      companyGroupName: row.companyGroupName ?? '',
    }),
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
      setSearch('');
      setPage(1);
      originalOpen(preselectedKeys);
    },
    [originalOpen],
  );

  // ── Pagination ──

  const totalPages = Math.ceil(listCount / PAGE_SIZE);

  return (
    <ChooserField
      chooser={{ ...chooser, open: handleOpen }}
      validateCode={validateCode}
      getCode={(item) => item.companyGroupCode}
      getLabel={(item) => item.companyGroupName}
      getKey={(item) => String(item.companyGroupId)}
      value={value}
      onChange={onChange}
      label={label}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      error={error}
      id={id}
      placeholder="Enter code"
      dialogTitle="Choose Company Group"
    >
      <div className="space-y-4">
        {/* ── Search ── */}
        <Input
          type="text"
          placeholder="Search company group..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        {/* ── Table ── */}
        <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Company Group Code</TableHead>
                <TableHead>Company Group Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : listData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                listData.map((item) => {
                  const key = String(item.companyGroupId);
                  const isSelected = chooser.selection.state.isSelected(key);

                  return (
                    <TableRow
                      key={item.companyGroupId}
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
                      <TableCell className="font-mono">{item.companyGroupCode}</TableCell>
                      <TableCell>{item.companyGroupName}</TableCell>
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

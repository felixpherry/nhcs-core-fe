'use client';

import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import type { UseDataTableReturn } from '../../hooks/use-data-table';
import type { ColumnConfig } from './column-types';
import { StatusBadgeCell, DateCell, NumberCell } from './cell-renderers';
import { cn } from '../../lib/utils';

// ── Props ──

export interface DataTableProps<TData> {
  table: UseDataTableReturn<TData>;
  children?: ReactNode;
  onRowClick?: (row: TData) => void;
}

// ── Render cell value ──

function renderCellValue<TData>(col: ColumnConfig<TData>, row: TData): ReactNode {
  // Get the raw value
  const value = col.accessorFn
    ? col.accessorFn(row)
    : col.accessorKey
      ? (row as Record<string, unknown>)[col.accessorKey]
      : null;

  // Custom render function
  if (typeof col.cell === 'function') {
    return col.cell(value, row);
  }

  // Built-in cell types
  switch (col.cell) {
    case 'status-badge':
      return <StatusBadgeCell value={value} />;
    case 'date':
      return <DateCell value={value} />;
    case 'number':
      return <NumberCell value={value} />;
    case 'row-actions':
      return null; // Handled externally via custom render
    case 'text':
    default:
      return <span>{value !== null && value !== undefined ? String(value) : '-'}</span>;
  }
}

// ── Sort indicator ──

function SortIndicator({
  columnId,
  sorting,
}: {
  columnId: string;
  sorting: { id: string; desc: boolean }[];
}) {
  const sort = sorting.find((s) => s.id === columnId);
  if (!sort) return null;

  const index = sorting.length > 1 ? sorting.findIndex((s) => s.id === columnId) + 1 : null;

  return (
    <span className="ml-1 text-muted-foreground">
      {sort.desc ? '↓' : '↑'}
      {index && <sup className="text-xs">{index}</sup>}
    </span>
  );
}

// ── Main component ──

export function DataTable<TData>(props: DataTableProps<TData>) {
  const { table, children, onRowClick } = props;

  return (
    <div className="space-y-4">
      {children}
      <DataTableContent table={table} onRowClick={onRowClick} />
    </div>
  );
}

// ── Table content ──

export function DataTableContent<TData>({
  table,
  onRowClick,
}: {
  table: UseDataTableReturn<TData>;
  onRowClick?: (row: TData) => void;
}) {
  const { visibleColumns, data, isLoading, selection, getRowId, sorting } = table;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (table.isEmpty) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">No data found</span>
      </div>
    );
  }

  const allRowKeys = data.map(getRowId);

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    allRowKeys.length > 0 && allRowKeys.every((k) => selection.state.isSelected(k))
                  }
                  onCheckedChange={() => selection.toggleAll(allRowKeys)}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {visibleColumns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  col.sortable && 'cursor-pointer select-none',
                  col.width && typeof col.width === 'number' && `w-[${col.width}px]`,
                )}
                onClick={col.sortable ? () => table.toggleSort(col.id) : undefined}
              >
                <div className="flex items-center">
                  {col.header}
                  {col.sortable && <SortIndicator columnId={col.id} sorting={sorting} />}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowId = getRowId(row);
            const isSelected = selection?.state.isSelected(rowId) ?? false;

            return (
              <TableRow
                key={rowId}
                data-state={isSelected ? 'selected' : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selection && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => selection.toggleRow(rowId)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select row ${rowId}`}
                    />
                  </TableCell>
                )}
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>{renderCellValue(col, row)}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Toolbar ──

export function DataTableToolbar({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4">{children}</div>;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

export function DataTableActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

// ── Pagination ──

export function DataTablePagination<TData>({ table }: { table: UseDataTableReturn<TData> }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {table.totalCount > 0 ? (
          <>
            Showing {(table.page - 1) * table.pageSize + 1} to{' '}
            {Math.min(table.page * table.pageSize, table.totalCount)} of {table.totalCount}
          </>
        ) : (
          'No results'
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <select
            value={table.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            {table.pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={table.previousPage}
            disabled={!table.canPreviousPage}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-sm disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm px-2">
            {table.page} / {table.pageCount}
          </span>
          <button
            onClick={table.nextPage}
            disabled={!table.canNextPage}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-sm disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

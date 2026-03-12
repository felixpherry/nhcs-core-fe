'use client';

import type { ReactNode } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import type { UseTreeTableReturn, FlatTreeNode } from '../../hooks/use-tree-table';
import type { ColumnConfig } from '../data-table/column-types';
import { StatusBadgeCell, DateCell, NumberCell } from '../data-table/cell-renderers';
import { cn } from '../../lib/utils';

// ── Props ──

export interface TreeTableProps<TData> {
  /** The useTreeTable return object */
  treeTable: UseTreeTableReturn<TData>;
  /** Column definitions (same ColumnConfig as DataTable) */
  columns: ColumnConfig<TData>[];
  /** Enable row selection checkboxes */
  selectable?: boolean;
  /** Pixels per indent level. Default: 24 */
  indentPx?: number;
  /** Content rendered above the table (toolbar, search, actions) */
  children?: ReactNode;
  /** Callback when a row is clicked */
  onRowClick?: (node: FlatTreeNode<TData>) => void;
  /** CSS class for matched search nodes */
  matchHighlightClass?: string;
  /** Empty state message */
  emptyMessage?: string;
}

// ── Render cell value (reused from DataTable pattern) ──

function renderCellValue<TData>(col: ColumnConfig<TData>, data: TData): ReactNode {
  const value = col.accessorFn
    ? col.accessorFn(data)
    : col.accessorKey
      ? (data as Record<string, unknown>)[col.accessorKey]
      : null;

  if (typeof col.cell === 'function') {
    return col.cell(value, data);
  }

  switch (col.cell) {
    case 'status-badge':
      return <StatusBadgeCell value={value} />;
    case 'date':
      return <DateCell value={value} />;
    case 'number':
      return <NumberCell value={value} />;
    case 'row-actions':
      return null;
    case 'text':
    default:
      return <span>{value !== null && value !== undefined ? String(value) : '-'}</span>;
  }
}

// ── Main component ──

export function TreeTable<TData>(props: TreeTableProps<TData>) {
  const {
    treeTable,
    columns,
    selectable = false,
    indentPx = 24,
    children,
    onRowClick,
    matchHighlightClass = 'bg-yellow-50 dark:bg-yellow-950/30',
    emptyMessage = 'No data found',
  } = props;

  const { flatNodes, toggleNode, toggleExpand, selection } = treeTable;

  // Filter columns by visibility
  const visibleColumns = columns.filter((col) => col.visible !== false);

  return (
    <div className="space-y-4">
      {children}
      {flatNodes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">{emptyMessage}</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && <TableHead className="w-12" />}
                {visibleColumns.map((col) => (
                  <TableHead key={col.id}>{col.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatNodes.map((node) => {
                const isSelected = selection.state.isSelected(node.id);

                return (
                  <TableRow
                    key={node.id}
                    data-state={isSelected ? 'selected' : undefined}
                    data-matched={node.isMatched || undefined}
                    data-on-match-path={node.isOnMatchPath || undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      node.isMatched && matchHighlightClass,
                    )}
                    onClick={onRowClick ? () => onRowClick(node) : undefined}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleNode(node.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${node.id}`}
                        />
                      </TableCell>
                    )}

                    {/* Data columns */}
                    {visibleColumns.map((col, colIndex) => (
                      <TableCell key={col.id}>
                        {colIndex === 0 ? (
                          // First column: indent + expand toggle + value
                          <div
                            className="flex items-center"
                            style={{ paddingLeft: node.depth * indentPx }}
                          >
                            {/* Expand/collapse toggle */}
                            {node.hasChildren ? (
                              <button
                                type="button"
                                className="mr-1 flex size-6 shrink-0 items-center justify-center rounded-sm hover:bg-muted transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(node.id);
                                }}
                                aria-label={
                                  node.isExpanded ? `Collapse ${node.id}` : `Expand ${node.id}`
                                }
                                aria-expanded={node.isExpanded}
                              >
                                <ChevronRightIcon
                                  className={cn(
                                    'size-4 transition-transform duration-200',
                                    node.isExpanded && 'rotate-90',
                                  )}
                                />
                              </button>
                            ) : (
                              // Spacer for alignment with sibling toggles
                              <span className="mr-1 size-6 shrink-0" />
                            )}

                            {/* Cell value */}
                            <span className="truncate">{renderCellValue(col, node.data)}</span>
                          </div>
                        ) : (
                          renderCellValue(col, node.data)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Toolbar subcomponents (same pattern as DataTable) ──

export function TreeTableToolbar({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4">{children}</div>;
}

export function TreeTableSearch({
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

export function TreeTableActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

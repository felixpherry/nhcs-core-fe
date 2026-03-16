import type { ReactNode } from 'react';

// ── Built-in cell renderers ──

export type BuiltInCellType = 'text' | 'status-badge' | 'date' | 'number' | 'row-actions';

// ── Column definition ──

export interface ColumnConfig<TData> {
  /** Unique column identifier — required when using accessorFn */
  id: string;
  /** Key to access the value from the row data */
  accessorKey?: keyof TData & string;
  /** Function to derive a value (for computed columns) */
  accessorFn?: (row: TData) => unknown;
  /** Column header text */
  header: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /**
   * Sort key sent to the backend.
   * Defaults to accessorKey. Use when display field differs from sort field.
   * e.g. display companyGroupName but sort by companyGroupId
   */
  sortKey?: string;
  /** Built-in cell renderer or custom render function */
  cell?: BuiltInCellType | ((value: unknown, row: TData) => ReactNode);
  /** Column width */
  width?: number | string;
  /** Whether column is visible by default */
  visible?: boolean;
  /** Conditionally show column based on context */
  visibleWhen?: (ctx: unknown) => boolean;
  /** Pin column to left or right */
  pin?: 'left' | 'right';
  /** Enable/disable text wrapping */
  wrap?: boolean;
  /** Text alignment for header and cells. Default: 'left' */
  align?: 'left' | 'center' | 'right';
}

// ── Create columns helper ──

export function createColumns<TData>(configs: ColumnConfig<TData>[]): ColumnConfig<TData>[] {
  // Validate: accessorFn requires id
  for (const col of configs) {
    if (col.accessorFn && !col.id) {
      throw new Error(`Column with accessorFn must have an explicit id. Header: "${col.header}"`);
    }
  }

  return configs.map((col) => ({
    ...col,
    // Default visible to true
    visible: col.visible ?? true,
    // Default sortKey to accessorKey
    sortKey: col.sortKey ?? col.accessorKey,
  }));
}

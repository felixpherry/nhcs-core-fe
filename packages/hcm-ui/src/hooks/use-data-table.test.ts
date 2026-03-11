import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataTable } from './use-data-table';
import { createColumns } from '../components/data-table/column-types';

interface Company {
  companyId: number;
  companyCode: string;
  companyName: string;
  isActive: 'T' | 'F';
}

const COLUMNS = createColumns<Company>([
  { id: 'code', accessorKey: 'companyCode', header: 'Code', sortable: true },
  { id: 'name', accessorKey: 'companyName', header: 'Name', sortable: true },
  { id: 'status', accessorKey: 'isActive', header: 'Status' },
]);

const SAMPLE_DATA: Company[] = [
  { companyId: 1, companyCode: 'ACM', companyName: 'Acme', isActive: 'T' },
  { companyId: 2, companyCode: 'GLB', companyName: 'Globe', isActive: 'F' },
  { companyId: 3, companyCode: 'TST', companyName: 'Test Co', isActive: 'T' },
];

function defaultOptions() {
  return {
    columns: COLUMNS,
    getRowId: (row: Company) => String(row.companyId),
  };
}

/** Helper: render the hook and seed it with data + loading state */
function renderSeededTable(
  overrides?: Partial<Parameters<typeof useDataTable<Company>>[0]> & {
    data?: Company[];
    totalCount?: number;
    isLoading?: boolean;
    isFetching?: boolean;
  },
) {
  const { data, totalCount, isLoading, isFetching, ...hookOptions } = {
    data: SAMPLE_DATA,
    totalCount: 25,
    isLoading: false,
    isFetching: false,
    ...overrides,
  };

  const result = renderHook(() => useDataTable<Company>({ ...defaultOptions(), ...hookOptions }));

  // Seed data into the hook
  act(() => {
    result.result.current._setData(data, totalCount);
    result.result.current._setLoading(isLoading, isFetching);
  });

  return result;
}

describe('useDataTable', () => {
  // ── Initial state (before seeding) ──

  describe('initial state', () => {
    it('starts with loading=true and empty data before _setData/_setLoading', () => {
      const { result } = renderHook(() => useDataTable(defaultOptions()));

      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.data).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isEmpty).toBe(false); // isLoading=true so isEmpty=false
      expect(result.current.sorting).toEqual([]);
      expect(result.current.selection).toBeNull();
    });

    it('reflects data after _setData and _setLoading', () => {
      const { result } = renderSeededTable();

      expect(result.current.data).toEqual(SAMPLE_DATA);
      expect(result.current.totalCount).toBe(25);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isEmpty).toBe(false);
    });

    it('respects custom defaultPageSize', () => {
      const { result } = renderSeededTable({ defaultPageSize: 25 });

      expect(result.current.pageSize).toBe(25);
    });

    it('respects defaultSorting', () => {
      const { result } = renderSeededTable({
        defaultSorting: [{ id: 'code', desc: false }],
      });

      expect(result.current.sorting).toEqual([{ id: 'code', desc: false }]);
    });

    it('isEmpty is true when data is empty and not loading', () => {
      const { result } = renderSeededTable({
        data: [],
        totalCount: 0,
        isLoading: false,
      });

      expect(result.current.isEmpty).toBe(true);
    });

    it('isEmpty is false when loading', () => {
      const { result } = renderSeededTable({
        data: [],
        totalCount: 0,
        isLoading: true,
      });

      expect(result.current.isEmpty).toBe(false);
    });
  });

  // ── Pagination ──

  describe('pagination', () => {
    it('calculates pageCount correctly', () => {
      const { result } = renderSeededTable();

      // 25 items / 10 per page = 3 pages
      expect(result.current.pageCount).toBe(3);
    });

    it('setPage changes the page', () => {
      const { result } = renderSeededTable();

      act(() => result.current.setPage(2));
      expect(result.current.page).toBe(2);
    });

    it('setPage clamps to valid range', () => {
      const { result } = renderSeededTable();

      act(() => result.current.setPage(999));
      expect(result.current.page).toBe(3); // max page

      act(() => result.current.setPage(0));
      expect(result.current.page).toBe(1); // min page
    });

    it('nextPage and previousPage work', () => {
      const { result } = renderSeededTable();

      act(() => result.current.nextPage());
      expect(result.current.page).toBe(2);

      act(() => result.current.previousPage());
      expect(result.current.page).toBe(1);
    });

    it('previousPage does not go below 1', () => {
      const { result } = renderSeededTable();

      act(() => result.current.previousPage());
      expect(result.current.page).toBe(1);
    });

    it('nextPage does not go above pageCount', () => {
      const { result } = renderSeededTable();

      act(() => result.current.setPage(3));
      act(() => result.current.nextPage());
      expect(result.current.page).toBe(3);
    });

    it('canPreviousPage and canNextPage are correct', () => {
      const { result } = renderSeededTable();

      expect(result.current.canPreviousPage).toBe(false);
      expect(result.current.canNextPage).toBe(true);

      act(() => result.current.setPage(2));
      expect(result.current.canPreviousPage).toBe(true);
      expect(result.current.canNextPage).toBe(true);

      act(() => result.current.setPage(3));
      expect(result.current.canPreviousPage).toBe(true);
      expect(result.current.canNextPage).toBe(false);
    });

    it('setPageSize resets to page 1', () => {
      const { result } = renderSeededTable();

      act(() => result.current.setPage(3));
      expect(result.current.page).toBe(3);

      act(() => result.current.setPageSize(25));
      expect(result.current.pageSize).toBe(25);
      expect(result.current.page).toBe(1);
    });

    it('pageSizeOptions defaults to [10, 25, 50, 100]', () => {
      const { result } = renderSeededTable();

      expect(result.current.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });

  // ── Sorting ──

  describe('sorting', () => {
    it('toggleSort adds ascending sort', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleSort('code'));
      expect(result.current.sorting).toEqual([{ id: 'code', desc: false }]);
    });

    it('toggleSort cycles: asc → desc → none', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleSort('code'));
      expect(result.current.sorting).toEqual([{ id: 'code', desc: false }]);

      act(() => result.current.toggleSort('code'));
      expect(result.current.sorting).toEqual([{ id: 'code', desc: true }]);

      act(() => result.current.toggleSort('code'));
      expect(result.current.sorting).toEqual([]);
    });

    it('supports multi-sort', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleSort('code'));
      act(() => result.current.toggleSort('name'));

      expect(result.current.sorting).toEqual([
        { id: 'code', desc: false },
        { id: 'name', desc: false },
      ]);
    });

    it('toggleSort resets to page 1', () => {
      const { result } = renderSeededTable();

      act(() => result.current.setPage(3));
      act(() => result.current.toggleSort('code'));
      expect(result.current.page).toBe(1);
    });

    it('clearSorting removes all sorts and resets page', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleSort('code'));
      act(() => result.current.setPage(2));

      act(() => result.current.clearSorting());
      expect(result.current.sorting).toEqual([]);
      expect(result.current.page).toBe(1);
    });

    it('orderBys converts sorting to backend format', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleSort('code'));
      expect(result.current.orderBys).toEqual([{ item1: 'companyCode', item2: true }]);

      act(() => result.current.toggleSort('code')); // now desc
      expect(result.current.orderBys).toEqual([{ item1: 'companyCode', item2: false }]);
    });
  });

  // ── Column visibility ──

  describe('column visibility', () => {
    it('all columns visible by default', () => {
      const { result } = renderSeededTable();

      expect(result.current.visibleColumns).toHaveLength(3);
    });

    it('toggleColumnVisibility hides a column', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleColumnVisibility('status'));
      expect(result.current.visibleColumns).toHaveLength(2);
      expect(result.current.visibleColumns.find((c) => c.id === 'status')).toBeUndefined();
    });

    it('toggleColumnVisibility shows a hidden column', () => {
      const { result } = renderSeededTable();

      act(() => result.current.toggleColumnVisibility('status'));
      expect(result.current.visibleColumns).toHaveLength(2);

      act(() => result.current.toggleColumnVisibility('status'));
      expect(result.current.visibleColumns).toHaveLength(3);
    });

    it('respects initial visible=false from column config', () => {
      const columnsWithHidden = createColumns<Company>([
        { id: 'code', accessorKey: 'companyCode', header: 'Code' },
        { id: 'name', accessorKey: 'companyName', header: 'Name' },
        { id: 'status', accessorKey: 'isActive', header: 'Status', visible: false },
      ]);

      const { result } = renderSeededTable({ columns: columnsWithHidden });

      expect(result.current.visibleColumns).toHaveLength(2);
      expect(result.current.columnVisibility['status']).toBe(false);
    });
  });

  // ── Selection ──

  describe('selection', () => {
    it('returns null when selection not configured', () => {
      const { result } = renderSeededTable();

      expect(result.current.selection).toBeNull();
    });

    it('returns selection state when configured', () => {
      const { result } = renderSeededTable({ selection: { mode: 'multi' } });

      expect(result.current.selection).not.toBeNull();
      expect(result.current.selection!.state.isEmpty).toBe(true);
    });

    it('selection toggle works', () => {
      const { result } = renderSeededTable({ selection: { mode: 'multi' } });

      act(() => result.current.selection!.toggleRow('1'));
      expect(result.current.selection!.state.isSelected('1')).toBe(true);

      act(() => result.current.selection!.toggleRow('1'));
      expect(result.current.selection!.state.isSelected('1')).toBe(false);
    });

    it('single selection mode works', () => {
      const { result } = renderSeededTable({ selection: { mode: 'single' } });

      act(() => result.current.selection!.toggleRow('1'));
      act(() => result.current.selection!.toggleRow('2'));

      expect(result.current.selection!.state.isSelected('1')).toBe(false);
      expect(result.current.selection!.state.isSelected('2')).toBe(true);
    });
  });

  // ── getRowId ──

  describe('getRowId', () => {
    it('is accessible from return value', () => {
      const { result } = renderSeededTable();

      expect(result.current.getRowId(SAMPLE_DATA[0]!)).toBe('1');
      expect(result.current.getRowId(SAMPLE_DATA[1]!)).toBe('2');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  DataTableSearch,
  DataTableActions,
} from './data-table';
import { useDataTable } from '../../hooks/use-data-table';
import { createColumns } from './column-types';

interface Company {
  companyId: number;
  companyCode: string;
  companyName: string;
  isActive: 'T' | 'F';
}

const COLUMNS = createColumns<Company>([
  { id: 'code', accessorKey: 'companyCode', header: 'Code', sortable: true },
  { id: 'name', accessorKey: 'companyName', header: 'Name', sortable: true },
  { id: 'status', accessorKey: 'isActive', header: 'Status', cell: 'status-badge' },
]);

const SAMPLE_DATA: Company[] = [
  { companyId: 1, companyCode: 'ACM', companyName: 'Acme Corp', isActive: 'T' },
  { companyId: 2, companyCode: 'GLB', companyName: 'Globe Inc', isActive: 'F' },
  { companyId: 3, companyCode: 'TST', companyName: 'Test Co', isActive: 'T' },
];

// Helper to create a table hook result
function useTestTable(overrides?: Partial<Parameters<typeof useDataTable<Company>>[0]>) {
  return useDataTable<Company>({
    columns: COLUMNS,
    getRowId: (row) => String(row.companyId),
    data: SAMPLE_DATA,
    totalCount: 25,
    isLoading: false,
    ...overrides,
  });
}

describe('DataTable', () => {
  // ── Rendering ──

  describe('rendering', () => {
    it('renders table headers', () => {
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders table rows', () => {
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      expect(screen.getByText('ACM')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('GLB')).toBeInTheDocument();
      expect(screen.getByText('Globe Inc')).toBeInTheDocument();
    });

    it('renders status badges', () => {
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      const badges = screen.getAllByText(/Active|Inactive/);
      expect(badges).toHaveLength(3);
      expect(screen.getAllByText('Active')).toHaveLength(2);
      expect(screen.getAllByText('Inactive')).toHaveLength(1);
    });

    it('shows loading state', () => {
      const { result } = renderHook(() => useTestTable({ isLoading: true }));

      render(<DataTable table={result.current} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('ACM')).not.toBeInTheDocument();
    });

    it('shows empty state', () => {
      const { result } = renderHook(() => useTestTable({ data: [], totalCount: 0 }));

      render(<DataTable table={result.current} />);

      expect(screen.getByText('No data found')).toBeInTheDocument();
    });
  });

  // ── Row click ──

  describe('row click', () => {
    it('calls onRowClick with row data', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} onRowClick={onRowClick} />);

      await user.click(screen.getByText('Acme Corp'));
      expect(onRowClick).toHaveBeenCalledWith(SAMPLE_DATA[0]);
    });
  });

  // ── Selection ──

  describe('selection', () => {
    it('renders checkboxes when selection is enabled', () => {
      const { result } = renderHook(() => useTestTable({ selection: { mode: 'multi' } }));

      render(<DataTable table={result.current} />);

      // Header checkbox + 3 row checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(4);
    });

    it('does not render checkboxes when selection is disabled', () => {
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('clicking row checkbox toggles selection', async () => {
      const user = userEvent.setup();
      const { result } = renderHook(() => useTestTable({ selection: { mode: 'multi' } }));

      render(<DataTable table={result.current} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Click first row checkbox (index 1, index 0 is header)
      await user.click(checkboxes[1]!);

      expect(result.current.selection!.state.isSelected('1')).toBe(true);
    });

    it('clicking header checkbox toggles all', async () => {
      const user = userEvent.setup();
      const { result } = renderHook(() => useTestTable({ selection: { mode: 'multi' } }));

      render(<DataTable table={result.current} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Click header checkbox
      await user.click(checkboxes[0]!);

      expect(result.current.selection!.state.isSelected('1')).toBe(true);
      expect(result.current.selection!.state.isSelected('2')).toBe(true);
      expect(result.current.selection!.state.isSelected('3')).toBe(true);
    });
  });

  // ── Sorting ──

  describe('sorting', () => {
    it('sortable columns show cursor pointer', () => {
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      const codeHeader = screen.getByText('Code').closest('th');
      expect(codeHeader).toHaveClass('cursor-pointer');
    });

    it('non-sortable columns do not show cursor', () => {
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      const statusHeader = screen.getByText('Status').closest('th');
      expect(statusHeader).not.toHaveClass('cursor-pointer');
    });

    it('clicking sortable header triggers sort', async () => {
      const user = userEvent.setup();
      const { result } = renderHook(() => useTestTable());

      render(<DataTable table={result.current} />);

      await user.click(screen.getByText('Code'));
      expect(result.current.sorting).toEqual([{ id: 'code', desc: false }]);
    });
  });

  // ── Children (toolbar slot) ──

  describe('children', () => {
    it('renders children above the table', () => {
      const { result } = renderHook(() => useTestTable());

      render(
        <DataTable table={result.current}>
          <div data-testid="toolbar">My Toolbar</div>
        </DataTable>,
      );

      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(screen.getByText('My Toolbar')).toBeInTheDocument();
    });
  });
});

describe('DataTablePagination', () => {
  it('shows correct range text', () => {
    const { result } = renderHook(() => useTestTable());

    render(<DataTablePagination table={result.current} />);

    expect(screen.getByText(/Showing 1 to 10 of 25/)).toBeInTheDocument();
  });

  it('shows page info', () => {
    const { result } = renderHook(() => useTestTable());

    render(<DataTablePagination table={result.current} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    const { result } = renderHook(() => useTestTable());

    render(<DataTablePagination table={result.current} />);

    await user.click(screen.getByText('→'));
    expect(result.current.page).toBe(2);
  });

  it('disables previous on first page', () => {
    const { result } = renderHook(() => useTestTable());

    render(<DataTablePagination table={result.current} />);

    const prevButton = screen.getByText('←');
    expect(prevButton).toBeDisabled();
  });

  it('shows no results when empty', () => {
    const { result } = renderHook(() => useTestTable({ data: [], totalCount: 0 }));

    render(<DataTablePagination table={result.current} />);

    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});

describe('DataTableToolbar', () => {
  it('renders search and actions', () => {
    render(
      <DataTableToolbar>
        <DataTableSearch value="" onChange={() => {}} />
        <DataTableActions>
          <button>Add</button>
          <button>Export</button>
        </DataTableActions>
      </DataTableToolbar>,
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('search calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DataTableToolbar>
        <DataTableSearch value="" onChange={onChange} />
      </DataTableToolbar>,
    );

    await user.type(screen.getByPlaceholderText('Search...'), 'A');
    expect(onChange).toHaveBeenCalledWith('A');
  });
});

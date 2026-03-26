// import { describe, it, expect, vi } from 'vitest';
// import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';

// import { TreeTable, TreeTableToolbar, TreeTableSearch, TreeTableActions } from './tree-table';
// import type { UseTreeTableReturn, FlatTreeNode } from '../../hooks/use-tree-table';
// import type { SelectionState, UseSelectionReturn } from '@/hooks/use-selection';
// import { createColumns } from '@/components/data-table/column-types';

// // ── Test types ──

// interface Org {
//   name: string;
//   code: string;
// }

// // ── Test data ──

// const columns = createColumns<Org>([
//   { id: 'name', accessorKey: 'name', header: 'Organization' },
//   { id: 'code', accessorKey: 'code', header: 'Code' },
// ]);

// /**
//  * Mock flat nodes representing:
//  * HQ (depth 0, expanded)
//  * ├── Finance (depth 1, collapsed, has children)
//  * └── HR (depth 1, leaf)
//  * Branch (depth 0, leaf)
//  */
// function createMockFlatNodes(): FlatTreeNode<Org>[] {
//   return [
//     {
//       id: '1',
//       data: { name: 'Headquarters', code: 'HQ' },
//       depth: 0,
//       hasChildren: true,
//       isExpanded: true,
//       isMatched: false,
//       isOnMatchPath: false,
//       parentId: null,
//     },
//     {
//       id: '1a',
//       data: { name: 'Finance Division', code: 'FIN' },
//       depth: 1,
//       hasChildren: true,
//       isExpanded: false,
//       isMatched: false,
//       isOnMatchPath: false,
//       parentId: '1',
//     },
//     {
//       id: '1b',
//       data: { name: 'HR Division', code: 'HR' },
//       depth: 1,
//       hasChildren: false,
//       isExpanded: false,
//       isMatched: false,
//       isOnMatchPath: false,
//       parentId: '1',
//     },
//     {
//       id: '2',
//       data: { name: 'Branch Office', code: 'BRN' },
//       depth: 0,
//       hasChildren: false,
//       isExpanded: false,
//       isMatched: false,
//       isOnMatchPath: false,
//       parentId: null,
//     },
//   ];
// }

// // ── Mock factories ──

// function createMockSelectionState(overrides: Partial<SelectionState> = {}): SelectionState {
//   return {
//     selectedKeys: new Set<string>(),
//     isSelected: (key: string) => overrides.selectedKeys?.has(key) ?? false,
//     isAllSelected: () => false,
//     isPartiallySelected: () => false,
//     isEmpty: true,
//     ...overrides,
//   };
// }

// function createMockSelection(overrides: Partial<UseSelectionReturn> = {}): UseSelectionReturn {
//   return {
//     state: createMockSelectionState(),
//     toggleRow: vi.fn(),
//     toggleAll: vi.fn(),
//     selectOnly: vi.fn(),
//     clear: vi.fn(),
//     selectKeys: vi.fn(),
//     replaceSelection: vi.fn(),
//     ...overrides,
//   };
// }

// function createMockTreeTable(
//   overrides: Partial<UseTreeTableReturn<Org>> = {},
// ): UseTreeTableReturn<Org> {
//   return {
//     flatNodes: createMockFlatNodes(),
//     allFlatNodes: createMockFlatNodes(),
//     selection: createMockSelection(),
//     toggleNode: vi.fn(),
//     toggleExpand: vi.fn(),
//     expandAll: vi.fn(),
//     collapseAll: vi.fn(),
//     expandToNode: vi.fn(),
//     setSearch: vi.fn(),
//     searchTerm: '',
//     getAncestorIds: vi.fn().mockReturnValue([]),
//     getDescendantIds: vi.fn().mockReturnValue([]),
//     ...overrides,
//   };
// }

// // ── Tests ──

// describe('TreeTable', () => {
//   const user = userEvent.setup();

//   // ────────────────────────────────────────
//   // Rendering
//   // ────────────────────────────────────────

//   describe('rendering', () => {
//     it('renders column headers', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       expect(screen.getByText('Organization')).toBeInTheDocument();
//       expect(screen.getByText('Code')).toBeInTheDocument();
//     });

//     it('renders row data', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       expect(screen.getByText('Headquarters')).toBeInTheDocument();
//       expect(screen.getByText('HQ')).toBeInTheDocument();
//       expect(screen.getByText('Finance Division')).toBeInTheDocument();
//       expect(screen.getByText('FIN')).toBeInTheDocument();
//       expect(screen.getByText('Branch Office')).toBeInTheDocument();
//     });

//     it('renders empty state when no nodes', () => {
//       render(<TreeTable treeTable={createMockTreeTable({ flatNodes: [] })} columns={columns} />);

//       expect(screen.getByText('No data found')).toBeInTheDocument();
//     });

//     it('renders custom empty message', () => {
//       render(
//         <TreeTable
//           treeTable={createMockTreeTable({ flatNodes: [] })}
//           columns={columns}
//           emptyMessage="No organizations found"
//         />,
//       );

//       expect(screen.getByText('No organizations found')).toBeInTheDocument();
//     });

//     it('hides columns with visible: false', () => {
//       const colsWithHidden = createColumns<Org>([
//         { id: 'name', accessorKey: 'name', header: 'Organization' },
//         { id: 'code', accessorKey: 'code', header: 'Code', visible: false },
//       ]);

//       render(<TreeTable treeTable={createMockTreeTable()} columns={colsWithHidden} />);

//       expect(screen.getByText('Organization')).toBeInTheDocument();
//       expect(screen.queryByText('Code')).not.toBeInTheDocument();
//     });

//     it('renders children slot above the table', () => {
//       render(
//         <TreeTable treeTable={createMockTreeTable()} columns={columns}>
//           <div data-testid="toolbar">My Toolbar</div>
//         </TreeTable>,
//       );

//       expect(screen.getByTestId('toolbar')).toBeInTheDocument();
//     });
//   });

//   // ────────────────────────────────────────
//   // Indentation
//   // ────────────────────────────────────────

//   describe('indentation', () => {
//     it('indents first column by depth * indentPx', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       // HQ is depth 0 → paddingLeft: 0
//       const hqCell = screen.getByText('Headquarters').closest('[class*="flex items-center"]');
//       expect(hqCell).toHaveStyle({ paddingLeft: '0px' });

//       // Finance is depth 1 → paddingLeft: 24px (default indentPx)
//       const finCell = screen.getByText('Finance Division').closest('[class*="flex items-center"]');
//       expect(finCell).toHaveStyle({ paddingLeft: '24px' });
//     });

//     it('uses custom indentPx', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} indentPx={32} />);

//       const finCell = screen.getByText('Finance Division').closest('[class*="flex items-center"]');
//       expect(finCell).toHaveStyle({ paddingLeft: '32px' });
//     });

//     it('does not indent non-first columns', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       // Code column for Finance (FIN) should not have indent wrapper
//       const finCodeCell = screen.getByText('FIN');
//       const wrapper = finCodeCell.closest('[class*="flex items-center"]');
//       // FIN is in a plain cell, not wrapped in the indent div
//       expect(wrapper).toBeNull();
//     });
//   });

//   // ────────────────────────────────────────
//   // Expand / collapse toggles
//   // ────────────────────────────────────────

//   describe('expand / collapse', () => {
//     it('shows chevron on nodes with children', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       const hqCell = screen.getByText('Headquarters').closest('[class*="flex items-center"]');
//       expect(hqCell?.querySelector('svg')).not.toBeNull();

//       const finCell = screen.getByText('Finance Division').closest('[class*="flex items-center"]');
//       expect(finCell?.querySelector('svg')).not.toBeNull();
//     });

//     it('does not show chevron on leaf nodes', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       const hrCell = screen.getByText('HR Division').closest('[class*="flex items-center"]');
//       expect(hrCell?.querySelector('svg')).toBeNull();
//     });

//     it('calls toggleExpand when first cell clicked on parent', async () => {
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} />);

//       await user.click(screen.getByText('Finance Division'));

//       expect(treeTable.toggleExpand).toHaveBeenCalledWith('1a');
//     });

//     it('does not call toggleExpand on leaf click', async () => {
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} />);

//       await user.click(screen.getByText('HR Division'));

//       expect(treeTable.toggleExpand).not.toHaveBeenCalled();
//     });

//     it('first cell click does not trigger row click on parent', async () => {
//       const onRowClick = vi.fn();
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} onRowClick={onRowClick} />);

//       await user.click(screen.getByText('Headquarters'));

//       expect(treeTable.toggleExpand).toHaveBeenCalledWith('1');
//       expect(onRowClick).not.toHaveBeenCalled();
//     });

//     it('leaf cell click triggers row click', async () => {
//       const onRowClick = vi.fn();
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} onRowClick={onRowClick} />);

//       await user.click(screen.getByText('Branch Office'));

//       expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
//     });
//   });

//   // ────────────────────────────────────────
//   // Selection
//   // ────────────────────────────────────────

//   describe('selection', () => {
//     it('renders checkboxes when selectable is true', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} selectable />);

//       const checkboxes = screen.getAllByRole('checkbox');
//       expect(checkboxes).toHaveLength(4); // 4 rows, no header checkbox
//     });

//     it('does not render checkboxes when selectable is false', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
//     });

//     it('calls toggleNode (not toggleRow) when checkbox clicked', async () => {
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} selectable />);

//       await user.click(screen.getByLabelText('Select 1a'));

//       // Must call toggleNode (policy-aware), not selection.toggleRow
//       expect(treeTable.toggleNode).toHaveBeenCalledWith('1a');
//       expect(treeTable.selection.toggleRow).not.toHaveBeenCalled();
//     });

//     it('checkbox click does not trigger row click', async () => {
//       const onRowClick = vi.fn();
//       const treeTable = createMockTreeTable();

//       render(
//         <TreeTable treeTable={treeTable} columns={columns} selectable onRowClick={onRowClick} />,
//       );

//       await user.click(screen.getByLabelText('Select 1'));

//       expect(treeTable.toggleNode).toHaveBeenCalled();
//       expect(onRowClick).not.toHaveBeenCalled();
//     });

//     it('selected rows get data-state="selected"', () => {
//       const selectedKeys = new Set(['1', '1a']);
//       const treeTable = createMockTreeTable({
//         selection: createMockSelection({
//           state: createMockSelectionState({ selectedKeys, isEmpty: false }),
//         }),
//       });

//       render(<TreeTable treeTable={treeTable} columns={columns} selectable />);

//       const rows = screen.getAllByRole('row');
//       // rows[0] is header row, rows[1-4] are data rows
//       // HQ (1) and Finance (1a) are selected
//       expect(rows[1]).toHaveAttribute('data-state', 'selected');
//       expect(rows[2]).toHaveAttribute('data-state', 'selected');
//       // HR (1b) and Branch (2) are not selected
//       expect(rows[3]).not.toHaveAttribute('data-state', 'selected');
//       expect(rows[4]).not.toHaveAttribute('data-state', 'selected');
//     });

//     it('checks checkbox for selected rows', () => {
//       const selectedKeys = new Set(['1']);
//       const treeTable = createMockTreeTable({
//         selection: createMockSelection({
//           state: createMockSelectionState({ selectedKeys, isEmpty: false }),
//         }),
//       });

//       render(<TreeTable treeTable={treeTable} columns={columns} selectable />);

//       const hqCheckbox = screen.getByLabelText('Select 1');
//       expect(hqCheckbox).toBeChecked();

//       const finCheckbox = screen.getByLabelText('Select 1a');
//       expect(finCheckbox).not.toBeChecked();
//     });
//   });

//   // ────────────────────────────────────────
//   // Search highlight
//   // ────────────────────────────────────────

//   describe('search highlight', () => {
//     it('applies highlight class to matched nodes', () => {
//       const nodes = createMockFlatNodes();
//       nodes[1]!.isMatched = true; // Finance is matched

//       const treeTable = createMockTreeTable({ flatNodes: nodes });

//       render(<TreeTable treeTable={treeTable} columns={columns} />);

//       const rows = screen.getAllByRole('row');
//       // rows[2] is Finance (second data row)
//       expect(rows[2]).toHaveAttribute('data-matched', 'true');
//     });

//     it('sets data-on-match-path on ancestor nodes', () => {
//       const nodes = createMockFlatNodes();
//       nodes[0]!.isOnMatchPath = true; // HQ is on match path

//       const treeTable = createMockTreeTable({ flatNodes: nodes });

//       render(<TreeTable treeTable={treeTable} columns={columns} />);

//       const rows = screen.getAllByRole('row');
//       expect(rows[1]).toHaveAttribute('data-on-match-path', 'true');
//     });

//     it('does not set data-matched on non-matching nodes', () => {
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} />);

//       const rows = screen.getAllByRole('row');
//       for (let i = 1; i < rows.length; i++) {
//         expect(rows[i]).not.toHaveAttribute('data-matched');
//       }
//     });

//     it('uses custom matchHighlightClass', () => {
//       const nodes = createMockFlatNodes();
//       nodes[1]!.isMatched = true;

//       const treeTable = createMockTreeTable({ flatNodes: nodes });

//       render(
//         <TreeTable treeTable={treeTable} columns={columns} matchHighlightClass="bg-blue-100" />,
//       );

//       const rows = screen.getAllByRole('row');
//       expect(rows[2]).toHaveClass('bg-blue-100');
//     });
//   });

//   // ────────────────────────────────────────
//   // Row click
//   // ────────────────────────────────────────

//   describe('row click', () => {
//     it('calls onRowClick with the flat node', async () => {
//       const onRowClick = vi.fn();
//       const treeTable = createMockTreeTable();

//       render(<TreeTable treeTable={treeTable} columns={columns} onRowClick={onRowClick} />);

//       await user.click(screen.getByText('Branch Office'));

//       expect(onRowClick).toHaveBeenCalledWith(
//         expect.objectContaining({
//           id: '2',
//           data: { name: 'Branch Office', code: 'BRN' },
//         }),
//       );
//     });

//     it('adds cursor-pointer class when onRowClick is provided', () => {
//       render(
//         <TreeTable treeTable={createMockTreeTable()} columns={columns} onRowClick={() => {}} />,
//       );

//       const rows = screen.getAllByRole('row');
//       // Data rows should have cursor-pointer
//       expect(rows[1]).toHaveClass('cursor-pointer');
//     });

//     it('does not add cursor-pointer when onRowClick is not provided', () => {
//       render(<TreeTable treeTable={createMockTreeTable()} columns={columns} />);

//       const rows = screen.getAllByRole('row');
//       expect(rows[1]).not.toHaveClass('cursor-pointer');
//     });
//   });

//   // ────────────────────────────────────────
//   // Custom cell renderer
//   // ────────────────────────────────────────

//   describe('custom cell renderer', () => {
//     it('supports custom cell render function', () => {
//       const customColumns = createColumns<Org>([
//         {
//           id: 'name',
//           accessorKey: 'name',
//           header: 'Organization',
//           cell: (value) => <strong data-testid="custom-cell">{String(value)}</strong>,
//         },
//         { id: 'code', accessorKey: 'code', header: 'Code' },
//       ]);

//       render(<TreeTable treeTable={createMockTreeTable()} columns={customColumns} />);

//       const customCells = screen.getAllByTestId('custom-cell');
//       expect(customCells).toHaveLength(4);
//       expect(customCells[0]).toHaveTextContent('Headquarters');
//     });
//   });
// });

// // ────────────────────────────────────────
// // Toolbar subcomponents
// // ────────────────────────────────────────

// describe('TreeTableToolbar', () => {
//   it('renders children in flex layout', () => {
//     render(
//       <TreeTableToolbar>
//         <TreeTableSearch value="" onChange={() => {}} />
//         <TreeTableActions>
//           <button>Expand All</button>
//         </TreeTableActions>
//       </TreeTableToolbar>,
//     );

//     expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
//     expect(screen.getByText('Expand All')).toBeInTheDocument();
//   });
// });

// describe('TreeTableSearch', () => {
//   const user = userEvent.setup();

//   it('renders with default placeholder', () => {
//     render(<TreeTableSearch value="" onChange={() => {}} />);

//     expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
//   });

//   it('renders with custom placeholder', () => {
//     render(<TreeTableSearch value="" onChange={() => {}} placeholder="Search organizations..." />);

//     expect(screen.getByPlaceholderText('Search organizations...')).toBeInTheDocument();
//   });

//   it('calls onChange when user types', async () => {
//     const onChange = vi.fn();

//     render(<TreeTableSearch value="" onChange={onChange} />);

//     await user.type(screen.getByPlaceholderText('Search...'), 'A');

//     expect(onChange).toHaveBeenCalledWith('A');
//   });

//   it('displays current value', () => {
//     render(<TreeTableSearch value="Finance" onChange={() => {}} />);

//     expect(screen.getByDisplayValue('Finance')).toBeInTheDocument();
//   });
// });

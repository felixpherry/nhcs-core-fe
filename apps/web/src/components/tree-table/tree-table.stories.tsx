// import type { Meta, StoryObj } from '@storybook/react';

// import { TreeTable, TreeTableToolbar, TreeTableSearch, TreeTableActions } from './tree-table';
// import { useTreeTable } from '../../hooks/use-tree-table';
// import type { TreeNode, SelectionPolicyFn } from '../../hooks/use-tree-table';
// import { Button } from '@/components/ui/button';
// import { useState } from 'react';

// // ── Test data ──

// interface Org {
//   name: string;
//   code: string;
//   level: string;
// }

// const orgTree: TreeNode<Org>[] = [
//   {
//     id: '1',
//     data: { name: 'Headquarters', code: 'HQ', level: 'Company' },
//     children: [
//       {
//         id: '1a',
//         data: { name: 'Finance Division', code: 'FIN', level: 'Division' },
//         children: [
//           { id: '1a-i', data: { name: 'Accounting Dept', code: 'ACC', level: 'Department' } },
//           { id: '1a-ii', data: { name: 'Treasury Dept', code: 'TRE', level: 'Department' } },
//           { id: '1a-iii', data: { name: 'Budgeting Dept', code: 'BUD', level: 'Department' } },
//         ],
//       },
//       {
//         id: '1b',
//         data: { name: 'HR Division', code: 'HR', level: 'Division' },
//         children: [
//           { id: '1b-i', data: { name: 'Recruitment Dept', code: 'REC', level: 'Department' } },
//           { id: '1b-ii', data: { name: 'Payroll Dept', code: 'PAY', level: 'Department' } },
//         ],
//       },
//       {
//         id: '1c',
//         data: { name: 'IT Division', code: 'IT', level: 'Division' },
//         children: [
//           { id: '1c-i', data: { name: 'Infrastructure', code: 'INF', level: 'Department' } },
//           { id: '1c-ii', data: { name: 'Software Dev', code: 'DEV', level: 'Department' } },
//         ],
//       },
//     ],
//   },
//   {
//     id: '2',
//     data: { name: 'Branch Office', code: 'BRN', level: 'Company' },
//     children: [
//       {
//         id: '2a',
//         data: { name: 'Operations', code: 'OPS', level: 'Division' },
//         children: [
//           { id: '2a-i', data: { name: 'Logistics', code: 'LOG', level: 'Department' } },
//           { id: '2a-ii', data: { name: 'Warehouse', code: 'WHS', level: 'Department' } },
//         ],
//       },
//     ],
//   },
// ];

// const columns = [
//   { id: 'name', accessorKey: 'name' as const, header: 'Organization' },
//   { id: 'code', accessorKey: 'code' as const, header: 'Code' },
//   { id: 'level', accessorKey: 'level' as const, header: 'Level' },
// ];

// const searchFn = (data: Org, term: string) =>
//   data.name.toLowerCase().includes(term.toLowerCase()) ||
//   data.code.toLowerCase().includes(term.toLowerCase());

// // ── Meta ──

// const meta: Meta = {
//   title: 'Table/TreeTable',
//   parameters: { layout: 'padded' },
// };

// export default meta;

// // ── Stories ──

// export const Default: StoryObj = {
//   render: () => {
//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       defaultExpandAll: true,
//     });

//     return (
//       <TreeTable treeTable={treeTable} columns={columns}>
//         <TreeTableToolbar>
//           <TreeTableActions>
//             <Button variant="outline" size="sm" onClick={treeTable.expandAll}>
//               Expand All
//             </Button>
//             <Button variant="outline" size="sm" onClick={treeTable.collapseAll}>
//               Collapse All
//             </Button>
//           </TreeTableActions>
//         </TreeTableToolbar>
//       </TreeTable>
//     );
//   },
// };

// export const WithSelection: StoryObj = {
//   name: 'With Selection (Independent)',
//   render: () => {
//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       selectionPolicy: 'independent',
//       defaultExpandAll: true,
//     });

//     return (
//       <div className="space-y-2">
//         <TreeTable treeTable={treeTable} columns={columns} selectable>
//           <TreeTableToolbar>
//             <TreeTableActions>
//               <Button variant="outline" size="sm" onClick={treeTable.expandAll}>
//                 Expand All
//               </Button>
//               <Button variant="outline" size="sm" onClick={treeTable.collapseAll}>
//                 Collapse All
//               </Button>
//             </TreeTableActions>
//           </TreeTableToolbar>
//         </TreeTable>
//         <pre className="rounded bg-muted p-2 text-xs">
//           Selected: {JSON.stringify(Array.from(treeTable.selection.state.selectedKeys), null, 2)}
//         </pre>
//       </div>
//     );
//   },
// };

// export const CascadeSelection: StoryObj = {
//   name: 'Cascade Selection',
//   render: () => {
//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       selectionPolicy: 'cascade',
//       defaultExpandAll: true,
//     });

//     return (
//       <div className="space-y-2">
//         <p className="text-sm text-muted-foreground">
//           Selecting a parent selects all descendants + ancestors. Deselecting a child deselects
//           ancestors if no siblings remain.
//         </p>
//         <TreeTable treeTable={treeTable} columns={columns} selectable />
//         <pre className="rounded bg-muted p-2 text-xs">
//           Selected: {JSON.stringify(Array.from(treeTable.selection.state.selectedKeys), null, 2)}
//         </pre>
//       </div>
//     );
//   },
// };

// export const LeafOnlySelection: StoryObj = {
//   name: 'Leaf-Only Selection',
//   render: () => {
//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       selectionPolicy: 'leaf-only',
//       defaultExpandAll: true,
//     });

//     return (
//       <div className="space-y-2">
//         <p className="text-sm text-muted-foreground">
//           Only leaf nodes (departments) can be selected. Clicking a division or company does
//           nothing.
//         </p>
//         <TreeTable treeTable={treeTable} columns={columns} selectable />
//         <pre className="rounded bg-muted p-2 text-xs">
//           Selected: {JSON.stringify(Array.from(treeTable.selection.state.selectedKeys), null, 2)}
//         </pre>
//       </div>
//     );
//   },
// };

// export const CustomPolicyTrusteeMenu: StoryObj = {
//   name: 'Custom Policy (Trustee Menu)',
//   render: () => {
//     const trusteePolicy: SelectionPolicyFn<Org> = ({
//       toggledNode,
//       wasSelected,
//       selectedKeys,
//       getAncestorIds,
//       getDescendantIds,
//     }) => {
//       const next = new Set(selectedKeys);
//       if (wasSelected) {
//         next.delete(toggledNode.id);
//         for (const id of getDescendantIds(toggledNode.id)) {
//           next.delete(id);
//         }
//       } else {
//         next.add(toggledNode.id);
//         for (const id of getAncestorIds(toggledNode.id)) {
//           next.add(id);
//         }
//       }
//       return next;
//     };

//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       selectionPolicy: trusteePolicy,
//       defaultExpandAll: true,
//     });

//     return (
//       <div className="space-y-2">
//         <p className="text-sm text-muted-foreground">
//           Check cascades UP (ancestors). Uncheck cascades DOWN (descendants). Selecting a child
//           auto-selects parents but not siblings.
//         </p>
//         <TreeTable treeTable={treeTable} columns={columns} selectable />
//         <pre className="rounded bg-muted p-2 text-xs">
//           Selected: {JSON.stringify(Array.from(treeTable.selection.state.selectedKeys), null, 2)}
//         </pre>
//       </div>
//     );
//   },
// };

// export const SearchHighlight: StoryObj = {
//   name: 'Search — Highlight Mode',
//   render: () => {
//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       searchFn,
//       searchMode: 'highlight',
//       defaultExpandAll: true,
//     });

//     return (
//       <TreeTable treeTable={treeTable} columns={columns}>
//         <TreeTableToolbar>
//           <TreeTableSearch
//             value={treeTable.searchTerm}
//             onChange={treeTable.setSearch}
//             placeholder="Search organizations..."
//           />
//         </TreeTableToolbar>
//       </TreeTable>
//     );
//   },
// };

// export const SearchFilter: StoryObj = {
//   name: 'Search — Filter Mode',
//   render: () => {
//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       searchFn,
//       searchMode: 'filter',
//       defaultExpandAll: true,
//     });

//     return (
//       <TreeTable treeTable={treeTable} columns={columns}>
//         <TreeTableToolbar>
//           <TreeTableSearch
//             value={treeTable.searchTerm}
//             onChange={treeTable.setSearch}
//             placeholder="Search organizations..."
//           />
//         </TreeTableToolbar>
//       </TreeTable>
//     );
//   },
// };

// export const ToggleableSelection: StoryObj = {
//   name: 'Toggleable Selection Mode',
//   render: () => {
//     const [selectable, setSelectable] = useState(false);

//     const treeTable = useTreeTable<Org>({
//       nodes: orgTree,
//       selectionPolicy: 'independent',
//       defaultExpandAll: true,
//     });

//     return (
//       <div className="space-y-2">
//         <TreeTable treeTable={treeTable} columns={columns} selectable={selectable}>
//           <TreeTableToolbar>
//             <TreeTableSearch
//               value={treeTable.searchTerm}
//               onChange={treeTable.setSearch}
//               placeholder="Search organizations..."
//             />
//             <TreeTableActions>
//               <Button
//                 variant={selectable ? 'default' : 'outline'}
//                 size="sm"
//                 onClick={() => setSelectable((v) => !v)}
//               >
//                 {selectable ? 'Done Selecting' : 'Select Items'}
//               </Button>
//               <Button variant="outline" size="sm" onClick={treeTable.expandAll}>
//                 Expand All
//               </Button>
//               <Button variant="outline" size="sm" onClick={treeTable.collapseAll}>
//                 Collapse All
//               </Button>
//             </TreeTableActions>
//           </TreeTableToolbar>
//         </TreeTable>
//         {selectable && (
//           <pre className="rounded bg-muted p-2 text-xs">
//             Selected:{' '}
//             {JSON.stringify(Array.from(treeTable.selection.state.selectedKeys), null, 2)}{' '}
//           </pre>
//         )}
//       </div>
//     );
//   },
// };

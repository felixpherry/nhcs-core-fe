'use client';

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@/components/ui';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';

interface Employee {
  code: string;
  name: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'pending';
  salary: number;
  joinDate: string;
}

const data: Employee[] = [
  {
    code: 'EMP001',
    name: 'John Doe',
    department: 'Engineering',
    position: 'Senior Engineer',
    status: 'active',
    salary: 120000,
    joinDate: '2020-01-15',
  },
  {
    code: 'EMP002',
    name: 'Jane Smith',
    department: 'HR',
    position: 'HR Manager',
    status: 'active',
    salary: 95000,
    joinDate: '2019-03-22',
  },
  {
    code: 'EMP003',
    name: 'Bob Wilson',
    department: 'Finance',
    position: 'Accountant',
    status: 'inactive',
    salary: 85000,
    joinDate: '2021-07-10',
  },
  {
    code: 'EMP004',
    name: 'Alice Chen',
    department: 'Engineering',
    position: 'Tech Lead',
    status: 'active',
    salary: 140000,
    joinDate: '2018-11-05',
  },
  {
    code: 'EMP005',
    name: 'David Kim',
    department: 'Marketing',
    position: 'Marketing Specialist',
    status: 'active',
    salary: 75000,
    joinDate: '2022-02-28',
  },
  {
    code: 'EMP006',
    name: 'Sarah Lee',
    department: 'Engineering',
    position: 'Junior Developer',
    status: 'pending',
    salary: 65000,
    joinDate: '2024-01-08',
  },
  {
    code: 'EMP007',
    name: 'Mike Brown',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'inactive',
    salary: 110000,
    joinDate: '2017-06-14',
  },
  {
    code: 'EMP008',
    name: 'Emily Davis',
    department: 'Engineering',
    position: 'Staff Engineer',
    status: 'active',
    salary: 160000,
    joinDate: '2016-09-20',
  },
  {
    code: 'EMP009',
    name: 'Tom Harris',
    department: 'Finance',
    position: 'CFO',
    status: 'active',
    salary: 200000,
    joinDate: '2015-04-01',
  },
  {
    code: 'EMP010',
    name: 'Lisa Wang',
    department: 'HR',
    position: 'Recruiter',
    status: 'pending',
    salary: 70000,
    joinDate: '2024-03-15',
  },
];

const statusVariant = {
  active: 'success-soft',
  inactive: 'danger-soft',
  pending: 'warning-soft',
} as const;

const columnHelper = createColumnHelper<Employee>();

const columns = [
  columnHelper.accessor('code', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Code" />,
    cell: (info) => <span className="font-mono">{info.getValue()}</span>,
    enableMultiSort: true,
  }),
  columnHelper.accessor('name', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    enableMultiSort: true,
  }),
  columnHelper.accessor('department', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Department" />,
    enableMultiSort: true,
  }),
  columnHelper.accessor('position', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Position" />,
    enableMultiSort: true,
  }),
  columnHelper.accessor('salary', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Salary" />,
    cell: (info) => `$${info.getValue().toLocaleString()}`,
    enableMultiSort: true,
  }),
  columnHelper.accessor('joinDate', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Join Date" />,
    enableMultiSort: true,
  }),
  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
    cell: (info) => (
      <Badge variant={statusVariant[info.getValue()]} size="sm">
        {info.getValue()}
      </Badge>
    ),
    enableMultiSort: true,
  }),
];

export default function TestColumnHeaderPage() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    isMultiSortEvent: () => true,
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">DataTableColumnHeader Test</h1>
        <p className="mt-1 text-sub">
          Click column headers to sort. Multi-sort is enabled — click multiple columns. Hover a
          sorted column to see the clear (X) button.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="mb-2 text-sm font-medium">Current Sort State</h2>
        <pre className="text-xs text-sub">{JSON.stringify(table.getState().sorting, null, 2)}</pre>
      </div>
    </div>
  );
}

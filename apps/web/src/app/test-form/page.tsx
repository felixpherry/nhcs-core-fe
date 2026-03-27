import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { Badge } from '@/components/ui';

const employees = [
  {
    code: 'EMP001',
    name: 'John Doe',
    department: 'Engineering',
    position: 'Senior Engineer',
    status: 'active',
    joinDate: '2020-01-15',
  },
  {
    code: 'EMP002',
    name: 'Jane Smith',
    department: 'HR',
    position: 'HR Manager',
    status: 'active',
    joinDate: '2019-03-22',
  },
  {
    code: 'EMP003',
    name: 'Bob Wilson',
    department: 'Finance',
    position: 'Accountant',
    status: 'inactive',
    joinDate: '2021-07-10',
  },
  {
    code: 'EMP004',
    name: 'Alice Chen',
    department: 'Engineering',
    position: 'Tech Lead',
    status: 'active',
    joinDate: '2018-11-05',
  },
  {
    code: 'EMP005',
    name: 'David Kim',
    department: 'Marketing',
    position: 'Marketing Specialist',
    status: 'active',
    joinDate: '2022-02-28',
  },
  {
    code: 'EMP006',
    name: 'Sarah Lee',
    department: 'Engineering',
    position: 'Junior Developer',
    status: 'pending',
    joinDate: '2024-01-08',
  },
  {
    code: 'EMP007',
    name: 'Mike Brown',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'inactive',
    joinDate: '2017-06-14',
  },
];

const statusVariant = {
  active: 'success-soft',
  inactive: 'danger-soft',
  pending: 'warning-soft',
} as const;

export default function TestTablePage() {
  return (
    <div className="space-y-10 p-8">
      <h1 className="text-2xl font-semibold">Table — Design System Test</h1>

      <div>
        <h2 className="mb-3 text-lg font-medium">Employee List</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.code}>
                <TableCell className="font-mono">{emp.code}</TableCell>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>{emp.position}</TableCell>
                <TableCell>{emp.joinDate}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant[emp.status as keyof typeof statusVariant]}
                    size="sm"
                  >
                    {emp.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>Total Employees</TableCell>
              <TableCell>{employees.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">With Caption</h2>
        <Table>
          <TableCaption>A list of recent company groups.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-25">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead className="text-right">Companies</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono">GRP001</TableCell>
              <TableCell>Holding Company A</TableCell>
              <TableCell>HCA</TableCell>
              <TableCell className="text-right">12</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">GRP002</TableCell>
              <TableCell>Subsidiary Group B</TableCell>
              <TableCell>SGB</TableCell>
              <TableCell className="text-right">5</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">GRP003</TableCell>
              <TableCell>Regional Division C</TableCell>
              <TableCell>RDC</TableCell>
              <TableCell className="text-right">8</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Empty State</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-sub">
                No results found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

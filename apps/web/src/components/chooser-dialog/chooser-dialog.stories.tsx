import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';

import { ChooserDialog } from './chooser-dialog';
import { useChooser } from '../../hooks/use-chooser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Test types ──

interface Employee {
  id: number;
  code: string;
  name: string;
  department: string;
  position: string;
  status: string;
}

interface EmployeeFormValue {
  id: number;
  code: string;
  name: string;
}

// ── Mock data ──

const employees: Employee[] = [
  {
    id: 1,
    code: 'EMP-001',
    name: 'John Smith',
    department: 'Finance',
    position: 'Accountant',
    status: 'Active',
  },
  {
    id: 2,
    code: 'EMP-002',
    name: 'Jane Doe',
    department: 'HR',
    position: 'Recruiter',
    status: 'Active',
  },
  {
    id: 3,
    code: 'EMP-003',
    name: 'Bob Wilson',
    department: 'IT',
    position: 'Developer',
    status: 'Active',
  },
  {
    id: 4,
    code: 'EMP-004',
    name: 'Alice Brown',
    department: 'Finance',
    position: 'Treasurer',
    status: 'Inactive',
  },
  {
    id: 5,
    code: 'EMP-005',
    name: 'Charlie Lee',
    department: 'IT',
    position: 'DevOps',
    status: 'Active',
  },
  {
    id: 6,
    code: 'EMP-006',
    name: 'Diana Chen',
    department: 'HR',
    position: 'Payroll Specialist',
    status: 'Active',
  },
  {
    id: 7,
    code: 'EMP-007',
    name: 'Edward Kim',
    department: 'Operations',
    position: 'Manager',
    status: 'Active',
  },
  {
    id: 8,
    code: 'EMP-008',
    name: 'Fiona Garcia',
    department: 'Finance',
    position: 'Analyst',
    status: 'Inactive',
  },
];

// ── Inline DataTable for stories (no dependency on real DataTable) ──

function EmployeeTable({
  data,
  selection,
  toggleNode,
}: {
  data: Employee[];
  selection: ReturnType<typeof useChooser>['selection'];
  toggleNode: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((emp) => {
            const key = String(emp.id);
            const isSelected = selection.state.isSelected(key);

            return (
              <TableRow
                key={emp.id}
                data-state={isSelected ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => toggleNode(key)}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleNode(key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{emp.code}</TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>{emp.position}</TableCell>
                <TableCell>
                  <Badge variant={emp.status === 'Active' ? 'default' : 'secondary'}>
                    {emp.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Meta ──

const meta: Meta = {
  title: 'Dialog/ChooserDialog',
  parameters: { layout: 'padded' },
};

export default meta;

// ── Stories ──

export const SingleSelect: StoryObj = {
  name: 'Single Select',
  render: () => {
    const [selected, setSelected] = useState<EmployeeFormValue | null>(null);

    const chooser = useChooser<Employee, EmployeeFormValue>({
      mode: 'single',
      required: true,
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setSelected(result.selectedItems[0] ?? null);
      },
    });

    useEffect(() => {
      chooser.trackRows(employees);
    }, []);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => chooser.open(selected ? [String(selected.id)] : [])}>
            {selected ? `${selected.code} — ${selected.name}` : 'Choose Employee'}
          </Button>
          {selected && (
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Clear
            </Button>
          )}
        </div>

        {selected && (
          <pre className="rounded bg-muted p-2 text-xs">
            Selected: {JSON.stringify(selected, null, 2)}
          </pre>
        )}

        <ChooserDialog chooser={chooser} title="Choose Employee" description="Select one employee">
          <EmployeeTable
            data={employees}
            selection={chooser.selection}
            toggleNode={(key) => chooser.selection.toggleRow(key)}
          />
        </ChooserDialog>
      </div>
    );
  },
};

export const MultiSelect: StoryObj = {
  name: 'Multi Select',
  render: () => {
    const [selectedList, setSelectedList] = useState<EmployeeFormValue[]>([]);

    const chooser = useChooser<Employee, EmployeeFormValue>({
      mode: 'multi',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setSelectedList(result.selectedItems);
      },
    });

    useEffect(() => {
      chooser.trackRows(employees);
    }, []);

    return (
      <div className="space-y-4">
        <Button onClick={() => chooser.open(selectedList.map((s) => String(s.id)))}>
          Choose Employees ({selectedList.length})
        </Button>

        {selectedList.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedList.map((emp) => (
                <Badge key={emp.id} variant="default" className="gap-1">
                  {emp.code} — {emp.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
                    onClick={() => {
                      setSelectedList((prev) => prev.filter((e) => e.id !== emp.id));
                    }}
                  >
                    ×
                  </span>
                </Badge>
              ))}
            </div>
            <pre className="rounded bg-muted p-2 text-xs">
              Selected: {JSON.stringify(selectedList, null, 2)}
            </pre>
          </div>
        )}

        <ChooserDialog
          chooser={chooser}
          title="Choose Employees"
          description="Select one or more employees"
        >
          <EmployeeTable
            data={employees}
            selection={chooser.selection}
            toggleNode={(key) => chooser.selection.toggleRow(key)}
          />
        </ChooserDialog>
      </div>
    );
  },
};

export const Required: StoryObj = {
  name: 'Required — Disabled Confirm',
  render: () => {
    const chooser = useChooser<Employee, EmployeeFormValue>({
      mode: 'multi',
      required: true,
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        alert(`Confirmed: ${result.selectedItems.map((e) => e.name).join(', ')}`);
      },
    });

    useEffect(() => {
      chooser.trackRows(employees);
    }, []);

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Confirm button is disabled until at least 1 item is selected. Hover the disabled button to
          see the tooltip.
        </p>
        <Button onClick={() => chooser.open()}>Choose Employees (Required)</Button>

        <ChooserDialog
          chooser={chooser}
          title="Choose Employees"
          description="You must select at least one employee"
          requiredTooltip="Please select at least 1 employee"
        >
          <EmployeeTable
            data={employees}
            selection={chooser.selection}
            toggleNode={(key) => chooser.selection.toggleRow(key)}
          />
        </ChooserDialog>
      </div>
    );
  },
};

export const WithPreselection: StoryObj = {
  name: 'Edit Mode — Pre-selected Items',
  render: () => {
    const [selectedList, setSelectedList] = useState<EmployeeFormValue[]>([
      { id: 1, code: 'EMP-001', name: 'John Smith' },
      { id: 3, code: 'EMP-003', name: 'Bob Wilson' },
    ]);

    const chooser = useChooser<Employee, EmployeeFormValue>({
      mode: 'multi',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setSelectedList(result.selectedItems);
      },
    });

    useEffect(() => {
      chooser.trackRows(employees);
    }, []);

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Simulates edit mode — dialog opens with 2 items pre-selected. Cancel reverts to original
          selection.
        </p>

        <div className="flex items-center gap-4">
          <Button onClick={() => chooser.open(selectedList.map((s) => String(s.id)))}>
            Edit Selection ({selectedList.length})
          </Button>
        </div>

        {selectedList.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedList.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-sm">{emp.code}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <ChooserDialog chooser={chooser} title="Choose Employees">
          <EmployeeTable
            data={employees}
            selection={chooser.selection}
            toggleNode={(key) => chooser.selection.toggleRow(key)}
          />
        </ChooserDialog>
      </div>
    );
  },
};

export const CancelReverts: StoryObj = {
  name: 'Cancel Reverts Selection',
  render: () => {
    const [selectedList, setSelectedList] = useState<EmployeeFormValue[]>([
      { id: 2, code: 'EMP-002', name: 'Jane Doe' },
    ]);

    const chooser = useChooser<Employee, EmployeeFormValue>({
      mode: 'multi',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setSelectedList(result.selectedItems);
      },
    });

    useEffect(() => {
      chooser.trackRows(employees);
    }, []);

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Open the dialog, select/deselect items, then click Cancel. The selection reverts to Jane
          Doe only.
        </p>

        <Button onClick={() => chooser.open(selectedList.map((s) => String(s.id)))}>
          Choose Employees ({selectedList.length} selected)
        </Button>

        <div className="flex flex-wrap gap-1">
          {selectedList.map((emp) => (
            <Badge key={emp.id} variant="default">
              {emp.code} — {emp.name}
            </Badge>
          ))}
        </div>

        <ChooserDialog chooser={chooser} title="Choose Employees">
          <EmployeeTable
            data={employees}
            selection={chooser.selection}
            toggleNode={(key) => chooser.selection.toggleRow(key)}
          />
        </ChooserDialog>
      </div>
    );
  },
};

export const CustomLabels: StoryObj = {
  name: 'Custom Labels',
  render: () => {
    const chooser = useChooser<Employee, EmployeeFormValue>({
      mode: 'multi',
      required: true,
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        alert(`Selected: ${result.selectedItems.map((e) => e.name).join(', ')}`);
      },
    });

    useEffect(() => {
      chooser.trackRows(employees);
    }, []);

    return (
      <div className="space-y-4">
        <Button onClick={() => chooser.open()}>Pick Team Members</Button>

        <ChooserDialog
          chooser={chooser}
          title="Pick Team Members"
          description="Select the employees you want to add to this team"
          confirmLabel="Add to Team"
          cancelLabel="Discard"
          requiredTooltip="You need at least 1 team member"
        >
          <EmployeeTable
            data={employees}
            selection={chooser.selection}
            toggleNode={(key) => chooser.selection.toggleRow(key)}
          />
        </ChooserDialog>
      </div>
    );
  },
};

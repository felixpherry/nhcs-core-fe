'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/form';
import { Chooser } from '@/components/chooser';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox,
  Input,
} from '@/components/ui';
import type { ChooserContext } from '@/components/chooser';

// ── Mock data ──

interface CompanyGroupRow {
  companyGroupId: number;
  companyGroupCode: string;
  companyGroupName: string;
  address: string;
}

interface CompanyGroupValue {
  id: number;
  code: string;
  name: string;
}

const mockCompanyGroups: CompanyGroupRow[] = [
  {
    companyGroupId: 1,
    companyGroupCode: 'GRP001',
    companyGroupName: 'Holding Company A',
    address: 'Jakarta',
  },
  {
    companyGroupId: 2,
    companyGroupCode: 'GRP002',
    companyGroupName: 'Subsidiary Group B',
    address: 'Surabaya',
  },
  {
    companyGroupId: 3,
    companyGroupCode: 'GRP003',
    companyGroupName: 'Regional Division C',
    address: 'Bandung',
  },
  {
    companyGroupId: 4,
    companyGroupCode: 'GRP004',
    companyGroupName: 'Tech Division D',
    address: 'Yogyakarta',
  },
  {
    companyGroupId: 5,
    companyGroupCode: 'GRP005',
    companyGroupName: 'Finance Unit E',
    address: 'Medan',
  },
];

interface EmployeeRow {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
}

const mockEmployees: EmployeeRow[] = [
  {
    employeeId: 1,
    employeeCode: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    position: 'Senior Engineer',
  },
  {
    employeeId: 2,
    employeeCode: 'EMP002',
    employeeName: 'Jane Smith',
    department: 'HR',
    position: 'HR Manager',
  },
  {
    employeeId: 3,
    employeeCode: 'EMP003',
    employeeName: 'Bob Wilson',
    department: 'Finance',
    position: 'Accountant',
  },
  {
    employeeId: 4,
    employeeCode: 'EMP004',
    employeeName: 'Alice Chen',
    department: 'Engineering',
    position: 'Tech Lead',
  },
  {
    employeeId: 5,
    employeeCode: 'EMP005',
    employeeName: 'David Kim',
    department: 'Marketing',
    position: 'Specialist',
  },
  {
    employeeId: 6,
    employeeCode: 'EMP006',
    employeeName: 'Sarah Lee',
    department: 'Engineering',
    position: 'Junior Dev',
  },
];

// ── Reusable table for company groups inside chooser ──

function CompanyGroupChooserTable({
  isSelected,
  toggleRow,
}: {
  isSelected: (row: CompanyGroupRow) => boolean;
  toggleRow: (row: CompanyGroupRow) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = mockCompanyGroups.filter(
    (r) =>
      r.companyGroupCode.toLowerCase().includes(search.toLowerCase()) ||
      r.companyGroupName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search company groups..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-64 overflow-auto rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sub">
                  No results
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.companyGroupId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRow(row)}
                >
                  <TableCell>
                    <Checkbox checked={isSelected(row)} />
                  </TableCell>
                  <TableCell className="font-mono">{row.companyGroupCode}</TableCell>
                  <TableCell>{row.companyGroupName}</TableCell>
                  <TableCell>{row.address}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Reusable table for employees inside chooser ──

function EmployeeChooserTable({
  isSelected,
  toggleRow,
  toggleAll,
}: {
  isSelected: (row: EmployeeRow) => boolean;
  toggleRow: (row: EmployeeRow) => void;
  toggleAll: (rows: EmployeeRow[]) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = mockEmployees.filter(
    (r) =>
      r.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()),
  );

  const allSelected = filtered.length > 0 && filtered.every((r) => isSelected(r));

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search employees..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-64 overflow-auto rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={() => toggleAll(filtered)} />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sub">
                  No results
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.employeeId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRow(row)}
                >
                  <TableCell>
                    <Checkbox checked={isSelected(row)} />
                  </TableCell>
                  <TableCell className="font-mono">{row.employeeCode}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.position}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Form schema ──

const schema = z.object({
  companyCode: z.string().min(1, 'Required').max(30),
  companyGroup: z
    .object({ id: z.number(), code: z.string(), name: z.string() })
    .refine((v) => v.id > 0, { message: 'Company group is required' }),
});

// ── Page ──

export default function TestChooserPage() {
  // ── Standalone multi-select (no form) ──
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeRow[]>([]);

  // ── Form with ChooserField ──
  const form = useAppForm({
    defaultValues: {
      companyCode: '',
      companyGroup: { id: 0, code: '', name: '' } as CompanyGroupValue,
    },
    validators: {
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <div className="max-w-2xl space-y-12 p-8">
      <h1 className="text-2xl font-semibold">Chooser Test Page</h1>

      {/* ── Section 1: Standalone Chooser (multi-select, no form) ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">1. Standalone Chooser — Multi-select Employees</h2>
        <p className="text-sm text-sub">No form. Button trigger. Multi-select with select all.</p>

        <div className="flex items-center gap-3">
          <Button onClick={() => setEmployeeOpen(true)}>Select Employees</Button>
          <span className="text-sm text-sub">{selectedEmployees.length} selected</span>
        </div>

        {selectedEmployees.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedEmployees.map((e) => (
              <Badge key={e.employeeId} variant="primary-soft">
                {e.employeeCode} — {e.employeeName}
              </Badge>
            ))}
          </div>
        )}

        <Chooser
          open={employeeOpen}
          onOpenChange={setEmployeeOpen}
          title="Select Employees"
          description="Choose employees for training assignment"
          mode="multi"
          getRowId={(row: EmployeeRow) => String(row.employeeId)}
          initialSelectedIds={selectedEmployees.map((e) => String(e.employeeId))}
          onConfirm={(rows) => setSelectedEmployees(rows)}
        >
          {(ctx: ChooserContext<EmployeeRow>) => (
            <EmployeeChooserTable
              isSelected={ctx.isSelected}
              toggleRow={ctx.toggleRow}
              toggleAll={ctx.toggleAll}
            />
          )}
        </Chooser>
      </section>

      {/* ── Section 2: ChooserField inside a form ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">2. ChooserField — Company Group (form field)</h2>
        <p className="text-sm text-sub">
          Input + search + blur validation + dialog. Single-select.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.AppField name="companyCode">
            {(field) => (
              <field.InputField
                labelProps={{ children: 'Company Code' }}
                required
                placeholder="Enter code"
              />
            )}
          </form.AppField>

          <form.AppField name="companyGroup">
            {(field) => (
              <field.ChooserField<CompanyGroupRow, CompanyGroupValue>
                labelProps={{ children: 'Company Group' }}
                required
                placeholder="Type code or search..."
                dialogTitle="Select Company Group"
                dialogDescription="Search and select a company group"
                empty={{ id: 0, code: '', name: '' }}
                getDisplay={(v) => (v.code ? `${v.code} - ${v.name}` : '')}
                getRowId={(row) => String(row.companyGroupId)}
                getValueId={(v) => String(v.id)}
                transformToValue={(row) => ({
                  id: row.companyGroupId,
                  code: row.companyGroupCode,
                  name: row.companyGroupName,
                })}
                validateInput={async (text) => {
                  // Simulate API delay
                  await new Promise((r) => setTimeout(r, 500));
                  const found = mockCompanyGroups.find(
                    (g) => g.companyGroupCode.toLowerCase() === text.toLowerCase(),
                  );
                  if (!found) return null;
                  return {
                    id: found.companyGroupId,
                    code: found.companyGroupCode,
                    name: found.companyGroupName,
                  };
                }}
                invalidMessage="Company group code not found"
              >
                {(ctx) => (
                  <CompanyGroupChooserTable isSelected={ctx.isSelected} toggleRow={ctx.toggleRow} />
                )}
              </field.ChooserField>
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <pre className="rounded bg-muted p-3 text-xs">{JSON.stringify(values, null, 2)}</pre>
          )}
        </form.Subscribe>
      </section>

      {/* ── Section 3: ChooserField with pre-filled value (edit mode) ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">3. ChooserField — Edit Mode (pre-filled)</h2>
        <p className="text-sm text-sub">
          Simulates loading a record for editing. Company group is pre-filled.
        </p>
        <EditModeForm />
      </section>
    </div>
  );
}

// ── Separate component for edit mode to get its own form instance ──

function EditModeForm() {
  const form = useAppForm({
    defaultValues: {
      companyCode: 'CMP001',
      companyGroup: {
        id: 2,
        code: 'GRP002',
        name: 'Subsidiary Group B',
      } as CompanyGroupValue,
    },
    validators: {
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.AppField name="companyCode">
        {(field) => (
          <field.InputField
            labelProps={{ children: 'Company Code' }}
            required
            placeholder="Enter code"
          />
        )}
      </form.AppField>

      <form.AppField name="companyGroup">
        {(field) => (
          <field.ChooserField<CompanyGroupRow, CompanyGroupValue>
            labelProps={{ children: 'Company Group' }}
            required
            placeholder="Type code or search..."
            dialogTitle="Select Company Group"
            empty={{ id: 0, code: '', name: '' }}
            getDisplay={(v) => (v.code ? `${v.code} - ${v.name}` : '')}
            getRowId={(row) => String(row.companyGroupId)}
            getValueId={(v) => String(v.id)}
            transformToValue={(row) => ({
              id: row.companyGroupId,
              code: row.companyGroupCode,
              name: row.companyGroupName,
            })}
            validateInput={async (text) => {
              await new Promise((r) => setTimeout(r, 500));
              const found = mockCompanyGroups.find(
                (g) => g.companyGroupCode.toLowerCase() === text.toLowerCase(),
              );
              if (!found) return null;
              return {
                id: found.companyGroupId,
                code: found.companyGroupCode,
                name: found.companyGroupName,
              };
            }}
          >
            {(ctx) => (
              <CompanyGroupChooserTable isSelected={ctx.isSelected} toggleRow={ctx.toggleRow} />
            )}
          </field.ChooserField>
        )}
      </form.AppField>

      <Button type="submit" className="w-full">
        Update
      </Button>

      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <pre className="rounded bg-muted p-3 text-xs">{JSON.stringify(values, null, 2)}</pre>
        )}
      </form.Subscribe>
    </form>
  );
}

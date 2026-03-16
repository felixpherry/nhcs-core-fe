import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';

import { ChooserField } from './chooser-field';
import { useChooser } from '../../hooks/use-chooser';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// ── Types ──

interface OrgLevel {
  id: number;
  code: string;
  name: string;
  description: string;
}

interface OrgLevelFormValue {
  id: number;
  code: string;
  name: string;
}

// ── Mock data ──

const orgLevels: OrgLevel[] = [
  { id: 1, code: '10', name: 'Company', description: 'Top-level company entity' },
  { id: 2, code: '20', name: 'Division', description: 'Business division' },
  { id: 3, code: '30', name: 'Department', description: 'Functional department' },
  { id: 4, code: '40', name: 'Section', description: 'Section within department' },
  { id: 5, code: '50', name: 'Unit', description: 'Smallest organizational unit' },
];

// Simulates API call with delay
async function mockValidateCode(code: string): Promise<OrgLevelFormValue | null> {
  await new Promise((r) => setTimeout(r, 500));
  const matches = orgLevels.filter((o) => o.code === code);
  if (matches.length !== 1) return null;
  const row = matches[0]!;
  return { id: row.id, code: row.code, name: row.name };
}

// ── Inline table for stories ──

function OrgLevelTable({
  data,
  selection,
  trackRows,
}: {
  data: OrgLevel[];
  selection: ReturnType<typeof useChooser>['selection'];
  trackRows: (rows: OrgLevel[]) => void;
}) {
  useEffect(() => {
    trackRows(data);
  }, [data, trackRows]);

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const key = String(item.id);
            const isSelected = selection.state.isSelected(key);

            return (
              <TableRow
                key={item.id}
                data-state={isSelected ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => selection.toggleRow(key)}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => selection.toggleRow(key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="font-mono">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.description}</TableCell>
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
  title: 'Form/ChooserField',
  parameters: { layout: 'padded' },
};

export default meta;

// ── Stories ──

export const WithLabel: StoryObj = {
  name: 'With Code + Label',
  render: () => {
    const [value, setValue] = useState<OrgLevelFormValue | null>(null);

    const chooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      required: true,
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setValue(result.selectedItems[0] ?? null);
      },
    });

    useEffect(() => {
      chooser.trackRows(orgLevels);
    }, []);

    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          Type a code (10, 20, 30, 40, 50) and blur to auto-select. Or click the search icon to open
          the chooser dialog.
        </p>
        <ChooserField
          chooser={chooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getLabel={(item) => item.name}
          getKey={(item) => String(item.id)}
          value={value}
          onChange={setValue}
          label="Organization Level"
          required
          placeholder="Enter code"
          dialogTitle="Choose Organization Level"
          dialogDescription="Select an organization level"
        >
          <OrgLevelTable
            trackRows={chooser.trackRows}
            data={orgLevels}
            selection={chooser.selection}
          />
        </ChooserField>
        <pre className="rounded bg-muted p-2 text-xs">value: {JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const WithoutLabel: StoryObj = {
  name: 'Without Label (Code Only, Full Width)',
  render: () => {
    const [value, setValue] = useState<OrgLevelFormValue | null>(null);

    const chooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setValue(result.selectedItems[0] ?? null);
      },
    });

    useEffect(() => {
      chooser.trackRows(orgLevels);
    }, []);

    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          No getLabel prop — code input takes full width. No right-side label.
        </p>
        <ChooserField
          chooser={chooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getKey={(item) => String(item.id)}
          value={value}
          onChange={setValue}
          label="Organization Level"
          placeholder="Enter code"
          dialogTitle="Choose Organization Level"
        >
          <OrgLevelTable
            trackRows={chooser.trackRows}
            data={orgLevels}
            selection={chooser.selection}
          />
        </ChooserField>
        <pre className="rounded bg-muted p-2 text-xs">value: {JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const WithInitialValue: StoryObj = {
  name: 'Pre-filled (Edit Mode)',
  render: () => {
    const [value, setValue] = useState<OrgLevelFormValue | null>({
      id: 2,
      code: '20',
      name: 'Division',
    });

    const chooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      required: true,
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setValue(result.selectedItems[0] ?? null);
      },
    });

    useEffect(() => {
      chooser.trackRows(orgLevels);
    }, []);

    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          Starts with "20 — Division" pre-filled. Clear the code and blur — it restores because
          required.
        </p>
        <ChooserField
          chooser={chooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getLabel={(item) => item.name}
          getKey={(item) => String(item.id)}
          value={value}
          onChange={setValue}
          label="Organization Level"
          required
          placeholder="Enter code"
          dialogTitle="Choose Organization Level"
        >
          <OrgLevelTable
            trackRows={chooser.trackRows}
            data={orgLevels}
            selection={chooser.selection}
          />
        </ChooserField>
        <pre className="rounded bg-muted p-2 text-xs">value: {JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const InvalidCode: StoryObj = {
  name: 'Invalid Code Error',
  render: () => {
    const [value, setValue] = useState<OrgLevelFormValue | null>(null);

    const chooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setValue(result.selectedItems[0] ?? null);
      },
    });

    useEffect(() => {
      chooser.trackRows(orgLevels);
    }, []);

    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          Type "99" or "abc" and blur — shows "Code is invalid". Type "30" and blur — auto-selects
          "Department".
        </p>
        <ChooserField
          chooser={chooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getLabel={(item) => item.name}
          getKey={(item) => String(item.id)}
          value={value}
          onChange={setValue}
          label="Organization Level"
          placeholder="Try 99 or abc"
          dialogTitle="Choose Organization Level"
        >
          <OrgLevelTable
            trackRows={chooser.trackRows}
            data={orgLevels}
            selection={chooser.selection}
          />
        </ChooserField>
        <pre className="rounded bg-muted p-2 text-xs">value: {JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const Disabled: StoryObj = {
  name: 'Disabled State',
  render: () => {
    const chooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
    });

    return (
      <div className="max-w-lg">
        <ChooserField
          chooser={chooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getLabel={(item) => item.name}
          getKey={(item) => String(item.id)}
          value={{ id: 3, code: '30', name: 'Department' }}
          onChange={() => {}}
          label="Organization Level"
          disabled
          placeholder="Enter code"
          dialogTitle="Choose Organization Level"
        >
          <div />
        </ChooserField>
      </div>
    );
  },
};

export const MultipleFields: StoryObj = {
  name: 'Multiple ChooserFields in a Form',
  render: () => {
    const [orgLevel, setOrgLevel] = useState<OrgLevelFormValue | null>(null);
    const [parent, setParent] = useState<OrgLevelFormValue | null>(null);

    const orgLevelChooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      required: true,
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setOrgLevel(result.selectedItems[0] ?? null);
      },
    });

    const parentChooser = useChooser<OrgLevel, OrgLevelFormValue>({
      mode: 'single',
      rowKey: (row) => String(row.id),
      mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
      onConfirm: (result) => {
        setParent(result.selectedItems[0] ?? null);
      },
    });

    useEffect(() => {
      orgLevelChooser.trackRows(orgLevels);
      parentChooser.trackRows(orgLevels);
    }, []);

    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          Two ChooserFields in the same form — each with independent state.
        </p>

        <ChooserField
          chooser={orgLevelChooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getLabel={(item) => item.name}
          getKey={(item) => String(item.id)}
          value={orgLevel}
          onChange={setOrgLevel}
          label="Organization Level"
          required
          placeholder="Enter code"
          dialogTitle="Choose Organization Level"
        >
          <OrgLevelTable
            trackRows={orgLevelChooser.trackRows}
            data={orgLevels}
            selection={orgLevelChooser.selection}
          />
        </ChooserField>

        <ChooserField
          chooser={parentChooser}
          validateCode={mockValidateCode}
          getCode={(item) => item.code}
          getLabel={(item) => item.name}
          getKey={(item) => String(item.id)}
          value={parent}
          onChange={setParent}
          label="Parent"
          placeholder="Enter code"
          dialogTitle="Choose Parent Organization"
        >
          <OrgLevelTable
            trackRows={parentChooser.trackRows}
            data={orgLevels}
            selection={parentChooser.selection}
          />
        </ChooserField>

        <pre className="rounded bg-muted p-2 text-xs">
          {JSON.stringify({ orgLevel, parent }, null, 2)}
        </pre>
      </div>
    );
  },
};

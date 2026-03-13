import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { AsyncComboboxField } from './async-combobox-field';
import type { AsyncComboboxFieldConfig, FieldOption } from './types';

// ── Mock data ──

const mockCompanies: FieldOption[] = [
  { label: 'Acme Corporation', value: '1' },
  { label: 'Beta Industries', value: '2' },
  { label: 'Gamma Holdings', value: '3' },
  { label: 'Delta Technologies', value: '4' },
  { label: 'Epsilon Solutions', value: '5' },
  { label: 'Zeta Global', value: '6' },
  { label: 'Theta Partners', value: '7' },
  { label: 'Iota Systems', value: '8' },
];

const mockQueryFn = async ({ search }: { search: string }) => {
  await new Promise((r) => setTimeout(r, 500));
  if (!search) return mockCompanies;
  return mockCompanies.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
};

// ── QueryClient wrapper ──

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function WithQueryClient({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// ── Wrapper with state ──

type TestForm = Record<string, unknown>;

function AsyncComboboxStory(props: {
  config: AsyncComboboxFieldConfig<TestForm>;
  initialValue?: unknown;
}) {
  const [value, setValue] = useState<unknown>(
    props.initialValue ?? (props.config.mode === 'multi' ? [] : ''),
  );

  return (
    <WithQueryClient>
      <div className="max-w-sm space-y-2">
        <AsyncComboboxField
          config={props.config}
          value={value}
          onChange={setValue}
          onBlur={() => {}}
          disabled={false}
          readOnly={false}
          hasError={false}
        />
        <pre className="mt-4 rounded bg-muted p-2 text-xs">
          value: {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </WithQueryClient>
  );
}

// ── Meta ──

const meta: Meta = {
  title: 'Form/AsyncComboboxField',
  parameters: { layout: 'padded' },
};

export default meta;

// ── Stories ──

export const SingleMode: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'company',
        name: 'company',
        label: 'Company',
        type: 'async-combobox',
        placeholder: 'Select company...',
        queryFn: mockQueryFn,
      }}
    />
  ),
};

export const SingleWithInitialValue: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'company',
        name: 'company',
        label: 'Company',
        type: 'async-combobox',
        queryFn: mockQueryFn,
        initialOptions: { label: 'Zeta Global', value: '6' },
      }}
      initialValue="6"
    />
  ),
};

export const MultiCount: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'companies',
        name: 'companies',
        label: 'Companies',
        type: 'async-combobox',
        mode: 'multi',
        multiDisplayMode: 'count',
        showToggleAll: true,
        queryFn: mockQueryFn,
      }}
    />
  ),
};

export const MultiInlineChips: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'companies',
        name: 'companies',
        label: 'Companies',
        type: 'async-combobox',
        mode: 'multi',
        multiDisplayMode: 'inline-chips',
        showToggleAll: true,
        queryFn: mockQueryFn,
      }}
    />
  ),
};

export const MultiInlineChipsWithOverflow: StoryObj = {
  name: 'Multi Inline Chips — Expand/Collapse',
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'companies',
        name: 'companies',
        label: 'Companies (select 4+ to see expand)',
        type: 'async-combobox',
        mode: 'multi',
        multiDisplayMode: 'inline-chips',
        showToggleAll: true,
        queryFn: mockQueryFn,
        initialOptions: mockCompanies.slice(0, 6),
      }}
      initialValue={['1', '2', '3', '4', '5', '6']}
    />
  ),
};

export const MultiWithMaxSelections: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'companies',
        name: 'companies',
        label: 'Companies (max 3)',
        type: 'async-combobox',
        mode: 'multi',
        multiDisplayMode: 'inline-chips',
        maxSelections: 3,
        showToggleAll: true,
        queryFn: mockQueryFn,
      }}
    />
  ),
};

export const MultiWithInitialValues: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      config={{
        id: 'companies',
        name: 'companies',
        label: 'Companies',
        type: 'async-combobox',
        mode: 'multi',
        multiDisplayMode: 'inline-chips',
        queryFn: mockQueryFn,
        initialOptions: [
          { label: 'Acme Corporation', value: '1' },
          { label: 'Delta Technologies', value: '4' },
        ],
      }}
      initialValue={['1', '4']}
    />
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <WithQueryClient>
      <div className="max-w-sm">
        <AsyncComboboxField
          config={{
            id: 'company',
            name: 'company',
            label: 'Company',
            type: 'async-combobox',
            placeholder: 'Select company...',
            queryFn: mockQueryFn,
          }}
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          disabled={true}
          readOnly={false}
          hasError={false}
        />
      </div>
    </WithQueryClient>
  ),
};

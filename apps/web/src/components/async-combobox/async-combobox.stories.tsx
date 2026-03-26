import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { AsyncCombobox, type ComboboxOption } from './async-combobox';

// ── Mock data ──

const mockCompanies: ComboboxOption[] = [
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

function AsyncComboboxStory(props: {
  id: string;
  label: string;
  mode?: 'single' | 'multi';
  multiDisplayMode?: 'count' | 'inline-chips';
  maxSelections?: number;
  showToggleAll?: boolean;
  placeholder?: string;
  initialOptions?: ComboboxOption | ComboboxOption[];
  initialValue?: string | string[];
  disabled?: boolean;
}) {
  const { mode = 'single', initialValue, ...rest } = props;

  const [value, setValue] = useState<string | string[]>(
    initialValue ?? (mode === 'multi' ? [] : ''),
  );

  return (
    <WithQueryClient>
      <div className="max-w-sm space-y-2">
        <AsyncCombobox
          {...rest}
          mode={mode}
          value={value}
          onChange={setValue}
          queryFn={mockQueryFn}
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
  title: 'Form/AsyncCombobox',
  parameters: { layout: 'padded' },
};

export default meta;

// ── Stories ──

export const SingleMode: StoryObj = {
  render: () => <AsyncComboboxStory id="company" label="Company" placeholder="Select company..." />,
};

export const SingleWithInitialValue: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      id="company"
      label="Company"
      initialOptions={{ label: 'Zeta Global', value: '6' }}
      initialValue="6"
    />
  ),
};

export const MultiCount: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      id="companies"
      label="Companies"
      mode="multi"
      multiDisplayMode="count"
      showToggleAll
    />
  ),
};

export const MultiInlineChips: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      id="companies"
      label="Companies"
      mode="multi"
      multiDisplayMode="inline-chips"
      showToggleAll
    />
  ),
};

export const MultiWithMaxSelections: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      id="companies"
      label="Companies (max 3)"
      mode="multi"
      multiDisplayMode="inline-chips"
      maxSelections={3}
      showToggleAll
    />
  ),
};

export const MultiWithInitialValues: StoryObj = {
  render: () => (
    <AsyncComboboxStory
      id="companies"
      label="Companies"
      mode="multi"
      multiDisplayMode="inline-chips"
      initialOptions={[
        { label: 'Acme Corporation', value: '1' },
        { label: 'Delta Technologies', value: '4' },
      ]}
      initialValue={['1', '4']}
    />
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <WithQueryClient>
      <div className="max-w-sm">
        <AsyncCombobox
          id="company"
          label="Company"
          placeholder="Select company..."
          value=""
          onChange={() => {}}
          queryFn={mockQueryFn}
          disabled
        />
      </div>
    </WithQueryClient>
  ),
};

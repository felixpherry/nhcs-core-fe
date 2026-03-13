import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AsyncComboboxField } from './async-combobox-field';
import type { AsyncComboboxFieldConfig } from './types';

// ── Test types ──

type TestForm = {
  company: string;
  skills: string[];
  department: string;
};

// ── Test data ──

const mockOptions = [
  { label: 'Acme Corp', value: '1' },
  { label: 'Beta Inc', value: '2' },
  { label: 'Gamma LLC', value: '3' },
  { label: 'Delta Co', value: '4' },
  { label: 'Epsilon Ltd', value: '5' },
];

// ── Helpers ──

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function createConfig(
  overrides: Partial<AsyncComboboxFieldConfig<TestForm>> = {},
): AsyncComboboxFieldConfig<TestForm> {
  return {
    id: 'company',
    name: 'company',
    label: 'Company',
    type: 'async-combobox',
    queryFn: vi.fn().mockResolvedValue(mockOptions),
    debounceMs: 0,
    ...overrides,
  };
}

function defaultProps() {
  return {
    value: '',
    onChange: vi.fn(),
    onBlur: vi.fn(),
    disabled: false,
    readOnly: false,
    hasError: false,
  };
}

// ── Tests ──

describe('AsyncComboboxField', () => {
  const user = userEvent.setup();

  async function openAndWaitForOptions() {
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  }

  // ────────────────────────────────────────
  // Single mode
  // ────────────────────────────────────────

  describe('single mode', () => {
    it('renders placeholder when no value', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ placeholder: 'Select company...' })}
          {...defaultProps()}
        />,
      );

      expect(screen.getByText('Select company...')).toBeInTheDocument();
    });

    it('renders default placeholder when none provided', () => {
      renderWithQuery(<AsyncComboboxField config={createConfig()} {...defaultProps()} />);

      expect(screen.getByText('Select...')).toBeInTheDocument();
    });

    it('opens popover and shows options on click', async () => {
      renderWithQuery(<AsyncComboboxField config={createConfig()} {...defaultProps()} />);

      await openAndWaitForOptions();

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma LLC')).toBeInTheDocument();
    });

    it('calls onChange with string value on select', async () => {
      const props = defaultProps();

      renderWithQuery(<AsyncComboboxField config={createConfig()} {...props} />);

      await openAndWaitForOptions();
      await user.click(screen.getByText('Beta Inc'));

      expect(props.onChange).toHaveBeenCalledWith('2');
    });

    it('shows selected label from initialOptions before fetch', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            initialOptions: { label: 'Zeta Holdings', value: '99' },
          })}
          {...defaultProps()}
          value="99"
        />,
      );

      expect(screen.getByText('Zeta Holdings')).toBeInTheDocument();
    });

    it('disables trigger when disabled', () => {
      renderWithQuery(
        <AsyncComboboxField config={createConfig()} {...defaultProps()} disabled={true} />,
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('disables trigger when readOnly', () => {
      renderWithQuery(
        <AsyncComboboxField config={createConfig()} {...defaultProps()} readOnly={true} />,
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  // ────────────────────────────────────────
  // Multi mode — count display
  // ────────────────────────────────────────

  describe('multi mode — count display', () => {
    it('shows count summary when items selected', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'count',
            initialOptions: mockOptions.slice(0, 3),
          })}
          {...defaultProps()}
          value={['1', '2', '3']}
        />,
      );

      expect(screen.getByText('3 items selected')).toBeInTheDocument();
    });

    it('shows singular "item" for single selection', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'count',
            initialOptions: [mockOptions[0]!],
          })}
          {...defaultProps()}
          value={['1']}
        />,
      );

      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('calls onChange with string[] on multi select', async () => {
      const props = defaultProps();

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', multiDisplayMode: 'count' })}
          {...props}
        />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Acme Corp'));

      expect(props.onChange).toHaveBeenCalledWith(['1']);
    });

    it('keeps popover open after multi select', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', multiDisplayMode: 'count' })}
          {...defaultProps()}
        />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Acme Corp'));

      await waitFor(() => {
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────
  // Multi mode — inline-chips display
  // ────────────────────────────────────────

  describe('multi mode — inline-chips display', () => {
    it('renders badges for selected items', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: mockOptions.slice(0, 2),
          })}
          {...defaultProps()}
          value={['1', '2']}
        />,
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    });

    it('shows overflow count when more than 3 items selected', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: mockOptions,
          })}
          {...defaultProps()}
          value={['1', '2', '3', '4', '5']}
        />,
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma LLC')).toBeInTheDocument();
      expect(screen.queryByText('Delta Co')).not.toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('renders remove buttons on chips', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: mockOptions.slice(0, 2),
          })}
          {...defaultProps()}
          value={['1', '2']}
        />,
      );

      expect(screen.getByLabelText('Remove Acme Corp')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Beta Inc')).toBeInTheDocument();
    });

    it('calls onChange when chip remove button clicked', async () => {
      const props = defaultProps();

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: mockOptions.slice(0, 2),
          })}
          {...props}
          value={['1', '2']}
        />,
      );

      await user.click(screen.getByLabelText('Remove Acme Corp'));

      expect(props.onChange).toHaveBeenCalledWith(['2']);
    });

    it('expands all chips when "+N more" is clicked', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: mockOptions,
          })}
          {...defaultProps()}
          value={['1', '2', '3', '4', '5']}
        />,
      );

      await user.click(screen.getByText('+2 more'));

      expect(screen.getByText('Delta Co')).toBeInTheDocument();
      expect(screen.getByText('Epsilon Ltd')).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('collapses back when "Show less" is clicked', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: mockOptions,
          })}
          {...defaultProps()}
          value={['1', '2', '3', '4', '5']}
        />,
      );

      await user.click(screen.getByText('+2 more'));
      await user.click(screen.getByText('Show less'));

      expect(screen.queryByText('Delta Co')).not.toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Initial options (cold-start label)
  // ────────────────────────────────────────

  describe('initialOptions', () => {
    it('resolves label from single initialOption', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            initialOptions: { label: 'Page 10 Company', value: '999' },
          })}
          {...defaultProps()}
          value="999"
        />,
      );

      expect(screen.getByText('Page 10 Company')).toBeInTheDocument();
    });

    it('resolves labels from multiple initialOptions in multi mode', () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            initialOptions: [
              { label: 'Skill A', value: 's1' },
              { label: 'Skill B', value: 's2' },
            ],
          })}
          {...defaultProps()}
          value={['s1', 's2']}
        />,
      );

      expect(screen.getByText('Skill A')).toBeInTheDocument();
      expect(screen.getByText('Skill B')).toBeInTheDocument();
    });

    it('falls back to raw value when no label available', () => {
      renderWithQuery(
        <AsyncComboboxField config={createConfig()} {...defaultProps()} value="unknown-id" />,
      );

      expect(screen.getByText('unknown-id')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Toggle all / Clear
  // ────────────────────────────────────────

  describe('toggle all', () => {
    it('does not show toggle all button when showToggleAll is false', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', showToggleAll: false })}
          {...defaultProps()}
        />,
      );

      await openAndWaitForOptions();

      expect(screen.queryByText('Select all')).not.toBeInTheDocument();
    });

    it('shows "Select all" button when showToggleAll is true', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', showToggleAll: true })}
          {...defaultProps()}
        />,
      );

      await openAndWaitForOptions();

      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('selects all visible options on "Select all" click', async () => {
      const props = defaultProps();

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', showToggleAll: true })}
          {...props}
        />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Select all'));

      expect(props.onChange).toHaveBeenCalledWith(
        expect.arrayContaining(['1', '2', '3', '4', '5']),
      );
    });

    it('shows "Clear" when all options are selected', async () => {
      const props = defaultProps();

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', showToggleAll: true })}
          {...props}
        />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Select all'));

      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
    });

    it('deselects all when "Clear" is clicked', async () => {
      const props = defaultProps();

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'multi', showToggleAll: true })}
          {...props}
        />,
      );

      await openAndWaitForOptions();
      // Select all first
      await user.click(screen.getByText('Select all'));
      // Then clear
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Clear'));

      expect(props.onChange).toHaveBeenLastCalledWith([]);
    });

    it('does not show toggle all in single mode', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({ mode: 'single', showToggleAll: true })}
          {...defaultProps()}
        />,
      );

      await openAndWaitForOptions();

      expect(screen.queryByText('Select all')).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // maxSelections
  // ────────────────────────────────────────

  describe('maxSelections', () => {
    it('disables remaining options when max reached', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            maxSelections: 2,
            initialOptions: mockOptions.slice(0, 2),
          })}
          {...defaultProps()}
          value={['1', '2']}
        />,
      );

      await openAndWaitForOptions();

      const gammaItem = screen.getByText('Gamma LLC').closest('[data-slot="command-item"]');
      expect(gammaItem).toHaveAttribute('data-disabled', 'true');
    });

    it('does not disable already-selected options at max', async () => {
      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            mode: 'multi',
            maxSelections: 2,
            initialOptions: mockOptions.slice(0, 2),
          })}
          {...defaultProps()}
          value={['1', '2']}
        />,
      );

      await openAndWaitForOptions();

      const acmeItem = screen.getByText('Acme Corp').closest('[data-slot="command-item"]');
      expect(acmeItem).not.toHaveAttribute('data-disabled', 'true');
    });
  });

  // ────────────────────────────────────────
  // Search / debounce
  // ────────────────────────────────────────

  describe('search and debounce', () => {
    it('calls queryFn with search term', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockOptions);

      renderWithQuery(
        <AsyncComboboxField config={createConfig({ queryFn })} {...defaultProps()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ search: '' }));
      });

      const searchInput = screen.getByPlaceholderText('Search company...');
      await user.type(searchInput, 'Acm');

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledWith(expect.objectContaining({ search: 'Acm' }));
      });
    });

    it('shows search input with correct placeholder', async () => {
      renderWithQuery(
        <AsyncComboboxField config={createConfig({ label: 'Organization' })} {...defaultProps()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByPlaceholderText('Search organization...')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Dependency gating
  // ────────────────────────────────────────

  describe('dependency gating', () => {
    it('does not fetch when isQueryEnabled returns false', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockOptions);

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            queryFn,
            dependsOn: ['company'],
            isQueryEnabled: (values) => !!values.company,
          })}
          {...defaultProps()}
          formValues={{ company: '', skills: [], department: '' }}
        />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await new Promise((r) => setTimeout(r, 100));
      expect(queryFn).not.toHaveBeenCalled();
    });

    it('fetches when isQueryEnabled returns true', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockOptions);

      renderWithQuery(
        <AsyncComboboxField
          config={createConfig({
            queryFn,
            dependsOn: ['company'],
            isQueryEnabled: (values) => !!values.company,
          })}
          {...defaultProps()}
          formValues={{ company: 'filled', skills: [], department: '' }}
        />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalled();
      });
    });
  });

  // ────────────────────────────────────────
  // Loading / empty states
  // ────────────────────────────────────────

  describe('loading and empty states', () => {
    it('shows "Loading..." while query is pending', async () => {
      const queryFn = vi.fn().mockReturnValue(new Promise(() => {}));

      renderWithQuery(
        <AsyncComboboxField config={createConfig({ queryFn })} {...defaultProps()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('shows "No results found." when query returns empty', async () => {
      const queryFn = vi.fn().mockResolvedValue([]);

      renderWithQuery(
        <AsyncComboboxField config={createConfig({ queryFn })} {...defaultProps()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────
  // Paginated response
  // ────────────────────────────────────────

  describe('paginated response', () => {
    it('handles PaginatedFieldOptions response shape', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        options: mockOptions.slice(0, 2),
        nextCursor: 'cursor-abc',
      });

      renderWithQuery(
        <AsyncComboboxField config={createConfig({ queryFn })} {...defaultProps()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────
  // Aria / accessibility
  // ────────────────────────────────────────

  describe('accessibility', () => {
    it('sets aria-expanded based on open state', async () => {
      renderWithQuery(<AsyncComboboxField config={createConfig()} {...defaultProps()} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets aria-invalid when hasError is true', () => {
      renderWithQuery(
        <AsyncComboboxField config={createConfig()} {...defaultProps()} hasError={true} />,
      );

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

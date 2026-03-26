import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AsyncCombobox, type AsyncComboboxProps } from './async-combobox';

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

function defaultProps(overrides: Partial<AsyncComboboxProps> = {}): AsyncComboboxProps {
  return {
    id: 'company',
    label: 'Company',
    value: '',
    onChange: vi.fn(),
    queryFn: vi.fn().mockResolvedValue(mockOptions),
    debounceMs: 0,
    ...overrides,
  };
}

// ── Tests ──

describe('AsyncCombobox', () => {
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
      renderWithQuery(<AsyncCombobox {...defaultProps({ placeholder: 'Select company...' })} />);

      expect(screen.getByText('Select company...')).toBeInTheDocument();
    });

    it('renders default placeholder when none provided', () => {
      renderWithQuery(<AsyncCombobox {...defaultProps()} />);

      expect(screen.getByText('Select...')).toBeInTheDocument();
    });

    it('opens popover and shows options on click', async () => {
      renderWithQuery(<AsyncCombobox {...defaultProps()} />);

      await openAndWaitForOptions();

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma LLC')).toBeInTheDocument();
    });

    it('calls onChange with string value on select', async () => {
      const onChange = vi.fn();

      renderWithQuery(<AsyncCombobox {...defaultProps({ onChange })} />);

      await openAndWaitForOptions();
      await user.click(screen.getByText('Beta Inc'));

      expect(onChange).toHaveBeenCalledWith('2');
    });

    it('shows selected label from initialOptions before fetch', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            value: '99',
            initialOptions: { label: 'Zeta Holdings', value: '99' },
          })}
        />,
      );

      expect(screen.getByText('Zeta Holdings')).toBeInTheDocument();
    });

    it('disables trigger when disabled', () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ disabled: true })} />);

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  // ────────────────────────────────────────
  // Multi mode — count display
  // ────────────────────────────────────────

  describe('multi mode — count display', () => {
    it('shows count summary when items selected', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'count',
            value: ['1', '2', '3'],
            initialOptions: mockOptions.slice(0, 3),
          })}
        />,
      );

      expect(screen.getByText('3 items selected')).toBeInTheDocument();
    });

    it('shows singular "item" for single selection', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'count',
            value: ['1'],
            initialOptions: [mockOptions[0]!],
          })}
        />,
      );

      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('calls onChange with string[] on multi select', async () => {
      const onChange = vi.fn();

      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'count',
            onChange,
          })}
        />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Acme Corp'));

      expect(onChange).toHaveBeenCalledWith(['1']);
    });

    it('keeps popover open after multi select', async () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'count',
          })}
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
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['1', '2'],
            initialOptions: mockOptions.slice(0, 2),
          })}
        />,
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('shows overflow when more than 1 item selected', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['1', '2', '3', '4', '5'],
            initialOptions: mockOptions,
          })}
        />,
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
      expect(screen.getByText('+4 more')).toBeInTheDocument();
    });

    it('renders remove button on visible chip', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['1', '2'],
            initialOptions: mockOptions.slice(0, 2),
          })}
        />,
      );

      expect(screen.getByLabelText('Remove Acme Corp')).toBeInTheDocument();
      expect(screen.queryByLabelText('Remove Beta Inc')).not.toBeInTheDocument();
    });

    it('calls onChange when chip remove button clicked', async () => {
      const onChange = vi.fn();

      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['1', '2'],
            initialOptions: mockOptions.slice(0, 2),
            onChange,
          })}
        />,
      );

      await user.click(screen.getByLabelText('Remove Acme Corp'));

      expect(onChange).toHaveBeenCalledWith(['2']);
    });

    it('expands all chips when "+N more" is clicked', async () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['1', '2', '3', '4', '5'],
            initialOptions: mockOptions,
          })}
        />,
      );

      await user.click(screen.getByText('+4 more'));

      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      expect(screen.getByText('Gamma LLC')).toBeInTheDocument();
      expect(screen.getByText('Delta Co')).toBeInTheDocument();
      expect(screen.getByText('Epsilon Ltd')).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('collapses back when "Show less" is clicked', async () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['1', '2', '3', '4', '5'],
            initialOptions: mockOptions,
          })}
        />,
      );

      await user.click(screen.getByText('+4 more'));
      await user.click(screen.getByText('Show less'));

      expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
      expect(screen.getByText('+4 more')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Initial options (cold-start label)
  // ────────────────────────────────────────

  describe('initialOptions', () => {
    it('resolves label from single initialOption', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            value: '999',
            initialOptions: { label: 'Page 10 Company', value: '999' },
          })}
        />,
      );

      expect(screen.getByText('Page 10 Company')).toBeInTheDocument();
    });

    it('resolves labels from multiple initialOptions in multi mode', () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            multiDisplayMode: 'inline-chips',
            value: ['s1', 's2'],
            initialOptions: [
              { label: 'Skill A', value: 's1' },
              { label: 'Skill B', value: 's2' },
            ],
          })}
        />,
      );

      expect(screen.getByText('Skill A')).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('falls back to raw value when no label available', () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ value: 'unknown-id' })} />);

      expect(screen.getByText('unknown-id')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Toggle all / Clear
  // ────────────────────────────────────────

  describe('toggle all', () => {
    it('does not show toggle all button when showToggleAll is false', async () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ mode: 'multi', showToggleAll: false })} />);

      await openAndWaitForOptions();

      expect(screen.queryByText('Select all')).not.toBeInTheDocument();
    });

    it('shows "Select all" button when showToggleAll is true', async () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ mode: 'multi', showToggleAll: true })} />);

      await openAndWaitForOptions();

      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('selects all visible options on "Select all" click', async () => {
      const onChange = vi.fn();

      renderWithQuery(
        <AsyncCombobox {...defaultProps({ mode: 'multi', showToggleAll: true, onChange })} />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Select all'));

      expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['1', '2', '3', '4', '5']));
    });

    it('shows "Clear" when all options are selected', async () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ mode: 'multi', showToggleAll: true })} />);

      await openAndWaitForOptions();
      await user.click(screen.getByText('Select all'));

      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
    });

    it('deselects all when "Clear" is clicked', async () => {
      const onChange = vi.fn();

      renderWithQuery(
        <AsyncCombobox {...defaultProps({ mode: 'multi', showToggleAll: true, onChange })} />,
      );

      await openAndWaitForOptions();
      await user.click(screen.getByText('Select all'));

      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Clear'));

      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('does not show toggle all in single mode', async () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ mode: 'single', showToggleAll: true })} />);

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
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            maxSelections: 2,
            value: ['1', '2'],
            initialOptions: mockOptions.slice(0, 2),
          })}
        />,
      );

      await openAndWaitForOptions();

      const gammaItem = screen.getByText('Gamma LLC').closest('[data-slot="command-item"]');
      expect(gammaItem).toHaveAttribute('data-disabled', 'true');
    });

    it('does not disable already-selected options at max', async () => {
      renderWithQuery(
        <AsyncCombobox
          {...defaultProps({
            mode: 'multi',
            maxSelections: 2,
            value: ['1', '2'],
            initialOptions: mockOptions.slice(0, 2),
          })}
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

      renderWithQuery(<AsyncCombobox {...defaultProps({ queryFn })} />);

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
      renderWithQuery(<AsyncCombobox {...defaultProps({ label: 'Organization' })} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByPlaceholderText('Search organization...')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Query key deps (replaces dependency gating)
  // ────────────────────────────────────────

  describe('queryKeyDeps', () => {
    it('uses queryKeyDeps in the cache key (refetches when deps change)', async () => {
      const queryFn = vi.fn().mockResolvedValue(mockOptions);

      const { rerender } = renderWithQuery(
        <AsyncCombobox {...defaultProps({ queryFn, queryKeyDeps: ['company-1'] })} />,
      );

      await openAndWaitForOptions();
      const callCount = queryFn.mock.calls.length;

      // Rerender with a different dep → should trigger a new query
      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <AsyncCombobox {...defaultProps({ queryFn, queryKeyDeps: ['company-2'] })} />
        </QueryClientProvider>,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(queryFn.mock.calls.length).toBeGreaterThan(callCount);
      });
    });
  });

  // ────────────────────────────────────────
  // Loading / empty states
  // ────────────────────────────────────────

  describe('loading and empty states', () => {
    it('shows "Loading..." while query is pending', async () => {
      const queryFn = vi.fn().mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      renderWithQuery(<AsyncCombobox {...defaultProps({ queryFn })} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('shows "No results found." when query returns empty', async () => {
      renderWithQuery(
        <AsyncCombobox {...defaultProps({ queryFn: vi.fn().mockResolvedValue([]) })} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────
  // aria-invalid
  // ────────────────────────────────────────

  describe('aria-invalid', () => {
    it('sets aria-invalid on the trigger when true', () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ 'aria-invalid': true })} />);

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when false', () => {
      renderWithQuery(<AsyncCombobox {...defaultProps({ 'aria-invalid': false })} />);

      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  // ────────────────────────────────────────
  // onBlur
  // ────────────────────────────────────────

  describe('onBlur', () => {
    it('calls onBlur when trigger is clicked', async () => {
      const onBlur = vi.fn();

      renderWithQuery(<AsyncCombobox {...defaultProps({ onBlur })} />);

      await user.click(screen.getByRole('combobox'));

      expect(onBlur).toHaveBeenCalled();
    });
  });
});

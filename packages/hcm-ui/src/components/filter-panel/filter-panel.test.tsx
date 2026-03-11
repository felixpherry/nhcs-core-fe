import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import {
  FilterPanel,
  FilterPanelFields,
  FilterPanelActions,
  FilterPanelFieldToggle,
} from './filter-panel';
import { useFilter } from '../../hooks/use-filter';
import { useFieldVisibility } from '../../hooks/use-field-visibility';
import type { FormFieldConfig } from '../form-field/types';

// ── Test types ──

interface TestFilter {
  code: string;
  name: string;
  status: string;
}

// ── Shared fixtures ──

const DEFAULT_VALUES: TestFilter = {
  code: '',
  name: '',
  status: '',
};

const FILTER_FIELDS: FormFieldConfig<TestFilter>[] = [
  { id: 'code', name: 'code', type: 'text', label: 'Code' },
  { id: 'name', name: 'name', type: 'text', label: 'Name' },
  { id: 'status', name: 'status', type: 'select', label: 'Status', options: [
    { label: 'Active', value: 'T' },
    { label: 'Inactive', value: 'F' },
  ]},
];

const ALL_FIELD_IDS = ['code', 'name', 'status'];

// ── Test helper ──

/**
 * Renders the full FilterPanel with real hooks (integration style).
 * Returns the hook results so tests can inspect and drive state changes.
 */
function renderFilterPanel(options?: {
  defaultVisibleFieldIds?: string[];
  fields?: FormFieldConfig<TestFilter>[];
}) {
  const fields = options?.fields ?? FILTER_FIELDS;

  const hookResult = renderHook(() => {
    const filter = useFilter<TestFilter>({ defaultValues: DEFAULT_VALUES });
    const visibility = useFieldVisibility({
      scopeKey: 'test-filter',
      allFieldIds: ALL_FIELD_IDS,
      defaultVisibleFieldIds: options?.defaultVisibleFieldIds,
    });
    return { filter, visibility };
  });

  const { filter, visibility } = hookResult.result.current;

  const renderResult = render(
    <FilterPanel fields={fields} filter={filter} visibility={visibility}>
      <div className="flex items-center justify-between">
        <FilterPanelFieldToggle />
        <FilterPanelActions />
      </div>
      <FilterPanelFields />
    </FilterPanel>,
  );

  return { hookResult, renderResult };
}

// ── Tests ──

describe('FilterPanel', () => {
  describe('rendering', () => {
    it('renders the root wrapper with children', () => {
      renderFilterPanel();

      expect(screen.getByText('Add Filter')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('renders all filter fields when all are visible', () => {
      renderFilterPanel();

      expect(screen.getByLabelText('Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('throws when sub-component used outside FilterPanel', () => {
      // Suppress console.error for expected error
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<FilterPanelFields />)).toThrow(
        'FilterPanel sub-components must be used within <FilterPanel>',
      );
      expect(() => render(<FilterPanelActions />)).toThrow(
        'FilterPanel sub-components must be used within <FilterPanel>',
      );
      expect(() => render(<FilterPanelFieldToggle />)).toThrow(
        'FilterPanel sub-components must be used within <FilterPanel>',
      );

      spy.mockRestore();
    });
  });
});

describe('FilterPanelFields', () => {
  it('renders only visible fields', () => {
    renderFilterPanel({ defaultVisibleFieldIds: ['code', 'name'] });

    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument();
  });

  it('shows empty message when no fields are visible', () => {
    renderFilterPanel({ defaultVisibleFieldIds: [] });

    expect(
      screen.getByText('No filters visible. Use the field toggle to add filters.'),
    ).toBeInTheDocument();
  });

  it('binds field values to filter.draft', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    const codeInput = screen.getByLabelText('Code');
    await user.type(codeInput, 'ACM');

    expect(codeInput).toHaveValue('ACM');
  });

  it('supports custom grid class', () => {
    const hookResult = renderHook(() => {
      const filter = useFilter<TestFilter>({ defaultValues: DEFAULT_VALUES });
      const visibility = useFieldVisibility({
        scopeKey: 'test-filter',
        allFieldIds: ALL_FIELD_IDS,
      });
      return { filter, visibility };
    });

    const { filter, visibility } = hookResult.result.current;

    render(
      <FilterPanel fields={FILTER_FIELDS} filter={filter} visibility={visibility}>
        <FilterPanelFields gridClassName="grid-cols-2" />
      </FilterPanel>,
    );

    const fieldsGrid = document.querySelector('[data-slot="filter-panel-fields"]');
    expect(fieldsGrid).toHaveClass('grid-cols-2');
  });
});

describe('FilterPanelActions', () => {
  it('Apply button is disabled when draft equals applied (not dirty)', () => {
    renderFilterPanel();

    expect(screen.getByText('Apply')).toBeDisabled();
  });

  it('Reset button is disabled when no filters are active', () => {
    renderFilterPanel();

    expect(screen.getByText('Reset')).toBeDisabled();
  });

  it('Apply button becomes enabled after editing a field', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.type(screen.getByLabelText('Code'), 'ACM');

    expect(screen.getByText('Apply')).toBeEnabled();
  });

  it('clicking Apply applies the draft and disables the button', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.type(screen.getByLabelText('Code'), 'ACM');
    expect(screen.getByText('Apply')).toBeEnabled();

    await user.click(screen.getByText('Apply'));

    // After apply, draft === applied, so Apply is disabled again
    expect(screen.getByText('Apply')).toBeDisabled();
  });

  it('clicking Apply shows active count badge', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.type(screen.getByLabelText('Code'), 'ACM');
    await user.click(screen.getByText('Apply'));

    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('1 active');
  });

  it('Reset clears applied filters and hides badge', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    // Apply a filter
    await user.type(screen.getByLabelText('Code'), 'ACM');
    await user.click(screen.getByText('Apply'));
    expect(screen.getByTestId('active-filter-count')).toBeInTheDocument();

    // Reset
    await user.click(screen.getByText('Reset'));

    expect(screen.queryByTestId('active-filter-count')).not.toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeDisabled();
    expect(screen.getByLabelText('Code')).toHaveValue('');
  });

  it('shows multiple active filters count', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.type(screen.getByLabelText('Code'), 'ACM');
    await user.type(screen.getByLabelText('Name'), 'Acme');
    await user.click(screen.getByText('Apply'));

    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('2 active');
  });

  it('supports custom button labels', () => {
    const hookResult = renderHook(() => {
      const filter = useFilter<TestFilter>({ defaultValues: DEFAULT_VALUES });
      const visibility = useFieldVisibility({
        scopeKey: 'test-filter',
        allFieldIds: ALL_FIELD_IDS,
      });
      return { filter, visibility };
    });

    const { filter, visibility } = hookResult.result.current;

    render(
      <FilterPanel fields={FILTER_FIELDS} filter={filter} visibility={visibility}>
        <FilterPanelActions applyLabel="Search" resetLabel="Clear All" />
      </FilterPanel>,
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });
});

describe('FilterPanelFieldToggle', () => {
  it('renders the toggle button', () => {
    renderFilterPanel();

    expect(screen.getByText('Add Filter')).toBeInTheDocument();
  });

  it('does not show visibility badge when all fields visible', () => {
    renderFilterPanel();

    // No "3/3" badge since all are visible
    const toggleButton = screen.getByText('Add Filter');
    expect(within(toggleButton).queryByText('3/3')).not.toBeInTheDocument();
  });

  it('shows visibility badge when some fields are hidden', () => {
    renderFilterPanel({ defaultVisibleFieldIds: ['code'] });

    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('opens field list on click', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.click(screen.getByText('Add Filter'));

    expect(screen.getByText('Toggle Filters')).toBeInTheDocument();
    expect(screen.getByText('Show All')).toBeInTheDocument();
    expect(screen.getByText('Hide All')).toBeInTheDocument();
  });

  it('closes field list on second click', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.click(screen.getByText('Add Filter'));
    expect(screen.getByText('Toggle Filters')).toBeInTheDocument();

    await user.click(screen.getByText('Add Filter'));
    expect(screen.queryByText('Toggle Filters')).not.toBeInTheDocument();
  });

  it('shows checkboxes for each field', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.click(screen.getByText('Add Filter'));

    // Each field should have a labeled checkbox
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('toggling a checkbox hides the corresponding filter field', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    // Verify Status filter field exists
    const statusField = screen.getByLabelText('Status');
    expect(statusField).toBeInTheDocument();

    // Open toggle panel
    await user.click(screen.getByText('Add Filter'));

    // Uncheck Status — the checkbox inside the toggle panel
    const toggleCheckbox = screen.getByRole('checkbox', { name: 'Status' });
    await user.click(toggleCheckbox);

    // Status filter field should be gone from the fields grid
    // But the checkbox label "Status" should still be in the toggle panel
    const statusFieldInGrid = document.querySelector('[data-slot="filter-panel-fields"]');
    expect(statusFieldInGrid).not.toHaveTextContent('Status');
  });

  it('Show All button shows all fields', async () => {
    const user = userEvent.setup();
    renderFilterPanel({ defaultVisibleFieldIds: ['code'] });

    // Only code field visible
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    // Open toggle panel and click Show All
    await user.click(screen.getByText('Add Filter'));
    await user.click(screen.getByText('Show All'));

    // All fields now visible
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    // Name should appear as a filter field
    expect(screen.getAllByLabelText('Name').length).toBeGreaterThanOrEqual(1);
  });

  it('Hide All button hides all fields', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    // Open toggle panel and click Hide All
    await user.click(screen.getByText('Add Filter'));
    await user.click(screen.getByText('Hide All'));

    // Empty message should appear
    expect(
      screen.getByText('No filters visible. Use the field toggle to add filters.'),
    ).toBeInTheDocument();
  });

  it('Show All is disabled when all fields are visible', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    await user.click(screen.getByText('Add Filter'));

    expect(screen.getByText('Show All')).toBeDisabled();
  });

  it('Hide All is disabled when no fields are visible', async () => {
    const user = userEvent.setup();
    renderFilterPanel({ defaultVisibleFieldIds: [] });

    await user.click(screen.getByText('Add Filter'));

    expect(screen.getByText('Hide All')).toBeDisabled();
  });

  it('supports custom label', () => {
    const hookResult = renderHook(() => {
      const filter = useFilter<TestFilter>({ defaultValues: DEFAULT_VALUES });
      const visibility = useFieldVisibility({
        scopeKey: 'test-filter',
        allFieldIds: ALL_FIELD_IDS,
      });
      return { filter, visibility };
    });

    const { filter, visibility } = hookResult.result.current;

    render(
      <FilterPanel fields={FILTER_FIELDS} filter={filter} visibility={visibility}>
        <FilterPanelFieldToggle label="Manage Filters" />
      </FilterPanel>,
    );

    expect(screen.getByText('Manage Filters')).toBeInTheDocument();
  });

  it('aria-expanded reflects open state', async () => {
    const user = userEvent.setup();
    renderFilterPanel();

    const button = screen.getByText('Add Filter');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});

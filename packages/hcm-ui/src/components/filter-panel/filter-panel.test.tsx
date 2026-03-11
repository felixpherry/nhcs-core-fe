import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  {
    id: 'status',
    name: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { label: 'Active', value: 'T' },
      { label: 'Inactive', value: 'F' },
    ],
  },
];

const ALL_FIELD_IDS = ['code', 'name', 'status'];

// ── Wrapper component (single React tree) ──

/**
 * Hooks MUST live inside the rendered component so state changes
 * propagate through React's reconciliation.
 */
function TestFilterPanel({
  defaultVisibleFieldIds,
  fields = FILTER_FIELDS,
  children,
}: {
  defaultVisibleFieldIds?: string[];
  fields?: FormFieldConfig<TestFilter>[];
  children?: (props: {
    filter: ReturnType<typeof useFilter<TestFilter>>;
    visibility: ReturnType<typeof useFieldVisibility>;
  }) => React.ReactNode;
}) {
  const filter = useFilter<TestFilter>({ defaultValues: DEFAULT_VALUES });
  const visibility = useFieldVisibility({
    scopeKey: 'test-filter',
    allFieldIds: ALL_FIELD_IDS,
    defaultVisibleFieldIds,
  });

  if (children) {
    return <>{children({ filter, visibility })}</>;
  }

  return (
    <FilterPanel fields={fields} filter={filter} visibility={visibility}>
      <div className="flex items-center justify-between">
        <FilterPanelFieldToggle />
        <FilterPanelActions />
      </div>
      <FilterPanelFields />
    </FilterPanel>
  );
}

// ── Helper: get the fields grid container ──

function getFieldsGrid() {
  return document.querySelector('[data-slot="filter-panel-fields"]');
}

function getToggleList() {
  return document.querySelector('[data-slot="filter-panel-field-toggle-list"]');
}

// ── Tests ──

describe('FilterPanel', () => {
  describe('rendering', () => {
    it('renders the root wrapper with children', () => {
      render(<TestFilterPanel />);

      expect(screen.getByText('Add Filter')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('renders all filter fields when all are visible', () => {
      render(<TestFilterPanel />);

      const fieldsGrid = getFieldsGrid()!;
      expect(within(fieldsGrid as HTMLElement).getByLabelText('Code')).toBeInTheDocument();
      expect(within(fieldsGrid as HTMLElement).getByLabelText('Name')).toBeInTheDocument();
      expect(within(fieldsGrid as HTMLElement).getByLabelText('Status')).toBeInTheDocument();
    });

    it('throws when sub-component used outside FilterPanel', () => {
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
    render(<TestFilterPanel defaultVisibleFieldIds={['code', 'name']} />);

    const fieldsGrid = getFieldsGrid()!;
    expect(within(fieldsGrid as HTMLElement).getByLabelText('Code')).toBeInTheDocument();
    expect(within(fieldsGrid as HTMLElement).getByLabelText('Name')).toBeInTheDocument();
    expect(within(fieldsGrid as HTMLElement).queryByLabelText('Status')).not.toBeInTheDocument();
  });

  it('shows empty message when no fields are visible', () => {
    render(<TestFilterPanel defaultVisibleFieldIds={[]} />);

    expect(
      screen.getByText('No filters visible. Use the field toggle to add filters.'),
    ).toBeInTheDocument();
  });

  it('binds field values to filter.draft', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const fieldsGrid = getFieldsGrid()!;
    const codeInput = within(fieldsGrid as HTMLElement).getByLabelText('Code');
    await user.type(codeInput, 'ACM');

    expect(codeInput).toHaveValue('ACM');
  });

  it('supports custom grid class', () => {
    render(
      <TestFilterPanel>
        {({ filter, visibility }) => (
          <FilterPanel fields={FILTER_FIELDS} filter={filter} visibility={visibility}>
            <FilterPanelFields gridClassName="grid-cols-2" />
          </FilterPanel>
        )}
      </TestFilterPanel>,
    );

    const fieldsGrid = getFieldsGrid();
    expect(fieldsGrid).toHaveClass('grid-cols-2');
  });
});

describe('FilterPanelActions', () => {
  it('Apply button is disabled when draft equals applied (not dirty)', () => {
    render(<TestFilterPanel />);

    expect(screen.getByText('Apply')).toBeDisabled();
  });

  it('Reset button is disabled when no filters are active', () => {
    render(<TestFilterPanel />);

    expect(screen.getByText('Reset')).toBeDisabled();
  });

  it('Apply button becomes enabled after editing a field', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const fieldsGrid = getFieldsGrid()!;
    await user.type(within(fieldsGrid as HTMLElement).getByLabelText('Code'), 'ACM');

    expect(screen.getByText('Apply')).toBeEnabled();
  });

  it('clicking Apply applies the draft and disables the button', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const fieldsGrid = getFieldsGrid()!;
    await user.type(within(fieldsGrid as HTMLElement).getByLabelText('Code'), 'ACM');
    expect(screen.getByText('Apply')).toBeEnabled();

    await user.click(screen.getByText('Apply'));

    // After apply, draft === applied, so Apply is disabled again
    expect(screen.getByText('Apply')).toBeDisabled();
  });

  it('clicking Apply shows active count badge', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const fieldsGrid = getFieldsGrid()!;
    await user.type(within(fieldsGrid as HTMLElement).getByLabelText('Code'), 'ACM');
    await user.click(screen.getByText('Apply'));

    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('1 active');
  });

  it('Reset clears applied filters and hides badge', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const fieldsGrid = getFieldsGrid()!;

    // Apply a filter
    await user.type(within(fieldsGrid as HTMLElement).getByLabelText('Code'), 'ACM');
    await user.click(screen.getByText('Apply'));
    expect(screen.getByTestId('active-filter-count')).toBeInTheDocument();

    // Reset
    await user.click(screen.getByText('Reset'));

    expect(screen.queryByTestId('active-filter-count')).not.toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeDisabled();
    expect(within(fieldsGrid as HTMLElement).getByLabelText('Code')).toHaveValue('');
  });

  it('shows multiple active filters count', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const fieldsGrid = getFieldsGrid()!;
    await user.type(within(fieldsGrid as HTMLElement).getByLabelText('Code'), 'ACM');
    await user.type(within(fieldsGrid as HTMLElement).getByLabelText('Name'), 'Acme');
    await user.click(screen.getByText('Apply'));

    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('2 active');
  });

  it('supports custom button labels', () => {
    render(
      <TestFilterPanel>
        {({ filter, visibility }) => (
          <FilterPanel fields={FILTER_FIELDS} filter={filter} visibility={visibility}>
            <FilterPanelActions applyLabel="Search" resetLabel="Clear All" />
          </FilterPanel>
        )}
      </TestFilterPanel>,
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });
});

describe('FilterPanelFieldToggle', () => {
  it('renders the toggle button', () => {
    render(<TestFilterPanel />);

    expect(screen.getByText('Add Filter')).toBeInTheDocument();
  });

  it('does not show visibility badge when all fields visible', () => {
    render(<TestFilterPanel />);

    // No "X/Y" badge since all are visible
    expect(screen.queryByText('3/3')).not.toBeInTheDocument();
  });

  it('shows visibility badge when some fields are hidden', () => {
    render(<TestFilterPanel defaultVisibleFieldIds={['code']} />);

    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('opens field list on click', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    await user.click(screen.getByText('Add Filter'));

    expect(screen.getByText('Toggle Filters')).toBeInTheDocument();
    expect(screen.getByText('Show All')).toBeInTheDocument();
    expect(screen.getByText('Hide All')).toBeInTheDocument();
  });

  it('closes field list on second click', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    await user.click(screen.getByText('Add Filter'));
    expect(screen.getByText('Toggle Filters')).toBeInTheDocument();

    await user.click(screen.getByText('Add Filter'));
    expect(screen.queryByText('Toggle Filters')).not.toBeInTheDocument();
  });

  it('shows checkboxes for each field in the toggle panel', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    await user.click(screen.getByText('Add Filter'));

    // Scope to the toggle list to avoid collisions with filter field labels
    const toggleList = getToggleList()!;
    const checkboxes = within(toggleList as HTMLElement).getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('toggling a checkbox hides the corresponding filter field', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    // Verify Status filter field exists in the grid
    const fieldsGrid = getFieldsGrid()!;
    expect(within(fieldsGrid as HTMLElement).getByLabelText('Status')).toBeInTheDocument();

    // Open toggle panel
    await user.click(screen.getByText('Add Filter'));

    // Find the Status checkbox in the toggle panel
    const toggleList = getToggleList()!;
    const statusCheckbox = within(toggleList as HTMLElement).getByLabelText('Status');
    await user.click(statusCheckbox);

    // Status filter field should be gone from the fields grid
    // Note: fieldsGrid reference may have changed, re-query
    const updatedFieldsGrid = getFieldsGrid()!;
    expect(
      within(updatedFieldsGrid as HTMLElement).queryByLabelText('Status'),
    ).not.toBeInTheDocument();
  });

  it('Show All button shows all fields', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel defaultVisibleFieldIds={['code']} />);

    // Only code field visible initially
    const fieldsGrid = getFieldsGrid()!;
    expect(within(fieldsGrid as HTMLElement).getByLabelText('Code')).toBeInTheDocument();
    expect(within(fieldsGrid as HTMLElement).queryByLabelText('Name')).not.toBeInTheDocument();

    // Open toggle panel and click Show All
    await user.click(screen.getByText('Add Filter'));
    await user.click(screen.getByText('Show All'));

    // All fields now visible — re-query the grid
    const updatedFieldsGrid = getFieldsGrid()!;
    expect(within(updatedFieldsGrid as HTMLElement).getByLabelText('Code')).toBeInTheDocument();
    expect(within(updatedFieldsGrid as HTMLElement).getByLabelText('Name')).toBeInTheDocument();
    expect(within(updatedFieldsGrid as HTMLElement).getByLabelText('Status')).toBeInTheDocument();
  });

  it('Hide All button hides all fields', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

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
    render(<TestFilterPanel />);

    await user.click(screen.getByText('Add Filter'));

    expect(screen.getByText('Show All')).toBeDisabled();
  });

  it('Hide All is disabled when no fields are visible', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel defaultVisibleFieldIds={[]} />);

    await user.click(screen.getByText('Add Filter'));

    expect(screen.getByText('Hide All')).toBeDisabled();
  });

  it('supports custom label', () => {
    render(
      <TestFilterPanel>
        {({ filter, visibility }) => (
          <FilterPanel fields={FILTER_FIELDS} filter={filter} visibility={visibility}>
            <FilterPanelFieldToggle label="Manage Filters" />
          </FilterPanel>
        )}
      </TestFilterPanel>,
    );

    expect(screen.getByText('Manage Filters')).toBeInTheDocument();
  });

  it('aria-expanded reflects open state', async () => {
    const user = userEvent.setup();
    render(<TestFilterPanel />);

    const button = screen.getByText('Add Filter');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});

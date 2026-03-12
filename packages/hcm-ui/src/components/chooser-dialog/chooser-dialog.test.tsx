import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChooserDialog } from './chooser-dialog';
import type { UseChooserReturn } from '../../hooks/use-chooser';
import type { SelectionState, UseSelectionReturn } from '../../hooks/use-selection';

// ── Mock chooser factory ──

function createMockSelectionState(overrides: Partial<SelectionState> = {}): SelectionState {
  return {
    selectedKeys: new Set<string>(),
    isSelected: (key: string) => overrides.selectedKeys?.has(key) ?? false,
    isAllSelected: () => false,
    isPartiallySelected: () => false,
    isEmpty: true,
    ...overrides,
  };
}

function createMockSelection(overrides: Partial<UseSelectionReturn> = {}): UseSelectionReturn {
  return {
    state: createMockSelectionState(),
    toggleRow: vi.fn(),
    toggleAll: vi.fn(),
    selectOnly: vi.fn(),
    clear: vi.fn(),
    selectKeys: vi.fn(),
    replaceSelection: vi.fn(),
    ...overrides,
  };
}

function createMockChooser(
  overrides: Partial<UseChooserReturn<unknown, unknown>> = {},
): UseChooserReturn<unknown, unknown> {
  return {
    isOpen: true,
    open: vi.fn(),
    cancel: vi.fn(),
    confirm: vi.fn().mockReturnValue(true),
    canConfirm: true,
    selection: createMockSelection(),
    trackRows: vi.fn(),
    remove: vi.fn(),
    result: null,
    ...overrides,
  };
}

// ── Tests ──

describe('ChooserDialog', () => {
  const user = userEvent.setup();

  // ────────────────────────────────────────
  // Rendering
  // ────────────────────────────────────────

  describe('rendering', () => {
    it('renders dialog when isOpen is true', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose Company">
          <div>Table content</div>
        </ChooserDialog>,
      );

      expect(screen.getByText('Choose Company')).toBeInTheDocument();
      expect(screen.getByText('Table content')).toBeInTheDocument();
    });

    it('does not render dialog when isOpen is false', () => {
      render(
        <ChooserDialog chooser={createMockChooser({ isOpen: false })} title="Choose Company">
          <div>Table content</div>
        </ChooserDialog>,
      );

      expect(screen.queryByText('Choose Company')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose Employee">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Choose Employee')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <ChooserDialog
          chooser={createMockChooser()}
          title="Choose Employee"
          description="Select one or more employees"
        >
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Select one or more employees')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose Employee">
          <div />
        </ChooserDialog>,
      );

      expect(screen.queryByText('Select one or more employees')).not.toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose">
          <table>
            <tbody>
              <tr>
                <td>Row data</td>
              </tr>
            </tbody>
          </table>
        </ChooserDialog>,
      );

      expect(screen.getByText('Row data')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Selection count
  // ────────────────────────────────────────

  describe('selection count', () => {
    it('shows selection count when items are selected', () => {
      const selectedKeys = new Set(['1', '2', '3']);
      const chooser = createMockChooser({
        selection: createMockSelection({
          state: createMockSelectionState({ selectedKeys, isEmpty: false }),
        }),
      });

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('3 items selected')).toBeInTheDocument();
    });

    it('shows singular "item" for single selection', () => {
      const selectedKeys = new Set(['1']);
      const chooser = createMockChooser({
        selection: createMockSelection({
          state: createMockSelectionState({ selectedKeys, isEmpty: false }),
        }),
      });

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('does not show count when nothing is selected', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose">
          <div />
        </ChooserDialog>,
      );

      expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Cancel button
  // ────────────────────────────────────────

  describe('cancel button', () => {
    it('renders cancel button with default label', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders cancel button with custom label', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose" cancelLabel="Discard">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    it('calls chooser.cancel on click', async () => {
      const chooser = createMockChooser();

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      await user.click(screen.getByText('Cancel'));

      expect(chooser.cancel).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────────────────
  // Confirm button — enabled
  // ────────────────────────────────────────

  describe('confirm button — enabled', () => {
    it('renders confirm button with default label', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('renders confirm button with custom label', () => {
      render(
        <ChooserDialog chooser={createMockChooser()} title="Choose" confirmLabel="Select">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('shows count in confirm button when items selected', () => {
      const selectedKeys = new Set(['1', '2']);
      const chooser = createMockChooser({
        selection: createMockSelection({
          state: createMockSelectionState({ selectedKeys, isEmpty: false }),
        }),
      });

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      expect(screen.getByText('Confirm (2)')).toBeInTheDocument();
    });

    it('calls chooser.confirm on click', async () => {
      const chooser = createMockChooser();

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      await user.click(screen.getByText('Confirm'));

      expect(chooser.confirm).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────────────────
  // Confirm button — disabled (required + empty)
  // ────────────────────────────────────────

  describe('confirm button — disabled', () => {
    it('renders disabled confirm button when canConfirm is false', () => {
      const chooser = createMockChooser({ canConfirm: false });

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeDisabled();
    });

    it('renders default tooltip text on disabled button', async () => {
      const chooser = createMockChooser({ canConfirm: false });

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      const wrapper = screen.getByRole('button', { name: 'Confirm' }).parentElement!;
      await user.hover(wrapper);

      const matches = await screen.findAllByText('Please select at least 1 item');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('renders custom tooltip text', async () => {
      const chooser = createMockChooser({ canConfirm: false });

      render(
        <ChooserDialog
          chooser={chooser}
          title="Choose"
          requiredTooltip="You must pick at least one"
        >
          <div />
        </ChooserDialog>,
      );

      const wrapper = screen.getByRole('button', { name: 'Confirm' }).parentElement!;
      await user.hover(wrapper);

      const matches = await screen.findAllByText('You must pick at least one');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ────────────────────────────────────────
  // Dialog dismiss behavior
  // ────────────────────────────────────────

  describe('dismiss behavior', () => {
    it('calls cancel when Escape is pressed', async () => {
      const chooser = createMockChooser();

      render(
        <ChooserDialog chooser={chooser} title="Choose">
          <div />
        </ChooserDialog>,
      );

      await user.keyboard('{Escape}');

      expect(chooser.cancel).toHaveBeenCalledTimes(1);
    });
  });
});

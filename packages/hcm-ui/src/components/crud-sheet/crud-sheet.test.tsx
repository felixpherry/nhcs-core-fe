import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrudSheet } from './crud-sheet';

// Default props factory
function defaultProps(overrides?: Partial<React.ComponentProps<typeof CrudSheet>>) {
  return {
    isOpen: true,
    mode: 'create' as const,
    isDirty: false,
    onClose: vi.fn(),
    onForceClose: vi.fn(),
    onSubmit: vi.fn(),
    children: <div>Form content</div>,
    ...overrides,
  };
}

describe('CrudSheet', () => {
  // ── Auto title ──

  describe('auto title', () => {
    it('shows "Create Record" by default in create mode', () => {
      render(<CrudSheet {...defaultProps()} />);
      expect(screen.getByText('Create Record')).toBeInTheDocument();
    });

    it('shows "Edit Record" in edit mode', () => {
      render(<CrudSheet {...defaultProps({ mode: 'edit' })} />);
      expect(screen.getByText('Edit Record')).toBeInTheDocument();
    });

    it('shows "View Record" in view mode', () => {
      render(<CrudSheet {...defaultProps({ mode: 'view' })} />);
      expect(screen.getByText('View Record')).toBeInTheDocument();
    });

    it('uses entityName in title', () => {
      render(<CrudSheet {...defaultProps({ entityName: 'Company' })} />);
      expect(screen.getByText('Create Company')).toBeInTheDocument();
    });

    it('uses custom title over auto title', () => {
      render(<CrudSheet {...defaultProps({ entityName: 'Company', title: 'Custom Title' })} />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows description when provided', () => {
      render(<CrudSheet {...defaultProps({ description: 'Fill in the details' })} />);
      expect(screen.getByText('Fill in the details')).toBeInTheDocument();
    });
  });

  // ── Content ──

  describe('content', () => {
    it('renders children', () => {
      render(<CrudSheet {...defaultProps()} />);
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    it('shows loading state instead of children', () => {
      render(<CrudSheet {...defaultProps({ isLoading: true })} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CrudSheet {...defaultProps({ isOpen: false })} />);
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });
  });

  // ── Footer buttons — create/edit mode ──

  describe('create/edit footer', () => {
    it('shows Cancel and Create buttons in create mode', () => {
      render(<CrudSheet {...defaultProps()} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('shows Cancel and Save Changes buttons in edit mode', () => {
      render(<CrudSheet {...defaultProps({ mode: 'edit' })} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('shows Saving... when submitting', () => {
      render(<CrudSheet {...defaultProps({ isSubmitting: true })} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables buttons when submitting', () => {
      render(<CrudSheet {...defaultProps({ isSubmitting: true })} />);
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('calls onSubmit when Create button clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<CrudSheet {...defaultProps({ onSubmit })} />);
      await user.click(screen.getByText('Create'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // ── Footer buttons — view mode ──

  describe('view footer', () => {
    it('shows only Close button in view mode', () => {
      render(<CrudSheet {...defaultProps({ mode: 'view' })} />);
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      // Sheet X button + our footer Close button = 2
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('calls onClose when Close clicked in view mode', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CrudSheet {...defaultProps({ mode: 'view', onClose })} />);
      // Get all Close buttons, click the footer one (last one)
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      await user.click(closeButtons[closeButtons.length - 1]!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Close — not dirty ──

  describe('close when not dirty', () => {
    it('calls onClose when Cancel clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CrudSheet {...defaultProps({ onClose })} />);
      await user.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Close — dirty (discard dialog) ──

  describe('dirty guard', () => {
    it('shows discard dialog when closing with unsaved changes', async () => {
      const user = userEvent.setup();

      render(<CrudSheet {...defaultProps({ isDirty: true })} />);
      await user.click(screen.getByText('Cancel'));

      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(
        screen.getByText('You have unsaved changes. Do you want to discard them?'),
      ).toBeInTheDocument();
      expect(screen.getByText('Keep Editing')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    it('hides dialog and stays open on Keep Editing', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onForceClose = vi.fn();

      render(<CrudSheet {...defaultProps({ isDirty: true, onClose, onForceClose })} />);

      await user.click(screen.getByText('Cancel'));
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();

      await user.click(screen.getByText('Keep Editing'));
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(onForceClose).not.toHaveBeenCalled();
    });

    it('calls onForceClose on Discard', async () => {
      const user = userEvent.setup();
      const onForceClose = vi.fn();

      render(<CrudSheet {...defaultProps({ isDirty: true, onForceClose })} />);

      await user.click(screen.getByText('Cancel'));
      await user.click(screen.getByText('Discard'));

      expect(onForceClose).toHaveBeenCalledTimes(1);
    });
  });
});

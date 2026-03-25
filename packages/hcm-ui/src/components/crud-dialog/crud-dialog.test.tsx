import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrudDialog } from './crud-dialog';

function defaultProps(overrides?: Partial<React.ComponentProps<typeof CrudDialog>>) {
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

describe('CrudDialog', () => {
  describe('auto title', () => {
    it('shows "Create Record" by default in create mode', () => {
      render(<CrudDialog {...defaultProps()} />);
      expect(screen.getByText('Create Record')).toBeInTheDocument();
    });

    it('shows "Edit Record" in edit mode', () => {
      render(<CrudDialog {...defaultProps({ mode: 'edit' })} />);
      expect(screen.getByText('Edit Record')).toBeInTheDocument();
    });

    it('shows "View Record" in view mode', () => {
      render(<CrudDialog {...defaultProps({ mode: 'view' })} />);
      expect(screen.getByText('View Record')).toBeInTheDocument();
    });

    it('uses entityName in title', () => {
      render(<CrudDialog {...defaultProps({ entityName: 'Company' })} />);
      expect(screen.getByText('Create Company')).toBeInTheDocument();
    });

    it('uses custom title over auto title', () => {
      render(<CrudDialog {...defaultProps({ entityName: 'Company', title: 'Custom Title' })} />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows description when provided', () => {
      render(<CrudDialog {...defaultProps({ description: 'Fill in the details' })} />);
      expect(screen.getByText('Fill in the details')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('renders children', () => {
      render(<CrudDialog {...defaultProps()} />);
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    it('shows loading state instead of children', () => {
      render(<CrudDialog {...defaultProps({ isLoading: true })} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CrudDialog {...defaultProps({ isOpen: false })} />);
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });
  });

  describe('create/edit footer', () => {
    it('shows Cancel and Create buttons in create mode', () => {
      render(<CrudDialog {...defaultProps()} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('shows Cancel and Save Changes buttons in edit mode', () => {
      render(<CrudDialog {...defaultProps({ mode: 'edit' })} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('shows Saving... when submitting', () => {
      render(<CrudDialog {...defaultProps({ isSubmitting: true })} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables buttons when submitting', () => {
      render(<CrudDialog {...defaultProps({ isSubmitting: true })} />);
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('calls onSubmit when Create button clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<CrudDialog {...defaultProps({ onSubmit })} />);
      await user.click(screen.getByText('Create'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('view footer', () => {
    it('shows only Close button in view mode', () => {
      render(<CrudDialog {...defaultProps({ mode: 'view' })} />);
      const buttons = screen.getAllByRole('button', { name: 'Close' });
      const closeButton = buttons.find((b) => b.getAttribute('data-variant') === 'outline');
      expect(closeButton).toBeTruthy();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });

    it('calls onClose when Close clicked in view mode', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CrudDialog {...defaultProps({ mode: 'view', onClose })} />);
      const buttons = screen.getAllByRole('button', { name: 'Close' });
      const closeButton = buttons.find((b) => b.getAttribute('data-variant') === 'outline')!;
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('close when not dirty', () => {
    it('calls onClose when Cancel clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CrudDialog {...defaultProps({ onClose })} />);
      await user.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('dirty guard', () => {
    it('shows discard dialog when closing with unsaved changes', async () => {
      const user = userEvent.setup();

      render(<CrudDialog {...defaultProps({ isDirty: true })} />);
      await user.click(screen.getByText('Cancel'));

      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(screen.getByText('Keep Editing')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    it('hides dialog and stays open on Keep Editing', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onForceClose = vi.fn();

      render(<CrudDialog {...defaultProps({ isDirty: true, onClose, onForceClose })} />);

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

      render(<CrudDialog {...defaultProps({ isDirty: true, onForceClose })} />);

      await user.click(screen.getByText('Cancel'));
      await user.click(screen.getByText('Discard'));

      expect(onForceClose).toHaveBeenCalledTimes(1);
    });
  });
});

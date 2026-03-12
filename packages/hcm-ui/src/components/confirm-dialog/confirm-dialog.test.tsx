import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const user = userEvent.setup();

  function defaultProps() {
    return {
      open: true,
      onOpenChange: vi.fn(),
      title: 'Delete Record',
      onConfirm: vi.fn(),
    };
  }

  // ────────────────────────────────────────
  // Rendering
  // ────────────────────────────────────────

  describe('rendering', () => {
    it('renders when open is true', () => {
      render(<ConfirmDialog {...defaultProps()} />);

      expect(screen.getByText('Delete Record')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<ConfirmDialog {...defaultProps()} open={false} />);

      expect(screen.queryByText('Delete Record')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      render(<ConfirmDialog {...defaultProps()} title="Are you sure?" />);

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<ConfirmDialog {...defaultProps()} description="This action cannot be undone." />);

      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<ConfirmDialog {...defaultProps()} />);

      // Only title, no description element
      expect(screen.queryByText('This action cannot be undone.')).not.toBeInTheDocument();
    });

    it('renders default button labels', () => {
      render(<ConfirmDialog {...defaultProps()} />);

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders custom button labels', () => {
      render(
        <ConfirmDialog {...defaultProps()} confirmLabel="Yes, delete" cancelLabel="No, keep it" />,
      );

      expect(screen.getByText('Yes, delete')).toBeInTheDocument();
      expect(screen.getByText('No, keep it')).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────
  // Confirm action
  // ────────────────────────────────────────

  describe('confirm', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      const props = defaultProps();

      render(<ConfirmDialog {...props} />);

      await user.click(screen.getByText('Confirm'));

      expect(props.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not auto-close on confirm (consumer controls close)', async () => {
      const props = defaultProps();

      render(<ConfirmDialog {...props} />);

      await user.click(screen.getByText('Confirm'));

      // onOpenChange should NOT have been called with false
      // because we e.preventDefault() on the action
      expect(props.onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  // ────────────────────────────────────────
  // Cancel action
  // ────────────────────────────────────────

  describe('cancel', () => {
    it('calls onCancel when cancel button clicked', async () => {
      const onCancel = vi.fn();

      render(<ConfirmDialog {...defaultProps()} onCancel={onCancel} />);

      await user.click(screen.getByText('Cancel'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('works without onCancel callback', async () => {
      render(<ConfirmDialog {...defaultProps()} />);

      // Should not throw
      await user.click(screen.getByText('Cancel'));
    });
  });

  // ────────────────────────────────────────
  // Loading state
  // ────────────────────────────────────────

  describe('loading', () => {
    it('shows "Processing..." on confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps()} loading={true} />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('disables confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps()} loading={true} />);

      expect(screen.getByText('Processing...')).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      render(<ConfirmDialog {...defaultProps()} loading={true} />);

      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    it('does not disable buttons when not loading', () => {
      render(<ConfirmDialog {...defaultProps()} />);

      expect(screen.getByText('Confirm')).not.toBeDisabled();
      expect(screen.getByText('Cancel')).not.toBeDisabled();
    });
  });

  describe('variant styling', () => {
    it('applies destructive styling when variant is destructive', () => {
      render(<ConfirmDialog {...defaultProps()} variant="destructive" />);

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-destructive/10');
    });

    it('applies outline styling when variant is outline', () => {
      render(<ConfirmDialog {...defaultProps()} variant="outline" />);

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('border-border');
    });

    it('applies default styling by default', () => {
      render(<ConfirmDialog {...defaultProps()} />);

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-primary');
    });
  });

  describe('ReactNode content', () => {
    it('renders ReactNode title', () => {
      render(
        <ConfirmDialog
          {...defaultProps()}
          title={<span data-testid="custom-title">Custom Title</span>}
        />,
      );

      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('renders ReactNode description', () => {
      render(
        <ConfirmDialog
          {...defaultProps()}
          description={
            <div data-testid="custom-desc">
              <strong>Warning:</strong> This cannot be undone.
            </div>
          }
        />,
      );

      expect(screen.getByTestId('custom-desc')).toBeInTheDocument();
    });
  });
});

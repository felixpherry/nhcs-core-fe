import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrudDialog } from './crud-dialog';
import type { FormMode, UseCrudFormReturn } from '../../hooks/use-crud-form';
import type { ReactNode } from 'react';

interface TestForm extends Record<string, unknown> {
  name: string;
}

function mockCrud(overrides?: Partial<UseCrudFormReturn<TestForm>>): UseCrudFormReturn<TestForm> {
  return {
    isOpen: true,
    mode: 'create',
    values: { name: '' },
    editId: null,
    isDirty: false,
    isLoading: false,
    isCloseBlocked: false,
    setFieldValue: vi.fn(),
    setValues: vi.fn(),
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    openEditById: vi.fn(),
    openView: vi.fn(),
    requestClose: vi.fn(),
    confirmDiscard: vi.fn(),
    cancelDiscard: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function defaultProps(
  crudOverrides?: Partial<UseCrudFormReturn<TestForm>>,
  propsOverrides?: Partial<React.ComponentProps<typeof CrudDialog<TestForm>>>,
) {
  return {
    crud: mockCrud(crudOverrides),
    onSubmit: vi.fn(),
    children: <div>Form content</div>,
    ...propsOverrides,
  };
}

describe('CrudDialog', () => {
  // ══════════════════════════════════════════════════════════════
  // Auto title
  // ══════════════════════════════════════════════════════════════

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
      render(<CrudDialog {...defaultProps({}, { entityName: 'Company' })} />);
      expect(screen.getByText('Create Company')).toBeInTheDocument();
    });

    it('uses custom title over auto title', () => {
      render(
        <CrudDialog {...defaultProps({}, { entityName: 'Company', title: 'Custom Title' })} />,
      );
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows description when provided', () => {
      render(<CrudDialog {...defaultProps({}, { description: 'Fill in the details' })} />);
      expect(screen.getByText('Fill in the details')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Content
  // ══════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════
  // Create/Edit footer
  // ══════════════════════════════════════════════════════════════

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
      render(<CrudDialog {...defaultProps({}, { isSubmitting: true })} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables buttons when submitting', () => {
      render(<CrudDialog {...defaultProps({}, { isSubmitting: true })} />);
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('calls onSubmit when Create button clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<CrudDialog {...defaultProps({}, { onSubmit })} />);
      await user.click(screen.getByText('Create'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('calls crud.requestClose when Cancel clicked', async () => {
      const user = userEvent.setup();
      const props = defaultProps();

      render(<CrudDialog {...props} />);
      await user.click(screen.getByText('Cancel'));

      expect(props.crud.requestClose).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // View footer
  // ══════════════════════════════════════════════════════════════

  describe('view footer', () => {
    it('shows only Close button in view mode', () => {
      render(<CrudDialog {...defaultProps({ mode: 'view' })} />);
      const buttons = screen.getAllByRole('button', { name: 'Close' });
      const closeButton = buttons.find((b) => b.getAttribute('data-variant') === 'outline');
      expect(closeButton).toBeTruthy();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });

    it('calls crud.requestClose when Close clicked in view mode', async () => {
      const user = userEvent.setup();
      const props = defaultProps({ mode: 'view' });

      render(<CrudDialog {...props} />);
      const buttons = screen.getAllByRole('button', { name: 'Close' });
      const closeButton = buttons.find((b) => b.getAttribute('data-variant') === 'outline')!;
      await user.click(closeButton);

      expect(props.crud.requestClose).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Dirty guard (discard confirmation)
  // ══════════════════════════════════════════════════════════════

  describe('dirty guard', () => {
    it('shows discard dialog when isCloseBlocked is true', () => {
      render(<CrudDialog {...defaultProps({ isCloseBlocked: true })} />);

      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(screen.getByText('Keep Editing')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    it('does not show discard dialog when isCloseBlocked is false', () => {
      render(<CrudDialog {...defaultProps({ isCloseBlocked: false })} />);

      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('calls crud.cancelDiscard when Keep Editing clicked', async () => {
      const user = userEvent.setup();
      const props = defaultProps({ isCloseBlocked: true });

      render(<CrudDialog {...props} />);
      await user.click(screen.getByText('Keep Editing'));

      expect(props.crud.cancelDiscard).toHaveBeenCalledTimes(1);
    });

    it('calls crud.confirmDiscard when Discard clicked', async () => {
      const user = userEvent.setup();
      const props = defaultProps({ isCloseBlocked: true });

      render(<CrudDialog {...props} />);
      await user.click(screen.getByText('Discard'));

      expect(props.crud.confirmDiscard).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // renderFooter slot
  // ══════════════════════════════════════════════════════════════

  describe('renderFooter', () => {
    it('renders custom footer instead of default', () => {
      render(
        <CrudDialog
          {...defaultProps(
            {},
            {
              renderFooter: ({ mode }) => <div>Custom footer in {mode} mode</div>,
            },
          )}
        />,
      );

      expect(screen.getByText('Custom footer in create mode')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });

    it('passes correct context to renderFooter', () => {
      const renderFooter = vi.fn<
        (ctx: {
          mode: FormMode;
          isDirty: boolean;
          isSubmitting: boolean;
          onClose: () => void;
          onSubmit: () => void;
        }) => ReactNode
      >(() => <div>Custom</div>);

      const onSubmit = vi.fn();
      render(
        <CrudDialog
          {...defaultProps(
            { mode: 'edit', isDirty: true },
            { onSubmit, isSubmitting: true, renderFooter },
          )}
        />,
      );

      expect(renderFooter).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'edit',
          isDirty: true,
          isSubmitting: true,
        }),
      );

      // onClose and onSubmit are functions
      const ctx = renderFooter.mock.calls[0]![0];
      expect(typeof ctx.onClose).toBe('function');
      expect(typeof ctx.onSubmit).toBe('function');
    });
  });
});

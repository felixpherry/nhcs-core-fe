import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { CrudDialogProps } from './crud-dialog';
import { CrudDialog } from './crud-dialog';
import type { UseCrudFormReturn, FormMode } from '../../hooks/use-crud-form';

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

function renderCrudDialog(opts?: {
  crudOverrides?: Partial<UseCrudFormReturn<TestForm>>;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  entityName?: string;
  title?: string;
  description?: string;
  renderFooter?: CrudDialogProps<TestForm>['renderFooter'];
  children?: ReactNode;
}) {
  const {
    crudOverrides,
    onSubmit = vi.fn(),
    isSubmitting = false,
    entityName = 'Record',
    title,
    description,
    renderFooter,
    children = <div>Form content</div>,
  } = opts ?? {};

  const crud = mockCrud(crudOverrides);

  const result = render(
    <CrudDialog
      crud={crud}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      entityName={entityName}
      title={title}
      description={description}
      renderFooter={renderFooter}
    >
      {children}
    </CrudDialog>,
  );

  return { crud, onSubmit, ...result };
}

describe('CrudDialog', () => {
  describe('auto title', () => {
    it('shows "Create Record" by default in create mode', () => {
      renderCrudDialog();
      expect(screen.getByText('Create Record')).toBeInTheDocument();
    });

    it('shows "Edit Record" in edit mode', () => {
      renderCrudDialog({ crudOverrides: { mode: 'edit' } });
      expect(screen.getByText('Edit Record')).toBeInTheDocument();
    });

    it('shows "View Record" in view mode', () => {
      renderCrudDialog({ crudOverrides: { mode: 'view' } });
      expect(screen.getByText('View Record')).toBeInTheDocument();
    });

    it('uses entityName in title', () => {
      renderCrudDialog({ entityName: 'Company' });
      expect(screen.getByText('Create Company')).toBeInTheDocument();
    });

    it('uses custom title over auto title', () => {
      renderCrudDialog({ entityName: 'Company', title: 'Custom Title' });
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows description when provided', () => {
      renderCrudDialog({ description: 'Fill in the details' });
      expect(screen.getByText('Fill in the details')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('renders children', () => {
      renderCrudDialog();
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    it('shows loading state instead of children', () => {
      renderCrudDialog({ crudOverrides: { isLoading: true } });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderCrudDialog({ crudOverrides: { isOpen: false } });
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });
  });

  describe('create/edit footer', () => {
    it('shows Cancel and Create buttons in create mode', () => {
      renderCrudDialog();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('shows Cancel and Save Changes buttons in edit mode', () => {
      renderCrudDialog({ crudOverrides: { mode: 'edit' } });
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('shows Saving... when submitting', () => {
      renderCrudDialog({ isSubmitting: true });
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables buttons when submitting', () => {
      renderCrudDialog({ isSubmitting: true });
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('calls onSubmit when Create button clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      renderCrudDialog({ onSubmit });
      await user.click(screen.getByText('Create'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('calls crud.requestClose when Cancel clicked', async () => {
      const user = userEvent.setup();
      const { crud } = renderCrudDialog();
      await user.click(screen.getByText('Cancel'));
      expect(crud.requestClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('view footer', () => {
    it('shows only Close button in view mode', () => {
      renderCrudDialog({ crudOverrides: { mode: 'view' } });
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('calls crud.requestClose when Close clicked in view mode', async () => {
      const user = userEvent.setup();
      const { crud } = renderCrudDialog({ crudOverrides: { mode: 'view' } });
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      await user.click(closeButtons[closeButtons.length - 1]!);
      expect(crud.requestClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('dirty guard', () => {
    it('shows discard dialog when isCloseBlocked is true', () => {
      renderCrudDialog({ crudOverrides: { isCloseBlocked: true } });
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(screen.getByText('Keep Editing')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    it('does not show discard dialog when isCloseBlocked is false', () => {
      renderCrudDialog({ crudOverrides: { isCloseBlocked: false } });
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('calls crud.cancelDiscard when Keep Editing clicked', async () => {
      const user = userEvent.setup();
      const { crud } = renderCrudDialog({ crudOverrides: { isCloseBlocked: true } });
      await user.click(screen.getByText('Keep Editing'));
      expect(crud.cancelDiscard).toHaveBeenCalledTimes(1);
    });

    it('calls crud.confirmDiscard when Discard clicked', async () => {
      const user = userEvent.setup();
      const { crud } = renderCrudDialog({ crudOverrides: { isCloseBlocked: true } });
      await user.click(screen.getByText('Discard'));
      expect(crud.confirmDiscard).toHaveBeenCalledTimes(1);
    });
  });

  describe('renderFooter', () => {
    it('renders custom footer instead of default', () => {
      renderCrudDialog({
        renderFooter: ({ mode }) => <div>Custom footer in {mode} mode</div>,
      });
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

      renderCrudDialog({
        crudOverrides: { mode: 'edit', isDirty: true },
        isSubmitting: true,
        renderFooter,
      });

      expect(renderFooter).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'edit',
          isDirty: true,
          isSubmitting: true,
        }),
      );

      const ctx = renderFooter.mock.calls[0]![0];
      expect(typeof ctx.onClose).toBe('function');
      expect(typeof ctx.onSubmit).toBe('function');
    });
  });
});

'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import type { FormMode, UseCrudFormReturn } from '../../hooks/use-crud-form';

export interface CrudDialogProps<TForm extends Record<string, unknown>> {
  /** The return value from useCrudForm */
  crud: UseCrudFormReturn<TForm>;
  /** Called when user clicks Save/Create */
  onSubmit: () => void;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Entity name for auto-title (e.g. "Company") */
  entityName?: string;
  /** Custom title override */
  title?: string;
  /** Description */
  description?: string;
  /** Max width class for the dialog. Default: 'sm:max-w-2xl' */
  maxWidth?: string;
  /**
   * Override the default footer. Receives context for building custom buttons.
   * When omitted, renders the default Cancel/Create/Save Changes footer.
   */
  renderFooter?: (ctx: {
    mode: FormMode;
    isDirty: boolean;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: () => void;
  }) => ReactNode;
  /** Form content */
  children: ReactNode;
}

// ── Helpers ──

function getTitle(mode: FormMode, entityName?: string, customTitle?: string): string {
  if (customTitle) return customTitle;
  const entity = entityName ?? 'Record';
  switch (mode) {
    case 'create':
      return `Create ${entity}`;
    case 'edit':
      return `Edit ${entity}`;
    case 'view':
      return `View ${entity}`;
  }
}

function getSubmitLabel(mode: FormMode): string {
  switch (mode) {
    case 'create':
      return 'Create';
    case 'edit':
      return 'Save Changes';
    case 'view':
      return '';
  }
}

// ── Component ──

export function CrudDialog<TForm extends Record<string, unknown>>(props: CrudDialogProps<TForm>) {
  const {
    crud,
    onSubmit,
    isSubmitting = false,
    entityName,
    title,
    description,
    maxWidth = 'sm:max-w-2xl',
    renderFooter,
    children,
  } = props;

  // ── Default footer ──

  const defaultFooter =
    crud.mode === 'view' ? (
      <DialogFooter>
        <Button variant="outline" onClick={crud.requestClose}>
          Close
        </Button>
      </DialogFooter>
    ) : (
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={crud.requestClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting || crud.isLoading}>
          {isSubmitting ? 'Saving...' : getSubmitLabel(crud.mode)}
        </Button>
      </DialogFooter>
    );

  return (
    <>
      <Dialog open={crud.isOpen} onOpenChange={(open) => !open && crud.requestClose()}>
        <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{getTitle(crud.mode, entityName, title)}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="py-4">
            {crud.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {renderFooter
            ? renderFooter({
                mode: crud.mode,
                isDirty: crud.isDirty,
                isSubmitting,
                onClose: crud.requestClose,
                onSubmit,
              })
            : defaultFooter}
        </DialogContent>
      </Dialog>

      {/* Discard confirmation — driven entirely by hook state */}
      <ConfirmDialog
        open={crud.isCloseBlocked}
        onOpenChange={(open) => !open && crud.cancelDiscard()}
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to discard them?"
        variant="destructive"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={crud.confirmDiscard}
      />
    </>
  );
}

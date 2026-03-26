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
import type { FormMode, UseCrudDialogReturn } from '../../hooks/use-crud-dialog';

export interface CrudDialogProps {
  crud: UseCrudDialogReturn<unknown>;
  isSubmitting?: boolean;
  isDirty?: boolean;
  formId?: string;
  entityName?: string;
  title?: string;
  description?: string;
  maxWidth?: string;
  renderFooter?: (ctx: {
    mode: FormMode;
    isDirty: boolean;
    isSubmitting: boolean;
    formId: string;
    onClose: () => void;
  }) => ReactNode;
  children: ReactNode;
}

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

export function CrudDialog(props: CrudDialogProps) {
  const {
    crud,
    isSubmitting = false,
    isDirty = false,
    formId = 'crud-form',
    entityName,
    title,
    description,
    maxWidth = 'sm:max-w-2xl',
    renderFooter,
    children,
  } = props;

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
        <Button type="submit" form={formId} disabled={isSubmitting || crud.isLoading}>
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
                isDirty,
                isSubmitting,
                formId,
                onClose: crud.requestClose,
              })
            : defaultFooter}
        </DialogContent>
      </Dialog>

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

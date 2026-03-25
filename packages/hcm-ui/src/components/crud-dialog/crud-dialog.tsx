'use client';

import { useState, useCallback } from 'react';
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
import type { FormMode } from '../../hooks/use-crud-form';

// ── Props ──

export interface CrudDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Current form mode */
  mode: FormMode;
  /** Title — auto-generated from mode + entity if not provided */
  title?: string;
  /** Description */
  description?: string;
  /** Entity name for auto-title (e.g. "Company") */
  entityName?: string;
  /** Whether form has unsaved changes */
  isDirty: boolean;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Whether form is loading data */
  isLoading?: boolean;
  /** Called when user tries to close */
  onClose: () => void;
  /** Called when user confirms discard */
  onForceClose: () => void;
  /** Called when user clicks Save/Create */
  onSubmit: () => void;
  /** Max width class for the dialog. Default: 'sm:max-w-2xl' */
  maxWidth?: string;
  /** Form content */
  children: React.ReactNode;
}

// ── Auto title ──

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

export function CrudDialog(props: CrudDialogProps) {
  const {
    isOpen,
    mode,
    title,
    description,
    entityName,
    isDirty,
    isSubmitting = false,
    isLoading = false,
    onClose,
    onForceClose,
    onSubmit,
    maxWidth = 'sm:max-w-2xl',
    children,
  } = props;

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    onForceClose();
  }, [onForceClose]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{getTitle(mode, entityName, title)}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {mode !== 'view' && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Saving...' : getSubmitLabel(mode)}
              </Button>
            </DialogFooter>
          )}

          {mode === 'view' && (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Discard confirmation — uses ConfirmDialog instead of manual overlay */}
      <ConfirmDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to discard them?"
        variant="destructive"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={handleDiscard}
      />
    </>
  );
}

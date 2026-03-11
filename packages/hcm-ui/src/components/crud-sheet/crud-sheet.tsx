'use client';

import { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../ui/sheet';
import { Button } from '../ui/button';
import type { FormMode } from '../../hooks/use-crud-form';

// ── Props ──

export interface CrudSheetProps {
  /** Whether the sheet is open */
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

export function CrudSheet(props: CrudSheetProps) {
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

  const handleCancelDiscard = useCallback(() => {
    setShowDiscardDialog(false);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{getTitle(mode, entityName, title)}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

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
          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : getSubmitLabel(mode)}
            </Button>
          </SheetFooter>
        )}

        {mode === 'view' && (
          <SheetFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </SheetFooter>
        )}

        {/* Discard confirmation */}
        {showDiscardDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-6 shadow-lg max-w-sm mx-4">
              <h3 className="text-lg font-medium">Unsaved Changes</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You have unsaved changes. Do you want to discard them?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCancelDiscard}>
                  Keep Editing
                </Button>
                <Button variant="destructive" onClick={handleDiscard}>
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

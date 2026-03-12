'use client';

import type { UseChooserReturn } from '../../hooks/use-chooser';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// ── Props ──

export interface ChooserDialogProps<TData, TValue> {
  /** The useChooser return object */
  chooser: UseChooserReturn<TData, TValue>;
  /** Dialog title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Content — typically a DataTable */
  children: React.ReactNode;
  /** Max width class for the dialog. Default: 'sm:max-w-3xl' */
  maxWidth?: string;
  /** Label for the confirm button. Default: 'Confirm' */
  confirmLabel?: string;
  /** Label for the cancel button. Default: 'Cancel' */
  cancelLabel?: string;
  /** Tooltip text when confirm is disabled. Default: 'Please select at least 1 item' */
  requiredTooltip?: string;
}

// ── Component ──

export function ChooserDialog<TData, TValue>({
  chooser,
  title,
  description,
  children,
  maxWidth = 'sm:max-w-3xl',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requiredTooltip = 'Please select at least 1 item',
}: ChooserDialogProps<TData, TValue>) {
  const selectedCount = chooser.selection.state.selectedKeys.size;

  return (
    <Dialog
      open={chooser.isOpen}
      onOpenChange={(open) => {
        // When the dialog is dismissed (overlay click, Escape key),
        // treat it as cancel — revert selection
        if (!open) {
          chooser.cancel();
        }
      }}
    >
      <DialogContent className={maxWidth} showCloseButton={false}>
        {/* ── Header ── */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          {selectedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </p>
          )}
        </DialogHeader>

        {/* ── Body (consumer's DataTable, filters, etc.) ── */}
        <div className="min-h-0">{children}</div>

        {/* ── Footer ── */}
        <DialogFooter>
          <Button variant="outline" onClick={() => chooser.cancel()}>
            {cancelLabel}
          </Button>

          {chooser.canConfirm ? (
            <Button onClick={() => chooser.confirm()}>
              {confirmLabel}
              {selectedCount > 0 && ` (${selectedCount})`}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Wrap in span because disabled buttons don't fire mouse events */}
                  <span tabIndex={0}>
                    <Button disabled>{confirmLabel}</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{requiredTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

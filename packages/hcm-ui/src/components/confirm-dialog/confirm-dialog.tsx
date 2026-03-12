'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

// ── Props ──

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Descriptive text below the title */
  description?: string;
  /** Confirm button label. Default: 'Confirm' */
  confirmLabel?: string;
  /** Cancel button label. Default: 'Cancel' */
  cancelLabel?: string;
  /** Confirm button style. 'destructive' shows red button. Default: 'default' */
  variant?: 'default' | 'destructive';
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel?: () => void;
  /** Show loading state on confirm button (disables both buttons) */
  loading?: boolean;
}

// ── Component ──

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={() => onCancel?.()}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className={cn(
              variant === 'destructive' &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
            onClick={(e) => {
              // Prevent AlertDialog from auto-closing — let the consumer
              // control when to close (e.g., after async operation completes)
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

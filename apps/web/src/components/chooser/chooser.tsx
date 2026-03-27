'use client';

import { useState, useRef } from 'react';
import { useSelection } from '@/hooks/use-selection';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

export interface ChooserContext<TData> {
  isSelected: (row: TData) => boolean;
  toggleRow: (row: TData) => void;
  toggleAll: (rows: TData[]) => void;
  selectedIds: string[];
}

interface ChooserProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  className?: string; // ????

  mode?: 'single' | 'multi';
  getRowId: (row: TData) => string;
  initialSelectedIds?: string[];
  required?: boolean; // ????

  onConfirm: (rows: TData[]) => void;
  onCancel?: () => void;

  children: (ctx: ChooserContext<TData>) => React.ReactNode;
}

export function Chooser<TData>({
  open,
  onOpenChange,
  title,
  description,
  className,
  mode = 'single',
  getRowId,
  initialSelectedIds = [],
  required = false,
  onConfirm,
  onCancel,
  children,
}: ChooserProps<TData>) {
  const selection = useSelection({
    mode,
    required,
    initialKeys: initialSelectedIds,
  });

  const snapshotRef = useRef<string[]>(initialSelectedIds);
  const rowCacheRef = useRef<Map<string, TData>>(new Map());

  const [initialized, setInitialized] = useState(false);

  if (open && !initialized) {
    snapshotRef.current = Array.from(selection.state.selectedKeys);
    selection.replaceSelection(initialSelectedIds);
    setInitialized(true);
  }

  if (!open && initialized) {
    setInitialized(false);
  }

  function cacheRow(row: TData) {
    rowCacheRef.current.set(getRowId(row), row);
  }

  function handleConfirm() {
    if (required && selection.state.isEmpty) return;

    const rows: TData[] = [];
    for (const key of selection.state.selectedKeys) {
      const row = rowCacheRef.current.get(key);
      if (row) rows.push(row);
    }

    onConfirm(rows);
    onOpenChange(false);
  }

  function handleCancel() {
    selection.replaceSelection(snapshotRef.current);
    onOpenChange(false);
    onCancel?.();
  }

  const canConfirm = required ? !selection.state.isEmpty : true;

  const ctx: ChooserContext<TData> = {
    isSelected: (row: TData) => {
      cacheRow(row);
      return selection.state.isSelected(getRowId(row));
    },
    toggleRow: (row: TData) => {
      cacheRow(row);
      selection.toggleRow(getRowId(row));
    },
    toggleAll: (rows: TData[]) => {
      for (const row of rows) cacheRow(row);
      selection.toggleAll(rows.map(getRowId));
    },
    selectedIds: Array.from(selection.state.selectedKeys),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleCancel();
      }}
    >
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>

        {children(ctx)}

        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-sub">{selection.state.selectedKeys.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button disabled={!canConfirm} onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

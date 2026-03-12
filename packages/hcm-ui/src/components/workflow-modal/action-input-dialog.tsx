'use client';

import { useState, useCallback } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { FormField } from '../form-field/form-field';
import type { ActionInputStep } from '../../hooks/use-workflow-actions';

// ── Props ──

export interface ActionInputDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The input step configuration */
  inputStep: ActionInputStep;
  /** Called when user submits the form */
  onSubmit: (data: Record<string, unknown>) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Whether the parent action is executing */
  loading?: boolean;
}

// ── Component ──

export function ActionInputDialog({
  open,
  inputStep,
  onSubmit,
  onCancel,
  loading = false,
}: ActionInputDialogProps) {
  const { title, description, fields, submitLabel = 'Submit', cancelLabel = 'Cancel' } = inputStep;

  // ── Local form state ──

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of fields) {
      initial[field.name] = '';
    }
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // ── Field change handler ──

  const handleFieldChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });
  }, []);

  // ── Validate required fields ──

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const field of fields) {
      if (field.required) {
        const value = formData[field.name];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          newErrors[field.name] = [`${field.label} is required`];
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [fields, formData]);

  // ── Submit handler ──

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit(formData);
  }, [validate, formData, onSubmit]);

  // ── Reset form when dialog opens ──
  // We use key={open} approach — parent remounts by toggling open

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map((fieldConfig) => (
            <FormField
              key={fieldConfig.id}
              config={fieldConfig}
              value={formData[fieldConfig.name] ?? ''}
              onChange={(value) => handleFieldChange(fieldConfig.name, value)}
              onBlur={() => {}}
              errors={errors[fieldConfig.name]}
              formValues={formData as Record<string, unknown>}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

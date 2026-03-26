'use client';

import type { ReactNode } from 'react';
import type { StandardSchemaV1 } from '@tanstack/react-form';
import type { UseCrudDialogReturn } from '../../hooks/use-crud-dialog';
import { useAppForm } from './form-hook';

export interface CrudFormBridgeProps<TForm extends Record<string, unknown>> {
  crud: UseCrudDialogReturn<unknown>;
  defaultValues: TForm;
  onSubmit: (values: TForm) => Promise<void> | void;
  isSubmitting: boolean;
  formId?: string;
  validators?: {
    onBlur?: StandardSchemaV1<TForm>;
    onSubmit?: StandardSchemaV1<TForm>;
    onChange?: StandardSchemaV1<TForm>;
  };
  children: ReactNode;
}

export function CrudFormBridge<TForm extends Record<string, unknown>>({
  crud,
  defaultValues,
  onSubmit,
  formId = 'crud-form',
  validators,
  children,
}: CrudFormBridgeProps<TForm>) {
  const form = useAppForm({
    defaultValues,
    validators,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  crud.syncIsDirty(form.state.isDirty);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {children}
    </form>
  );
}

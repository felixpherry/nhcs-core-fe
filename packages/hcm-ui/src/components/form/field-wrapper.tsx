'use client';

import type { ReactNode } from 'react';
import { useFieldContext } from './form-context';
import { Label } from '../ui';

export interface FieldWrapperProps {
  label?: ReactNode;
  required?: boolean;
  description?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, required, description, children }: FieldWrapperProps) {
  const field = useFieldContext();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorMessage = field.state.meta.errors?.[0]?.toString();

  return (
    <div data-invalid={isInvalid || undefined} className="flex flex-col gap-2">
      {!!label && (
        <Label htmlFor={field.name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {isInvalid && errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export interface FormFieldLayoutProps {
  /** Field label text */
  label: string;
  /** Show required asterisk */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Field content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** HTML for attribute on label */
  htmlFor?: string;
}

export function FormFieldLayout({
  label,
  required,
  error,
  children,
  className,
  htmlFor,
}: FormFieldLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

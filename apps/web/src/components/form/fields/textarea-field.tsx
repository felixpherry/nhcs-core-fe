'use client';

import { useFieldContext } from '../form-context';
import { Textarea } from '@/components/ui';
import type { Label } from '@/components/ui';
import { BaseField } from './base-field';
import { useId, type ComponentProps } from 'react';

interface TextareaFieldProps extends ComponentProps<typeof Textarea> {
  labelProps: React.ComponentProps<typeof Label>;
  description?: string;
  className?: string;
}

export function TextareaField({
  labelProps,
  required,
  description,
  className,
  ...props
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.isTouched
    ? field.state.meta.errors.map((e) => (typeof e === 'string' ? e : e.message))
    : [];
  const fallbackId = useId();
  const id = props.id ?? fallbackId;

  return (
    <BaseField
      id={id}
      labelProps={labelProps}
      required={required}
      errors={errors}
      description={description}
      className={className}
    >
      <Textarea
        {...props}
        id={id}
        name={field.name}
        defaultValue={undefined}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
      />
    </BaseField>
  );
}

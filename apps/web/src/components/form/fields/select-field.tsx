'use client';

import type { ComponentProps } from 'react';
import { useId } from 'react';
import { useFieldContext } from '../form-context';
import { getErrorMessages } from '../utils';
import type { Label } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { BaseField } from './base-field';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends ComponentProps<typeof Select> {
  labelProps: React.ComponentProps<typeof Label>;
  description?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
}

export function SelectField({
  labelProps,
  required,
  description,
  className,
  placeholder,
  options,
  ...props
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const errors = getErrorMessages(field);
  const id = useId();

  return (
    <BaseField
      id={id}
      labelProps={labelProps}
      required={required}
      errors={errors}
      description={description}
      className={className}
    >
      <Select
        {...props}
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
          field.handleBlur();
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={errors.length > 0 || undefined}
          aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </BaseField>
  );
}

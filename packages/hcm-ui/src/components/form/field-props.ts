import type { AnyFieldApi } from '@tanstack/react-form';

function baseProps(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    id: field.name,
    name: field.name,
    'aria-invalid': (field.state.meta.isTouched && !field.state.meta.isValid) || undefined,
    disabled: opts?.disabled ?? false,
  } as const;
}

export function getInputProps(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    ...baseProps(field, opts),
    value: field.state.value as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value),
    onBlur: field.handleBlur,
  };
}

export function getTextareaProps(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    ...baseProps(field, opts),
    value: field.state.value as string,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value),
    onBlur: field.handleBlur,
  };
}

export function getSelectProps(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    value: field.state.value as string,
    onValueChange: (val: string) => {
      field.handleChange(val);
      field.handleBlur();
    },
    disabled: opts?.disabled ?? false,
  };
}

export function getCheckboxProps(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    id: field.name,
    checked: field.state.value as boolean,
    onCheckedChange: (checked: boolean) => {
      field.handleChange(checked);
      field.handleBlur();
    },
    disabled: opts?.disabled ?? false,
  };
}

export function getDateProps(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    value: field.state.value as string | null,
    onChange: (val: string | null) => {
      field.handleChange(val);
      field.handleBlur();
    },
    disabled: opts?.disabled ?? false,
  };
}

export function getChooserProps<T>(field: AnyFieldApi, opts?: { disabled?: boolean }) {
  return {
    value: field.state.value as T | null,
    onChange: (val: T | null) => field.handleChange(val),
    onBlur: field.handleBlur,
    disabled: opts?.disabled ?? false,
  };
}

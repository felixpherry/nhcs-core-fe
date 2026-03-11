'use client';

import type { ReactNode } from 'react';
import { Field, FieldLabel, FieldError, FieldDescription } from '../ui/field';
import {
  renderText,
  renderNumber,
  renderSelect,
  renderCheckbox,
  renderSwitch,
  renderTextarea,
  renderDate,
  type RendererProps,
} from './renderers';
import type {
  CheckboxFieldConfig,
  CustomFieldConfig,
  DateFieldConfig,
  FormFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  SwitchFieldConfig,
  TextareaFieldConfig,
  TextFieldConfig,
} from './types';

// ── Props ──

export interface FormFieldProps<TForm extends Record<string, unknown>> {
  config: FormFieldConfig<TForm>;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  errors?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  formValues?: TForm;
}

// ── Component ──

export function FormField<TForm extends Record<string, unknown>>(props: FormFieldProps<TForm>) {
  const {
    config,
    value,
    onChange,
    onBlur,
    errors = [],
    disabled = false,
    readOnly = false,
    formValues,
  } = props;

  // ── Conditional logic ──

  if (config.visibleWhen && formValues && !config.visibleWhen(formValues)) {
    return null;
  }

  const isDisabled =
    disabled ||
    config.disabled ||
    (config.disabledWhen && formValues ? config.disabledWhen(formValues) : false);

  const isReadOnly = readOnly || config.readOnly;

  const isRequired =
    config.required ||
    (config.requiredWhen && formValues ? config.requiredWhen(formValues) : false);

  const hasError = errors.length > 0;

  // ── Renderer props ──

  const rendererProps: RendererProps = {
    id: config.id,
    value,
    onChange,
    onBlur,
    disabled: isDisabled,
    readOnly: isReadOnly ?? false,
    hasError,
  };

  // ── Pick the right renderer ──

  let fieldContent: ReactNode = null;

  switch (config.type) {
    case 'text':
    case 'password':
      fieldContent = renderText(config as TextFieldConfig, rendererProps);
      break;
    case 'number':
      fieldContent = renderNumber(config as NumberFieldConfig, rendererProps);
      break;
    case 'select':
      fieldContent = renderSelect(config as SelectFieldConfig, rendererProps);
      break;
    case 'checkbox':
      fieldContent = renderCheckbox(config as CheckboxFieldConfig, rendererProps);
      break;
    case 'switch':
      fieldContent = renderSwitch(config as SwitchFieldConfig, rendererProps);
      break;
    case 'textarea':
      fieldContent = renderTextarea(config as TextareaFieldConfig, rendererProps);
      break;
    case 'date':
      fieldContent = renderDate(config as DateFieldConfig, rendererProps);
      break;
    case 'custom': {
      const customConfig = config as CustomFieldConfig;
      fieldContent = customConfig.render({
        value,
        onChange,
        onBlur,
        disabled: isDisabled,
        readOnly: isReadOnly ?? false,
        name: config.name,
        formValues: formValues ?? ({} as TForm),
      });
      break;
    }
    case 'async-combobox':
      fieldContent = <div>async-combobox (not yet implemented)</div>;
      break;
  }

  // ── Wrap with label + error ──

  // Checkbox and switch render their own labels inline
  if (config.type === 'checkbox' || config.type === 'switch') {
    return (
      <Field data-invalid={hasError}>
        <FieldLabel htmlFor={config.id}>
          {config.label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
        {fieldContent}
        {config.description && <FieldDescription>{config.description}</FieldDescription>}
        {hasError && <FieldError errors={errors.map((e) => ({ message: e }))} />}
      </Field>
    );
  }

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={config.id}>
        {config.label}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      {fieldContent}
      {config.description && <FieldDescription>{config.description}</FieldDescription>}
      {hasError && <FieldError errors={errors.map((e) => ({ message: e }))} />}
    </Field>
  );
}

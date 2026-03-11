'use client';

import type { ReactNode } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type {
  TextFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  CheckboxFieldConfig,
  SwitchFieldConfig,
  TextareaFieldConfig,
  DateFieldConfig,
} from './types';

// ── Shared props passed to every renderer ──

export interface RendererProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
  readOnly: boolean;
  hasError: boolean;
}

// ── Text / Password ──

export function renderText(config: TextFieldConfig, props: RendererProps): ReactNode {
  return (
    <Input
      type={config.type === 'password' ? 'password' : 'text'}
      value={(props.value as string) ?? ''}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
      disabled={props.disabled}
      readOnly={props.readOnly}
      placeholder={config.placeholder}
      minLength={config.minLength}
      maxLength={config.maxLength}
      aria-invalid={props.hasError}
    />
  );
}

// ── Number ──

export function renderNumber(config: NumberFieldConfig, props: RendererProps): ReactNode {
  return (
    <Input
      type="number"
      value={props.value === null || props.value === undefined ? '' : String(props.value)}
      onChange={(e) => {
        const raw = e.target.value;
        props.onChange(raw === '' ? null : Number(raw));
      }}
      onBlur={props.onBlur}
      disabled={props.disabled}
      readOnly={props.readOnly}
      placeholder={config.placeholder}
      min={config.min}
      max={config.max}
      step={config.step}
      aria-invalid={props.hasError}
    />
  );
}

// ── Select ──

export function renderSelect(config: SelectFieldConfig, props: RendererProps): ReactNode {
  return (
    <Select
      value={(props.value as string) ?? ''}
      onValueChange={(val) => props.onChange(val)}
      disabled={props.disabled || props.readOnly}
    >
      <SelectTrigger aria-invalid={props.hasError}>
        <SelectValue placeholder={config.placeholder ?? 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {config.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Checkbox ──

export function renderCheckbox(config: CheckboxFieldConfig, props: RendererProps): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={!!props.value}
        onCheckedChange={(checked) => props.onChange(checked)}
        onBlur={props.onBlur}
        disabled={props.disabled || props.readOnly}
        aria-invalid={props.hasError}
      />
      {config.checkboxLabel && <span className="text-sm">{config.checkboxLabel}</span>}
    </div>
  );
}

// ── Switch ──

export function renderSwitch(config: SwitchFieldConfig, props: RendererProps): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={!!props.value}
        onCheckedChange={(checked) => props.onChange(checked)}
        disabled={props.disabled || props.readOnly}
        aria-invalid={props.hasError}
      />
      {config.switchLabel && <span className="text-sm">{config.switchLabel}</span>}
    </div>
  );
}

// ── Textarea ──

export function renderTextarea(config: TextareaFieldConfig, props: RendererProps): ReactNode {
  return (
    <Textarea
      value={(props.value as string) ?? ''}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
      disabled={props.disabled}
      readOnly={props.readOnly}
      placeholder={config.placeholder}
      rows={config.rows ?? 3}
      maxLength={config.maxLength}
      aria-invalid={props.hasError}
    />
  );
}

// ── Date ──

export function renderDate(config: DateFieldConfig, props: RendererProps): ReactNode {
  return (
    <Input
      type="date"
      value={(props.value as string) ?? ''}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
      disabled={props.disabled}
      readOnly={props.readOnly}
      placeholder={config.placeholder}
      aria-invalid={props.hasError}
    />
  );
}

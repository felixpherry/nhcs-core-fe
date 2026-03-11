// ── Field Types ──

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'async-combobox'
  | 'checkbox'
  | 'switch'
  | 'textarea'
  | 'date'
  | 'password'
  | 'custom';

// ── Option shape for select / combobox ──

export interface FieldOption {
  label: string;
  value: string;
}

// ── Base config — shared by all field types ──

export interface FormFieldConfigBase<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Stable identifier for persistence / visibility */
  id: string;
  /** Field name — maps to form value key */
  name: keyof TForm & string;
  /** Display label */
  label: string;
  /** Field type */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Help text below the field */
  description?: string;
  /** Is this field required? */
  required?: boolean;
  /** Is this field disabled? */
  disabled?: boolean;
  /** Is this field read-only? (view mode) */
  readOnly?: boolean;

  // ── Conditional logic ──

  /** Show this field only when condition is met */
  visibleWhen?: (values: TForm) => boolean;
  /** Disable this field when condition is met */
  disabledWhen?: (values: TForm) => boolean;
  /** Require this field when condition is met */
  requiredWhen?: (values: TForm) => boolean;

  // ── Dependency gating (for async lookups) ──

  /** Field names this field depends on */
  dependsOn?: string[];
  /** Whether the async query should run */
  isQueryEnabled?: (values: TForm) => boolean;
  /** What to do when a dependency changes */
  onDependencyChange?: 'clear' | 'refetch' | 'keep-if-valid';

  // ── Custom rendering ──

  /** Custom render for view mode */
  renderView?: (value: unknown) => React.ReactNode;
  /** Custom render for edit mode (type: 'custom') */
  render?: (props: CustomFieldRenderProps<TForm>) => React.ReactNode;
}

// ── Props passed to custom field renderers ──

export interface CustomFieldRenderProps<TForm extends Record<string, unknown>> {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
  readOnly: boolean;
  name: string;
  formValues: TForm;
}

// ── Type-specific configs ──

export interface TextFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'text' | 'password';
  minLength?: number;
  maxLength?: number;
}

export interface NumberFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'select';
  options: FieldOption[];
}

export interface AsyncComboboxFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'async-combobox';
  queryFn: (search: string) => Promise<FieldOption[]>;
  debounceMs?: number;
}

export interface CheckboxFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'checkbox';
  checkboxLabel?: string;
}

export interface SwitchFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'switch';
  switchLabel?: string;
}

export interface TextareaFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
}

export interface DateFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'date';
}

export interface CustomFieldConfig<
  TForm extends Record<string, unknown> = Record<string, unknown>,
> extends FormFieldConfigBase<TForm> {
  type: 'custom';
  render: (props: CustomFieldRenderProps<TForm>) => React.ReactNode;
}

// ── Union type ──

export type FormFieldConfig<TForm extends Record<string, unknown> = Record<string, unknown>> =
  | TextFieldConfig<TForm>
  | NumberFieldConfig<TForm>
  | SelectFieldConfig<TForm>
  | AsyncComboboxFieldConfig<TForm>
  | CheckboxFieldConfig<TForm>
  | SwitchFieldConfig<TForm>
  | TextareaFieldConfig<TForm>
  | DateFieldConfig<TForm>
  | CustomFieldConfig<TForm>;

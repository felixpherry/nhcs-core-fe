export {
  useSelection,
  type UseSelectionOptions,
  type UseSelectionReturn,
  type SelectionState,
} from './hooks/use-selection';

export {
  useFieldVisibility,
  type UseFieldVisibilityOptions,
  type UseFieldVisibilityReturn,
} from './hooks/use-field-visibility';

export { useFilter, type UseFilterOptions, type UseFilterReturn } from './hooks/use-filter';

// UI primitives
export * from './components/ui';

// Form system
export {
  FormField,
  type FormFieldProps,
  type FieldType,
  type FieldOption,
  type FormFieldConfig,
  type FormFieldConfigBase,
  type TextFieldConfig,
  type NumberFieldConfig,
  type SelectFieldConfig,
  type AsyncComboboxFieldConfig,
  type CheckboxFieldConfig,
  type SwitchFieldConfig,
  type TextareaFieldConfig,
  type DateFieldConfig,
  type CustomFieldConfig,
  type CustomFieldRenderProps,
} from './components/form-field';

// Form builder
export {
  FormBuilder,
  type FormBuilderProps,
  type FormNode,
  type FieldNode,
  type SectionNode,
  type GridNode,
  type GroupNode,
  type DividerNode,
  type CardNode,
  type CustomNode,
  type FormBuilderContext,
} from './components/form-builder';

// Utilities
export { cn } from './lib/utils';

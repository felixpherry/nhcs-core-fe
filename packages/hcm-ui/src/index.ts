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

// CRUD form hook
export {
  useCrudForm,
  type UseCrudFormOptions,
  type UseCrudFormReturn,
  type FormMode,
} from './hooks/use-crud-form';

// CRUD sheet
export { CrudSheet, type CrudSheetProps } from './components/crud-sheet';

// DataTable system
export {
  createColumns,
  type ColumnConfig,
  type BuiltInCellType,
  sortingToOrderBys,
  buildSortMapping,
  type SortingState,
  type OrderBy,
  type SortMapping,
  DataTable,
  DataTableContent,
  DataTableToolbar,
  DataTableSearch,
  DataTableActions,
  DataTablePagination,
  type DataTableProps,
  StatusBadgeCell,
  DateCell,
  NumberCell,
} from './components/data-table';

// Utilities
export { cn } from './lib/utils';

// Remote table query
export {
  useRemoteTableQuery,
  buildTableInput,
  type UseRemoteTableQueryOptions,
  type UseRemoteTableQueryReturn,
  type TableQueryInput,
  type TableQueryResult,
} from './hooks/use-remote-table-query';

export { useDataTable } from './hooks/use-data-table';

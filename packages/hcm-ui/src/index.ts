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

// CRUD dialog
export { CrudDialog, type CrudDialogProps } from './components/crud-dialog';

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

// FilterPanel system
export {
  FilterPanel,
  FilterPanelFields,
  FilterPanelActions,
  FilterPanelFieldToggle,
  type FilterPanelProps,
  type FilterPanelFieldsProps,
  type FilterPanelActionsProps,
  type FilterPanelFieldToggleProps,
} from './components/filter-panel';

// Utilities
export { cn } from './lib/utils';

// Remote table query
export {
  useRemoteTableQuery,
  buildTableInput,
  type UseRemoteTableQueryOptions,
  type TableQueryInput,
  type TableQueryResult,
} from './hooks/use-remote-table-query';

export {
  useDataTable,
  type UseDataTableOptions,
  type UseDataTableReturn,
} from './hooks/use-data-table';

export { useDebounce } from './hooks/use-debounce';
export { useChooser } from './hooks/use-chooser';
export type { UseChooserOptions, UseChooserReturn, ChooserResult } from './hooks/use-chooser';
export { useTreeTable } from './hooks/use-tree-table';
export type {
  TreeNode,
  FlatTreeNode,
  SearchMode,
  SelectionPolicy,
  SelectionPolicyFn,
  UseTreeTableOptions,
  UseTreeTableReturn,
} from './hooks/use-tree-table';

export {
  TreeTable,
  TreeTableToolbar,
  TreeTableSearch,
  TreeTableActions,
  type TreeTableProps,
} from './components/tree-table';
export { ConfirmDialog, type ConfirmDialogProps } from './components/confirm-dialog';

export { StatusBadge, type StatusBadgeProps, type BadgeVariant } from './components/status-badge';
export { useWorkflowActions } from './hooks/use-workflow-actions';
export type {
  WorkflowAction,
  ActionConfirmStep,
  ActionInputStep,
  PipelineState,
  UseWorkflowActionsOptions,
  UseWorkflowActionsReturn,
} from './hooks/use-workflow-actions';
export { WorkflowModalFooter, type WorkflowModalFooterProps } from './components/workflow-modal';
export { ActionInputDialog, type ActionInputDialogProps } from './components/workflow-modal';
export { PageHeader, type PageHeaderProps, type BreadcrumbItem } from './components/page-header';
export { ChooserField } from './components/chooser-field';
export {
  FormFieldLayout,
  type FormFieldLayoutProps,
  FilterFieldLayout,
  type FilterFieldLayoutProps,
} from './components/form-field-layout';

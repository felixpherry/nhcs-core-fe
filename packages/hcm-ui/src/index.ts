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

// CRUD dialog hook
export {
  useCrudDialog,
  CrudDialogActionTypes,
  type UseCrudDialogOptions,
  type UseCrudDialogReturn,
  type FormMode,
  type CrudDialogState,
  type CrudDialogAction,
  type CrudDialogActionType,
} from './hooks/use-crud-dialog';

// CRUD dialog
export { CrudDialog, type CrudDialogProps } from './components/crud-dialog';

// FilterPanel system
// export {
//   FilterPanel,
//   FilterPanelFields,
//   FilterPanelActions,
//   FilterPanelFieldToggle,
//   type FilterPanelProps,
//   type FilterPanelFieldsProps,
//   type FilterPanelActionsProps,
//   type FilterPanelFieldToggleProps,
// } from './components/filter-panel';

// Utilities
export { cn } from './lib/utils';
export { isEqual } from './lib/is-equal';

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
export {
  useWorkflowActions,
  WorkflowTransitions,
  type WorkflowAction,
  type ActionConfirmStep,
  type ActionInputStep,
  type PipelineState,
  type PipelineStep,
  type PipelineAction,
  type WorkflowTransitionType,
  type UseWorkflowActionsOptions,
  type UseWorkflowActionsReturn,
} from './hooks/use-workflow-actions';
// export { WorkflowModalFooter, type WorkflowModalFooterProps } from './components/workflow-modal';
// export { ActionInputDialog, type ActionInputDialogProps } from './components/workflow-modal';
export { PageHeader, type PageHeaderProps, type BreadcrumbItem } from './components/page-header';
export { ChooserField } from './components/chooser-field';
export {
  FormFieldLayout,
  type FormFieldLayoutProps,
  FilterFieldLayout,
  type FilterFieldLayoutProps,
} from './components/form-field-layout';

export {
  fieldContext,
  useFieldContext,
  formContext,
  useFormContext,
  useAppForm,
  withForm,
  FieldWrapper,
  type FieldWrapperProps,
  getInputProps,
  getTextareaProps,
  getSelectProps,
  getCheckboxProps,
  getDateProps,
  getChooserProps,
  CrudFormBridge,
  type CrudFormBridgeProps,
} from './components/form';

export { DataTable } from './components/data-table/data-table';
export { DataTableAdvancedToolbar } from './components/data-table/data-table-advanced-toolbar';
export { DataTableColumnHeader } from './components/data-table/data-table-column-header';
export { DataTableFilterList } from './components/data-table/data-table-filter-list';
export { DataTablePagination } from './components/data-table/data-table-pagination';
export { DataTableSkeleton } from './components/data-table/data-table-skeleton';
export { DataTableSortList } from './components/data-table/data-table-sort-list';
export { DataTableToolbar } from './components/data-table/data-table-toolbar';
export { DataTableViewOptions } from './components/data-table/data-table-view-options';
export { useDataTable } from './hooks/use-data-table';
export { getColumnPinningStyle } from './lib/data-table';
export { dataTableConfig } from './config/data-table';
export type {
  ExtendedColumnSort,
  ExtendedColumnFilter,
  FilterOperator,
  FilterVariant,
  QueryKeys,
} from './types/data-table';

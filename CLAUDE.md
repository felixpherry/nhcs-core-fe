# NHCS Core FE

New Human Capital System (NHCS) frontend — migrating from Nuxt 2/Vue 2 to Next.js + tRPC + TypeScript + Turborepo.

## Monorepo Packages

| Package      | Import             | Purpose                                       |
| ------------ | ------------------ | --------------------------------------------- |
| `types`      | `@nhcs/types`      | Zod schemas, envelope, shared types           |
| `registries` | `@nhcs/registries` | Policy table, procedure registry              |
| `api`        | `@nhcs/api`        | tRPC routers, backendFetch (internal), errors |
| `features`   | `@nhcs/features`   | React components, hooks, page layouts         |
| `config`     | `@nhcs/config`     | Shared tsconfig                               |
| `hcm-ui`     | `@nhcs/hcm-ui`     | Reusable UI components & hooks                |

## Architecture Rules

1. **backendFetch is internal** — only routers inside `@nhcs/api` use it. Never export it.
2. **No circular dependencies** — features depend on api, never the reverse.
3. **Routers live in @nhcs/api** — grouped by domain under `src/routers/`.
4. **Features are UI-only** — React components, hooks, pages. No backend calls.
5. **Every procedure is registered** — using `registerProcedure()` with mode/type/criticality.
6. **Policy is derived, not chosen** — requestClass = `{mode}:{type}:{criticality}`, policy is looked up.
7. **Backend envelope uses `result` not `data`** — `{ isSuccess, result: { data: T[], count } }`.
8. **Backend fields are nullable** — always use `.nullable()` in Zod schemas.
9. **`Flag` type** — backend uses `'T'` / `'F'` not booleans.
10. **`query-string`** — use `stringifyUrl()` for URL building, installed at workspace root.
11. **Auth headers** — backend expects `Authorization: Bearer {token}` + `user-id: {userId}_{accessId}_{userLevel}`.
12. **Login/logout use publicProcedure** — auth routes don't require session context.

## hcm-ui Component Inventory

All components live in `packages/hcm-ui/src/`. See each file's JSDoc and TypeScript types for API details.

### Hooks

| Hook                  | File                              | Purpose                                                                                                                                                            |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useSelection`        | `hooks/use-selection.ts`          | Row selection state (single/multi). `isAllSelected()` and `isPartiallySelected()` are methods, not booleans.                                                       |
| `useFilter`           | `hooks/use-filter.ts`             | Draft/applied filter pattern. `applyDraft()` commits, `resetDraft()` reverts.                                                                                      |
| `useFieldVisibility`  | `hooks/use-field-visibility.ts`   | Field show/hide with localStorage persistence.                                                                                                                     |
| `useDataTable`        | `hooks/use-data-table.ts`         | Core table state. Data set imperatively via `_setData()/_setLoading()`, not via options.                                                                           |
| `useRemoteTableQuery` | `hooks/use-remote-table-query.ts` | Syncs tRPC query result into useDataTable. `buildTableInput(table)` builds request body.                                                                           |
| `useCrudForm`         | `hooks/use-crud-form.ts`          | CRUD form sheet state (useReducer + stale request guard).                                                                                                          |
| `useDebounce`         | `hooks/use-debounce.ts`           | Debounce a value by N ms.                                                                                                                                          |
| `useChooser`          | `hooks/use-chooser.ts`            | Modal selection lifecycle. `rowKey` extracts ID, `mapSelected` projects TData→TValue at confirm time only. Row cache via `trackRows()`. Snapshot/revert on cancel. |
| `useTreeTable`        | `hooks/use-tree-table.ts`         | Tree flattening, expand/collapse, 3 built-in selection policies + custom `SelectionPolicyFn`, search highlight/filter modes.                                       |
| `useWorkflowActions`  | `hooks/use-workflow-actions.ts`   | Action pipeline: trigger → confirm → input → execute. Replaces old swalConfirm + nested modal patterns.                                                            |

### Components

| Component             | Directory                    | Purpose                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FormField`           | `components/form-field/`     | Renders field by type from `FormFieldConfig`.                                                                                                                                                                                                   |
| `AsyncComboboxField`  | `components/form-field/`     | Async searchable combobox. Single/multi mode, 3 multi display modes (`count`/`inline-chips`/`chips-below`), `initialOptions` for cold-start labels, `showToggleAll`, `maxSelections`. Uses `shouldFilter={false}` — server filters via queryFn. |
| `DataTable`           | `components/data-table/`     | Compound table component. `DataTableContent`, `DataTablePagination`, `DataTableToolbar`.                                                                                                                                                        |
| `FilterPanel`         | `components/filter-panel/`   | Filter UI with field toggle visibility.                                                                                                                                                                                                         |
| `ChooserDialog`       | `components/chooser-dialog/` | Dialog shell for useChooser. Disabled confirm button with tooltip when required + empty. Consumer provides DataTable as children.                                                                                                               |
| `TreeTable`           | `components/tree-table/`     | Renders useTreeTable flatNodes. Indentation on first column, chevron toggles, search highlight. Calls `toggleNode` (policy-aware), not `toggleRow`. No sorting, no pagination.                                                                  |
| `ConfirmDialog`       | `components/confirm-dialog/` | AlertDialog-based confirmation. `e.preventDefault()` on confirm — consumer controls close. `loading` prop disables both buttons. Supports all Button variants.                                                                                  |
| `StatusBadge`         | `components/status-badge/`   | Badge for record status. `variantMap` for future design system colors. `formatStatus()` converts `IN_PROGRESS` → `In Progress`.                                                                                                                 |
| `WorkflowModalFooter` | `components/workflow-modal/` | Auto-renders action buttons from useWorkflowActions + auto-wires ConfirmDialog and ActionInputDialog based on pipeline state.                                                                                                                   |
| `ActionInputDialog`   | `components/workflow-modal/` | Dialog with FormField-rendered fields and local form state. Basic required validation.                                                                                                                                                          |
| `PageHeader`          | `components/page-header/`    | Title + optional description + optional breadcrumbs (shadcn Breadcrumb). Intermediate items are links, last item is current page.                                                                                                               |

### UI Primitives (shadcn)

badge, breadcrumb, button, card, checkbox, command (cmdk), dialog, input, label, popover, select, separator, sheet, switch, table, textarea, tooltip, alert-dialog

## Key Patterns & Gotchas

- **useDataTable data is set imperatively** — `table._setData(data, count)` and `table._setLoading(isLoading, isFetching)`. NOT passed as options.
- **useSelection methods vs booleans** — `isAllSelected(allKeys)` needs the full key list. It's a method, not a computed boolean.
- **AsyncCombobox uses `shouldFilter={false}`** — cmdk client-side filtering is disabled. Server filters via queryFn search param.
- **AsyncCombobox query fires only when open** — `enabled: queryEnabled && open`. No prefetching.
- **useChooser: keys in, projected values out** — `open(string[])` takes IDs. `mapSelected(TData) → TValue` runs only at confirm. Never used for equality — `rowKey` handles that.
- **TreeTable calls `toggleNode`, not `toggleRow`** — `toggleNode` applies selection policy before updating useSelection.
- **useWorkflowActions pipeline** — `idle → confirm → input → executing → idle`. Steps are skipped if not configured on the action.
- **ConfirmDialog prevents auto-close** — `e.preventDefault()` on AlertDialogAction. Consumer closes after async operation completes.
- **shadcn cn import path** — newly installed shadcn components generate `@/lib/utils`. Must change to relative import like `../../lib/utils`.
- **pnpm dlx** — use instead of npx. Always `cd ../..` back to root after working in a package.

## Implementation Status

| Phase                                                                    | Status        |
| ------------------------------------------------------------------------ | ------------- |
| Phase 1: Foundation Hooks                                                | Done + tested |
| Phase 2: Form System (incl. AsyncCombobox)                               | Done + tested |
| Phase 3: Table System                                                    | Done + tested |
| Phase 4: TreeTable + Chooser                                             | Done + tested |
| Phase 5: Workflow + Shared                                               | Done + tested |
| Phase 6: P2 Contracts (column pinning, grouped headers, expandable rows) | Deferred      |

## TODOs

- Move `dataHistorySchema` from master-setting to `@nhcs/types` (shared across domain schemas)
- Phase 6 P2 contracts
- Reference Implementations (Company, Employee pages wiring all components together)

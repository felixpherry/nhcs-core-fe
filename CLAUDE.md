# NHCS Core FE

## What is this?

New Human Capital System (NHCS) frontend — migrating from Nuxt 2/Vue 2 to Next.js + tRPC + TypeScript + Turborepo.

## Monorepo Structure

```
packages/
├── types/          # @nhcs/types — Zod schemas, envelope, shared types
├── registries/     # @nhcs/registries — policy table, procedure registry
├── api/            # @nhcs/api — tRPC routers, backendFetch (internal), errors
│   └── src/
│       ├── backend-fetch.ts    # Internal HTTP primitive. NOT exported.
│       ├── errors.ts           # BackendError, TimeoutError, etc.
│       ├── trpc/               # tRPC init, context, procedures
│       ├── routers/            # All tRPC routers by domain
│       │   ├── auth/           # Login, logout
│       │   └── organization-development/
│       │       └── company/
│       └── root.ts             # appRouter combining all feature routers
├── features/       # @nhcs/features — React components, hooks, page layouts
├── config/         # @nhcs/config — shared tsconfig, (eslint/prettier at root)
└── hcm-ui/         # @nhcs/hcm-ui — reusable UI components & hooks
    └── src/
        ├── components/
        │   ├── data-table/     # DataTable compound component
        │   │   ├── data-table.tsx        # DataTable, DataTableContent, DataTablePagination, DataTableToolbar, etc.
        │   │   ├── column-types.ts       # createColumns, ColumnConfig, sortingToOrderBys
        │   │   └── cell-renderers.tsx    # StatusBadgeCell, DateCell, NumberCell
        │   ├── filter-panel/   # FilterPanel compound component
        │   │   ├── filter-panel.tsx      # FilterPanel, FilterPanelFields, FilterPanelActions, FilterPanelFieldToggle
        │   │   └── index.ts             # Barrel export
        │   ├── form-field/     # Form field components & types
        │   │   ├── types.ts             # FormFieldConfig union, FieldOption, MultiDisplayMode, AsyncComboboxQueryParams, PaginatedFieldOptions
        │   │   ├── form-field.tsx        # FormField renderer (delegates to renderers.tsx + AsyncComboboxField)
        │   │   ├── renderers.tsx         # Individual field type renderers (text, number, select, checkbox, switch, textarea, date)
        │   │   └── async-combobox-field.tsx  # AsyncComboboxField component (single/multi mode, initialOptions, 3 display modes)
        │   ├── chooser-dialog/  # ChooserDialog compound component
        │   │   └── chooser-dialog.tsx   # Dialog shell for useChooser (confirm/cancel, tooltip-disabled, selection count)
        │   ├── tree-table/      # TreeTable compound component
        │   │   └── tree-table.tsx       # TreeTable, TreeTableToolbar, TreeTableSearch, TreeTableActions
        │   └── ui/              # shadcn/ui primitives
        │       ├── badge.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── checkbox.tsx
        │       ├── command.tsx          # cmdk Command (shadcn) — searchable keyboard-navigable list
        │       ├── dialog.tsx
        │       ├── input.tsx
        │       ├── label.tsx
        │       ├── popover.tsx          # Radix Popover (shadcn)
        │       ├── select.tsx
        │       ├── separator.tsx
        │       ├── sheet.tsx
        │       ├── switch.tsx
        │       ├── table.tsx
        │       ├── textarea.tsx
        │       ├── tooltip.tsx          # Radix Tooltip (shadcn)
        │       └── index.ts
        ├── hooks/
        │   ├── use-data-table.ts         # Core table state hook (pagination, sorting, visibility, selection)
        │   ├── use-remote-table-query.ts # Syncs tRPC query result → useDataTable (+ buildTableInput helper)
        │   ├── use-selection.ts          # Row selection state (multi/single mode)
        │   ├── use-crud-form.ts          # CRUD form sheet state management
        │   ├── use-filter.ts             # Filter state management
        │   ├── use-field-visibility.ts   # Field visibility toggle with localStorage persistence
        │   ├── use-debounce.ts           # Debounce a value by N ms (used by AsyncComboboxField)
        │   ├── use-chooser.ts            # Modal selection dialog lifecycle (open/close, snapshot/revert, row cache, mapSelected)
        │   └── use-tree-table.ts         # Tree flattening, expand/collapse, selection policies, search highlight/filter
        └── index.ts             # Public exports
```

## Key Architecture Rules

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

## hcm-ui Architecture (Design Doc v4.4)

### useDataTable

Core hook managing table state. Does NOT accept data/loading as options — those are set imperatively:

```ts
const table = useDataTable<Company>({
  columns,
  getRowId: (row) => String(row.companyId),
  defaultPageSize: 10,
  selection: { mode: 'multi' },
});

// Data is set imperatively (usually by useRemoteTableQuery):
table._setData(data, totalCount);
table._setLoading(isLoading, isFetching);
```

**Returns:** page, pageSize, sorting, selection, visibleColumns, isEmpty, orderBys, and all setters.

### useRemoteTableQuery

Void hook that syncs a tRPC query result into a `useDataTable` instance via `_setData`/`_setLoading` effects:

```ts
useRemoteTableQuery({
  table,
  queryResult: trpcQuery, // { data, isLoading, isFetching }
  extractData: (res) => ({ data: res.data, totalCount: res.count }),
});
```

`buildTableInput(table)` builds the request body for the backend (page, limit, orderBys, filters).

### useSelection

Row selection state (multi/single mode). Always called unconditionally inside useDataTable (Rules of Hooks).

- `isAllSelected(allKeys)` and `isPartiallySelected(allKeys)` are **methods** (not booleans) — they need the full key list to compute.
- `toggleRow(key)`, `toggleAll(allKeys)`, `clear()`, `selectKeys(keys)`, `replaceSelection(keys)` for mutations.
- `state.selectedKeys`, `state.count`, `state.isEmpty` for reading.

### useFilter

Filter state management with draft/applied pattern:

```ts
const filter = useFilter({
  defaultValues: { code: '', name: '', status: '' as Flag },
});

filter.draft; // Current draft values (user is editing)
filter.applied; // Applied filter values (sent to backend)
filter.isDirty; // Draft differs from applied
filter.activeCount; // Number of non-default applied filters
filter.hasActiveFilters;
filter.setDraftFieldValue('code', 'ACM');
filter.applyDraft(); // Draft → Applied
filter.resetDraft(); // Applied → Draft (discard edits)
filter.resetApplied(); // Reset to defaults
filter.resetFields(['code', 'name']); // Reset specific fields to defaults
```

### useFieldVisibility

Field visibility toggle with localStorage persistence:

```ts
const visibility = useFieldVisibility({
  scopeKey: 'company-filter',
  allFieldIds: ['code', 'name', 'status'],
  defaultVisibleFieldIds: ['code', 'name'], // optional
  onFieldsHidden: (ids) => filter.resetFields(ids), // resetOnHide wiring
});

visibility.visibleIds; // Set<string>
visibility.isVisible(id); // boolean
visibility.toggle(id); // show/hide
visibility.showAll();
visibility.hideAll();
visibility.totalCount; // total number of fields
visibility.areAllVisible; // boolean
```

### useDebounce

Tiny hook that delays a value by N ms. Used internally by AsyncComboboxField.

```ts
const debouncedSearch = useDebounce(search, 300);
```

Returns the latest value only after `delay` ms of inactivity. Uses `useState` + `useEffect` + `setTimeout` with cleanup.

### AsyncComboboxField (Design Doc v4.4 §7.1)

Fully implemented async-combobox renderer. Replaces the old placeholder in form-field.tsx.

- **Two modes:** `mode: 'single'` (close-on-select, string value) or `mode: 'multi'` (stay-open, checkmarks, string[] value)
- **Three multi display modes:** `multiDisplayMode: 'count' | 'inline-chips' | 'chips-below'`
  - `count`: "3 items selected" — clean, no overflow
  - `inline-chips`: chips inside trigger with × on hover, overflow shows "+N more"
  - `chips-below`: trigger shows "N selected", chips in wrap area below trigger
- **initialOptions:** Pre-resolved option(s) seeded into internal `Map<string, FieldOption>` cache. Solves cold-start label problem (e.g., item on page 10 of paginated list). Fetched options merge in, de-dup by value, fetched wins on conflict.
- **showToggleAll:** Optional button in multi-mode popup. Operates on visible (filtered) options only. Respects maxSelections.
- **maxSelections:** Visually disables remaining unselected options when limit reached.
- **Debounced search:** `useDebounce(search, debounceMs)` → queryKey changes → useQuery fires.
- **shouldFilter={false}** on Command — server does filtering via queryFn, not cmdk client-side.
- **Dependency gating:** `isQueryEnabled` + dependency values in queryKey for automatic refetch.
- **Query only fires when popup is open:** `enabled: queryEnabled && open`.

### useChooser

Modal selection dialog lifecycle hook. Manages open/close, snapshot/revert on cancel, row object cache, and projected results.

```ts
const chooser = useChooser<Company, CompanyFormValue>({
  mode: 'single',
  required: true,
  rowKey: (row) => String(row.id),
  mapSelected: (row) => ({ id: row.id, code: row.code, name: row.name }),
  onConfirm: (result) => {
    /* result.selectedKeys, result.selectedItems */
  },
});

chooser.open(['1']); // Open with preselected keys
chooser.cancel(); // Revert selection to pre-open snapshot
chooser.confirm(); // Returns false if required + empty
chooser.canConfirm; // Boolean for disabled button state
chooser.selection; // UseSelectionReturn — pass to DataTable
chooser.trackRows(rows); // Feed table data into row cache
chooser.remove(key); // For external chip × buttons
chooser.result; // Last confirmed ChooserResult<TValue> | null
```

- **rowKey** extracts unique string ID from TData. Used for ALL equality checks (string === string).
- **mapSelected** projects TData → TValue. Called ONLY at confirm time. Never used for comparison.
- **Row cache** (`Map<string, TData>`) accumulates rows via `trackRows()`. Cleared on each `open()`.
- **Snapshot/revert:** `open()` snapshots current keys. `cancel()` restores via `replaceSelection()`.

### ChooserDialog

Thin dialog shell that wires `useChooser` to Radix Dialog. Consumer provides content (DataTable) as children.

- Confirm button shows count: "Confirm (3)"
- When `canConfirm: false`, confirm button is disabled with Tooltip: "Please select at least 1 item"
- Dismissing dialog (overlay click, Escape) triggers cancel (revert)
- No close × button — uses Cancel/Confirm explicitly

### useTreeTable

Tree flattening + expand/collapse + selection policies + search modes.

```ts
const treeTable = useTreeTable<Org>({
  nodes: orgTree, // TreeNode<TData>[]
  selectionPolicy: 'cascade', // 'independent' | 'cascade' | 'leaf-only' | SelectionPolicyFn
  selectionMode: 'multi',
  searchFn: (data, term) => data.name.includes(term),
  searchMode: 'highlight', // 'highlight' | 'filter'
});
```

**Selection policies:**

- `independent` — each node independent, delegates to `selection.toggleRow()`
- `cascade` — check selects self + all descendants + all ancestors. Uncheck deselects self + descendants, deselects ancestors if no siblings remain.
- `leaf-only` — only leaf nodes (no children) can be selected
- `SelectionPolicyFn` — custom function receives `{ toggledNode, wasSelected, selectedKeys, flatNodes, getAncestorIds, getDescendantIds }`, returns new `Set<string>`

**Search modes:**

- `highlight` — full tree visible, matched nodes get `isMatched: true`, ancestors auto-expand
- `filter` — non-matching branches hidden, only matched + ancestor paths shown

**Key outputs:** `flatNodes` (visible), `allFlatNodes` (all), `toggleNode()` (policy-aware), `toggleExpand()`, `expandAll()`, `collapseAll()`, `expandToNode()`, `getAncestorIds()`, `getDescendantIds()`

### TreeTable Component

Renders `flatNodes` from useTreeTable as a table with:

- Indentation (first column only, `depth * indentPx`)
- Expand/collapse chevron toggles (rotates 90° on expand)
- Selection checkboxes calling `toggleNode` (policy-aware, NOT `toggleRow`)
- Search highlight via `matchHighlightClass` + `data-matched` / `data-on-match-path` attributes
- No sorting (tree order is structural), no pagination (full tree loaded)
- Subcomponents: `TreeTableToolbar`, `TreeTableSearch`, `TreeTableActions`

### FormField Types (Design Doc v4.4 §7.1)

All field configs extend `FormFieldConfigBase<TForm>`. The union is `FormFieldConfig<TForm>`:

- **TextFieldConfig** — text/password with optional min/maxLength
- **NumberFieldConfig** — min, max, step
- **SelectFieldConfig** — static `options: FieldOption[]`
- **AsyncComboboxFieldConfig** — async options with queryFn, mode, multiDisplayMode, initialOptions, showToggleAll, maxSelections
- **CheckboxFieldConfig** — checkboxLabel
- **SwitchFieldConfig** — switchLabel
- **TextareaFieldConfig** — rows, maxLength
- **DateFieldConfig** — date picker
- **CustomFieldConfig** — `render` function for fully custom fields

**Conditional logic:** `visibleWhen`, `disabledWhen`, `requiredWhen` — all take `(values: TForm) => boolean`.

**Dependency gating (async lookups):** `dependsOn`, `isQueryEnabled`, `onDependencyChange: 'clear' | 'refetch' | 'keep-if-valid'`.

### useCrudForm

CRUD form sheet state management using `useReducer` for predictable transitions:

- States: `idle`, `loading`, `ready`, `submitting`, `submitted`
- Actions: `open(mode)`, `close()`, `setLoading()`, `setReady(data)`, `submit()`, `submitSuccess()`, `submitError()`
- Stale request guard: ignores responses from superseded open() calls

### DataTable Component

Compound component pattern:

```tsx
<DataTable table={table}>
  <DataTable.Toolbar>
    <DataTable.Search />
    <DataTable.Actions>...</DataTable.Actions>
  </DataTable.Toolbar>
  <DataTable.Content />
  <DataTable.Pagination />
</DataTable>
```

### FilterPanel Component

Compound component for collapsible filter forms:

```tsx
<FilterPanel filter={filter}>
  <FilterPanel.Fields visibility={visibility}>
    {(visibleFields) => visibleFields.map(...)}
  </FilterPanel.Fields>
  <FilterPanel.Actions>
    <FilterPanel.FieldToggle visibility={visibility} />
  </FilterPanel.Actions>
</FilterPanel>
```

## TODOs

- Move `dataHistorySchema` from master-setting to `@nhcs/types` (shared across domain schemas)
- Implement Phase 5: Workflow + Shared components (useWorkflowModal, WorkflowModal, StatusBadge, ConfirmDialog)
- Implement Phase 6 (P2): Column pinning, grouped headers, expandable rows

## Testing Strategy

- **Testing Trophy approach** (Kent C. Dodds): Vitest + RTL + MSW for unit/integration, Playwright for E2E
- Co-located tests: each hook/component has `*.test.ts(x)` alongside it
- Hooks tested with `renderHook` + `act`
- Components tested with `render` + `userEvent` + mock data
- Async components (useQuery): use real timers + `debounceMs: 0` in test configs. Avoid `vi.useFakeTimers()` with Radix/cmdk — causes timeouts.
- QueryClientProvider wrapper for components that use `useQuery`
- Mock `useChooser`/`useTreeTable` returns when testing ChooserDialog/TreeTable (isolate UI from hook logic)

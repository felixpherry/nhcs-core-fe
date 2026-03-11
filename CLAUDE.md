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
        │   └── data-table/     # DataTable compound component
        │       ├── data-table.tsx        # DataTable, DataTableContent, DataTablePagination, DataTableToolbar, etc.
        │       └── column-types.ts       # createColumns, ColumnConfig, sortingToOrderBys
        ├── hooks/
        │   ├── use-data-table.ts         # Core table state hook (pagination, sorting, visibility, selection)
        │   ├── use-remote-table-query.ts # Syncs tRPC query result → useDataTable (+ buildTableInput helper)
        │   ├── use-selection.ts          # Row selection state (multi/single mode)
        │   ├── use-crud-form.ts          # CRUD form sheet state management
        │   └── use-filter.ts             # Filter state management
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

## hcm-ui Architecture (Design Doc v4.2)

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
  queryResult: trpcQuery,    // { data, isLoading, isFetching }
  extractData: (res) => ({ data: res.data, totalCount: res.count }),
});
```

`buildTableInput(table)` builds the request body for the backend (page, limit, orderBys, filters).

### useSelection

Row selection state (multi/single mode). Always called unconditionally inside useDataTable (Rules of Hooks).

- `isAllSelected(allKeys)` and `isPartiallySelected(allKeys)` are **methods** (not booleans) — they need the full key list to compute.
- `toggleRow(key)`, `toggleAll(allKeys)`, `clear()` for mutations.
- `state.selectedKeys`, `state.count`, `state.isEmpty` for reading.

### DataTable Compound Component

```tsx
<DataTable table={table} onRowClick={handleClick}>
  <DataTableToolbar>
    <DataTableSearch value={search} onChange={setSearch} />
    <DataTableActions><Button>Add</Button></DataTableActions>
  </DataTableToolbar>
</DataTable>
<DataTablePagination table={table} />
```

- `DataTableContent` wraps the `<Table>` with `overflow-x-auto` for wide table support.
- Selection checkboxes auto-render when `table.selection` is not null.
- Sorting is triggered by clicking sortable column headers.

### Testing hcm-ui Hooks

Tests use a `renderSeededTable` helper pattern:

```ts
function renderSeededTable(overrides?) {
  const hookResult = renderHook(() => useDataTable<T>({ columns, getRowId, ...overrides }));
  act(() => {
    hookResult.result.current._setData(data, totalCount);
    hookResult.result.current._setLoading(false, false);
  });
  return hookResult;
}
```

For `useRemoteTableQuery`, compose both hooks inside a single `renderHook`:

```ts
const { result } = renderHook(() => {
  const table = useDataTable({ columns, getRowId });
  useRemoteTableQuery({ table, queryResult, extractData });
  return table;
});
```

## Backend API Patterns

- List: `POST /entity/sort/search?page=X&limit=Y` with flat filter body + `orderBys`
- Change status: `POST /entity/changestatus?id=X&status=T|F`
- Delete: `POST /entity/delete/{id}`
- Sort body uses `orderBys: [{ item1: string, item2: boolean }]`
- Login: `POST /authentication/api/auth/login` with { userId, password (AES encrypted), browser, browserVersion, ipAddress }
- Logout: `POST /authentication/api/auth/logout` with { accessId } + auth headers
- Login response is FLAT — no nested token/user objects. Fields: userId, userName, userLevel, accessToken, accessId, refreshToken, fgEss, fgCore, fgMss (not a menuGroups array)
- Login envelope is FLAT — { statusCode, isSuccess, isGranted, result, message, error } — no outer result wrapper

## Auth

- Password is AES-CBC encrypted server-side using AUTH_SECRET env var before sending to backend
- encryptPassword uses zero IV, PKCS7 padding, CryptoJS
- Login/logout use publicProcedure (no session required)
- Auth headers for authenticated calls: `Authorization: Bearer {token}` + `user-id: {userId}_{accessId}_{userLevel}`

## Frontend Patterns

- Forms: TanStack Form + Zod validation + shadcn Field components
- tRPC client: httpBatchLink with superjson transformer
- tRPC route handler: `apps/web/src/app/api/trpc/[trpc]/route.ts`
- Provider: TRPCProvider wraps app in layout.tsx (QueryClient + trpc.Provider)
- Pages are thin server components, forms/interactive stuff uses 'use client'

## Conventions

- Commit messages: conventional commits (feat, fix, chore, refactor)
- Package scope: `@nhcs/`
- Workspace deps: `"workspace:*"`
- Package manager: pnpm
- Type imports: always use `import type` when importing types only

## Old System Reference

The old Nuxt 2 codebase is at `NHCS_Core` repo on the same GitHub account.
Always compare new implementations with the old system — check types, routing,
business logic, and API shapes against the existing codebase.

## TODOs

- Move dataHistorySchema to @nhcs/types (shared across all domains)
- Extract orderBys to @nhcs/types as shared schema
- Refactor auth header construction into tRPC context layer (so protectedProcedure auto-attaches headers)
- Refactor Field components for reusability across forms
- Implement session management (store tokens after login)
- Align AsyncComboboxFieldConfig.queryFn with design doc v4.2 signature: `(params: { search, values?, pageParam? }) => Promise<Option[] | { options, nextCursor }>`
- Add `resetOnHide` to FormFieldConfigBase (§7.1/§6.3.1)
- Build FilterPanel (P0 per §6.2, §16.1) — consumes useFilter + useFieldVisibility + FormFieldConfig[]

## Testing Strategy

- Testing Trophy (Kent C. Dodds): mostly integration, some unit, few E2E
- Tools: Vitest + @testing-library/react + MSW (unit/integration), Playwright (E2E)
- Tests are co-located: `useSelection.ts` → `useSelection.test.ts` (same folder)
- Test in parallel: every hook/component gets tests built alongside it, not after
- Mock only network boundaries (MSW for tRPC). Never mock child components. Never shallow render.
- Coverage targets: ~90% hooks, ~95% utilities, ~70% components, ~80% routers, ~50% pages
- CI: lint → typecheck → vitest → playwright

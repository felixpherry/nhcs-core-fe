# NHCS Core FE — Architecture

Full system design document for the New Human Capital System frontend.

## Overview

Migrating from Nuxt 2/Vue 2 to Next.js + tRPC + TypeScript + Turborepo. The system is NOT multi-tenant — it's used by one company with multiple sub-companies. "Company" is readonly data embedded into employee records.

## Stack

- **Framework:** Next.js 16 (App Router, React Compiler)
- **API Layer:** tRPC v11 (React Query)
- **Language:** TypeScript (strict, no `any`)
- **Styling:** Tailwind CSS v4 + shadcn/ui (radix-nova style)
- **Forms:** TanStack Form + Zod
- **Tables:** TanStack Table via DiceUI (`@diceui/data-table`)
- **Validation:** Zod
- **Monorepo:** Turborepo + pnpm workspaces
- **Testing:** Vitest + React Testing Library (Kent C. Dodds Testing Trophy)
- **Deployment:** Docker (standalone Node.js for Next.js)

## Monorepo Package Graph

```
@nhcs/types <- @nhcs/registries <- @nhcs/api <- apps/web
```

### Package Responsibilities

| Package      | Import             | Responsibility                                                                   |
| ------------ | ------------------ | -------------------------------------------------------------------------------- |
| `types`      | `@nhcs/types`      | Zod schemas, envelope types, shared types                                        |
| `registries` | `@nhcs/registries` | Policy table, procedure registry                                                 |
| `api`        | `@nhcs/api`        | tRPC routers, backendFetch (INTERNAL), errors                                    |
| `config`     | `@nhcs/config`     | Shared tsconfig                                                                  |
| `web`        | N/A (app)          | Next.js app. Owns all UI: components, hooks, forms, pages, routing, tRPC client. |

## Backend Integration

### backendFetch

Internal HTTP primitive in `@nhcs/api`. NEVER exported. Only tRPC routers use it.

### Envelope Shape

```ts
{ isSuccess: boolean, result: { data: T[], count: number }, message: string }
```

Note: `result` not `data` at the top level.

### Auth Headers

```
Authorization: Bearer {token}
user-id: {userId}_{accessId}_{userLevel}
```

### Data Conventions

- Backend fields are nullable — always `.nullable()` in Zod
- `Flag` type: `'T'` / `'F'` not booleans
- URLs built with `query-string` `stringifyUrl()`

## Procedure Registry

Every tRPC procedure is registered with `registerProcedure()` before use:

```ts
registerProcedure('company.list', {
  mode: 'proxy',
  type: 'list',
  criticality: 'degradable', // or 'critical'
});
```

Policy is derived: `requestClass = {mode}:{type}:{criticality}` → lookup in policy table.

## Router Organization

```
routers/
├── auth/                    # Login/logout (publicProcedure)
├── common/                  # Shared chooser-backing endpoints
│   ├── company-group/       # /master/organization-development/all?source=company_group
│   └── area/                # /master/area/all
└── organization-development/
    └── company/             # CRUD + changeStatus
```

Common routers serve chooser dialogs used across multiple domains.

## Form Architecture

### Dialog Lifecycle: `useCrudDialog<TData>`

Headless hook managing open/close, mode (create/edit/view), editData, loading, and dirty guard. Does NOT own form values — TanStack Form does.

Key features:

- State reducer pattern for intercepting transitions
- Lifecycle callbacks (`onIsOpenChange`, `onModeChange`)
- Race condition guard for `openEditById` (monotonic counter)
- `syncIsDirty(boolean)` — called by CrudFormBridge to sync TanStack Form's dirty state into the close guard

### Form Bridge: `CrudFormBridge`

Creates TanStack Form via `useAppForm` (from `createFormHook`). Syncs `isDirty` to `useCrudDialog`. Renders a `<form>` element with an `id` so CrudDialog's footer button can target it via `form={formId}`.

### Field Composition Pattern

```tsx
<form.AppField name="companyCode">
  {(field) => (
    <FieldWrapper label="Company Code" required>
      <Input {...getInputProps(field, { disabled: isView })} />
    </FieldWrapper>
  )}
</form.AppField>
```

- `FieldWrapper` reads `useFieldContext()` for label/error/required chrome
- Prop getters (`getInputProps`, `getSelectProps`, `getTextareaProps`, `getCheckboxProps`, `getDateProps`, `getChooserProps`) wire input components
- Choosers use `getChooserProps<T>(field)` for rich object value/onChange

### Key Form Patterns

- **Rich objects in form state** — Choosers store `{ id, code, name }`, flatten at submit
- **Cascading clears** — `usePrevious` + conditional `form.setFieldValue` (no `useEffect`)
- **Conditional visibility** — plain JSX conditionals
- **No FormBuilder / FormFieldConfig** — compose fields directly with JSX

### DataTable (DiceUI)

Source-installed via shadcn CLI from `@diceui/data-table`. Built on TanStack Table. Features: URL-synced pagination/sorting via nuqs, column filters, sort lists, column visibility, action bar on selection.

### Feature Components (Choosers)

Live in `apps/web/src/components/`. Receive data via props — NO tRPC dependency:

```tsx
<CompanyGroupChooser
  listData={data}
  listCount={count}
  isLoading={loading}
  onQueryChange={setQuery}
  validateCode={fn}
/>
```

Consumer wires the tRPC query at the page level.

## Page Architecture (Company Page Example)

```
page.tsx                    # Next.js page shell
company-list.tsx            # DataTable + form dialog + confirm dialogs
columns.tsx                 # ColumnDef<Company>[] with DataTableColumnHeader
company-form-dialog.tsx     # CrudDialog + CrudFormBridge + form.AppField composition
company-filter-dialog.tsx   # Advanced filter with choosers
```

Pattern: page owns tRPC queries + mutations. Components receive data and callbacks.

## Testing Strategy

Kent C. Dodds Testing Trophy:

- **Unit/Integration:** Vitest + React Testing Library + MSW
- **E2E:** Playwright (future)
- **Co-located:** `x.test.ts` next to `x.ts`

Key testing patterns:

- `debounceMs: 0` in test configs to avoid fake timer issues with Radix
- Mock `useChooser`/`useTreeTable` return objects for component tests
- `defaultProps()` as function (not const) for fresh mocks per test

## Design System

Based on Figma ESS/MSS design:

- Primary: Blue (`oklch(0.555 0.245 266.68)`)
- Semantic: `--success` (#0DB14B), `--warning` (#F26529)
- Radius: 8px (`0.5rem`)
- Font: Inter (via Next.js `--font-sans`)
- Blue-tinted grays for foreground/muted/border

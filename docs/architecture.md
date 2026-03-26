# NHCS Core FE — Architecture

Full system design document for the New Human Capital System frontend.

## Overview

Migrating from Nuxt 2/Vue 2 to Next.js + tRPC + TypeScript + Turborepo. The system is NOT multi-tenant — it's used by one company with multiple sub-companies. "Company" is readonly data embedded into employee records.

## Stack

- **Framework:** Next.js 15 (App Router)
- **API Layer:** tRPC v11 (React Query)
- **Language:** TypeScript (strict, no `any`)
- **Styling:** Tailwind CSS v4 + shadcn/ui (radix-nova style)
- **Validation:** Zod
- **Monorepo:** Turborepo + pnpm workspaces
- **Testing:** Vitest + React Testing Library (Kent C. Dodds Testing Trophy)
- **Component Dev:** Storybook 8
- **Deployment:** Docker (nginx for Storybook, standalone Node.js for Next.js)

## Monorepo Package Graph

```
@nhcs/types <- @nhcs/registries <- @nhcs/api <- apps/web

```

### Package Responsibilities

| Package      | Import             | Responsibility                                 |
| ------------ | ------------------ | ---------------------------------------------- |
| `types`      | `@nhcs/types`      | Zod schemas, envelope types, shared types      |
| `registries` | `@nhcs/registries` | Policy table, procedure registry               |
| `api`        | `@nhcs/api`        | tRPC routers, backendFetch (INTERNAL), errors  |
| `config`     | `@nhcs/config`     | Shared tsconfig                                |
| `web`        | N/A (app)          | Next.js app. Owns tRPC client, pages, routing. |

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

## hcm-ui Component Architecture

### Design Doc: v4.4

The component library follows a headless hook + compound component pattern:

- **Hooks** manage state and logic (useSelection, useDataTable, useChooser, useTreeTable, useWorkflowActions)
- **Components** handle rendering (DataTable, ChooserDialog, TreeTable, WorkflowModalFooter)
- Hooks are framework-agnostic. Components use shadcn/ui primitives.

### Key Patterns

**Imperative data setting (useDataTable):**

```ts
table._setData(data, count); // NOT passed as options
table._setLoading(isLoading);
```

**Selection methods, not booleans:**

```ts
state.isAllSelected(allKeys); // Needs full key list
state.isPartiallySelected(allKeys);
```

**Async combobox server filtering:**

```ts
<Command shouldFilter={false}>   // cmdk client filtering disabled
// queryFn receives search param, server does filtering
```

**Chooser: keys in, projected values out:**

```ts
chooser.open(['1', '2'])         // Takes IDs
mapSelected(TData) → TValue      // Runs only at confirm
rowKey(row) === selectedKey      // String equality for matching
```

**TreeTable policy-aware selection:**

```ts
toggleNode(id); // Applies selection policy
// NOT selection.toggleRow(id)   // Bypasses policy
```

**Workflow pipeline:**

```
idle → confirm → input → executing → idle
// Steps are skipped if not configured on the action
```

### Feature Components (Reusable Choosers)

Live in `@nhcs/web`. Receive data via props — NO tRPC dependency:

```tsx
<CompanyGroupChooser
  listData={data} // Consumer wires tRPC query
  listCount={count}
  isLoading={loading}
  onQueryChange={setQuery} // Notifies when search/page changes
  validateCode={fn} // Consumer handles code validation
/>
```

Rationale: tRPC client lives in `apps/web`. Shared packages can't import app-specific modules.

## Page Architecture (Company Page Example)

```
page.tsx                    # Next.js page shell
company-list.tsx            # DataTable + form dialog + confirm dialogs
columns.tsx                 # createCompanyColumns(actions) — 19 columns
company-form-dialog.tsx     # Add/Edit/View dialog with choosers
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

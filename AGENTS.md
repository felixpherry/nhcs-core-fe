# NHCS Core FE — Agent Instructions

Read this file top to bottom every session. This is the single source of truth.

## Role

You are building the NHCS (New Human Capital System) frontend — a migration from Nuxt 2/Vue 2 to Next.js + tRPC + TypeScript + Turborepo. Not multi-tenant — one company with multiple sub-companies.

## Stack

Next.js 16 (App Router, React Compiler), tRPC v11, TypeScript (strict, no `any`), Tailwind CSS v4, shadcn/ui, TanStack Form + Zod, TanStack Table (via DiceUI), Turborepo + pnpm, Vitest + RTL, Docker.

## Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Build all packages
pnpm lint                   # Lint
pnpm format                 # Format

# Testing (from repo root)
pnpm vitest run apps/web/src/path/to/file.test.ts

# Docker
docker compose up --build

# shadcn (from apps/web — components land in src/components/ui/)
cd apps/web && pnpm dlx shadcn@latest add <component> && cd ../..
```

## Package Boundaries (HARD RULES — never break)

```
@nhcs/types <- @nhcs/registries <- @nhcs/api <- apps/web
```

1. `backendFetch` is INTERNAL to `@nhcs/api` — never export it.
2. No circular dependencies — web depends on api, never reverse.
3. Common chooser endpoints live under `routers/common/`.
4. All UI components, hooks, and form utilities live in `apps/web/src/` — no separate UI package.

## Hard Rules (never break)

- **No `any` type** — use `unknown` with type guards, or proper types.
- **Backend envelope:** `{ isSuccess, result: { data: T[], count } }` — note `result` not `data`.
- **Backend fields are nullable** — always `.nullable()` in Zod schemas.
- **`Flag` type** — backend uses `'T'` / `'F'` not booleans.
- **Every procedure registered** — `registerProcedure()` with mode/type/criticality before use.
- **Criticality values:** `'critical'` or `'degradable'` only.
- **Policy is derived** — `requestClass = {mode}:{type}:{criticality}` → lookup in policy table.
- **Auth headers:** `Authorization: Bearer {token}` + `user-id: {userId}_{accessId}_{userLevel}`.
- **Login/logout use publicProcedure** — no session context.
- **`query-string`** — use `stringifyUrl()` for URL building.
- **Conventional commits** — `feat`, `fix`, `chore`, `refactor`, `test`, `style`. Title only, no description body.
- **`import type`** for type-only imports.
- **`pnpm dlx`** not `npx`.
- **Co-located tests** — `x.test.ts` next to `x.ts`, not in `__tests__/`.
- **Co-located stories** — `x.stories.tsx` next to the component.
- **No `useCallback`/`useMemo`** — React Compiler handles memoization. Only use `useRef` for genuinely mutable cross-render state (race condition guards, previous value tracking, side-channel communication).

## Form Architecture

Forms use TanStack Form + Zod. The system has three layers:

1. **`useCrudDialog<TData>`** — dialog lifecycle (open/close, mode, editData, dirty guard). Does NOT own form values.
2. **`CrudFormBridge`** — creates TanStack Form via `useAppForm`, syncs `isDirty` to `useCrudDialog`, wraps children in `<form>`.
3. **`form.AppField` + `FieldWrapper` + prop getters** — compose fields. `FieldWrapper` reads field context for label/error chrome. Prop getters (`getInputProps`, `getSelectProps`, etc.) wire input components.

Key patterns:

- **Rich objects in form state** — Choosers store `{ id, code, name }`, flatten at submit via `toSubmitPayload()`.
- **Cascading clears** — use `usePrevious` + conditional `form.setFieldValue` in the component body. No `useEffect`.
- **Conditional visibility** — plain JSX conditionals: `{pcnType && (...)}`.
- **CrudDialog** — submit button uses `form={formId}` HTML attribute to target the `<form>` in `CrudFormBridge`.

## DataTable

Uses DiceUI's `@diceui/data-table` (shadcn-style install, source in project). Built on TanStack Table. URL-synced pagination/sorting via nuqs. Components: `DataTable`, `DataTableToolbar`, `DataTableSortList`, `DataTablePagination`, `DataTableColumnHeader`, `DataTableViewOptions`.

## Domain Knowledge (can't infer from code)

- Company save: `companyId: 0` for create, real ID for update. Single `POST /company/save` endpoint.
- Area chooser: `disableCodeInput: true` — no code typing, only dialog selection.
- Area selection cascades: populates City, District, Sub District, Zip Code fields.
- Trustee menu selection: check cascades UP (ancestors), uncheck cascades DOWN (descendants). Use custom `SelectionPolicyFn`.
- Old system reference: `felixpherry/NHCS_Core` repo on GitHub. Compare types, routing, business logic.

## Key Implementation Patterns

- **useSelection methods** — `isAllSelected(allKeys)` needs full key list. It's a method, not a boolean.
- **AsyncCombobox** — `shouldFilter={false}` (server filters). Query only fires when popup is open.
- **useChooser** — keys in, projected values out. `trackRows()` inside table component's useEffect, not on mount.
- **TreeTable** — call `toggleNode()` (policy-aware), NOT `selection.toggleRow()`.
- **useWorkflowActions** — pipeline: `idle → confirm → input → executing → idle`. Steps skipped if not configured.
- **ConfirmDialog** — `e.preventDefault()` on confirm action. Consumer controls close after async operation.

## Gotchas (discovered during implementation)

- Radix Popover + cmdk + useQuery conflict with `vi.useFakeTimers()`. Use `debounceMs: 0` in tests instead.
- Radix Tooltip renders content in both visible and hidden elements — use `findAllByText` not `findByText` in tests.
- AlertDialog Cancel button fires both onClick and onOpenChange — use `toHaveBeenCalled()` not `toHaveBeenCalledTimes(1)`.
- `defaultProps()` must be a function returning fresh `vi.fn()` mocks — prevents cross-test state leakage.
- Row cache in useChooser clears on `open()` — must call `trackRows()` via useEffect on data change, not just on mount.
- `useLayoutEffect` flash: when dynamically calculating visible chips, start with `measured: false` and hide container with `invisible` class until measurement completes.
- Button variant classes in tests: destructive is `bg-destructive/10`, outline is `border-border`. Check actual generated classes.
- `happy-dom` has no real layout — `offsetWidth` returns 0. Tests that depend on overflow/layout must be Storybook visual tests instead.
- Radix DialogContent renders its own Close (X) button — use `getAllByRole('button', { name: 'Close' })` and pick the last one for footer Close button tests.

## Session Workflow

1. Read this file.
2. Read `docs/implementation/<current-version>.md` — what's done, what's next.
3. Developer assigns task or agent suggests next unchecked item.
4. Read relevant section of `docs/architecture.md` for context.
5. Implement — write code, run tests/lint/type check.
6. Provide code + commit message (title only, conventional commits).
7. Check off completed items in implementation tracker.
8. Update this file if a gotcha or convention was discovered.
9. Append to `docs/decisions.md` if an implementation decision was made.

## File Index

```
AGENTS.md                              <- You are here
CLAUDE.md                              <- Points to AGENTS.md
docs/
  architecture.md                      <- Full system design
  decisions.md                         <- Append-only decision log
  implementation/
    v1.0-component-library.md          <- Phase 1-5 tracker (historical)
    v1.1-reference-implementations.md  <- Company page + future pages
```

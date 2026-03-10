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
│       │   └── organization-development/
│       │       └── company/
│       └── root.ts             # appRouter combining all feature routers
├── features/       # @nhcs/features — React components, hooks, page layouts
├── config/         # @nhcs/config — shared tsconfig, (eslint/prettier at root)
└── hcm-ui/         # @nhcs/hcm-ui — reusable UI components (planned)
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

## Backend API Patterns

- List: `POST /entity/sort/search?page=X&limit=Y` with flat filter body + `orderBys`
- Change status: `POST /entity/changestatus?id=X&status=T|F`
- Delete: `POST /entity/delete/{id}`
- Sort body uses `orderBys: [{ item1: string, item2: boolean }]`
- Login: `POST /authentication/login` with { userId, password, browser, browserVersion, ipAddress }
- Logout: `POST /authentication/logout` with { accessId } + auth headers
- Login returns: { token: { accessToken, accessId, refreshToken }, user: { userId, menus, menuGroups } }

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

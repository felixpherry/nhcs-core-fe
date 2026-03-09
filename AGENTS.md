# AI Agent Instructions

## Context

NHCS (New Human Capital System) frontend monorepo. Next.js + tRPC + Turborepo.

## Rules

- Use `import type` for type-only imports
- All Zod schema fields from backend should be `.nullable()`
- Backend envelope shape: `{ isSuccess, result: { data, count }, message }`
- Never import `backendFetch` outside of `@nhcs/api`
- Register every procedure with `registerProcedure()` before use
- Use `query-string` `stringifyUrl()` for URL building
- Use conventional commits (feat, fix, chore, refactor)
- Compare with old `NHCS_Core` repo for types and routing patterns

## Package Dependency Direction

```
@nhcs/types <- @nhcs/registries <- @nhcs/api <- @nhcs/features <- apps/web
(no reverse dependencies allowed)
```

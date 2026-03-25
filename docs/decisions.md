# Decision Log

Append-only. Records implementation-level decisions — "how" not "what."

---

## 2026-03-25 — AsyncComboboxField: useSelection internally, not external

The async-combobox component uses `useSelection` internally rather than exposing selection to the consumer. Consumer provides `mode` and gets back `string` or `string[]` through standard form `onChange`. Keeps API surface minimal — consumer never touches keys, toggle handlers, or selection state.

## 2026-03-25 — initialOptions over resolveOptions for cold-start labels

For displaying labels of items not yet fetched (e.g., item on page 10 of paginated list), chose `initialOptions` (consumer provides pre-resolved option(s)) over `resolveOptions` (component auto-fetches by ID). Rationale: no extra network call — the API response that loads the record already has display names alongside IDs.

## 2026-03-25 — useChooser: keys in, projected values out

`open(string[])` takes plain IDs, not objects. `mapSelected(TData → TValue)` runs only at confirm time. Row objects stored in `Map<string, TData>` via `trackRows()`. Equality is always `rowKey(row) === selectedKey` (string comparison). Never deep-compare objects.

## 2026-03-25 — useChooser: row cache clears on open()

Each dialog session starts with a fresh row cache. `trackRows()` must be called inside the table component via `useEffect`, not just on mount. Otherwise cache is empty after open() and confirm returns no `selectedItems`.

## 2026-03-25 — TreeTable selection: custom policy function for trustee menu

Built-in policies (independent/cascade/leaf-only) don't cover the trustee menu pattern (check cascades UP to ancestors, uncheck cascades DOWN to descendants). Added `SelectionPolicyFn` as an escape hatch — consumer gets full context (`toggledNode`, `wasSelected`, `selectedKeys`, helpers) and returns new `Set<string>`.

## 2026-03-25 — useWorkflowActions: declarative pipeline replaces swalConfirm + nested modals

Old system had 50-100 lines of button config per modal with `swalConfirm`, `useState(showReasonModal)`, and manual loading state. New system: consumer declares actions with optional `confirm` and `input` steps. Hook manages the state machine: `idle → confirm → input → executing → idle`.

## 2026-03-25 — ConfirmDialog uses AlertDialog, not Dialog

AlertDialog prevents accidental dismissal (no click-outside or Escape close). `e.preventDefault()` on AlertDialogAction prevents auto-close — consumer controls when to close after async operation completes.

## 2026-03-25 — MultiDisplayMode reduced to count | inline-chips

Originally had 3 modes (count, inline-chips, chips-below). Simplified to 2. `inline-chips` now has expand/collapse built in — shows first N chips + clickable "+N more" that expands all chips in the trigger area.

## 2026-03-25 — ChooserField: validateCode returns TValue, not TData[]

The blur validation function returns `Promise<TValue | null>` instead of raw `TData[]`. Consumer does the validation AND projection in one function. Component doesn't need to know about `mapSelected` or `TData` for the blur path.

## 2026-03-25 — Feature components (CompanyGroupChooser, AreaChooser): props-based data injection

Feature components in `@nhcs/features` receive data via props (`listData`, `listCount`, `isLoading`, `onQueryChange`) instead of calling tRPC directly. Rationale: tRPC client lives in `apps/web` — shared packages can't import from app-specific modules. Consumer wires the tRPC query at the page level.

## 2026-03-25 — Company save: companyId 0 for create, real ID for update

Single `POST /company/save` endpoint handles both create and update. Backend distinguishes by the presence of `companyId`. Create sends `companyId: 0`, update sends the original ID.

## 2026-03-25 — Common routers under routers/common/

All chooser-backing endpoints (company-group, area) live under `routers/common/`. These are shared across domains — not specific to organization-development.

## 2026-03-25 — Design system: primary color changed from near-black to blue

Aligned with Figma ESS/MSS design. `--primary` changed from `oklch(0.205 0 0)` to `oklch(0.555 0.245 266.68)`. Added `--success` (#0DB14B) and `--warning` (#F26529) semantic colors.

## 2026-03-25 — CrudDialog over CrudSheet

**Context:** Design doc §7 specified CrudSheet (side panel) for CRUD forms. During Company page implementation, user chose centered Dialog instead. The old NHCS system also used centered modals.

**Decision:** Rename the concept from CrudSheet to CrudDialog across documentation. The `useCrudForm` hook remains unchanged — it's container-agnostic. Future CRUD forms should use centered `Dialog` by default, with `Sheet` as an option for forms that benefit from side-panel layout (e.g., forms with a reference table visible behind).

**Rationale:** Centered dialogs are more natural for CRUD forms in HCM systems — they focus attention on the form. Side panels are better for supplementary information (filters, settings).

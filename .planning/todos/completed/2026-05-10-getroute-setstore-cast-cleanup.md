---
title: Clean up the `setStore` cast at `getRoute.svelte.ts:41` (pre-existing, marked OOS by Phase 71 reviewer)
priority: low
created: 2026-05-10
resolves_phase: 78
context: Captured during Phase 71 OOS triage (`71-OUT-OF-SCOPE-FINDINGS.md` row #10). The Phase 71 code reviewer flagged the `setStore` cast at `getRoute.svelte.ts:41` as IN-03 with explicit "No action required. Noted only because adjacent." Phase 71 left it untouched per reviewer guidance to avoid gold-plating; it remains a candidate for a future cleanup pass.
---

# Clean up `setStore` cast in `getRoute.svelte.ts`

`apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:41` extracts a
typed `set` reference from a Svelte writable store via a structural
cast:

```ts
const store = writable<RouteBuilder>(buildFn());
const setStore = (store as { set: (v: RouteBuilder) => void }).set;
afterNavigate(() => setStore(buildFn()));
```

The cast exists because `Readable<RouteBuilder>` (the public return
type) does not expose `set`, but the implementation needs the
writable's setter to push fresh `RouteBuilder` instances on each
afterNavigate.

## Goal

Replace the cast with a typed local handle. Three viable approaches:

1. **Direct assignment** — `const setStore: (v: RouteBuilder) => void
   = store.set;` works because `writable` returns a `Writable<T>` (which
   includes `set`), and we can keep the `Readable<T>` return type by
   only exposing the readable surface.
2. **Inline use** — `afterNavigate(() => store.set(buildFn()));` skips
   the local entirely. Loses the named-handle readability but is the
   cleanest in terms of code.
3. **Refactor to use `update`** — `store.update(() => buildFn())` is
   semantically equivalent and fits the writable API without a typed
   alias.

## Why deferred from v2.8

Phase 71 reviewer marked this `IN-03 — No action required` explicitly:
the pattern is a known idiom for narrowing a `Writable<T>` return down
to `Readable<T>`, the cast is structurally safe, and a piecemeal fix
would not match the surrounding code style. Better to fix as part of a
future "store typings" consolidation pass that addresses the full
pattern across the frontend.

## Files of interest

- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:35-44`
- Possible analog: `apps/frontend/src/lib/contexts/app/dataContext.ts`
  — same store-narrowing pattern was applied for `dataRoot`.

## Cross-references

- `.planning/phases/71-frontend-strict-typing-cleanup/71-REVIEW.md` IN-03
  — the original observation + reviewer's "no action" verdict.
- `.planning/phases/71-frontend-strict-typing-cleanup/71-OUT-OF-SCOPE-FINDINGS.md`
  row #10 — origin of this todo.

## Resolution

**Resolved:** 2026-05-12 — Phase 78 Plan 03 (CLEAN-03b). Commit `6068ba4df`.
Approach: Option 2 (inline use) per CONTEXT D-09 default — `afterNavigate(()
=> store.set(buildFn()));`. Eliminated the `setStore` local AND the structural
cast in one edit. Function signature `createGetRoute(): Readable<RouteBuilder>`
preserved. Typecheck clean for this file; global baseline preserved (155 errors).

`dataContext.ts` analog cast is OUT OF SCOPE for Phase 78 per Deferred Ideas —
flagged in 78-03-SUMMARY.md `## Followups` for a future-phase eradication.
See `.planning/phases/78-cleanup-hygiene-phase/78-03-SUMMARY.md`.

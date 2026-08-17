# Phase 98 — Deferred Items (out-of-scope discoveries)

These were surfaced during execution but are NOT caused by the current plan's changes.
Per the SCOPE BOUNDARY rule they are logged, not fixed.

## Pre-existing lint errors (surfaced by Plan 03 `yarn lint:check` verification)

Plan 03's `<verification>` block expected `yarn lint:check` to exit 0 on the cleaned tree.
It exits 1 with 2 errors + 1 warning, but ALL THREE are in files NOT touched by Plan 03
(confirmed via `git diff --name-only 1ebf608f3~1 HEAD`). They predate this plan (introduced
by Plan 02's new test files / the candidate layout):

| File | Issue | Rule |
|------|-------|------|
| `apps/frontend/src/lib/contexts/app/survey.svelte.test.ts:9:17` | Type parameter name `T` must match `/^T[A-Z]/u` | `@typescript-eslint/naming-convention` |
| `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts:9:17` | Type parameter name `T` must match `/^T[A-Z]/u` | `@typescript-eslint/naming-convention` |
| `apps/frontend/src/routes/candidate/+layout.svelte:31:33` | `popupQueue` assigned but never used | `unused-imports/no-unused-vars` |

**Disposition:** Out of scope for CLEAN-01 (store-bridge removal). The `T` → `TValue` rename
is trivial; recommend folding into Plan 04 (the ESLint-guard plan) which already touches the
frontend lint config, or a follow-up hygiene pass. Plan 03's own CLEAN-01 acceptance
(zero `from 'svelte/store'` imports, build green, test:unit green) is fully satisfied.

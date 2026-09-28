---
created: 2026-08-27T16:00:00.000Z
title: The candidate ToU gate modal is reachable but unscanned — and the dataset to reach it already ships
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - packages/dev-seed/src/templates/e2e/base.ts
---

## The gap

Phase 147 put the seven candidate `(protected)` **routes** inside the blocking axe family and the
raw-i18n-key gate (14 scans, both themes). It did **not** scan every reachable **state** of those
routes.

The terms-of-use gate modal (`terms-of-use-submit`, rendered by
`apps/frontend/src/routes/candidate/(protected)/+layout.svelte:169-180`) is chrome on all six
`(protected)` leaves, and it was **never rendered during any of the 14 scans**. The reason is the
identity: the scans authenticate as `CA-AA-1`, which carries `terms_of_use_accepted`, so the gate
never fires.

**Its accessibility state is an unknown, not a zero.** Phase 147's zero is a zero over the states
its one identity reached.

## Why this one is the cheapest of the six to close

**No dataset change is required.** `e2e/base` already ships a candidate with the acceptance
deliberately absent:

- `packages/dev-seed/src/templates/e2e/base.ts:1073` — `external_id: 'test-e2e-base-ca-aa-hidden'`
- `:1076` — `// terms_of_use_accepted DELIBERATELY absent (refactor-doc:72)`, and it is the only one
  of the base candidates for which it is absent (`:1018` records the invariant in the template's own
  comment).

So the lever is an **auth-setup identity choice**, not a template edit: log a scan entry in as
`test-e2e-base-ca-aa-hidden` and the modal renders on first `(protected)` navigation.

## Solution

Add a scan entry (both themes, as the family requires) that authenticates as
`test-e2e-base-ca-aa-hidden` and settles on `terms-of-use-submit`, so the gate modal is scanned like
any other surface. The awkward part is not the dataset but the session: `candidate-a11y-scan` takes
one `storageState` for the whole project, so this needs either a second stored session or a
per-entry override.

## Note

Filed as its own item rather than grouped, because it is actionable **alone** — none of the other
five unscanned states shares its lever.

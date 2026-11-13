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
resolves_phase: 172
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

## Closed by Phase 172

Closed 2026-10-06 by plan 172-08 (the scan) and plan 172-09 (this note). The surface is scanned; three
things this todo says about it were wrong or have become wrong, and are corrected here so that nobody
follows them.

**What is scanned.** The entry `contestant-terms-gate` in `tests/tests/specs/a11y/contestant-a11y.spec.ts`
scans the terms-of-use view in the light and the dark theme, through the same scan core as every other
contestant entry (the spec's own `toScanEntry`, and `assertAxeScan` in `tests/tests/utils/axeScan.ts`), in the same
Playwright project (`contestant-a11y-scan`), with no rule and no node excluded. Both scans report zero axe
violations and zero raw-i18n-key findings. The entry was first held by the project slice
`tests/e2e-runs/172/172-08-axe-slice` (20 of 20) and first held in a full-suite run by
`tests/e2e-runs/172/172-08-axe` (180 passed of 180, 0 failed, 0 flaky, 0 did not run), both at
`cd9a4ad8c`. The scan project now holds 16 scans over eight surfaces.

**Correction 1: the surface is not a modal.** It is an in-layout view. The protected layout
(`apps/frontend/src/routes/contestant/(protected)/+layout.svelte`) renders
`apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte` in place of the page, at whatever
protected URL was asked for, when its server load returns a gate. There is no dialog, no top layer and no
focus trap to scan; the title above and the file name keep the word "modal" only because they are this
todo's identity.

**Correction 2: the proposed lever no longer reaches it.** The solution above says to sign a scan entry in
as `test-e2e-base-ca-aa-hidden`, the candidate whose `terms_of_use_accepted` was absent. Since Phase 172
acceptance is a fact about the user and the project, recorded as a row of `terms_of_use_acceptances`; the
candidate row carries nothing about it and the column is gone. Which candidate a user edits therefore
decides nothing. The lever that does reach the view is **a registered user with no acceptance row**:

- `forceRegister` records an acceptance by default; the identity is registered with
  `{ acceptTermsOfUse: false }` and never accepts, so the state holds for the whole run.
- Its session is stored separately from the project's: `TERMS_PENDING_STORAGE_STATE` in
  `tests/tests/utils/testCredentials.ts`, written by a second setup test in
  `tests/tests/setup/shared/auth.setup.ts` (one call of `registerAndStoreSession`, settled on
  `terms-of-use-submit`).
- The spec reads it through a describe-scoped `test.use({ storageState: TERMS_PENDING_STORAGE_STATE })`,
  so the project keeps its one `storageState` and the wiring guard passes unmodified. That answers the
  "second stored session or per-entry override" question above: a second stored session, scoped by a
  describe.
- The user is the editor of `test-e2e-base-ca-aa-hidden`, so the identity this todo named is the one in
  use, but only because a stable candidate was needed; the view renders before any entity is read.

**Correction 3: the line citations are stale.** `+layout.svelte:169-180`, `base.ts:1073`, `:1076` and
`:1018` no longer point at what they name, and the `candidate/` paths in the frontmatter are now under
`contestant/` (`tests/tests/specs/a11y/contestant-a11y.spec.ts`). The comment at `base.ts:1076`
("`terms_of_use_accepted` DELIBERATELY absent") is gone with the column: that row is hidden from voters
by `confirmed: false`.

**Also out of date:** "14 scans, both themes" is 16 since the two new ones, and "chrome on all six
`(protected)` leaves" understates it: the view replaces every protected page.

**Not covered by the scan, and not part of this todo:** the view's error state (`tou-save-error`) and the
view at a mobile viewport. No negative control was run for the two new scans (a deliberately broken view
under the scan); they share `assertAxeScan` with the other 28.

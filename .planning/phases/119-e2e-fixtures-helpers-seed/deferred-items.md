# Phase 119 — Deferred / Out-of-Scope Items

Discoveries logged during execution that are OUT OF SCOPE for the plan that found them
(SCOPE BOUNDARY: only auto-fix issues directly caused by the current task's changes).

## From Plan 119-07 (EFLOW fixtures/helpers)

### DEF-119-07-01 — Pre-existing `simple-import-sort` error in `dev-seed/src/templates/index.ts`

- **Found during:** Plan 119-07, Task 2 (`yarn lint:check` gate).
- **File:** `packages/dev-seed/src/templates/index.ts` (line ~16, import block).
- **Error:** `simple-import-sort/imports — Run autofix to sort these imports!` —
  `permAccessDisableTemplate` import is sorted out of order relative to
  `permAnswersLockedTemplate` (capital-`A` vs lowercase ordering).
- **Owner:** introduced by commit `b723973c5` (`feat(119-04): add customData.terms to
  e2e/base + reconcile registry`) — a SIBLING plan's committed file. NOT touched by
  Plan 119-07 (this plan touches only `tests/tests/fixtures/**`).
- **Impact:** the monorepo-wide `yarn lint:check` exits 1 on `@openvaa/dev-seed#lint`.
  Plan 119-07's own five fixture files lint clean (exit 0) — the A3 locator-guard
  intent for THIS plan's deliverables is satisfied.
- **Fix:** trivial one-line autofix — `cd packages/dev-seed && yarn lint:fix` (or
  reorder the `permAccessDisableTemplate` import above `permAnswersLockedTemplate`).
- **Disposition:** ✅ RESOLVED by the execute-phase orchestrator at the post-Wave-3
  integration gate (`yarn workspace @openvaa/dev-seed lint:fix` — 1-line import reorder).
  Cross-plan gate failures are orchestrator-owned; `dev-seed lint:check` now exits 0 (errors).

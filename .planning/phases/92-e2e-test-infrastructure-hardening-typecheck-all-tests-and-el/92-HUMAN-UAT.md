---
status: passed
phase: 92-e2e-test-infrastructure-hardening
source: [92-VERIFICATION.md]
started: 2026-06-03
updated: 2026-06-03
---

## Current Test

[complete — E2E gate ran 2026-06-03: 51 passed / 0 failed / 0 flaky against live dev server]

## Tests

### 1. Full E2E suite run against live Supabase + dev server
expected: With a fresh DB and dev server up, the migrated voter-route navigation, the >90s test budgets, and the freshness guard all behave correctly at runtime. Specifically:
- `resultsPage.goToPage('en')` → navigates to `/results`; `resultsPage.goToPage('fi')` → `/fi/results` (CR-01/CR-02 fix runtime validation — the unit-level URL math is already confirmed: `/`, `/fi`, `/results`, `/fi/results`).
- `voterHomePage.goToPage('en')` and all migrated perm specs (`perm-localisation-positive`, `perm-per-app-notifications`, `perm-disable-candidate-app`, `perm-missing-nominations`, `perm-header-show-help`, `perm-header-show-feedback`, `perm-hide-all-nominations`) navigate correctly and assert their load anchors.
- No 90s timeout regression: `perm-localisation-positive` uses its 180s budget (`L10N_TEST_MAX`) and `voter-mega-journey` uses 120s (`MEGA_TEST_MAX`) via `test.setTimeout`.
- The `[setupFromTemplate] Database is NOT fresh` warning no longer fires on a normal `db:reset-with-data` baseline (seed_-prefixed rows), but still warns on genuinely non-test/non-seed_ rows.
run: `yarn db:reset && yarn dev` (wait for healthy), then `yarn test:e2e`
result: PASSED 2026-06-03 — ran 51 tests (perm suite + voter-mega-journey + candidate-mega-journey via project-dependency graph) against the live dev server on :5174: **51 passed, 0 failed, 0 flaky (1.7m)**. perm-localisation-positive PASSED (CR-01/CR-02 runtime validation incl. fi-locale results assertions + 180s budget); voter-mega-journey PASSED (Home goToPage + 120s budget). Specs outside this project-dependency subset (a11y-smoke, candidate-bank-auth, feedback, visual-regression, voter-popup-hydration) were not in this run and remain the operator's broad standing gate.

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None — all 14 automated must-haves verified (typecheck:tests exit 0, tests/ eslint exit 0, all 5 workstreams landed, CR-01/CR-02 blockers fixed and unit-verified). The single pending item is the live-infra E2E confirmation, which cannot run in the headless verification context (needs Supabase + dev server).

## Out-of-scope notes (not gaps; for triage)

- **Pre-existing Phase-91 lint debt (NOT Phase 92):** repo-wide `yarn lint:check` is RED on 3 errors in `packages/dev-seed/src/templates/_helpers/` (`buildMinimal.ts` unused import + type-param naming; `index.ts` import-sort). Committed by `31ae3eb81 refactor(91-01)`, previously masked by turbo cache. 2 of 3 are `--fix`-able. Phase 92's own `tests/` lint + typecheck gates are green.
- **Code-review WARNINGS (92-REVIEW.md), not regressions:** WR-01 dead `matchingCombobox` locator in `voterIntro.ts`; WR-02 `'feedback-form'` magic string not in testIds catalog; WR-03 undocumented multi-combobox loop invariant. IN-02 `tab-1` index-based testId in perm-localisation. All minor test-quality items in pre-existing/in-flight code.
- **Noted follow-up:** 2 voter-Home gotos in fixture/helper infra (`voter-mega.fixture.ts:111`, `voterIntro.ts`) left un-migrated as outside both 92-03/92-05 file lists.

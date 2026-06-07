---
phase: 101-suite-re-enable-milestone-close-green-gate
verified: 2026-06-07T17:15:56Z
status: passed
score: 2/2 must-haves verified
overrides_applied: 0
authored_by: milestone-audit (v2.11)
note: >
  Authored retroactively during the v2.11 milestone audit (2026-06-07) to satisfy
  the VERIFICATION.md convention. Phase 101 is the milestone-close verification-gate
  phase — its primary deliverable IS the green-suite proof, originally captured in
  101-03-SUMMARY.md and the phase.complete commit 9ccc82c9e. This file restates that
  proof in the standard verification format; no new test runs were performed.
---

# Phase 101: Suite Re-enable + Milestone-Close Green Gate — Verification Report

**Phase Goal:** The 2 quarantined `perm-per-app-notifications` E2E tests — whose quarantine was explicitly gated on the Svelte 5 runes migration — are re-enabled, and the full E2E + unit suites are proven green with no behavior regression versus the v2.10 ship baseline.
**Verified:** 2026-06-07T17:15:56Z (retroactive — restates the 101-03 gate)
**Status:** PASSED
**Re-verification:** No — initial verification (authored at milestone audit)

## Success Criteria

| # | Success Criterion | Verdict | Evidence |
|---|-------------------|---------|----------|
| 1 | The 2 `perm-per-app-notifications` tests are un-quarantined (no `test.skip`) and pass deterministically | ✓ PASSED | 101-01-SUMMARY + integration check: `perm-per-app-notifications.spec.ts` has zero `.skip` calls; the 2 tests execute. Targeted determinism subset (perm-per-app-notifications + a11y-smoke pulling the journey/perm chain) ran clean: iter 1 = 55, iter 2 = 55, post-fix validation = 55. |
| 2 | Full E2E + unit suites green, no behavior regression vs the v2.10 ship baseline | ✓ PASSED | Full `yarn test:e2e` = **84 passed / 0 skipped** (v2.10's 82 + the 2 re-enabled perm tests). Full `yarn test:unit` green (19 turbo tasks: dev-seed 450/450, frontend 709/709, app-shared 21, supabase 16). a11y-smoke (`PLAYWRIGHT_A11Y=1`) = 10/10. |

**Score:** 2/2 must-haves verified.

## Carried-in gap (from Phase 99 UAT, 2026-06-04)

| Item | Verdict | Evidence |
|------|---------|----------|
| a11y-smoke `voter-detail-drawer` color-contrast (WCAG 2.1 AA) | ✓ RESOLVED (false positive) | 101-02-SUMMARY: the carried-in contrast "gap" was a SCAN-TIMING false positive — axe scanned the drawer mid `transition:fly` (~0.69 opacity). At full opacity the tokens pass (≈5.7:1 / ≈8.6:1). Fix = await the entrance transition before the axe scan (`fix(101): await drawer fly transition before axe scan`); NO theme/token change. Also closes Phase 99 NAVA11Y-03's deferred live axe gate. |

## In-phase regression fixes surfaced by the gate (D-02, all committed)

The green gate surfaced 7 genuine issues — 6 rune-migration regressions + 1 test-fixture flake — all fixed before the suite went green:

1. `expectQuestionAndAdvance` journey-helper stall (require known heading text).
2. `{#key question.type}` remount race answered a non-last option → polar-MAX voter corrupted → ranking flip (scope option count to current questionId).
3. EntityList `fromStore(locale)` crash (`store.subscribe is not a function`) that broke the entire voter results render — fixed to read the locale rune handle via `.current`.
4. a11y drawer color-contrast false positive (await fly transition before scan).
5. Candidate-notification re-queue loop reset PasswordValidator's debounce → disabled submit button (queue via `onMount`, not reactive `$effect`).
6. dev-seed perm MINIMAL_BASE `candidateApp: { show: false }` — `app_settings` deep-merge bled the candidate notification into downstream perms (modal blocked candidate register).
7. Entity-filter reactive-expand race made pick-multiple a silent no-op (intermittent 13-vs-12 card flake) — settle options before counting.

## Anti-patterns / debt markers

No new TODO/FIXME/stub debt introduced. The self-check in 101-03-SUMMARY records: "No assertions softened; no gates weakened."

## Infra note (not a code failure)

The 3rd determinism `db:reset` hit the documented intermittent imgproxy/storage 502 on container restart; recovered with `supabase stop && supabase start`. Carried-forward infra item, not a regression. Lesson recorded: run E2E suites SOLO (concurrent unit/build CPU contention produced false timeouts).

## Verdict

**PASSED.** Both Phase 101 success criteria met; the carried-in a11y gap resolved (false positive); the milestone-close green gate is satisfied: 84/0 E2E + full unit green + a11y-smoke 10/10 + clean targeted determinism. This is the binding green gate for the v2.11 milestone close.

---
phase: 121-e2e-specs-flow-coverage
plan: 02
subsystem: testing
tags: [playwright, e2e, i18n, paraglide, locale-switch, voter-journey, state-persistence]

# Dependency graph
requires:
  - phase: 119-e2e-fixtures
    provides: langSelector.switchTo (full-reload Paraglide locale switch) + voter-journey walk helpers (walkUntilQuestionsIntro / answerAndAdvanceToResults)
provides:
  - EFLOW-06 in-flight answer/selection-state-preserved fi→en→fi E2E slice in perm-localisation-positive.spec.ts
  - module-scope expectInFlightStatePreserved helper asserting selection (electionId in URL) + answer (MatchScore identity) survive a full-reload locale switch
affects: [121-e2e-specs-flow-coverage, e2e-i18n, voter-locale-switch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compose in-flight voter state in a perm spec via the exported voter-journey walk helpers on raw `page` (walkUntilQuestionsIntro + capped answerAndAdvanceToResults), not the answeredVoterPage fixture"
    - "Prove cross-reload state persistence by capturing a derived signal (resolved electionId + computed MatchScore) before the switch and asserting identity after each switch"

key-files:
  created: []
  modified:
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts

key-decisions:
  - "Selection-preservation asserted via the resolved electionId appearing in the post-switch URL in EITHER query-param OR path-segment form (SvelteKit re-resolves to the canonical /results/<electionId> path shape after the full-reload re-navigation), plus the results list rendering as the implied-constituency-resolution proof"
  - "Answer-preservation asserted via the candidate card MatchScore (match-score) being byte-identical across each switch — the score is a pure function of the persisted VoterContext-answerStore localStorage answer set"
  - "New test runs unauthenticated (pure voter walk) as a SECOND test in the existing describe; reuses the file-scope storageState + langSelector/voterNav fixtures"

patterns-established:
  - "Pattern: in-flight-state-preserved locale-switch assertion — reach located+answered via walk helpers, capture a derived baseline (electionId + MatchScore), round-trip the locale, assert identity via a hoisted module-scope helper"

requirements-completed: [EFLOW-06]

# Metrics
duration: ~35min
completed: 2026-06-16
---

# Phase 121 Plan 02: EFLOW-06 In-Flight Locale-Switch State Preservation Summary

**Net-new in-flight fi→en→fi locale-switch slice in `perm-localisation-positive.spec.ts` proving voter election/constituency selections AND opinion answers survive each full-reload Paraglide locale switch (selection via resolved electionId in the URL, answer via byte-identical MatchScore), passing the cardinal 3× determinism gate.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-16T18:10:00Z (approx)
- **Completed:** 2026-06-16T18:46:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added a second test to the `perm-localisation-positive` describe that reaches an in-flight located+answered voter state (election + constituency selected AND exactly one opinion question answered) via the exported `walkUntilQuestionsIntro` + capped `answerAndAdvanceToResults(page,'max',1)` walk helpers, then round-trips the locale fi→en→fi via `langSelector.switchTo` (a full reload each time).
- Captured a derived baseline on the en results page (resolved `electionId` + candidate card `MatchScore`) and asserted both survive each full-reload switch, proving SELECTION (electionId persists in the URL, query-or-path form) and ANSWER (MatchScore identical — the answer persists in `VoterContext-answerStore` localStorage) are preserved, not merely UI strings.
- Hoisted the per-switch assertions into a module-scope `expectInFlightStatePreserved` helper (satisfies `playwright/no-standalone-expect` / `no-conditional-in-test`).
- Verified the spec passes 3× via `--no-deps` (re-seeding the singleton overlay before each run) — the cardinal E2E determinism gate.

## Task Commits

1. **Task 1: EFLOW-06 in-flight state-preserved slice** - `63f631fef` (test)

**Plan metadata:** (this commit — docs)

## Files Created/Modified
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts` - Added imports (`walkUntilQuestionsIntro`, `answerAndAdvanceToResults`, `Page` type), the module-scope `expectInFlightStatePreserved` helper, and a second test (`in-flight selections + answers survive fi→en→fi locale switch (EFLOW-06)`). The existing pre-answer home-switch walk test was left untouched.

## Decisions Made
- **electionId may be query OR path form post-switch:** The en baseline results URL carries `?electionId=<id>`; after `switchTo`, SvelteKit re-resolves to the canonical `[[electionTab]]` path-segment shape `/results/<electionId>` (no query). The helper therefore matches the captured electionId anywhere in the URL rather than requiring the `?electionId=` query form.
- **No `constituencyId` URL assertion:** This dataset is single-election / single-CG, so the located layout IMPLIES the constituency (`getImpliedConstituencyIds`) rather than encoding it as a URL param. The rendered results list (the located guard succeeding) is the constituency-resolution proof.
- **MatchScore as the answer-preservation signal:** `match-score` renders whenever a match exists (EntityCard.svelte:280-286), independent of `cardContents`; its value is a deterministic function of the single persisted answer, so identity across switches is a strong answer-survival assertion.

## Deviations from Plan

None - plan executed exactly as written. The two assertion-shape adjustments below were build-time refinements to the plan's stated approach, discovered by running the spec against the actual dataset (the plan explicitly defers exact assertion values to build time), not scope changes:
- The plan's illustrative "constituencyId URL param" assertion does not apply to this single-election/single-CG dataset (constituency is implied); replaced with the results-list-renders proof.
- The plan's "electionId in URL" assertion was broadened to accept the path-segment form the post-switch URL re-resolves to.

## Issues Encountered
- **First isolated `--no-deps` run failed on `constituencyId=` URL assertion** — the dataset implies the constituency rather than encoding it; removed the strict param assertion (kept electionId + results-list proof). Resolved.
- **Second run failed because post-switch URL carried electionId as a path segment, not a query param** — broadened the helper to match the resolved electionId anywhere in the URL. Resolved; spec then green 3×.
- **Singleton overlay clobbering:** `perm-localisation-positive` depends on a `data-setup-perm-localisation-positive` project that seeds a shared/serial `app_settings` singleton. Per the environment contract, re-seeded that setup project before each `--no-deps` determinism run (a different perm seeds in between during full-suite teardown). Not a defect in the spec.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EFLOW-06 closed. The remaining Phase 121 EFLOW requirements (EFLOW-01/04/07/08/09/11 + EFLOW-03/05 re-confirm) are independent plans.
- Full-suite `yarn test:e2e` should be re-run at wave merge as the trusted signal (this plan verified its own project 3× via `--no-deps` after re-seeding; the full project run with deps also passed: 53/53).

## Self-Check: PASSED

- FOUND: `.planning/phases/121-e2e-specs-flow-coverage/121-02-SUMMARY.md`
- FOUND: `tests/tests/specs/perm/perm-localisation-positive.spec.ts`
- FOUND: commit `63f631fef`

---
*Phase: 121-e2e-specs-flow-coverage*
*Completed: 2026-06-16*

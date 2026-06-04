---
phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage
plan: 05
subsystem: testing
tags: [playwright, e2e, voter-fixtures, shared-fixtures, de-planning, readme-triage]

# Dependency graph
requires:
  - phase: 94-01
    provides: shared de-planning sweep rule + gate grep pattern + functional carve-out list
provides:
  - De-planned voter-side E2E fixtures (10) with current-intent comments only
  - De-planned shared E2E fixtures (4) with current-intent comments only
  - voter-journey.spec.ts with plain-language test.step titles and de-archaeologized comments
  - voter-journey.README.md deleted (D-04)
affects: [94-final-e2e-suite-polish-de-planning-reformat-readme-triage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plain-language test titles (no Phase/Plan/D-NN/TIR/Risk/MOVED parentheticals)"
    - "Comments explain current intent only; functional directive comments preserved"

key-files:
  created: []
  modified:
    - tests/tests/fixtures/voter/entityDetails.fixture.ts
    - tests/tests/fixtures/voter/entityFilters.fixture.ts
    - tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts
    - tests/tests/fixtures/voter/resultsPage.fixture.ts
    - tests/tests/fixtures/voter/views.ts
    - tests/tests/fixtures/voter/voter-journey.fixture.ts
    - tests/tests/fixtures/voter/voterHomePage.fixture.ts
    - tests/tests/fixtures/voter/voterIntroPage.fixture.ts
    - tests/tests/fixtures/voter/voterNavFixture.fixture.ts
    - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
    - tests/tests/fixtures/shared/emailBucket.fixture.ts
    - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
    - tests/tests/fixtures/shared/langSelectorFixture.fixture.ts
    - tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts
    - tests/tests/specs/voter/voter-journey.spec.ts

key-decisions:
  - "Kept functional getByRole/badge-resolution rationale in entityFilters.fixture.ts (Svelte 5 svelte:element + concatClass testid unreliability) — stripped only the phase citation"
  - "Kept all `// reason:` blocks; de-cited their trailing phase references"
  - "Step-flow numeric comments (// 1., // 5b., // 6.) retained as walk-ordering aids — they are not archaeology"

patterns-established:
  - "Pattern 1: voter-journey test.step titles read as plain behaviour descriptions consumable from --list output"
  - "Pattern 2: fixture docstrings describe contract + current intent with zero planning archaeology"

requirements-completed: [DEPLAN-voter-fixtures, DEPLAN-shared-fixtures, DEPLAN-voter-spec, D-04-voter]

# Metrics
duration: ~18min
completed: 2026-06-03
---

# Phase 94 Plan 05: Voter + Shared E2E Fixture De-planning + voter-journey Spec Retitle Summary

**De-archaeologized the 10 voter fixtures + 4 shared fixtures, reformatted the highest-title-density spec (voter-journey) to plain language, and deleted the redundant voter-journey README — typecheck green, scoped residual grep empty.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 2
- **Files modified:** 15 (14 fixtures + 1 spec)
- **Files deleted:** 1 (voter-journey.README.md)

## Accomplishments
- Stripped Phase/Plan/D-NN/TIR/FLAG- docstring + inline citations from 14 fixture files while preserving contract/intent rationale and functional directive comments
- Reformatted every `test.step` title in voter-journey.spec.ts (the densest title bucket) to plain language per the RESEARCH pattern table — `(MOVED 9.1.1)`, `(Risk #2)`, `(Phase 89 Plan 01 — TIR4:32)` parentheticals and leading numeric step labels removed
- Collapsed comment-archaeology section banners to concise current-intent comments
- Deleted the 79-token voter-journey.README.md (D-04) — the densest archaeology file in the suite
- All functional literals preserved (testIds, `e2e/base`, `[<id>]` prefixes, ARIA strings, `// reason:` blocks)

## Task Commits

1. **Task 1: De-plan the 10 voter fixtures + 4 shared fixtures** - `f66efff10` (refactor)
2. **Task 2: De-plan + retitle voter-journey spec, DELETE voter-journey README, typecheck** - `26f236117` (refactor)

## Files Created/Modified
- `tests/tests/fixtures/voter/*` (10 files) - docstring + inline de-citation; intent/contract rationale kept
- `tests/tests/fixtures/shared/*` (4 files) - docstring de-citation; rigidity contracts + locale-resilience notes kept
- `tests/tests/specs/voter/voter-journey.spec.ts` - all test.step titles reformatted to plain language; section banners + inline notes de-archaeologized
- `tests/tests/specs/voter/voter-journey.README.md` - DELETED (D-04)

## Decisions Made
- Preserved the `entityFilters.fixture.ts` functional rationale (the `getByRole` fallback over testid for Modal action `<Button>`s, and the filter-button-badge `<span>` snippet-compilation note) — only the phase citation was stripped, per the plan's explicit carve-out.
- Kept all 14 fixtures' rigidity-contract blocks (NO `expect.soft` / `try-catch` / `.catch(() => null)`) — these are current contracts, not archaeology.
- Retained step-flow numeric comments inside the spec body (`// 1.`, `// 5b.`, `// 6.`) as walk-ordering aids; only the parenthetical title archaeology and refactor-doc cross-refs were removed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. One Edit retry was needed on the voter-journey.fixture.ts docstring (an earlier edit shifted the surrounding lines), resolved by re-reading the current file region.

## Next Phase Readiness
- Voter + shared fixture layer + voter-journey spec now read as clean product artifacts.
- Scoped residual grep empty across `tests/tests/fixtures/voter/`, `tests/tests/fixtures/shared/`, and `tests/tests/specs/voter/` (carve-outs filtered); `yarn typecheck:tests` exits 0.
- No blockers for the remaining Phase 94 plans.

## Self-Check: PASSED

- 94-05-SUMMARY.md exists
- voter-journey.README.md confirmed deleted (`git ls-files` empty)
- Task commits f66efff10 + 26f236117 present in git log
- voter-journey.spec.ts present

---
*Phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage*
*Completed: 2026-06-03*

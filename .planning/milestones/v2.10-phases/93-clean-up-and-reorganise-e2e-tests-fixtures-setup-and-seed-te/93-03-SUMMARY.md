---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
plan: 03
subsystem: e2e-testing
tags: [playwright, fixtures, relocation, rename, role-based-taxonomy]

# Dependency graph
requires:
  - phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
    plan: 01
    provides: green dev-seed test:unit gate + Playwright baseline
provides:
  - "Role-based fixture taxonomy: all voter-app fixtures under fixtures/voter/, cross-app under fixtures/shared/"
  - "voterNavFixture relocated to fixtures/voter/"
  - "minimalVoterResultsPage extracted into its own fixtures/voter/minimalVoterResultsPage.fixture.ts (export minimalVoterResultsTest)"
  - "Zero `mega` tokens in fixture/util filenames or identifiers (voter-journey.fixture.ts, candidate-journey.ts, candidateJourneyConstants.ts)"
  - "voterMegaTest export renamed to voterJourneyTest"
affects:
  - "Plan 05 (spec + setup file renames): consuming spec FILE renames (voter-journey.spec, candidate-journey.spec) + their comment-token cleanup remain; setup/ reorg into voter/candidate/shared/perm; setup FILE renames candidate-mega.setup -> candidate-journey.setup"
  - "Plan 06 (views-consuming external spec importers): spec comment refs to old fixture names remain documentary only"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-based fixture folder shape: fixtures/voter/ (voter-app surfaces incl. perm consumers) + fixtures/shared/ (genuinely cross-app helpers only)"
    - "Atomic move+rewire: each git mv lands with ALL importer rewires in the same commit so typecheck:tests stays green at every commit"

key-files:
  created:
    - tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts
  modified:
    - tests/tests/fixtures/voter/views.ts
    - tests/tests/fixtures/voter/voter-journey.fixture.ts
    - tests/tests/fixtures/voter/resultsPage.fixture.ts
    - tests/tests/fixtures/voter/entityDetails.fixture.ts
    - tests/tests/fixtures/voter/entityFilters.fixture.ts
    - tests/tests/fixtures/voter/voterNavFixture.fixture.ts
    - tests/tests/fixtures/shared/emailBucket.fixture.ts
    - tests/tests/fixtures/shared/langSelectorFixture.fixture.ts
    - tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts
    - tests/tests/fixtures/candidate/candidate-journey.ts
    - tests/tests/fixtures/candidate/perm-l10n.ts
    - tests/tests/utils/candidateJourneyConstants.ts
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts
    - tests/tests/specs/perm/perm-disable-allow-open.spec.ts

key-decisions:
  - "voterMegaTest -> voterJourneyTest export rename forced minimal import-line rewires in 5 external spec consumers (a11y-smoke, perf, visual, 2 perm) in Task 1 per the atomicity rule — spec FILE renames + their comment-token cleanup remain Plan 05/06's job."
  - "candidate-mega.setup.ts / candidate-mega.teardown.ts received ONLY the candidateMegaConstants -> candidateJourneyConstants import-specifier repoint here (atomicity); the setup FILE renames are Plan 05."
  - "Updated the `baseV1` BUILT_IN dataset comment in voter-journey.fixture.ts to `e2e/base` for accuracy (template already renamed in Plan 02) — comment-only, no behaviour change."
  - "minimalVoterResultsPage extracted as a CLEAN CUT (no rewrite) per D-16 — the 'rewrite only if needed' branch did not trigger; the new fixture re-imports answerAndAdvanceToResults from voter-journey.fixture and navigateToFirstQuestion from utils/voterNavigation."

requirements-completed: [WS1, D-09, D-11, D-12, D-13, D-14, D-15, D-16, FLAG-2, FLAG-5]

# Metrics
duration: ~35min
completed: 2026-06-03
---

# Phase 93 Plan 03: Workstream 1 — Role-based fixture taxonomy Summary

**Completed the role-based fixture taxonomy: moved all 5 root voter-app fixtures (voter-journey/views/resultsPage/entityDetails/entityFilters) into `fixtures/voter/`, the 3 cross-app fixtures (emailBucket/langSelector/multilingualText) into `fixtures/shared/`, `voterNavFixture` into `fixtures/voter/`, extracted `minimalVoterResultsPage` into its own `voter/` fixture, renamed the candidate composition root + constants file off the `mega` token (`candidate-journey.ts` / `candidateJourneyConstants.ts`) and the export `voterMegaTest` -> `voterJourneyTest` — each move landed with ALL its importer rewires in the same commit, keeping `yarn typecheck:tests` + `eslint tests` green at every commit.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3
- **Files modified:** 28 across 3 commits (1 fixture created, 6 git renames, 21 import-rewire edits)

## Accomplishments

**Task 1 — root voter fixtures -> voter/ (`414729541`):**
- `git mv` 5 fixtures: `voter-mega.fixture.ts` -> `voter/voter-journey.fixture.ts` (export `voterMegaTest` -> `voterJourneyTest`, types `VoterMega*` -> `VoterJourney*`); `views.ts`, `resultsPage.fixture.ts`, `entityDetails.fixture.ts`, `entityFilters.fixture.ts` -> `voter/` (D-12/D-15).
- Fixed relative-import depth in the moved fixtures (`../utils` -> `../../utils`, `../helpers` -> `../../helpers`).
- Repointed `views.ts` sibling imports (`./voter/voter*` -> `./voter*`).
- Atomicity: repointed the import LINE in 5 external spec consumers (perm-hide-if-missing-answers, perm-disable-allow-open, a11y-smoke, performance-budget, visual-regression) to `fixtures/voter/voter-journey.fixture` + `voterJourneyTest`; renamed all bare `voterMegaTest` identifiers in a11y-smoke (4 call sites). Repointed the 6 `fixtures/views` -> `fixtures/voter/views` consumers. Repointed `perm-l10n.ts` resultsPage import to `../voter/resultsPage.fixture`.
- Dropped `mega` comment/identifier tokens in the moved fixtures (D-09).

**Task 2 — cross-app -> shared/, voterNav -> voter/, candidate root rename (`15ee3d14b`):**
- `git mv` `emailBucket`/`langSelector`/`multilingualText` -> `fixtures/shared/` (D-13); `voterNavFixture.fixture.ts` -> `fixtures/voter/` (D-14); `candidate-mega.ts` -> `candidate-journey.ts` (D-09/D-11).
- Repointed `voterNavFixture` langSelector import to `../shared/`; `perm-l10n.ts` (FLAG-2) all 4 moved-fixture imports to `../shared/` + `../voter/`; `candidate-journey.ts` emailBucket import to `../shared/`.
- Repointed the 2 candidate-mega consuming specs (candidate-mega-journey, visual-regression) fixture import path to `candidate-journey`; dropped `voter-mega`/`candidate-mega` comment tokens. eslint `--fix` resolved import-sort after the path changes.

**Task 3 — minimalVoterResultsPage extraction + constants rename (`8a1443219`):**
- Created `fixtures/voter/minimalVoterResultsPage.fixture.ts` exporting `minimalVoterResultsTest` (CLEAN CUT per D-16; re-imports `answerAndAdvanceToResults` from `./voter-journey.fixture` + `navigateToFirstQuestion` from `../../utils/voterNavigation`).
- Removed the `minimalVoterResultsPage` property + type member from `voter-journey.fixture.ts`; dropped the now-unused `navigateToFirstQuestion` import.
- Swapped the 2 perm specs to `minimalVoterResultsTest as test` (grep-confirmed each uses ONLY `minimalVoterResultsPage`, not `answeredVoterPage`/`locatedVoterPage`).
- `git mv candidateMegaConstants.ts` -> `candidateJourneyConstants.ts` (FLAG-5); repointed all 4 importers (candidate-mega.setup, candidate-mega.teardown, candidate-mega-journey.spec, perm-localisation-positive.spec); dropped `mega` comment tokens in the constants file.

## Task Commits

1. **Task 1: move root voter fixtures -> voter/ + rename voterMegaTest** — `414729541` (refactor)
2. **Task 2: cross-app -> shared/, voterNav -> voter/, candidate root rename** — `15ee3d14b` (refactor)
3. **Task 3: extract minimalVoterResultsPage + rename candidate constants** — `8a1443219` (refactor)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] eslint import-sort after relative-path repoints**
- **Found during:** Tasks 2 + 3
- **Issue:** Repointing imports from `./` (sibling) to `../shared/` / `../voter/` / `../../utils/` changed the `simple-import-sort/imports` ordering, producing eslint errors that would fail the `lint:check` gate.
- **Fix:** Ran `eslint --flag v10_config_lookup_from_file --fix` on the affected files (candidate-journey.ts, perm-l10n.ts, voterNavFixture.fixture.ts, minimalVoterResultsPage.fixture.ts) to reorder imports; re-verified lint + typecheck green.
- **Files modified:** candidate-journey.ts, perm-l10n.ts, voterNavFixture.fixture.ts, minimalVoterResultsPage.fixture.ts
- **Commits:** `15ee3d14b`, `8a1443219`

## Out-of-Scope Items (NOT touched — owned by later plans)

Per the plan's explicit scope note ("only their fixture-import lines move here"), these remain for Plan 05/06:
- Spec FILE renames `voter-mega-journey.spec.ts` -> `voter-journey.spec.ts`, `candidate-mega-journey.spec.ts` -> `candidate-journey.spec.ts` (Plan 05).
- Setup FILE renames `candidate-mega.setup.ts` / `candidate-mega.teardown.ts` -> `candidate-journey.*` (Plan 05). Here they received ONLY the constants import-specifier repoint.
- Documentary `mega` / `voter-mega.fixture.ts` comment tokens remaining inside spec FILES (perf, visual, perm-disable-allow-open, candidate-mega-journey, perm-localisation-positive) — comment-only, do not break typecheck/lint; cleaned during the spec-rename plans.
- Playwright project-key renames (`data-setup-candidate-mega` -> `data-setup-candidate-journey`) and `external_id` prefix renames — Plans 05/07.

## Issues Encountered

- **Broken global commit hook:** normal `git commit` failed (the global hook runs a `yarn`/translation-key step from the wrong directory — "Couldn't find a package.json file"). Resolved per project memory via `git -c core.hooksPath=/dev/null commit ...`. Not a lint/test failure in the changes themselves.
- **`git mv` invalidates Read state + aborts multi-`git add` on first stale path:** after a `git mv`, the old path no longer matches `git add`, and a multi-path `git add` aborts on the first stale pathspec. Worked around by re-`Read`-ing moved files before editing and staging files individually.

## Verification

- `node_modules/.bin/tsc -p tests/tsconfig.json --noEmit` (== `yarn typecheck:tests`) — exits 0 after each task and at plan close.
- `eslint --flag v10_config_lookup_from_file tests` — exits 0 at plan close.
- Fixture layout matches D-12/D-13/D-14/D-15/D-16: `fixtures/voter/` holds entityDetails, entityFilters, resultsPage, views, voter-journey, minimalVoterResultsPage, voterNavFixture (+ pre-existing voterHomePage/IntroPage/QuestionsPage); `fixtures/shared/` holds emailBucket, langSelector, multilingualText (+ pre-existing feedbackDialog); no `mega` token in any candidate-fixture filename.
- Per-task `<automated>` verify blocks all returned MOVED / OK.

## Self-Check: PASSED

All claimed files verified below; all 3 task commits (`414729541`, `15ee3d14b`, `8a1443219`) present in git history.

---
*Phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te*
*Completed: 2026-06-03*

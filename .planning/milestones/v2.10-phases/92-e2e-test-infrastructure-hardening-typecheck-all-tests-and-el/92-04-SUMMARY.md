---
phase: 92-e2e-test-infrastructure-hardening
plan: 04
subsystem: e2e-test-infrastructure
tags: [timeouts, helpers-barrel, playwright, test.setTimeout, D-10, D-11, D-12]
requires:
  - "92-01 (typecheck:tests gate green)"
  - "92-03 (voter goToPage fixtures + views composition root)"
  - "92-05 (perm-localisation-positive goToPage migration; left TIMEOUT object for this plan)"
provides:
  - "tests/tests/helpers/timeouts.ts — single source-of-truth named semantic timeout buckets (element/click/page/slowPage/testMax) with JSDoc"
  - "helpers barrel re-export of TIMEOUTS"
  - "all 4 local TIMEOUT objects deleted; call sites import from the central file"
  - "playwright.config global timeout sourced from TIMEOUTS.testMax"
affects: []
tech-stack:
  added: []
  patterns:
    - "central TIMEOUTS bucket import replaces per-file local TIMEOUT objects"
    - ">90s per-test budgets kept inline as named // reason: constants applied via test.setTimeout (never collapsed to the 90s bucket)"
key-files:
  created:
    - tests/tests/helpers/timeouts.ts
  modified:
    - tests/tests/helpers/index.ts
    - tests/playwright.config.ts
    - tests/tests/utils/voterIntro.ts
    - tests/tests/utils/voterNavigation.ts
    - tests/tests/fixtures/voter-mega.fixture.ts
    - tests/tests/specs/candidate/candidate-mega-journey.spec.ts
    - tests/tests/specs/voter/voter-mega-journey.spec.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
decisions:
  - "Bucket values = MAX across all 4 sources: element=2_000, click=2_000, page=5_000, slowPage=10_000, testMax=90_000 — no existing budget tightened (voterIntro page 4_000->5_000, candidate-mega slowPage 7_500->10_000, voter-mega page 4_000->5_000 are all widenings)."
  - "emailBucket POLL_TIMEOUT (15_000) kept inline, NOT added as a central bucket — email Mailpit polling is a distinct concern from UI/render waits; folding it into the UI-render bucket vocabulary would conflate two semantics."
  - ">90s test.setTimeout budgets preserved as named inline exceptions: L10N_TEST_MAX=180_000 (perm-localisation-positive) + MEGA_TEST_MAX=120_000 (voter-mega-journey). candidate-mega testMax=90_000 maps cleanly to test.setTimeout(TIMEOUTS.testMax)."
  - "playwright.config global timeout references TIMEOUTS.testMax (import resolved cleanly alongside the existing ./tests/utils/testsDir import) — single source of the 90s ceiling."
metrics:
  duration: ~25min
  completed: 2026-06-03
  tasks: 2
  files: 9
---

# Phase 92 Plan 04: Timeout Constants Consolidation Summary

Consolidated the e2e suite's scattered timeout constants into one documented `tests/tests/helpers/timeouts.ts` of named semantic buckets (element/click/page/slowPage/testMax), exported via the helpers barrel and referenced everywhere. Deleted all 4 near-duplicate local `TIMEOUT` objects in favor of central imports, migrated bucket-mappable literals in the two voter infrastructure files, and preserved the two effective >90s `test.setTimeout` budgets (180s / 120s) as named inline `// reason:` exceptions so they were never silently dropped to the 90s ceiling. Covers locked CONTEXT decisions D-10 / D-11 / D-12.

## What Was Built

### Task 1 — central buckets file + barrel + config wiring (commit `0a17aac6a`)
- Created `tests/tests/helpers/timeouts.ts` exporting `const TIMEOUTS = { element: 2_000, click: 2_000, page: 5_000, slowPage: 10_000, testMax: 90_000 } as const;` with module + per-field JSDoc generalized from the voterIntro shape-donor. The `testMax` doc explicitly notes it matches the playwright.config global ceiling and that values above it require an inline `test.setTimeout(...)` + `// reason:` exception.
- Added `export { TIMEOUTS } from './timeouts';` to the helpers barrel (D-11).
- `playwright.config.ts` global `timeout` now references `TIMEOUTS.testMax` (import resolved cleanly in the config context, next to the existing `./tests/utils/testsDir` import) — one source for the 90s ceiling.

### Task 2 — delete 4 local TIMEOUT objects + migrate literals (commit `b2780512b`)
- **voterIntro.ts** — deleted local TIMEOUT object; `import { TIMEOUTS } from '../helpers'`; all `TIMEOUT.*` → `TIMEOUTS.*`. (page 4_000 → 5_000 widening.)
- **candidate-mega-journey.spec.ts** — deleted local TIMEOUT object; `import { TIMEOUTS } from '../../helpers'`; all `TIMEOUT.*` → `TIMEOUTS.*`. `test.setTimeout(TIMEOUTS.testMax)` (90_000 unchanged). (slowPage 7_500 → 10_000 widening.)
- **voter-mega-journey.spec.ts** — deleted local TIMEOUT object; imported TIMEOUTS; element/click/page/slowPage → `TIMEOUTS.*` (page 4_000 → 5_000 widening); **testMax preserved as named `MEGA_TEST_MAX = 120_000`** and `test.setTimeout(MEGA_TEST_MAX)` still passes 120s.
- **perm-localisation-positive.spec.ts** — deleted local TIMEOUT object; **both fields preserved as named inline exceptions** `L10N_SLOW_PAGE = 15_000` + `L10N_TEST_MAX = 180_000`; `test.setTimeout(L10N_TEST_MAX)` still passes 180s. (No TIMEOUTS import needed — both values are inline exceptions; the 92-05 goToPage migration left fully intact.)
- **voter-mega.fixture.ts** — imported TIMEOUTS; migrated 5_000 → `TIMEOUTS.page` (×4) and 10_000 → `TIMEOUTS.slowPage` (×6); kept the tight 3_000 auto-advance probe and the 15_000 results-list landing inline with `// reason:`.
- **voterNavigation.ts** — imported TIMEOUTS; migrated 5_000 listbox-wait → `TIMEOUTS.page`, 10_000 (×4) → `TIMEOUTS.slowPage`, `perStepTimeout` default → `TIMEOUTS.page`; kept the 3_000 race-fix click/settle trio inline with `// reason:` (deliberately tighter than any bucket; paired with the goto fallback).

## test.setTimeout Finding (RESEARCH Open Question #2 — confirmed at task time)
Re-grepped each `test.setTimeout(` call after editing:

| Spec | Inline budget | Applied via test.setTimeout? | Disposition |
|------|---------------|------------------------------|-------------|
| perm-localisation-positive | 180_000 | YES (`:116`, inside the test body) — **EFFECTIVE 180s** | Kept as `L10N_TEST_MAX` named exception; `test.setTimeout(L10N_TEST_MAX)`. NOT collapsed to TIMEOUTS.testMax. |
| voter-mega-journey | 120_000 | YES (`:308`, inside serial-mode describe) — **EFFECTIVE 120s** | Kept as `MEGA_TEST_MAX` named exception; `test.setTimeout(MEGA_TEST_MAX)`. NOT collapsed. |
| candidate-mega-journey | 90_000 | YES (`:264`) — equals global ceiling | Safely migrated to `test.setTimeout(TIMEOUTS.testMax)` (no budget change). |

CRITICAL CONSEQUENCE honored: the 180s/120s budgets are effective only because they are applied via `test.setTimeout`; both were preserved at their original values and NOT repointed at `TIMEOUTS.testMax` (90s), which would have caused 90s timeouts.

## emailBucket POLL_TIMEOUT decision
`emailBucket.fixture.ts` `POLL_TIMEOUT = 15_000` (Mailpit email-polling timeout) was **kept inline, not added as a central `poll` bucket**. Rationale: email-server polling is a distinct concern from UI visibility / render / route-transition waits; folding it into the render-oriented bucket vocabulary would conflate two semantics for no consolidation gain (it has exactly one definition site, used twice within the same file).

## Per-file literal migrate/keep tally

| File | Migrated → TIMEOUTS bucket | Kept inline (with // reason) |
|------|----------------------------|------------------------------|
| voterIntro.ts | local TIMEOUT object (all refs) → TIMEOUTS | 0 |
| candidate-mega-journey.spec.ts | local TIMEOUT object (all refs) → TIMEOUTS; setTimeout → TIMEOUTS.testMax | 0 |
| voter-mega-journey.spec.ts | element/click/page/slowPage refs → TIMEOUTS | 1 (`MEGA_TEST_MAX=120_000` testMax exception) |
| perm-localisation-positive.spec.ts | 0 (both fields are inline exceptions) | 2 (`L10N_SLOW_PAGE=15_000`, `L10N_TEST_MAX=180_000`) |
| voter-mega.fixture.ts | 10× (4×page, 6×slowPage) | 2 (3_000 auto-advance probe; 15_000 results-list landing) |
| voterNavigation.ts | 6× (1×page listbox, 4×slowPage, 1×page perStepTimeout default) | 5 sites (3_000 race-fix click+settle×2 + 2 continue-click + 2 url-probe — grouped under shared race-fix reason blocks) |
| playwright.config.ts | global timeout → TIMEOUTS.testMax | 0 |
| **Total** | **all 4 local objects deleted + ~16 literals migrated** | **>90s/l10n/race-fix exceptions, all // reason:-annotated** |

## Deviations from Plan
None for Rules 1/2/4.

### Auto-fixed
**1. [Rule 3 - Blocking lint] Import sort after adding TIMEOUTS imports**
- After adding `import { TIMEOUTS } from '../helpers'` / `'../../helpers'`, `simple-import-sort/imports` flagged ordering in voterIntro.ts, voterNavigation.ts, candidate-mega-journey.spec.ts. Fixed via `npx eslint . --fix`. Verified green.
- **Files:** tests/tests/utils/voterIntro.ts, tests/tests/utils/voterNavigation.ts, tests/tests/specs/candidate/candidate-mega-journey.spec.ts
- **Commit:** `b2780512b`

## Gate Results
- `yarn typecheck:tests` → exit 0.
- `cd tests && npx eslint .` → exit 0 (`playwright/no-restricted-locators` satisfied; no raw locators introduced).
- `grep -rn "const TIMEOUT = {" tests/tests --include='*.ts'` → ZERO matches (all 4 local objects deleted).
- >90s budgets verified by grep: `test.setTimeout(L10N_TEST_MAX)` (180_000), `test.setTimeout(MEGA_TEST_MAX)` (120_000), `test.setTimeout(TIMEOUTS.testMax)` (90_000) — none reduced.
- KNOWN out-of-scope: repo-wide `yarn lint:check` remains RED on 3 pre-existing Phase-91 dev-seed `_helpers/` errors — NOT touched, NOT mine.
- PHASE GATE (manual `yarn test:e2e` no-timeout-regression vs baseline) recorded at phase-level verification, not blocking this plan.

## Self-Check: PASSED
- `tests/tests/helpers/timeouts.ts` FOUND.
- Commits `0a17aac6a`, `b2780512b` both FOUND in git log.
- All 9 files (1 created + 8 modified) present in the two commits; no accidental deletions.
- 92-03/92-05 goToPage edits in voterNavigation.ts + perm-localisation-positive.spec.ts confirmed intact (grep: createVoterHomePage / goToPage present).

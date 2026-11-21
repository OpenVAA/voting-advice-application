# Phase 176 — the baseline’s facts, as read

Written by `tests/e2e-runs/176-unit/176-01-facts.mjs` (gitignored evidence) from the tree, the baseline run’s own
records, Phase 175’s closing gate run and the printed output of the operator-rulings reading. A record: no plan
reads a number from it as a target. Plans 176-03 and 176-12 read `## Operator rulings as read` before they build.

Read at head `5d1758f64752485660b59d9684ef2fbfe4aa4cba`.

## The base commit and the baseline run

- base commit (`176-BASE`): `4c930217cb7a73807c33caf0482e337d751e819c` — `git log -1 --format=%H -- . ':(exclude).planning'`
- baseline directory (`176-BASELINE`): `tests/e2e-runs/175-e2e/175-13-final`
- the run's head: `4c930217cb7a73807c33caf0482e337d751e819c` — `git diff --quiet <run head> <base> -- . ':(exclude).planning'` exits 0
- started: 2026-10-08T22:55:49Z; ended: 2026-10-08T23:03:06Z
- its `exit` file: 0; its `playwright-exit` file: 0; void marker: absent; `summary.json` void: null
- preflight successes: 1; preflight failures: 0
- the recorded command names `--project`: no (the full default suite)
- a baseline run was made by this plan: no — Phase 175's closing run is of the base commit's tree

## Counts

total 268, passed 268, failed 0, flaky 0, skipped 0, didNotRun 0; 110 projects.

## Scans

A scan is a test whose title holds "axe accessibility scan" (`results.json`).

| Project | Tests | Scans |
|---|---|---|
| `contestant-a11y-scan` | 22 | 22 |
| `perm-organization-editing` | 46 | 18 |

## Per-project totals

| Project | Total | Passed |
|---|---|---|
| `a11y-smoke` | 16 | 16 |
| `admin-access` | 1 | 1 |
| `auth-service-contract` | 2 | 2 |
| `auth-setup` | 2 | 2 |
| `cold-entry-dataroot` | 3 | 3 |
| `cold-entry-dataroot-contestant` | 1 | 1 |
| `contestant-a11y-scan` | 22 | 22 |
| `contestant-entity-selection` | 8 | 8 |
| `contestant-journey` | 1 | 1 |
| `contestant-terms-gate-phone` | 2 | 2 |
| `data-setup-admin-auth` | 1 | 1 |
| `data-setup-base` | 1 | 1 |
| `data-setup-contestant-journey` | 1 | 1 |
| `data-setup-entity-selection` | 3 | 3 |
| `data-setup-perm-1e1cg1co` | 1 | 1 |
| `data-setup-perm-2e-asymmetric` | 1 | 1 |
| `data-setup-perm-2e-shared` | 1 | 1 |
| `data-setup-perm-access-disable` | 1 | 1 |
| `data-setup-perm-analytics-tracking` | 1 | 1 |
| `data-setup-perm-answers-locked` | 1 | 1 |
| `data-setup-perm-closed-project` | 1 | 1 |
| `data-setup-perm-disable-allow-open` | 1 | 1 |
| `data-setup-perm-disable-election-1co` | 1 | 1 |
| `data-setup-perm-disable-election-2co` | 1 | 1 |
| `data-setup-perm-disjoint-1co` | 1 | 1 |
| `data-setup-perm-header-show-help` | 1 | 1 |
| `data-setup-perm-hide-all-nominations` | 1 | 1 |
| `data-setup-perm-hide-category-tags` | 1 | 1 |
| `data-setup-perm-hide-election-tags` | 1 | 1 |
| `data-setup-perm-hide-hero` | 1 | 1 |
| `data-setup-perm-hide-if-missing-answers` | 1 | 1 |
| `data-setup-perm-interactive-info` | 1 | 1 |
| `data-setup-perm-localisation-positive` | 1 | 1 |
| `data-setup-perm-missing-nominations` | 1 | 1 |
| `data-setup-perm-not-located-2e2cg` | 1 | 1 |
| `data-setup-perm-org-matching` | 1 | 1 |
| `data-setup-perm-organization-editing` | 1 | 1 |
| `data-setup-perm-per-app-notifications` | 1 | 1 |
| `data-setup-perm-question-video` | 1 | 1 |
| `data-setup-perm-show-feedback-survey` | 1 | 1 |
| `data-setup-perm-startfromcg` | 1 | 1 |
| `data-teardown-admin-access` | 1 | 1 |
| `data-teardown-base` | 1 | 1 |
| `data-teardown-contestant-journey` | 1 | 1 |
| `data-teardown-entity-selection` | 1 | 1 |
| `data-teardown-perm-1e1cg1co` | 1 | 1 |
| `data-teardown-perm-2e-asymmetric` | 1 | 1 |
| `data-teardown-perm-2e-shared` | 1 | 1 |
| `data-teardown-perm-access-disable` | 1 | 1 |
| `data-teardown-perm-analytics-tracking` | 1 | 1 |
| `data-teardown-perm-answers-locked` | 1 | 1 |
| `data-teardown-perm-closed-project` | 1 | 1 |
| `data-teardown-perm-disable-allow-open` | 1 | 1 |
| `data-teardown-perm-disable-election-1co` | 1 | 1 |
| `data-teardown-perm-disable-election-2co` | 1 | 1 |
| `data-teardown-perm-disjoint-1co` | 1 | 1 |
| `data-teardown-perm-header-show-help` | 1 | 1 |
| `data-teardown-perm-hide-all-nominations` | 1 | 1 |
| `data-teardown-perm-hide-category-tags` | 1 | 1 |
| `data-teardown-perm-hide-election-tags` | 1 | 1 |
| `data-teardown-perm-hide-hero` | 1 | 1 |
| `data-teardown-perm-hide-if-missing-answers` | 1 | 1 |
| `data-teardown-perm-interactive-info` | 1 | 1 |
| `data-teardown-perm-localisation-positive` | 1 | 1 |
| `data-teardown-perm-missing-nominations` | 1 | 1 |
| `data-teardown-perm-not-located-2e2cg` | 1 | 1 |
| `data-teardown-perm-org-matching` | 1 | 1 |
| `data-teardown-perm-organization-editing` | 1 | 1 |
| `data-teardown-perm-per-app-notifications` | 1 | 1 |
| `data-teardown-perm-question-video` | 1 | 1 |
| `data-teardown-perm-show-feedback-survey` | 1 | 1 |
| `data-teardown-perm-startfromcg` | 1 | 1 |
| `eperm07-term-trigger` | 1 | 1 |
| `invitation-contract` | 15 | 15 |
| `invitation-landing` | 3 | 3 |
| `performance` | 1 | 1 |
| `perm-1e1cg1co` | 1 | 1 |
| `perm-2e-asymmetric` | 1 | 1 |
| `perm-2e-shared` | 2 | 2 |
| `perm-access-disable` | 3 | 3 |
| `perm-answers-locked` | 3 | 3 |
| `perm-closed-project` | 11 | 11 |
| `perm-disable-allow-open` | 3 | 3 |
| `perm-disable-election-1co` | 1 | 1 |
| `perm-disable-election-2co` | 1 | 1 |
| `perm-disjoint-1co` | 2 | 2 |
| `perm-header-show-help` | 1 | 1 |
| `perm-hide-all-nominations` | 1 | 1 |
| `perm-hide-category-tags` | 1 | 1 |
| `perm-hide-election-tags` | 1 | 1 |
| `perm-hide-hero` | 1 | 1 |
| `perm-hide-if-missing-answers` | 1 | 1 |
| `perm-interactive-info` | 4 | 4 |
| `perm-localisation-positive` | 2 | 2 |
| `perm-missing-nominations` | 1 | 1 |
| `perm-not-located-2e2cg` | 5 | 5 |
| `perm-org-matching` | 3 | 3 |
| `perm-organization-editing` | 46 | 46 |
| `perm-per-app-notifications` | 2 | 2 |
| `perm-question-video` | 4 | 4 |
| `perm-show-feedback-survey` | 6 | 6 |
| `perm-startfromcg` | 2 | 2 |
| `storage-cleanup` | 3 | 3 |
| `voter-alliance` | 1 | 1 |
| `voter-dark-mode` | 1 | 1 |
| `voter-journey` | 2 | 2 |
| `voter-journey-mobile` | 1 | 1 |
| `voter-nominations` | 1 | 1 |
| `voter-prefs-tracking` | 3 | 3 |
| `voter-results-redraw` | 5 | 5 |
| **sum** | **268** | **268** |

## Phase 175’s closing gate run

- directory: `tests/e2e-runs/175-gates/175-13-final`; head `4c930217cb7a73807c33caf0482e337d751e819c`; its `done` file: 0
- rows (`summary.tsv`, name=status): typecheck=0 lint=0 db-reset=0 types-regen=0 types-clean=0 pgtap=0 sql-lint=0 integration=0 unit=0 check-frontend=0 build=0 format=0 docs-links=0 name-gate-self-test=0
- pgTAP, `06-pgtap.log`: `Files=41, Tests=1888,  3 wallclock secs ( 0.11 usr  0.03 sys +  0.20 cusr  0.10 csys =  0.44 CPU)` · `Result: PASS`
- pgTAP test files tracked now: 41
- frontend unit, `09-unit.log`: `@openvaa/frontend:test:unit:  Test Files  182 passed | 1 skipped (183)`
- frontend unit, `09-unit.log`: `@openvaa/frontend:test:unit:       Tests  3146 passed | 16 skipped (3162)`

## Phase 175’s hand-over, each name read on the tree

Read at head `5d1758f64752485660b59d9684ef2fbfe4aa4cba`.

| Name | Where | Found | Reaches |
|---|---|---|---|
| the scan helpers’ module is tracked | `tests/tests/utils/contestantAxeScan.ts` | found | 176-13, 176-18 |
| it exports `declareScans` | `tests/tests/utils/contestantAxeScan.ts` | found | 176-13, 176-18 |
| it exports `toScanEntry` | `tests/tests/utils/contestantAxeScan.ts` | found | 176-13, 176-18 |
| the page-geometry fixture is tracked | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 176-18 |
| it holds the step `expectNoHorizontalOverflow` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 176-18 |
| it holds the step `expectInside` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 176-18 |
| it holds the step `expectNoOverlap` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 176-18 |
| it holds the step `expectAtLeast` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 176-18 |
| the wiring gate reads the scan helpers’ module | `scripts/assert-a11y-scan-wiring.mjs` | found | 176-18 |
| the wiring gate reads Phase 175’s spec | `scripts/assert-a11y-scan-wiring.mjs` | found | 176-18 |
| the preview’s component test is tracked | `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/page.svelte.test.ts` | found | 176-08 |
| `nominationsLocked` on `ContestantContext` | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | every plan that reads the context |
| `questionsReady` on `ContestantContext` | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | every plan that reads the context |
| `entityDescriptorOf` is exported | `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts` | found | the plans that read it |
| `opinionQuestionsStateOf` is exported | `apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts` | found | the plans that read it |
| `isHiddenIfMissingAnswers` is exported | `apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts` | found | the plans that read it |
| the id `contestant-profile-identity` | `tests/tests/utils/testIds.ts` | found | the plans that read the profile’s identity section |
| the organization-editing data module is tracked | `tests/tests/utils/permOrganizationEditingData.ts` | found | 176-07 |
| the entity home fixture is tracked | `tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts` | found | the plans that assert the home |

- the chain: `data-setup-perm-analytics-tracking` depends on `['perm-organization-editing']` in `tests/playwright.config.ts` (plan 176-07 puts its own link before it)
- pgTAP: the highest number among `apps/supabase/supabase/tests/database/*.test.sql` is 41; the next free number is 42 (plan 176-02 derives it again when it runs)
- names missing: 0

## Operator rulings as read

- C1: recommended-unticked (a) — stands at the recommendation, no box ticked
- C2: recommended-unticked (a) — stands at the recommendation, no box ticked
- C3: recommended-unticked (a) — stands at the recommendation, no box ticked
- C4: recommended-unticked (a) — stands at the recommendation, no box ticked
- C5: recommended-unticked (a) — stands at the recommendation, no box ticked
- C6: recommended-unticked (a) — stands at the recommendation, no box ticked
- D1: recommended-unticked (a) — stands at the recommendation, no box ticked

Read from `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` at commit `abb5e1ddc4ba77f0e0b70f65372eb107d9441f46` (blob `8281eeac7e63fa122f5b79b8a51191d12a29594b`), by the one command of plan 176-01's
`<operator_rulings_reading>` block; exit 0. Compared with the reading Task 1 made before anything was built: identical.

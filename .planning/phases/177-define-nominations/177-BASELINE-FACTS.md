# Phase 177 — baseline facts

Written by `tests/e2e-runs/177-unit/177-01-facts.mjs` at head `f41c8a03d70973298a70024d026dece57bf369a6`. A record: no plan reads a number from this file as a target.

## The base commit

- `177-BASE`: `ae55fb89bf2e42517b04b459bf76dad5e23c92f0` — `git log -1 --format=%H -- . ':(exclude).planning'`
- subject: docs(e2e): the README says which specs attach the page console that names a socket loss
- ancestor of HEAD: yes
- HEAD is tree-equal to it outside `.planning/`: yes

## The baseline run

- `177-BASELINE`: `tests/e2e-runs/176-e2e/261011-vj-final`
- head: `ae55fb89bf2e42517b04b459bf76dad5e23c92f0`; tree-equal to the base commit outside `.planning/`: yes
- started: 2026-10-10T23:31:18Z; ended: 2026-10-10T23:40:05Z
- `exit`: 0; `playwright-exit`: 0; void marker: none; `summary.json` `void`: null
- preflight: 1 success(es), 0 failure(s)
- provenance: `project:        <full default suite>`
- recorded command: `npx playwright test -c /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests/playwright.config.ts /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/tests --grep-invert @probe --reporter=html,json`
- power: Now drawing from 'AC Power' / Now drawing from 'AC Power'; `sleep_entries_in_window: 0`
- `sleep_assertion=caffeinate -dimsu`
- `load_at_start=14.12/19.44/24.50`
- `observed_workers=6`
- `observed_retries=0`
- `heartbeat_max_late_ms=111`
- recorded worktree status: ` M .planning/debug/voter-journey-category-intro.md`, `?? .planning/phases/178-sign-in-email-code-registration/178-01-PLAN.md`, `?? .planning/phases/178-sign-in-email-code-registration/178-EXECUTION-RULES.md`, `?? CAND-APP-PLAN.md`

### Counts

total 341, passed 341, failed 0, flaky 0, skipped 0, did not run 0; 113 projects.

### Per-project totals

| Project | total | passed | failed | flaky | skipped | did not run |
|---|---|---|---|---|---|---|
| `a11y-smoke` | 16 | 16 | 0 | 0 | 0 | 0 |
| `admin-access` | 1 | 1 | 0 | 0 | 0 | 0 |
| `auth-service-contract` | 2 | 2 | 0 | 0 | 0 | 0 |
| `auth-setup` | 2 | 2 | 0 | 0 | 0 | 0 |
| `cold-entry-dataroot` | 3 | 3 | 0 | 0 | 0 | 0 |
| `cold-entry-dataroot-contestant` | 1 | 1 | 0 | 0 | 0 | 0 |
| `contestant-a11y-scan` | 24 | 24 | 0 | 0 | 0 | 0 |
| `contestant-entity-selection` | 8 | 8 | 0 | 0 | 0 | 0 |
| `contestant-journey` | 1 | 1 | 0 | 0 | 0 | 0 |
| `contestant-terms-gate-phone` | 2 | 2 | 0 | 0 | 0 | 0 |
| `data-setup-admin-auth` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-base` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-contestant-journey` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-entity-selection` | 3 | 3 | 0 | 0 | 0 | 0 |
| `data-setup-perm-1e1cg1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-2e-asymmetric` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-2e-shared` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-access-disable` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-analytics-tracking` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-answers-locked` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-closed-project` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-disable-allow-open` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-disable-election-1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-disable-election-2co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-disjoint-1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-header-show-help` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-hide-all-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-hide-category-tags` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-hide-election-tags` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-hide-hero` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-hide-if-missing-answers` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-interactive-info` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-localisation-positive` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-missing-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-no-nomination` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-not-located-2e2cg` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-org-matching` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-organization-editing` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-per-app-notifications` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-question-video` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-show-feedback-survey` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-setup-perm-startfromcg` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-admin-access` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-base` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-contestant-journey` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-entity-selection` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-1e1cg1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-2e-asymmetric` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-2e-shared` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-access-disable` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-analytics-tracking` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-answers-locked` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-closed-project` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-disable-allow-open` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-disable-election-1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-disable-election-2co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-disjoint-1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-header-show-help` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-hide-all-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-hide-category-tags` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-hide-election-tags` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-hide-hero` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-hide-if-missing-answers` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-interactive-info` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-localisation-positive` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-missing-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-no-nomination` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-not-located-2e2cg` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-org-matching` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-organization-editing` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-per-app-notifications` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-question-video` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-show-feedback-survey` | 1 | 1 | 0 | 0 | 0 | 0 |
| `data-teardown-perm-startfromcg` | 1 | 1 | 0 | 0 | 0 | 0 |
| `eperm07-term-trigger` | 1 | 1 | 0 | 0 | 0 | 0 |
| `invitation-contract` | 15 | 15 | 0 | 0 | 0 | 0 |
| `invitation-landing` | 3 | 3 | 0 | 0 | 0 | 0 |
| `performance` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-1e1cg1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-2e-asymmetric` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-2e-shared` | 2 | 2 | 0 | 0 | 0 | 0 |
| `perm-access-disable` | 3 | 3 | 0 | 0 | 0 | 0 |
| `perm-answers-locked` | 4 | 4 | 0 | 0 | 0 | 0 |
| `perm-closed-project` | 11 | 11 | 0 | 0 | 0 | 0 |
| `perm-disable-allow-open` | 3 | 3 | 0 | 0 | 0 | 0 |
| `perm-disable-election-1co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-disable-election-2co` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-disjoint-1co` | 2 | 2 | 0 | 0 | 0 | 0 |
| `perm-header-show-help` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-hide-all-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-hide-category-tags` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-hide-election-tags` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-hide-hero` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-hide-if-missing-answers` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-interactive-info` | 4 | 4 | 0 | 0 | 0 | 0 |
| `perm-localisation-positive` | 2 | 2 | 0 | 0 | 0 | 0 |
| `perm-missing-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `perm-no-nomination` | 68 | 68 | 0 | 0 | 0 | 0 |
| `perm-not-located-2e2cg` | 5 | 5 | 0 | 0 | 0 | 0 |
| `perm-org-matching` | 3 | 3 | 0 | 0 | 0 | 0 |
| `perm-organization-editing` | 46 | 46 | 0 | 0 | 0 | 0 |
| `perm-per-app-notifications` | 2 | 2 | 0 | 0 | 0 | 0 |
| `perm-question-video` | 4 | 4 | 0 | 0 | 0 | 0 |
| `perm-show-feedback-survey` | 6 | 6 | 0 | 0 | 0 | 0 |
| `perm-startfromcg` | 2 | 2 | 0 | 0 | 0 | 0 |
| `storage-cleanup` | 3 | 3 | 0 | 0 | 0 | 0 |
| `voter-alliance` | 1 | 1 | 0 | 0 | 0 | 0 |
| `voter-dark-mode` | 1 | 1 | 0 | 0 | 0 | 0 |
| `voter-journey` | 2 | 2 | 0 | 0 | 0 | 0 |
| `voter-journey-mobile` | 1 | 1 | 0 | 0 | 0 | 0 |
| `voter-nominations` | 1 | 1 | 0 | 0 | 0 | 0 |
| `voter-prefs-tracking` | 3 | 3 | 0 | 0 | 0 | 0 |
| `voter-results-redraw` | 5 | 5 | 0 | 0 | 0 | 0 |

Sum of the totals: 341.

### The sentences that name the run

The quick task's SUMMARY (`.planning/quick/261010-f1-b2-operator-replies/SUMMARY.md`) names its closing unloaded full run in this row:

> | full E2E, `176-e2e.sh 261010-f1-b2-final` | 0 | 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects; 11:57:10Z to 12:06:22Z; no void marker |

That run (`tests/e2e-runs/176-e2e/261010-f1-b2-final`, head `d228b52bc6c48d878bdd865b168a1831eef0d546`) is complete and green and is **not** of the base commit's tree: `git diff --quiet d228b52bc ae55fb89b -- . ':(exclude).planning'` exits 1. The commits between them that change a file outside `.planning/`:

- `ae55fb89b docs(e2e): the README says which specs attach the page console that names a socket loss`
- `1f765a6db fix(e2e): the run wrapper holds a sleep assertion for the life of the run`

The run of the base commit's tree is named by `.planning/phases/177-define-nominations/177-DISPATCH.md` and recorded in `.planning/debug/voter-journey-category-intro.md`:

> tests/e2e-runs/176-e2e/261011-vj-final: wrapper exit 0, driver exit 0; 341 total, 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 113 projects; 23:31:18Z to 23:40:05Z; AC power at both ends; no Sleep entry; no void marker; `sleep_assertion=caffeinate -dimsu`; heartbeat max 111 ms. Against 261010-f1-b2-final: 113 projects compared, 0 different in counts.

### Scans

A scan is a test whose title holds "axe accessibility scan", counted in `results.json`.

- `contestant-a11y-scan`: 24 scan(s) of its 24 test(s), 24 passed
- `perm-no-nomination`: 12 scan(s) of its 68 test(s), 12 passed

## Gate runs, each quoted from its log line

- **`tests/e2e-runs/176-gates/261010-f1-b2-final`** (head `d228b52bc`, the quick task's closing gate run): rows lint=0 unit=0 check-frontend=0 build=0 format=0
  - frontend unit: `@openvaa/frontend:test:unit:  Test Files  194 passed | 1 skipped (195)` · `@openvaa/frontend:test:unit:       Tests  3575 passed | 20 skipped (3595)`
- **`tests/e2e-runs/176-gates/261011-vj-final`** (head `ae55fb89b`, the gate run of the base commit's tree): rows lint=0 unit=0 check-frontend=0 build=0 format=0
  - frontend unit: `@openvaa/frontend:test:unit:  Test Files  194 passed | 1 skipped (195)` · `@openvaa/frontend:test:unit:       Tests  3575 passed | 20 skipped (3595)`
- Neither holds a `pgtap` row. Phase 176's closing gate run, **`tests/e2e-runs/176-gates/176-19-final`** (head `0ca0305c0`): rows typecheck=0 lint=0 db-reset=0 types-regen=0 types-clean=0 pgtap=0 sql-lint=0 integration=0 unit=0 check-frontend=0 build=0 format=0 docs-links=0 name-gate-self-test=0
  - pgTAP: `Files=42, Tests=1957,  5 wallclock secs ( 0.12 usr  0.06 sys +  0.22 cusr  0.15 csys =  0.55 CPU)` · `Result: PASS`
  - frontend unit: `@openvaa/frontend:test:unit:  Test Files  192 passed | 1 skipped (193)` · `@openvaa/frontend:test:unit:       Tests  3567 passed | 20 skipped (3587)`
  - `apps/supabase/supabase/` between that head and the base commit: `git diff --quiet` exits 0

## Phase 176's and the quick task's names, each read on the tree

Read at head `f41c8a03d70973298a70024d026dece57bf369a6`.

| Name | Where | Found | Reaches |
|---|---|---|---|
| the sign-in helper, tracked | `tests/tests/setup/shared/registerAndStoreSession.ts` | found | 177-10, 177-16 |
| `export function taskStateOf` | `apps/frontend/src/lib/contestant/tasks/taskState.ts` | found | 177-15, 177-18, 177-19 |
| `export function hasNomination` | `apps/frontend/src/lib/contestant/tasks/taskState.ts` | found | 177-15, 177-18, 177-19 |
| `export function nominationsViewTarget` | `apps/frontend/src/lib/contestant/tasks/taskState.ts` | found | 177-15, 177-18, 177-19 |
| `export function profileSaveTarget` | `apps/frontend/src/lib/contestant/tasks/taskState.ts` | found | 177-15, 177-18, 177-19 |
| `export function questionSaveTarget` | `apps/frontend/src/lib/contestant/tasks/taskState.ts` | found | 177-15, 177-18, 177-19 |
| route key `ContestantAppNominations` | `apps/frontend/src/lib/routes/route.ts` | found | 177-15 |
| `export const CONTESTANT_NOMINATED` | `apps/frontend/src/lib/routes/route.ts` | found | 177-15 |
| `CREATE OR REPLACE FUNCTION public.get_entity_nominations` | `apps/supabase/supabase/schema/503-entity-rpcs.sql` | found | 177-06 |
| `private.caller_entity_ids` called inside `get_entity_nominations` | `apps/supabase/supabase/schema/503-entity-rpcs.sql` | found | 177-06 |
| its pgTAP file, tracked | `apps/supabase/supabase/tests/database/42-entity-nominations.test.sql` | found | 177-06 |
| member `nominationsLocked` of the context type | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | 177-15 to 177-19 |
| member `answersLocked` of the context type | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | 177-15 to 177-19 |
| member `taskState` of the context type | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | 177-15 to 177-19 |
| member `nominations` of the context type | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | 177-15 to 177-19 |
| descriptor member `nominationParentLabel` | `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts` | found | 177-12 |
| descriptor member `electionSymbolLabel` | `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts` | found | 177-12 |
| the `reason` union: `reason: 'answersLocked' | 'nominationsLocked';` | `apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts` | found | 177-12 |
| `export async function setNominationState` | `tests/tests/fixtures/contestant/perm-no-nomination.ts` | found | 177-10, 177-11, 177-19, 177-20 |
| `export async function setNominationsLocked` | `tests/tests/fixtures/contestant/perm-no-nomination.ts` | found | 177-10, 177-11, 177-19, 177-20 |
| `export function declareScans` | `tests/tests/utils/contestantAxeScan.ts` | found | 177-10, 177-11, 177-19, 177-20 |
| step `expectNoHorizontalOverflow` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 177-10, 177-11, 177-19, 177-20 |
| step `expectInside` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 177-10, 177-11, 177-19, 177-20 |

### The project chain (`tests/playwright.config.ts`)

- `data-setup-perm-analytics-tracking` depends on `["perm-no-nomination"]` (plan 177-10 puts its own link before it).
- `perm-startfromcg` is among the projects `perm-no-nomination` depends on, directly or through the chain: yes. `perm-no-nomination` is not among those `perm-startfromcg` depends on: yes.
- `perm-no-nomination` depends on `["data-setup-perm-no-nomination"]`; `data-setup-perm-no-nomination` on `["perm-organization-editing"]`.

### pgTAP files

42 test files tracked under `apps/supabase/supabase/tests/database/`; the highest number is 42, the next free number is 43.

### Lines stating an election type under `packages/dev-seed/src` (plan 177-02)

`git grep -n "election_type" -- packages/dev-seed/src`: 26 line(s) in 18 file(s).

| File | Lines | Values |
|---|---|---|
| `packages/dev-seed/src/generators/ElectionsGenerator.ts` | 1 | `candidate_only` |
| `packages/dev-seed/src/template/permittedKeys.ts` | 1 | `(no literal: the key's own name)` |
| `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/default.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/base.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts` | 2 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts` | 1 | `organization_list` |
| `packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts` | 2 | `organization_list` |

## The UI contract's round

`177-UI-SPEC.md`, from `## PROPOSED` to `## Checker Sign-Off` (261 lines, 86 boxes): 0 line(s) beginning with a ticked box, 0 line(s) beginning with a bold NOTE or EDIT marker; `status: approved`; the sign-off's paragraph recording the reading of 2026-10-10 is present.

## Operator rulings as read

Read by `node .planning/phases/177-define-nominations/177-read-rulings.mjs .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md G` (the document and the letters are the two lines of `177-OPERATOR-ROUND`), exit 0; the document at commit `c1bfd248766f07c6c21e2240e15b1b1eff9ed2b3`, blob `8a5e9dc27d4dea73dcfcedf3ada66a97132163a7`, with no uncommitted change (`git diff --quiet HEAD` exits 0). Each line below is the script's own, behind a leading `- `.

- G1: recommended-unticked (a)
- G2: recommended-unticked (a)
- G3: recommended-unticked (a)
- G4: recommended-unticked (a)
- G5: recommended-unticked (a)
- G6: recommended-unticked (a)
- G7: recommended-unticked (a)
- G8: recommended-unticked (a)
- G9: recommended-unticked (a)
- G10: recommended-unticked (a)
- G11: recommended-unticked (a)
- G12: recommended-unticked (a)
- G13: recommended-unticked (a)
- G14: recommended-unticked (a)
- G15: recommended-unticked (a)
- G16: recommended-unticked (a)
- G17: recommended-unticked (a)
- G18: recommended-unticked (a)

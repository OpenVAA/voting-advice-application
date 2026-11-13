---
phase: 170-contestant-app-rename-symbols-routes
plan: 03
subsystem: testing
tags: [rename, playwright, e2e, test-ids, a11y-gate, visual-regression, fixtures, codemod]

requires:
  - phase: 170-01
    provides: "The mapping table and codemod, the search gate, the gate, E2E and verdict drivers, the recorded baseline (171 / 171 / 0 skipped) and its per-project counts"
  - phase: 170-02
    provides: "The app served under /contestant, with the suite's URL literals already naming the new routes; the stack on the new allowlist"
provides:
  - "Every app-level test name in its contestant form: the three test directories, the fixture, setup and spec files, five Playwright projects, the tag, the registry namespace, the page-object and helper identifiers"
  - "The app's 34 test ids under the contestant- prefix, in source, in the registry and at every raw-string use"
  - "scripts/assert-a11y-scan-wiring.mjs asserting the renamed project and spec"
  - "The two preview baselines under their new names, the same blobs, proven by one in-container visual run that wrote nothing"
  - "A scroll-survival test in voter-results-redraw.spec.ts that starts from a settled layout"
affects: [170-04, 171, 173, 174, 178, 179]

actuals:
  tokens: 95229
  tasks: 3
  commits: 6
plan_head_before: 91cb8087d57a34e41180b3eb9152868bf20843d7
plan_head_after: d976884b79177c7dadf1d7628d5b7c88662266ae

tech-stack:
  added: []
  patterns:
    - "A red E2E run is diagnosed from its own trace (action log, screencast frames, arithmetic on the recorded values) and the diagnosis re-tested in isolation with a probe that is not committed, before any fix"
    - "A test that asserts a scroll offset across a click establishes its baseline on a settled layout: a retried Playwright click scrolls"
    - "A visual baseline moves by git mv in the pure-move commit and its screenshot argument in the content commit; the blob ids and an empty git status after the run are the proof, not the run's colour"

key-files:
  created:
    - .planning/phases/170-contestant-app-rename-symbols-routes/evidence/plan-03-start-rev.txt
  modified:
    - tests/tests/fixtures/contestant/ (moved from fixtures/candidate/, 14 files)
    - tests/tests/setup/contestant/ (moved from setup/candidate/, 4 files)
    - tests/tests/specs/contestant/ (moved from specs/candidate/, 4 files)
    - tests/tests/specs/a11y/contestant-a11y.spec.ts (moved)
    - tests/tests/utils/contestantJourneyConstants.ts (moved)
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/contestant-preview-desktop.png (moved, same blob)
    - tests/tests/specs/visual/__screenshots__/visual-regression.spec.ts/contestant-preview-mobile.png (moved, same blob)
    - tests/playwright.config.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/specs/visual/visual-regression.spec.ts
    - tests/tests/specs/voter/voter-results-redraw.spec.ts
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md
    - tests/eslint.config.mjs
    - scripts/assert-a11y-scan-wiring.mjs
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/routes/contestant/ (seven pages, test ids only)
    - apps/frontend/src/lib/layouts/main/Banner.svelte
    - apps/frontend/src/lib/routes/appGates.test.ts
    - apps/frontend/src/routes/admin/layout.server.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-per-app-notifications.ts
    - .planning/phases/170-contestant-app-rename-symbols-routes/170-EVIDENCE.md
    - .planning/phases/170-contestant-app-rename-symbols-routes/deferred-items.md

key-decisions:
  - "The plan's first closing E2E run was red on a voter spec the rename does not touch; the cause was diagnosed and fixed in the test, and the gate set and the E2E run were both made again on the fixed tree under new labels"
  - "The names of map row P3-13c were renamed as ruling 3 states, although all 13 matches are outside tests/ and the one live helper reads as entity-typed; put to the operator rather than overruled"
  - "No map row was tightened or added in this plan; app-flavoured locals that no row and no gate pattern names were left alone and logged"
  - "The service-role key the storage poll needs was taken from supabase status into a shell variable, never from .env"

patterns-established:
  - "A re-run after a fix takes the label <label>-r2 for the gate set and for the E2E run alike, and the verdict resolves to it"
  - "The dev server for the visual run is started under set -m and stopped by its process group"

requirements-completed: [NAME-01]

coverage:
  - id: D1
    description: "The three test directories, the fixture, setup and spec files (the three bank-auth specs and the a11y spec included), contestantJourneyConstants.ts and the two baselines moved by a pure-move commit at 100% similarity; none of the three old directories exists"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "git show -M100% --name-status --format= d025b96a6 | awk '$1 != \"R100\"' (prints nothing; 26 files, 0 insertions, 0 deletions)"
        status: pass
      - kind: other
        ref: "node rename.mjs --check --plan 3 && test ! -e tests/tests/{fixtures,setup,specs}/candidate (exit 0; 0 rewrites, 0 moves, 0 collisions pending)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The five Playwright projects, the tag @contestant-session, the registry namespace testIds.contestant and the page-object, session and helper identifiers carry contestant names, and the same tests are enumerated as before"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "yarn playwright test -c ./tests/playwright.config.ts --list --grep-invert @probe (exit 0; Total: 171 tests in 99 files before and after; per-project counts identical for all 100 projects with the name normalised)"
        status: pass
      - kind: other
        ref: "yarn typecheck:tests && yarn eslint tests (exit 0); gate row residue in 170-03-close-r2 (groups symbols,urls,tests: 0 findings outside the generated docs subtrees, tests 0 anywhere)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The app's test ids are contestant-… in the eight source files that declare them, in testIds.ts and at every raw-string use; their count equals the count at the base revision"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "git grep over apps/frontend/src for data-testid values: 34 distinct contestant- ids in 8 files at HEAD, 34 distinct candidate- ids at the base revision, 0 candidate- test ids left (170-EVIDENCE.md section 4.4)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-03-close --same-total-as 170-01-baseline (exit 0; contestant-journey 1/1 and contestant-a11y-scan 14/14 drive every one of the ids)"
        status: pass
    human_judgment: false
  - id: D4
    description: "scripts/assert-a11y-scan-wiring.mjs asserts the project contestant-a11y-scan and the spec contestant-a11y.spec.ts and exits 0; the scan runs as many tests as under its old name"
    requirement: NAME-01
    verification:
      - kind: other
        ref: "node scripts/assert-a11y-scan-wiring.mjs (exit 0, 0 violations); gate row lint in 170-03-close-r2 (status 0)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-03-close … --renamed-project contestant-a11y-scan=candidate-a11y-scan (exit 0; total 14, as the old name had; the old name absent)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The two preview baselines are the same blobs under their new names, and one in-container visual run compares against them with zero unexpected results and writes no file"
    requirement: NAME-01
    verification:
      - kind: automated_ui
        ref: "node 170-verdict.mjs visual 170-03-visual (exit 0; status 0, expected 7, unexpected 0, flaky 0, skipped 0)"
        status: pass
      - kind: other
        ref: "node 170-verdict.mjs baselines (exit 0; blobs 402f4bf8d and 887818864 unchanged; git status --porcelain on __screenshots__/ prints nothing)"
        status: pass
    human_judgment: false
  - id: D6
    description: "One full E2E run is green with the baseline's total, passed and skipped counts, and each of the five renamed projects ran exactly as many tests as under its old name"
    requirement: NAME-01
    verification:
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-03-close --same-total-as 170-01-baseline with the five --renamed-project pairs (exit 0; resolved to 170-03-close-r2: 171 passed of 171, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
      - kind: other
        ref: "node 170-verdict.mjs gates 170-03-close (exit 0; resolved to 170-03-close-r2: 14 rows at status 0, not stale)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The scroll-survival test of voter-results-redraw.spec.ts no longer reads its baseline while the results landing is still moving"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/170-e2e/170-03-redraw-probe-1 (isolated project run, wrapper exit 0, 7 passed; probe readings: 28 finite animations and a 58 px taller document before the settle, 0 and stable after it)"
        status: pass
      - kind: e2e
        ref: "node 170-verdict.mjs e2e 170-03-close … (exit 0; voter-results-redraw 5/5 in 170-03-close-r2)"
        status: pass
    human_judgment: true
    rationale: "The mechanism is measured and the fix removes the observed cause, but the failure's rate before and after is not measured: it occurred once in four default-suite runs. One green run is not a rate. Whether the class (any retried click scrolls) should be closed in the spec is a call for whoever owns it; it is logged in deferred-items.md row 3."
  - id: D8
    description: "No visual baseline was updated, re-captured or regenerated, and no test id, fixture or helper that names the entity was renamed (PROH-170-05, PROH-170-06)"
    requirement: NAME-01
    verification: []
    human_judgment: true
    rationale: "The plan marks both prohibitions as verified by judgment. PROH-170-05 is backed by measurement (no update flag in the run's arguments, unchanged blob ids, an empty git status). PROH-170-06 has one name the executor reads as entity-typed and renamed anyway because ruling 3 names it: setupCandidateSession in supabaseDataWriter.test.ts. The operator should see that call."
  - id: D9
    description: "The local database was reset twice by the visual recipe and left at migrations plus seed.sql; the stack is up and healthy on the new allowlist"
    verification:
      - kind: other
        ref: "tests/e2e-runs/170-gates/170-03-db-reset-{1,2}.exit hold 0; GET /storage/v1/bucket 200; projects holds only the default project; 170-allowlist-probe.sh after (exit 0)"
        status: pass
    human_judgment: false

duration: 43min
completed: 2026-10-05
status: complete
---

# Phase 170 Plan 03: Contestant App Rename — Test Naming Summary

**Every app-level test name — three directories, 26 paths, five Playwright projects, the tag, 34 test ids, the registry namespace and the fixture identifiers — is its contestant form, with the same 171 tests enumerated and run project by project, the two preview baselines proven to be the same bytes by an in-container visual run, and one intermittent voter test that reddened the first closing run diagnosed from its trace and fixed.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-10-05T19:58:57Z
- **Completed:** 2026-10-05T20:42:00Z
- **Tasks:** 3 of 3
- **Files changed:** 86 (84 outside `.planning/`)
- **Start revision:** `91cb8087d57a34e41180b3eb9152868bf20843d7` (pinned in `evidence/plan-03-start-rev.txt`)

## The Names Later Plans and `tests/README.md` Cite

**Playwright projects (five):**

| New name | Was |
|---|---|
| `contestant-journey` | `candidate-journey` |
| `data-setup-contestant-journey` | `data-setup-candidate-journey` |
| `data-teardown-contestant-journey` | `data-teardown-candidate-journey` |
| `contestant-a11y-scan` | `candidate-a11y-scan` |
| `cold-entry-dataroot-contestant` | `cold-entry-dataroot-candidate` |

**Tag:** `@contestant-session` (was `@cand-session`), in `grep` of `cold-entry-dataroot-contestant` and in `grepInvert` of `cold-entry-dataroot`.

**Directories:** `tests/tests/fixtures/contestant/`, `tests/tests/setup/contestant/`, `tests/tests/specs/contestant/`. The opt-in projects `bank-auth` and `bank-auth-journey` keep their names; their `testDir` and `testMatch` follow the moved specs (`contestant-bank-auth.spec.ts`, `contestant-bank-auth-journey.spec.ts`).

**Registry namespace:** `testIds.contestant` (135 uses). **Marker strings:** `contestant-nav-menu`, `[notif-contestant]`, `[notif-contestant-content]`.

## Totals Before and After

| | Before the plan | After |
|---|---|---|
| Default suite, enumerated (`--list --grep-invert @probe`) | 171 tests in 99 files, 100 projects | 171 tests in 99 files, 100 projects |
| The three renamed spec projects with their dependencies, enumerated | 21 tests in 8 files | 21 tests in 8 files |
| Default suite, run | 171 passed of 171 (`170-01-baseline`) | 171 passed of 171 (`170-03-close-r2`) |
| `contestant-journey` / `candidate-journey` | 1 / 1 | 1 / 1 |
| `data-setup-…-journey` | 1 / 1 | 1 / 1 |
| `data-teardown-…-journey` | 1 / 1 | 1 / 1 |
| `contestant-a11y-scan` / `candidate-a11y-scan` | 14 / 14 | 14 / 14 |
| `cold-entry-dataroot-contestant` / `-candidate` | 1 / 1 | 1 / 1 |
| Distinct app test ids declared in the eight source files | 34 (`candidate-…`, at the base revision) | 34 (`contestant-…`), 0 old ones left |

## Accomplishments

- Moved 26 paths by a pure-move commit at 100% similarity, the two baseline PNGs among them, and rewrote 915 matches in 78 files in the content commit, with the formatter's output in a third.
- Moved the a11y wiring gate with the names it asserts, so the contestant scan cannot drop out silently under its new names.
- Closed green on fourteen gate rows and a 171-test E2E run in which each of the five renamed projects ran exactly the tests it ran under its old name.
- Diagnosed the one red run from its own trace, re-tested the diagnosis in isolation, and fixed the test.
- Ran the visual project once inside the pinned Linux/x86_64 image against the moved baselines: 7 expected, 0 unexpected, nothing written.

## Task Commits

1. **Task 1: Move and rename, in three commits**
   - `d025b96a6` `test[e2e](170-03): move the app's fixtures, setup, specs and baselines to contestant names` — the pure move: 26 paths, every row `R100`, 0 insertions and 0 deletions. Does not run.
   - `705c2eb50` `test[e2e](170-03): rename the contestant app's projects, tag, test ids and fixture names` — the content: 78 files, 764 insertions and 764 deletions. 915 codemod rewrites plus the hand edits in `testIds.ts`.
   - `f0f221eff` `style(170-03): import order and line width after the test rename` — formatter output in three files, and the README diagram's boxes re-squared by hand.
2. **Task 2: Close plan 3 on the gate set and one full E2E run**
   - `d21e837ef` `test[e2e](170-03): start the results scroll-survival case from a settled layout` — the fix for the red run.
   - `f23b5b36b` `docs(170-03): record the test rename, the plan-3 gate set, the red E2E run and its fix` — evidence sections 4.1 to 4.7 and the start revision.
3. **Task 3: One in-container visual run**
   - `d976884b7` `docs(170-03): record the in-container visual run against the moved baselines` — evidence section 4.8.

## Gate, E2E and Visual Results

| What | Label / command | Exit | Result |
|---|---|---|---|
| Closing gate set, first | `170-gates.sh 170-03-close --plan 3` (head `f0f221eff`) | 0 | 14 rows, all 0 |
| Closing E2E, first | `170-e2e.sh 170-03-close` (head `f0f221eff`) | **1** | 171 total, 164 passed, **1 failed**, **6 did not run** |
| Isolated re-test | `e2e-run.sh --run-dir …/170-03-redraw-probe-1 --no-db-reset --project voter-results-redraw` | 0 | 7 passed; probe readings in section 4.7 |
| Closing gate set, on the fixed tree | `170-gates.sh 170-03-close-r2 --plan 3` (head `d21e837ef`) | 0 | 14 rows, all 0 |
| Closing E2E, on the fixed tree | `170-e2e.sh 170-03-close-r2` (head `d21e837ef`) | 0 | 171 total, 171 passed, 0 failed, 0 flaky, 0 skipped, 0 did-not-run |
| `170-verdict.mjs gates 170-03-close` | | 0 | resolved to `-r2`; not stale |
| `170-verdict.mjs e2e 170-03-close --same-total-as 170-01-baseline` + five `--renamed-project` pairs | | 0 | resolved to `-r2`; each renamed project's total equals its old name's; no old name present |
| Visual run | `visual-container.sh --run-dir …/170-03-visual` | 0 | `status` 0; expected 7, unexpected 0, flaky 0, skipped 0 |
| `170-verdict.mjs visual 170-03-visual` | | 0 | |
| `170-verdict.mjs baselines` | | 0 | both blobs unchanged; nothing uncommitted or untracked under `__screenshots__/` |
| `rename.mjs --check --plan 3` | | 0 | nothing pending |
| `assert-a11y-scan-wiring.mjs` | | 0 | 0 violations |
| `assert-no-candidate-app-names.mjs --report --only tests` | | 0 | 0 findings |
| `170-allowlist-probe.sh after`, after the two resets | | 0 | the new allowlist |

Run directories: `tests/e2e-runs/170-gates/170-03-close`, `tests/e2e-runs/170-gates/170-03-close-r2`, `tests/e2e-runs/170-e2e/170-03-close` (red), `tests/e2e-runs/170-e2e/170-03-redraw-probe-1`, `tests/e2e-runs/170-e2e/170-03-close-r2`, `tests/e2e-runs/170-e2e/170-03-visual`. The full record is `170-EVIDENCE.md` section 4.

## The Red Run and Its Fix

The first closing E2E run failed one test and, behind it, did not run six. The test is `voter-results-redraw.spec.ts` › "scroll survives entity open, entity close and an entity-tab switch, and neither subtree remounts": expected `scrollY` 1095, received 1394. The six are the closed-project trio, which depends on every other project. Neither the spec nor any page it drives is touched by this plan's commits.

**The cause, confirmed in both halves:**

1. The walk to `/results` ends with an election selection. For about 400 ms afterwards the de-selected option and the "select an election first" placeholder slide out above the list, so every card moves upward. Measured in isolation at the instant the test would begin: 28 finite animations running, the document 58 px taller than its settled state, and the fourth card's title 58 px lower; after the animations finish, none running and no further movement.
2. Playwright retries a click on a target that is not stable, and each retry index scrolls the target with a different forced alignment before clicking (`playwright-core` 1.63.0, `_retryPointerAction`). In the failing run's trace the click logged `element is not stable` three times and succeeded on the fourth attempt, whose alignment is `block: 'start'`. That scrolled the page to its end: `1394 = 2114 − 720`, the document's maximum offset. The baseline had already been read.

**The fix** (`d21e837ef`): the test awaits the document's finite animations before its scrolled start, with `awaitAnimationsSettled`, the helper the a11y specs already use. One import, one statement and its comment. Nothing in the application changes. The tree was not re-run unchanged: the gate set and the E2E run were both made again on the fixed head.

**What is not claimed.** The failure's rate is not measured, before or after: it occurred once in the four default-suite runs made before the fix and not in the isolated run. A click retried for any other reason would scroll the same way; that class is logged in `deferred-items.md` row 3 and not closed.

## The Visual Run

- **Image:** `mcr.microsoft.com/playwright@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27` (`amd64 linux`, present locally; the script did not pull).
- **Port:** 5173, the script's default; nothing was listening there.
- **Observed:** `status` 0; `observed_expected=7`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0`, one worker, no retries, 69 s. The seven: base setup, auth setup, four screenshot comparisons, base teardown. `uname_m=x86_64` inside the container.
- **No update flag** was passed, and `git status --porcelain tests/tests/specs/visual/__screenshots__/` prints nothing after the run.
- **Blob ids, unchanged from the base revision:** `402f4bf8d8af61bfc2db5fac26d4df25d8acbebc` (`contestant-preview-desktop.png`), `8878188644373d9a6069c98b46819d4be546f2a5` (`contestant-preview-mobile.png`).

**The visual recipe reset the local database twice.** Any earlier local data is gone — the E2E project's row and whatever a developer had seeded into the default project. The first reset is the recorded recipe's; the second removed what `yarn db:seed --template e2e/base` and the visual project left behind. The database is at migrations plus `seed.sql`: `projects` holds only `00000000-0000-0000-0000-000000000001` and `elections` is empty. The next E2E run creates the E2E project again in its global setup.

## Names Judged Entity-Typed and Left Alone

- `testIds.voter.results.candidateSection` and every other `testIds.voter.…` member (10 uses of that one, before and after).
- `candidateTab: /candidate/i` in `voter-journey.spec.ts`, as in plan 2.
- `unregisterCandidate`, `candidateIdsForUser` and the credentials and seed constants: `TEST_CANDIDATE_EMAIL`, `TEST_CANDIDATE_PASSWORD`, `TEST_CANDIDATE_EXTERNAL_ID`, `UNREGISTERED_CANDIDATE_EMAIL`, `UNREGISTERED_CANDIDATE_EXTERNAL_ID`, `CANDIDATE_EMAIL`, `CANDIDATE_EXTERNAL_ID`.
- Locals that hold a candidate: `candidateEmail`, `candidateId`, `candidateIds`, `candidateExternalId`, `candidateCard`, `candidateCardFi`, `candidateError`, `candidateErrorValue`.
- The seeded notification's text (`'[notif-contestant] Candidate-only notification.'`): the marker is renamed, the words after it are not.
- The prose "candidate app" and "Candidate-journey" in comments and in `tests/README.md`: prose is plan 170-04's.

No test id that names the entity exists in the eight source files: all 34 ids under the eight stems are the app's, and no `data-testid` value holding `candidate` is left in `apps/frontend/src`.

## Decisions Made

Nothing in the plan's decisions was decided differently, and no map row was tightened or added. Calls the plan does not make are the four under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] An intermittent voter test reddened the plan's closing E2E run**
- **Found during:** Task 2, the first closing run.
- **Issue:** `voter-results-redraw.spec.ts` read its scroll baseline while the results landing was still settling; a retried Playwright click then scrolled the page. See *The Red Run and Its Fix*.
- **Fix:** `awaitAnimationsSettled(page)` before the test's scrolled start.
- **Files modified:** `tests/tests/specs/voter/voter-results-redraw.spec.ts`. It is not a file of the rename; `tests/tests/**` is in the plan's `files_modified`.
- **Verification:** the isolated probe run, then the gate set and the full E2E run on the fixed head.
- **Committed in:** `d21e837ef`.
- **Why it was fixed here and not deferred:** the project's E2E rule lets no task complete on a red suite and admits no known-flaky exemption, and the plan's own instruction for a red run is to diagnose, fix with a new commit and run again under a new label.

**2. [Rule 1 - Bug] Two comments in `testIds.ts` cited members by the old namespace path**
- **Found during:** Task 1, step 5.
- **Issue:** `candidate.passwordSetter.confirm` and `candidate.profile.imageUpload` are written without the `testIds.` prefix, so row P3-10 does not see them, and the namespace-key edit made both false.
- **Fix:** both name `contestant.…` (a correction of fact under D-21).
- **Committed in:** `705c2eb50`.

**3. [Rule 3 - Blocking] The README's project diagram could not be left to the formatter**
- **Issue:** the longer names pushed two boxes of the fenced diagram out of square, and plan 1's name had done the same to one line of the third. Prettier does not touch a fenced block.
- **Fix:** the three boxes re-squared by hand, in the formatter commit, said in its message.
- **Committed in:** `f0f221eff`.

**4. [Scope boundary] One unrelated autofix was kept out of the formatter commit a third time**
- `yarn lint:fix` again proposed the removal of the unused `eslint-disable` directive in `tests/tests/support/mockOidcIssuerEntry.ts`; it was dropped.

### Departures in procedure

- **Polling.** The plan prescribes a `sleep` of at most 60 seconds as its own command between polls. This harness blocks a standalone `sleep`; each wait was a bounded loop on the marker file instead (`until test -f <marker> …; do sleep 2; done`, at most about four minutes per command). The markers, logs and ceilings are as the plan states.
- **The storage poll needs a key.** `GET /storage/v1/bucket` answers 200 only with an API key. It was read from `supabase status -o env` into a shell variable and not printed; `.env` was not read.
- **The gate set ran twice,** because the fix changed the tree between the first gate run and the closing E2E run; a verdict on a stale gate run would have failed.

### Commits the plan's output list does not name

The plan lists a pure-move commit, a content commit and a formatter commit. There are three more: the test fix (`d21e837ef`) and two evidence commits (`f23b5b36b`, `d976884b7`).

---

**Total deviations:** 4 (1 test fix outside the rename, 1 comment correction, 1 hand formatting, 1 scope exclusion), plus three departures in procedure.
**Impact on plan:** deviation 1 is the only one that changes what a test does, and it changes one test's precondition. No application behaviour changed in this plan: the application diff is 37 `data-testid` values and one import alias.

## Changes for the Operator's Eye

- **`setupCandidateSession` was renamed to `setupContestantSession`, and it reads as entity-typed.** All 13 matches of map row P3-13c are outside `tests/`. Nine are that helper in `supabaseDataWriter.test.ts`, whose docstring says it sets up "a mock session with candidate role JWT" and which mints a grant with `target_type: 'candidate'` — the same kind of name as `UserRole`, which the research ruled entity-derived. The other four are comment mentions in dev-seed templates of `mintCandidateSession` and `candidateSessionMinter`, helpers that exist nowhere in the tree. Ruling 3 and the plan's artifact list name all three as renamed, and the gate carries the pattern with a fixture positive, so the row was applied as written rather than overruled. Reverting is one map row, one gate pattern and its fixture line.
- **A voter spec was changed in a rename plan** (deviation 1). The change is one statement.
- **The local database was reset twice** (*The Visual Run*).
- **No `CLAUDE.md` or `.claude/skills` file changed in this plan,** although both are in its `files_modified`: no row of plan 3 matches anything in them.

## Deferred Issues

Logged in `deferred-items.md`, none fixed:

3. The class behind the red run: in `voter-results-redraw.spec.ts` two of the three scroll-equality assertions sit behind a Playwright click, and any retried click scrolls. Only the observed cause was removed.
4. Two app-flavoured locals with no map row and no gate pattern keep their names: `candidatePayloadSatisfiesTheHelper` (`routes/admin/layout.server.test.ts`) and `candidateDialog` (`perm-per-app-notifications.spec.ts`).
5. Two comments cite spec files that are not in the tree, and four dev-seed comments name helpers that exist nowhere.
6. The `yarn lint:fix` proposal of deviation 4.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification that was not run.

## Issues Encountered

One red E2E run, described above. No gate row was red, and the visual run was green on its first attempt.

## Known Stubs

None.

## Next Plan Readiness — What 170-04 Must Know

- **Compare against:** E2E `170-01-baseline` for the counts (171 / 171 / 0 skipped). The last green tree is `d21e837ef` (gate set and E2E `170-03-close-r2`). The wrapper's port is 5273.
- **The old project names are gone.** A verdict that uses `--expect-project` or `--renamed-project` names `contestant-journey`, `contestant-a11y-scan`, `cold-entry-dataroot-contestant`, `data-setup-contestant-journey`, `data-teardown-contestant-journey`. `bank-auth` and `bank-auth-journey` are unchanged, and `170-bankauth.sh` drives them by name; their specs are now `tests/tests/specs/contestant/contestant-bank-auth{,-journey}.spec.ts` and the `testMatch` regexes follow. The bank-auth projects were not run in this plan.
- **The database is at migrations plus `seed.sql`,** which is where plan 170-04 Task 1 starts from. The stack is up and healthy, on the new allowlist, with the default function environment.
- **Carried by the gate rows, unchanged from plan 2:** docs-links 15 set-aside findings and residue 70 lines (symbols 42, urls 28, tests 0), all under `frontend/components/generated/`. With `--plan 4` both rows lose their set-aside and the residue row adds group `prose`.
- **Group `tests` of the search gate is at 0 everywhere,** the generated docs subtrees included.
- **`tests/README.md` and `tests/IDURA-TEST-RUNBOOK.md` name the new paths and projects** but still say "candidate app", "candidate-app fixtures" and "Candidate-journey" in prose; rows P4-01 and P4-02 are plan 170-04's. The README diagram was re-squared by hand: if a prose row lengthens a line inside that fenced block (`candidate settings-perm chain:` is one), the box needs the same treatment, since the formatter does not reach it.
- **A red `voter-results-redraw` run is not expected again from the cause fixed here.** If the same assertion fails with a received offset equal to the document height minus 720, read the click's log in the trace for `retrying click action` before suspecting the application (`deferred-items.md` row 3).
- **`yarn lint:fix`** proposes the unrelated change of deviation 4 every time.
- **Frontend unit count:** 2037 tests in 130 files, unchanged.
- **Host state:** nothing listens on 5173, 5273, 8777 or 9443. A Vite dev server on port 5199 belongs to another session and was left alone. `CAND-APP-PLAN.md` is untracked and untouched.

## Self-Check: PASSED

- `evidence/plan-03-start-rev.txt` exists, as do the three moved directories, `tests/tests/specs/a11y/contestant-a11y.spec.ts`, `tests/tests/utils/contestantJourneyConstants.ts` and both `contestant-preview-*.png` baselines; none of the three old test directories exists.
- All six commits (`d025b96a6`, `705c2eb50`, `f0f221eff`, `d21e837ef`, `f23b5b36b`, `d976884b7`) are ancestors of HEAD; `git rev-list --count 91cb8087d..HEAD` was 6 when this file was written.
- The plan's six verification items were re-run on the final tree and each exited 0.
- Every acceptance criterion of the three tasks was re-checked by command on the final tree.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.

---
phase: 179-identity-provider-registration-coverage-close
plan: 01
subsystem: testing
tags: [e2e, gates, verdict, baseline, stack-probe, bank-auth, operator-rulings, schema-freeze, planning-drivers]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "the closing summary and verification report, the five drivers and the reading command this plan copies, and the closing full run compared with the base"
provides:
  - "179-gates.sh: eighteen gate rows (Phase 178's seventeen plus equivalence), each status read directly"
  - "179-e2e.sh: one preflight-confirmed full or one-project E2E run of a committed tree"
  - "179-verdict.mjs: dir, gates (full row list read from the gate driver's ALL_ROWS), e2e, control (with --full), determinism, scope (this phase's refusal list), hygiene"
  - "179-bankauth.sh: the two opt-in bank-auth projects, the stack restored and probed, db:start/db:stop filtered through withhold-stack-keys.mjs"
  - "179-stack-probe.sh: the running auth service and edge runtime compared with the tree (probe prefix r179-probe-stack-)"
  - "179-read-rulings.mjs: the fixed-rule reading of a decision document, with an empty table of applied items"
  - "179-BASE (320bd265b) and 179-BASELINE (tests/e2e-runs/179-e2e/179-01-baseline-r5)"
  - "179-BASELINE-FACTS.md: the baseline's per-project totals, the freeze check, the round as read, the names as found, the claim readers, the recorded counts"
  - "a test-side fix (320bd265b): the contestant home's and nominations view's link presses wait for the router to start"
affects: [179-02, 179-03, 179-04, 179-05, 179-06, 179-08, 179-09, 179-10, 179-13, 179-14, 179-15, 179-22, 179-23, 179-24]

actuals:
  tokens: 43772
  tasks: 2
  commits: 9
plan_head_before: 8a0161188579d81eeef75e2be415a58cfcd665fd
plan_head_after: 37770499477477c6dd659065cbbff5e0dacb0fcb

tech-stack:
  added: []
  patterns:
    - "The verdict reads the gate set's row list from the gate driver's ALL_ROWS line at run time, so a plan that adds a row edits one file"
    - "scope compares .planning/workstreams/ from the phase's first commit and everything else from the base, so a re-pointed base does not hide or invent workstream edits"

key-files:
  created:
    - .planning/phases/179-identity-provider-registration-coverage-close/179-gates.sh
    - .planning/phases/179-identity-provider-registration-coverage-close/179-e2e.sh
    - .planning/phases/179-identity-provider-registration-coverage-close/179-verdict.mjs
    - .planning/phases/179-identity-provider-registration-coverage-close/179-bankauth.sh
    - .planning/phases/179-identity-provider-registration-coverage-close/179-stack-probe.sh
    - .planning/phases/179-identity-provider-registration-coverage-close/179-read-rulings.mjs
    - .planning/phases/179-identity-provider-registration-coverage-close/179-BASE
    - .planning/phases/179-identity-provider-registration-coverage-close/179-BASELINE
    - .planning/phases/179-identity-provider-registration-coverage-close/179-BASELINE-FACTS.md
    - .planning/debug/179-nominations-follow-full-load.md
    - tests/tests/helpers/navigation.ts
  modified:
    - tests/tests/helpers/index.ts
    - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
    - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts

key-decisions:
  - "The baseline is a run of this plan's own: Phase 178's closing run is not of this tree (the freeze merge changed files outside .planning/ after it), and the fifth attempt, 179-01-baseline-r5, is the first complete green non-void one"
  - "179-BASE was re-pointed from the original base to 320bd265b, the test-side hydration fix this plan had to commit before a green baseline was possible; the scope cut-off for .planning/workstreams/ stays at the phase's first commit cc2b2e51a"
  - "yarn -s assert:schema-migration-parity fails on Yarn 4.18.1, so the parity stage runs as yarn assert:schema-migration-parity > /dev/null; every other stage of the Task 1 verify chain is as written"

patterns-established:
  - "A press of a server-rendered link that claims an in-app navigation waits for the root layout's focus reset (waitForNavigationFocusReset), which lands only after SvelteKit's router has started"

requirements-completed: []

duration: about 6 h 10 min of wall clock across four executor sessions (13:24Z to 19:35Z), most of it in full runs and in stops for the operator
completed: 2026-10-21
status: complete
---

# Phase 179 Plan 01: The phase's instruments and its starting point Summary

**Six drivers copied from Phase 178 and re-pointed (eighteen gate rows with `equivalence`, a verdict that reads `ALL_ROWS` and refuses the frozen `00001` migration), base 320bd265b, and a green 548/548 baseline (`179-01-baseline-r5`) with a green eighteen-row gate set and a green bank-auth pair. Reaching it needed a test-side hydration-race fix (320bd265b). Every name the later plans build on was found on the tree.**

## Performance

- **Duration:** about 6 h 10 min of wall clock across four executor sessions (first commit 13:24Z, last 19:35Z). Most of it was full runs and stops for the operator (Docker disk, `.env`, a host restart).
- **Completed:** 2026-10-21
- **Tasks:** 2 of 2
- **Files:** 9 planning files in the phase directory, 1 debug record, 5 test files (the fix)

## Accomplishments

- **Precondition (Task 1 step 1):** `178-24-SUMMARY.md` and `178-VERIFICATION.md` are tracked. The report's status satisfies the gate, and the working tree was clean outside `.planning/` except for the untracked `CAND-APP-PLAN.md` (verify chain stage, exit 0).
- **Freeze check (step 2), as recorded in the facts file at head 3964d6efd:**
  - The manifest is tracked, and `baseline.file` and `migrations[0].file` are both `00001_initial_schema.sql`.
  - The sha256 computed in Node equals `migrations[0].sha256`.
  - The manifest holds 1 migration, the highest version is `00001`, so this phase's first migration takes `00002`.
  - `git merge-base --is-ancestor 12c98aa5c HEAD` exits 0, and `yarn assert:schema-migration-parity` exits 0.
  - `node scripts/assert-schema-migration-parity.mjs --write` exits 1 with the frozen-baseline refusal ("the baseline is frozen. `--write` ... no longer rewrites a migration"). `git diff --quiet` on the migrations directory and the manifest then exits 0, with 0 untracked or changed paths. The attempt leaves the directory unchanged, which is what the plan asks.
- **Drivers (steps 3–7), committed in cc2b2e51a and a41102abd.** Each is diffed against its Phase 178 original:
  - `179-gates.sh` (35 changed lines): re-pointed, and gains the row `equivalence` (`yarn check:schema-equivalence`) as row 18. `ALL_ROWS`, the header and the usage text name eighteen rows. `stack` still refuses without a running stack.
  - `179-e2e.sh` (24): re-pointed only.
  - `179-verdict.mjs` (140):
    - `gates` without `--rows` reads `ALL_ROWS=` from `179-gates.sh` at run time; the hard-coded count is gone.
    - `scope` refuses `00001_initial_schema.sql`, `functions/send-email/`, `tests/database/00-helpers.test.sql`, `CLAUDE.md`, `infra/`, `.planning/workstreams/` and `CAND-APP-PLAN.md`, each with its owner's sentence. It no longer refuses the pre-registration tree, its API route or `identity-callback`.
    - `control --full` is unchanged.
  - `179-bankauth.sh` (54): runs land under `179-e2e/<stem>-bank-auth` and `-bank-auth-journey`. It calls `179-e2e.sh` and `179-stack-probe.sh`. Both `yarn db:start` and `yarn db:stop` go through `withhold-stack-keys.mjs`, with the status read from `PIPESTATUS[0]`.
  - `179-stack-probe.sh` (16): re-pointed. The probe prefix is `r179-probe-stack-`.
  - `179-read-rulings.mjs` (23): re-pointed, with an empty table of applied items. Its output and exit codes are the original's.
- **Base and baseline (step 8):**
  - `179-BASE` = `320bd265bbd4fb6d28500c39e63c999514b3bc4e`, equal to `git log -1 --format=%H -- . ':(exclude).planning'`.
  - `179-BASELINE` = `tests/e2e-runs/179-e2e/179-01-baseline-r5`. The run was made by this plan:
    - head 85cebaded, which is tree-equal to the base outside `.planning/`
    - wrapper exit 0, no void marker, no Sleep entry in the run window (22:01:26–22:14:22 local)
    - 548 total / 548 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run, 124 projects, 12.8 min
    - `179-verdict.mjs e2e 179-01-baseline-r5` PASS
    - per-project totals in `179-BASELINE-FACTS.md` § *Tests per project in the baseline*
  - Phase 178's closing run was not used: its head is not tree-equal to the base (the verdict's stale case 05 below reads it so).
- **Baseline gate set (step 9):** `179-gates.sh 179-01-baseline` exited 0 on head eaab506e4. All eighteen rows were 0, including `equivalence`, whose log reads `EQUAL` (35 s). `179-verdict.mjs gates 179-01-baseline` gave PASS, "18 expected (the full gate set), 18 recorded", not stale, no Sleep entry.
- **Baseline bank-auth pair (step 9):** `179-bankauth.sh 179-01-baseline` exited 0.
  - `179-01-baseline-bank-auth`: 8/8 passed, exit 0.
  - `179-01-baseline-bank-auth-journey`: 475/475 passed, exit 0.
  - Both runs are on head eaab506e4, not void, with no Sleep entry.
  - The restore and the stack probe finished with "every row OK or EQUAL" and "restore and probe: OK". Every stack container, the edge runtime included, was Up afterwards.
- **Refusal cases (step 10):** 38 cases were run on scratch copies outside the repository, and all 38 came out as expected (table below).
- **Task 2:**
  - The reading command reads the known document both ways (CD exit 0, F exit 1 with the F1 halt).
  - The UI contract's round holds no tick and no NOTE or EDIT line, and its status is `approved`. No `179-OPERATOR-ROUND` file exists.
  - All 71 name checks of step 5 are `found` (`missing: 0`).
  - The claim-reader census matches the expected reading.
  - The counts are recorded. `179-BASELINE-FACTS.md` was written by `tests/e2e-runs/179-unit/179-01-facts.sh`, not by hand.

## Refusal cases (Task 1 step 10)

These cases were run by `tests/e2e-runs/179-unit/179-01-refusals.sh` against a scratch root under the session scratchpad. They used the green baseline r5 as `fresh-full`, with the void copies planted on it. Output: `tests/e2e-runs/179-unit/179-01-refusals.out`, exit 0.

| # | Case | Expected | Got |
|---|---|---|---|
| 01–03 | usage: no subcommand; unknown label; `dir e2e` on the baseline | 2, 2, 0 | 2, 2, 0 |
| 04 | `e2e` on the baseline as kept | 0 | 0 |
| 05 | `e2e` on a stale run (Phase 178's closing run, as kept) | 1 | 1 |
| 06–08 | `e2e` on a void run: marker planted / 8 planted in `exit` / a real void run | 3 | 3, 3, 3 |
| 09–11 | `--same-projects-as` itself; lacking vs full; full vs lacking | 0, 1, 1 | 0, 1, 1 |
| 12 | `e2e` on a green full run of an uncommitted tree | 1 | 1 |
| 13–15 | one-project `control`: red control `--red` / `--green` / void | 0, 1, 3 | 0, 1, 3 |
| 16–20 | `control --full`: green uncommitted full run; void; one-project green; one-project red; `--same-projects-as` a lacking run | 0, 3, 1, 1, 1 | 0, 3, 1, 1, 1 |
| 21–22 | `gates`: five-row run without `--rows`; with its rows | 1, 0 | 1, 0 |
| 23–25 | `gates`: seventeen-row run without `--rows`; with its rows; stale seventeen-row run | 1, 0, 1 | 1, 0, 1 |
| 26–28 | `gates`: eighteen rows (equivalence planted); equivalence planted red; unknown row | 0, 1, 2 | 0, 1, 2 |
| 29–31 | `determinism`: stale ledger; fresh heads; a void run in the ledger | 1, 0, 3 | 1, 0, 3 |
| 32 | `scope` on the scratch copy | 0 | 0 |
| 33–34 | `scope`: a changed path under `identity-callback`; and one under the pre-registration tree | 0, 0 | 0, 0 |
| 35 | `scope`: and a changed `00001_initial_schema.sql` | 1 | 1 |
| 36–37 | `scope`: a changed `infra/` path; a `.planning/workstreams/` change after the phase start | 1, 1 | 1, 1 |
| 38 | `scope`: a `.planning/workstreams/` change before the phase start only | 0 | 0 |

## Task 2 readings

- **The known document:**
  - `node $P/179-read-rulings.mjs .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md CD` exits 0. It prints C1–C6 and D1 as recommended, with C5 `recommended-ticked (a)`.
  - The same with `F` exits 1. It prints F1 verbatim ("halt — option (b) ticked, for which the plans state no fallback an executor may build") and then `HALT: 1 item(s) need the orchestrator`.
  - The outputs are kept as `tests/e2e-runs/179-unit/179-01-rulings-{CD,F}.{out,exit}`.
- **The UI contract's round:** between `## PROPOSED` and `## Checker Sign-Off` there are 0 ticked boxes and 0 bold NOTE or EDIT lines. The frontmatter reads `status: approved`, and the round holds 24 items with 24 ★ options.
- **The round as read:** no `179-OPERATOR-ROUND` exists, so "no round document is named". The operator's message of 2026-10-21 is recorded ("nothing to add", PL-01 accepted as built). J1–J7 stand at the context's proposals and U-01..U-24 at their ★ (a), one line each, by operator ruling 2026-10-21, item 2.
- **Names (step 5):** every name was found at head 3964d6efd: the SQL objects and anchors, `identity-callback`, `account-access`, the frontend gates, routes, cookies and guards, `app-shared` and the test harness, and the five Playwright projects (list in the facts file, `missing: 0`). None halts the phase.
- **Claim readers (step 6):**
  - The `app_metadata` reads of `hetu` and `birthdate` are only `contestant-bank-auth.spec.ts:188-189`, which 179-13 reaches.
  - Two doc comments match the pattern but read nothing: `signicat.ts:36` and `claimConfig.test.ts:191`.
  - `schema/`, `tests/` and `dev-seed/src` hold 0 lines naming either key.
  - This is the expected reading, so nothing is recorded against a plan as a surprise.
- **Counts (step 7):**
  - next pgTAP number `48`; next migration version `00002`
  - 744 message keys in each of the seven catalogues (they agree)
  - `--list` census: 548 tests (equal to the baseline total), 473 untagged; tags `nomination-definition` 72, `perf` 1, `contestant-session` 1, `candidate` 1

## Task Commits

1. **cc2b2e51a** `chore(179-01)`: the five drivers and the original `179-BASE` (Task 1 steps 3–8).
2. **a41102abd** `chore(179-01)`: `179-read-rulings.mjs` (Task 2 step 1, committed early).
3. **320bd265b** `fix(e2e)`: press the contestant home's and nominations view's links only once the page has hydrated (deviation 6).
4. **24d3ccc8f** `docs(179)`: debug record for the nominations follow test's full page load.
5. **26faad8b1** `chore(179-01)`: `179-BASE` re-pointed to the hydration fix.
6. **85cebaded** `docs(179)`: debug record, r4 red on a stopped edge runtime.
7. **eaab506e4** `docs(179)`: debug record resolved, r5 green on the fix.
8. **3964d6efd** `chore(179-01)`: `179-BASELINE`, the recorded baseline (Task 1 step 11).
9. **377704994** `docs(179-01)`: the rounds as read, the names on the tree and the claim readers (`179-BASELINE-FACTS.md`, Task 2 step 9).

## Verification

- **Task 1 `<automated>`**, from `tests/e2e-runs/179-unit/179-01-t1-verify.sh` (byte for byte from the plan): exit **1** at head 3964d6efd, at the stage `yarn -s assert:schema-migration-parity` (deviation 1).
  - The same chain with that one stage restated as `yarn assert:schema-migration-parity > /dev/null` (`179-01-t1-verify-restated.sh`) exits **0** at 3964d6efd and again at 377704994.
  - The restated run covers the baseline, the gates verdict, both bank-auth exit files, the exit-2 usage checks, `hygiene` PASS and `scope` PASS ("0 path(s) changed outside .planning/ since the base").
- **Task 2 `<automated>`**, from `tests/e2e-runs/179-unit/179-01-t2-verify.sh`: exit **0** at 377704994.
- Logs, statuses and heads are kept beside each script under `tests/e2e-runs/179-unit/`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `yarn -s` fails on Yarn 4.18.1**
- **Found during:** Task 1 step 2 and the Task 1 verify chain.
- **Issue:** `yarn -s assert:schema-migration-parity` fails on this Yarn.
- **Fix:** that stage is run as `yarn assert:schema-migration-parity > /dev/null`. The verify chain as written exits 1 at that stage, and the restated chain exits 0.
- **Files:** none in the repository; the facts file records it.

**2. [Rule 1 - Bug] `scope` cut-off for `.planning/workstreams/`**
- **Issue:** once `179-BASE` was re-pointed to 320bd265b, comparing `.planning/workstreams/` from the base would have judged the workstream from the wrong commit.
- **Fix:** `scope` compares `.planning/workstreams/` from the phase's first commit, found with `--diff-filter=A` on `179-BASE` (cc2b2e51a), and everything else from the base. Refusal cases 37–38 cover it.
- **Commit:** cc2b2e51a.

**3. Task 1 split into commits**
- The reading script was committed alone (a41102abd) before the facts file. `179-BASE` and `179-BASELINE` were committed after the scripts, as step 11 allows.

**4. Docker VM disk floor (first attempt)**
- `179-01-baseline` exited 3: 5.22 GiB free in the Docker VM against the 13.8 GiB floor.
- The operator approved a cleanup of the storage volume and three unused images. Docker was never restarted.

**5. `-r2` red on the environment (`ANALYTICS_PROVIDER`)**
- `179-01-baseline-r2` (head cc2b2e51a) ran 548 total / 209 passed / 1 failed / 338 did not run, traced to `ANALYTICS_PROVIDER` in the root `.env`.
- The operator fixed the root `.env`. No executor opened it. The diagnosis run is kept as `tests/e2e-runs/179-e2e/179-01-diag-analytics`.

**6. [Rule 1 - Bug] `-r3` red on a test-side hydration race; fixed in 320bd265b**
- **Run:** `179-01-baseline-r3` (head a41102abd) ran 505 passed / 1 failed / 42 did not run. The failure was perm-contestant-nominations "follow: after a first save ..." at `expectSameDocument`.
- **Cause (confirmed in isolation, `tests/e2e-runs/179-debug/`):** `followMainAction` pressed a server-rendered link before SvelteKit's router had started.
  - Negative control `probe-unfixed`: 451/452, the probe's A1 failed exactly as in the incident.
  - Positive control `probe-fixed`: 452/452.
  - Commit-candidate project run `fix-project`: 450/450.
- **Fix:** `waitForNavigationFocusReset` before the press in six fixture steps.
- **Files:** `tests/tests/helpers/navigation.ts`, `tests/tests/helpers/index.ts`, `contestantEntityHomePage.fixture.ts`, `contestantEntityPages.fixture.ts`, `contestantNominationsPage.fixture.ts`. None of these is in the plan's `files_modified`.
- **Follow-up:** `179-BASE` was re-pointed to 320bd265b (26faad8b1). Full record: `.planning/debug/179-nominations-follow-full-load.md`, now `status: resolved`.

**7. `-r4` red on the environment (stopped edge runtime)**
- **Run:** `179-01-baseline-r4` (head 26faad8b1) ran 95 passed / 11 failed / 54 skipped / 388 did not run, all in Edge Function callers (Kong 503 "name resolution failed").
- **Observed:** container `supabase_edge_runtime_openvaa-local` was Exited (255) after a host restart, with restart policy `no`.
- **Inferred:** `yarn db:start` on a running stack does not start it.
- **Resolution:** the orchestrator restarted the stack (`yarn db:stop` + `yarn db:start`, filtered) under the standing stack authorisation. Before r5, every container, the edge runtime included, was confirmed Up.

**8. [Rule 3] Root pin checked inline once**
- In the previous session the scratchpad `root-pin.sh` had been wiped by the host restart, so the root and branch were checked inline.
- This session used the orchestrator's recreated script before every write and commit; every run exited 0.

**9. Battery override**
- The operator authorised running on battery (2026-10-21). That overrides the rules' 30 % floor with a stop below 20 %.
- r5 ran from 76 % to 65 %, the gate set ended at 60 %, and the bank-auth pair ended at 49 % (on the charger by then). No run was below 20 %.

**10. [Rule 3] The tag census script's JSON start**
- **Issue:** `npx playwright test --list --reporter=json` prints a dotenv banner line containing `{ quiet: true }` before the JSON. The gitignored census script sliced from the first `{` and failed to parse.
- **Fix:** the script now starts at the first line that is exactly `{`. The banner holds a variable count, no value, and is not copied into any committed file.

**11. Refusal script's baseline copy**
- `179-01-refusals.sh` copied `179-01-baseline-r2` as `fresh-full` and as the void-marker and void-exit cases. Before the run it was re-pointed to the green `179-01-baseline-r5`.

---

**Total deviations:** 11 (four auto-fixed under Rules 1/3, two environment stops resolved by the operator, one by the orchestrator, four procedural).
**Impact on plan:** the test fix (320bd265b) is outside the plan's file list. It changes no product code. It is the one commit of this plan that touches a committed spec's fixtures, and it was committed only after its own project run was green and the full suite confirmed it (r5).

## Observed vs inferred

- **Observed:**
  - Every count, status and verdict above.
  - The edge runtime Exited (255) during r4 and Up before r5.
  - The fix's negative and positive controls.
  - The `--write` refusal text.
- **Inferred:**
  - That the host restart left the edge runtime stopped (powerd start time and container timestamps).
  - That in the r3 incident the router had not started at the moment of the press (from the import graph of the module still loading). The probe reproduces the same failure under a held root layout.

## Issues Encountered

None open. The full-suite evidence for 320bd265b, missing after r4, is r5 (perm-contestant-nominations 97/97, perm-no-nomination 68/68; the incident's test passed).

## Items to report rather than edit

- `CLAUDE.md` and the execution rules were not touched.
- `179-EXECUTION-RULES.md` § *The shell* says "No run is started on battery below 30 %". The operator's override of 2026-10-21 (stop below 20 %) is session-scoped and is recorded here only.
- The debug record's `not_changed` names three spec-local copies of the focus-reset wait (`analytics-gpc.spec.ts`, `voter-prefs-tracking.spec.ts`, `voter-tracking-consent-free.spec.ts`) that could now import the helper. They were left as they are.

## Next Phase Readiness

- Every later plan judges against `179-BASE` (320bd265b) and `179-BASELINE` (`tests/e2e-runs/179-e2e/179-01-baseline-r5`), with this phase's verdict and drivers.
- The first `--same-projects-as` comparison reads 124 projects / 548 tests from the baseline.
- The stack is up with the default edge runtime restored by the bank-auth driver.
- The first migration takes `00002` and the next pgTAP file is `48`.

## Self-Check: PASSED

- The files exist: the six drivers, `179-BASE`, `179-BASELINE`, `179-BASELINE-FACTS.md` and the debug record.
- All nine commits are ancestors of HEAD: cc2b2e51a, a41102abd, 320bd265b, 24d3ccc8f, 26faad8b1, 85cebaded, eaab506e4, 3964d6efd, 377704994.

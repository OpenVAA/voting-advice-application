---
phase: 173-multi-entity-grants-entity-selection
plan: 01
subsystem: testing
tags: [preflight, name-map, gates, e2e, playwright, pgtap, baseline, host-suspend]

requires:
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "The served-types accessor, the deep settings merge, the three app names"
  - phase: 172-terms-of-use-per-user-and-project
    provides: "The gate list above the entity load, the 13-column user-data function, the second stored session, the reset-then-types gate row"
provides:
  - "173-NAME-MAP.md: every name the thirteen plans cite resolved on the tree, A1 to A13 and the 16 baseline facts re-measured, 32 populations as command plus output, the baseline, and twelve differences each tied to the plan it touches"
  - "173-gates.sh: twelve gate rows, --rows subsets, the reset-then-types row, the power state of the host recorded per run"
  - "173-e2e.sh: one preflight-confirmed E2E run with head, wrapper status and power state recorded"
  - "173-verdict.mjs: the verdicts gates, e2e (--same-projects-as, --except, --min-total-of, --expect-project, --allow-slice), greps and exemptions"
  - "A green baseline on one tree: gate set 173-01-baseline (twelve rows at 0) and E2E 173-01-baseline-r2 (180 of 180 over 100 projects)"
affects: [173-02, 173-03, 173-04, 173-05, 173-06, 173-07, 173-08, 173-09, 173-10, 173-11, 173-12, 173-13, 174, 178]

estimate:
  tokens: 45000
actuals:
  tokens: 40641
  tasks: 2
  commits: 3
plan_head_before: 607d471fb627808f94304c09b5dbb2a83580459c
plan_head_after: 34e5261e2e5e751625fc36d7ebc235eca95f0d6e

tech-stack:
  added: []
  patterns:
    - "A run directory records the host's power state: the source at the start and the end, and the Sleep, Wake and DarkWake entries inside the run window. A run that overlaps a Sleep entry is void, kept, and made again under <label>-r2"
    - "A subset gate run states its rows in rows-expected.txt, and the verdict refuses to read it as the full gate set"

key-files:
  created:
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md
    - .planning/phases/173-multi-entity-grants-entity-selection/173-gates.sh
    - .planning/phases/173-multi-entity-grants-entity-selection/173-e2e.sh
    - .planning/phases/173-multi-entity-grants-entity-selection/173-verdict.mjs
  modified: []

key-decisions:
  - "The types-regen row is yarn db:reset followed by yarn db:types, not yarn db:types alone as the plan writes it: on a database where pgTAP has run, the plan's row is red on a correct tree"
  - "The exemptions verdict passes on exactly two entries (invite-candidate and the three shown names), not on one: the list holds three entries today, not two"
  - "The baseline E2E run was made a second time without a fix, because the host slept during the first; the first attempt is void and kept"
  - "The second attempt is labelled 173-01-baseline-r2, the form the plan gives for a rerun, so that every later plan's comparison against 173-01-baseline resolves to the green attempt"

patterns-established:
  - "Before judging any run: read its power.txt, and read pmset -g log again for the window"

requirements-completed: []

coverage:
  - id: D1
    description: "Phases 171 and 172 are shown to have executed before any file of this phase was written"
    verification:
      - kind: other
        ref: "PLAN and SUMMARY counts by command: 171 has 4 and 4, 172 has 9 and 9; Task 1's automated check, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "A1 to A13 and the 16 baseline facts are re-measured and recorded with the command that measured each"
    requirement: ENT-03
    verification:
      - kind: other
        ref: "173-NAME-MAP.md § Facts re-measured: 32 rows, every verdict cell starts with holds, differs: or deferred to (checked by an awk pass, no row failing)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every name the plans cite is resolved against the tree; where the tree differs the name map is the authority and no plan is edited"
    verification:
      - kind: other
        ref: "173-NAME-MAP.md § Names (six rows marked DIFFERS) and § What differs and which plan it touches (twelve items); git diff of the thirteen PLAN files is empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-02 checked read-only: the record names the function's raise as the constraint lifted and keeps the index"
    requirement: ENT-03
    verification:
      - kind: other
        ref: "the clauses of ROADMAP.md criterion 1 and PROJECT.md quoted under § Preconditions; git diff --quiet 607d471fb HEAD on the four record files, exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The gate set is green on the tree before any source edit"
    verification:
      - kind: other
        ref: "tests/e2e-runs/173-gates/173-01-baseline: twelve rows, every status 0; node 173-verdict.mjs gates 173-01-baseline, exit 0; no Sleep entry in its window"
        status: pass
    human_judgment: false
  - id: D6
    description: "The full default E2E suite is green on the tree before any source edit"
    requirement: GEN-02
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-01-baseline (first attempt): 180 total, 87 passed, 1 failed, 92 did not run; the host slept inside its window; VOID"
        status: fail
      - kind: e2e
        ref: "tests/e2e-runs/173-e2e/173-01-baseline-r2 (second attempt, same tree, no fix): 180 of 180 over 100 projects, no retry; node 173-verdict.mjs e2e 173-01-baseline, exit 0; no Sleep entry in its window"
        status: pass
    human_judgment: true
    rationale: "Two attempts were made and no fix separates them. The first overlaps three Sleep entries of the OS power log, which is the one case the run's standing rules admit a second run for. Whether that reading is accepted is the operator's call; the evidence is under 'The Void First E2E Attempt'."
  - id: D7
    description: "The three drivers work, including --rows, --same-projects-as and --except"
    verification:
      - kind: other
        ref: "bash -n and node --check, exit 0; fourteen probes of the usage, subset and comparison paths, each with the expected exit status (table under 'The Drivers, Exercised')"
        status: pass
    human_judgment: false
  - id: D8
    description: "PROH-173-11 and PROH-173-12: CAND-APP-PLAN.md untouched; no run retried until green, nothing under tests/e2e-runs deleted"
    verification: []
    human_judgment: true
    rationale: "Verified by judgment, as the plan marks them. CAND-APP-PLAN.md is still untracked and unmodified. The one second run is the void-run case, stated as such; both directories are kept."

duration: 82min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 01: Preflight, Name Map, Drivers and Baseline Summary

**Phases 171 and 172 are shown executed, every assumed fact and cited name of the phase is measured into `173-NAME-MAP.md` with twelve differences tied to the plans they touch, the three drivers exist and are exercised, and tree `9f888dfcd` is green on twelve gate rows and on the full E2E suite (180 of 180) — the suite on the second of two attempts, the first being void because the host went to sleep inside it.**

## Read First

1. **The baseline E2E run was made twice and no fix separates the attempts.** The first, `173-01-baseline`, is void: the host's lid closed and it slept inside the run window. The second, `173-01-baseline-r2`, is 180 of 180. Details under "The Void First E2E Attempt".
2. **Two things in the drivers differ from the plan's text, on purpose** — the `types-regen` row resets the database, and the `exemptions` verdict expects two entries, not one. Both follow from measurements. Details under "Deviations from Plan".
3. **Where the dispatch and the plan disagreed, the plan was followed, with one exception stated here.** The plan writes `types-regen` as `yarn db:types`; the dispatch states that a gate run resets the database. The dispatch's reading was built, because the plan's row is red on a correct tree (measured). The coordinator suggested the label `173-01-baseline-2` for the second E2E run; the plan's form, `173-01-baseline-r2`, was used, because the verdict resolves a plain label to its newest `-rN` and every later plan compares against `173-01-baseline`.

## Performance

- **Duration:** about 82 min of wall clock, 08:28Z to 09:50Z (the dispatch revision was committed at 08:27Z). Of that the host was asleep for about 46 min (11:46:44 to 11:51:55 and 11:53:55 to 12:34:58 local) and the agent was stopped by the stream watchdog over the same period.
- **Tasks:** 2 of 2
- **Files changed outside `.planning/`:** none (`git diff --quiet 607d471fb HEAD -- . ':(exclude).planning'`, exit 0)
- **Start revision:** `607d471fb`. **The tree both baseline instruments describe:** `9f888dfcd` (tree-equal to the start revision outside `.planning/`).

## Task Commits

1. **Task 1: the name and fact map** — `202191a38` `docs(173-01): re-measure every assumed fact and name of multi-entity grants into the name map`
2. **Task 2: the three drivers** — `9f888dfcd` `chore(173-01): add the gate, E2E and verdict drivers of multi-entity grants`
3. **Task 2: the baseline** — `34e5261e2` `docs(173-01): record the green baseline of multi-entity grants in the name map`

`git rev-list --count 607d471fb..34e5261e2` is 3. The commit that carries this file follows them.

## Gate and E2E Results

Every exit status was read from the command itself or from a marker file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 automated check | as the plan writes it | 0 | five headings, 13 `A` rows, 4/4 and 9/9, record files unmodified |
| Syntax | `bash -n` on both scripts, `node --check` on the verdict script, both execute bits | 0 | |
| Reset before the baseline | `yarn db:reset` | 0 | no run in flight: no listener on 5273, no recent run directory |
| **Gate set** | `173-gates.sh 173-01-baseline` | **0** | **twelve rows, every status 0** |
| Gate verdict | `173-verdict.mjs gates 173-01-baseline` | 0 | not stale; no Sleep entry in the window |
| **E2E, first attempt** | `173-e2e.sh 173-01-baseline` | **1** | 180 total, 87 passed, 1 failed, 92 did not run — **VOID** |
| Stack after the sleep | `yarn db:status`; `OPTIONS` on the three functions; `170-allowlist-probe.sh after` | 0; 200, 200, 200; 0 | 13 containers up, every allowlist row OK; no restart needed |
| Reset before the second attempt | `yarn db:reset` | 0 | |
| **E2E, second attempt** | `caffeinate -dimsu 173-e2e.sh 173-01-baseline-r2` | **0** | **180 / 180 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; 5.6 min; no retry |
| E2E verdict | `173-verdict.mjs e2e 173-01-baseline` | 0 | resolves to `-r2`; full suite; one preflight success; not stale |
| Task 2 automated check | as the plan writes it | 0 | |
| `greps` verdict, starting state | `173-verdict.mjs greps` | 1 | the four literals present (below) |
| `exemptions` verdict, starting state | `173-verdict.mjs exemptions` | 1 | three entries (below) |
| Subset probe | `173-gates.sh 173-01-rows-probe --rows name-gate-self-test,typecheck` | 0 | two rows, in the fixed order |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |

The twelve rows of `173-01-baseline`: typecheck 19 s, lint 45 s, types-regen 31 s, types-clean 0 s, sql-lint 3 s (104 policies, 20 tables partitioned, `0 error(s), 3 warning(s)`), pgtap 5 s (38 files, 1385 tests), unit 64 s (frontend 2170 in 137, dev-seed 996 in 67, supabase 206 in 15, app-shared 141 in 10, data 244 in 47), check-frontend 8 s (2655 files, 0 errors, 0 warnings), build 17 s, format 18 s, docs-links 1 s (0 findings), name-gate-self-test 0 s (82 findings on the fixture, 82 expected). Every count shared with Phase 172's close equals it.

### Every run directory of this plan

| Directory | Head | Power | Counts | Verdict |
|---|---|---|---|---|
| `tests/e2e-runs/173-gates/173-01-baseline` | `9f888dfcd`, clean | AC; 11:39:38 to 11:43:09 local; 0 Sleep entries | twelve rows, all `0` | green |
| `tests/e2e-runs/173-e2e/173-01-baseline` | `9f888dfcd`, clean | AC at the start, battery at the end; 11:43:24 to 11:51:55; 3 Sleep entries | 180 total: 87 passed, 1 failed, 92 did not run | **void, kept** |
| `tests/e2e-runs/173-e2e/173-01-baseline-r2` | `9f888dfcd`, clean | battery, under `caffeinate -dimsu`; 12:38:21 to 12:44:09; 0 Sleep entries | 180 of 180 over 100 projects | **green, the full default suite** |
| `tests/e2e-runs/173-gates/173-01-rows-probe` | `9f888dfcd`, clean | battery; 0 Sleep entries | two rows, both `0` | green as a subset; refused as the full set |

Beside them: the `.exit` markers and `.log` files of each label, and `tests/e2e-runs/173-e2e/173-01-baseline.void-diagnosis.txt`. Nothing under `tests/e2e-runs/` was deleted.

## The Void First E2E Attempt

**This second run without a fix is the void-run case of the standing notes, and only that.** The run's own `power.txt` counted three Sleep entries inside its window and printed "the run is VOID" before any result was read.

`pmset -g log`, entries inside the window 11:43:24 to 11:51:55 local (+0300):

```text
11:46:03 Sleep         Entering DarkWake state due to 'Clamshell Sleep' ... Using AC (Charge:100%) 1 secs
11:46:03 Notification  Display is turned off
11:46:04 Wake          DarkWake to FullWake from Deep Idle [CDNVA] : due to HID Activity Using AC (Charge:100%) 40 secs
11:46:14 Notification  Display is turned off
11:46:44 Sleep         Entering Sleep state due to 'Clamshell Sleep' ... Using Batt (Charge:100%) 8 secs
11:46:52 Wake          Wake from Deep Idle [CDNVA] : due to smc.sysState.Wake(0x70070000) lid ...
11:46:59 Sleep         Entering Sleep state due to 'Clamshell Sleep' ... Using Batt (Charge:100%) 296 secs
11:51:55 DarkWake      DarkWake from Deep Idle [CDN] : due to smc.sysState.Wake(0x70070000) wifibt ...
```

The host then slept again from 11:53:55 to 12:34:58.

**The one failure, checked against the suspend.** Project `perm-1e1cg1co`, "no election or constituency selector; lands on questions directly", 11:46:14.249 to 11:46:30.155 local: `expect(getByTestId('voter-questions-heading')).toBeVisible()`, 10 s, element not found. Its trace holds, in the page console, `[vite] server connection lost. Polling for restart...` at 08:46:14.857Z, with a fresh `[vite] connecting...` 214 ms later: the Vite client reloaded the page under the test. That is the second in which the OS logs "Display is turned off" (11:46:14), eleven seconds after the lid closed and thirty seconds before the host slept on battery. It is the shape recorded as C in `.planning/debug/172-closing-run-red-on-slow-host.md`. The dev-server log holds no restart and no connection-loss line, and the server had been ready in 29.9 s, the normal cold start.

- **Observed:** the Sleep entries inside the window; the socket loss in the page at the second of the display event; the run's last result stamped 08:51:55.511Z, the instant of the DarkWake; 92 dependents of the failed project not run.
- **Inferred:** that the display and power link dropping is what closed the socket. The test failed while the host was still awake, in the lid-closed transition and not during the sleep itself.
- **Consistent with the suspend, and not diagnosed further.** The same test passed in `-r2`, on the same tree.

## The Starting Verdicts

`173-verdict.mjs greps`, exit 1 — they become empty in 173-02, 173-04 and 173-10:

```text
'get_candidate_user_data': 54 hit(s) in 17 file(s)
'ERR_ENTITY_IDENTITY_AMBIGUOUS': 9 hit(s) in 6 file(s)
'ContestantContext-contestantUserDataStore-editedAnswers': 1 hit(s) in 1 file(s)
'userNoCandidate': 13 hit(s) in 12 file(s)
```

`173-verdict.mjs exemptions`, exit 1: `EXEMPT` holds **three** entries — `get_candidate_user_data` (see phase 173), `invite-candidate` (see phase 174), the three shown names of the app (see phase 171). The verdict reports "holds 3 entries, expected exactly 2" and "still names 'get_candidate_user_data'".

## D-02

**Record already corrected.** `ROADMAP.md` criterion 1 and `PROJECT.md` "Known constraints to lift" both name the function's `ERR_ENTITY_IDENTITY_AMBIGUOUS` raise and the candidate-only sign-in gate as what is lifted, and both say `idx_grants_one_candidate_editor` is kept. The clauses are quoted in the name map. Neither file, nor `REQUIREMENTS.md` or `STATE.md`, was edited.

## Every Row Marked DIFFERS or `differs:`, and the Plan It Touches

The name map's last section holds these in full. In short:

| # | What the tree shows | Touches |
|---|---|---|
| 1 | The name gate's exemption list holds three entries; after the function's line goes it holds two, not one. The sentences to correct say "exactly three" | 173-02 Task 4, 173-13 Task 4 |
| 2 | A gate run that includes `types-regen` resets the local database (facts X1, X2) | every plan that runs the full gate set |
| 3 | No header logout button is ever rendered (`page.data.token` is returned by no load) | 173-07 Task 4, 173-09 Task 3, 173-10, 173-12 Task 3 |
| 4 | The fixed draft key is `ContestantContext-contestantUserDataStore-editedAnswers` (fact F8) | 173-04 Task 2, 173-13 Task 4 |
| 5 | `registerAndStoreSession` is not exported and takes one `externalId` (A3, X3); the base candidate's session path is a constant of `auth.setup.ts`, not of `testCredentials.ts` | 173-12 Task 1 |
| 6 | The logged-in menu's item list is `CONTESTANT_NAV_LOGGED_IN`, a non-exported constant of the journey spec, not of the nav-menu fixture | 173-10 Task 4, 173-12 Task 3 |
| 7 | Scan counts: 16 and 30 in three files; a stale 14 in `assert-a11y-scan-wiring.mjs` (three places) and a stale "14 routes x 2 themes = 28" in `rawKeyScan.ts`; `tests/README.md` has no contestant-scan section | 173-13 Tasks 1 and 2 |
| 8 | The base-dataset heading is asserted through the catalogue key `dynamic.contestantAppName.candidate`, not a literal (A5) | 173-11 Task 2 |
| 9 | The definer censuses of `07-rpc-security` hold six (anon) and seven (authenticated) names | 173-02 Task 2 |
| 10 | The layout context's page-style call is `usePageStyles(overlay)`; there is no `pageStyles.push` | 173-10 Task 2 |
| 11 | pgTAP file 37, Section 7, turns red for any function or fixture that names `terms_of_use` | 173-02 Tasks 1 and 2 |
| 12 | The host can sleep mid-run; the drivers record it and a void run is made again as `-r2` | every plan with a run |

Facts that differ in names only, with no effect on a task: F5, F10, F13, F15 (Phase 170's and 172's renames). Deferred, with the task that measures each: A7 and A11 to 173-02 Task 1, A8 to 173-08 Task 3, A9 to 173-03 Task 1, A10 to 173-12 Task 1, A13 to 173-11 Task 2.

## The Drivers, Exercised

| Probe | Exit | Expected |
|---|---|---|
| `173-gates.sh x --rows bogus`; `173-gates.sh` with no label | 2; 2 | usage error |
| `173-gates.sh 173-01-rows-probe` a second time | 2 | the label already holds a run |
| `gates nope`; `e2e nope --except a=1` | 2; 2 | no such directory; `--except` without `--same-projects-as` |
| `gates 173-01-rows-probe` | 1 | a subset is not the full gate set |
| `gates 173-01-rows-probe --rows typecheck,name-gate-self-test` | 0 | exactly the named rows |
| `gates 173-01-rows-probe --rows typecheck`; `gates 173-01-baseline --rows typecheck` | 1; 1 | the named rows are not the run's rows |
| `e2e 173-01-baseline --same-projects-as 173-01-baseline --min-total-of … --expect-project contestant-a11y-scan` | 0 | 100 projects compared, 0 not as expected |
| `… --except contestant-a11y-scan=6`; `… =+` | 1; 1 | 16 is not 22; 16 is not above 16 |
| `… --except contestant-a11y-scan=0`; `--except no-such-project=+` | 0; printed as unused | |

`--allow-slice` and `173-e2e.sh --project` were not exercised: no slice run was made in this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The `types-regen` row resets the database before regenerating the types**
- **Found during:** Task 2
- **Issue:** the plan writes the row as `yarn db:types`. pgTAP's first file commits its helper functions into `public`; Phase 172 measured that the regenerated file then gains them and `types-clean` is red on a correct tree. At the start of this plan the applied database held the helpers (four of four probed). Plans 03, 05, 07, 08, 10, 11 and 12 run the full gate set with no reset of their own, after a pgTAP row has run.
- **Fix:** the row is `yarn db:reset`, then `yarn db:types`, as in `172-gates.sh`; the script refuses to start while an E2E run is in flight when that row is selected. The plan's hand-made reset before the baseline was made as well.
- **Consequence for later plans:** a full gate run destroys local data; gates first, E2E after, `yarn db:seed:default` at the end.
- **Files modified:** `173-gates.sh`
- **Commit:** `9f888dfcd`

**2. [Rule 1 - Bug] The `exemptions` verdict expects two entries, not one**
- **Found during:** Task 1
- **Issue:** the plan says the list "holds exactly one entry and it names `invite-candidate`" once the function's line is deleted, and that today's output "reports two entries". The list holds three; Phase 171 added the shown names. A verdict written to the plan's count could never pass.
- **Fix:** the verdict passes when the list holds exactly `invite-candidate` and the shown-names entry and no entry names the function. The markers are a constant at the top of the script.
- **Files modified:** `173-verdict.mjs`
- **Commit:** `9f888dfcd`

### Acceptance criteria that did not hold as written

- **Task 2: "`exemptions` exits 1 and reports two entries."** It exits 1 and reports three. See deviation 2.
- **Task 2: "`summary.json` of `173-e2e/173-01-baseline` reports failed, flaky and didNotRun all 0."** That directory is the void attempt; the criterion holds for `173-01-baseline-r2`, which is what the plan's own verify command reads through the label.

### Additions beyond the plan

- **Power state in both drivers and in the verdict** (`power.txt`, `sleep_entries_in_window`, the VOID line). The standing notes ask for it per run; the debug file's option 2 describes it. `tests/scripts/e2e-run.sh` was not changed.
- **`done` in each run directory**, written on every exit path once the directory is claimed.
- **`playwright-exit`** in an E2E run directory: the wrapper writes Playwright's status to `exit`, and the plan asks for the wrapper's status there, so the former is kept under its own name. The verdict also requires one preflight success and no preflight failure.
- **Three rows X1 to X3** are the plan's; a twelfth item on host sleep and the void-diagnosis file are not.
- **Two database resets by hand** (the plan asks for one; the second preceded the second E2E attempt, to give it the state the first had) and one by the gate run.

### Departures in procedure

- **The first poll of the first E2E run was one foreground command of 420 s,** against the plan's 45 s. The harness moved it to the background; the host was asleep by then. Every later poll was 45 s.
- **Reading.** The plan, the standing notes, `173-CONTEXT.md`, `172-09-SUMMARY.md`, `172-NAMES.md`, the five model drivers and the options of the debug file were read whole. Of `173-RESEARCH.md`: the marks, the summary, R-1, R-2.1 to R-3.6, R-5, R-6, R-7, the assumptions log, the open questions and the validation architecture; R-4, the architecture patterns, the pitfalls and the code examples were not opened. Of `171-NAME-MAP.md` the first 140 lines. Of the twelve later plans: the objective, the task names and every call of the drivers. `173-UI-SPEC.md`, `173-VALIDATION.md`, the summaries 172-04, 172-07, 172-08 and 171-04, `170-04-SUMMARY.md`, `PROJECT.md` beyond the D-02 paragraph, `STATE.md` and the workflow references were not opened; the dispatch's facts stood in for them and each was re-measured on the tree.
- **The broken-windows ledger was not appended to.** The two deviations are recorded here and in the name map.

## Deferred Issues

None fixed, none new beyond the name map's list. Carried from Phase 172 and confirmed on this tree: the stale scan counts (item 7), the header logout button that is never rendered (item 3).

## Known Stubs

None.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-173-01 a later task acting on an assumed fact | mitigate | every assumption has a row with its command; six are deferred to the named task that can measure them |
| T-173-02 a green verdict read from a stale or partial run | mitigate | the verdict requires every expected row, the full twelve unless `--rows` is given, tree-equality with HEAD, the wrapper's status, a preflight success and no `--project`; the drivers refuse a dirty tree and a used label. Added: a run that overlapped a host sleep says so |
| T-173-SC package installs | accept | no package was installed |

## What the Next Plan and Later Phases Must Know

- **Read `173-NAME-MAP.md` first,** its last section before anything else.
- **Compare against** gates `173-01-baseline` and E2E `173-01-baseline` (which resolves to `-r2`): 180 tests, 100 projects; pgTAP 38 files, 1385 tests; frontend unit 2170 in 137. `--same-projects-as 173-01-baseline` and `--min-total-of 173-01-baseline` work as the plans write them.
- **A full gate run resets the database.** Gate set, then E2E, then `yarn db:seed:default`. Never start one while an E2E run is in flight; the script refuses.
- **173-02:** after the function's exemption line is deleted the list holds two entries and the two sentences say "exactly two"; `173-verdict.mjs exemptions` then passes. The fixture lines `e02`, `n10` and `n21` are as the research quotes them.
- **Before judging a run, read its `power.txt`.** The host was on battery at the end of this plan. Start runs under `caffeinate -dimsu`; a void run is made again as `<label>-r2` and its directory kept.
- **`CONTESTANT_NAV_LOGGED_IN`, `usePageStyles`, the non-exported session helper and the missing header logout** are the four names a plan will look for under another spelling.

**Host state:** the stack is up and healthy (`yarn db:status` 0, `OPTIONS` 200 on the three functions, the allowlist probe 0); it was not restarted. Nothing listens on 5173 or 5273 and no dev server of this plan runs; the Vite server on 5199 is another session's. The database carries the schema of the tree, what the second E2E run left in its own project, and the `default` dataset (752 rows seeded). The host is on battery power. `CAND-APP-PLAN.md` is untracked and untouched. `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged.

## Self-Check: PASSED

- The four files under `key-files` exist; both scripts are executable.
- Commits `202191a38`, `9f888dfcd` and `34e5261e2` are ancestors of HEAD; `git rev-list --count 607d471fb..34e5261e2` is 3.
- The four run directories exist with the statuses stated; both baseline directories record head `9f888dfcd`.
- The plan's three verification items hold: `gates 173-01-baseline` exit 0, `e2e 173-01-baseline` exit 0, and no diff outside `.planning/` since the base revision.

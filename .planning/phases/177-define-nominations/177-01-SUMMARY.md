---
phase: 177-define-nominations
plan: 01
subsystem: planning-instruments
tags: [gates, e2e, verdict, baseline, operator-rulings, plpgsql_check, constraint-trigger]
status: complete
requires:
  - "Phase 176 closed (176-19-SUMMARY.md, 176-VERIFICATION.md)"
  - "quick task 261010-f1-b2-operator-replies closed on a complete green unloaded full run"
provides:
  - "177-gates.sh, 177-e2e.sh, 177-verdict.mjs — the phase's drivers and verdicts"
  - "177-read-rulings.mjs — the fixed-rule reading of a decision document"
  - "177-BASE, 177-BASELINE — the commit and the run every comparison starts from"
  - "177-BASELINE-FACTS.md — the baseline's numbers, Phase 176's names, the operator's round as read"
  - "177-A2-FINDING.md — A2: held; A2-FALLBACK: held"
affects: [177-02, 177-05, 177-06, 177-07, 177-10, 177-21]
tech-stack:
  added: []
  patterns:
    - "a linter's clean verdict is paired with a control the linter must refuse"
key-files:
  created:
    - .planning/phases/177-define-nominations/177-gates.sh
    - .planning/phases/177-define-nominations/177-e2e.sh
    - .planning/phases/177-define-nominations/177-verdict.mjs
    - .planning/phases/177-define-nominations/177-read-rulings.mjs
    - .planning/phases/177-define-nominations/177-BASE
    - .planning/phases/177-define-nominations/177-BASELINE
    - .planning/phases/177-define-nominations/177-BASELINE-FACTS.md
    - .planning/phases/177-define-nominations/177-A2-FINDING.md
  modified: []
decisions:
  - "The baseline is tests/e2e-runs/176-e2e/261011-vj-final, the run the dispatch names, because the quick task's closing run is not of the base commit's tree"
  - "Plan 177-07 writes the two SET CONSTRAINTS statements inside set_entity_nominations (A2 held)"
requirements-completed: []
metrics:
  started: 2026-10-10T23:43:37Z
  completed: 2026-10-10T23:57:33Z
  duration: "14 minutes"
  tasks: 3
  files: 8
actuals:
  tokens: 32400
  tasks: 3
  commits: 3
plan_head_before: dfc982db65cf95b97d68c795bead13fc6b46a5d7
plan_head_after: 446052bc951ee050a2661c46f2a3e87bd7a8c306
---

# Phase 177 Plan 01: The Phase's Drivers, its Baseline, the Operator's Rounds and the A2 Measurement — Summary

The phase's gate, E2E and verdict scripts copied from Phase 176 and seen refusing in 41 cases; the base commit and a baseline run of its tree recorded; both operator rounds read by a script with no item halted; every name of Phase 176 found; and the SQL linter measured as accepting `SET CONSTRAINTS` inside a `plpgsql` function.

## Read this first

- **The phase does not halt at this plan.** The precondition holds, no item of the operator's round halts, every name is on the tree, and both forms of the forcing are held.
- **The baseline is not the run the quick task's SUMMARY names.** That run is green and complete but of an earlier tree; the baseline is `tests/e2e-runs/176-e2e/261011-vj-final`, which the dispatch file names and which meets every condition of Task 1 step 3. No baseline run was made.
- **The round holds eighteen items, G1 to G18; the plan's frontmatter speaks of sixteen.** The script read all eighteen and each is `recommended-unticked (a)`. Nothing was mapped from a G item to a P item by eye.
- **Plan 177-07 writes the two statements inside `set_entity_nominations`.**

## Task Commits

| Task | Commit | Subject | Files |
|---|---|---|---|
| 1 | `f41c8a03d` | chore(177-01): the phase's gate, E2E and verdict scripts with the recorded baseline | `177-gates.sh`, `177-e2e.sh`, `177-verdict.mjs`, `177-BASE`, `177-BASELINE` |
| 2 | `0d57b19f8` | docs(177-01): the operator's rounds as read, the baseline's numbers and Phase 176's hand-over | `177-read-rulings.mjs`, `177-BASELINE-FACTS.md` |
| 3 | `446052bc9` | docs(177-01): the SQL linter's verdict on forcing the deferred rule inside a function | `177-A2-FINDING.md` |

Head before the plan: `dfc982db6`. Every commit is in the phase directory; `git diff --quiet dfc982db6 HEAD -- . ':(exclude).planning'` exits 0.

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-01-t<N>-verify.sh` by a script that reads the plan, and run with `bash`. Logs, statuses and heads are beside them.

| Verify | Before its commit | At the final head `446052bc9` |
|---|---|---|
| Task 1 | 0 (the five files staged) | 0 |
| Task 2 | 0 (the two files staged) | 0 |
| Task 3 | — (it reads the committed finding) | 0, and 0 directly after the commit |

`177-verdict.mjs scope` at the final head: 0, 0 paths changed outside `.planning/`. `177-verdict.mjs hygiene`: 0, 4 scripts and 21 plan files, 0 hits, 0 advisory lines.

## Task 1 — the gate, the drivers and the baseline

### The gate

`git ls-files --error-unmatch` exits 0 for the quick task's SUMMARY, `176-19-SUMMARY.md` and `176-VERIFICATION.md`. `git status --porcelain -- . ':(exclude).planning'` printed the operator's untracked `CAND-APP-PLAN.md` and nothing else. The quick task's SUMMARY reports a closing full run made unloaded: `176-e2e.sh 261010-f1-b2-final`, exit 0, 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects, no void marker, the load generator dead.

### The three scripts, and how each differs from its Phase 176 original

Made with one substitution over each file — the phase directory's name, then `176` → `177` — after confirming that every `176` in the three originals is of the form `176-…` or `Phase 176`. File modes are `100755`, as the originals'.

| Script | Lines that differ | By kind |
|---|---|---|
| `177-gates.sh` | 10 of 323 | header: the script's name and the phase number, the phase directory, the usage line, two mentions of the verdict script, the run root; code: `SELF`, `PD`, the example label, `DIR="tests/e2e-runs/177-gates/$LABEL"` |
| `177-e2e.sh` | 12 of 222 | header: name and phase number, phase directory, usage line, the run root twice; code: `SELF`, the example label, `RUN_DIR="tests/e2e-runs/177-e2e/$LABEL"`, the driver's own record file `177-preflight.txt`, the script's name in three printed lines |
| `177-verdict.mjs` | 23 of 811 | header: name and phase number, seven usage lines, the three run roots, two mentions of the E2E driver, the base file's name, the scripts-scan description; code: the three `ROOTS`, `BASE_FILE`, the name in the usage error and text, the name in the VOID and PASS/FAIL lines, the two file-name patterns of `hygiene` |

Unchanged: the fourteen rows and their order, `--rows`, the Node selection, the clean-tree refusal, the label refusal, the in-flight check at every depth, the `integration` row's handling of the stack's keys, the Docker free-space refusal at 13.8 GiB, the port refusal, the power record, the VOID rule, the `-rN` rule, every exit code, and `scope`'s five refused paths. 176-01-SUMMARY's deviations 1 and 2 (five refused paths; the preflight record's name) are in the copies.

### The base commit and the baseline

- **`177-BASE`:** `ae55fb89bf2e42517b04b459bf76dad5e23c92f0` — `git log -1 --format=%H -- . ':(exclude).planning'`. An ancestor of HEAD; HEAD is tree-equal to it outside `.planning/`.
- **The plan's candidate**, the run the quick task's SUMMARY names, `tests/e2e-runs/176-e2e/261010-f1-b2-final`: `summary.json` present, `exit` 0, no void marker, the full-suite line present, 341 of 341 passed — and head `d228b52bc`, which is **not** tree-equal to the base commit outside `.planning/` (`git diff --quiet` exits 1). Two commits lie between: `1f765a6db` (the wrapper's sleep assertion) and `ae55fb89b` (a sentence of `tests/README.md`).
- **`177-BASELINE`:** `tests/e2e-runs/176-e2e/261011-vj-final`, the run `177-DISPATCH.md` names for this case. Each condition of step 3 read from the directory itself: `summary.json` present; `exit` 0 and `playwright-exit` 0; no `VOID-host-suspend.txt`, `summary.json` `void: null`; `provenance.txt` holds `project:        <full default suite>`; head `ae55fb89b`, the base commit itself; 1 preflight success, 0 failures. Started `2026-10-10T23:31:18Z`, ended `23:40:05Z`. AC power at both ends, 0 Sleep entries in the window, `sleep_assertion=caffeinate -dimsu`, load at start 14.12.
- **No baseline run was made**, and neither driver has run past its usage refusal.
- **Counts:** total 341, passed 341, failed 0, flaky 0, skipped 0, did not run 0; 113 projects.
- **Per-project totals** (the full table is in `177-BASELINE-FACTS.md`): 83 projects hold one test each — 31 `data-setup-*`, 32 `data-teardown-*` and 20 others — and the 30 that hold more, summing to 258, are:

  `a11y-smoke` 16 · `auth-service-contract` 2 · `auth-setup` 2 · `cold-entry-dataroot` 3 · `contestant-a11y-scan` 24 · `contestant-entity-selection` 8 · `contestant-terms-gate-phone` 2 · `data-setup-entity-selection` 3 · `invitation-contract` 15 · `invitation-landing` 3 · `perm-2e-shared` 2 · `perm-access-disable` 3 · `perm-answers-locked` 4 · `perm-closed-project` 11 · `perm-disable-allow-open` 3 · `perm-disjoint-1co` 2 · `perm-interactive-info` 4 · `perm-localisation-positive` 2 · `perm-no-nomination` 68 · `perm-not-located-2e2cg` 5 · `perm-org-matching` 3 · `perm-organization-editing` 46 · `perm-per-app-notifications` 2 · `perm-question-video` 4 · `perm-show-feedback-survey` 6 · `perm-startfromcg` 2 · `storage-cleanup` 3 · `voter-journey` 2 · `voter-prefs-tracking` 3 · `voter-results-redraw` 5

### Each accepting branch seen refusing

On a scratch tree outside the repository (the session's scratch directory): a copy of `177-verdict.mjs` and `177-BASE` under the phase directory's path, and copies of Phase 176's kept evidence under this phase's three run roots, the HTML reports left out. `GIT_DIR` pointed at this checkout's git directory; only commit-to-commit comparisons were made. **41 cases, 41 as expected.** Nothing was written into the repository. "Planted" marks a copy changed to isolate one refusal.

| Case | Evidence | Exit |
|---|---|---|
| no subcommand; `dir e2e` with an unknown label; `dir` with an unknown kind | | 2, 2, 2 |
| `dir e2e attempt`, with `attempt` and `attempt-r2` present | | 0 |
| `e2e` on the fresh full green run | copy of `261011-vj-final` | **0** |
| `e2e` on a void run | marker planted; `8` planted in `exit`; and `261010-f1-slice-2` as kept, a real void run | **3**, **3**, **3** |
| `e2e` on a stale run | copy of `176-19-final`, unchanged | **1** ("is stale") |
| `e2e --same-projects-as` the same run by path | | 0 |
| `e2e` of a run lacking projects, against the fresh run | copy of `176-05-close`, HEAD planted in `head` | **1** ("'data-setup-perm-no-nomination' has total 0; expected equal to 1") |
| the fresh run against that run | | **1** |
| `--expect-title-count …axe accessibility scan=24` and `=999` | | 0, **1** |
| `--expect-project` present and absent | | 0, **1** |
| `e2e --allow-slice` on a green uncommitted run | copy of `176-12-precommit`; and with HEAD planted in `head` | **1**, **1** ("made on an uncommitted tree") |
| `e2e --allow-slice` on the red control | copy of `176-12-control` | **1** |
| `control --red "nominations:"` on the red control; the same `--green` | | 0, **1** |
| `control` on a void control | marker planted | **3** |
| `control --green --were-red-in` on the green run; the same `--red` | | 0, **1** |
| `control` with a `--dirty-only` path that does not cover the dirty path; with a setup project the run lacks; on a run of a committed tree; with a `--red` substring no title holds | | **1**, **1**, **1**, **1** |
| `gates` on a fresh five-row run without `--rows`; with its own five; with two of them | copy of `176-gates/261011-vj-final` | **1** ("not the full gate set of 14"), 0, **1** |
| `gates` on the five-row run with one status planted as 1 | | **1** |
| `gates` on a stale full run | copy of `176-gates/176-19-final`, unchanged | **1** |
| `gates` on that full run with HEAD planted; the same with `--rows typecheck` | | 0, **1** |
| `determinism --runs 3` on the stale ledger | copy of `176-determinism/176-19-final`, unchanged | **1** |
| `determinism --runs 3` and `--runs 4` with HEAD planted in the three heads | | 0, **1** |
| `determinism` on a ledger with a void run; for a project the runs lack | marker planted | **3**, **1** |
| `scope` on the scratch copy | | 0 |

In the repository itself, inside Task 1's verify: each script with no argument exits 2; none created a run directory.

## Task 2 — the rounds, and Phase 176's hand-over

### `177-read-rulings.mjs`, and how it differs from Phase 176's command

Phase 176's one-line command written out as a file, its statements in the same order. The differences: it takes the document's path and the section letters as its first two arguments and the facts file after `--facts`; its `FALLBACK` list is empty; a missing or malformed argument exits 2; the halt message for a document with no item names the letters asked for; and a facts file that cannot be read exits 2 with a message, where the original would have thrown (see *Deviations*). Run on sections C and D, its output is equal to the original command's, line for line (`diff`, exit 0).

### The two readings of the known document

`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, sections `CD`, **exit 0**:

```
C1: recommended-unticked (a)
C2: recommended-unticked (a)
C3: recommended-unticked (a)
C4: recommended-unticked (a)
C5: recommended-ticked (a)
C6: recommended-unticked (a)
D1: recommended-unticked (a)
```

Section `F`, **exit 1**: `F1: halt — option (b) ticked, for which the plans state no fallback an executor may build`, the item printed verbatim between its two marker lines, then `F2` to `F10` each `recommended-unticked (a)` and `HALT: 1 item(s) need the orchestrator; nothing is built`. Also seen: no argument, no letters, lowercase letters and `--facts` without a file each exit 2; an unreadable document and a letter with no section each exit 1.

### The UI contract's round

`177-UI-SPEC.md`, from `## PROPOSED` to `## Checker Sign-Off`, 261 lines holding 86 boxes: 0 lines begin with a ticked box, 0 begin with a bold NOTE or EDIT marker. `status: approved`. The sign-off holds the paragraph "The operator's round, read on 2026-10-10." The one `**NOTE:**` in that part is inside the fill rule's own sentence, mid-line.

### This phase's round, as the script printed it

`177-OPERATOR-ROUND` names `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` and `G`. Read at commit `c1bfd2487` (blob `8a5e9dc27`), no uncommitted change, **exit 0**:

```
G1: recommended-unticked (a)
G2: recommended-unticked (a)
G3: recommended-unticked (a)
G4: recommended-unticked (a)
G5: recommended-unticked (a)
G6: recommended-unticked (a)
G7: recommended-unticked (a)
G8: recommended-unticked (a)
G9: recommended-unticked (a)
G10: recommended-unticked (a)
G11: recommended-unticked (a)
G12: recommended-unticked (a)
G13: recommended-unticked (a)
G14: recommended-unticked (a)
G15: recommended-unticked (a)
G16: recommended-unticked (a)
G17: recommended-unticked (a)
G18: recommended-unticked (a)
```

No item halted. The document's closing paragraph "Read on 2026-10-11, section G, in part" lies under `## Fill status`, outside section G; the script does not read it, and it agrees with what the script printed for G17 and G18. With `--facts 177-BASELINE-FACTS.md` the script exits 0: every line is recorded.

### The names, each read on the tree

Read at head `f41c8a03d`. **Every name is found; none differs; the phase does not halt on the hand-over.**

| Name | Where | Found | Reaches |
|---|---|---|---|
| the sign-in helper, tracked | `tests/tests/setup/shared/registerAndStoreSession.ts` | found | 177-10, 177-16 |
| `taskStateOf`, `hasNomination`, `nominationsViewTarget`, `profileSaveTarget`, `questionSaveTarget`, each `export function` | `apps/frontend/src/lib/contestant/tasks/taskState.ts` | found, all five | 177-15, 177-18, 177-19 |
| route key `ContestantAppNominations`; `export const CONTESTANT_NOMINATED` | `apps/frontend/src/lib/routes/route.ts` | found, both | 177-15 |
| `public.get_entity_nominations`, and `private.caller_entity_ids` called inside its body | `apps/supabase/supabase/schema/503-entity-rpcs.sql` | found, both | 177-06 |
| its pgTAP file, tracked | `apps/supabase/supabase/tests/database/42-entity-nominations.test.sql` | found | 177-06 |
| members `nominationsLocked`, `answersLocked`, `taskState`, `nominations` | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found, all four | 177-15 to 177-19 |
| `nominationParentLabel`, `electionSymbolLabel` | `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts` | found, both | 177-12 |
| the `reason` union: `'answersLocked' \| 'nominationsLocked'` | `…/notEditableNote/NotEditableNote.type.ts` | found | 177-12 |
| `setNominationState`, `setNominationsLocked`, each `export async function` | `tests/tests/fixtures/contestant/perm-no-nomination.ts` | found, both | 177-10, 177-11, 177-19, 177-20 |
| `export function declareScans` | `tests/tests/utils/contestantAxeScan.ts` | found | the same |
| steps `expectNoHorizontalOverflow`, `expectInside` | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found, both | the same |

- **The chain** (`tests/playwright.config.ts`, read from its `name:` and `dependencies:` entries): `data-setup-perm-analytics-tracking` depends on `["perm-no-nomination"]`. `perm-startfromcg` is among the projects `perm-no-nomination` depends on through the chain, and not the other way round. `data-setup-perm-no-nomination` depends on `["perm-organization-editing"]`.
- **pgTAP:** 42 test files tracked; the highest number is 42, the next free number is 43.
- **Election types under `packages/dev-seed/src`:** 26 lines in 18 files. `generators/ElectionsGenerator.ts` holds the one `candidate_only`; `template/permittedKeys.ts` holds the key's own name; the other 24 lines, in 16 template files, are `organization_list`. The per-file table is in the facts file.

### The baseline's numbers, written by a command

`177-BASELINE-FACTS.md` is written by `tests/e2e-runs/177-unit/177-01-facts.mjs` (gitignored): the base commit; the baseline's directory, head, start, end and records; the counts and the per-project table (113 rows, summing to 341); the quick task's row that names its run and the debug record's line that names the baseline; the scans; the gate runs' quoted log lines; the names above; the UI round's line; and `## Operator rulings as read` with the eighteen lines.

- **Scans** (a title holding "axe accessibility scan"): `contestant-a11y-scan` 24 of its 24 tests; `perm-no-nomination` 12 of its 68.
- **Frontend unit**, from the quick task's closing gate run and from the gate run of the base commit's tree (`176-gates/261011-vj-final`), the same in both: `Test Files  194 passed | 1 skipped (195)`, `Tests  3575 passed | 20 skipped (3595)`.
- **pgTAP**, from Phase 176's closing gate run, neither later gate run holding that row: `Files=42, Tests=1957`, `Result: PASS`. `apps/supabase/supabase/` is unchanged between that run's head and the base commit.

## Task 3 — the A2 measurement

The whole measurement is in `177-A2-FINDING.md`. In short:

```
A2: held
A2-FALLBACK: held
```

**Plan 177-07 writes the two `SET CONSTRAINTS` statements inside `set_entity_nominations`.** The fallback, `private.force_nomination_parent_rule ()`, is not needed.

| Run of `yarn db:lint:sql` | The database held | Status |
|---|---|---|
| `before` | nothing of the probe | 0 |
| `built` | the table, the constraint trigger and the built form | 0 |
| `control` (not ordered by the plan) | the same and a function with one planted defect | 1, naming `public.a2_probe_control` alone |
| `fallback` | the table, the trigger and the fallback's two functions | 0 |
| `after` | nothing of the probe | 0, its log equal to `before` |

`built` and `fallback` each differ from `before` in one line: the 9001 census counts 32 tables with row-level security where it counted 31 — the probe table. Neither log names a probe function. `plpgsql_check_function` asked directly, with every warning class on, in a transaction that was rolled back: 0 rows for the built form, 0 for the fallback's caller.

The three behaviours of step 4, each observed for the fallback and, beyond the plan, for the built form: called for a row with no parent it raises `23514` inside the call; called with the parent set before the forcing it returns; and after either call a later row with no parent is inserted without a raise at its own statement. Two controls show the last can tell: with the mode left `IMMEDIATE` by hand the same insert raises at once.

*Inferred, not observed:* the linter never opens the fallback's `LANGUAGE sql` function, so the fallback's status is its answer about the `plpgsql` caller alone.

## Deviations from Plan

**1. The baseline is not the quick task's closing run, and no run was made (dispatch).** Task 1 step 3 says that when the candidate is green but not of this tree, the baseline is made with the new driver. `177-DISPATCH.md`, written after the plan, names `261011-vj-final` as the run of the tree as it now stands and says it is the baseline when the plan's own conditions hold for it. They hold, each read from the directory.

**2. A control function and a fifth and a sixth linter run, in Task 3.** The plan names four scratch objects and three runs (and the closing one). Added: `a2_probe_control`, the built form with one planted defect, and the run that shows the linter reports it by name. Without it a status of 0 would not show that the linter read a function created between resets. It carried the probe's prefix, was dropped before the fallback, and is covered by the catalogue check. This is no third form of the forcing.

**3. `plpgsql_check` asked directly, twice.** Each in a transaction that created the extension and was rolled back; the extension was not installed afterwards (read from `pg_extension`).

**4. The built form's behaviours were measured too.** The plan asks for the fallback's three.

**5. The probe functions take a parameter and hold one more statement than the plan's sentence.** `p_parent uuid`: with it the function updates the row before the forcing, so that one function serves cases (a) and (b). The privileges on every probe object were revoked from the API roles at creation, which the plan does not ask.

**6. The finding's commit was gated on a check of my own, not on Task 3's verify**, because the verify reads the committed file. The check held the verify's other stages: the three logs, equal statuses, an empty catalogue, a clean tree and the two verdict lines. The verify ran directly after the commit: 0.

**7. Task 1's and Task 2's verifies ran with their files staged, before the commits**, because each asks that the files be tracked and a commit follows its gate. Each ran again at the final head: 0.

**8. `177-read-rulings.mjs` exits 2 on a facts file it cannot read.** The plan says three changes and no other; the original would end on an uncaught error with status 1, which is the status of a halt.

**9. The facts file's first gate-run section quotes two runs for the frontend unit counts**, the quick task's and the one of the base commit's tree; the plan names the quick task's.

**10. No ledger file for the plan's head was written before the first commit.** The head before the plan, `dfc982db6`, was read at the start and is the base of the measured commit count.

**11. HEAD is on `feat/entity-signup-multi-grant`**, the branch the orchestrator named, not on a per-agent branch.

**12. Nothing was appended to `.planning/WINDOWS.md`, and `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated**, on the dispatch's instruction. There is no stub, skipped test or unrun verify to record.

## Not done, or not verified

- **No row of `177-gates.sh` has run, and `177-e2e.sh` has not run past its usage refusal.** The verdict's run-reading branches were exercised on copies of Phase 176's evidence, not on a run of this phase.
- **The linter was not asked about the real write function**, another role, or a constraint trigger with a `WHEN` clause; see the finding's own list.
- **The round's items were not matched to P-01 to P-18.** The script prints G ids; which G item carries which P item was not read.
- **The decision document's sections A, B and E were not read** by anything in this plan.
- **Whether `261011-vj-final` was made unloaded** is taken from the debug record's sentence and from the run's own `load_at_start=14.12/19.44/24.50`; no load generator's record was looked for.
- **The Docker VM's free space was not read**: no E2E run and no long gate was made.

## The state the local stack is left in

Read with `psql` after Task 3:

- **Probe objects:** none. 0 relations, 0 functions, 0 triggers, 0 constraints and 0 types named `a2_probe%` in any schema; `plpgsql_check` not installed.
- **`public`:** 21 tables and 28 non-trigger `plpgsql` functions, as before the probe.
- **Data:** 3 projects; 1 election, in the default project; 328 candidates, 377 nominations; 2 auth users. No reset was made by this plan, and no row was written that outlived its transaction.
- **The stack:** up; neither it nor Docker was restarted; nothing was pruned; nothing listens on port 5273. AC power, 100 %.
- **The working tree:** clean outside `.planning/` but for the operator's untracked `CAND-APP-PLAN.md`. Phase 178's planning files, untracked, were not touched or staged.

## Files touched that the plan did not list

None in the repository. Gitignored, under `tests/e2e-runs/177-unit/`: the three verify scripts with their logs, the facts generator, the readings' logs, and the A2 measurement's SQL files, logs and statuses (`177-01-a2-*`). Outside the repository, in the session's scratch directory: the refusal cases' script and tree.

## Known Stubs

None.

## Evidence (gitignored)

`tests/e2e-runs/177-unit/177-01-*`: `t1`/`t2`/`t3-verify.{sh,log,exit,head}` and `-final.{log,exit}`; `reading-CD`, `reading-F`, `reading-round` `.{log,exit}`; `facts.mjs`; `a2-{before,built,control,fallback,after}.{log,exit,head,started,ended}`; `a2-{setup,built,control,fallback,drop,behaviours}.sql`; `a2-{built,fallback}-behaviours.out`; `a2-direct-{built,fallback}.out`; `a2-after-catalogue.txt`.

## Self-Check: PASSED

The eight files exist and are tracked; the three commits are ancestors of HEAD; the three verifies exit 0 at the final head.

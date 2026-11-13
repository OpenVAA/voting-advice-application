---
phase: 176-contestant-home-task-state-nominations-view
plan: 01
subsystem: testing
tags: [gates, e2e, verdict, baseline, operator-rulings, d9, nominations, hydration, halt]

requires:
  - phase: 175-organization-editing-profile-questions-preview
    provides: the three driver scripts this phase's are re-pointed copies of; the closing full run that is this phase's baseline; the names of plans 11 to 13
provides:
  - 176-gates.sh, 176-e2e.sh and 176-verdict.mjs in the phase directory
  - 176-BASE (the base commit) and 176-BASELINE (the baseline run's directory)
  - 176-BASELINE-FACTS.md, with the operator's rulings of sections C and D as the reading printed them
  - 176-D9-FINDING.md, the reading of the nomination-formatting log line with one verdict line for each of its four points
affects: [176-02, 176-03, 176-05, 176-12, 176-13, 176-19]

actuals:
  tokens: 23470 # chars/4 over the diff of abb5e1ddc..00e2c79f6 (93879 chars); every changed file is in the phase directory
  tasks: 3
  commits: 3 # MEASURED: git rev-list --count abb5e1ddc..HEAD when this file was written; the commit of this file follows
plan_head_before: abb5e1ddc4ba77f0e0b70f65372eb107d9441f46
plan_head_after: 00e2c79f646115b86eaddca969157e68a86360fc

tech-stack:
  added: []
  patterns:
    - "The operator's decision document is read by one fixed command; its printed lines are the record"
    - "A reading that must be made before the code changes carries one fixed verdict line for each point, and a point that the run does not show is written as not held"

key-files:
  created:
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-gates.sh
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-e2e.sh
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-verdict.mjs
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-BASE
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-BASELINE
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-BASELINE-FACTS.md
    - .planning/phases/176-contestant-home-task-state-nominations-view/176-D9-FINDING.md
  modified: []

key-decisions:
  - "The baseline is Phase 175's closing run: its head is the base commit, so no baseline run was made"
  - "The fourth point of the D9 reading is written as not held: the answers-locked profile logged two lines for its one nomination, not one"
  - "The copied scope verdict keeps the five refused paths Phase 175's script holds, not three"

requirements-completed: []

phase_halted_at_this_plan: true
halt_reason: "176-D9-FINDING.md holds one point that is not held; Task 3's verify exits 1 by design and no later plan starts"

duration: about 22 min
completed: 2026-10-09
status: complete
---

# Phase 176 Plan 01: The Phase's Drivers, its Baseline, the Operator's Rulings and the D9 Reading — Summary

**The three drivers are copied and re-pointed with 47 refusal cases as expected, the base commit `4c930217c` and Phase 175's closing run (268 of 268 in 110 projects) are recorded as the baseline, all seven operator items of sections C and D read `recommended-unticked (a)`, every hand-over name of Phase 175 is on the tree — and the D9 reading stops the phase here: three of its four points stand, and the fourth does not, because a profile loaded while answers are locked logs the line twice for one nomination.**

Everything below was measured in this session unless it says "read" or "inferred".

## Read this first

1. **The phase is halted at this plan, as the plan prescribes.** Task 3's verify exits **1** on its last stage: `NOT HELD — the phase stops here: ["POINT 4: not held"]`. Every stage before it passed. The finding is committed as read. Nothing of the application was changed, and plans 176-02 onward do not start until the orchestrator has ruled on the finding.
2. **What was read against the fourth point.** The answers-locked dataset's profile, held open past hydration, logged **two** lines 2 ms apart, both naming one election id, for its one nomination. The point says one. A line does appear when the page is held open, so the research's assumption A3 is not falsified; what is not confirmed is the count.
3. **The second line is tied to the answers lock, in two runs.** In this run and in Phase 175's closing run, the only consecutive lines closer together than 50 ms are inside page loads of a profile while `access.answersLocked` is on: the probe (2 ms), and the two committed scans `org-profile-answers-locked` (3 ms and 3 ms here; 2 ms and 2 ms in the closing run). Why the block is formatted twice in that state is **not established**.
4. **`status: complete` in the frontmatter means the plan's three tasks were executed and committed**, not that the phase may go on. `phase_halted_at_this_plan: true` is beside it.
5. No operator item halted. No hand-over name is missing. No void run, no red run, nothing retried, nothing under `tests/e2e-runs/` deleted.

## Performance

- **Duration:** about 22 min (23:52Z → 00:14Z)
- **Tasks:** 3 of 3 executed; the third ends on the halt it exists for
- **Files:** 7 created, all in the phase directory; none outside `.planning/`
- **Power:** AC, 100 %, before the run and after it

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `5d1758f64` | `chore(176-01): the phase's gate, E2E and verdict scripts with the recorded baseline` | 1 |
| 2 | `9e4f493cc` | `docs(176-01): the baseline's numbers and Phase 175's hand-over as read on the tree` | 2 |
| 3 | `00e2c79f6` | `docs(176-01): the cause of the nomination-formatting log line, as read in the application` | 3 |

Each was made by pathspec. No commit of another agent came between them.

## Each task's verify command, with its real exit status

The three `<automated>` blocks and the reading command were written to script files by a script that reads the plan file; each is byte-identical to its block. Evidence: `tests/e2e-runs/176-unit/176-01-t<N>-verify.sh` / `.log` / `.exit` / `.head`, and `176-01-operator-reading.sh` with its `.t1.log` / `.t1.exit` / `.t1.head`.

| Verify | Head | Exit |
|---|---|---|
| The operator-rulings reading, before anything was copied or built | `abb5e1ddc` | **0** |
| **Task 1, as written**, with the five files staged | `abb5e1ddc` | **0** |
| **Task 1, as written**, again at the final head | `00e2c79f6` | **0** |
| **Task 2, as written**, with the facts file staged | `5d1758f64` | **0** |
| **Task 2, as written**, again at the final head | `00e2c79f6` | **0** |
| **Task 3, as written** | `00e2c79f6` | **1** — its last stage: `NOT HELD — the phase stops here: ["POINT 4: not held"]`. The stages before it passed: the finding tracked and committed, naming its run and the line; the run directory with a `head`, an `exit` of 0 and no void marker; a clean tree outside `.planning/`; no commit since the base commit touching `tests/tests`; exactly four verdict lines |

`176-verdict.mjs scope` at the final head: exit 0, 0 paths changed outside `.planning/`. `176-verdict.mjs hygiene`: exit 0, 3 scripts and 19 plan files, 0 hits, 0 advisory lines.

## Task 1 — the gate, the rulings, the drivers and the baseline

### The gate

All thirteen `175-NN-SUMMARY.md` files and `175-VERIFICATION.md` are tracked (`git ls-files --error-unmatch`, exit 0 for each of the fourteen). `git status --porcelain -- . ':(exclude).planning'` printed the operator's untracked `CAND-APP-PLAN.md` and nothing else. `git diff --quiet 4c930217c HEAD -- . ':(exclude).planning'` exits 0: every commit after Phase 175's closing tree touches `.planning/` alone. Phase 175 is not marked complete in `ROADMAP.md`; the gate does not ask for that and it was not checked further.

### The operator's rulings, as the command printed them

Read from `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` at commit `abb5e1ddc4ba77f0e0b70f65372eb107d9441f46` (blob `8281eeac7e63fa122f5b79b8a51191d12a29594b`), exit 0, before anything was copied:

```
C1: recommended-unticked (a)
C2: recommended-unticked (a)
C3: recommended-unticked (a)
C4: recommended-unticked (a)
C5: recommended-unticked (a)
C6: recommended-unticked (a)
D1: recommended-unticked (a)
```

No item halted and none is a fallback. The reading was made three more times — inside Task 1's verify, by the facts generator, and inside Task 2's verify with the facts file — and printed the same seven lines each time. The document's section E was not read: the command reads the sections whose heading begins `## C.` or `## D.`.

### The three scripts, and how each differs from its Phase 175 original

Made with one substitution over each file — the phase directory's name, then `175` → `176` — after confirming that every `175` in the three originals is of the form `175-…` or `Phase 175`. File modes are `100755`, as the originals'. `diff` against each original:

| Script | Lines that differ | By kind |
|---|---|---|
| `176-gates.sh` | 10 of 323 | header: the script's name and the phase number (1), the phase directory in the usage comment (1), the usage line (1), two mentions of the verdict script's name (2), the run root in the header (1); code: `SELF` (1), `PD` (1), the example label in the usage error (1), `DIR="tests/e2e-runs/176-gates/$LABEL"` (1) |
| `176-e2e.sh` | 12 of 222 | header: name and phase number (1), phase directory (1), usage line (1), the run root twice (2); code: `SELF` (1), the example label in the usage text (1), `RUN_DIR="tests/e2e-runs/176-e2e/$LABEL"` (1), the name of the driver's own record file in the run directory, `176-preflight.txt` (1), the script's name in three printed lines of the counts check (3) |
| `176-verdict.mjs` | 23 of 811 | header: name and phase number (1), seven usage lines (7), the three run roots (1), two mentions of the E2E driver's name (2), the base file's name (1), the scripts-scan description (1); code: the three `ROOTS` (3), `BASE_FILE` (1), the name in the usage error and in the usage text (2), the name in the VOID line and in the PASS/FAIL line (2), the two file-name patterns of `hygiene` — this phase's scripts and this phase's plan files (2) |

Unchanged: the fourteen rows and their order, `--rows`, the Node selection, the clean-tree refusal, the label refusal, the in-flight check at every depth, the `integration` row's handling of the stack's keys, the Docker free-space refusal at 13.8 GiB, the port refusal, the power record, the VOID rule, the `-rN` rule and every exit code. 175-01-SUMMARY's eight deviations are in the copies.

### The base commit and the baseline

- **`176-BASE`:** `4c930217cb7a73807c33caf0482e337d751e819c` — `git log -1 --format=%H -- . ':(exclude).planning'`. An ancestor of HEAD.
- **`176-BASELINE`:** `tests/e2e-runs/175-e2e/175-13-final` — found with `node $P175/175-verdict.mjs dir e2e 175-13-final`. Its `head` file holds the base commit itself, so the tree-equality check exits 0 trivially.
- **No baseline run was made.** Phase 175's closing run is of the base commit's tree.
- Read from the run's files: `exit` 0, `playwright-exit` 0, no void marker, `summary.json` `void: null`, 1 preflight success and 0 failures, started `2026-10-08T22:55:49Z`, ended `2026-10-08T23:03:06Z`, the recorded command names no `--project`.
- **Counts:** total 268, passed 268, failed 0, flaky 0, skipped 0, did not run 0; 110 projects.
- **Per-project totals** (`summary.json`, `byProject`; the full table is in `176-BASELINE-FACTS.md`): 81 projects hold one test each — 30 `data-setup-*`, 31 `data-teardown-*` and 20 others — and the 29 that hold more, summing to 187, are:

  `a11y-smoke` 16 · `auth-service-contract` 2 · `auth-setup` 2 · `cold-entry-dataroot` 3 · `contestant-a11y-scan` 22 · `contestant-entity-selection` 8 · `contestant-terms-gate-phone` 2 · `data-setup-entity-selection` 3 · `invitation-contract` 15 · `invitation-landing` 3 · `perm-2e-shared` 2 · `perm-access-disable` 3 · `perm-answers-locked` 3 · `perm-closed-project` 11 · `perm-disable-allow-open` 3 · `perm-disjoint-1co` 2 · `perm-interactive-info` 4 · `perm-localisation-positive` 2 · `perm-not-located-2e2cg` 5 · `perm-org-matching` 3 · `perm-organization-editing` 46 · `perm-per-app-notifications` 2 · `perm-question-video` 4 · `perm-show-feedback-survey` 6 · `perm-startfromcg` 2 · `storage-cleanup` 3 · `voter-journey` 2 · `voter-prefs-tracking` 3 · `voter-results-redraw` 5

### Each accepting branch seen refusing

On a scratch tree outside the repository (the session's scratch directory): a copy of `176-verdict.mjs` and `176-BASE` in a copy of the phase directory's path, and copies of Phase 175's kept evidence under this phase's three run roots, the HTML reports left out. `GIT_DIR` pointed at this checkout's git directory, so the staleness checks read real commits; only commit-to-commit comparisons were made. **47 cases, 47 as expected.** Nothing was written into the repository. Where a copy was changed to isolate one refusal, the table says "planted".

| Case | Evidence | Exit |
|---|---|---|
| no subcommand; `dir e2e` with an unknown label; `dir` with an unknown kind | | 2, 2, 2 |
| `dir e2e attempt`, with `attempt` and `attempt-r2` both present | prints the `-r2` directory | 0 |
| `e2e` on the closing run | copy of `175-13-final` | **0** |
| `e2e` on a void run | the same with the marker planted; and with `8` planted in `exit` | **3**, **3** |
| `e2e` on a stale run | copy of `175-05-close`, unchanged | **1** ("is stale") |
| `e2e --same-projects-as` the overflow close, by label and by path | | 0, 0 |
| `e2e --same-projects-as 175-12-close` | 46 against 44 in one project | **1**; with `--except …=2`: 0; with `--except …=3`: **1** |
| `e2e` of a run lacking a project, against the closing run | copy of the pre-phase run `261008-quick-g2-g4-g6`, which holds no `perm-organization-editing` | **1** ("has total 0; expected equal to 46") |
| the closing run against that run | | **1**; with the three new projects excepted `=+`: 0 |
| `e2e` of a run with unequal totals | copy of `175-05-close` with HEAD planted in `head` | **1** ("has total 4; expected equal to 46") |
| `--expect-title-count …axe accessibility scan=18` and `=999` | | 0, **1** |
| `--expect-project` present and absent | | 0, **1** |
| `e2e --allow-slice` on a green uncommitted run; on the red control | copies of `175-09-precommit` and `175-09-control` | **1**, **1** ("made on an uncommitted tree") |
| `control --red "profile:"` on the red control; the same `--green` | | 0, **1** |
| `control` on a void control | marker planted | **3** |
| `control --green --were-red-in` on the green run; the same `--red` | | 0, **1** |
| `control` with a `--dirty-only` path that does not cover the dirty path; with a setup project the run lacks; on a run of a committed tree; with a `--red` substring no title holds | | **1**, **1**, **1**, **1** |
| `gates` on the closing gate run | copy of `175-gates/175-13-final` | **0** |
| `gates` on a stale run | copy of `175-gates/175-05-close` | **1** |
| `gates` on a four-row run without `--rows`; with its own four; with two of them | copy of `175-13-premeasure` with HEAD planted in `head` | **1** ("not the full gate set of 14"), 0, **1** |
| `gates` on the four-row run as kept | | **1** |
| `gates` with one row's status planted as 1; the full run with `--rows typecheck` | | **1**, **1** |
| `determinism --runs 3` and `--runs 4` on the three-run ledger | copy of `175-determinism/175-13-final` | 0, **1** |
| `determinism` on a ledger with a void run; with stale heads; for a project the runs lack | marker planted; heads planted | **3**, **1**, **1** |
| `scope` on the scratch copy | | 0 |

In the repository itself: each script with no argument exits 2; `176-gates.sh` with an unknown row and with `--rows` and no value exits 2; `176-e2e.sh` with an unknown option and with `--project` and no value exits 2; none of these created a run directory.

## Task 2 — Phase 175's hand-over, each name read on the tree

Read at head `5d1758f64`. **Every name is found; none differs; the phase does not halt on the hand-over.**

| Name | Where | Found | Reaches |
|---|---|---|---|
| the scan helpers' module, tracked | `tests/tests/utils/contestantAxeScan.ts` | found | 176-13, 176-18 |
| its exports `declareScans` and `toScanEntry` | the same (it also exports `ContestantAxeRoute`, `assertContestantReach`, `assertDarkThemeIfDark`) | found | 176-13, 176-18 |
| the page-geometry fixture, tracked | `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | found | 176-18 |
| its steps `expectNoHorizontalOverflow`, `expectInside`, `expectNoOverlap`, `expectAtLeast` | the same (it also holds `expectWithinViewportWidth`, `expectShowsWholeText`, `createPageGeometry`, `MIN_TARGET_SIZE`) | found | 176-18 |
| the wiring gate reads that module and Phase 175's spec | `scripts/assert-a11y-scan-wiring.mjs` (it reads five files: the two scan specs, the module, `perm-organization-editing.spec.ts`, `perm-closed-project.spec.ts`) | found | 176-18 |
| the preview's component test, tracked | `$ENTITY/preview/page.svelte.test.ts` | found | 176-08 |
| `nominationsLocked` and `questionsReady` on `ContestantContext` | `apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts` | found | every plan that reads the context |
| `entityDescriptorOf` | `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts` | found | |
| `opinionQuestionsStateOf` | `apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts` | found | |
| `isHiddenIfMissingAnswers` | `apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts` | found | |
| the id `contestant-profile-identity` | `tests/tests/utils/testIds.ts` | found | |
| `permOrganizationEditingData.ts`, tracked | `tests/tests/utils/` | found | 176-07 |
| `contestantEntityHomePage.fixture.ts`, tracked | `tests/tests/fixtures/contestant/` | found | |

- **The chain:** `data-setup-perm-analytics-tracking` depends on `['perm-organization-editing']` in `tests/playwright.config.ts`.
- **pgTAP:** 41 test files tracked; the highest number is 41, the next free number is 42.

### The baseline's numbers, written by a command

`176-BASELINE-FACTS.md` is written by `tests/e2e-runs/176-unit/176-01-facts.mjs` (gitignored). It holds the base commit, the baseline's directory, head, start, end and records, the counts, the per-project table (110 rows, summing to 268), the scans, the closing gate run's rows and quoted log lines, the names above with the head they were read at, and `## Operator rulings as read` with seven lines of the form `- C1: recommended-unticked (a) — stands at the recommendation, no box ticked` and the commit of the document.

- **Scans** (a test whose title holds "axe accessibility scan", from `results.json`): `contestant-a11y-scan` 22 of its 22 tests; `perm-organization-editing` 18 of its 46.
- **Phase 175's closing gate run** (`tests/e2e-runs/175-gates/175-13-final`, head `4c930217c`, fourteen rows at 0): pgTAP `Files=41, Tests=1888, …` and `Result: PASS`; frontend unit `Test Files  182 passed | 1 skipped (183)` and `Tests  3146 passed | 16 skipped (3162)`, each quoted from its log line.

### What a Phase 175 summary says for Phase 176 that these plans may not carry

Searched by string over the nineteen plan files, not by reading each plan whole; a string that is absent may be carried in other words.

- **`previewExcludeTabs`** (175-11): the one value to empty if the Contestant App comes to load an organization's nominations into its data root. The string is in no plan of this phase.
- **`questionsReady` stays false for an entity with no selected election**, so "no nomination" must be decided from the entity's own nominations before it is consulted (175-08, 175-10): the plans 03 and 06 name "no selected election"; carried.
- **`contestantProfilePage.open()` waits on a nomination in the block that plan 176-13 deletes** (175-09, 175-12, 175-13): plan 13 names `contestantProfilePage.open`; carried.
- **`saveAndExpect('list')` pins today's routing after the last answer** (175-12): the string is in no plan; plan 17 carries the subject in other words ("where a last answer leads").
- **`contestantApp.basicInfo.requiredInfo` still names the old gate** (175-13): plan 04 names it; carried.
- **A long election or constituency label in the profile's nominations block wraps, and one long word does not** (175-12, 175-13): no plan holds "one long word". The block is deleted by plan 13; whether the nominations view inherits the same group component was not read.

## Task 3 — the D9 reading

The whole reading is in `176-D9-FINDING.md`. In short:

**The run.** `176-01-d9-reading`, `tests/e2e-runs/176-e2e/176-01-d9-reading`, through the wrapper directly with `--no-db-reset --project perm-organization-editing`, in the background. Head `9e4f493cc`, tree-equal outside `.planning/` to the base commit, with two uncommitted probes. Started `2026-10-09T00:02:05Z`, ended `00:08:15Z`, Playwright 6.0 min. Wrapper exit 0, no void marker, 1 preflight success and 0 failures. **196 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, in 88 projects**: the slice's 194 committed tests and the 2 probes. Docker VM free before it: 19.62 GiB (read with `docker run --rm alpine df -k /`; nothing was pruned); after it: 19.60 GiB. Nothing listened on the wrapper's port before or after.

**The entity the first probe ran as:** the organization-editing dataset's unconfirmed candidate, `e2e-perm-organization-editing-ca-unconfirmed`, which has exactly one nomination.

**The four verdict lines, each with what the run recorded:**

| Line in the finding | Evidence |
|---|---|
| `POINT 1: held` | Probe 1 (a), a full load of the profile: 1 line for 1 nomination, 708 ms after the navigation began, naming election id `16a27d1a-4252-4581-990d-41b022fdc60f` |
| `POINT 2: held` | Probe 1 (a): the card resolved at 1208 ms — one card, `[EL1] Organization-editing election`, its constituency field holding `[CO1] Only constituency` |
| `POINT 3: held` | Probe 1 (b): a full load of the home, 0 lines; a click on `contestant-home-profile`; 0 lines since the click; a marker written on `window` before the click was still there after it, so the profile was reached by a client navigation; the card resolved 114 ms after the click. `contestant-journey` in the same run holds no line |
| `POINT 4: not held` | Probe 2, the answers-locked dataset's profile held open: **2** lines, 655 ms and 657 ms after the navigation began, both naming election id `ffce6a1f-513f-4ac6-968e-bee6cb0e8664`, for one nomination (one card, `[EL1] Election 1`, `[CO1A] Only constituency`). The spec's committed profile test lasts 531 ms and holds no line |

**The dev-server log, every line matched to the test it fell inside** (`tests/e2e-runs/176-e2e/176-01-d9-reading.lines-by-test.txt`): 50 lines, all from the browser's console, each inside a test that loads a profile; Phase 175's closing run holds 47, and the three more are the probes' three. Three pairs of consecutive lines are less than 50 ms apart: the probe's pair (2 ms) and the pairs of the committed scans `org-profile-answers-locked` and its dark twin (3 ms each). Every other two consecutive lines are 183 ms or more apart. The same matching over the closing run's kept log: two such pairs, 2 ms each, in the same two scans; every other gap 78 ms or more.

**Assumption A2** (the mechanism in the application is the model's): two of its three falsifiers did not occur — no line on entry by a click, no card that never resolves. The third did, in the answers-locked state: a number of lines that is not the number of nominations. **A2 is not confirmed as written.**

**Assumption A3** (the answers-locked spec's profile test logs nothing because its page closes before hydration): its falsifier, no line from that profile when held open, did not occur. **A3 held.**

**What the reading supports and what it does not.** It supports that the line is produced at hydration and not by the data: every card ended resolved, and a client navigation logs nothing. It does not support "one line for each nomination" while answers are locked. *Inferred from the 2 to 3 ms spacing, not observed:* the block is formatted twice before the election arrives in that state. Why is not established — it was not read in the code and the research's model logged one.

### For plan 176-19 — the todo's resolution text, taken from the finding

The todo cannot be closed on this finding as it stands; what the finding would let it say:

> The line is logged by `parseNomination` in the profile page (`ENTITY/profile/+page.svelte`), in the browser, on a full page load of the profile: the nominations block is formatted before the data root holds the election and again, resolved, a moment later. Read in the application in run `176-01-d9-reading` (head `9e4f493cc`, the tree of `4c930217c`): one line for one nomination on a full load with the card resolved afterwards; no line when the page is entered from the home by a client navigation; and the answers-locked dataset's profile, which the committed test closes before hydration, logs when held open. No nomination is shown without its election once the page has settled. While `access.answersLocked` is on, a full load logs the line twice for one nomination, 2 to 3 ms apart; the cause of the second line was not established. The todo's `files:` entry names `apps/frontend/src/lib/contestant`; the logger is the profile page.

## Deviations from Plan

**1. `scope` keeps five refused paths, not three.** The plan says "`scope` keeps its three refused paths". Phase 175's script, as it stands, refuses five: the Edge Functions, the stack's configuration, the server hooks, any path under `apps/frontend/src/routes/api/`, and `CLAUDE.md`. The plan also says nothing else changes, so all five are in the copy. No plan of this phase lists a file under any of the five in its `files_modified` (searched). If a plan does change an API route, `scope` will refuse it.

**2. The E2E driver's own record file is `176-preflight.txt`.** It is written into each run directory by the driver and read by nothing (searched `tests/`, `scripts/` and the phase scripts); Phase 175's copy renamed it from Phase 174's the same way. It is the one differing line of `176-e2e.sh` that the plan's list of re-pointed things does not name.

**3. Task 1's verify ran with the five files staged, before their commit**, because its own stage asks that they be tracked and the commit follows the gate. It was run again at the final head: 0 both times. The same for Task 2.

**4. The finding's commit was not gated on Task 3's verify.** The plan orders the finding committed as read and the verify to exit non-zero on a point that is not held; the verify reads the committed file.

**5. The probes record more than the plan's minimum, and still assert nothing.** Each wait is caught and recorded as a fact, so that a card that never resolved would have been written down and not thrown. Beyond the counts they record: the time of each line and of the card's resolution; the final URL; the card's title and its constituency field's value; for (b), a marker on `window` that shows whether the click was a client navigation; for probe 2, when the answers-locked warning became visible. The first probe is one test holding (a) and (b) on one page, appended at the end of the organization-editing spec; the second is the last test of the answers-locked spec's authenticated describe.

**6. A reading the plan does not order: every forwarded line of the run matched to its test, and the same over Phase 175's closing run's kept log.** It is what shows that the second line is not the probe's alone. The closing run's files were read and not changed. No E2E run was made beyond the one the plan names.

**7. The facts generator's first output was wrong and was not committed.** Its check for the two context accessors used `\s` in a `git grep -E` pattern, which this host's `git grep` does not read; it reported the two names missing. The names were on the tree (read directly before). The pattern was changed to `[[:space:]]` and the file committed is the second output.

**8. One refusal case was corrected.** The first pass expected a copy of `175-05-close` to lack `perm-organization-editing`; it holds four tests of it. The case's status was as expected and its expected text was mine and wrong. It was restated as "unequal totals" and three cases were added on the pre-phase run, which does lack the project. 44 cases became 47.

**9. Nothing was appended to `.planning/WINDOWS.md`.** Phase 175's plans left that shared ledger alone and no write to it was named for this plan. What would go there: Task 3's verify, which exits 1 by design, and the open question of the second line.

**10. HEAD is on `feat/entity-signup-multi-grant`,** the branch the orchestrator named for this checkout, not on a per-agent branch; the commits were made there as instructed.

## Not done, or not verified

- **Task 3's acceptance criterion "each of the four lines reads held" is not met.** That is the reading's answer.
- **Why a profile logs the line twice while answers are locked** was not looked into: not in the code, not in a model.
- **How many times each committed test loads a profile was not counted**, so "one line for each page load" is read for the probes alone and inferred for the committed tests from the spacing.
- **No row of `176-gates.sh` has run, and `176-e2e.sh` has not run past its usage refusals.** The baseline was Phase 175's run, so the plan called for neither. The verdict's run-reading branches were exercised on copies of Phase 175's evidence, not on a run of this phase.
- **The D9 run was judged by its exit status and the absence of the void marker**, as the plan says; no `control` verdict was taken of it.
- **The decision document's section E was not read** by anything: the command reads sections C and D.
- **`ROADMAP.md` does not mark Phase 175 complete**; the gate does not ask for it.
- **The six hand-over notes above were searched by string**, not checked against each plan's text.

## The state the local stack is left in

Read with `psql` after the run:

- **Default project:** 1 election, 328 candidates, 377 nominations — the `default` dataset, as before.
- **The E2E project `…00e2`:** no election, candidate or nomination; its settings row reads `access.answersLocked: false`. Every teardown of the run passed.
- **Auth users:** 2. **pgTAP helpers in `public`:** none. The run was `--no-db-reset`; no reset was made by this plan.
- **The stack:** up; neither it nor Docker was restarted; nothing was pruned; nothing listens on the wrapper's port. Docker VM free: 19.60 GiB.
- **The working tree:** clean but for the operator's untracked `CAND-APP-PLAN.md`. The two probe specs were discarded with `git checkout --`; `git grep "d9-probe" -- tests/tests` finds nothing.

## Files touched that the plan did not list

None in the repository. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `abb5e1ddc` and HEAD.

Gitignored evidence:

- `tests/e2e-runs/176-e2e/176-01-d9-reading/` and, beside it, `.launched`, `.log`, `.exit`, `.evidence.log`, `.probes.jsonl` (the two printed probe reports), `.probes.diff`, `.lines-by-test.txt`, and the two specs as the run ran them: `176-01-d9-reading.perm-organization-editing.spec.ts` and `176-01-d9-reading.perm-answers-locked.spec.ts`.
- `tests/e2e-runs/176-unit/`: `176-01-t1-verify.*` to `176-01-t3-verify.*` and the two `-final.log` re-runs; `176-01-operator-reading.sh` with its `.t1.*`; `176-01-facts.mjs`; `176-01-d9-lines.mjs` and `176-01-d9-lines-baseline.txt`; `176-01-probe-typecheck.log`; `176-01-hygiene-pre.txt`, `176-01-hygiene-final.txt`, `176-01-scope-final.txt`.
- The refusal harness, its scratch tree and its `cases.tsv` and `cases.log` are in the session's scratch directory, outside the repository.

## Known Stubs

None.

## Threat Flags

None. This plan adds no endpoint, no auth path, no file access and no schema change. Its mitigations: T-176-01 by the 47 refusal cases; T-176-02 by the baseline's head being the base commit, asserted in Task 1's verify; T-176-03 by the unchanged `integration` row and `hygiene` at 0 hits; T-176-81 by the reading made here, before any plan changes the block, with a point that the run did not show written as not held; T-176-82 by the reading command, whose seven printed lines are the record.

## What the orchestrator should know

- **The phase waits on a ruling about the fourth point.** The finding's four lines and the evidence beside each are above; the three ways the plans' text reads it are: the point's own words ("logs one line"), the research's step (4) ("one line"), and ruling 6's falsifier of A3 ("no line"). The run shows two lines. I wrote what the point's words and the run say together.
- **The second line has a pattern**, in two runs, and no cause. A plan that deletes the block removes the logger either way; a plan that designs on "the block is rendered once before the election arrives" should know that under the answers lock it is rendered more than once.
- `status: complete` in this file's frontmatter is the execution status of the plan's three tasks. If the tooling reads it as leave to start wave 2, it should not.
- Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited.

## Self-Check: PASSED

Checked after writing:

- The seven created files exist in the phase directory and are tracked; `5d1758f64`, `9e4f493cc` and `00e2c79f6` are ancestors of HEAD; `git rev-list --count abb5e1ddc..00e2c79f6` is 3.
- `176-01-t1-verify.exit` and `176-01-t2-verify.exit` hold 0; `176-01-t3-verify.exit` holds 1; `176-01-operator-reading.t1.exit` holds 0; `tests/e2e-runs/176-e2e/176-01-d9-reading.exit` holds 0 and the run directory's `exit` holds 0 with no void marker.
- `176-D9-FINDING.md` holds exactly four verdict lines, three `held` and one `not held`.
- The working tree is clean outside `.planning/` but for `CAND-APP-PLAN.md`; `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are unchanged.

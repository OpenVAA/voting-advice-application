---
phase: 189-documentation-and-closure
plan: "20"
subsystem: testing
tags: [closure, c-02, recorded-search, gates, e2e, docs-03, docs-08]
status: complete

requires:
  - phase: 189 (plans 189-01 to 189-19)
    provides: the closing tree, the per-plan unit and E2E deltas, and the six closure records of 189-17 and 189-18
provides:
  - "C-02's locked search recorded with its output on the closing tree: 92 hits, six classes, C02_UNCLASSIFIED=0; the supplementary search adopted as an addition, 3 hits, all dated Observations rows"
  - "Twelve repository gates exit 0 at GATES_HEAD 03469505a, with the phase's unit deltas summed (+29)"
  - "The phase's one full E2E run green and not void: 729 passed, 0 failed, 0 flaky, 0 did not run, against 729 in 188-close3 with delta 0 and no title change"
affects: [189-VERIFICATION, milestone audit]

actuals:
  tokens: 13100
  tasks: 3
  commits: 3
plan_head_before: f222fc457d4c0626991dc71590bd8a5e06b80350
plan_head_after: f2d2b64d4bda7308c055a7cd8d57cd82811d3f12

tech-stack:
  added: []
  patterns:
    - "A closing record keeps HEAD at GATES_HEAD through the full run: the gates evidence is written before the run and committed after it"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-20-recorded-searches.md
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-20-closing-gates.md
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-20-closing-e2e.md
  modified: []

key-decisions:
  - "The navigation-idempotence gate formats the generated config from apps/docs, as generate:docs does; the plan's root-level Prettier command is a no-op there because the root .prettierignore lists docs"
  - "The Render grep is recorded both as 189-01 ran it (-E, where \\b matches nothing on this host) and with -P; with -P the extra hits are the English verb Render, and excluding it leaves the same two files"

requirements-completed: [DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08]

coverage:
  - id: D1
    description: "C-02's locked and supplementary searches recorded with full output, every hit classified, no permanent guard added"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 1 automated verify (record lines, the docs/infra filter, six closed todos) exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Twelve repository gates green on the closing tree"
    verification:
      - kind: other
        ref: "evidence/189-20-closing-gates.md, each exit read from its gate's status file; Task 2 verify exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The phase's one full E2E run, green and not void, judged against 188-close3"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/189-close2-20261121T122229Z; e2e-spec-verdict.mjs --no-flaky VERDICT OK 729"
        status: pass
    human_judgment: false
  - id: D4
    description: "Seven absorbed todos have closure records (six by 189-17/18, the caller limit in phase 188)"
    requirement: DOCS-08
    verification:
      - kind: other
        ref: "CLOSED_TODOS=6 and CALLER_LIMIT_TODO in evidence/189-20-recorded-searches.md"
        status: pass
    human_judgment: false

duration: 283min (wall clock, including about 3.5 h of host suspension between the two E2E runs)
completed: 2026-11-21
---

# Phase 189 Plan 20: Closure Summary

E2E_PASSED_VS_188_CLOSE=729
C02_HITS=92, C02_UNCLASSIFIED=0

The seventh absorbed todo, the per-caller limit, was closed in phase 188. Its record is `.planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md`.

**The phase closes on a green full suite: 729 passed, 0 failed, 0 flaky and 0 did not run, matching 729 in `188-close3` with no project or title change. Twelve gates pass on the same tree. C-02's search has 92 hits on record, every one in a named class that is not a statement about a deployed system.**

## Performance

- **Started:** 2026-11-21T08:02:02Z
- **Completed:** 2026-11-21T12:45Z
- **Tasks:** 3/3
- **Files created:** 3 (evidence only)

## Accomplishments

- **Task 1, the recorded searches.** The locked search `git grep -n -i -E 'unverified|not yet observed|untested' -- ':!.planning'` was run at `f222fc457` and gave 92 hits. They fall into six classes:
  - `UnverifiedAnswers` sentinel: 40
  - auth library's unverified session user or token: 8
  - probe check `functions.identity-callback-unverified`: 28
  - trufflehog's `unverified` result class: 9
  - the repository's own guard prose: 5
  - dated Observations rows: 2

  Research predicted 91. The extra hit is the dated row of 2026-11-20, which names the probe check. The supplementary search was adopted as an addition to C-02. It gave 3 hits, all dated rows. Within `apps/docs` and `infra`, outside test and script files, all 7 hits are dated rows or the probe check's name. The closing greps found:
  - no "no consent required" statement
  - Render mentioned only in the demo link and the fixture label
  - no `FRONTEND_URL`
  - no "Not yet observed" heading
  - six closed todos
- **Task 2, the gates at `GATES_HEAD=03469505a`.** These exit 0:
  - `db:reset`: 24 migrations, then the seed
  - `lint:check`
  - `format:check`
  - `test:unit`, with the stack running
  - `build`
  - docs `check`: 719 files, 0 errors
  - docs `build`
  - `validate:links --check`: 0 findings
  - `terraform fmt`
  - the production Docker image build

  The navigation rerun changes nothing (`NAV_IDEMPOTENT=yes`). `UNIT_DELTAS=+29`: dev-seed -13, docs +4, infra +16, frontend +22.
- **Task 3, the full run.** The first run, `189-close-20261121T081102Z`, was void: the host was suspended for 12.9 s at 08:31:13Z. Its directory is kept and the run is not counted. The rerun, `189-close2-20261121T122229Z` under `caffeinate -dims`, exited 0: 729 passed in 20.1 min, the preflight passed and the restore was ok. The verdict with `--no-flaky` is OK. Against `188-close3-20261119T213204Z`: 129 projects in each run, 0 count deltas, 0 titles gone or added.

## Task Commits

1. **Task 1: recorded searches.** `03469505a` (docs)
2. **Task 2: closing gates.** `8fcee7a13` (docs), committed after the run so HEAD stayed at GATES_HEAD
3. **Task 3: closing E2E.** `f2d2b64d4` (test, evidence only)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The navigation-idempotence command formats nothing from the root**
- **Found during:** Task 2
- **Issue:** `node_modules/.bin/prettier --write apps/docs/src/lib/navigation.config.ts`, run from the root, exits 0 but leaves the file as the generator wrote it. The root `.prettierignore` lists `docs`. As a result, `git diff --quiet` exited 1: 250 lines differed, whitespace and quotes only.
- **Fix:** Prettier was run from `apps/docs`, as `generate:docs` formats it (`../../node_modules/.bin/prettier --write src/lib/navigation.config.ts`), which is what plan 189-04 recorded. After that, `git diff --quiet` exited 0. No file was committed. The evidence records both runs.
- **Files modified:** none (the intermediate diff was formatted away)

**2. [Rule 3 - Blocking] The shared stack served another checkout's functions**
- **Found during:** Task 2, before the gates
- **Issue:** The edge runtime mounted `-reviewfix`'s `apps/supabase/supabase/functions`.
- **Fix:** With no test process running, and under the standing authorisation, the stack was restarted from this checkout (`yarn db:stop`, then `yarn db:start`).

**3. One void E2E run.** It is not a deviation in the tree. The run was made again under a new directory, as the rule says, and wrapped in `caffeinate -dims` as the orchestrator directed.

**Plan wording:** the Render grep's `\b` does not work with `git grep -E` on this host. The evidence records the `-E` result, which matches 189-01's two files, and the `-P` variant with its extra hits classified.

## Deferred Issues

None.

## Known Stubs

None. Only evidence files were written.

## Self-Check: PASSED

- FOUND: evidence/189-20-recorded-searches.md, evidence/189-20-closing-gates.md, evidence/189-20-closing-e2e.md
- FOUND: commits 03469505a, 8fcee7a13 and f2d2b64d4, each an ancestor of HEAD
- FOUND: tests/e2e-runs/189-close2-20261121T122229Z, with no VOID marker; tests/e2e-runs/189-close-20261121T081102Z kept, with its marker

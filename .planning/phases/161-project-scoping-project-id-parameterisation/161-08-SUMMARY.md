---
phase: 161-project-scoping-project-id-parameterisation
plan: 08
subsystem: testing
tags: [supabase, multi-tenancy, vitest, playwright, e2e, evidence, isolation]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "E2E_PROJECT_ID, resolveE2eProjectId(), ensureProject() and the project-scoped read helpers (161-05) — the mechanism this plan puts under test"
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "e2e-run.sh --no-db-reset and the tests/ subclass project default (161-05), which make a reset-free third run possible"
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "the accepted two-run criterion-3 pair and tests/scripts/e2e-evidence.mjs (161-07), which this run's verdict is derived with"
provides:
  - "packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts — a committed red/green proof that default-project rows are invisible to an E2E-project-scoped read, with a non-vacuous negative control that re-runs on every unit-test run"
  - "tests/e2e-runs/161-contamination-run3 — the full 155-test gate suite, green, taken with 751 rows of yarn test:unit residue deliberately present in the default project and no database reset"
  - "the measured finding that yarn test:unit's residue is created through @openvaa/dev-seed's own process.loadEnvFile bridge, which is why turbo's strict env mode cannot suppress it"
  - "a second, independent corroboration: the E2E freshness probe's 25 warnings name only concurrently-seeding perm-* siblings and never a single seed_ row"
affects: [162-permissions-and-auth-model-refactor]

actuals:
  tokens: 2446
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "An isolation claim is proven with a THREE-way read in one run — scoped-elsewhere returns zero, unfiltered returns the rows, scoped-here returns the rows — so the zero cannot be a property of an empty table or of a write that never happened"
    - "A negative control is proven to be a control by first running it MIS-SCOPED and watching it fail, then unscoping it; the failing state is committed so the proof is bisectable rather than narrated"
    - "A deliberately-created contamination is proven to be genuinely fresh by comparing created_at across the step that creates it, not by trusting that the command that should have written did write"

key-files:
  created:
    - packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts
    - tests/e2e-runs/161-contamination-run3 (gitignored — on disk only)
  modified: []

key-decisions:
  - "The scoped read under assertion is the dev-seed base class's own selectCandidatesForPortraitUpload rather than the tests/ subclass's query(collection) helper the plan names: dev-seed sits BELOW tests/ in the dependency graph and tests/ has no vitest project, so the sibling ensureProject.test.ts already established the source-read precedent. Both apply the identical .eq('project_id', this.projectId), and the harness helper's own scoping expression is asserted from source in the same file so the two cannot drift apart in silence."
  - "The RED half was committed as its own commit (dd4b0b841) with the negative control deliberately mis-scoped and failing, before the GREEN commit unscoped it. A control that was never observed to fail is not a control."
  - "161-05's 'zero probe warnings' was not used as evidence, as an acceptance criterion, or as a premise anywhere in this plan. The measured count here is 25, identical to 161-07's two runs, and it is read as structural cross-family concurrency rather than as contamination."
  - "The database was NOT reset at any point, and was deliberately left as run three left it."

patterns-established:
  - "A contamination experiment records the contamination's own freshness (a created_at that moved inside the creating step's window), because an experiment whose contamination was never actually there proves nothing"
  - "When a wrapper echoes load-bearing evidence on its own stdout that the run directory does not capture, the caller writes it into the run directory rather than restating it in prose"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "Default-project rows are invisible to an E2E-project-scoped read, proven with a non-vacuous negative control that re-runs on every unit-test run"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts#a read scoped to the E2E project returns none of them — 0 of 5"
        status: pass
      - kind: integration
        ref: "packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts#the same read WITHOUT the project filter returns all of them — the negative control — 5 of 5"
        status: pass
      - kind: integration
        ref: "packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts#a read scoped to the default project returns all of them — 5 of 5"
        status: pass
      - kind: other
        ref: "the control was first run MIS-SCOPED and observed to FAIL (`expected [] to have a length of 5 but got +0`) at commit dd4b0b841, which is what proves it is a control"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit — exit 0, 60 files / 659 tests, this file reported as run with 6 tests; the file also passes when run twice back to back, leaving 0 rows at its prefix"
        status: pass
    human_judgment: false
  - id: D2
    description: "The full E2E gate suite runs green with the yarn test:unit residue deliberately present in the default project and no database reset — the exact scenario that previously cost a full suite"
    requirement: PRESHIP-01
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/161-contamination-run3 — 155/155, failed 0, didNotRun 0, flaky 0, skipped 0, exit 0, preflight-ok 1 / preflight-fail 0, db_reset=false, no db-reset.log, full-suite command whose only filter is --grep-invert @probe"
        status: pass
      - kind: other
        ref: "the plan's task-2 node verify, run verbatim against the final artifacts: `contamination-immunity demonstrated: 155/155 green with unit-test residue present, no reset.` — exit 0"
        status: pass
      - kind: other
        ref: "751 seed_-prefixed rows measured in the default project immediately before the run and byte-identical immediately after, with an unmoved newest created_at — so the run neither saw nor touched them; 0 such rows in the E2E project at every reading"
        status: pass
    human_judgment: false
  - id: D3
    description: "The contamination was genuinely created by yarn test:unit rather than inherited as stale residue"
    verification:
      - kind: other
        ref: "newest seed_ candidate created_at moved from 2026-09-05T06:36:15.102658Z to 2026-09-05T06:38:35.394949Z across the plan's own `yarn test:unit` step (exit 0, 25/25 turbo tasks), so the whole default template was deleted and re-inserted by that run"
        status: pass
    human_judgment: false

duration: 26 min
completed: 2026-09-05
status: complete
---

# Phase 161 Plan 08: Proving the Isolation Claim Summary

**The phase's most attractive claim is now proven rather than asserted: a committed three-way test shows default-project rows returning 0 through an E2E-project-scoped read, 5 through the same read unfiltered and 5 through a default-project-scoped read; and the full 155-test gate suite ran green at commit `811f40d0c` with 751 rows of freshly-created `yarn test:unit` residue sitting in the default project and no database reset anywhere.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-09-05T06:27Z
- **Completed:** 2026-09-05T06:53Z
- **Tasks:** 2 of 2
- **Files modified:** 1 created (`packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts`), plus one gitignored evidence directory

## Task 1 — the red/green proof, with the three counts

`packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts` writes **5** candidate rows into the **default** project (`00000000-0000-0000-0000-000000000001`) under the reserved external-id prefix `scoping-contamination-probe-`, using the service-role client directly so the written count is exact, then issues the same read three ways in one run:

| # | The read | Asserted count | What it establishes |
| --- | --- | --- | --- |
| 1 | Scoped to the E2E project (`…0000e2`) | **0** | The claim: rows in one project are invisible to a read scoped to another. |
| 2 | The identical query with **no** project filter | **5** | The negative control. Without it, assertion 1 passes equally well against a table nothing was ever written to. |
| 3 | Scoped to the default project | **5** | Distinguishes "written where this read cannot see it" from "never written at all". |

Two further assertions hold the proof together: both project rows are confirmed to exist, so the zero in row 1 is a filtered read rather than a missing project; and the `tests/` harness's own `query(collection)` helper is asserted from source to still carry `.eq('project_id', this.projectId)`, so the mechanism exercised here and the mechanism the harness relies on cannot drift apart in silence.

**The control was proven to be a control by watching it fail.** Commit `dd4b0b841` is the file with the project filter deliberately applied to the one query whose entire job is to run without it. Run at that commit, the suite reports:

```
× the same read WITHOUT the project filter returns all of them — the negative control
  → expected [] to have a length of 5 but got +0
```

`811f40d0c` removes the filter and takes the file green. A non-zero expected count that has been observed to fail is a control; one that has only ever passed is a hope.

**Cleanup asserts itself.** The after hook deletes by prefix, asserts the deletion count is exactly **5**, and re-reads to **0**. The file was then run twice back to back — green both times — and an independent read afterwards found **0** rows carrying the prefix, so the isolation test cannot become the contamination it was written to detect.

**Gates.** `yarn workspace @openvaa/dev-seed test:unit` **exit 0** (60 files, 659 tests, this file reported as run with 6 tests). `yarn workspace @openvaa/dev-seed typecheck` **exit 0**. `git grep -n "DELETE FROM public.projects" -- packages` returns **nothing** (exit 1, no matches) — no project row is deleted anywhere in `packages/`.

## Task 2 — run three, with the contamination genuinely present

### The contamination is real, and it is fresh

`yarn test:unit` was run in full — **exit 0, 25/25 turbo tasks** — with Supabase up and **no reset**. Measured immediately after, in the **default** project at the `seed_` prefix:

| Table | Default project, `seed_` | Default project, all rows | E2E project, `seed_` | E2E project, all rows |
| --- | --- | --- | --- | --- |
| nominations | **377** | 377 | **0** | 0 |
| candidates | **327** | 328 | **0** | 0 |
| questions | **26** | 26 | **0** | 0 |
| question_categories | **4** | 4 | **0** | 0 |
| organizations | **8** | 8 | **0** | 0 |
| constituencies | **5** | 5 | **0** | 0 |
| alliances | **2** | 2 | **0** | 0 |
| elections | **1** | 1 | **0** | 0 |
| constituency_groups | **1** | 1 | **0** | 0 |
| factions | 0 | 0 | 0 | 0 |
| **Total** | **751** | 752 | **0** | 0 |

The shape matches the filed incident exactly (`elections=1 · question_categories=4 · questions=26 · candidates=328 · nominations=377`); the one-row gap on `candidates` is the single non-`seed_` bootstrap candidate from `seed.sql`, which is why the prefixed count reads 327 against 328 total.

**It is not stale residue.** The newest `seed_` candidate's `created_at` moved from `2026-09-05T06:36:15.102658Z` to `2026-09-05T06:38:35.394949Z` across the `yarn test:unit` step — inside that step's own window. The integration test's `beforeAll` teardown deleted the whole `default` template and the run re-inserted it, so the 751 rows were written by the very command the incident names. **This experiment is therefore an experiment**: the contamination was genuinely present, and it was genuinely created by the step that historically created it.

### Run three

`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/161-contamination-run3 --no-db-reset`

| | run three |
| --- | --- |
| `counts.total` | **155** (identical to both of plan `161-07`'s runs) |
| `counts.passed` | **155** |
| `counts.failed` | **0** |
| `counts.didNotRun` | **0** |
| `counts.flaky` | **0** |
| `counts.skipped` | **0** |
| `exit` file | **0** |
| `preflight-ok` / `preflight-fail` | **1** / **0** |
| git HEAD | `811f40d0c9ee40a4fe96d99d3cdb7815c8d32a59` |
| `db_reset` | **false** — and **no `db-reset.log`** in the run directory (`db-start.log` only) |
| `e2e_project_id` | `00000000-0000-0000-0000-0000000000e2` |
| Workers / retries | 6 / 0 (`observed_workers=6`, `observed_retries=0`) |
| Wall clock | 11.1 min (06:39:13Z → 06:50:32Z) |
| Working tree at run start | `?? .planning/milestone.lock` only |

It was the **full gate suite**. The echoed Playwright argument line, captured into the run directory as `command` and quoted in `provenance.txt`, carries **no `--project`** and no filter other than the standard probe inversion:

```
npx playwright test -c <repo>/tests/playwright.config.ts <repo>/tests --grep-invert @probe --reporter=html,json
```

The plan's own automated verdict check was run verbatim against the final artifacts and **exits 0**:

```
contamination-immunity demonstrated: 155/155 green with unit-test residue present, no reset.
```

**Discarded attempts: none.** The run was taken once, not re-taken, no test was re-run in isolation, no flake was waived, and there were no did-not-run tests to count either way.

### The residue was untouched by the run

Re-measured immediately after run three, the default project's ten teardown-scoped tables report the **identical** counts to the pre-run reading — 377 / 327 / 26 / 4 / 8 / 5 / 2 / 1 / 1 / 0, total **751** — and the newest `seed_` candidate's `created_at` is **unchanged** at `2026-09-05T06:38:35.394949Z`. The suite neither read nor wrote those rows. The E2E project is back to **0** rows in all ten tables, which is the documented teardown posture, with its project row left in place.

### A second, independent instrument agrees

The E2E freshness probe emitted **25** warnings, the same count plan `161-07` measured in both of its runs. Every one of them names a concurrently-seeding `e2e-perm-*` sibling family — 25 distinct prefixes, one warning each, never the base family:

```
[setupFromTemplate] The E2E project contains rows this run does not own — 5 candidate(s) and
5 organization(s) whose external_id is not prefixed 'e2e-perm-1e1cg1co-' (probe limited to 5
each, scoped to this project only). They will coexist with the seeded dataset and may produce
confusing test failures.
```

**Not one of the 25 mentions `seed_`.** `grep -c "seed_" stdout.log` over the whole run returns **0**. The probe reads *"scoped to this project only"* and is therefore structurally incapable of seeing 751 rows sitting in the default project — which is the invisibility claim, observed from a completely different direction than task 1's test. The warnings are structural cross-family concurrency under six workers, exactly as `161-07` measured, and the probe is warn-by-default so it did not affect the verdict.

### Disk, measured before and after

| | before | after |
| --- | --- | --- |
| `df -h .` available | **72Gi** (926Gi total, 92% capacity) | **72Gi** |
| docker images | 16.11GB | 16.11GB |
| docker local volumes | 13.07GB | 13.16GB |
| docker containers | 16.21MB | 16.39MB |

Headroom before the run was **72 GiB against the plan's 5 GiB floor**, so the escalation branch never applied. The run's own footprint is about 0.09 GB of Docker local-volume growth plus **2.1 MB** of evidence. **No run directory was deleted** — all 161 prior directories, `161-twice-run1` and `161-twice-run2` included, are on disk.

### The database was left as run three left it

No reset was performed at any point in this plan, and none was performed afterwards as a courtesy. The state the next run will start from is the state run three produced: 751 `seed_` rows in the default project, an empty E2E project with its project row intact.

## The conclusion, stated with the numbers

`yarn test:unit` left **751 rows across 9 tables** in the default project. A read scoped to the E2E project returns **0** of them (task 1, assertion 1), while the same read unfiltered returns **all** of them (assertion 2) and a default-scoped read returns **all** of them (assertion 3). With those 751 rows present and **no database reset**, the full **155-test** gate suite ran **155/155 green**, exit 0, preflight-confirmed, 0 failed / 0 did-not-run / 0 flaky.

Phase 144 lost a full suite to this exact residue — **8 failed / 79 did not run / 48 passed** — and recovered only by re-inserting a `db:reset`. That reset is now demonstrably unnecessary: not because the residue is gone, but because the suite reads a project the residue is not in.

## Task Commits

1. **Task 1 — RED: the control proven to be a control** — `dd4b0b841` (test). The negative control deliberately mis-scoped; fails with `expected [] to have a length of 5 but got +0`.
2. **Task 1 — GREEN: the control unscoped** — `811f40d0c` (test). Six tests green; three asserted counts 0 / 5 / 5.
3. **Task 2 — no commit.** Its sole artifact, `tests/e2e-runs/161-contamination-run3/`, is gitignored (`.gitignore:50`) and was deliberately **not** force-added, matching how `161-07` handled its two run directories. Task 2 produced no source change.

**Plan metadata:** the `docs(161-08)` commit carrying this SUMMARY.

## Files Created/Modified

- `packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts` — the red/green isolation proof. 6 tests: a reachability-recorded tier gate, a source-level assertion that the harness's `query` helper still scopes by project, and four live assertions (both projects exist; scoped-elsewhere 0; unfiltered 5; scoped-here 5), plus a self-asserting cleanup.
- `tests/e2e-runs/161-contamination-run3/` — `summary.json`, `provenance.txt`, `exit`, `command`, `env-posture.txt`, `results.json`, `stdout.log`, `devserver.log`, `db-start.log`, `head`, `started`, `ended`, `worktree-status.txt`, `preflight-failures`, `preflight-successes`, `html/`. Gitignored; on disk only; must not be deleted.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The scoped read under assertion is the dev-seed base class's, not the `tests/` subclass's**

- **Found during:** Task 1, while reading the `read_first` files.
- **Issue:** the plan specifies asserting through `tests/tests/utils/supabaseAdminClient.ts`'s `query(collection)` helper. That file lives in `tests/`, which sits ABOVE `packages/dev-seed` in the dependency graph; `vitest.workspace.ts` enumerates `packages/**` only, so `tests/` has no vitest project, and importing it from a dev-seed test would also pull it into dev-seed's `tsc --noEmit` (its `tsconfig.json` includes `tests/**/*`) along with a cross-package type import from `apps/frontend`.
- **Fix:** the live assertions go through `SupabaseAdminClient.selectCandidatesForPortraitUpload`, whose filter is `project_id = <the client's project> AND external_id LIKE <prefix>%` — the same `.eq('project_id', this.projectId)` scoping, on shipped production code, and prefix-filtered so it reads exactly the contamination. The harness helper is then tied in from SOURCE in the same file, asserting it still contains `this.client.from(tableName).select('*').eq('project_id', this.projectId)`, so removing the harness's scoping reddens this file. The sibling `packages/dev-seed/tests/ensureProject.test.ts` established this source-read precedent for exactly this reason.
- **Verification:** 6 tests green; `yarn workspace @openvaa/dev-seed typecheck` exit 0; the source assertion is non-vacuous (it matches a literal expression that a de-scoping edit would remove).
- **Committed in:** `811f40d0c`.

**2. [Rule 3 — Blocking] The wrapper's Playwright argument line is not captured by the run directory**

- **Found during:** Task 2, step 4.
- **Issue:** `provenance.txt` initially read `command: (not recorded)`. `e2e-run.sh` echoes `e2e-run.sh: npx playwright …` on its OWN stdout, and the run directory's `stdout.log` is a tee of the Playwright subshell alone — `tests/scripts/e2e-evidence.mjs:125` documents this and states the caller is expected to drop that line into a `command` file. Without it, "this was the full gate suite" would be prose rather than evidence.
- **Fix:** the echoed line was extracted verbatim from the wrapper's captured console output into `tests/e2e-runs/161-contamination-run3/command`, and the evidence was re-derived. `provenance.txt` now reads `project: <full default suite>` and carries the argument line.
- **Verification:** the line contains no `--project` and no filter besides `--grep-invert @probe`; the plan's task-2 verify re-run after re-derivation still exits 0.
- **Committed in:** not committed — the run directory is gitignored.

### Measured corrections to filed documents

- **`161-05`'s "vitest does not load the repo-root `.env`" is true of vitest and misleading in effect.** `packages/dev-seed/src/cli/teardown.ts` calls `process.loadEnvFile(<repo root>/.env)` at MODULE SCOPE, and that module is re-exported from the package barrel (`export { ALLOWED_TEARDOWN_TABLES, assertTeardownPrefix, runTeardown } from './cli/teardown'`), then bridges `PUBLIC_SUPABASE_URL` into `SUPABASE_URL`. So any import of `@openvaa/dev-seed` populates `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` inside the test process — which is why `default-template.integration.test.ts`'s `hasSupabase` gate is satisfied under a plain `yarn test:unit` even though `node -e` in the same shell sees `SUPABASE_URL` as `undefined`. **This matters for this plan specifically**: the env file is read from disk inside the worker, so Turborepo 2's strict env mode cannot suppress it, and `yarn test:unit` really does create the residue. Had the gate actually been env-dependent, the integration test would have skipped, no contamination would have existed, and the green run would have proven nothing. The reachability gate this plan's new file uses is correct for a different and better reason than the one `161-05` recorded: whether a database is there is answered by asking the port.
- **`161-05`'s "zero probe warnings" was not used anywhere**, per `161-07`'s correction. Measured here: **25**, the same 25 `e2e-perm-*` families, and **0** of them naming a `seed_` row.
- **The suite is 155 tests**, matching `161-07`'s measurement and not the 150 earlier plans budgeted against. Nothing was bent to a count: `counts.total` was compared to `161-07`'s runs, which is what the acceptance criterion asks.

---

**Total deviations:** 2 auto-fixed (both Rule 3 — one a dependency-graph constraint on the assertion's entry point, one an evidence artifact the wrapper does not itself capture), plus 3 measured document corrections.
**Impact on plan:** no stated behaviour was dropped. Both `<verify>` blocks pass verbatim, every acceptance criterion in both tasks is satisfied, and the correction that travels is the `process.loadEnvFile` bridge — because it is what makes `yarn test:unit`'s contamination unavoidable rather than environment-dependent.

## TDD Gate Compliance

Task 1 is `tdd="true"`. The RED gate is `dd4b0b841` (`test(161-08)`) — a genuinely failing state, observed failing, committed. The GREEN gate is `811f40d0c`, and it is a **`test(...)` commit rather than a `feat(...)`** one: the plan's deliverable IS a test, and the mechanism it proves (`.eq('project_id', this.projectId)`) already shipped in plan `161-05`, so there is no production code for a GREEN commit to add. A `feat(161-08)` commit does not exist and could only have been manufactured. No REFACTOR gate was needed. Recorded here rather than left for the gate scan to report as a violation.

## Issues Encountered

**None that affected the verdict.** Three things are worth recording so a later reader is not left guessing:

- **The default-template integration test was run once standalone at 06:30Z**, before anything was written, while reading it as a `read_first` file. That run also seeded the default project. It changes nothing: the plan's own `yarn test:unit` step at 06:38Z deleted and re-created the whole template, and the `created_at` evidence above is taken across THAT step, not across the earlier one.
- **`npx supabase status` from the repo root fails** with `No such container: supabase_db_voting-advice-application-gsd`, because the running stack uses a different project name. Supabase is healthy — REST answered 200 throughout and both project rows were readable. Not chased, not restarted.
- **No dev server was started by hand.** `e2e-run.sh` spawned and owned its own on port **5273** (`frontend_port=5273` in `env-posture.txt`); ports 5173 and 5273 were both confirmed free before the run.

## User Setup Required

None. This plan adds no dependency, no external service and no required environment variable.

## Next Phase Readiness

- **The phase's headline claim is discharged with a demonstration, not an assertion.** Criterion 3 was already discharged by `161-07`; this plan adds the half that says WHY the reset is unnecessary, and it says it twice — once at the query layer with an automated control that re-runs forever, once end to end with 751 real contaminating rows present.
- **The proof is re-runnable.** `packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts` runs on every `yarn test:unit`, so a regression that re-couples the two projects reddens the unit suite rather than waiting to be found by a lost E2E run.
- **Open, carried forward unchanged:** the two `E2E_PROJECT_ID` resolvers are still not unified (observed to agree on a third run now, still not the same code path); the freshness probe's 25 structural warnings still have no notion of ownership that tolerates concurrent siblings; and `.planning/todos/pending/2026-08-28-promote-e2e-freshness-probe-to-hard-failure.md` still has an **unmet** evidence prerequisite.
- **Also open, and now better characterised:** `.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` is no longer a suite-threatening defect — its option 2 (promote the probe to a hard failure) is measurably the wrong answer, since the probe never sees the residue at all. What remains of it is a tidiness issue about a test that does not clean up after itself, and the `teardown.ts` sibling (`--prefix` defaulting to `seed_`) is untouched by this phase.
- **Do not re-run the suite.** Three full-suite runs on this database now stand green with no reset between any of them.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts` present on disk.
- `tests/e2e-runs/161-contamination-run3/` present with `summary.json`, `provenance.txt`, `exit`, `command`, `env-posture.txt`; **no** `db-reset.log`.
- Commits `dd4b0b841` and `811f40d0c` resolve in `git log`.
- Both of the plan's `<verify>` blocks re-run verbatim: `yarn workspace @openvaa/dev-seed test:unit` exit 0, and the task-2 node check exit 0.
- Plan-level verification: the isolation test passes when run twice in a row; no database-reset log in the run directory; residue counts per project and disk measurements are recorded above.

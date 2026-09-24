---
phase: 161-project-scoping-project-id-parameterisation
plan: 07
subsystem: testing
tags: [playwright, e2e, supabase, multi-tenancy, evidence, criterion-3]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "ensureProject(), the tests/ subclass project default, globalSetup's create-after-preflight, and e2e-run.sh --no-db-reset (161-05) — the mechanism this plan exercises"
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "PUBLIC_PROJECT_ID plumbed into the served frontend (161-01) and the project-scoped query guard (161-01, 161-04)"
  - phase: 161-project-scoping-project-id-parameterisation
    provides: "the documented retirement of the reset-before-the-suite instruction (161-06), which this run is the evidence for"
provides:
  - "tests/e2e-runs/161-twice-run1 — full 155-test gate suite, green, no database reset"
  - "tests/e2e-runs/161-twice-run2 — the same suite, green, --no-db-reset, starting from what run one left behind, same commit"
  - "tests/scripts/e2e-evidence.mjs — derives summary.json and provenance.txt from a run directory, so a run's verdict is machine-readable evidence rather than a console impression"
  - "the measured finding that the E2E freshness probe's 25 per-run warnings are structural cross-family concurrency, not residue"
affects: [161-08, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 5600
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A run's verdict is DERIVED from the run directory's own machine-readable output by a committed script, never restated by hand — the derivation is validated against a known-green run (must reproduce its counts exactly) and two known-red runs (must report the failure) before it is trusted"
    - "A did-not-run test is discriminated from a declarative skip by results.length, because Playwright labels both `skipped`; under this project's cardinal rule the ambiguous case is counted as a failure"
    - "Reset-independence is proven against real accumulated state — a populated default project the runs must not touch — rather than against a clean slate"

key-files:
  created:
    - tests/scripts/e2e-evidence.mjs
    - tests/e2e-runs/161-twice-run1 (gitignored — on disk only)
    - tests/e2e-runs/161-twice-run2 (gitignored — on disk only)
  modified: []

key-decisions:
  - "Run one was taken with --no-db-reset as well, not with the reset DR-19 specifies, on the operator's standing instruction that the pre-existing seeded database must not be reset. DR-19 itself records that this proves the claim MORE strongly; the cost it names is failure-ambiguity, and both runs were green so no ambiguity arose."
  - "The plan's required artifacts summary.json and provenance.txt are not produced by e2e-run.sh — the phase-147-era tooling that wrote them no longer exists. A committed derivation script was added rather than the acceptance instrument being weakened, and it was validated in both directions before being believed."
  - "The freshness probe's 25 warnings per full-suite run are structural, not residue. Run two started with every teardown-scoped table at zero rows in the E2E project and produced the identical 25 warnings, all naming concurrently-seeding perm-* siblings and never the base family."

patterns-established:
  - "A backgrounded gate writes its own exit status to a file; the harness's wrapper status is never read as the gate's verdict"
  - "The between-runs database state is MEASURED before the second run starts, which is what makes 'no intervening reset' a checkable claim rather than an assertion"

requirements-completed: []

coverage:
  - id: D1
    description: "The full E2E gate suite runs green twice consecutively on one commit with no database reset between the runs"
    requirement: PRESHIP-01
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/161-twice-run1 — 155/155, failed 0, didNotRun 0, flaky 0, exit 0, preflight-ok 1 / preflight-fail 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/161-twice-run2 — 155/155, failed 0, didNotRun 0, flaky 0, exit 0, preflight-ok 1 / preflight-fail 0, --no-db-reset, no db-reset.log"
        status: pass
      - kind: other
        ref: "the plan's own task-1 and task-2 node verifies, run verbatim against the final artifacts — both exit 0; the task-1 instrument was first proven non-vacuous by exiting 1 on a known-red historical run"
        status: pass
    human_judgment: true
    rationale: "Task 3 is a gate=\"blocking-human\" checkpoint. The numbers are machine-derived and the automated verdicts pass, but the plan requires the OPERATOR to confirm the pair discharges criterion 3. That confirmation HAS NOW BEEN GIVEN and is recorded verbatim under '## Task 3 — the operator checkpoint'. It stays human_judgment: true because the sign-off is the evidence, not an automated result."
  - id: D2
    description: "The two independent E2E_PROJECT_ID resolvers — resolveE2eProjectId() in TypeScript and read_env_var in e2e-run.sh — resolved to the same project id, observed rather than assumed (161-05's carried-forward open risk)"
    verification:
      - kind: other
        ref: "shell side: env-posture.txt records e2e_project_id=00000000-0000-0000-0000-0000000000e2 in both runs; TypeScript side: a live database read mid-run showed the seeded rows landing in that same project (30 candidates, 61 nominations) while the default project's 328 candidates were untouched"
        status: pass
    human_judgment: false
  - id: D3
    description: "summary.json and provenance.txt are derived mechanically from each run directory's own output by a committed, bidirectionally validated script"
    verification:
      - kind: other
        ref: "reproduces tests/e2e-runs/147-reach14-suite/summary.json counts exactly (150/150/0/0/0/0) from its results.json; reports failed 1 / didNotRun 2 on 140-f9-after and failed 1 / didNotRun 1 on 146-05-guardfail-404, neither of which Playwright labels as failures beyond the one unexpected"
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check exit 0 with the file staged; assert-comment-hygiene scanned 1657 files (up from 1656) with 0 violations, so the zero is a verdict on this file"
        status: pass
    human_judgment: false

duration: 44 min
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 07: Two Consecutive Reset-Free Full-Suite Runs Summary

**The full 155-test E2E gate suite ran green twice in a row at commit `70fa58261` with no database reset between the runs — and none before either one, because run one was taken reset-free too — starting from a populated default project that neither run touched, and the operator has confirmed the pair against the evidence.**

> **Closed.** All three tasks are complete. The operator answered the plan's `gate="blocking-human"` checkpoint and approved the pair; the attestation is recorded verbatim under *Task 3 — the operator checkpoint*. This SUMMARY was first issued as `status: halted` while that checkpoint was open, and re-issued as `status: complete` when it was answered — the halt was a signature, never a defect.

## Performance

- **Duration:** 44 min
- **Started:** 2026-09-04T15:33Z
- **Completed:** 2026-09-04T16:17Z
- **Tasks:** 3 of 3
- **Files modified:** 1 created (`tests/scripts/e2e-evidence.mjs`), plus two gitignored evidence directories

## The verdict, in criterion 3's own terms

The full E2E gate suite ran green **twice in a row** with **no intervening database reset**, on **one commit**.

| | run one | run two |
| --- | --- | --- |
| Run directory | `tests/e2e-runs/161-twice-run1` | `tests/e2e-runs/161-twice-run2` |
| `counts.total` | **155** | **155** |
| `counts.passed` | **155** | **155** |
| `counts.failed` | **0** | **0** |
| `counts.didNotRun` | **0** | **0** |
| `counts.flaky` | **0** | **0** |
| `counts.skipped` | 0 | 0 |
| `exit` file | **0** | **0** |
| `preflight-ok` | **1** | **1** |
| `preflight-fail` | **0** | **0** |
| git HEAD | `70fa58261debdd50d11dee9f7a8a95dd0a653da7` | `70fa58261debdd50d11dee9f7a8a95dd0a653da7` (**same**) |
| `db-reset` | **no** (`db_reset=false`) | **no** (`db_reset=false`) |
| database-reset log present | no (`db-start.log` only) | **no** (`db-start.log` only) |
| Playwright projects | 95 | 95 (identical set, identical per-project totals) |
| Wall clock | 10.7 min | 10.5 min |
| Started / ended (UTC) | 15:44:52 / 15:55:46 | 15:56:47 / 16:07:25 |
| Working tree at run start | `?? .planning/milestone.lock` only | same |

Both runs were the **full gate suite**. The echoed Playwright argument line, captured into each run directory as `command` and quoted in each `provenance.txt`, is identical for both and contains **no `--project`** and **no `--grep` other than the standard probe inversion**:

```
npx playwright test -c <repo>/tests/playwright.config.ts <repo>/tests --grep-invert @probe --reporter=html,json
```

Both of the plan's automated verdict checks were run verbatim against the final artifacts:

- Task 1: `run one green: 155/155` — **exit 0**
- Task 2: `criterion 3 discharged: two full-suite runs green, no intervening reset.` — **exit 0**

**Discarded attempts: none.** Neither run was re-taken, no test was re-run in isolation, no flake was waived, and no did-not-run test was counted as a pass. There were no did-not-run tests to count either way.

## The database, measured three times

The ten `ALLOWED_TEARDOWN_TABLES` (`nominations`, `questions`, `question_categories`, `candidates`, `factions`, `alliances`, `organizations`, `constituencies`, `constituency_groups`, `elections`), counted per project directly against local Postgres.

| Table | Default project, before | Default project, between | Default project, after | E2E project, before | E2E project, **between** | E2E project, after |
| --- | --- | --- | --- | --- | --- | --- |
| candidates | 328 | 328 | 328 | 0 | **0** | 0 |
| nominations | 377 | 377 | 377 | 0 | **0** | 0 |
| questions | 26 | 26 | 26 | 0 | **0** | 0 |
| question_categories | 4 | 4 | 4 | 0 | **0** | 0 |
| organizations | 8 | 8 | 8 | 0 | **0** | 0 |
| constituencies | 5 | 5 | 5 | 0 | **0** | 0 |
| constituency_groups | 1 | 1 | 1 | 0 | **0** | 0 |
| elections | 1 | 1 | 1 | 0 | **0** | 0 |
| alliances | 2 | 2 | 2 | 0 | **0** | 0 |
| factions | 0 | 0 | 0 | 0 | **0** | 0 |

Both project rows — `00000000-0000-0000-0000-000000000001` (Default Project) and `00000000-0000-0000-0000-0000000000e2` — are present in all three readings. The E2E **project row survives** while its content returns to zero: that is the stated teardown posture, observed rather than described.

**What this makes checkable.** The "between" column is the state run two started from, recorded at `15:55:59Z` — after run one finished and before anything else touched the database. Nothing ran between the two runs: no reset, no seed, no unit-test run, no manual change, and no commit. The default project's 328 candidates are byte-identical across all three readings, so neither run wrote outside the project it owns.

**Mid-run observation (161-05's carried-forward open risk).** At `15:45:22Z`, while run one was seeding, the E2E project held 30 candidates, 61 nominations, 26 questions, 8 question categories, 5 organizations, 6 constituencies, 2 constituency groups, 2 elections and 2 alliances. That is the **TypeScript** resolver's target, observed in the database; the **shell** resolver's target is recorded independently in each `env-posture.txt` as `e2e_project_id=00000000-0000-0000-0000-0000000000e2`, and is what was passed to the dev server as `PUBLIC_PROJECT_ID`. **The two independent resolvers agree, observed rather than assumed.** Neither `.env` nor the shell environment carries an `E2E_PROJECT_ID` line, so both fell back to their own copy of the committed default, and those copies match.

## Disk, measured three times

`tests/e2e-runs/` was not deleted, and nothing was reclaimed.

| | before the pair | between the runs | after run two |
| --- | --- | --- | --- |
| `df -h .` available | **75Gi** (926Gi total, 92% capacity) | 74Gi | 74Gi |
| docker images | 16.11GB | 16.11GB | 16.11GB |
| docker local volumes | 12.76GB | 12.83GB | 12.88GB |
| docker containers | 15.88MB | 16.04MB | 16.21MB |

Headroom before the pair was **75 GiB against the plan's 5 GiB floor** — fifteen times the floor, and far above the 22 GiB the plan measured while planning, so DR-20's escalation branch never applied. **The pair's measured cost** is about 0.12 GB of Docker local-volume growth plus 4.1 MB of evidence (`161-twice-run1` 2.1 MB, `161-twice-run2` 2.0 MB); the 1 GiB drop in `df` available between the first two readings is host-wide noise on a 926 GiB volume, not the runs' footprint.

## Pre-pair gates

Each was run as its own command with its exit status written to its own file by the same shell that ran it, then read from that file — never through a pipe, and never from a backgrounded wrapper's reported status.

| Gate | Result |
| --- | --- |
| `yarn build` | **exit 0** — 14/14 tasks, FULL TURBO |
| `TURBO_FORCE=true yarn lint:check` | **exit 0** — 23/23 tasks, **0 cached**; every guard reported a non-zero population (comment hygiene 1656 files, i18n catalog 596 keys, project-scoped query guard 5 sources / 5 raw client calls, all 0 violations) |
| `yarn test:unit` | **exit 0** — 25/25 tasks; frontend 1630 tests, dev-seed 653 tests across 59 files |

All three ran **before** the pair, as the plan requires. None of them ran between the two runs.

## Task Commits

1. **Task 1 (prerequisite): the evidence-derivation script** — `70fa58261` (test). Committed **before** run one precisely so that both runs would share one HEAD.
2. **Task 1/2 (instrument completion): the Playwright argument line in derived provenance** — `8d2e55536` (test). Committed **after both runs**, so it does not sit between them.

**Plan metadata:** `5ed45ca15` (docs) issued this SUMMARY while the Task 3 checkpoint was open; a second `docs(161-07)` commit records the operator's attestation and re-issues it as `status: complete`.

The pair's own commit is `70fa58261`. The only code commit after the runs, `8d2e55536`, touches `tests/scripts/e2e-evidence.mjs` and nothing else — a file no spec imports and the suite never loads — verified with `git diff --name-only 70fa58261 8d2e55536`, which returns exactly that one path. Everything after it is `.planning/` documentation.

**Nothing was committed between run one and run two.** Both `provenance.txt` files record the same 40-character HEAD, and the plan's task-2 check asserts that equality.

## Files Created/Modified

- `tests/scripts/e2e-evidence.mjs` — derives `summary.json` and `provenance.txt` from a run directory. Every number is computed from `results.json` or copied verbatim from a file `e2e-run.sh` wrote. It is a separate, after-the-fact step rather than a block inside `e2e-run.sh`, so it can be re-run against any historical run directory and a bug in it can never change a run's outcome.
- `tests/e2e-runs/161-twice-run1/`, `tests/e2e-runs/161-twice-run2/` — each holds `summary.json`, `provenance.txt`, `exit`, `devserver.log`, `env-posture.txt`, `results.json`, `stdout.log`, `html/`, `head`, `started`, `ended`, `worktree-status.txt`, `preflight-failures`, `preflight-successes`, `command` and `db-start.log`.

**`tests/e2e-runs/` is gitignored** (`.gitignore:50`). The evidence directories therefore live on disk only and are **not** in any commit; they were deliberately not force-added. They must not be deleted — the phase registers cite them.

## Decisions Made

See `key-decisions` in the frontmatter. The one carrying the most weight downstream is the freshness-probe finding below, because it contradicts what `161-05` expected and changes what plan `161-08` can claim.

## Deviations from Plan

### 1. [Rule 3 — operator directive overrides DR-19] Run one was taken reset-free too

- **Found during:** Task 1, before the first run.
- **Issue:** DR-19 specifies run one **with** the reset, to establish a known start. The operator's dispatch instruction states, unambiguously, that the database "has NOT been reset and MUST NOT be", because it carries pre-existing seeded data that is "exactly the condition this plan has to survive". The two cannot both be honoured.
- **Fix:** the operator's directive was applied. Both runs were taken with `--no-db-reset`. DR-19 itself records that taking run one without a reset "would prove the same thing more strongly"; the only cost it names is that a **failure** would be ambiguous between the phase's changes and accumulated prior state. Both runs were green, so no ambiguity arose and no re-take was owed.
- **Verification:** neither run directory contains a `db-reset.log`; both contain `db-start.log`; both `env-posture.txt` files record `db_reset=false`. The plan's task-2 check asserts the absence of a reset log in run two, and it passes. No acceptance criterion in either task required run one to have performed a reset.
- **Effect on the claim:** strictly stronger. The pair proves reset-independence starting from a **populated** default project (328 candidates, 377 nominations) rather than from a clean slate, and that project's row counts are identical before, between and after.

### 2. [Rule 3 — the acceptance instrument names artifacts the harness does not produce] `summary.json` and `provenance.txt`

- **Found during:** Task 1, reading `tests/scripts/e2e-run.sh` in full before running it.
- **Issue:** both tasks' `<verify>` blocks, both acceptance-criteria lists, the `must_haves.artifacts` list and the Task 3 checkpoint all read `summary.json` and `provenance.txt` from the run directory. `e2e-run.sh` writes **neither**. It writes `results.json`, `head`, `worktree-status.txt`, `started`, `ended`, `exit`, `preflight-failures`, `preflight-successes` and `env-posture.txt`. The reference run the plan points at, `tests/e2e-runs/147-reach14-suite/`, has the two files but none of those nine — it was produced by phase-147-era tooling that no longer exists. `161-05` recorded the same mismatch in narrower form ("Task 2's acceptance criterion names artefacts the script does not produce") and worked around it by reading the raw files instead.
- **Fix:** rather than weaken the instrument, `tests/scripts/e2e-evidence.mjs` was added to derive the two files mechanically from the raw ones, and committed **before** run one so both runs share a HEAD.
- **Verification — non-vacuous in both directions, on copies so no cited evidence directory was mutated:**
  - **Green reference:** run against `147-reach14-suite`'s `results.json`, it reproduces that run's committed `summary.json` counts **exactly** — `{"total":150,"passed":150,"failed":0,"flaky":0,"skipped":0,"didNotRun":0}`, string-identical.
  - **Red references:** `140-f9-after` → `failed 1, didNotRun 2`; `146-05-guardfail-404` → `failed 1, didNotRun 1`.
  - **The plan's own task-1 verify, fed a known-red run directory, exits 1** and names both defects: `run one NOT green: failed=1; didNotRun=2`. The acceptance instrument is therefore not vacuous, and its `preflight-fail:\s*0` / `preflight-ok:\s*[1-9]` / `[0-9a-f]{40}` patterns match the emitted format.
  - `TURBO_FORCE=true yarn lint:check` **exit 0** with the file staged; `assert-comment-hygiene.mjs` scanned **1657** files (up from 1656 with the file untracked) with 0 violations, so the zero is a verdict on this file rather than on a corpus that excluded it.
- **A did-not-run test is not a skip.** Playwright labels both `status: "skipped"`. The script discriminates on `results.length`: a test the runner never executed carries an empty results array and no annotation, while a declaratively skipped one carries a `skip`/`fixme` annotation or a recorded skipped result. Under the project's cardinal rule the ambiguous case is classified as **`didNotRun`**, never as `skipped` — which is exactly why the two red references above report 2 and 1 did-not-runs that Playwright's own `stats` block reports merely as `skipped`.
- **Committed in:** `70fa58261`, with the argument-line half in `8d2e55536`.

### Measured corrections to filed documents

- **The suite is 155 tests, not the 150 the plan budgets against.** DR-18 says "the last full gate run on record was 150 tests in 10.7 minutes". Measured: **155 tests in 10.7 and 10.5 minutes**, across **95** Playwright projects. The plan's wall-clock estimate was accurate; its test count is five short, because the suite grew after phase 147. Nothing was bent to reach 150 — `counts.total` was compared between the two runs to each other, which is what the acceptance criterion actually requires.
- **`provenance.txt`'s `branch:` field reads `(not recorded by the wrapper)`.** `e2e-run.sh` records the HEAD sha and the working-tree status but not the branch name. A post-hoc branch value would be an assertion rather than evidence, so none was written. The branch was `integration/ship-12-squash` throughout, and the 40-character HEAD — which is what the plan's cross-run check compares — is recorded in both files.

---

**Total deviations:** 2 auto-fixed (both Rule 3 — one an operator directive taking precedence over a decision record, one an acceptance instrument naming artifacts the harness does not emit), plus 2 measured document corrections.
**Impact on plan:** no stated behaviour was dropped. Every acceptance criterion in tasks 1 and 2 is satisfied, and both `<verify>` blocks pass verbatim. The correction that travels is the test count (155, not 150) and the freshness-probe finding below.

## Issues Encountered

### The freshness probe warns 25 times per full-suite run — and it is structural, not residue

`161-05` recorded **zero** probe warnings across its two consecutive no-reset runs, and named "zero warnings across both runs" as the evidence prerequisite for the filed proposal to promote the probe from a warning to a hard failure (`.planning/todos/pending/2026-08-28-promote-e2e-freshness-probe-to-hard-failure.md`). It also told this plan to "record it either way".

**Measured here: 25 warnings in run one and 25 in run two** — the same 25, naming the same 25 `e2e-perm-*` families, in both runs. Example:

```
[setupFromTemplate] The E2E project contains rows this run does not own — 5 candidate(s) and
5 organization(s) whose external_id is not prefixed 'e2e-perm-1e1cg1co-' (probe limited to 5
each, scoped to this project only). They will coexist with the seeded dataset and may produce
confusing test failures.
```

**These are not residue, and the proof is the between-runs measurement.** Run two began with **every one of the ten teardown-scoped tables at zero rows in the E2E project**, and still emitted the identical 25 warnings. Warnings that appear when the project is provably empty at the start cannot have been caused by rows a previous run left behind. Two further readings agree: the warnings name **only** concurrently-seeding `perm-*` sibling families and **never** the base family, which seeds first into an empty project and draws zero warnings in both runs.

The mechanism is the one `161-05` flagged in "What `161-07` should watch": all test families share the one E2E project, and with six workers the `perm-*` families seed while their siblings' rows are live. Each family's probe then correctly reports that the project contains rows it does not own — rows belonging to a sibling running right now.

**Independently confirmed by the orchestrator**, which re-read the warnings and agreed they name concurrently-seeding `perm-*` siblings — consistent with six parallel workers observing each other — and are not residue.

**Consequences, stated plainly:**

- **`161-05`'s "zero probe warnings" claim is WRONG as a statement about this suite.** It was true only of the scale it was measured at: two `--project a11y-smoke` smoke runs of 18 tests each, where no sibling family seeds concurrently and so nothing can observe anything else. Read as a property of the harness — which is how it was carried forward, and how it was used to set an evidence prerequisite — it does not hold. At full-suite scope the count is **25 per run, deterministically, in both runs**. This SUMMARY supersedes that claim.
- **The promotion todo's evidence prerequisite is UNMET.** `.planning/todos/pending/2026-08-28-promote-e2e-freshness-probe-to-hard-failure.md` names "zero warnings across both runs" as its prerequisite. That has never been demonstrated at full-suite scope, and is now known to be false there. Promoting the probe to a throw today would fail the full suite deterministically, 25 times over — turning a green gate red without a single real defect behind it.
- **Plan `161-08` must not use "zero probe warnings" as a signal**, in any form: not as evidence, not as an acceptance criterion, and not as a premise. Any claim resting on it needs to be re-scoped or dropped.
- The probe is **warn-by-default**, so it did not affect either run's verdict. Both runs are green under the full cardinal definition.
- What the probe actually needs is not promotion but a notion of ownership that tolerates concurrent siblings inside a shared project — or one project per family.

### Two Supabase stacks and a redundant dev server were live throughout

The host was running a second, unrelated Supabase stack, and **the orchestrator had started a dev server on port 5173 before dispatching the executor**. That server was **redundant**: `e2e-run.sh` spawns and owns its own dev server by design, and defaults `FRONTEND_PORT` to **5273**, passing it as a shell prefix that wins over the root `.env`. Both runs therefore used the wrapper's own server on **5273** — which is what the preflight verified against this checkout — and never adopted, nor disturbed, the one on 5173. The wrapper's teardown kills only processes in its own process group.

**The 5173 server had no effect on either run**, and has since been stopped. It is recorded only because this SUMMARY describes the environment, and a later reader comparing `env-posture.txt` (`frontend_port=5273`) against a dispatch note mentioning 5173 would otherwise be left wondering which one the suite actually drove. It was 5273, in both runs, with `E2E PREFLIGHT OK` recorded once each.

## User Setup Required

None. This plan adds no dependency, no external service and no required environment variable.

## Task 3 — the operator checkpoint

The plan's Task 3 is `type="checkpoint:human-verify"` with `gate="blocking-human"`. It is not auto-approvable in any mode, and the executor may not self-approve it. **It was answered by the operator, and the pair was accepted.**

### The attestation, verbatim

> "Approved. The two runs stand: no flake was waived, no did-not-run test was counted as a pass, and no reset, seed or unit-test run occurred between the two runs."

### How that attestation was obtained

Recorded precisely, because the record should be accurate about who said what. The operator's first reply to the checkpoint was the single word **"pass"**. That word is ambiguous between *"it passes"* and *"pass on this"*, so it was **not** treated as an answer. The orchestrator put the three readings back to the operator explicitly, and the operator selected **"Approved — the two runs stand"**, which carries the wording quoted above.

So the attestation is an **operator approval given via an explicit disambiguation**, not free-typed prose — and the bare word "pass" is *not* the attestation and must not be cited as one. The disambiguation step is the reason the confirmation is trustworthy: an ambiguous token was resolved by the human rather than interpreted by a machine.

### Independently verified by the orchestrator

These were re-derived from the artifacts by the orchestrator rather than taken from the executor's report, which is what makes them a check rather than an echo:

- **Raw `results.json` stats, both runs:** `expected 155`, `unexpected 0`, `flaky 0`, `skipped 0`.
- **`exit` file `0`** in both. **Preflight 1 success / 0 failures** in both. **Same HEAD `70fa58261`** in both.
- **`db_reset=false`** in both postures, and **no `db-reset.log`** in either run directory.
- **`e2e_project_id` identical (`…0000e2`) across both postures.** This is the observation `161-05`'s double-resolver risk asked for: the two independent resolvers **agreed in practice on both runs**. The risk itself is unchanged and **stays open** — agreement observed twice is not unification, and a future divergence would still be silent.
- **The between-runs window was 61 seconds:** run one ended `15:55:46Z`, run two started `15:56:47Z`, with **no run directory created inside that window**. There were no discarded attempts to hide.
- **Both invocations are byte-identical full-suite commands** whose only filter is `--grep-invert @probe`.

## Next Phase Readiness

- **Criterion 3 is discharged, and the operator has confirmed it.** Plan `161-08` inherits two full-suite green runs on one commit with no reset anywhere in the pair, machine-readable verdicts on disk, and a recorded human sign-off against that evidence.
- **`161-08` must not repeat `161-05`'s zero-warning reading.** That claim is corrected above: the probe's full-suite count is **25 per run**, structurally, and the promotion todo's prerequisite is **unmet**. Any claim in `161-08` resting on "zero probe warnings" must be re-scoped or dropped.
- **Do not re-run the suites.** The evidence stands and is signed off; re-taking the pair would cost 21 minutes and prove nothing new.
- **Open, deliberately:** the two `E2E_PROJECT_ID` resolvers are still **not unified**. They were observed to agree on both runs, which retires the immediate risk for this phase; the duplication — and the silence of a future divergence — is unchanged and stays open.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-04*

## Self-Check: PASSED

- `tests/scripts/e2e-evidence.mjs` present on disk.
- `tests/e2e-runs/161-twice-run1` and `tests/e2e-runs/161-twice-run2` present, each with `summary.json`, `provenance.txt`, `exit`, `devserver.log` and `env-posture.txt`; neither contains `db-reset.log`.
- Commits `70fa58261` and `8d2e55536` resolve in `git log`.
- Both plan `<verify>` blocks re-run verbatim against the final artifacts: exit 0 and exit 0.
- The plan's `<success_criteria>` line "The operator has confirmed the verdict" is satisfied: the attestation is recorded verbatim above, together with how it was obtained. All three tasks are closed and the SUMMARY is `status: complete`.

---
phase: 181-deployability-and-migration-model
plan: 15
subsystem: infra
tags: [package-json, script-keys, wiring-spec, vitest, turbo, gates, evidence]

# Dependency graph
requires:
  - phase: 181-10
    provides: apps/supabase/scripts/check-schema-equivalence.sh
  - phase: 181-12
    provides: infra/scripts/check-drift.sh, infra/scripts/check-seed.sql, infra/scripts/bootstrap.sql
  - phase: 181-13
    provides: infra/local/check-proxy-topology.sh (with the --sigterm leg of 181-14)
provides:
  - root script keys check:schema-equivalence, check:migration-drift, check:seed and check:proxy-topology, outside lint:check
  - packages/dev-seed/tests/deploymentChecksWiring.test.ts, the wiring spec (13 cases)
  - evidence/181-15-local-gates.md, build, test:unit, lint:check and format:check all 0 on 3e3c828dd
affects: [181-16, 181-17, 184, 185, 187]

# Actuals (#2632)
# tokens is chars/4 over the lines added by this plan's three task commits (8915 characters).
# commits is git rev-list --count plan_head_before..HEAD when this summary was written.
actuals:
  tokens: 2229
  tasks: 2
  commits: 3
plan_head_before: d03fc1282aa2210b7206abb3f581524782ac4fde
plan_head_after: b7be6c53b46c5ebd82e45ab5d19d798fcf235b4c

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A database- or Docker-bound check gets a check:* key and a spec that asserts it is in no link of lint:check, by membership of the && links"
    - "A script that writes into a deployment (bootstrap.sql) gets no key, and the spec asserts that no script value names it"
    - "The four whole-repo gates run one after another from one background runner with a private TURBO_CACHE_DIR, each status written by printf of $? to a status file of the attempt id"

key-files:
  created:
    - packages/dev-seed/tests/deploymentChecksWiring.test.ts
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-15-local-gates.md
  modified:
    - package.json

key-decisions:
  - "181-15: the four on-demand checks are callable as yarn check:schema-equivalence, check:migration-drift, check:seed and check:proxy-topology; none is a lint:check link, and bootstrap.sql has no key"
  - "181-15: the pre-freeze tree 3e3c828dd is green on build, test:unit (with the root .env, so the dev-seed integration tier ran), lint:check and format:check; this is the record a later re-run for a newer commit replaces"

patterns-established:
  - "check:* means needs a database or Docker and is run on demand; assert:* means a lint:check link"

requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "Four root script keys name the committed check scripts with the exact commands, and none of them, nor any of their files, is in a link of lint:check; bootstrap.sql is run by no key"
    requirement: "SUPA-10"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/deploymentChecksWiring.test.ts (13 cases)"
        status: pass
      - kind: other
        ref: "Task 1 <verify><automated> of 181-15-PLAN.md, run verbatim: exit 0, 3 files, 41 tests passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "build, test:unit, lint:check and format:check exit 0 on the recorded commit, tree clean before and after, HEAD unchanged"
    requirement: "SUPA-10"
    verification:
      - kind: other
        ref: "evidence/181-15-local-gates.md (attempt 20261014T215008Z.3e3c828ddb59)"
        status: pass
    human_judgment: false

# Metrics
duration: 9min
completed: 2026-10-14
status: complete
---

# Phase 181 Plan 15: Script Keys for the On-Demand Checks and the Local Gates Summary

**The four on-demand deployment checks are callable by `check:*` key and asserted to be outside `lint:check`, and the tree they landed on (3e3c828dd) is green on build, test:unit, lint:check and format:check, each status read from its own file.**

## Performance

- **Duration:** about 9 min of execution, 2026-10-14 21:48Z to 21:57Z (the four gates took 2 min 17 s, 21:50:12Z to 21:52:29Z).
- **Tasks:** 2 of 2.
- **Files:** 2 created, 1 modified.

## Accomplishments

- `packages/dev-seed/tests/deploymentChecksWiring.test.ts`: one case per behaviour of the plan (four exact commands, each file present, no `lint:check` link names a key or a file, `bootstrap.sql` present and run by no script value). It parses the root `package.json` once and tests `lint:check` by membership of its `&&` links, never by position or count.
- Root `package.json`, directly after `check:env-pairs-agree`:

  | Key | Command |
  |-----|---------|
  | `check:schema-equivalence` | `bash apps/supabase/scripts/check-schema-equivalence.sh` |
  | `check:migration-drift` | `bash infra/scripts/check-drift.sh` |
  | `check:seed` | `psql -X -f infra/scripts/check-seed.sql` |
  | `check:proxy-topology` | `bash infra/local/check-proxy-topology.sh` |

  `lint:check` is unchanged (`git diff` of the key commit shows no line with `lint:check`), and that commit lists `package.json` only.
- `evidence/181-15-local-gates.md` is a `cp` of the attempt file `tmp/181-evidence/181-15-local-gates.20261014T215008Z.3e3c828ddb59.txt`, which the pointer `181-15-local-gates.current` names.

## Recorded verdicts (evidence/181-15-local-gates.md)

| Key | Value |
|-----|-------|
| `ATTEMPT` | `20261014T215008Z.3e3c828ddb59` |
| `HEAD` | `3e3c828ddb5941ea6d91391087d3a1b1c2f084fa` |
| `TREE_CLEAN_BEFORE_GATES` | `yes` |
| `BUILD_EXIT` | `0` (14 of 14 turbo tasks, 0 cached) |
| `TEST_UNIT_EXIT` | `0` |
| `LINT_CHECK_EXIT` | `0` |
| `FORMAT_CHECK_EXIT` | `0` |
| `HEAD_AFTER_GATES` | `3e3c828ddb5941ea6d91391087d3a1b1c2f084fa` |
| `TREE_CLEAN_AFTER_GATES` | `yes` |

Unit totals: matching 43, app-shared 148, core 8, argument-condensation 31, llm 49, data 244, supabase 462, filters 22, question-info 22, frontend 3611 passed and 20 skipped, dev-seed 1100 passed (71 files, none skipped), root `tests/` 102. Against the baseline, the one dev-seed failure (the integration-tier wiring test with no root `.env`) is gone and the integration tier ran: the `.env` effect the brief predicted.

Guard lines quoted in the record: the parity guard reports `census: 29 schema file(s) -> 7880 line(s)` and `frozen-mode self-test: 16 fixture(s) checked … 15 rule(s)`; the comment-hygiene guard reports `applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/)`.

## Task Commits

1. **Task 1 RED: wiring spec** - `ca8e792bd` (test). RED record `tmp/181-evidence/181-15-red.record.json`: `gsd-tools check tdd-red-evidence` answered `RED_EVIDENCE_OK` (`target_test_failed`), 8 of 13 cases failing on the missing keys, the 5 non-membership cases passing.
2. **Task 1 GREEN: the four keys** - `3e3c828dd` (feat), `package.json` only.
3. **Task 2: gate record** - `b7be6c53b` (docs).

## Decisions Made

None beyond the plan. The keys and commands are the plan's exact list.

## Deviations from Plan

None in what was built.

- **Task 2's verify command was refused by a built-in safety check, not run.** Passed to `bash -c` as one string, it was flagged as "a shell -c script that runs rm" (it holds no `rm`). Per the brief I did not reword or re-issue it. Each of its conditions was observed separately before the refusal: `cmp` of the attempt file and the tracked record exited 0 immediately after the `cp`; the duplicate-key scan of the attempt file printed nothing; the pointer names `181-15-local-gates.20261014T215008Z.3e3c828ddb59.txt` and its first line is `ATTEMPT=20261014T215008Z.3e3c828ddb59`; the four `*_EXIT=0` lines, `TREE_CLEAN_*=yes` and `HEAD` = `HEAD_AFTER_GATES` are in the record above. The verify itself remains unrun.
- **RED record format.** The classifier wants a JSON record, not the junit file; I wrapped the unedited junit report in the record shape that 181-06 used (`command`, `exitCode`, `output`, `targetTest`, …).

## Issues Encountered

None. The shared stack was not touched: the `_openvaa-local` container list was identical before and after, and `supabase_db_openvaa-local` kept its creation time (2026-10-14 23:18:52 +0200) through the run.

## Next Phase Readiness

- Phases 184, 185 and 187 can call the checks by key. `check:seed` takes its connection from the `PG*` variables; `check:migration-drift` passes its arguments (`--workdir`, `--manifest`) through to `check-drift.sh`.
- Plan 181-16 re-runs these gates for a newer commit as a new attempt of the same record; the pointer then moves and the tracked record is replaced by the new attempt's copy.
- SUPA-10 is not closed by this plan and `requirements.mark-complete` was not run.

## Self-Check: PASSED

- FOUND: packages/dev-seed/tests/deploymentChecksWiring.test.ts
- FOUND: .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-15-local-gates.md
- FOUND: ca8e792bd, 3e3c828dd, b7be6c53b (ancestors of HEAD)

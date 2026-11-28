---
phase: 187-deploy-pipeline
plan: "04"
subsystem: infra
tags: [push-migrations, confirmed-ref, github-environment, staging, vitest, stubs]

requires:
  - phase: 185
    provides: infra/scripts/push-migrations.sh with its refusals, the /dev/tty confirmation, the drift check and exit codes 0-4 and 130
provides:
  - "Option `--confirmed-ref <ref>` of push-migrations.sh: the staging environment's approval stands in for the typed ref, accepted only when it equals `--ref`, GITHUB_ACTIONS=true and OPENVAA_DEPLOY_ENVIRONMENT=staging"
  - "Result line `push_confirmation=environment|terminal`, printed after the `push_pending=` lines and before `push_status=`"
  - "infra/scripts/push-migrations.test.ts: seven cases against a copy of the script in a temporary repository root with a stub CLI and drift check, started in a new session with no terminal"
  - "Runbook Steps 16 and 17 open with what the gated staging job does in their place, and name the two staging environment secrets"
affects: [187-05..13 deploy workflow migrations step, 187-14..25 hosted pipeline observation of PIPE-06]

actuals:
  tokens: 5400
  tasks: 2
  commits: 3
plan_head_before: a099b5f49bbd396296f9803d2fe7ba10aded2320
plan_head_after: 9454afaa6f1b69f1ac2f9513bf53abe7a692278d

tech-stack:
  added: []
  patterns:
    - "A script test that copies the real script into a mkdtemp repository root, so its REPO_ROOT-relative CLI and drift check resolve to stubs"
    - "spawn with detached: true to run a script in a new session with no controlling terminal"

key-files:
  created:
    - infra/scripts/push-migrations.test.ts
  modified:
    - infra/scripts/push-migrations.sh
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "push-migrations.sh --confirmed-ref is refused (exit 2, before the CLI) unless it equals --ref, GITHUB_ACTIONS=true and OPENVAA_DEPLOY_ENVIRONMENT=staging (constant CONFIRMING_ENVIRONMENT); GITHUB_ENVIRONMENT is never read (C-04 as amended)"
  - "The typed path now prints push_confirmation=terminal after a correct answer, so both paths name how the push was confirmed"
  - "An empty --confirmed-ref value is a usage error (exit 2), never a silent fall-back to the typed path"

patterns-established:
  - "Environment-scoped evidence of the gate: a variable that resolves only in a job of the staging environment, checked together with GITHUB_ACTIONS and an equality with --ref"

requirements-completed: []

coverage:
  - id: D1
    description: "An accepted --confirmed-ref pushes without a terminal, prints push_pending, push_up_to_date=no, push_confirmation=environment, push_status=0, drift_status=0 in that order, and the stub CLI saw `db push --linked --yes`"
    requirement: PIPE-06
    verification:
      - kind: unit
        ref: "infra/scripts/push-migrations.test.ts#pushes without a terminal when the ref is confirmed in a staging Actions job, and runs the drift check"
        status: pass
    human_judgment: false
  - id: D2
    description: "A mismatched ref, GITHUB_ACTIONS unset, OPENVAA_DEPLOY_ENVIRONMENT=production and an absent value each exit 2 with the CLI never called"
    requirement: PIPE-06
    verification:
      - kind: unit
        ref: "infra/scripts/push-migrations.test.ts (refuses ... differs, outside a GitHub Actions job, another environment; exits 2 when --confirmed-ref has no value)"
        status: pass
      - kind: other
        ref: "bash infra/scripts/push-migrations.sh --ref abcdefghijklmnopqrst --workdir /nonexistent --confirmed-ref abcdefghijklmnopqrsu -> s=2, the mismatch message"
        status: pass
    human_judgment: false
  - id: D3
    description: "Up to date with the flag accepted pushes nothing; without the flag and with no terminal the old refusal stands"
    requirement: PIPE-06
    verification:
      - kind: unit
        ref: "infra/scripts/push-migrations.test.ts (pushes nothing when up to date; still refuses a push with no terminal when the ref is not confirmed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The gated staging job pushes migrations through the script on a real runner"
    requirement: PIPE-06
    verification: []
    human_judgment: true
    rationale: "No hosted project or runner is reached in plans 01-13; the hosted run is observed in plans 187-14..25"

duration: 3min
completed: 2026-11-15
status: complete
---

# Phase 187 Plan 04: Confirmed push for the gated staging job Summary

Vitest, `node_modules/.bin/vitest run --config infra/vitest.config.ts push-migrations`, 7 passed (7):

1. pushes without a terminal when the ref is confirmed in a staging Actions job, and runs the drift check
2. refuses a confirmed ref that differs from --ref before the CLI runs
3. refuses a confirmed ref outside a GitHub Actions job before the CLI runs
4. refuses a confirmed ref in a job of another environment before the CLI runs
5. pushes nothing when the database is up to date and the ref is confirmed
6. still refuses a push with no terminal when the ref is not confirmed
7. exits 2 when --confirmed-ref has no value

**`push-migrations.sh --confirmed-ref <ref>` lets the gated `staging` job push migrations with no terminal, the environment's approval standing in for the typed ref. It is accepted only when it equals `--ref`, `GITHUB_ACTIONS=true` and `OPENVAA_DEPLOY_ENVIRONMENT=staging`. Every other combination exits 2 before the CLI runs, and the drift check still decides the status.**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-11-15T01:59:50Z
- **Completed:** 2026-11-15T02:02:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Three refusals directly after the `--ref` form check, each `fatal "...; nothing was pushed" 2`, before any CLI or drift-check call: the value differs from `--ref`, `GITHUB_ACTIONS` is not `true`, `OPENVAA_DEPLOY_ENVIRONMENT` is not `staging`. The last one's message names `DEPLOY_ENVIRONMENT` and the workflow's `OPENVAA_DEPLOY_ENVIRONMENT`.
- Step 4 skips the `/dev/tty` probe, the question and the read when the ref is confirmed, prints `push_confirmation=environment` and pushes. The typed path prints `push_confirmation=terminal` after a correct answer. Step 5, the drift check, is unchanged and runs after both.
- The test copies the real script into a `mkdtemp` repository root, with a stub `node_modules/.bin/supabase` that logs its arguments to `cli.log` and answers the dry run per `STUB_DRY`, a stub `check-drift.sh` that exits `STUB_DRIFT_STATUS`, and a linked `work/` directory. The script is spawned `detached: true` (a new session, no terminal), with an environment holding only `PATH`, `HOME`, `TMPDIR`, `SUPABASE_DB_PASSWORD=stand-in` and the case's variables. The root is removed after each case.
- The header gives step 4 the confirmed form, Usage the workflow form, Options `--confirmed-ref`, Output `push_confirmation=`, Prerequisite 1 the three conditions and exit code 2 the three refusals. Runbook Steps 16 and 17 open with the pipeline paragraph and the sentence about the environment secrets.

## Task Commits

1. **Task 1 RED: failing test** - `ce3b98913` (test)
2. **Task 1 GREEN: the flag and its refusals** - `969c7246f` (feat)
3. **Task 2: header and runbook** - `9454afaa6` (docs)

## TDD Gate Compliance

- **RED:** `node_modules/.bin/vitest run --config infra/vitest.config.ts push-migrations --reporter=tap-flat -t "pushes without a terminal"` exited 1. The target test, "pushes without a terminal when the ref is confirmed in a staging Actions job, and runs the drift check", failed on its assertion (`expected false to be true`: the ordered result lines were absent). `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the failure has the intended cause. The unchanged script refused `--confirmed-ref` as `unknown argument` and exited 2, so no result line was printed. A first, unfiltered run of all seven cases failed 6 and passed 1. The case that passed is the no-flag, no-terminal case, which guards existing behaviour. The classifier refused that run's report as `invalid_record`, because vitest's TAP reporter writes the multi-line stderr of a string assertion as raw lines. That is why the record comes from the run filtered to the target.
- **GREEN:** `969c7246f`, 7 passed (7).
- **REFACTOR:** none needed.

## Files Created/Modified

- `infra/scripts/push-migrations.test.ts`: the seven cases against stubs
- `infra/scripts/push-migrations.sh`: `CONFIRMED_REF`, `CONFIRMING_ENVIRONMENT`, the `--confirmed-ref` arm, three refusals, the confirmed branch of step 4, `push_confirmation=`, and the header
- `infra/envs/staging/supabase/README.md`: the opening paragraphs of Steps 16 and 17, and `s16_push_confirmation=terminal` added to Step 16's list of the lines it prints

## Decisions Made

- An empty `--confirmed-ref ''` is a usage error, not an unset flag. Otherwise an empty value would quietly fall back to the typed path. That path refuses on a runner anyway, but with a misleading message.
- The typed path prints `push_confirmation=terminal`, as the plan's action says, so Step 16's list of printed lines now names it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Step 16's list of printed lines updated for `push_confirmation=terminal`**
- **Found during:** Task 2
- **Issue:** The typed path now prints a new line, and Step 16 item 1 lists the lines "in this order". Left alone, that list would be wrong.
- **Fix:** Added `s16_push_confirmation=terminal` before `s16_push_status=<n>` ("when a push ran"). This is inside Step 16; no other step changed.
- **Files modified:** infra/envs/staging/supabase/README.md
- **Committed in:** 9454afaa6

**2. [Rule 2 - Correctness] Empty `--confirmed-ref` value refused**
- **Found during:** Task 1
- **Issue:** `require_value` counts arguments only, so `--confirmed-ref ''` would have read as no flag.
- **Fix:** `usage_error "--confirmed-ref requires a value"`. The no-value case asserts this message.
- **Committed in:** 969c7246f

---

**Total deviations:** 2 auto-fixed (Rule 2). **Impact:** both keep the contract exact. No scope creep.

## Issues Encountered

- Vitest's TAP reporter emits malformed TAP when a string assertion's actual value spans several lines, so the RED evidence was recorded from a run filtered to the target test (see TDD Gate Compliance).

## Requirements

PIPE-06 (script half) is covered by the seven cases. As the operator notes direct, REQUIREMENTS.md was not changed: PIPE-06 is closed only when the hosted pipeline is observed in plans 187-14..25.

## User Setup Required

None. The `staging` environment's `DEPLOY_ENVIRONMENT` variable and its two secrets are created in the operator-checkpoint plans.

## Next Phase Readiness

The deploy workflow's migrations step can call `infra/scripts/push-migrations.sh --ref <ref> --workdir <linked dir> --confirmed-ref <ref>` with `OPENVAA_DEPLOY_ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}`. It should branch on the exit status (0-4, 130), read on the next line.

## Self-Check: PASSED

All three files exist; commits ce3b98913, 969c7246f and 9454afaa6 are ancestors of HEAD.

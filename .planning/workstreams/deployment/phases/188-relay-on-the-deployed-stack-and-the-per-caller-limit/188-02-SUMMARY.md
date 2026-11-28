---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "02"
subsystem: infra
tags: [terraform, ecs, stop-timeout, shutdown-flush]

requires:
  - phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
    provides: 188-01, the flush interval in the task environment (both roots' tfvars touched before this plan)
  - phase: 187-deploy-pipeline
    provides: the frontend-service module with stop_timeout_seconds (default 30, range 2..120) and both AWS roots
provides:
  - root variable stop_timeout_seconds (number, default 30) in infra/envs/staging/aws and infra/envs/example/aws, passed to module "frontend"
  - stop_timeout_seconds = 40 in both roots' terraform.tfvars (SHUTDOWN_TIMEOUT 25 + 10-second forward + 5)
  - the module variable's description stating the bound
  - module output container_stop_timeout_seconds, read from the task definition's container definition
  - the example root's offline plan test asserting it is 40
affects: [188-10]

actuals:
  tokens: 1600
  tasks: 2
  commits: 2
plan_head_before: 216455ae76a1ceb8e6c6a862ee527cae1ac2e0cc
plan_head_after: 827344d84b983dcb2d14065028868e72f06ca9fa

tech-stack:
  added: []
  patterns:
    - "A root test checks a value inside the module through a module output that reads it back from the resource, since a root test cannot reference a module's resources"

key-files:
  created: []
  modified:
    - infra/modules/frontend-service/variables.tf
    - infra/modules/frontend-service/outputs.tf
    - infra/envs/staging/aws/variables.tf
    - infra/envs/staging/aws/main.tf
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/example/aws/variables.tf
    - infra/envs/example/aws/main.tf
    - infra/envs/example/aws/terraform.tfvars
    - infra/envs/example/aws/tests/plan.tftest.hcl

key-decisions:
  - "The example root's stop-timeout assertion reads a new module output, container_stop_timeout_seconds, decoded from the task definition's container_definitions, because a root's terraform test cannot reference module.frontend.aws_ecs_task_definition.app"
  - "The example root takes the same 40 as staging (research open question 5, recommendation taken)"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "The staging root declares stop_timeout_seconds, passes it to module \"frontend\" and sets 40 in its tfvars; the module variable's description states the bound"
    requirement: RELAY-04
    verification:
      - kind: other
        ref: "terraform -chdir=infra/envs/staging/aws validate -no-color (Success! The configuration is valid.); grep '^stop_timeout_seconds *= *40$' staging tfvars = 1; grep 'stop_timeout_seconds *= *var.stop_timeout_seconds' staging main.tf = 1"
        status: pass
      - kind: other
        ref: "terraform -chdir=infra/modules/frontend-service test -no-color (Success! 33 passed, 0 failed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The example root carries the same variable, pass-through and value, and its offline plan test asserts the container definition's stopTimeout is 40"
    requirement: RELAY-04
    verification:
      - kind: other
        ref: "terraform -chdir=infra/envs/example/aws test -no-color (Success! 1 passed, 0 failed); red at stop_timeout_seconds = 30 (Failure! 0 passed, 1 failed, the stopTimeout message printed)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-18
status: complete
---

# Phase 188 Plan 02: The stop timeout of 40 from both AWS roots to the container Summary

**Both AWS roots now declare `stop_timeout_seconds` and pass it to the frontend module. Their tfvars set it to 40, which is `SHUTDOWN_TIMEOUT` 25 plus the 10-second analytics forward plus 5. The module variable's description states that bound, and the example root's offline plan test checks that the container definition's `stopTimeout` is 40.**

## Performance

- **Duration:** about 6 min (commits at 18:13:41Z and 18:15:23Z, summary at about 18:17Z)
- **Tasks:** 2 (tracer, auto)
- **Files modified:** 9

## Accomplishments

- `infra/modules/frontend-service/variables.tf`: the description of `stop_timeout_seconds` now says it must exceed `SHUTDOWN_TIMEOUT` by at least the 10-second forward timeout plus a 5-second margin. With that, a shutdown flush of up to one slice reaches a responsive PostHog before the kill. Because slices are sent one after another, a full queue against an unresponsive PostHog can still be cut off. The type, the default of 30 and the 2..120 validation are unchanged.
- Staging and example roots: `variable "stop_timeout_seconds"` (number, default 30, its description pointing to the module's bound), `stop_timeout_seconds = var.stop_timeout_seconds` in `module "frontend"` placed after `task_ceiling`, and `stop_timeout_seconds = 40` in tfvars after the sizing block, under one comment line.
- `infra/modules/frontend-service/outputs.tf`: a new output, `container_stop_timeout_seconds`, which is `jsondecode(aws_ecs_task_definition.app.container_definitions)[0].stopTimeout`.
- `infra/envs/example/aws/tests/plan.tftest.hcl`: `example_root_plans_production_shaped` now asserts `module.frontend.container_stop_timeout_seconds == 40`, and its error message names `stop_timeout_seconds` in terraform.tfvars.

## Task Commits

1. **Task 1 (tracer):** `c0d32305d` feat(188-02): pass stop_timeout_seconds through the staging root and set it to 40
2. **Task 2:** `827344d84` feat(188-02): the example root takes the same stop timeout, asserted offline

## Verification

- Task 1 `<verify>`: module `init` exit 0. Module `test` printed `Success! 33 passed, 0 failed.` Staging `init -backend=false -lockfile=readonly` exit 0 and `validate` printed `Success! The configuration is valid.` `fmt -check -recursive` printed nothing, exit 0.
- Tracer gate: auto mode is off and `<verify>` is automated-only, so it was re-run after Task 2's module output change. The module test passed 33/0, staging validate passed and fmt was clean.
- Task 2 `<verify>`: example `init` exit 0, `validate` valid, `test` printed `Success! 1 passed, 0 failed.`, fmt clean.
- Red proof: with the example tfvars temporarily set to 30, the test failed (`Failure! 0 passed, 1 failed`, showing "The container definition's stopTimeout must be 40 ..."). The file was then restored from a copy.
- Acceptance criteria: the staging tfvars match `^stop_timeout_seconds *= *40$` 1 time, staging main.tf has the pass-through 1 time, the example tfvars match 1 time, and the example test has `stopTimeout` 1 time. All PASS.
- Every status was read on its own line, not through a pipe. No root was applied and no AWS call was made.
- **E2E:** no targeted run applies. The plan changes only Terraform, which no E2E project drives, and it adds, renames or changes no spec or fixture. The project test-count delta against the last full run is 0 for every project, and no title is pinned.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A module output so the root test can reach the container definition**
- **Found during:** Task 2
- **Issue:** The assertion as planned, on `module.frontend.aws_ecs_task_definition.app.container_definitions`, failed with `Unsupported attribute`. A root's terraform test can reach only the module's outputs.
- **Fix:** a module output, `container_stop_timeout_seconds`, read back from the task definition's container definition. The assertion uses it, so it still checks the value that reached the container definition, not just the root variable.
- **Files modified:** infra/modules/frontend-service/outputs.tf (outside the plan's file list)
- **Verification:** example test green at 40 and red at 30; module test still 33/0
- **Commit:** 827344d84

**2. [Rule 3 - Blocking] A scratch `TF_DATA_DIR` for the roots' offline init**
- **Found during:** Task 1 verify
- **Issue:** The staging root's checked-out `.terraform/terraform.tfstate` records the S3 backend. So `terraform init -backend=false` still looked for AWS credentials and failed with "No valid credential sources found".
- **Fix:** both roots' `init`, `validate` and `test` were run with `TF_DATA_DIR` set to a directory in the session scratchpad. The operator's `.terraform` directories were left untouched, and no AWS call was made.
- **Commit:** none (it only changes how the gate runs)

**Total deviations:** 2 auto-fixed (both blocking). **Impact on scope:** one extra module output, which shows up as a new output in the next staging plan (188-10). `SHUTDOWN_TIMEOUT`, the module default of 30 and the validation range are unchanged, so the prohibition holds.

## Issues Encountered

None beyond the deviations.

## Known Stubs

None.

## Next Phase Readiness

- Nothing applied. The 40-second stop timeout and the new output reach staging with plan 188-10's pipeline run.
- RELAY-04 stays open, per the dispatch, until the deployed plans and the phase verifier close it.

## Self-Check: PASSED

- All 9 modified files exist, and `git status` shows no stray changes outside `.planning/`.
- Commits `c0d32305d` and `827344d84` are ancestors of HEAD, and `git rev-list --count 216455ae7..HEAD` = 2.

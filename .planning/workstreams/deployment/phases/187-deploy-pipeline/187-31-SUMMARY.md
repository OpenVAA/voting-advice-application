---
requirements-completed: [PIPE-09]   # marked at the v2.17 milestone audit (2026-11-21) from the phase VERIFICATION.md
phase: 187-deploy-pipeline
plan: "31"
subsystem: infra
status: complete
tags: [deploy-workflow, ecs-rollout, stable-check, workflow-guards, deploy-evidence, gap-closure]
requires:
  - 187-30 (the last rebuild of the evidence commits and the gate runner)
  - 187-21 attempt 3 (run 44258126898, approved, red at the stable step, staging deployed)
provides:
  - the stable step of deploy.yml reads the rollout up to 60 times, 15 s apart, and prints stable_poll=<n> before each read
  - five cases of the stable step under bash -e with stub terraform, aws and sleep, in infra/scripts/workflow-errexit.test.ts
  - the rule rollout-poll (rolloutPollViolations) in infra/scripts/deploy-workflow.test.ts, with three red copies
  - attempt 3 settled read-only, A3_CAUSE_STATUS=diagnosis-confirmed, its 37 current lines superseded
  - rebuilt evidence commits refs/evidence/187/green 331b5db28 and refs/evidence/187/red f4a440553
affects:
  - 187-21 (attempt 4 pushes 331b5db28 as deploy-evidence/187-green-4)
tech-stack:
  added: []
  patterns:
    - "A rollout check polls a bounded number of reads with a fixed sleep, so a stub sleep tests it without waiting"
    - "Only the one state that can still become a pass (IN_PROGRESS on the applied task definition) is read again; every other outcome decides at once"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-31-stable-poll.md
  modified:
    - .github/workflows/deploy.yml
    - infra/scripts/workflow-errexit.test.ts
    - infra/scripts/deploy-workflow.test.ts
    - infra/README.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-21-green-run.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
decisions:
  - "The stable step reads again only while the primary deployment on the applied task definition is IN_PROGRESS, at most 60 reads 15 s apart (900 s); every C-06 pass condition is unchanged"
  - "aws ecs wait services-stable was not used: it never reads rolloutState, and at its limit it prints none of the step's lines"
  - "A count of reads with a fixed sleep rather than a wall-clock bound, so the harness can run the limit against a stub sleep"
metrics:
  duration: 15min
  completed: 2026-11-18
actuals:
  tokens: 29379
  tasks: 4
  commits: 4
plan_head_before: 9c6dfd41a96b036acbdecd13f3ae681a885be2d7
plan_head_after: aca8d26fc6c25cb1298d731bb5d0882ca9608dd2
---

# Phase 187 Plan 31: The stable step waits for the rollout it checks Summary

```
A3_CAUSE_STATUS=diagnosis-confirmed
STABLE_POLL_RED_AT_START=7
STABLE_LIMIT_SECONDS=900
GREEN_COMMIT=331b5db28058a1f8bc4ef88a3841080a4610efa2
READY_FOR_187_21_ATTEMPT_4=yes
```

The deploy job's step `Check the rollout is stable` used to read `describe-services` once. It now reads it in a loop, up to 60 times, 15 s apart. Only one state is read again: `IN_PROGRESS` on the applied task definition. Every other outcome decides at once, under the unchanged C-06 conditions. A rollout still `IN_PROGRESS` at the 60th read fails with its own error line. The step is proven under the runner's `bash -e` against stub `terraform`, `aws` and `sleep` commands. A new rule, `rollout-poll`, bounds the limit to between 600 s and half the job's timeout.

## What was done

- **Task 1 (`d4e3dbadc`): attempt 3 settled read-only.**
  - The orchestrator's reads were copied, and their values equal the plan's. One GET of the job gave the stable step's start and end times: 07:31:06Z to 07:31:13Z.
  - The `openvaa-admin` session was valid, so the optional read-only re-read was made. `running-image-digest.sh` shows `:7`, reference `digest`, digest `sha256:ccfaa586…`, which equals `A3_BUILD_DIGEST`. One `describe-services` showed one deployment, `COMPLETED`.
  - The service events date the change directly. `deployment completed` was logged at 07:31:38.716Z and `reached a steady state` at 07:31:38.717Z, 25 to 32 s after the single read.
  - Attempt 3's 37 current lines were renamed `*_SUPERSEDED=`, as were `A3_RUNNING_IMAGE_READ` and `A3_CAUSE_STATUS`. No value was changed.
- **Task 2 (`d6100b0a6`): the fix, red first.**
  - On HEAD's step, 7 cases failed. Case (a) failed on its exit status, 1 for 0, which reproduces attempt 3.
  - After the fix, 131 tests passed. With the three red copies of `rollout-poll` added, 134 passed.
  - Case (c) ran its 60 reads against the stub `sleep` in 1.5 s.
- **Task 3 (`0482300b3`): README, survey and gates.**
  - README: item 6, the `stable` row of § Reading a red run, and the "Workflow guards" row.
  - The survey recorded six `SINGLE_READ=` lines. Only the stable step waits on a transition, so `SINGLE_READ_FIX_NEEDED_ELSEWHERE=no`.
  - All five gates exit 0: `lint:check`, `format:check`, `typecheck`, `test:unit`, and `lint:workflows` (actionlint with shellcheck, no pull). The infra vitest also passed: 13 files, 389 tests.
- **Task 4 (`aca8d26fc`): evidence commits rebuilt.**
  - Green `331b5db28` built in 99 s.
  - Red `f4a440553` fails at `shared 2/2 RUN yarn build` on `Failed: @openvaa/frontend#build`, naming `does-not-exist-187-red`, on the first attempt.
  - The stack was stopped for the builds and started again afterwards, and the builder cache was pruned (4.9 GB).
  - The E2E-tree gate holds against `450632a5c`.
  - The green commit differs from attempt 3's `9d6a55ca3` only in the four fix paths. No migration changed.

## Deviations from Plan

### 1. [Rule 1 - Test accuracy] `STABLE_POLL_RED_AT_START=7`, not 6

- **Found during:** Task 2, the red run.
- **Issue:** The plan's step 3 extends the existing case "checks that the primary deployment runs the applied task definition, completed, at the floor" with `echo "stable_poll=`. HEAD's step cannot pass that, so the extended case is red on HEAD as well. That makes 7 failing cases: the five behaviour cases, the rule's real-step case and the extended case. The plan counted 6 and said "only they".
- **Fix:** None needed. I recorded 7 and named the seventh in E. The verify requires only a count above 0.

### 2. [Minor] Case (a) asserts the exit status first

- **Found during:** Task 2, the first red run.
- **Issue:** Case (a) read `interval=` before asserting anything, so on HEAD it failed by throwing, not on its exit status. `STABLE_RED_REPRODUCES_A3=yes` needs the exit status.
- **Fix:** Case (a) now runs the step and asserts `status` 0 first, then reads `interval`. I ran the red run again, and case (a) then failed with `expected 1 to be +0`. Only that second red run is recorded.

### 3. [Minor] The rule's red copies were set aside during the red run

- They were written with the rule in step 3. I removed them before the red run, because `mutate` throws on HEAD's text, which has no `polls=60`. I added them back after the first green run, as plan step 6 orders.

### 4. [Minor] eslint `func-style` in the rule

- An inline arrow helper was rewritten as the top-level function `literalNumber`, before the commit.

### 5. [Minor] Two short commands ran in the foreground

- `make-commits.sh` (under a second) and the full infra vitest (about 15 s) ran in the foreground, with their statuses written to `.status` files.

## Authentication gates

None. `gh` and the `openvaa-admin` session were both valid, and I did not sign in.

## Known Stubs

None.

## Not done, by design

- I pushed nothing, opened no pull request, approved nothing, and re-ran nothing. I wrote nothing hosted. The only remote reads were Task 1's one `gh api` GET and the read-only re-read (`sts get-caller-identity`, `running-image-digest.sh`, one `describe-services`).
- No E2E run: no project drives a changed file.
- `deploy-workflow.test.ts` keeps the one standalone strict `tsc` error it had at HEAD (TS2638 in "has no switch, input or variable that skips the contestant spec"), left unfixed as planned. `workflow-errexit.test.ts` has none.
- `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` stays open, and it is now live on staging.
- STATE.md and ROADMAP.md were not updated, per the orchestrator's instruction.

## Self-Check: PASSED

- FOUND: evidence/187-31-stable-poll.md, .github/workflows/deploy.yml, infra/scripts/workflow-errexit.test.ts, infra/scripts/deploy-workflow.test.ts, infra/README.md
- FOUND commits: d4e3dbadc, d6100b0a6, 0482300b3, aca8d26fc (`git rev-list --count 9c6dfd41a..HEAD` = 4)
- FOUND refs: refs/evidence/187/green = 331b5db28, refs/evidence/187/red = f4a440553, each held by that ref alone
- The plan's four `<automated>` verifies exit 0 on the final tree (`tmp/187-31/verify/v1.sh` to `v4.sh`)

# 187-31 evidence: the stable step waits for the rollout

This file holds the record of plan 187-31: the deploy job's stable step now waits, within a bound, for the rollout it checks to complete, and the evidence commits are rebuilt for plan 187-21's attempt 4.

## Task 1: attempt 3, settled

```
T1_HEAD_AT_START=9c6dfd41a96b036acbdecd13f3ae681a885be2d7
```

- Attempt 3 of plan 187-21 is recorded settled in `evidence/187-21-green-run.md` § Attempt 3, settled read-only: `A3_CAUSE_STATUS=diagnosis-confirmed` there, the rollout `COMPLETED` at `07:31:38.687Z`, 25 to 32 s after the stable step's single read, and the image running by digest `sha256:ccfaa586…`, equal to the build's.
- The orchestrator's read file was copied to `tmp/187-31/a3/aws-reads.txt`; its values equal the plan's. The optional re-read was made (the `openvaa-admin` session was valid) and agrees.
- The 37 current lines of § Task 1, attempt 3 and of the first two fences of § Task 3, attempt 3 are renamed `*_SUPERSEDED=` with their values unchanged, as are `A3_RUNNING_IMAGE_READ` and `A3_CAUSE_STATUS` of the `A3_` fence.

## Task 2: the stable step under bash -e

```
STABLE_POLL_BASE_HEAD=d4e3dbadc1e1fa8bdb45f6280f31de9e0979ff5f
STABLE_POLL_RED_AT_START=7
STABLE_RED_REPRODUCES_A3=yes
STABLE_POLL_GREEN=yes
STABLE_POLL_CASES=5
ROLLOUT_POLL_RULE_RED_COPIES=3
STABLE_POLLS=60
STABLE_INTERVAL_SECONDS=15
STABLE_LIMIT_SECONDS=900
STABLE_CASE_LITERALS_REPLACED=none
```

- **Red first.** `node_modules/.bin/vitest run --config infra/vitest.config.ts --reporter=verbose workflow-errexit deploy-workflow` on the unchanged workflow exited 1 (`tmp/187-31/t2-red.status`), 7 failed and 84 passed. The failing cases:
  - `workflow-errexit.test.ts` > the stable step of deploy.yml under bash -e > reads again while the rollout is IN_PROGRESS and passes once it is COMPLETED at the floor: `expected 1 to be +0`, on its exit status, as the stable step of run 44258126898 exited 1 at its first `IN_PROGRESS` read (`STABLE_RED_REPRODUCES_A3=yes`);
  - … > fails with its error line when the rollout goes from IN_PROGRESS to FAILED;
  - … > fails with its own error line at the last read when the rollout stays IN_PROGRESS;
  - … > fails at the first read, without waiting, when the primary deployment runs another task definition;
  - … > fails at the first read, without waiting, when a completed rollout runs fewer tasks than the floor;
  - `deploy-workflow.test.ts` > the stages of the deploy job > reads the rollout in a loop with a sleep, its limit between 600 s and half the job's timeout: `rollout-poll: no line polls=<digits>`, `rollout-poll: no line interval=<digits>`, `rollout-poll: no aws ecs describe-services inside a while or for loop`;
  - `deploy-workflow.test.ts` > the stages of the deploy job > checks that the primary deployment runs the applied task definition, completed, at the floor: the extended case, red on its new `echo "stable_poll=` literal. The plan expected 6 (the five cases and the rule's real-step case); the seventh is this extended case, which HEAD's step cannot pass because it prints no `stable_poll=` line.
  - Cases (d) and (e) failed on HEAD only on the missing `stable_poll=` line; HEAD's step exits 1 at once in both, as the loop does.
- **The fix.** In the step `Check the rollout is stable` only: `polls=60` and `interval=15` after `set -uo pipefail`, then a `while` loop over `poll` that prints `stable_poll=$poll`, reads `describe-services` with `describe_exit=0` and `|| describe_exit=$?`, keeps the four `jq` reads, the `matches` test and the four echo lines, sleeps `interval` seconds and reads again while the applied deployment is `IN_PROGRESS` (no sleep after the last read), and otherwise lets the unchanged C-06 condition decide, exit 1 with its error line or exit 0. After the loop, `::error::The primary deployment's rollout is still IN_PROGRESS after $polls reads, $interval s apart.` and exit 1. The comment above the step and the header comment's stage list say what it does now.
- **Green.** The same filter with `workflows` added exited 0, 131 tests in 3 files (`tmp/187-31/t2-green1.status`); case (c) ran its 60 reads against the stub `sleep` in 1.5 s. With the rule's three red copies added to "the deploy-specific guards are red on a faulty copy" (`polls=1`, the `sleep "$interval"` line removed, `polls=200`, each through `mutate`), exit 0, 134 tests (`tmp/187-31/t2-green2.status`).
- **The bound.** 60 reads, 15 s apart, a limit of 900 s, within `rollout-poll`'s 600 s to 1800 s (half of the deploy job's `timeout-minutes: 60`).
- **The literals.** The existing case keeps every assertion it had, `[ "$rollout_state" != COMPLETED ]` among them, and adds `echo "stable_poll=` and `echo "stable_describe_exit=`; no literal had to be replaced.
- **TypeScript.** `deploy-workflow.test.ts` still has exactly the one standalone strict `tsc` error it had at HEAD (TS2638, in "has no switch, input or variable that skips the contestant spec"), left unfixed; `workflow-errexit.test.ts` has none.

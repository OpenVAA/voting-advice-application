# 187-31 evidence: the stable step waits for the rollout

This file holds the record of plan 187-31: the deploy job's stable step now waits, within a bound, for the rollout it checks to complete, and the evidence commits are rebuilt for plan 187-21's attempt 4.

## Task 1: attempt 3, settled

```
T1_HEAD_AT_START=9c6dfd41a96b036acbdecd13f3ae681a885be2d7
```

- Attempt 3 of plan 187-21 is recorded settled in `evidence/187-21-green-run.md` § Attempt 3, settled read-only: `A3_CAUSE_STATUS=diagnosis-confirmed` there, the rollout `COMPLETED` at `07:31:38.687Z`, 25 to 32 s after the stable step's single read, and the image running by digest `sha256:ccfaa586…`, equal to the build's.
- The orchestrator's read file was copied to `tmp/187-31/a3/aws-reads.txt`; its values equal the plan's. The optional re-read was made (the `openvaa-admin` session was valid) and agrees.
- The 37 current lines of § Task 1, attempt 3 and of the first two fences of § Task 3, attempt 3 are renamed `*_SUPERSEDED=` with their values unchanged, as are `A3_RUNNING_IMAGE_READ` and `A3_CAUSE_STATUS` of the `A3_` fence.

# 185-01: the execution role's home, the push, and the alert address

RULING_EXECUTION_ROLE=bootstrap
RULING_PUSH=deploy-evidence
RULING_ALERT_ADDRESS=profile

- **Date (UTC):** 2026-11-12
- **Attempt:** `20261112T115954Z.ee336dea3` (key `185-01-1`, started with `attempt.sh new 185-01-1` at HEAD `ee336dea3`)
- **Who ruled:** the operator, answering the Task 1 checkpoint the orchestrator presented. The reply was stored with `attempt.sh put 185-01-1` (exit 0). The executor read the stored lines back and wrote this record; it held no credential and ran nothing against AWS.

## The stored reply

```
answer_attempt=20261112T115954Z.ee336dea3
answer_execution_role=bootstrap
answer_push=deploy-evidence
answer_alert_address=profile
```

Read back from the file `attempt.sh path 185-01-1` names, with `attempt.sh id 185-01-1` printing the same attempt id (exit 0) and `attempt.sh has 185-01-1 '^answer_<name>=<value>$'` exiting 0 for each of the three answers. `attempt.sh bound` exits 1 on these lines: an operator's answer line carries no `attempt=` field, so the binding to this attempt is the `answer_attempt=` line, which `put` checks before it stores a reply.

## What each ruling means

1. **`RULING_EXECUTION_ROLE=bootstrap` (D-01, D-02, D-12).** The frontend's execution role and its permissions are a new module, `infra/modules/frontend-task-role`, called from `infra/bootstrap`. No IAM is written in `infra/envs/staging/aws` or `infra/envs/example/aws`, the roots a workflow will apply. D-01 is relaxed by one additive apply of bootstrap, made by the operator in one sitting (plan 185-11, bootstrap README Step 8). Tasks 2 and 3 of this plan run as written; no plan needs revision.
2. **`RULING_PUSH=deploy-evidence` (D-14).** The phase may push a source-only commit (the tree without `.planning/`) to `origin` on the branch `deploy-evidence/185-image`, a name no workflow listens to. The answer covers every push of the phase, a rebuild after an image defect included.
3. **`RULING_ALERT_ADDRESS=profile` (D-17).** The operator exports `TF_VAR_alert_email` in a file outside the repository that their shell profile reads, so every shell the agent starts has it and the value appears in no command, transcript, evidence or tracked file. On 2026-11-12 the variable was not yet visible to agent shells (the operator adds it and restarts); this plan applies nothing, so it is not blocked. No agent reads or prints the value.

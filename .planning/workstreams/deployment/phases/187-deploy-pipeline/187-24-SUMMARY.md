---
phase: 187-deploy-pipeline
plan: "24"
subsystem: infra
status: complete
tags: [destroy-workflow, staging-destroy, environment-review, supabase-root-refused, destroy-guard, staging, pipe-08]
requires:
  - 187-23 (run 44285713407 on deploy-evidence/destroy-staging at 331b5db28, and the 40-resource count)
  - the cost-read todo 2026-11-14-measure-the-staging-aws-stack-monthly-cost (INFRA-13's measured figure in 185-22-cost.md, operator ruling short-window)
provides:
  - the staging AWS stack destroyed through destroy.yml (attempt 2 of run 44285713407), behind both staging-destroy reviews
  - PIPE-08 observed in full in a run: the Supabase root refused, the guard passed in both jobs, 40 destroyed, the state empty
  - the supabase, dns-mail and bootstrap state objects shown unchanged (LastModified, VersionId and ETag)
affects:
  - 187-25 (the redeploy from nothing: empty state, new certificates, a new alert subscription to confirm, the cost window restarted)
tech-stack:
  added: []
  patterns:
    - "A gh run rerun of a completed destroy run re-requests both environment reviews; the approvals endpoint then lists the new attempt's reviews only"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-24-SUMMARY.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-24-destroy.md
    - infra/envs/staging/aws/README.md
decisions:
  - "The run was started by a re-run (attempt 2) of 187-23's run, not a new commit, because GitHub offered the re-run; nothing was pushed"
  - "The apply's seconds (279) are taken from the apply step's own start and completion timestamps, since the workflow prints no duration line"
  - "SERVED_AFTER is recorded as the curl status (6, could not resolve host), because the apex records went with the stack and no HTTP code exists"
metrics:
  duration: "about 2 h 2 min (Task 1 12:00:24Z; re-run 12:02:43Z; plan-destroy 13:55:04Z to 13:55:49Z; apply-destroy 13:55:58Z to 14:01:17Z; workstation reads to 14:04Z)"
  completed: 2026-11-18
actuals:
  tokens: 3900
  tasks: 3
  commits: 2
plan_head_before: 7632986327d939caf551652006fdd3ba5141a60b
plan_head_after: 74be4c09bb3c184c4214b87309427eb40017d7db
---

# Phase 187 Plan 24: The destroy of the staging AWS stack through the pipeline Summary

```
DESTROY_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44285713407/attempts/2
destroy_planned=40
DESTROY_STATE_AFTER=0
```

The destroy workflow removed the staging AWS stack in one run, attempt 2 of run 44285713407, after the operator approved both of its `staging-destroy` reviews. It could not reach the Supabase root's state. The workflow's guard passed in both jobs, 40 resources were destroyed, and the state is empty. The state objects of the other three roots (`supabase`, `dns-mail` and `bootstrap`) are byte-for-byte as they were before the run, and `staging.openvaa.org` no longer resolves.

## Stages

1. **Readiness (Task 1, commit `d404e357b`).** These checks were made before the run:
   - `DATE_OK=yes`, under the operator's short-window ruling.
   - `COST_READ_RECORDED=yes`: INFRA-13 measured 36.96 USD a month, or 44.26 with the untagged load-balancer addresses, in `185-22-cost.md`.
   - The served build was `331b5db28`.
   - The state held 46 addresses, 40 of them managed resources (`STATE_RESOURCES_BEFORE=40`).
   - The other three state objects were read with their `LastModified`, `VersionId` and `ETag`.
   - No run was active.
2. **Approval (Task 2, at top level).** The operator approved attempt `20261118T120231Z.d404e357b` of key `187-24-2`. Both `attempt.sh bound` and `has '^answer_destroy=approve$'` exit 0. The orchestrator then ran `gh run rerun 44285713407`, which exited 0. The operator approved both reviews in the web interface, and the approvals endpoint lists two `approved` for `staging-destroy`.
3. **plan-destroy (45 s, success).** `supabase_root_init_status=1`, `supabase_state_head_status=254` and `supabase_root_refused=yes`. The guard printed `destroy_planned=40`, `destroy_state_resources=40`, `destroy_outside_module=0`, `destroy_other_actions=0`, `destroy_unmatched=0` and `destroy_guard=pass`. The plan read `Plan: 0 to add, 0 to change, 40 to destroy.`
4. **apply-destroy (5 min 19 s, success).** The job made its own plan, and the guard printed the same six lines with `destroy_guard=pass`. `APPLY_DESTROY_STEP=success` in 279 s, with `Apply complete! Resources: 0 added, 0 changed, 40 destroyed.` and `apply_exit=0`. The longest deletions were the CloudFront distribution (3m33s), the internet gateway (2m58s) and the ECS service (2m36s), the same three as in the hand destroy of 185-19. Then came `destroy_state_after=0`. `DESTROY_RUN_CONCLUSION=success`. Neither log holds an error or warning annotation.
5. **Afterwards, from the workstation (read-only, account `471112560111`).**
   - `STATE_LIST_AFTER=0`.
   - `OTHER_STATE_UNCHANGED=yes`: all three keys match Task 1 in `LastModified`, `VersionId` and `ETag`.
   - The AWS root's own object was rewritten at 14:01:14Z, and it now holds 2741 bytes.
   - `SERVED_AFTER=curl_exit_6` (could not resolve host), and `dig` returns no A or AAAA record.
6. **Runbook.** The staging AWS runbook (`infra/envs/staging/aws/README.md`) has a new dated Observations row for 2026-11-18, formatted with Prettier. Task 3's `<verify>` exits 0, and the binding was checked again with `bound` exit 0.

## Task Commits

| Task | Name                                                    | Commit      |
| ---- | ------------------------------------------------------- | ----------- |
| 1    | Readiness, read-only                                    | `d404e357b` |
| 2    | Operator approval (bound at top level)                  | none        |
| 3    | The destroy run, the empty state, the untouched roots   | `74be4c09b` |

## Deviations from Plan

None. The plan was executed as written. The re-run path of the plan's assumption held, so the new-commit fallback was not used. The run was started at top level by the orchestrator, as the execution rules require, and the executor only read it.

## Known Stubs

None.

## Next

Plan 187-25 redeploys the stack from nothing. It will need to:

- confirm the new alert subscription;
- restart INFRA-13's cost window;
- bring back the apex records, so that `staging.openvaa.org` resolves again.

Until then no pipeline alert can be published, because the topic is gone (T-187-62, accepted).

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-24-destroy.md
- FOUND: infra/envs/staging/aws/README.md (the 2026-11-18 destroy row)
- FOUND: d404e357b and 74be4c09b in HEAD's history

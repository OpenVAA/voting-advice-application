---
phase: 187-deploy-pipeline
plan: "25"
subsystem: infra
status: complete
tags: [deploy-workflow, redeploy-from-nothing, staging, sns-subscription, deploy-role, pipe-08, pipe-06, infra-16, pipe-01]
requires:
  - 187-24 (the staging AWS stack destroyed through destroy.yml, the state empty, STATE_RESOURCES_BEFORE=40)
  - 187-22 (run 44276384977 on deploy/staging at 331b5db28, re-runnable)
provides:
  - the staging AWS stack rebuilt from an empty state by deploy.yml (attempt 2 of run 44276384977), 40 resources created, serving 331b5db28
  - the Supabase root shown untouched by the destroy (operator's plan No changes, hosted probe exit 0) before the redeploy
  - the recreated alert subscription confirmed (INFRA-16's channel live again)
  - the bootstrap runbook's deploy-role-permissions and edge-tag-test rows moved to Observations
affects:
  - phase 187 verification (the full deploy, destroy and rebuild path is observed)
tech-stack:
  added: []
  patterns:
    - "A gh run rerun of a completed deploy run on an empty state builds nothing (tag exists, exit 3) and creates the whole root around the same digest"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-25-SUMMARY.md
  modified:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-25-redeploy.md
    - infra/envs/staging/aws/README.md
    - infra/bootstrap/README.md
decisions:
  - "The redeploy was a re-run (attempt 2) of 187-22's run, not a new commit: the tag exists, so the same image is deployed by digest and nothing was pushed"
  - "Both bootstrap not-yet-observed rows whose checker this run is were moved: the deploy role's permissions (plan, apply, destroy and create, runs of 187-21, 187-24 and 187-25) and the edge tag calls' aws:ResourceTag test (first pipeline deploy from nothing)"
  - "The staging Observations row was kept no wider than the widest existing row, so Prettier did not realign the 70 earlier rows"
metrics:
  duration: "about 2 h (Task 1 14:07Z; re-run 15:00:46Z; deploy 15:06:22Z to 15:14:57Z; auth gate 15:57Z; subscription read 16:04:27Z)"
  completed: 2026-11-18
actuals:
  tokens: 5100
  tasks: 3
  commits: 3
plan_head_before: adf4df14160557badf72823951a3050351c65338
plan_head_after: 49b1db4c76ebe53242bb0a771b22a19bc0c4447c
---

# Phase 187 Plan 25: The redeploy of the staging AWS stack from nothing Summary

```
REDEPLOY_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44276384977/attempts/2
REDEPLOY_PLAN_SUMMARY=Plan: 40 to add, 0 to change, 0 to destroy.
SUBSCRIPTION_CONFIRMED=yes
```

The deploy workflow rebuilt the staging AWS stack from an empty state in one gated run, attempt 2 of run 44276384977 on `deploy/staging`. It created exactly the 40 resources that plan 187-24's destroy removed, and staging serves `331b5db28` again. The redeploy started only after the operator showed two things in their own terminal: the Supabase root's plan reads `No changes`, and the hosted probe passes. The recreated e-mail subscription was confirmed by the operator and now reads back with a subscription ARN.

## Stages

1. **Readiness (Task 1, commit `eae60bf26`).** These checks were made before the run:
   - `STATE_EMPTY=yes`.
   - `TOPIC_ABSENT=yes`: the topic read failed with `NotFound`.
   - `REDEPLOY_FROM_RUN=` is 187-22's run 44276384977.
   - `DEPLOY_STAGING_COMMIT=331b5db28…`.
   - `NO_RUN_ACTIVE=yes`.
2. **Approval (Task 2, at top level).** The approval is attempt `20261118T140849Z.eae60bf26` of key `187-25-2`, and `bound` and `has '^answer_redeploy=approve$'` both exit 0. The stored reply holds `s25a_supabase_plan=No changes` and `s25b_probe_exit=0` (22 PASS lines over the pooler connection). The orchestrator then ran `gh run rerun 44276384977`, which exited 0. The operator approved the `staging` review and clicked the confirmation link.
3. **The run (Task 3, commit `0b7182bab`).** All 33 steps succeeded in order; the two alert steps were skipped, as they are on a green run.
   - The build exited 3: the tag exists, so the same digest was used.
   - The plan was `40 to add, 0 to change, 0 to destroy`. All 40 addresses are to be created and there is no other action. 40 equals 187-24's `STATE_RESOURCES_BEFORE=40`.
   - No migration was pending (drift CLEAN, 00001..00022). The three functions are `ACTIVE`.
   - The apply took 257 s: `Apply complete! Resources: 40 added, 0 changed, 0 destroyed.`
   - The stable step read `COMPLETED` on its first poll, and the task definition matches.
   - The smoke gate printed its 5 PASS lines and `2 passed (20.0s)`.
   - `served_build_after_smoke=331b5db28…`.
   - `REDEPLOY_JOB_MINUTES=8.6` of 60, and `REDEPLOY_RUN_CONCLUSION=success`.
4. **The subscription and the records (Task 3, commit `49b1db4c7`).** The first subscription read hit an authentication gate: the `openvaa-admin` SSO session had expired. The operator signed in again. At 16:04:27Z the account check returned 471112560111. The read asked only for `SubscriptionArn` and `Protocol`. It found one `email` subscription with a full subscription ARN, not `PendingConfirmation`. Both runbooks got their dated Observations rows, and the two bootstrap rows moved from Not yet observed. Prettier is clean and Task 3's `<verify>` exits 0.

## Task Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 | eae60bf26 | docs(187-25): record the redeploy's readiness: empty state, topic gone, run to repeat |
| 2 | (top level) | attempt 20261118T140849Z.eae60bf26 bound, approve |
| 3 | 0b7182bab | docs(187-25): record the pipeline's redeploy of the staging AWS stack from nothing |
| 3 | 49b1db4c7 | docs(187-25): record the confirmed subscription and the redeploy's runbook rows |

## Authentication Gates

- **Task 3, the subscription read.** At 15:57:11Z both `aws sts get-caller-identity` and `aws sns list-subscriptions-by-topic` returned exit 255 with `Token has expired and refresh failed`. The executor did not sign in. It committed the run record and returned a human-action checkpoint. The operator ran `aws sso login --profile openvaa-admin`, the orchestrator confirmed the account at top level, and the read then succeeded on its first try.

## Deviations from Plan

- **The redeploy was started by the orchestrator, not the executor.** Per the plan's execution rules, the re-run happens at top level after the binding. The executor only read the completed attempt.
- **Two bootstrap rows moved, not one.** Besides the deploy role's permissions row, the row "A distribution or certificate created with the root's tags passes the edge tag calls' `aws:ResourceTag` test" names this run as its checker ("The first pipeline deploy from nothing, after the real destroy"). The run created the distribution and both certificates with the root's tags, and the apply succeeded.

## Known Stubs

None.

## Next

The phase's verification, run by the orchestrator. The deploy, destroy and rebuild-from-nothing path of the pipeline has now been observed end to end. The cost window restarted with this create, whose apply ran from 15:09:48Z to 15:14:05Z on 2026-11-18.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-25-redeploy.md
- FOUND: infra/envs/staging/aws/README.md, infra/bootstrap/README.md (prettier --check clean)
- FOUND: eae60bf26, 0b7182bab, 49b1db4c7 (ancestors of HEAD)
- Task 3 `<verify>` exit 0

---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "11"
subsystem: infra
status: complete
tags: [aws, ssm, iam, bootstrap, execution-role, read-back, runbook]
requires:
  - phase: 185-01
    provides: RULING_EXECUTION_ROLE=bootstrap and the frontend_task_role module in bootstrap
  - phase: 185-10
    provides: the code gates green before the first apply plan
provides:
  - the parameters /openvaa/staging/frontend/PUBLIC_SUPABASE_ANON_KEY and ANALYTICS_POSTHOG_KEY in AWS (operator), read back by metadata
  - the role openvaa-staging-frontend-execution and the policy openvaa-staging-frontend-parameters under /openvaa/ (bootstrap, operator-applied), read back as least privilege
  - evidence/185-11-parameters-and-role.md
affects: [185-12]
tech-stack:
  added: []
  patterns:
    - "A parameter read-back queries describe-parameters for Name, Type and KeyId only, so LastModifiedUser (a session ARN) never reaches output"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-11-parameters-and-role.md
  modified:
    - infra/envs/staging/aws/README.md
    - infra/bootstrap/README.md
key-decisions:
  - "The operator's renamed reply lines (answer_posthog_kind, s2_tags_anon_exit / s2_tags_posthog_exit, s2_tag_names_anon / s2_tag_names_posthog) are authoritative over the plan text's answer_posthog_key, because the reply screen refuses names ending in a secret word or carrying capitals"
  - "Bootstrap Step 8 checks the alert address with printenv, not test -n: a set but unexported variable passes test -n and still fails the plan"
  - "The AWS runbook's tag row was split: the tags are observed; that the destroy check does not list the parameters stays unobserved for Step 16"
requirements-completed: [INFRA-05, INFRA-11]
duration: 25min
completed: 2026-11-12
estimate_ref:
  tokens: 22000
  tasks: 3
actuals:
  tokens: 6900
  tasks: 1
  commits: 1
plan_head_before: 6ef5b0568cb0a52e56d5b92af859bc7d39d952df
plan_head_after: b199ea8f6450f8fa3adbbd161fc3c2c2e18db025
---

# Phase 185 Plan 11: The frontend's parameters and execution role Summary

Two SecureString parameters under `alias/aws/ssm` with no `Root` tag, and a bootstrap-owned execution role that trusts `ecs-tasks.amazonaws.com` alone, carries only the managed execution policy and `openvaa-staging-frontend-parameters`, reads its own parameter path (simulator `allowed`) and not another (`implicitDeny`), and whose ARN equals the staging tfvars' `execution_role_arn`.

## What was done

- **Task 1 (operator, done before this run):** Step 2 of the staging AWS runbook, attempt `20261112T185000Z.2a494b5af`. Every `s2_` status 0, both parameters `SecureString alias/aws/ssm`, tag names `Environment,Project`, `answer_posthog_kind=real`. The executor appended `OPERATOR_REPLY=received attempt=20261112T185000Z.2a494b5af plan=185-11 task=1 head=<sha>`; `attempt.sh bound 185-11-1 OPERATOR_REPLY plan=185-11 task=1` exits 0.
- **Task 2 (operator, done before this run):** bootstrap Step 8, attempt `20261112T193809Z.6ef5b0568`. `s8_plan_exit=2`, `Plan: 5 to add, 0 to change, 0 to destroy.`, five `create module.frontend_task_role.*` lines, apply exit 0 (5 added), second plan exit 0, `s8_role_arn=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution`, `answer_applied=yes`. The executor appended the `task=2` record line; `bound` exits 0. Every check of the task's verification held.
- **Task 3 (tracer, this run):** read back with `AWS_PROFILE=openvaa-admin` in `eu-north-1`, the account asserted 471112560111 first; metadata only, raw output in a private temporary directory removed at the end. Recorded in `evidence/185-11-parameters-and-role.md`, with dated Observations rows in both runbooks and the matching "Not yet observed" rows moved.

## Read-back

| Item | Result |
| --- | --- |
| Parameters | 2, both `SecureString`, key `alias/aws/ssm` (AWS-managed, Enabled, created 16 ms after the first parameter), tag keys `Environment,Project`, no `Root` |
| Role path / trust | `/openvaa/`, `ecs-tasks.amazonaws.com`, `sts:AssumeRole` |
| Role tag keys | `Environment,ManagedBy,Project,Root` |
| Attached policies | `AmazonECSTaskExecutionRolePolicy`, `openvaa-staging-frontend-parameters` |
| Inline policies | 0 |
| Simulator, own path | `allowed` |
| Simulator, `/openvaa/staging/other/X` | `implicitDeny` |
| `--assert-no-inline-user-policies` | exit 0 (3 IAM users, none inline) |
| `--assert-no-inline-under /openvaa/` | exit 0 (4 roles and users, none inline) |
| ARN vs tfvars (`get-role` and `s8_role_arn`) | equal |
| Service-linked roles | InternetMonitor, Organizations, ResourceExplorer, SSO, Support, TrustedAdvisor (no `AWSServiceRoleForECS` yet) |

## Verification

- Task 1 verify (`test -x/-f attempt.sh`): exit 0
- Task 2 verify (`bound 185-11-1 ...` and the ruling grep): exit 0
- Task 3 verify, evidence record lines and no session ARN or address: exit 0
- Task 3 verify, `prettier --check` of both READMEs: exit 0
- Extra: `yarn test:unit:infra` exit 0 (102 tests), `yarn test:unit:tests` exit 0 (189 tests), both reading the runbooks

## Deviations from Plan

1. **[Rule 3 - Blocking] Renamed reply lines.** The plan text names `answer_posthog_key=real|stand-in`; the reply screen refuses a name ending in a secret word, so the operator's lines are `answer_posthog_kind=real`, `s2_tags_anon_exit` / `s2_tags_posthog_exit` and `s2_tag_names_anon` / `s2_tag_names_posthog` (runbook fixed in `6ef5b0568`). The renamed lines were treated as authoritative; the evidence records `POSTHOG_KEY=real` as the plan asks.
2. **[Rule 2 - Missing check] Step 8 export check.** The operator's first Step 8 plans failed with `No value for required variable` for `alert_email` because `TF_VAR_alert_email` was set but not exported. Step 8's opening block now prints `s8_alert_set_exit` from `printenv TF_VAR_alert_email > /dev/null`, with a sentence on why `test -n` is not enough, and a dated Observations row records it.
3. **Extra record lines.** The evidence also carries `SERVICE_LINKED_ROLES=...` and the SSM key's creation time against the parameters' (metadata only), which let the "A SecureString created without a key id uses `alias/aws/ssm`, and AWS creates that key with the first such parameter" row move to Observations.
4. **Runbook row split.** The AWS runbook's row on the parameters' tags also claimed the destroy check does not list them (Step 16); the tag part moved to Observations and a reduced row for Step 16 stays in "Not yet observed".
5. **Ledger base.** The plan-commit ledger was created at this run's start (`6ef5b0568`); the two earlier `fix(185-11)` runbook commits (`2b77f4529`, `6ef5b0568`) fall before it and are not counted in `commits: 1`.

## Notes for the next plan

- No `AWSServiceRoleForECS` exists yet; the first ECS cluster or service the staging AWS root creates makes AWS create it. Not a defect.
- The Task 2 reply also carried `s8_account_match_exit` and `s8_alert_set_exit` lines that Step 8 as tracked did not print before this commit; the alert check is now in the runbook, the account check is not.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-11-parameters-and-role.md`
- FOUND: commit `b199ea8f6` on HEAD

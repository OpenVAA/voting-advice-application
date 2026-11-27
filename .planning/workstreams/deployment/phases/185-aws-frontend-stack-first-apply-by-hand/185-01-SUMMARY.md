---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "01"
subsystem: infra
status: complete
tags: [terraform, iam, ecs, ssm, bootstrap, runbook]
requires: []
provides:
  - "module infra/modules/frontend-task-role (execution role, parameter-read policy, attachments)"
  - "bootstrap variable frontend_environment, output frontend_execution_role_arn"
  - "bootstrap README Step 8 (s8_ lines, stop rule of five creates under module.frontend_task_role)"
  - "evidence/185-01-rulings.md (RULING_EXECUTION_ROLE, RULING_PUSH, RULING_ALERT_ADDRESS)"
affects: [185-08, 185-11, infra/envs/staging/aws, infra/envs/example/aws]
tech-stack:
  added: []
  patterns:
    - "Role with no permission of its own: managed policies attached by separate resources, an exclusive-policies resource with an empty list"
    - "Runbook planned addresses read from `terraform show -json` with jq, so no attribute value is printed"
key-files:
  created:
    - infra/modules/frontend-task-role/main.tf
    - infra/modules/frontend-task-role/variables.tf
    - infra/modules/frontend-task-role/outputs.tf
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-01-rulings.md
  modified:
    - infra/bootstrap/main.tf
    - infra/bootstrap/variables.tf
    - infra/bootstrap/outputs.tf
    - infra/bootstrap/terraform.tfvars
    - infra/bootstrap/example.tfvars
    - infra/bootstrap/README.md
decisions:
  - "The frontend execution role lives in bootstrap (module frontend_task_role), applied once by the operator; no IAM in any root a workflow applies"
  - "The phase may push a source-only commit to deploy-evidence/185-image, every push of the phase included"
  - "The alert address reaches agent applies as TF_VAR_alert_email exported from the operator's shell profile, never typed or tracked"
  - "Trust policy is the plain ecs-tasks.amazonaws.com service principal with no aws:SourceAccount/SourceArn condition, as the plan specifies"
metrics:
  duration: "about 8 min (Tasks 1 to 3, after the operator's reply)"
  completed: 2026-11-12
estimate:
  tokens: 26000
  tasks: 3
actuals:
  tokens: 4900
  tasks: 3
  commits: 3
plan_head_before: ee336dea37f567074f95338bcc5166b3a5ea4d5d
plan_head_after: 3ea5cd9d97c8195778aad4af125ead435092b1fd
---

# Phase 185 Plan 01: The frontend execution role in bootstrap Summary

RULING_EXECUTION_ROLE=bootstrap
RULING_PUSH=deploy-evidence
RULING_ALERT_ADDRESS=profile

The frontend's ECS execution role is now a bootstrap module: only `ecs-tasks.amazonaws.com` can assume it, `AmazonECSTaskExecutionRolePolicy` is attached, and one customer-managed policy under `/openvaa/` allows `ssm:GetParameters` on `parameter/openvaa/<env>/frontend/*` and `kms:Decrypt` on the `alias/aws/ssm` key through SSM only. Bootstrap's runbook has a Step 8 that plans the change, stops unless the plan is exactly five creates under `module.frontend_task_role`, and is applied by the operator. Nothing was applied.

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | The rulings (resumed from the stored operator reply, attempt `20261112T115954Z.ee336dea3`) | aadae5fb5 | evidence/185-01-rulings.md |
| 2 | The execution role module, called from bootstrap (tracer) | db7624bf8 | infra/modules/frontend-task-role/{main,variables,outputs}.tf, infra/bootstrap/{main,variables}.tf |
| 3 | Bootstrap inputs, output and runbook step | 3ea5cd9d9 | infra/bootstrap/{outputs.tf,terraform.tfvars,example.tfvars,README.md} |

## What was built

- **`infra/modules/frontend-task-role`:** `aws_iam_role.execution` (`openvaa-staging-frontend-execution` under `/openvaa/`), `aws_iam_role_policies_exclusive.execution` with `policy_names = []`, `aws_iam_role_policy_attachment.managed` (the AWS-managed execution policy), data `aws_kms_alias.ssm`, `aws_iam_policy.parameters` (`openvaa-staging-frontend-parameters`, statements `ReadFrontendParameters` and `DecryptFrontendParameters` with `kms:ViaService = ssm.<region>.amazonaws.com`), `aws_iam_role_policy_attachment.parameters`. Outputs `execution_role_arn`, `execution_role_name`, `parameter_path`. No task role.
- **Bootstrap:** `module "frontend_task_role"` after `github_oidc`; variable `frontend_environment` (`staging` in `terraform.tfvars`, `example` in `example.tfvars`); output `frontend_execution_role_arn`; the root's header comment names both IAM modules.
- **Runbook Step 8:** precondition (the frontend's SecureString parameters exist, so `alias/aws/ssm` exists), the opening lines of a sitting, and items printing `s8_init_exit`, `s8_plan_exit`, `s8_plan_line`, `s8_show_exit`, `s8_planned=<action> <address>`, the quoted stop rule, `s8_apply_exit`, `s8_apply_line`, `s8_second_plan_exit`, `s8_role_arn`, `s8_logs_removed`. The flow overview, the opening paragraph and two "Not yet observed" rows were updated.

## Verification

| Gate | Exit |
| ---- | ---- |
| Task 1: `test -f infra/bootstrap/main.tf && grep -c 'module "github_oidc"'` (count 1) | 0 |
| Task 1: `attempt.sh id 185-01-1` = `20261112T115954Z.ee336dea3`; `attempt.sh has` for each of the three answers | 0, 0, 0, 0 |
| Module `init -backend=false` + `validate` | 0 |
| Bootstrap `init -backend=false -lockfile=readonly` + `validate`, with `TF_DATA_DIR` in the scratchpad (see Deviations) | 0 |
| `terraform fmt -check infra/modules/frontend-task-role infra/bootstrap` | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs` (47 files, 0 findings) and `--self-test` | 0, 0 |
| tfvars greps for `frontend_environment` (staging, example) | 0 |
| README Step 8 heading, `module.frontend_task_role` grep, `prettier --check` | 0 |
| `yarn assert:comment-hygiene` (0 violations) | 0 |
| `yarn test:unit:infra` (96 tests) | 0 |

Acceptance counts: `ecs-tasks.amazonaws.com` 1, `policy_names = []` 1, `task_role` 0, `module "frontend_task_role"` 1, `output "frontend_execution_role_arn"` 1; `grep -rlE 'aws_iam_(role|policy)' infra/envs` printed nothing; README planning-reference count 0 at HEAD and 0 after. The jq filter of Step 8 was checked against a fixture: it prints `create`/`delete-create` lines and leaves out `no-op`.

Tracer gate: the Task 2 verify passed in full before its commit; its bootstrap validate, `fmt -check` of both directories and the guard were run again with Task 3's verify, on the final tree, and passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bootstrap `init -backend=false` needs a separate data directory in this checkout**
- **Found during:** Task 2 verify
- **Issue:** `infra/bootstrap/.terraform/` is the operator's working directory from the real applies and records the S3 backend. With it, `terraform -chdir=infra/bootstrap init -backend=false ...` failed with `No valid credential sources found` (the S3 backend looking for credentials), and the existing module manifest does not list the new module.
- **Fix:** ran the bootstrap init and validate with `TF_DATA_DIR` set to a scratchpad directory. The operator's `.terraform/` and the tracked lock file are untouched; `-lockfile=readonly` still reads `infra/bootstrap/.terraform.lock.hcl`. The operator's own `terraform init` in Step 8 item 1 installs the module into their directory. Later plans whose verify runs bootstrap offline need the same `TF_DATA_DIR`.
- **Files modified:** none
- **Commit:** n/a

**2. [Rule 2 - Correctness] Step 8 reads planned addresses from JSON and pins the lock file**
- **Found during:** Task 3
- **Issue:** the plan asked for addresses from `terraform show -no-color tfplan` with no attribute value printed; parsing the text form leaves that guarantee to a regular expression.
- **Fix:** `terraform show -json tfplan` into `$L`, and jq prints only `<actions> <address>` for every change that is not a no-op, giving the `s8_planned=create module.frontend_task_role.<resource>` lines plan 185-11 checks. Item 1's init carries `-lockfile=readonly` (threat T-185-SC). Extra named lines `s8_init_exit`, `s8_show_exit`, `s8_second_plan_exit` and `s8_logs_removed` give each command a status. The temporary directory's template is `openvaa-bootstrap.XXXXXX`.
- **Files modified:** infra/bootstrap/README.md
- **Commit:** 3ea5cd9d9

### Notes

- `attempt.sh bound 185-01-1 answer_execution_role=bootstrap` exits 1: an operator's answer line has no `attempt=` field. The reply is bound to this attempt by its `answer_attempt=` line, which `put` checked when it stored the reply. The answers were checked with `has` and `id`.
- `TF_VAR_alert_email` was not read or printed. This plan applies nothing.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: infra/modules/frontend-task-role/main.tf, variables.tf, outputs.tf
- FOUND: evidence/185-01-rulings.md
- FOUND: aadae5fb5, db7624bf8, 3ea5cd9d9 (ancestors of HEAD)

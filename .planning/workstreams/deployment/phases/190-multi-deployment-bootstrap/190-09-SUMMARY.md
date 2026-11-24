---
phase: 190-multi-deployment-bootstrap
plan: 09
subsystem: pipeline workflows
tags: [github-actions, infra-plan, multi-deployment, oidc, PIPE-13]
requires:
  - "190-02: resolve-deployment.sh --mode plan (deployments= JSON list of owned entries with an AWS root)"
  - "190-05: the checks job's test-bootstrap step"
  - "190-08: deploy.yml and destroy.yml free of staging and literal role ARNs"
provides:
  - "infra-plan.yml: credential-free resolve job (plan mode) first; plan and wrong-subject jobs as fail-fast: false matrices over fromJSON(needs.resolve.outputs.deployments)"
  - "plan job: each deployment's plan_role_arn, cluster_name, service_name and aws_root; step summary heading `### Plan of $AWS_ROOT`"
  - "wrong-subject job: each deployment's derived deploy_role_arn and plan_role_arn; the AWS_PLAN_ROLE_ARN check is gone"
  - "push trigger deploy-evidence/** and !deploy-evidence/destroy-*"
  - "workflows.test.ts deploy-role-arn in its final form: no literal role ARN in any workflow file; per-workflow expected role"
  - "arm-lock/terraformInits expand $AWS_ROOT bound to matrix.deployment.aws_root in a job over the resolve job's list"
affects:
  - "190-13 (docs naming AWS_PLAN_ROLE_ARN, which no workflow reads any more)"
  - "190-14 (the rewritten workflows observed on staging from an evidence branch)"
tech-stack:
  added: []
  patterns:
    - "matrix over a resolve job's JSON list output: strategy { fail-fast: false, matrix: { deployment: fromJSON(...) } }"
    - "per-workflow expected role table in the cross-workflow role rule"
key-files:
  created: []
  modified:
    - .github/workflows/infra-plan.yml
    - infra/scripts/infra-plan-workflow.test.ts
    - infra/scripts/workflow-errexit.test.ts
    - infra/scripts/workflows.test.ts
decisions:
  - "190-09: infra-plan.yml's plan job keeps aws-region eu-north-1 and allowed-account-ids 471112560111 literal: the resolver's plan mode emits no account or region (account-level values of the bootstrap root, one account per repository)"
  - "190-09: the resolve job has no `if:` and runs for pull requests and pushes; the checks job does not need it, so a repository owning no entry still gets its credential-free checks"
  - "190-09: deploy-role-arn no longer compares a literal ARN with one derived from the bootstrap tfvars; the derivation is pinned in resolve-deployment.test.ts against the real map"
metrics:
  duration: "~20 min"
  completed: 2026-11-24
---

# Phase 190 Plan 09: infra-plan.yml over the owned deployments Summary

The pull-request workflow now plans every deployment this repository owns. A credential-free resolve job builds the list in plan mode, and the plan and wrong-subject jobs run once per entry, each with role ARNs derived from the map. No workflow file holds a literal IAM role ARN any more. No infra workflow reads `AWS_PLAN_ROLE_ARN` or `AWS_DEPLOY_ROLE_ARN` as its role: deploy.yml still reads `AWS_DEPLOY_ROLE_ARN`, but only to refuse a value that differs from the resolved role. For staging the single matrix entry renders: plan role `arn:aws:iam::471112560111:role/openvaa/openvaa-plan`, derived from the entry's `iam_name_prefix`; the repository variable `AWS_PLAN_ROLE_ARN` it replaces cannot be read from here, so the operator should confirm it named the same role. Deploy role `arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy`, cluster `openvaa-staging`, service `openvaa-staging-frontend`, root `infra/envs/staging/aws`.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | infra-plan.yml over the owned deployments | f9d089c9c | .github/workflows/infra-plan.yml, infra/scripts/infra-plan-workflow.test.ts, infra/scripts/workflow-errexit.test.ts |
| 2 | The final cross-workflow rules | 1e92e2b13 | infra/scripts/workflows.test.ts |

## What changed

- **infra-plan.yml:**
  - The push trigger is now `deploy-evidence/**` and `!deploy-evidence/destroy-*`.
  - A new first job `resolve` (contents: read, no id-token, no environment) runs `resolve-deployment.sh --mode plan --repository-id "$REPOSITORY_ID" --github-output "$GITHUB_OUTPUT"` and outputs `deployments`.
  - `plan` gets `needs: resolve`. Its same-repository `if:` is kept. It runs as a matrix over the list and assumes `matrix.deployment.plan_role_arn`. The digest step reads `CLUSTER` and `SERVICE` from the entry. Init, plan and show use `-chdir="$AWS_ROOT"`.
  - `wrong-subject` gets `needs: resolve` and the same matrix, with `DEPLOY_ROLE_ARN` and `PLAN_ROLE_ARN` taken from the entry. The "AWS_PLAN_ROLE_ARN is not set" check is removed.
  - The header and the wrong-subject comment are rewritten in present tense.
- **infra-plan-workflow.test.ts:**
  - The resolve job: first, permissions, the resolver call and its output.
  - The plan and wrong-subject jobs: `needs`, matrix, roles, env, the digest call and the roots.
  - The trigger test, with a red copy that drops the exclusion.
  - A whole-file "no staging outside comments" test, with red copies for a literal role ARN and a literal root, plus a control that a staging comment is ignored.
  - A test that no repository variable is read as a role.
- **workflow-errexit.test.ts:**
  - The plan-step case finds "Plan the AWS root" and sets `AWS_ROOT`.
  - The wrong-subject cases set both role ARNs explicitly, with harness values.
- **workflows.test.ts:**
  - deploy-role-arn is now `roleArnViolations(files)`: a literal ARN in any workflow file is a violation, and the expected roles are the `EXPECTED_ROLES` table. Red copies cover a literal role, the variable role, the plan or deploy output swapped, a `vars.` plan role, a literal ARN in the wrong-subject env, a literal ARN in a comment and one in a non-pipeline workflow.
  - `terraformInits` expands a matrix binding through `bindsMapAwsRoot`. Red copies cover a literal matrix list and a missing matrix: on ARM, each is "a root the rule cannot read".
  - The environments and checks-on-ARM red copies follow the new job layout.

## Verification

- **Task 2 red first:** with the matrix clause disabled, the two new matrix tests went red (2 failed). With the role-collection disabled, 9 failed. On the real files, 62 of 62 passed.
- **Unit tests:**
  - `yarn test:unit:infra infra-plan-workflow`: green.
  - `yarn test:unit:infra workflows infra-plan-workflow deploy-workflow destroy-workflow`: 259 passed.
  - `yarn test:unit:infra`: **715 passed / 6 failed**, against 695/6 before. The six are the baseline host-only workflow-errexit failures: wrong-subject ×2, sweep "deploy.yml deploy Alert the operator", sweep "destroy.yml plan-destroy Show the Supabase root's state is out of reach", and Supabase-root ×2. The wrong-subject pair still fails at the `rm` guard: stdout is empty.
- **Lint:** `yarn lint:check` 0, `yarn format:check` 0, `yarn lint:workflows` 0 ("actionlint found nothing in 3 workflows").
- **Acceptance greps:**
  - Non-comment `staging` in infra-plan.yml: 0.
  - `vars.AWS_PLAN_ROLE_ARN`: 0.
  - `fromJSON(needs.resolve.outputs.deployments)`: 2.
  - `"!deploy-evidence/destroy-*"`: 1.
  - Literal role ARNs under `.github/workflows/`: 0.
- `yarn test:unit:tests` was not rerun because nothing under `tests/` was touched. Its baseline is 1 host-only failure (tcpForward "BOUNDED time").

**Baseline test titles:** none of the six changed. Titles that follow a step rename, all green before and after:
- "infra-plan.yml plan Plan the staging AWS root" became "infra-plan.yml plan Plan the AWS root" (sweep).
- The describe "the plan step of infra-plan.yml under bash -e" now finds the step "Plan the AWS root".

**E2E:** no local E2E project's spec, fixture, route or helper was touched, so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two workflows.test.ts red copies matched the wrong text after Task 1**
- **Found during:** Task 1. Fixed in Task 2, whose file it is.
- **Issue:** The environments red copy looked for `  plan:\n    if:`, which `needs: resolve` broke. The checks-on-ARM red copy replaced the first `runs-on: ubuntu-24.04`, which is now the resolve job's.
- **Fix:** Both mutations now target the plan and checks jobs by their headers.
- **Commit:** 1e92e2b13. Between f9d089c9c and 1e92e2b13, workflows.test.ts had 4 red tests (the old literal-ARN rule and these two copies).

### Scope notes

- The plan job's `aws-region` and `allowed-account-ids` stay literal, because plan mode carries no account or region. They name neither staging nor a role.
- Task 2 is tdd="true" but changes a test file only. The red state was the 4 red tests after Task 1, plus the disabled-clause checks above. Both tasks therefore went in as one `test(...)` commit, with no separate `feat(...)` commit.

## Threat Flags

None. No new surface was added.
- T-190-39: the matrix covers only entries whose `github_repository_id` is this repository's.
- T-190-40: the `if:` is kept, and the resolve job holds no id-token.
- T-190-41a: the destroy exclusion is guarded by a trigger test with a red copy.
- T-190-41: the ARNs are derived by the resolver and pinned in resolve-deployment.test.ts.

## Self-Check: PASSED

- FOUND: .github/workflows/infra-plan.yml, infra/scripts/infra-plan-workflow.test.ts, infra/scripts/workflow-errexit.test.ts, infra/scripts/workflows.test.ts
- FOUND commits: f9d089c9c, 1e92e2b13

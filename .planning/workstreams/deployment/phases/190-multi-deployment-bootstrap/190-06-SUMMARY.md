---
phase: 190-multi-deployment-bootstrap
plan: "06"
subsystem: infra
tags: [terraform, iam, oidc, tags, tightening]

requires:
  - phase: 190
    provides: "190-01 move harness and plan guard; 190-04 github-oidc keyed by deployment, MOVE_COMMIT"
provides:
  - "root_tags carries Environment = var.environment; every tag-scoped deploy create and change requires the deployment's own Environment tag"
  - "plan_deny's object-read exception is the deployment's own pipeline state key"
  - "github_repository_id and github_repository_owner_id required; both trusts carry plain id conditions"
  - "TIGHTEN_COMMIT=7d4ab1242affa84edd6865440f0a8db5275b8ade"
affects: [190-10, 190-11]

actuals:
  tasks: 2
  commits: 2
plan_head_before: 2c576c0e0
plan_head_after: 7d4ab1242

tech-stack:
  added: []
  patterns:
    - "expected live updates derived by rendering the module at both commits with the real provider (fake keys, offline) and diffing the policy documents"

key-files:
  created: []
  modified:
    - infra/modules/github-oidc/main.tf
    - infra/modules/github-oidc/variables.tf
    - infra/modules/github-oidc/policies.tf
    - infra/modules/github-oidc/deploy-policies.tf
    - infra/modules/github-oidc/tests/github_oidc.tftest.hcl

key-decisions:
  - "190-06: TIGHTEN_COMMIT=7d4ab1242affa84edd6865440f0a8db5275b8ade; update-only proof vs MOVE_COMMIT: delete 0, replace 0, create 0, moved 0, guard pass"
  - "190-06: EXPECTED_UPDATES = deploy_edge, deploy_load_balancing, deploy_network, plan_deny of module.github_oidc[\"staging\"]; both trust roles' JSON unchanged"
  - "190-06: no tag-conditioned DenyOtherDeploymentReads statement: docs.aws.amazon.com is refused by this session's egress proxy, so the SAR could not be read; all thirteen cross-deployment reads are accepted risks for infra/README.md"

requirements-completed: []  # INFRA-23 is met in code; it is ticked when the operator's live plan and apply of TIGHTEN_COMMIT (190-11) are recorded

duration: 25min
completed: 2026-11-24
---

# Phase 190 Plan 06: The in-place tightening Summary

**The deploy role's tag scopes now require `Environment=<key>` as well as `Project` and `Root`. The plan role can read no S3 object but its own deployment's pipeline state. Both trusts require the numeric repository and owner ids, and the module refuses null for either. Against MOVE_COMMIT the change plans as four in-place policy updates: no delete, no replace, no create.**

## Records

`TIGHTEN_COMMIT=7d4ab1242affa84edd6865440f0a8db5275b8ade`. This is the tree of the operator's second apply, in 190-11. Task 2 changes no code, so the Task 1 commit is the last code commit.

`EXPECTED_UPDATES=module.github_oidc["staging"].aws_iam_policy.deploy_edge,module.github_oidc["staging"].aws_iam_policy.deploy_load_balancing,module.github_oidc["staging"].aws_iam_policy.deploy_network,module.github_oidc["staging"].aws_iam_policy.plan_deny`

The operator's live plan of TIGHTEN_COMMIT must show exactly these four updates (`policy` only) and nothing else.

How the list was derived: I rendered the module at MOVE_COMMIT and at TIGHTEN_COMMIT with staging's inputs and the real AWS provider (fake keys, offline). Then I diffed every `aws_iam_policy.policy` and `aws_iam_role.assume_role_policy` (14 documents). Four policy documents differ. Both roles' trust JSON is identical, because staging already set both ids. Every other attribute of all 14 resources (name, path, description and the rest) is byte-identical. The deploy_network diff adds `aws:RequestTag/Environment` to four statements and `aws:ResourceTag/Environment` to two. Rendered sizes, with white space removed, against the 6144-character limit:

| Policy | MOVE | TIGHTEN |
|--------|------|---------|
| deploy_network | 3247 | 3483 |
| deploy_load_balancing | 1713 | 1752 |
| deploy_edge | 1659 | 1857 |
| plan_deny | 948 | 976 |

`TIGHTEN_PROOF=` (`PATH="$HOME/.cache/openvaa-terraform/1.16.5:$PATH" bash infra/scripts/check-bootstrap-moves.sh --base ce17178c6945c6514b3a2c5cfde49b322fb0265f`, clean tree at TIGHTEN_COMMIT, exit 0):

```
bootstrap_moves_base_map=present
bootstrap_moves_base=ce17178c6945c6514b3a2c5cfde49b322fb0265f
bootstrap_plan_delete=0
bootstrap_plan_replace=0
bootstrap_plan_moved=0
bootstrap_plan_failed_move=0
bootstrap_plan_update=18
bootstrap_plan_create=0
bootstrap_plan_unexpected_create=0
bootstrap_plan_guard=pass
```

The 18 updates are the harness's mocked-state artefact: the mock stores its own policy JSON. The 190-04 MAP_CONTROL showed the same 18 at MOVE_COMMIT against itself. The real document diff is the four above.

## Service Authorization Reference findings

docs.aws.amazon.com could not be reached. The session's egress proxy refused all four SAR pages with a policy 403 (`connect_rejected`), and the proxy's rules forbid routing around a refusal. No SAR fact was confirmed. I took the conservative option the plan names: no `DenyOtherDeploymentReads` statement, and every action is recorded as an accepted risk. The "belief" column is unverified background for whoever re-checks the SAR. It is not evidence.

| action | resource-level | aws:ResourceTag | disposition | belief (unverified) |
|--------|----------------|-----------------|-------------|---------------------|
| cloudfront:GetDistribution | unverified | unverified | accepted risk | distribution ARN; tag key probably listed |
| cloudfront:GetDistributionConfig | unverified | unverified | accepted risk | distribution ARN; tag key probably listed |
| elasticloadbalancing:DescribeLoadBalancers | unverified | unverified | accepted risk | Describe* usually `*` only |
| elasticloadbalancing:DescribeListeners | unverified | unverified | accepted risk | Describe* usually `*` only |
| elasticloadbalancing:DescribeRules | unverified | unverified | accepted risk | Describe* usually `*` only |
| elasticloadbalancing:DescribeTargetGroups | unverified | unverified | accepted risk | Describe* usually `*` only |
| elasticloadbalancing:DescribeLoadBalancerAttributes | unverified | unverified | accepted risk | Describe* usually `*` only |
| elasticloadbalancing:DescribeTags | unverified | unverified | accepted risk | Describe* usually `*` only |
| ssm:GetParameter | unverified | unverified | accepted risk | parameter ARN; tag key possibly listed |
| ssm:GetParameters | unverified | unverified | accepted risk | parameter ARN; tag key possibly listed |
| ssm:GetParametersByPath | unverified | unverified | accepted risk | parameter ARN; tag key possibly listed |
| ecs:DescribeTaskDefinition | unverified | unverified | accepted risk | `*` only |
| ecs:DescribeServices | unverified | unverified | accepted risk | service ARN; tag key possibly listed |

Plan 190-10 writes these rows into `infra/README.md` § Accepted risks, with "two deployments in one account" as the premise. A later change can add the tag-conditioned Deny for any action the SAR confirms. That Deny is one more in-place `plan_deny` update. Because `policy_sizes` holds `plan_deny` at 976 of 6144 characters, there is room for it.

## Checks

- `terraform -chdir=infra/modules/github-oidc test`: 18 passed, 0 failed. The 14 earlier runs pass, plus `changes_carry_resource_environment`, `trust_requires_ids`, `trust_refuses_null_repository_id` and `trust_refuses_null_owner_id`. `creates_carry_request_tags` and `plan_deny_object_reads` are tightened.
- Red first: commit 483d4afc6 holds only the tests. Against the unchanged module, `creates_carry_request_tags`, `changes_carry_resource_environment`, `plan_deny_object_reads` and `trust_refuses_null_repository_id` failed ("Missing expected failure"). `trust_requires_ids` passed, because staging already set both ids. After 7d4ab1242, all 18 pass.
- `terraform -chdir=infra/bootstrap validate`: Success. `terraform -chdir=infra/bootstrap test`: 9 passed. `terraform-checks.sh test-modules`: 3 modules. `test-bootstrap`: 1 root.
- `terraform fmt -check -recursive infra`: clean.
- `git diff MOVE_COMMIT -- main.tf policies.tf deploy-policies.tf | grep -E '^[-+] *(name|path|description) *='`: empty. `grep -c 'pipeline/\*' policies.tf`: 0. Neither id variable has `default = null`.
- `yarn test:unit:infra`: 633 passed / 6 failed. The six failures are the baseline host-only `workflow-errexit.test.ts` cases.
- `yarn lint:check`: exit 0. `yarn format:check`: exit 0.

## E2E

No local E2E project's spec, fixture, route or helper was touched, so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Task Commits

1. **Task 1 (RED)**: `483d4afc6`, tests for Environment, the own state key and the ids.
2. **Task 1 (GREEN)**: `7d4ab1242` (TIGHTEN_COMMIT): Environment in root_tags, the narrowed plan deny, and the required ids.
3. **Task 2**: no code commit. With no SAR fact confirmed, no statement was added. The update-only proof and the expected-update list are recorded above.

## Deviations from Plan

**1. [Rule 3 - Blocking] The SAR pages could not be reached.** The egress proxy refused `docs.aws.amazon.com` with a policy 403. I took the fallback the plan names: no Deny statement, every action an accepted risk, and no `plan_deny_other_deployments` run, because no statement was written.

**2. Additions:** `changes_carry_resource_environment` has a non-vacuity assertion (exactly five resource-tag-scoped statements in the network and edge policies). I also added a second null refusal for `github_repository_owner_id`, beside the planned one for `github_repository_id`. I removed the old `plan_deny_object_reads` assertion that the key lies under `pipeline/`, which the exact-key assertion replaces. The test variables now set staging's real ids, `546467466` and `115159211`.

## Accepted Risks

- The thirteen cross-deployment reads in the SAR table above: either plan role can read the other deployment's CloudFront and ALB configuration, including the origin secret header, its SSM String parameters and its ECS service and task definitions. Recorded for 190-10.
- T-190-26 is unchanged and outside this plan. Task-definition registration is on `*`, and Application Auto Scaling writes are scoped by namespace and dimension only.

## Operator note for apply 2 (190-11)

Before applying TIGHTEN_COMMIT, list the `Root=aws` resources with the Resource Groups Tagging API and confirm each carries `Environment=staging`. Any resource without the tag is refused to the deploy role after the apply. The next staging deploy after the apply is the observation.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND commits: 483d4afc6, 7d4ab1242
- FOUND: infra/modules/github-oidc/{main,variables,policies,deploy-policies}.tf contain the change; `Environment = var.environment` count 1 in deploy-policies.tf; `local.pipeline_state_arn` in plan_deny

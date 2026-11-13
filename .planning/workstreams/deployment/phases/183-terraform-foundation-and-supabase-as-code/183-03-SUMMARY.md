---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 03
subsystem: infra
tags: [terraform, aws, iam, oidc, github-actions, modules]

requires:
  - phase: 183-01
    provides: "AWS provider lock hashicorp/aws 6.68.0 under ~> 6.60 (infra/envs/staging/aws/.terraform.lock.hcl) and the plugin cache holding that build"
provides:
  - "infra/modules/github-oidc: aws_iam_openid_connect_provider.github (aud sts.amazonaws.com, no thumbprints); aws_iam_role.plan (<prefix>-plan) and aws_iam_role.deploy (<prefix>-<environment>-deploy) under var.iam_path; StringEquals-only trust on :aud, :sub and optional :repository_id / :repository_owner_id"
  - "aws_iam_role_policies_exclusive.plan / .deploy with policy_names = []"
  - "Four customer-managed policies (tfstate_pipeline, ecr_push, plan_deny, plan_lock) and five aws_iam_role_policy_attachment resources (plan: ReadOnlyAccess, plan_deny, plan_lock; deploy: tfstate_pipeline, ecr_push)"
  - "Outputs oidc_provider_arn, plan_role_arn, plan_role_name, deploy_role_arn, deploy_role_name"
affects: [183-09, 183-14, 183-16, 185, 187]

estimate:
  tokens: 50000
  tasks: 2
actuals:
  tokens: 3268     # chars/4 over the four committed module files (13071 chars)
  tasks: 2
  commits: 2

plan_head_before: 93c7dd29615f548e42d718a137b863e4e48f933b
plan_head_after: ec4a0923e966dc21a8c5a1f4fa189a62a85b6fc8

tech-stack:
  added: []
  patterns:
    - "Every IAM permission is a customer-managed policy built from aws_iam_policy_document and attached per role; roles carry only the trust policy"
    - "Exact-subject variables guarded by a validation block (non-empty, repo: prefix, no * or ?)"
    - "Optional exact-match trust conditions emitted by dynamic blocks only when the id variable is set"

key-files:
  created:
    - infra/modules/github-oidc/main.tf
    - infra/modules/github-oidc/policies.tf
    - infra/modules/github-oidc/variables.tf
    - infra/modules/github-oidc/outputs.tf
  modified: []

key-decisions:
  - "Module validated against hashicorp/aws 6.68.0 by seeding its ignored lock from the staging root and running init -lockfile=readonly (same as 183-02)"
  - "Every policy statement carries a sid (not specified by the plan; readable in the applied policy and the simulator output)"
  - "The tfstate_pipeline list permission is StringEquals s3:prefix = the state key only; the backend's env:/ workspace listing is refused and tolerated by Terraform 1.16.5 per its source, not observed"

patterns-established:
  - "IAM modules declare no inline policy and keep each role inline-free with an empty role-policies-exclusive resource"

requirements-completed: []  # INFRA-17 is code-complete for this module; it closes with the guard (183-09) and the account inventory, and PIPE-01 closes in phase 187.

duration: 4min
completed: 2026-10-18
status: complete
---

# Phase 183 Plan 03: GitHub OIDC module Summary

**A credential-free, validated module holding the GitHub OIDC provider, a read-only plan role and an environment-bound deploy role, trusted by exact `StringEquals` matches only and given every permission through four customer-managed policies and five per-role attachments, with no inline policy anywhere.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-18T20:31:57Z
- **Completed:** 2026-10-18T20:36Z
- **Tasks:** 2
- **Files:** 4 created

## Accomplishments

- `main.tf`: the OIDC provider (`client_id_list = ["sts.amazonaws.com"]`, no thumbprint list); `plan_trust` and `deploy_trust` documents with `sts:AssumeRoleWithWebIdentity`, the provider as `Federated` principal, `StringEquals` on `:aud` and `:sub`, and two `dynamic "condition"` blocks each for `:repository_id` and `:repository_owner_id` emitted only when set. Eight condition tests in the file, all `StringEquals` (awk check passes: `8 8`). Roles `openvaa-plan` and `openvaa-staging-deploy` (with `name_prefix = "openvaa"`, `environment = "staging"`) under `/openvaa/`; neither sets an inline or managed-ARN argument. Two `aws_iam_role_policies_exclusive` with `policy_names = []`.
- `variables.tf`: all eleven variables with descriptions. `terraform console` with a tfvars file showed the subject validation accepting `repo:OpenVAA/voting-advice-application:pull_request` and refusing `repo:OpenVAA/*:…`, `repo:OpenVAA/x?:…`, `[]` and a value without `repo:`.
- `policies.tf`: `tfstate_pipeline` (`openvaa-tfstate-staging-aws`: `s3:ListBucket` with `StringEquals s3:prefix = pipeline_state_key`; Get/Put on the state key; Get/Put/Delete on `<key>.tflock`), `ecr_push` (six push actions on the repository ARN, `ecr:GetAuthorizationToken` on `*`), `plan_deny` (Deny `s3:GetObject`/`s3:GetObjectVersion` on `<bucket>/hand/*`; Deny `secretsmanager:GetSecretValue`, `secretsmanager:BatchGetSecretValue`, `kms:Decrypt` on `*`), `plan_lock` (Put/Delete on the lock object only). Every `aws_iam_policy` sets `path = var.iam_path`. Five `aws_iam_role_policy_attachment`; the account-wide exclusive attachment form is not used.
- The comment above `tfstate_pipeline` states what was read: the documentation's `s3:prefix` condition, and `internal/backend/remote-state/s3/backend_state.go` at v1.16.5 (`Workspaces`: one `ListObjectsV2` with prefix `env:/`, refusal tolerated under the default prefix). It says the policy does not admit that list call. The comment check passes on `policies.tf` and, as a red control, fails (exit 1) on `main.tf`.
- Verification: `init -backend=false` + `validate` print "Success! The configuration is valid." with `hashicorp/aws` 6.68.0 (`.terraform/providers/…/aws/6.68.0`, lock byte-identical to the staging root's); `terraform fmt -check infra/modules/github-oidc` exit 0; the four-policies/five-attachments/five-resource-types check exit 0; `grep -rn inline` shows two comment lines only; no banned resource name, planning path, phase number or decision id in any file; `yarn assert:no-candidate-app-names` 3119 files, 0 findings.

## Open until phase 187 first assumes a role

Three statements are not observed and are written nowhere as fact:

1. Whether S3 reports a missing state object or lock object as not found or as forbidden to a principal whose list permission carries the `s3:prefix = <state key>` condition (the first plan before any state exists, and every lock acquisition, hit this).
2. Whether a Terraform version after 1.16.5 keeps tolerating the refused `env:/` workspace listing.
3. Whether AWS-managed `ReadOnlyAccess` lets a plan read everything the pipeline root's resources need.

Plan 183-16 runs the policy simulator over the named calls for both roles; that shows the policy decisions, not the backend's behaviour.

**Fallback, if a call the backend needs is refused when a workflow first uses a role:** a one-line change in `infra/modules/github-oidc/policies.tf` and a hand apply of the bootstrap root, either

- add `"env:/"` to the `s3:prefix` values of the `ListStateKey` statement (workspace listing), or
- replace the `StringEquals` on `s3:prefix` with a `StringLike` match on the state key and on the key followed by `.tflock` (missing-object case).

Note that a `StringLike` there is a resource-policy condition, not a trust condition, so it does not touch the exact-match ruling on the trust policies.

## Task Commits

1. **Task 1: provider, trust policies, roles** - `bc0e7c145` (feat)
2. **Task 2: managed policies, attachments, outputs** - `ec4a0923e` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A bare module init would resolve hashicorp/aws 6.69.1, not the locked 6.68.0**
- **Found during:** Task 1 (known from 183-02)
- **Fix:** Seeded the module's ignored `.terraform.lock.hcl` from `infra/envs/staging/aws/.terraform.lock.hcl` and ran `init -backend=false -lockfile=readonly`; then the plan's literal verify commands. `cmp` shows the lock unchanged; the installed provider is 6.68.0. Nothing tracked changed; the lock and `.terraform/` are ignored (`!!`).
- **Commit:** n/a

None other: the plan was otherwise executed as written. Statement `sid`s were added for readability.

## Known Stubs

None. The module is not yet called from a root; plan 183-14 wires it into the bootstrap root. `github_repository_id` and `github_repository_owner_id` default to `null` by design (threat T-183-10): phase 187 sets them after a first assumption works.

## Threat Flags

None. Every surface is in the plan's register (T-183-09 to T-183-14, T-183-SC) and each mitigation is present as a declared argument.

## Self-Check: PASSED

- FOUND: infra/modules/github-oidc/{main,policies,variables,outputs}.tf
- FOUND commits: bc0e7c145, ec4a0923e (ancestors of HEAD)
- `commits: 2` measured with `git rev-list --count 93c7dd296..HEAD` before this SUMMARY's commit

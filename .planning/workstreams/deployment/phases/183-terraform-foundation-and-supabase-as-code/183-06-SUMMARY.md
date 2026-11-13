---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 06
subsystem: infra
tags: [terraform, aws, bootstrap, oidc, budget, state-bucket, registry]

requires:
  - phase: 183-02
    provides: "infra/modules/state-bucket and infra/modules/registry (bucket_arn, repository_arn, repository_url outputs)"
  - phase: 183-03
    provides: "infra/modules/budget (sensitive alert_email) and infra/modules/github-oidc (plan/deploy roles, subject validation)"
  - phase: 183-01
    provides: "infra/envs/staging/aws root shape, its backend key and the 6.68.0 lock file"
provides:
  - "infra/bootstrap: hand-applied account-level root calling module.state_bucket, module.registry, module.budget, module.github_oidc; no resource of its own"
  - "infra/bootstrap/backend.tf: the literal S3 backend alone (bucket openvaa-tfstate-471112560111, key hand/bootstrap/terraform.tfstate), so a backend_override.tf or moving the file aside gives a local-state first apply"
  - "Variables aws_account_id, aws_region, name_prefix, iam_path, state_bucket_name, registry_name, budget_limit_usd, alert_email (sensitive, no default), deploy_environment, plan_subjects, deploy_subjects, github_repository_id, github_repository_owner_id (default null), pipeline_state_key"
  - "Outputs state_bucket_name, registry_url, registry_arn, oidc_provider_arn, plan_role_arn, plan_role_name, deploy_role_arn, deploy_role_name, budget_name"
  - "infra/bootstrap/terraform.tfvars (tracked, no address) and example.tfvars (forker's id-bearing subject form, never auto-loaded)"
affects: [183-11, 183-14, 183-16, 187]

estimate:
  tokens: 48000
  tasks: 2
actuals:
  tokens: 2691     # chars/4 over the seven committed files (10765 chars, lock file included)
  tasks: 2
  commits: 2

plan_head_before: 25bd173c8cc8f0d4fc895a75dff5b61c5f7fd8f1
plan_head_after: 2a6741e66c3350b2b3ae64e7f2b664a0529409ca

tech-stack:
  added: []
  patterns:
    - "A root whose own bucket holds its state keeps the backend block alone in backend.tf, so the first apply can override or set aside exactly one file"
    - "A forker's variable file is named example.tfvars, which Terraform never loads by itself"

key-files:
  created:
    - infra/bootstrap/backend.tf
    - infra/bootstrap/main.tf
    - infra/bootstrap/variables.tf
    - infra/bootstrap/outputs.tf
    - infra/bootstrap/terraform.tfvars
    - infra/bootstrap/example.tfvars
    - infra/bootstrap/.terraform.lock.hcl
  modified: []

key-decisions:
  - "The alert address is a root variable with sensitive = true and no default; neither tfvars file assigns it (rests on the open follow-up 183-R2; if overruled, 183-14 adds it and the no-@ check of terraform.tfvars stops applying)"
  - "example.tfvars uses deploy_environment = \"production\" and pipeline_state_key = \"pipeline/production/aws/terraform.tfstate\" to match the plan's environment:production example subject, and shows the two optional numeric-id inputs commented out"
  - "Root variables carry no validation of their own; the github-oidc module's subject validation (repo: prefix, no wildcards) is the single check"

patterns-established:
  - "Type-checking tracked tfvars without credentials: copy the root and modules to a scratch dir, drop backend.tf, init with -lockfile=readonly, evaluate the variables in terraform console"

requirements-completed: []  # INFRA-15 and INFRA-17 close when 183-16 applies the root; this plan only writes it

duration: 4min
completed: 2026-10-18
status: complete
---

# Phase 183 Plan 06: The bootstrap root Summary

**`infra/bootstrap`, the hand-applied account root, wires the state bucket, ECR registry, the $100 monthly budget (alert address only via `TF_VAR_alert_email`) and the GitHub OIDC plan/deploy roles. It keeps its literal S3 backend (`hand/bootstrap/terraform.tfstate`) alone in `backend.tf` so the first apply can run on local state. It validates with no credentials against the locked aws 6.68.0.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-18T20:46:59Z
- **Completed:** 2026-10-18T20:51Z
- **Tasks:** 2
- **Files:** 7 created

## Accomplishments

- `backend.tf`: one `terraform` block holding only `backend "s3"` (bucket `openvaa-tfstate-471112560111`, key `hand/bootstrap/terraform.tfstate`, `eu-north-1`, `encrypt`, `use_lockfile`). The comment explains the local-state first apply (an untracked `backend_override.tf`, already covered by the `*_override.tf` ignore entry, or moving the file aside), then `init -migrate-state`. It cites no decision.
- `main.tf`: `required_version = ">= 1.10"`, `hashicorp/aws ~> 6.60`, no backend. The provider has `allowed_account_ids` and default tags `Project/Environment = "shared"/Root = "bootstrap"/ManagedBy`. Exactly four module calls, with `state_bucket_arn = module.state_bucket.bucket_arn` and `registry_arn = module.registry.repository_arn` feeding `module.github_oidc`, and the budget named `"${var.name_prefix}-monthly"`. There is no `resource` line.
- `variables.tf`: the 14 variables of the plan. `alert_email` has `sensitive = true` and no default. The two GitHub ids default to `null`.
- `outputs.tf`: the nine outputs. None is sensitive.
- `terraform.tfvars`: the tracked values from the plan, including the two name-based subjects, `budget_limit_usd = 100` with the first-apply override comment, and `pipeline_state_key = "pipeline/staging/aws/terraform.tfstate"`, which is byte-equal to the backend key of `infra/envs/staging/aws/main.tf`. It contains no `@`.
- `example.tfvars`: account `000000000000`, bucket `openvaa-tfstate-000000000000`, and the id-bearing subjects `repo:EXAMPLE-ORG@1234567/EXAMPLE-REPO@7654321:pull_request` and `…:environment:production`. Comments explain the pre/post-2026-07-15 subject forms and that a fork gets the id-bearing one, and say the alert address comes from `TF_VAR_alert_email`.
- `.terraform.lock.hcl`: a byte-identical copy of the staging aws lock (`cmp` exit 0).

## Verification

- Task 1 verify: `fmt -check`, one `backend "s3"` in `backend.tf`, no backend and four modules in `main.tf`. Exit 0.
- Task 2 verify 1: `init -backend=false -input=false -lockfile=readonly` exit 0. `validate` printed "Success! The configuration is valid." `fmt -check -recursive infra/bootstrap` exit 0.
- Task 2 verify 2: `cmp` of the lock, no `@` in `terraform.tfvars`, bucket name equal in `backend.tf` and `terraform.tfvars`, `pipeline_state_key` non-empty and equal to the staging aws backend key. Exit 0.
- I ran `git check-ignore -q` once per path for the two tfvars files and the lock. Each exit is 1, so all three are tracked.
- Extra: I type-checked both variable files in a scratch copy (root plus modules, `backend.tf` removed, `-lockfile=readonly`) with `terraform console -var-file=…`. Both evaluate, and the module's subject validation accepts both subject forms. The scratch copy was then deleted.
- Hygiene: a grep of the seven files for planning paths, the phase number, decision ids and banned resource-type names found nothing. `git status --porcelain infra/bootstrap` was empty after the two commits.

## Task Commits

1. **Task 1: backend, provider, the four module calls, variables and outputs** - `ea74dc7cc` (feat)
2. **Task 2: tracked inputs, forker's example inputs, lock file, validation** - `2a6741e66` (feat)

## Deviations from Plan

None. The plan was executed as written. One choice the plan left open: `example.tfvars` sets `deploy_environment` and `pipeline_state_key` to production values so they match the plan's `environment:production` example subject (recorded under key-decisions).

## Threat Flags

None. The root adds no surface beyond the plan's threat model. T-183-27 is mitigated by the literal backend and verify 2. T-183-54 holds because every IAM resource comes from `module.github_oidc` and this root has no resource of its own. T-183-SC holds because the lock was copied and init ran with `-lockfile=readonly`.

## Known Stubs

None.

## Self-Check: PASSED

- All seven files exist under `infra/bootstrap/`.
- Commits `ea74dc7cc` and `2a6741e66` are ancestors of HEAD.

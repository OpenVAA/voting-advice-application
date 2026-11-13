---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 02
subsystem: infra
tags: [terraform, aws, s3, ecr, budgets, modules]

requires:
  - phase: 183-01
    provides: "AWS provider lock hashicorp/aws 6.68.0 under ~> 6.60 (infra/envs/staging/aws/.terraform.lock.hcl) and the plugin cache holding that build"
provides:
  - "infra/modules/state-bucket: aws_s3_bucket.this (prevent_destroy), versioning, AES256 SSE, four public-access blocks, BucketOwnerEnforced, TLS-only bucket policy from data.aws_iam_policy_document.tls_only; outputs bucket_name, bucket_arn"
  - "infra/modules/registry: aws_ecr_repository.frontend (IMMUTABLE tags, scan_on_push, force_delete=false) and aws_ecr_lifecycle_policy.frontend (untagged expiry, keep newest max_images); outputs repository_name, repository_arn, repository_url; README stating the rollback limit"
  - "infra/modules/budget: aws_budgets_budget.monthly (COST, MONTHLY, ACTUAL 80 % + FORECASTED 100 % mailed to var.alert_email); alert_email sensitive with no default; include_credits default false; output budget_name"
affects: [183-14, 183-16, 185, 187]

estimate:
  tokens: 45000
  tasks: 3
actuals:
  tokens: 1955     # chars/4 over the ten committed module files (7821 chars)
  tasks: 3
  commits: 3

plan_head_before: 49a031a3ce11a869a26482677f274006ab843bf4
plan_head_after: 0d4dce51abf688ec63fd57d8201e1fa48e30dbd9

tech-stack:
  added: []
  patterns:
    - "Each module repeats the root terraform block: required_version >= 1.10, hashicorp/aws ~> 6.60"
    - "Module validation against the locked build: copy the staging root's lock into the (ignored) module lock, init -backend=false -lockfile=readonly"

key-files:
  created:
    - infra/modules/state-bucket/main.tf
    - infra/modules/state-bucket/variables.tf
    - infra/modules/state-bucket/outputs.tf
    - infra/modules/registry/main.tf
    - infra/modules/registry/variables.tf
    - infra/modules/registry/outputs.tf
    - infra/modules/registry/README.md
    - infra/modules/budget/main.tf
    - infra/modules/budget/variables.tf
    - infra/modules/budget/outputs.tf
  modified: []

key-decisions:
  - "Module validation was done against hashicorp/aws 6.68.0 by seeding each module's ignored lock file from the staging root's lock; a bare init -backend=false picked 6.69.1 from the plugin cache"
  - "The TLS-only statement carries sid DenyInsecureTransport (not specified by the plan; harmless and readable in the applied policy)"
  - "include_refund follows include_credits (one switch), as the plan specifies"

patterns-established:
  - "Bootstrap modules hold no IAM identity policy; the bucket policy is a resource policy"

requirements-completed: []  # Budget module is the code half of INFRA-15; the requirement closes when the applied budget is observed.

duration: 3min
completed: 2026-10-18
status: complete
---

# Phase 183 Plan 02: Bootstrap modules (state bucket, registry, budget) Summary

**Three credential-free, validated Terraform modules: a hardened state bucket (versioned, AES256, fully private, TLS-only, prevent_destroy), an ECR repository with immutable tags and a bounded lifecycle, and a monthly cost budget alerting at 80 % actual and 100 % forecast to a sensitive, default-less address.**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-10-18T20:28:01Z
- **Completed:** 2026-10-18T20:30Z
- **Tasks:** 3
- **Files:** 10 created

## Accomplishments

- `infra/modules/state-bucket`: six `aws_s3_bucket*` resources named `this` plus `data.aws_iam_policy_document.tls_only` (Deny, principal `*`, `s3:*`, bucket ARN and `/*`, `Bool aws:SecureTransport = false`). The bucket policy `depends_on` the public-access block. One comment line says a bucket policy is a resource policy and so outside the inline-policy rule.
- `infra/modules/registry`: immutable tags, scan on push, no force delete; lifecycle rule 1 expires untagged images after `untagged_expiry_days` (7), rule 2 (`tagStatus any`, highest priority as ECR requires) keeps the newest `max_images` (50). The comment says tags are immutable; it does not claim the refusal of a second push was seen.
- `infra/modules/budget`: the two notifications exactly as specified, `cost_types` driven by `include_credits` (default `false`), no comment on how or when an alert fires.
- Each module: `init -backend=false` + `validate` print "Success! The configuration is valid."; `terraform fmt -check` exit 0. The README passes `prettier --check` and names `max_images` and the rollback limit.
- The `alert_email` awk check passes, and two red controls (a copy with a `default`, a copy without `sensitive`) both make it exit 1.
- No file cites a planning path, phase number or decision id, and none holds an address (grep exit 1). `yarn assert:no-candidate-app-names`: 3115 files, 0 findings.
- Module lock files and `.terraform/` are ignored (`git status --ignored` shows them as `!!`); none is committed.

## Limit for phases 185 and 187: rollback depth of the registry

Tags are immutable, so every deployment adds an image. The lifecycle policy keeps only the newest `max_images` (default 50) images. An expired image cannot be deployed again, so `max_images` bounds how far back a rollback can reach. The default is kept at 50 and the limit is recorded, not raised. Whoever builds the deployment pipeline (phase 185) and the rollback path (phase 187) must keep `max_images` above the number of images pushed within the window a rollback has to cover, or raise it.

## Task Commits

1. **Task 1: state bucket module** - `aeef4218e` (feat)
2. **Task 2: image registry module** - `af325d17b` (feat)
3. **Task 3: budget module** - `0d4dce51a` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A bare module init resolved hashicorp/aws 6.69.1, not the locked 6.68.0**
- **Found during:** Task 1
- **Issue:** The plugin cache holds both 6.68.0 and 6.69.1 (183-01 left the latter). With no lock file, `init -backend=false` in a module picked the newest match, 6.69.1. The threat model (T-183-SC) expects module inits to use the locked 6.68.0.
- **Fix:** Before validating, each module's ignored `.terraform.lock.hcl` was seeded from `infra/envs/staging/aws/.terraform.lock.hcl` and initialised with `-lockfile=readonly`. Init reported "Using hashicorp/aws v6.68.0 from the shared cache directory", and `cmp` showed the lock unchanged. The plan's literal verify commands were then run and passed. Nothing tracked changed; the lock files remain ignored and uncommitted.
- **Files modified:** none tracked
- **Commit:** n/a

None other: the plan was otherwise executed as written.

## Open follow-up

- 183-R2 (the alert address is given per session as `TF_VAR_alert_email` and never tracked) remains the recommended, unruled answer. If overruled, this module does not change; plan 183-14 writes the address into the bootstrap root's variable file.

## Known Stubs

None. The modules are not yet called from a root; plan 183-14 wires them into the bootstrap root.

## Threat Flags

None. Every surface added is in the plan's threat register (T-183-05 to T-183-08, T-183-SC), and each listed mitigation is present as a declared argument.

## Self-Check: PASSED

- FOUND: all ten files under infra/modules/{state-bucket,registry,budget}
- FOUND commits: aeef4218e, af325d17b, 0d4dce51a (ancestors of HEAD)
- `commits: 3` measured with `git rev-list --count 49a031a3c..HEAD` before this SUMMARY's commit

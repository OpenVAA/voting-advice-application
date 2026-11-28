---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 06
subsystem: infra
tags: [supabase, terraform, edge-functions, secrets, smtp]
status: complete

requires: []
provides:
  - "infra/modules/supabase/function-secrets.tf: resource supabase_edge_function_secrets.this (count gated on public_project_id), local.function_secret_names"
  - "Module variable public_project_id (string, default null, lower-case canonical uuid validation)"
  - "Module output managed_function_secret_names (sorted names, empty while public_project_id is null)"
  - "Staging and example roots: variable public_project_id, passed to the module; output managed_function_secret_names"
  - "Example terraform.tfvars: public_project_id = 00000000-0000-0000-0000-000000000001"
affects: [184-07, 184-09, 184-20]

actuals:
  tokens: 1800
  tasks: 2
  commits: 2
plan_head_before: 7664464d44b56062be642f715758444f9408c911
plan_head_after: 199e501548aba539633fda8e72b77f5c44fcca56

tech-stack:
  added: []
  patterns:
    - "A sensitive-valued set built as concat of an always-present list and a `cond ? [] : [...]` list of same-shaped objects; a parallel locals list of literal names carries no sensitive mark and feeds the output"

key-files:
  created:
    - infra/modules/supabase/function-secrets.tf
  modified:
    - infra/modules/supabase/variables.tf
    - infra/modules/supabase/outputs.tf
    - infra/envs/staging/supabase/main.tf
    - infra/envs/staging/supabase/variables.tf
    - infra/envs/example/supabase/main.tf
    - infra/envs/example/supabase/variables.tf
    - infra/envs/example/supabase/terraform.tfvars

key-decisions:
  - "Function secrets live in the module, one supabase_edge_function_secrets per project, gated on public_project_id (null = resource absent)"
  - "SMTP_HOST/PORT/FROM come from var.smtp (host, port, admin_email) and SMTP_USER/PASS from smtp_user/smtp_password: the functions' port and Auth's port are one value"
  - "No IDENTITY_PROVIDER_* and no SUPABASE_* secret is set; identity-callback fails closed until a deployment sets its provider secrets"
  - "The root-level public_project_id carries no validation of its own; the module's validation is the one check"

patterns-established:
  - "Module outputs expose secret names only, never values"

requirements-completed: []  # SUPA-05 is shared by nine plans of this phase and covers the deployment itself; this plan contributes the Terraform resource, not yet applied

duration: about 10 min
completed: 2026-10-26
---

# Phase 184 Plan 06: Edge Function secrets in the Supabase module Summary

**The Supabase module now sets the Edge Functions' secrets (`PUBLIC_PROJECT_ID`, `SITE_URL`, and the five `SMTP_*` names when `smtp` is set) through one `supabase_edge_function_secrets` resource, deriving the SMTP values from the same variables the Auth SMTP settings use; staging and example roots pass `public_project_id` through.**

## Performance

- **Duration:** about 10 min
- **Completed:** 2026-10-26
- **Tasks:** 2
- **Files:** 1 created, 7 modified

## Accomplishments

- `infra/modules/supabase/function-secrets.tf`: `supabase_edge_function_secrets.this` with `count = var.public_project_id == null ? 0 : 1`, `project_ref = supabase_project.this.id`, and `secrets` = `PUBLIC_PROJECT_ID` + `SITE_URL` always, plus `SMTP_HOST` (`var.smtp.host`), `SMTP_PORT` (`var.smtp.port`), `SMTP_FROM` (`var.smtp.admin_email`), `SMTP_USER` (`var.smtp_user`), `SMTP_PASS` (`var.smtp_password`) when `var.smtp` is non-null. The header comment states: only writer; SMTP values shared with Auth; no identity-provider secret so `identity-callback` refuses calls; values in state in plain text, hence the encrypted bucket.
- `public_project_id` module variable (null default, uuid validation) and `managed_function_secret_names` output (sorted names; `[]` when null).
- Both roots pass `public_project_id = var.public_project_id` after `smtp_password` and expose `managed_function_secret_names`; the example tfvars shows the bootstrap's default id. Staging `terraform.tfvars` untouched (plan 184-20 writes it).

## Evaluated checks (beyond validate)

`terraform console` on the module (no state, no credential):
- with `public_project_id` and `smtp` set: `sort(local.function_secret_names)` = the seven names;
- with neither: `["PUBLIC_PROJECT_ID", "SITE_URL"]` and the output branch gives `[]` for null id;
- `public_project_id = "...00A"` (upper case) is refused with the validation message.

## Task Commits

1. **Task 1: The function secrets in the module** - `1b3113c12` (feat)
2. **Task 2: Wire the staging and example roots** - `199e50154` (feat)

## Verification

- Module: `terraform init -backend=false` + `validate` OK; `terraform fmt -check -recursive infra` clean.
- Roots: `init -backend=false -lockfile=readonly` + `validate` OK for staging and example (see deviation 2 for how).
- `infra/scripts/check-settings-types.sh`: four cases hold.
- `node scripts/assert-hosted-settings-parity.mjs`: green (15 HCL-owned keys, 5 .tf files); `--self-test`: 98 cases passed.
- `node scripts/assert-no-inline-iam-policies.mjs`: 0 findings.
- Acceptance greps: resource count 1; `IDENTITY_PROVIDER` outside comments 0; `var.smtp.port` 1; `variable "public_project_id"` 1; `managed_function_secret_names` in outputs 1; example tfvars `^public_project_id` 1, staging 0; no `"SUPABASE_` name.

## Deviations from Plan

**1. [Acceptance grep literal vs. terraform fmt] `public_project_id = var.public_project_id`**
- The literal single-space grep counts 0 in both roots, because `terraform fmt` aligns the `=` with the module block's other arguments (`public_project_id        = var.public_project_id`). The spaced form counts 1 in each file; `fmt -check` requires the alignment, so the intent is met.

**2. [Rule 3 - Blocking, environmental] Staging root validated with a scratch `TF_DATA_DIR`**
- `terraform -chdir=infra/envs/staging/supabase init -backend=false` failed with "No valid credential sources found": the operator's `.terraform/terraform.tfstate` in that root records an initialised S3 backend, and init tried to reach it. Not caused by this plan's change (UNCONFIRMED as to the exact init code path).
- Fix: ran the same `init -backend=false -lockfile=readonly` and `validate` with `TF_DATA_DIR` pointing at a scratchpad directory, leaving the operator's `.terraform` untouched. Both roots validated. No files modified.

## Deferred to orchestrator (stack busy)

None: the plan needs no stack and no unit suite.

## Threat Flags

None beyond the plan's register: T-184-17 (SMTP_PASS in state, accepted, stated in the file header), T-184-18 (no `IDENTITY_PROVIDER_*`, grep-verified), T-184-19 (one resource per project), T-184-SC (no new provider; roots initialised with `-lockfile=readonly`).

## Next Phase Readiness

- Plan 184-07 can apply the module with `public_project_id` on the throwaway; plan 184-20 sets the staging value with the measured SMTP port.
- Nothing applied here.

## Self-Check: PASSED

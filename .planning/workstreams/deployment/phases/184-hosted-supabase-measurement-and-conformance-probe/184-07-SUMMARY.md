---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 07
subsystem: infra
tags: [supabase, terraform, scratch, faults, smtp, import]
status: complete

requires:
  - "184-06: module variable public_project_id and output managed_function_secret_names"
  - "184-02: the batched-break fault table (incl. hook_send_email_enabled false)"
provides:
  - "Ruled PUBLIC_PROJECT_ID: 00000000-0000-0000-0000-000000000001 on the throwaway and the persistent project"
  - "Scratch root: import block keyed on var.project_ref; module inputs auth_rate_limits, smtp, smtp_user, smtp_password, public_project_id; output managed_function_secret_names"
  - "Scratch tfvars: project_ref suxeqyhafjueinxnojge, public_project_id canonical, smtp object with port \"2587\""
  - "infra/envs/scratch/supabase/faults.tf: variable fault_set (none|redirect|all), locals fault_auth_redirect / fault_auth_all / fault_api_all, resource supabase_settings.faults[0]"
affects: [184-08, 184-09, 184-17, 184-18, 184-20]

actuals:
  tokens: 2400
  tasks: 3
  commits: 2
plan_head_before: 7727a53a7fb5d11e3723886149dae18cf9beaf98
plan_head_after: 3ddc84307cdfdb3e689a3cd1febcd1876f3e6547

tech-stack:
  added: []
  patterns:
    - "Root-only fault resource selected by a validated command-line variable; each branch jsonencoded before the conditional so no type unification happens"
    - "Offline console checks of a root with a local backend: TF_DATA_DIR and -backend-config=path both in the scratchpad"

key-files:
  created:
    - infra/envs/scratch/supabase/faults.tf
  modified:
    - infra/envs/scratch/supabase/main.tf
    - infra/envs/scratch/supabase/variables.tf
    - infra/envs/scratch/supabase/terraform.tfvars

key-decisions:
  - "PUBLIC_PROJECT_ID is canonical 00000000-0000-0000-0000-000000000001 on both hosted projects (ruled by the operator, 2026-10-26)"
  - "faults.tf plants hook_send_email_enabled = false in the all set, so auth.send-email-hook fails in the batched break"
  - "The scratch root's variable declarations are copied verbatim from the staging root, so the two roots take the same inputs"

requirements-completed: []  # SUPA-05, SUPA-07, SUPA-14 are shared with later plans and need the applied throwaway; nothing is applied here

duration: about 12 min
completed: 2026-10-26
---

# Phase 184 Plan 07: Scratch root rehearses staging, with the batched-break fault file Summary

**Ruled project id: `PUBLIC_PROJECT_ID = 00000000-0000-0000-0000-000000000001` on both the throwaway and the persistent project (`canonical`, ruled by the operator, 2026-10-26).**

The scratch Supabase root now imports the throwaway by ref (`suxeqyhafjueinxnojge`) instead of creating a project. It passes the staging root's module inputs, with an SMTP object on the candidate port `"2587"`. A new `faults.tf` plants the settings faults of the batched break only when `-var fault_set=redirect|all` is given. Nothing was applied.

## Performance

- **Duration:** about 12 min
- **Completed:** 2026-10-26
- **Tasks:** 3 (1 decision, ruled in advance; 2 auto)
- **Files:** 1 created, 3 modified

## Task 1: the deployment's project id (decision)

- Ruled by the operator on 2026-10-26: **`canonical`**, i.e. `00000000-0000-0000-0000-000000000001` on both projects. No checkpoint was returned.
- Verify: `grep -c 'variable "public_project_id"' infra/modules/supabase/variables.tf` gives 1, so plan 184-06's variable is present.
- Consequence: the smoke template (184-08) needs no `projectId`, and plan 184-20 writes the same value into the staging tfvars.

## Accomplishments

- **`main.tf`**
  - The `import { to = module.supabase.supabase_project.this, id = var.project_ref }` block, with the staging root's comment.
  - The header now says that a plan against a state lacking the project imports it.
  - The module call takes `auth_rate_limits`, `smtp`, `smtp_user`, `smtp_password` and `public_project_id`, as staging's does.
  - New output `managed_function_secret_names`.
- **`variables.tf`:** `project_ref`, `auth_rate_limits`, `smtp`, `smtp_user`, `smtp_password` and `public_project_id`, copied verbatim from the staging root.
- **`terraform.tfvars`**
  - `project_ref = "suxeqyhafjueinxnojge"` and `public_project_id` with the canonical id.
  - The `smtp` object: SES eu-north-1 host; `port = "2587"`, with a comment that it is the first port tried from a hosted function and stays only if a mail arrives; `admin_email = "noreply@staging.openvaa.org"`; `sender_name = "OpenVAA"`.
  - The header names `TF_VAR_smtp_user` and `TF_VAR_smtp_password` as never written to the file.
- **`faults.tf`**
  - `fault_set` takes `none` (the default), `redirect` or `all`; any other value is refused by validation.
  - `redirect` plants `site_url` and `uri_allow_list` alone, on `planted.invalid`.
  - `all` plants every row of 184-02's fault table except the two function faults: the hooks (both off), sign-up open, autoconfirm, `smtp_port "2465"`, the OAuth flags with their path, `password_min_length 12`, `max_rows 500` and `db_schema "public"`.
  - `count = 0` under `none`; `depends_on = [module.supabase]`.
  - `api` is `null` unless `all`.
  - The header states the revert: an apply with `fault_set=none` and `-replace=module.supabase.supabase_settings.this`.

## Task Commits

1. **Task 1: The deployment's project id**: no commit (decision ruled by the operator, recorded here)
2. **Task 2: The scratch root rehearses the staging root**: `7f6a5e33a` (feat)
3. **Task 3: The fault file of the batched break**: `3ddc84307` (feat)

## Verification

- Scratch root: `init -backend=false -input=false -lockfile=readonly` passed with `TF_DATA_DIR` in the scratchpad, followed by `validate` ("The configuration is valid") and `terraform fmt -check` (exit 0). These ran after Task 2 and again after Task 3.
- `node scripts/assert-hosted-settings-parity.mjs`: exit 0 after each task, with 3 Supabase roots and 15 HCL-owned keys.
- The tfvars awk check (ref, project id, port "2587", no secret-named assignment) exits 0.
- Every planted key is in `KNOWN_HOSTED_KEYS` (13 of 13).
- `terraform console` checks:
  - `jsonencode([local.fault_api_all.max_rows, local.fault_auth_all.disable_signup, local.fault_auth_all.smtp_port])` gives `"[500,false,\"2465\"]"`. Each value evaluated alone gives `500`, `false` and `"2465"`.
  - The count expression gives 0 for `none` and 1 for `redirect` and `all`.
  - `fault_set=bogus` is refused with "fault_set must be none, redirect or all".
  - With `redirect`, `api` evaluates to null.
- `grep -rl fault_set infra/envs` gives only `infra/envs/scratch/supabase/faults.tf`; staging and example give nothing.
- Acceptance greps:
  - `^import {` gives 1.
  - `public_project_id *= var.public_project_id` gives 1.
  - `resource "supabase_settings" "faults"` gives 1.
  - `default *= *"none"` gives 1.

## Deviations from Plan

**1. [Rule 3 - Blocking, environmental] Console type check run as one expression, with the local backend in the scratchpad**
- **Found during:** Task 3 verify.
- **Issue 1:** `terraform console` needs an initialised backend, and `init -backend=false` leaves the local backend uninitialised ("Backend initialization required").
  - Fix: a second init under a scratchpad `TF_DATA_DIR`, with `-backend-config=path=<scratchpad>/none.tfstate`. No `.terraform` and no state file was written in the root.
- **Issue 2:** with three expressions piped into it, Terraform v1.16.5's console printed only the last result (`"2465"`), so the plan's literal string comparison failed even though each value is correct. The cause is UNCONFIRMED: it was observed and not traced into Terraform.
  - Fix: the equivalent check as one `jsonencode([...])` expression, plus each expression evaluated alone (results above). The types the check guards hold.
- **Files modified:** none.

## Deferred to orchestrator (stack busy)

None. The plan needs neither the stack nor the unit suite.

## Threat Flags

None beyond the plan's register:
- T-184-20: the import block is in place.
- T-184-21: `faults.tf` exists in the scratch root only (grep-verified), and `fault_set` is set on the command line only; no tfvars holds it.
- T-184-22: each fault object is jsonencoded before the conditional, and the console shows the bare types.
- T-184-SC: `init -lockfile=readonly`.

## Next Phase Readiness

- The throwaway can be imported with the staging root's inputs. Plan/apply needs `SUPABASE_ACCESS_TOKEN`, `TF_VAR_database_password`, `TF_VAR_smtp_user` and `TF_VAR_smtp_password` in the operator's shell, because the tfvars now sets `smtp`.
- Batched break: `terraform apply -var fault_set=all` plants the faults. The revert is `terraform apply -var fault_set=none -replace=module.supabase.supabase_settings.this`. The function faults (`send-email` deleted, `identity-callback` verify_jwt) are not settings and are planted outside Terraform.
- Nothing was applied.

## Self-Check: PASSED

- FOUND: infra/envs/scratch/supabase/faults.tf, main.tf, variables.tf, terraform.tfvars
- FOUND: 7f6a5e33a, 3ddc84307 (both ancestors of HEAD)

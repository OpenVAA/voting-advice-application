---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 07
subsystem: infra
tags: [terraform, supabase, staging, example, state-key]
status: complete

requires:
  - phase: 183-05
    provides: "infra/modules/supabase (variables auth_rate_limits, smtp, smtp_password; outputs project_ref, managed_auth_keys, managed_api_keys) and the scratch root's supabase 1.11.0 lock file"
  - phase: 183-01
    provides: "the literal S3 backend shape of infra/envs/staging/aws (bucket openvaa-tfstate-471112560111, eu-north-1, use_lockfile)"
provides:
  - "infra/envs/staging/supabase: persistent project's root, literal S3 backend with key hand/staging/supabase/terraform.tfstate, no AWS provider, no resource of its own"
  - "infra/envs/example/supabase: forker template, bucket REPLACE-ME-tfstate, key hand/example/supabase/terraform.tfstate, same wiring"
  - "Root variables organization_id, project_name, region, database_password (sensitive), public_origin, enable_access_token_hook (default true), auth_rate_limits (module's object type, default {}), smtp (default null), smtp_password (sensitive, default null)"
  - "Root outputs project_ref, managed_auth_keys, managed_api_keys"
  - "Tracked staging tfvars: public_origin = https://staging.openvaa.org and enable_access_token_hook = true only"
  - "Tracked example tfvars: stand-in org/name/region, https://vaa.example.org, all seven auth_rate_limits, an smtp object (port 587, user REPLACE-ME)"
affects: [183-23, 183-26, 184, 185, 187]

estimate:
  tokens: 40000
  tasks: 2
actuals:
  tokens: 3352     # chars/4 over the eight committed files (13406 chars, lock files included)
  tasks: 2
  commits: 2

plan_head_before: 514f3bf3eb07450ac7056406c97d526fa6398367
plan_head_after: 6c628081de6b0d8ca626d110c567f2a264ee1cea

tech-stack:
  added: []
  patterns:
    - "A Supabase root on an S3 backend declares no AWS provider: the backend reads AWS credentials from the shell by itself"
    - "Environment roots differ only in the backend block and the tracked tfvars; variables.tf and the module call are the same"

key-files:
  created:
    - infra/envs/staging/supabase/main.tf
    - infra/envs/staging/supabase/variables.tf
    - infra/envs/staging/supabase/terraform.tfvars
    - infra/envs/staging/supabase/.terraform.lock.hcl
    - infra/envs/example/supabase/main.tf
    - infra/envs/example/supabase/variables.tf
    - infra/envs/example/supabase/terraform.tfvars
    - infra/envs/example/supabase/.terraform.lock.hcl
  modified: []

key-decisions:
  - "The staging tfvars carries no smtp object (rests on the open follow-up 183-R5, SMTP applied in phase 184; an overrule adds the object here before 183-23)"
  - "The root's auth_rate_limits repeats the module's optional() defaults rather than a looser type, so a value the module would reject is rejected at the root with the same message shape"
  - "enable_access_token_hook stays assigned in both tracked tfvars as the plan requires, although the plan's secret-name awk matches the word token in it; the narrowed awk passes"

patterns-established:
  - "Type-checking two environment roots' tracked tfvars without credentials: copy root plus module to a scratch dir, swap the S3 backend for local, init -lockfile=readonly, evaluate var.* and module outputs one expression per console run"

requirements-completed: []  # SUPA-11 closes with the parity guard (183-26); SUPA-12 in phase 185, INFRA-19 in phase 187

duration: 4min
completed: 2026-10-18
---

# Phase 183 Plan 07: Staging and example Supabase roots Summary

**This plan adds two Supabase roots that both call the shared module. Neither declares a resource of its own and neither needs credentials to validate. The persistent staging project's root keeps its state under its own S3 key, `hand/staging/supabase/terraform.tfstate`, and its tracked inputs are only the public origin and the hook switch. The `example` root is the one a forker copies: its stand-in tfvars show every production-shaped setting, including all seven auth rate limits and an SMTP object.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-18T20:48Z
- **Completed:** 2026-10-18T20:52Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments

- `infra/envs/staging/supabase` has a literal S3 backend (`openvaa-tfstate-471112560111`, `hand/staging/supabase/terraform.tfstate`, eu-north-1, encrypt, use_lockfile). It has an empty `provider "supabase" {}` block, and its module call passes all nine module inputs. A header comment says the project is imported and never created here, that a plan showing a destroy or a replacement is never applied, and that the root is hand-applied under `hand/`.
- `infra/envs/example/supabase` has the same wiring. Its bucket is `REPLACE-ME-tfstate`, which is never read because CI initialises with `-backend=false`. Its tfvars sets all seven `auth_rate_limits` to the module's defaults, with a note that sign-in and verification limits are sized from a per-deployment measurement. Its `smtp` object uses port `"587"`, with a note that the port has to be measured for each deployment.
- The scratch, staging and example Supabase roots now have byte-identical lock files (supabase 1.11.0).

## Task Commits

1. **Task 1: The `staging/supabase` root**: `149dca235` (feat)
2. **Task 2: The `example/supabase` root**: `6c628081d` (feat)

## Verification

| Check | Result |
|---|---|
| staging: `init -backend=false -lockfile=readonly`, `validate`, `fmt -check -recursive` | exit 0 each, "Success! The configuration is valid." |
| example: same three | exit 0 each, "Success! The configuration is valid." |
| `cmp` scratch lock vs staging lock, scratch lock vs example lock | exit 0 (identical) |
| staging tfvars, plan awk `(secret\|password\|token\|key)` | exit 1, only match `enable_access_token_hook = true` (see Deviation 1) |
| staging tfvars, same awk skipping that one name | exit 0 |
| example tfvars, plan awk `(secret\|password\|token)` | exit 1, only match `enable_access_token_hook = true` (see Deviation 1) |
| example tfvars, same awk skipping that one name | exit 0 |
| `grep -c 'public_origin *= *"https://'` example tfvars | 1 |
| staging tfvars assigns exactly two variables | 2 top-level assignments: `public_origin`, `enable_access_token_hook` |
| `^resource ` lines in either main.tf | 0 |
| `git check-ignore -q`, run on each of the eight paths separately | exit 1 on all eight (tracked) |
| `git status --porcelain` on the two directories before the commits | the eight files and nothing else |
| No planning path, phase number, or decision or requirement id in any new file | grep exit 1 (none) |
| Tracked tfvars type-checked in `terraform console` (scratch copy, local backend) | staging: origin, default limits, `smtp` null, no SMTP keys or `rate_limit_email_sent` in `managed_auth_keys`. example: origin passes the module's https validation, all seven limits, `smtp` object, and `managed_auth_keys` includes `smtp_host/port/user/admin_email/sender_name` and `rate_limit_email_sent` |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Plan check self-contradiction] The tfvars secret-name awk matches `enable_access_token_hook`**
- **Found during:** Tasks 1 and 2
- **Issue:** This is the same defect 183-05 recorded. Each task's second verify runs `awk '/^[a-z_]*(secret|password|token[|key])[a-z_]* *=/…'` (Task 2 drops `key`), and that awk exits 1 on the line `enable_access_token_hook = true` because the name contains `token`. The plan's action and acceptance criteria require that assignment in both files.
- **Fix:** I kept the assignment. In each file the plan's awk exits 1 and matches only `enable_access_token_hook = true`. The same awk with `/^enable_access_token_hook *=/{next}` added first exits 0. Indented object members such as `rate_limit_token_refresh` do not match, because the pattern is anchored at column 0.
- **Heads-up:** any later guard that reuses this pattern on Supabase tfvars should exempt this one name.
- **Commit:** n/a (verification only)

**2. [Rule 2 - Verification gap] `validate` does not read tfvars, so I type-checked them separately**
- **Found during:** Task 2
- **Issue:** `terraform validate` ignores `terraform.tfvars`. Neither the type of the example's `auth_rate_limits`/`smtp` values nor the module's https check on `public_origin` would have been exercised.
- **Fix:** I copied both roots and the module to the scratchpad, swapped the S3 backend for a local one, and ran `init -lockfile=readonly`. Then I evaluated `var.*` and `module.supabase.managed_auth_keys` in `terraform console`, using stand-in `TF_VAR_` values for the four variables neither tracked file assigns. Every console run exited 0, and the results are in the Verification table. No repository file changed.
- **Commit:** n/a

---

**Total deviations:** 2 (one plan-check defect carried over from 183-05, one added check)
**Impact on plan:** none on the delivered files. Both roots match the plan.

## Issues Encountered

None.

## User Setup Required

None now. Applying `infra/envs/staging/supabase` later needs `SUPABASE_ACCESS_TOKEN`, `TF_VAR_database_password`, AWS credentials for the state bucket, and, once SMTP is added, `TF_VAR_smtp_password`. Those are later plans' operator steps.

## Next Phase Readiness

- The parity guard (183-26) can read `public_origin` from all three Supabase roots: scratch and staging use `https://staging.openvaa.org`, and example uses `https://vaa.example.org`.
- The staging root is ready for the import and apply plans. The smtp object is added in phase 184, or before 183-23 if 183-R5 is overruled.

## Threat Flags

None. Both registered threats are mitigated as planned. For T-183-26, no token or password is assigned in either tracked file, both passwords are sensitive variables, and the token is an environment variable only. For T-183-SC, no provider was added, both lock files are byte copies of the 1.11.0 lock, and both inits ran with `-lockfile=readonly`.

## Self-Check: PASSED

- FOUND: all eight files listed under key-files
- FOUND commits: 149dca235, 6c628081d (ancestors of HEAD)
- `commits: 2` measured with `git rev-list --count 514f3bf3e..HEAD` before this SUMMARY's commit

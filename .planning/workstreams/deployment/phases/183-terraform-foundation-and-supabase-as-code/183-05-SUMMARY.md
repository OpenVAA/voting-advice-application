---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 05
subsystem: infra
tags: [terraform, supabase, settings, import, parity, modules]

requires:
  - phase: 183-01
    provides: "The root shape, the ignore entries (state, .terraform/, module locks) and the plugin cache convention"
provides:
  - "infra/modules/supabase/hosted-settings.json: groups api, auth, auth_hook, redirect_callback_paths; every compared hosted value"
  - "infra/modules/supabase/settings.tf: locals hosted, auth_hook, auth_rate_limits, auth_origin, auth_smtp, auth, api (types kept)"
  - "infra/modules/supabase: supabase_project.this (prevent_destroy, ignore_changes = [database_password]), supabase_settings.this (jsonencode(local.api), jsonencode(local.auth)), supabase_settings.smtp_secret (count 0 while smtp is null); outputs project_ref, managed_auth_keys, managed_api_keys"
  - "infra/scripts/check-settings-types.sh [DIR]: three-case terraform console check of types and of JSON-to-encoded parity; exit 0/1/2"
  - "infra/envs/scratch/supabase: local-backend root over the module; tracked lock pinning supabase/supabase 1.11.0 for linux_amd64, darwin_arm64, darwin_amd64"
affects: [183-07, 183-10, 183-21, 183-22, 183-23, 183-24, 183-26, 184, 185]

estimate:
  tokens: 70000
  tasks: 3
actuals:
  tokens: 8329     # chars/4 over the eleven committed files (33314 chars, lock and evidence included)
  tasks: 3
  commits: 3

plan_head_before: c51d4daf58d73a40d5f3514978a29bdba5146aef
plan_head_after: 2b2349102f4d0a75619ae23b06daeb3833786076

tech-stack:
  added: ["supabase/supabase 1.11.0 (Terraform provider, locked)"]
  patterns:
    - "Hosted values live in a JSON file read with jsondecode(file(...)); HCL adds only environment-derived keys"
    - "Optional settings groups are for-filtered or cond ? object : null inside merge, never cond ? object : {}"
    - "A terraform console script on copied locals proves types and that the data file is what gets encoded"

key-files:
  created:
    - infra/modules/supabase/hosted-settings.json
    - infra/modules/supabase/variables.tf
    - infra/modules/supabase/settings.tf
    - infra/modules/supabase/main.tf
    - infra/modules/supabase/outputs.tf
    - infra/scripts/check-settings-types.sh
    - infra/envs/scratch/supabase/main.tf
    - infra/envs/scratch/supabase/variables.tf
    - infra/envs/scratch/supabase/terraform.tfvars
    - infra/envs/scratch/supabase/.terraform.lock.hcl
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-05-settings-keys-and-types.md
  modified: []

key-decisions:
  - "Key lookup was made against supabase/cli pkg/v1.2.3 types.gen.go: all 42 keys (27 from the JSON, 15 owned by the HCL) have their json tag inside the struct the provider decodes them into; no respelling"
  - "The two-resource SMTP split (supabase_settings.smtp_secret) is untried and handed to phase 184, which tries it on the throwaway project first; count is 0 while smtp is null"
  - "organization_id (the organisation slug) is a required project argument, so it is tracked in each Supabase root's terraform.tfvars (written by 183-21 and 183-23 after an import shows it): an addition to the tracked values the operator ruled on"
  - "enable_access_token_hook is assigned in the tracked tfvars as the plan requires, although the plan's secret-name awk matches the word token in it; the narrowed check passes"
  - "1.11.0 was the newest ~> 1.11 release on 2026-10-18, so no exact-version lock detour was needed"

patterns-established:
  - "Red controls on a copy under $TMPDIR: the setup is its own command with its status read, the guard's run is separate with its exit read on the next line"

requirements-completed: []  # SUPA-11 is the parity guard (183-26) that reads this hosted side; SUPA-02/03 close in phase 184, SUPA-12 in phase 185

duration: 5min
completed: 2026-10-18
status: complete
---

# Phase 183 Plan 05: Supabase module, hosted settings JSON and the scratch root Summary

**An import-only `supabase_project` (prevent_destroy, password never sent) and a `supabase_settings` fed by `jsonencode(local.auth)`/`jsonencode(local.api)`, where the locals merge one tracked `hosted-settings.json` with origin, hook, rate-limit and SMTP maps without the boolean-to-string trap, proven by a `terraform console` script seen failing twice; plus a local-state scratch root locking supabase/supabase 1.11.0 for three platforms.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-18T20:40:00Z
- **Completed:** 2026-10-18T20:45Z
- **Tasks:** 3
- **Files:** 11 created

## Accomplishments

- `hosted-settings.json`: exactly `api` (3 keys), `auth` (22 keys), `auth_hook` (2 keys), `redirect_callback_paths` (2 paths); no rate-limit, SMTP-connection or OAuth-server key; no prose key; Prettier-clean.
- `variables.tf`: the nine variables of the plan; `public_origin` validated against `^https://[^/?#\s]+$`; `auth_rate_limits` an object of seven optional numbers (30/30/150/30/30/30, mail 100) with `default = {}`, `nullable = false`; `smtp` object with a string port, default null; `database_password` and `smtp_password` sensitive.
- `settings.tf`: locals only. The four JSON reads are in the pinned forms (`local.hosted.api`, `local.hosted.auth` as the `merge`'s first argument on its own line, `local.hosted.auth_hook`, `local.hosted.redirect_callback_paths`). Hook keys `for`-filtered by the switch; mail limit `for`-filtered out while `smtp` is null; SMTP map is `var.smtp == null ? null : {…}`.
- `main.tf`: the provider requirement `~> 1.11`; the project block with both lifecycle protections and the comment the plan asks for; `supabase_settings.this`; `supabase_settings.smtp_secret` with `count = var.smtp == null ? 0 : 1` whose comment says the two-resource arrangement is untried. Two resource types only; no Edge Function secrets resource; `config push` appears nowhere under `infra/`. No key name owned by the JSON appears in any `.tf` file of the module (loop over the JSON's 27 keys: 0 hits).
- `check-settings-types.sh`: copies the three files to a fresh temp dir (removed on exit), evaluates `local.auth`/`local.api` raw (for `tomap(`) and `jsonencode(...)` (parsed with `jq`) in three cases; names each finding's key. Missing `jq`/`terraform`, a missing input file, or an expression that fails to evaluate is exit 2; `--bogus` is exit 2.
- Red controls (evidence file): trap form `cond ? local.hosted.auth_hook : {}` → exit 1, `hook_custom_access_token_enabled holds a quoted boolean or number`; auth group dropped from the `merge` → exit 1, all 22 auth keys named missing; the module → exit 0.
- Key lookup made (see evidence): every key's `json:"…"` tag is inside `UpdateAuthConfigBody` or `V1UpdatePostgrestConfigBody`, types agree (`smtp_port` string, `password_required_characters` enum including `""`).
- Scratch root: `backend "local" {}`, empty `provider "supabase" {}`, `module "supabase"` from `../../../modules/supabase`, three outputs; tfvars assigns only `public_origin = "https://staging.openvaa.org"` and `enable_access_token_hook = true` with the comment the plan asks for. `init -backend=false -lockfile=readonly` and `validate` pass ("Success! The configuration is valid."), `fmt -check -recursive` exit 0, porcelain of the root unchanged by the read-only init. `terraform.tfstate` and `.terraform/` are ignored; `terraform.tfvars` and `.terraform.lock.hcl` are tracked (each `git check-ignore -q` exit 1, run per path).

## Task Commits

1. **Task 1: hosted settings JSON, variables, merging locals, type check** - `3850c8cc8` (feat)
2. **Task 2: project and settings resources, outputs** - `b9ed54441` (feat)
3. **Task 3: scratch root and the 1.11.0 lock** - `2b2349102` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Plan check self-contradiction] The tfvars secret-name awk matches `enable_access_token_hook`**
- **Found during:** Task 3
- **Issue:** The verify `awk '/^[a-z_]*(secret|password|token|key)[a-z_]* *=/…'` fails on the line `enable_access_token_hook = true` (the word `token`), while the action and the acceptance criteria require exactly that assignment.
- **Fix:** Kept the assignment (action and acceptance are explicit). Ran the plan's awk (exit 1, its only match `enable_access_token_hook = true`) and the same awk with that one name skipped (exit 0). The file assigns exactly two variables.
- **Heads-up:** plan 183-07 runs the same awk on `infra/envs/staging/supabase/terraform.tfvars`; if that file also assigns the hook switch, the check will trip the same way, and any later guard reusing the pattern should exempt this name.
- **Commit:** n/a

**2. [Rule 3 - Blocking] `providers lock` refuses to run before the module is installed**
- **Found during:** Task 3
- **Fix:** Ran `init -backend=false -input=false` first (writes `.terraform/` and a darwin_arm64 lock), then the plan's `providers lock` for the three platforms. The newest `~> 1.11` release was 1.11.0, so the constraint stayed `~> 1.11` throughout.
- **Commit:** 2b2349102 (the lock file)

**3. [Rule 3 - Tooling] Multi-path `git check-ignore -q` exits 128 on this Git**
- **Fix:** Ran it per path (as in 183-04): `terraform.tfstate` 0, `.terraform` 0, `terraform.tfvars` 1, `.terraform.lock.hcl` 1.
- **Commit:** n/a

## Open until the throwaway import (183-21 onward) and phase 184

Unobserved, written nowhere as fact:

1. The exact strings the hosted API returns for `db_schema` and `uri_allow_list` (a rewritten string gives a plan that never empties).
2. That `ignore_changes = [database_password]` yields an empty plan for the imported project (183-22 reads the first plan).
3. That two `supabase_settings` resources work side by side for one project: untried, handed to phase 184, which tries it on the throwaway project before the persistent one.
4. Whether the hosted API accepts the mail rate limit before SMTP is set (the module sends it only with SMTP).

## Additions for the operator to see

- `organization_id`, the organisation slug, is a required argument of the project resource, so it is tracked in each Supabase root's `terraform.tfvars` once an import shows it (183-21, 183-23). Until then it is `TF_VAR_organization_id` in the operator's shell. This is an addition to the tracked values the operator ruled on.

## Known Stubs

None. The scratch root's organisation, project name and region are deliberately absent from tracked files until an import shows them (plan design, filled by 183-21).

## Threat Flags

None. Every surface is in the plan's register (T-183-19, -20, -24, -25, -SC) and each mitigation is present: `prevent_destroy` and the password ignore (Task 2 awk exit 0), the type check seen failing, the SMTP password in its own resource fed by a sensitive variable, the provider locked with hashes.

## Self-Check: PASSED

- FOUND: all eleven files listed under key-files
- FOUND commits: 3850c8cc8, b9ed54441, 2b2349102 (ancestors of HEAD)
- `commits: 3` measured with `git rev-list --count c51d4daf5..HEAD` before this SUMMARY's commit
- `bash infra/scripts/check-settings-types.sh` exit 0 after the last task commit

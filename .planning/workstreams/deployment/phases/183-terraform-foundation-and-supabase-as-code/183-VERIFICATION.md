---
phase: 183-terraform-foundation-and-supabase-as-code
verified: 2026-10-25T10:30:00Z
status: passed
score: 9/9 must-haves verified
covered_files:
  - .github/workflows/main.yaml
  - .gitignore
  - infra/bootstrap/main.tf
  - infra/envs/staging/dns-mail/DELEGATION.md
  - infra/envs/staging/dns-mail/main.tf
  - infra/envs/staging/supabase/main.tf
  - infra/envs/staging/supabase/terraform.tfvars
  - infra/modules/budget/main.tf
  - infra/modules/dns-zone/main.tf
  - infra/modules/github-oidc/main.tf
  - infra/modules/github-oidc/policies.tf
  - infra/modules/mail-ses/main.tf
  - infra/modules/registry/main.tf
  - infra/modules/state-bucket/main.tf
  - infra/modules/supabase/hosted-settings.json
  - infra/modules/supabase/main.tf
  - infra/modules/supabase/settings.tf
  - package.json
  - scripts/assert-hosted-settings-parity.mjs
  - scripts/assert-no-inline-iam-policies.mjs
covered_digest: "v3:sha256:01779bf3d6ed5a7c78c61255d3edead55d3ca07f716bb45f4072d2bfd14230f7"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "A budget on the account names a threshold and notifies the operator's address, and the operator confirms that the notification reaches them (INFRA-15)"
    reason: "The actual alert was seen as triggered in the AWS Budgets console at the 1 USD test amount. No budget mail reached the operator within the two days the plan allows (the operator says the address was not confirmed, and that mail works now). The operator ruled accept-console-alert and overrode the plan's requirement that the mail be observed. Delivery to the mailbox is not observed. Recorded as WINDOWS.md row 289 (deviation, open) and in the INFRA-15 line of REQUIREMENTS.md."
    accepted_by: "operator (ruling accept-console-alert, relayed by the orchestrator)"
    accepted_at: "2026-10-23T14:04:00Z"
coincidental_reliance_items: []
---

# Phase 183: Terraform Foundation and Supabase as Code - Verification Report

**Phase Goal:** The Terraform layout, its remote state and its access roles exist in the AWS account, the hosted Supabase project is under Terraform's management in a root of its own, and the staging domain and the mail identity are ready for the phases that need them.
**Verified:** 2026-10-25T10:30:00Z
**Status:** passed
**Re-verification:** No - initial verification

## How this was verified

Hosted state (AWS account 471112560111, the Supabase project, DNS, SES) is observed only through the operator's evidence files under `evidence/`. No credential was used and no hosted API was called. The offline checks below were run by the verifier on HEAD 5ba41050a.

| Check | Command | Result |
| --- | --- | --- |
| Inline-policy guard | `node scripts/assert-no-inline-iam-policies.mjs` | exit 0, 42 .tf files, 0 findings |
| Inline-policy self-test | `... --self-test` | exit 0, 9 of 9 expected findings |
| Parity guard | `node scripts/assert-hosted-settings-parity.mjs` | exit 0, 66 live keys, 203 tracked files scanned for a second writer |
| Parity self-test | `... --self-test` | exit 0, 66 cases |
| Settings types | `bash infra/scripts/check-settings-types.sh` | exit 0, four cases hold |
| Formatting | `terraform fmt -check -recursive -diff infra` (v1.16.5) | exit 0 |
| Validation | `init -backend=false -lockfile=readonly` then `validate`, 8 roots, throwaway `TF_DATA_DIR` under `$TMPDIR` (removed afterwards) | 8 of 8 init 0, validate 0 |
| Second writer | `git grep` for `supabase config push` outside `.planning/`, the guard and its fixtures/spec | no match |

`yarn lint:check` (exit 0) and `yarn test:unit` (exit 0) were measured by the caller on 331bf24d1 and were not re-run. `git status` after the checks shows only the untracked `milestone.lock`.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A bootstrap root is applied by hand in 471112560111 / eu-north-1; state bucket read back encrypted, versioned, closed to the public; state locked during an apply; OIDC provider, read-only plan role, deploy role, registry with immutable tags exist; a second plan shows no change; Git ignores state, plan and local variable files from the phase's first commit | VERIFIED | Code: `infra/modules/state-bucket/main.tf` (private, SSE AES256, versioned, BucketOwnerEnforced, TLS-only policy, `prevent_destroy`), `infra/modules/registry/main.tf` (`image_tag_mutability = "IMMUTABLE"`), `github-oidc` module. Operator evidence 183-16 (2026-10-21): `Plan: 23 to add`, `s6_sse=AES256`, `s6_versioning=Enabled`, `s6_public_block=True,True,True,True`, `s9_locked_plan_exit=1` with lock object present during and absent after, `s7_registry=openvaa-frontend,IMMUTABLE`, OIDC provider ARN, both role ARNs, `s5_second_plan_exit=0` "No changes", simulator decisions as expected. `.gitignore` lines 111-137 carry `*.tfstate*`, `*.tfplan`, `tfplan`, `*.auto.tfvars`, `.terraform/`; commit `bfbaaffa0` (183-01) is the phase's first code commit. `git ls-files` shows no state, plan or `.terraform` file. |
| 2 | Every permission the roots grant comes from an AWS-managed or customer-managed policy; a repository check fails on an inline user policy, seen once; the account holds no IAM user with an inline policy, the applying identity included (INFRA-17) | VERIFIED | Guard `scripts/assert-no-inline-iam-policies.mjs` linked into `lint:check` (package.json line 57, 67); seen failing on the violating fixture root (9 findings) and through `yarn lint:check` itself on a planted file (183-09 run 2, 183-13: exit 1, `infra/zz-red-control/planted.tf:1: aws_iam_role_policy`). Re-run by the verifier: exit 0 and self-test passes. Account: 183-14 inventory found `user-2` with inline `s3-static-media-access` (assert exit 1), operator converted it, `s5b_assert_users_exit=0` over 2 users; 183-17 re-read with the SMTP user in place: `s9_assert_users_exit=0`, `s9_assert_managed_exit=0`, SMTP user has `s9_smtp_inline_count=0`; applying identity is an Identity Center role on AWS-managed `AdministratorAccess`, `inline=[]`. Both bootstrap roles `s7_plan_inline_count=0`, `s7_deploy_inline_count=0`. See Warnings for the SES inline group policy. |
| 3 | A budget names a threshold and notifies the operator's address, and the operator confirms that the notification reaches them (INFRA-15) | PASSED (override) | Budget `openvaa-monthly` 100 USD monthly, ACTUAL > 80 and FORECASTED > 100 notifications read back (183-20 `s5_budget`, `s5_notification`); second plan exit 0. The mail was not observed: outcome `no-mail`, operator ruling `accept-console-alert` (2026-10-23), console alert seen as triggered. Override: see frontmatter. |
| 4 | `staging.openvaa.org` is answered by a Route 53 hosted zone; the records changed at the current DNS host are written down (INFRA-18); the SES domain identity is verified with DKIM, SPF and DMARC published in the zone | VERIFIED | Zone `Z02494181MAM7OCUAIPKC` applied (183-17: 14 added, second plan exit 0). `infra/envs/staging/dns-mail/DELEGATION.md` lists the four NS records entered at Cloudflare on 2026-10-22T07:25Z, what was there before, the signing state and the undo. 183-18: both Cloudflare parents refer to exactly the four Route 53 names (no `aa` flag), `1.1.1.1` returns the same NS and a Route 53 SOA. 183-19: `s1_verified=true`, `s1_dkim=SUCCESS`, `s1_mailfrom=SUCCESS`; three DKIM CNAMEs, MX and SPF on `mail.staging.openvaa.org`, DMARC `p=quarantine` all resolve. |
| 5a | The project the operator created is imported into a Supabase root with its own state file and `prevent_destroy`; a destroy of that root is refused | VERIFIED | `infra/modules/supabase/main.tf` project block has `prevent_destroy = true` and `ignore_changes = [database_password]`; the parity guard checks both (red control 11, self-test cases). Staging root backend key `hand/staging/supabase/terraform.tfstate`, literal. 183-23: persistent project `cofbsatfrdysyphajsky` created by hand in eu-north-1, `s4_import_project_exit=0`. 183-25: destroy plan exit 1 with `Resource module.supabase.supabase_project.this has lifecycle.prevent_destroy`; state object AES256, versioned, holding exactly the project and settings addresses. |
| 5b | The root applies the hosted API and auth settings and a second plan is empty | VERIFIED | 183-25: apply exit 0 (`1 added`), second plan exit 0 "No changes", read-back of both config endpoints (HTTP 200) compares 37 of 37 managed keys (34 auth, 3 API) equal, none missing. The same sequence was rehearsed first on a throwaway project (183-21, 183-22, 183-24), including a real defect found and fixed (OAuth-server keys, commit 55802a1bc). |
| 5c | `supabase config push` is used nowhere | VERIFIED | Verifier's `git grep` outside `.planning/`, the guard, its fixtures and its spec: no match. The parity guard scans 203 tracked files (workflows, infra, scripts, every `package.json`) for it and has self-test cases for plain, continued and package.json spellings. |
| 5d | `yarn lint:check` fails when a security-relevant key of `config.toml` and the HCL disagree, seen once (SUPA-11) | VERIFIED | `assert:hosted-settings-parity` is the last link of `lint:check`. 183-13: with the scratch checkout's `hosted-settings.json` `api.max_rows` 49999, `yarn lint:check` exited 1 with the named finding, and 0 clean. 183-26: 12 of 12 direct red controls as expected (max_rows, jwt_exp, redirect wildcard, unclassified key, stale key, pageSize, empty envs, hook off, dead JSON, missing prevent_destroy). Verifier re-run: exit 0; self-test 66 of 66. |
| 5e | A job in `main.yaml` that needs no credentials formats and validates the Terraform and is seen passing in a run | VERIFIED (with caveat) | Job `infra-validate` (main.yaml lines 765-815): fmt check, validation of every root by glob with a required-roots assertion, settings-types check; no secret or id-token permission. 183-15: run 39591102824 passed, run 39591102968 on a tree broken on purpose failed at both the format and validate steps. Caveat: that run validated 18fdcd6ca; 9 `infra/` files changed afterwards. `main.yaml` has no commit since 18fdcd6ca, and the verifier ran the job's exact commands on HEAD (fmt, 8 of 8 validate, types check): all exit 0. The "seen passing in a run" clause is met; later edits are covered by an offline equivalent, not by a CI run. |

**Score:** 9/9 truths verified (1 by operator override); 0 present-but-behavior-unverified.

The lock invariant in truth 1 and the destroy refusal in truth 5a are behavior-dependent. Both were exercised, not inferred: a second plan failed on the lock object during an approval prompt (183-16), and a real `terraform plan -destroy` was refused (183-25).

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `infra/bootstrap/` (main, backend, variables, outputs, tfvars) | Hand-applied account root | VERIFIED | Validates; applied 2026-10-21; remote state in the bucket it created |
| `infra/modules/{state-bucket,registry,budget,github-oidc,dns-zone,mail-ses,supabase}` | Seven modules | VERIFIED | All present, substantive, validate, wired from roots |
| `infra/envs/staging/{aws,dns-mail,supabase}`, `infra/envs/example/*`, `infra/envs/scratch/supabase` | Roots | VERIFIED | 8 of 8 validate; own state keys |
| `infra/modules/supabase/hosted-settings.json` | Single file of compared values | VERIFIED | Read by `settings.tf`; the guard asserts the read |
| `scripts/assert-no-inline-iam-policies.mjs` + fixtures + spec | Inline-policy guard | VERIFIED | Linked into `lint:check` |
| `scripts/assert-hosted-settings-parity.mjs` + fixture + spec | Parity guard | VERIFIED | Linked into `lint:check` |
| `.github/workflows/main.yaml` `infra-validate` | Credential-free job | VERIFIED | Present, specced |
| `infra/envs/staging/dns-mail/DELEGATION.md` | Written record of the Cloudflare change | VERIFIED | Substantive and dated |
| `.gitignore` entries | State, plan, local variable files | VERIFIED | Lines 111-137 |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| `package.json` `lint:check` | both guards | `yarn assert:no-inline-iam-policies`, `yarn assert:hosted-settings-parity` | WIRED (seen red through the chain, 183-13) |
| `settings.tf` | `hosted-settings.json` | `local.hosted.auth` / `.api` reads | WIRED (guard asserts it; red control 10) |
| `infra/envs/staging/supabase/main.tf` | module | all arguments `var.*`, hooks `true` in tfvars | WIRED |
| parity guard | `config.toml`, `staticSettings.ts` pageSize | key classification table | WIRED (red controls 2, 3, 7) |
| `dns-mail` root | Cloudflare delegation | NS set equals `DELEGATION.md` table | WIRED (183-18 set comparison) |

### Data-Flow Trace (Level 4)

Not applicable to UI. For the settings path: `hosted-settings.json` and root variables flow into the `supabase_settings` resource, and the served values were read back from the Management API and equal them (37 of 37).

### Probe Execution

No probes declared by the phase. Step 7c skipped.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| INFRA-15 | 183-01, 02, 06, 12, 16, 20 | Budget alarm notifies the operator | SATISFIED (override) | Truth 3. Console alert seen, mail not observed, operator ruling, WINDOWS row 289 |
| INFRA-17 | 183-01, 03, 04, 06, 09, 12, 13, 14, 16, 17 | Customer-managed or AWS-managed policies only; no inline user policy | SATISFIED | Truth 2 |
| INFRA-18 | 183-01, 04, 08, 17, 18, 19, 28 | Route 53 zone for staging; DNS-host changes documented | SATISFIED (deliverable) | Truth 4. REQUIREMENTS.md still shows `[ ]` and "Pending"; see Warnings |
| SUPA-11 | 183-01, 05, 07, 10, 11, 13, 15, 21-28 | Guard in `lint:check` for config.toml against HCL | SATISFIED | Truth 5d; see CR-01 weighing below |

No orphaned requirement IDs: REQUIREMENTS.md maps exactly INFRA-15, INFRA-17, INFRA-18 and SUPA-11 to phase 183, and all four appear in plan frontmatter.

### Anti-Patterns Found

`git grep -E 'TBD|FIXME|XXX'` over `infra/` and the two guard scripts matches only the `mktemp ...XXXXXX` templates in runbook shell blocks, not debt markers. The artifacts are HCL, a JSON file and two guard scripts with no stub returns. The 183-REVIEW findings are listed below as warnings.

## Judgements the caller asked for

### INFRA-15 deviation

Properly recorded. The deviation is stated in four places that agree: the evidence file header (`Outcome: no-mail`, `Operator ruling: accept-console-alert (2026-10-23)`, operator's words verbatim, "delivery ... is therefore not observed"), the INFRA-15 line in REQUIREMENTS.md, WINDOWS.md row 289 (deviation, open), and the plan 183-20 summary. The files state what was not established (whether mail now reaches the address, whether the alert repeats monthly, the forecast alert, and why the ThresholdType read back as `None`). Nothing was invented. The budget configuration was read back (100 USD, two notifications) and a second plan was empty. I carry it as PASSED (override) with the operator as the accepting authority. It is a real weakening of the roadmap wording ("the operator confirms that the notification reaches them"): the delivery path from AWS Budgets to a mailbox is unobserved, and at 100 USD no alert will fire soon to test it.

### C5.6 caveat

Assessed as acceptable. The roadmap clause is "is seen passing in a run", and a passing run and a deliberately failing run are both on record. The workflow file has had no commit since the run's commit. The nine later `infra/` file changes (settings keys, tfvars, runbooks, one script) were validated by running the job's own commands on the final tree, where fmt, all 8 roots and the types check pass. A CI run on the final tree is still absent, and the evidence-branch run was not a PR run against `main`.

### CR-01 against SUPA-11

Does not undermine SUPA-11's must-have. Confirmed in code: every root passes `enable_*_hook = var.enable_*_hook` and declares its own default, and the guard reads the module default, so a root-default edit plus removal of the tfvars line would evade the hook-switch sub-rule. But SUPA-11 is the key-by-key comparison of `config.toml` and the hosted values, and that core is exercised by 12 red controls and a chain run, including `max_rows`, `jwt_exp`, redirect entries and `pageSize`. The live state is correct: both hooks are assigned `true` in the staging tfvars and the hosted API serves both as on. The module also leaves hook keys unsent when a switch is false, so such an edit would not itself turn a hook off on the project. CR-01 is a hardening gap in one sub-rule (a deliberate evasion path) and should be fixed before the guard is relied on as the audit record for hook switches, but it is not a failed must-have.

## Warnings (non-blocking, not scored)

1. **INFRA-18 bookkeeping.** `.planning/workstreams/deployment/REQUIREMENTS.md` still shows INFRA-18 as `[ ]` and "Pending" in the traceability table. Every plan summary left the mark "to later plans" and none made it. The deliverable exists and is evidenced; the orchestrator should tick it at phase close.
2. **183-REVIEW.md: 1 critical, 26 warnings, 23 info, all `open`** in 183-REVIEW-DISPOSITION.md. Triage is pending. Those that touch this phase's goal: CR-01 (above); WR-18 (`infra-validate` has no `permissions:` block and checkout persists the default token, so "credential-free" holds for secrets and OIDC but not for the default `GITHUB_TOKEN`); WR-17 (nothing makes a missing project fail an apply instead of creating one); WR-01 to WR-05 (plan-role breadth, `hand/` deny convention); WR-07 and WR-06/12 (SMTP settings paths, unobserved and not yet enabled). None is live today according to the review.
3. **SES inline group policy.** The group `AWSSESSendingGroupDoNotRename` has the inline group policy `AmazonSesSendingAccess`, and `user-1` gets its SMTP permission through it. INFRA-17 and criterion 2 speak of inline user policies, and the assert modes judge users, so this does not fail the requirement. It is recorded in 183-14 as left to the operator.
4. **Operator preconditions wording.** ROADMAP.md says SES production access is "requested"; the account already had it (`production=true`, 50000/24h), and no request was filed (deferred-items.md).
5. **Unobserved, assigned to later phases.** SMTP send under the scoped policy; auth service behavior while the two hook functions do not yet exist on the persistent project (phase 184: push migrations before any sign-in); mail delivery to the operator's mailbox for the budget alert.
6. **The first apply's `Apply complete!` line** (183-16) was not captured; the state count (30 = 23 managed + 7 data) and the managed count through the S3 backend stand for it under an operator-ruled amendment.

## Human Verification Required

None required for the status. Items 1 and 5 above are for the orchestrator or operator to carry forward and are not gates on this phase.

## Gaps Summary

No gaps. All five roadmap success criteria hold on code evidence plus operator-observed hosted evidence, and all four requirement IDs are accounted for. One truth passes by an explicit operator override with the mail delivery unobserved, and the review's critical finding is open but does not defeat a must-have.

---

_Verified: 2026-10-25T10:30:00Z_
_Verifier: Claude (gsd-verifier)_

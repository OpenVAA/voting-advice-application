---
phase: 183-terraform-foundation-and-supabase-as-code
fixed_at: 2026-10-25
review_path: .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-REVIEW.md
iteration: 1
fix_scope: critical_warning
findings_in_scope: 27
fixed: 26
partial: 2
skipped: 1
status: partial
lanes: [A, B, C]
---

# Phase 183: Code Review Fix Report

**Scope:** CR-01 and WR-01 to WR-26 (critical + warning). Info findings IN-01 to IN-23 were out of scope.
**Method:** three `gsd-code-fixer` lanes run sequentially on the same tree (A: infra/modules + infra/bootstrap; B: infra/envs + infra/scripts; C: guards, gate specs, CI). Each lane ended with lint/format and the infra gates green. No hosted or credentialed command was run; no state or plan file was read.

`fixed: 26` counts WR-01 and WR-03, which are fixed in part (the code side) with an open operator question each; `skipped: 1` is WR-04 (needs operator input).

## Outcome by finding

| Finding | Outcome | Commit(s) | needs-operator-apply |
|---|---|---|---|
| CR-01 | fixed | 731656d24 | none |
| WR-01 | fixed in part; needs operator input | 2d8a04ac0 | infra/bootstrap: `aws_iam_policy.plan_deny` replaced (description change), attachment re-created |
| WR-02 | fixed | ee4ca9130 | infra/bootstrap: in-place update of `aws_iam_policy.plan_deny` (adds `env:/*`) |
| WR-03 | fixed in part; needs operator input | 16f90b7e3 | none (validation + docs only) |
| WR-04 | skipped: needs operator input | — | — |
| WR-05 | fixed | 1e5740bcb | none |
| WR-06 | fixed (module side) | eed525127 | none |
| WR-07 | fixed | f7fc5d26f | none (staging `smtp` is null) |
| WR-08 | fixed | 39dcac2db | none |
| WR-09 | fixed | 05070d0b6 | none |
| WR-10 | fixed (mode renamed `--assert-no-inline-under`) | 70b569de6 | none |
| WR-11 | fixed | 4ebb01bca | none |
| WR-12 | fixed (root side) | 1cb145b7a | none |
| WR-13 | fixed | 58be669ad | none today; export `TF_VAR_smtp_user` once staging sets `smtp` |
| WR-14 | fixed (values sent unchanged) | 1a02b721b | none |
| WR-15 | fixed | c1fa7a7f5 | none |
| WR-16 | fixed (roots pin `= 1.11.0`) | 97bcae1d3 | none |
| WR-17 | fixed: requires human verification | ed7d91c94 | infra/envs/staging/supabase: confirm the next plan reads "No changes" with no import line |
| WR-18 | fixed | 97d9c7c79 | none (CI only) |
| WR-19 | fixed | 77bfe4a71, eda25307f | none |
| WR-20 | fixed | d7578a411 | none |
| WR-21 | fixed | faa06e482 | none |
| WR-22 | fixed | 2068572dc | none |
| WR-23 | fixed | a775f8509 | none |
| WR-24 | fixed | 3049e7376 | none |
| WR-25 | fixed | 520ab4c62 | none |
| WR-26 | fixed | 45d9b8d88 | none |

## Open operator questions

1. **WR-04:** keep decision A-08 (the plan role may write and delete the pipeline lock object, so a PR job can hold or delete it), or drop `plan_lock`, require `terraform plan -lock=false`, and update runbook Steps 4 and 5(c)? Dropping it destroys a policy and its attachment in infra/bootstrap.
2. **WR-01:** S3 objects, SSM String parameters, Lambda/ECS environments and CloudFormation templates stay readable by the plan role. Choose (a) keep `ReadOnlyAccess` with the current denies, (b) `ViewOnlyAccess` plus a per-service read policy, or (c) deny these reads too and bar those resource types from the pipeline root.
3. **WR-03:** supply the numeric `github_repository_id` and `github_repository_owner_id` for `infra/bootstrap/terraform.tfvars` (e.g. `gh api repos/OpenVAA/voting-advice-application --jq '.id, .owner.id'`), after confirming AWS evaluates those claims (otherwise setting them makes the roles unassumable); choose how to pin the plan trust to a workflow; set the staging Environment's deployment branch policy in GitHub.


## Lane A

**Scope:** WR-01 to WR-08 (infra/modules, infra/bootstrap, plus the infra READMEs and one infra script line that the fixes needed).
**Where verification ran:** the main checkout `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra`, branch `feat/deployment-terraform-supabase`. No worktree was used. Terraform `init -backend=false` + `validate` ran with a throwaway `TF_DATA_DIR`, removed afterwards.
**Hosted commands:** none. No plan, apply, import, refresh or state command was run, and no state or plan file was read.

| Finding | Outcome | Commit | needs-operator-apply |
| ------- | ------- | ------ | -------------------- |
| WR-01 | fixed in part; the rest is skipped: needs operator input | 2d8a04ac0 | infra/bootstrap |
| WR-02 | fixed | ee4ca9130 | infra/bootstrap |
| WR-03 | fixed in part; the rest is skipped: needs operator input | 16f90b7e3 | none |
| WR-04 | skipped: needs operator input (reverses decision A-08) | none | none |
| WR-05 | fixed | 1e5740bcb | none |
| WR-06 | fixed (module side only) | eed525127 | none |
| WR-07 | fixed | f7fc5d26f | none |
| WR-08 | fixed | 39dcac2db | none |

### WR-01: The plan role's `ReadOnlyAccess` reads all data in a shared account

**Status:** fixed in part (the safe deny statements). Narrowing the rest is skipped: needs operator input.
**Commit:** 2d8a04ac0
**Files:** `infra/modules/github-oidc/policies.tf`, `infra/bootstrap/README.md`
**What changed:**
- `plan_deny` has a new statement, `DenyDataPlaneReads`, on `*`. It denies `dynamodb:GetItem`, `BatchGetItem`, `Query`, `Scan`, `PartiQLSelect` and `GetRecords`; `logs:GetLogEvents`, `FilterLogEvents`, `GetLogRecord`, `StartQuery`, `GetQueryResults`, `StartLiveTail` and `Unmask`; `kinesis:GetRecords`; and `sqs:ReceiveMessage`. No refresh of a resource or data source makes any of these calls.
- The policy description now says exactly what is denied.
- The module header lists what is denied, and the one new constraint on the pipeline root: it can hold no DynamoDB table item. It also names which data reads stay allowed.
- Runbook Step 5(b) now simulates `dynamodb:GetItem` and `logs:GetLogEvents` too. Expected: `explicitDeny` four times.

**needs-operator-apply:** infra/bootstrap. `aws_iam_policy.plan_deny` is **replaced**, because `description` forces a new policy, and so is `aws_iam_role_policy_attachment.plan_deny`. During the apply, the plan role briefly has `ReadOnlyAccess` with no deny attached. That window is harmless only while no workflow assumes the plan role, which is true today because the pipeline root is empty. Afterwards, re-run Step 5 of `infra/bootstrap/README.md`.

**Open question for the operator:** S3 `GetObject` outside the state bucket's denied keys, `ssm:GetParameter*` (String parameters), `lambda:GetFunction*` (environment in clear), `ecs:DescribeTaskDefinition` (container environment) and `cloudformation:GetTemplate` stay allowed. A refresh of `aws_s3_object`, `aws_ssm_parameter`, `aws_lambda_function`, `aws_ecs_task_definition` or `aws_cloudformation_stack` needs these calls, so denying them would break the pipeline root as soon as it declares such a resource. Which shape should the plan role have?
- (a) Keep `ReadOnlyAccess` plus the current denies, and accept these reads account-wide.
- (b) Replace `ReadOnlyAccess` with `ViewOnlyAccess`, plus a customer-managed per-service read policy for the resource types `envs/staging/aws` will declare (phases 185 and 187).
- (c) Keep `ReadOnlyAccess` and also deny these reads, accepting that the pipeline root may not declare those resource types.

### WR-02: The `hand/` deny is bypassed by any non-default workspace

**Status:** fixed
**Commit:** ee4ca9130
**Files:** `infra/modules/github-oidc/policies.tf`, `infra/README.md`, `infra/bootstrap/README.md`
**What changed:**
- The `DenyHandAppliedState` resources are now `${bucket}/${hand_state_prefix}*` and `${bucket}/env:/*`. `env:/` is the S3 backend's default workspace key prefix.
- `infra/README.md` states the boundary. A new line under "Rules of every apply" says every root uses the default workspace only and no backend block sets `workspace_key_prefix`.
- Runbook Step 5(a) adds a simulation of `env:/x/hand/staging/supabase/terraform.tfstate`. Expected: `explicitDeny`.

I did not take the review's alternative, a `not_resources` deny over the whole bucket. S3 offers no condition key that would scope such a deny to one bucket, so it would deny `GetObject` account-wide.
**needs-operator-apply:** infra/bootstrap. An in-place update of `aws_iam_policy.plan_deny`, a new policy version. If it is applied together with WR-01, it is part of that replacement.

### WR-03: Trust policies pin only `sub`

**Status:** fixed in part. The rest is skipped: needs operator input.
**Commit:** 16f90b7e3
**Files:** `infra/modules/github-oidc/variables.tf`, `infra/README.md`, `infra/bootstrap/README.md`
**What changed:**
- `github_repository_id` and `github_repository_owner_id` now validate as null or digits only.
- `infra/README.md` § Prerequisites has a new item. Before a workflow first assumes the deploy role, the GitHub Environment that role is bound to must allow deployments from the default branch only, through a deployment branch policy.
- The bootstrap "Not yet observed" table has a new row: AWS evaluates the `repository_id` and `repository_owner_id` claims in a trust condition once they are set.
- The deploy subject was already pinned to the environment (`repo:OpenVAA/voting-advice-application:environment:staging`), so it is unchanged.

**needs-operator-apply:** none. The validation and documentation do not change the plan. Setting the ids would change it, as an in-place update of both roles' `assume_role_policy`.

**Open questions for the operator:**
1. Supply the repository's numeric ids for `infra/bootstrap/terraform.tfvars`: `github_repository_id` and `github_repository_owner_id`. They are public, for example from `gh api repos/OpenVAA/voting-advice-application --jq '.id, .owner.id'`. I did not set them, because I must not invent ids. Setting them also depends on the new "Not yet observed" row: if AWS ignores those claim keys, the roles become unassumable. That failure is closed.
2. Pin the plan trust to a workflow? There are two routes, and both need a choice:
   - (a) A repository OIDC subject template with `include_claim_keys: ["repo","context","job_workflow_ref"]`. The pull-request subject then carries `@refs/pull/<n>/merge`, which varies per PR, so the module's no-wildcard rule on `plan_subjects` would have to be relaxed to a `StringLike` on the ref.
   - (b) A `job_workflow_ref` condition, once AWS support for that key is confirmed.

   Either way, a same-repository PR can edit the pinned workflow file in its own tree. The pin keeps out other workflows, such as the Claude workflows, but not a PR that rewrites the plan workflow. Which route, and is that limit acceptable?
3. Configure the `staging` Environment's deployment branch policy in GitHub. This is a repository setting, not code.

### WR-04: The plan role can create and delete the pipeline root's lock object

**Status:** skipped: needs operator input
**Commit:** none
**File:** `infra/modules/github-oidc/policies.tf` (`plan_lock`)
**Reason:** The review's fix, dropping `plan_lock` and running PR plans with `-lock=false`, reverses locked decision **A-08 (D-07)** in `183-CONTEXT.md`: "the plan role gets that one write through a customer-managed policy". No safe partial change exists. Removing only `DeleteObject` would leave every plan's lock behind and block every deploy.
**Open question for the operator:** Keep A-08, accepting that any job able to assume the plan role can hold or delete the pipeline lock? Or reverse it: remove `aws_iam_policy.plan_lock` and its attachment, require `terraform plan -lock=false` in the PR plan workflow, and update Step 4 (`s7_plan_attached`) and Step 5(c) of the bootstrap runbook? Reversing it would mean destroying the policy and its attachment in infra/bootstrap.
**needs-operator-apply:** none (nothing changed)

### WR-05: Nothing enforces that `pipeline_state_key` lies outside the hand prefix

**Status:** fixed
**Commit:** 1e5740bcb
**Files:** `infra/bootstrap/variables.tf`, `infra/modules/github-oidc/variables.tf`
**What changed:**
- In the bootstrap root, `pipeline_state_key` must start with `pipeline/` and end with `/terraform.tfstate`.
- In the github-oidc module, `pipeline_state_key` must end with `/terraform.tfstate` and must not start with `hand_state_prefix` or `env:/`; this is a cross-variable validation.
- `hand_state_prefix` must be slash-terminated path segments, matching `^([A-Za-z0-9_-]+/)+$`, so an empty prefix is refused.

**Red control:** `terraform console` on copies of the variable files, with no provider.
- The module refuses `hand/staging/aws/terraform.tfstate`, `manual/x/terraform.tfstate` with prefix `manual/`, `env:/w/pipeline/x/terraform.tfstate`, `pipeline/x/aws/state`, and prefix `hand`.
- The module accepts `pipeline/staging/aws/terraform.tfstate`.
- The bootstrap root refuses `hand/...` and `.../state`, and accepts both the tracked `terraform.tfvars` and `example.tfvars`.
- `validate` treats the cross-variable references as unknown, so these checks fire at plan.

**needs-operator-apply:** none. Validations only; the tracked values pass.

### WR-06: A set `smtp` with an unset `smtp_password` sends `{"smtp_pass": null}`

**Status:** fixed (module side only; lane B owns the env-root side under WR-12)
**Commit:** eed525127
**Files:** `infra/modules/supabase/variables.tf`, `infra/scripts/check-settings-types.sh`
**What changed:**
- `smtp_password` has the validation `var.smtp == null || (var.smtp_password != null && var.smtp_password != "")`, and its description says the password is required whenever `smtp` is set.
- `check-settings-types.sh`'s smtp case now passes `-var "smtp_password=unused-placeholder"`. Without it the new validation broke that case (exit 2: "the encoded local.auth is not JSON"). With it, the script exits 0. Its `smtp_pass`-absent assertion is unchanged.

**Red control:** `terraform console` on a copy of `variables.tf`:
- `smtp` set with no password: refused.
- `smtp` set with an empty password: refused.
- `smtp` set with a password: accepted.
- `smtp` null: accepted.

**Note for lane B:** the example root's `terraform.tfvars` sets `smtp`, so from now on any plan of that root needs `TF_VAR_smtp_password`. Validate is unaffected.
**needs-operator-apply:** none. Staging has `smtp` null, the parity guard is green and the hosted values are identical.

### WR-07: The two `supabase_settings` resources write concurrently

**Status:** fixed
**Commit:** f7fc5d26f
**File:** `infra/modules/supabase/main.tf`
**What changed:** `supabase_settings.smtp_secret` has `depends_on = [supabase_settings.this]`. The comment says the two updates are serialised, and that whether a first SMTP enablement is accepted with the password arriving second is still unobserved.
**needs-operator-apply:** none. The count is 0 on staging, and `depends_on` changes no planned value.

### WR-08: `mail-ses` trusts a separate `aws_region` input

**Status:** fixed
**Commit:** 39dcac2db
**Files:** `infra/modules/mail-ses/main.tf`, `infra/modules/mail-ses/variables.tf`
**What changed:**
- There is a new `data "aws_region" "current" {}`.
- `aws_route53_record.mail_from_mx` has a `lifecycle.precondition` that requires `var.aws_region == data.aws_region.current.region`.
- The variable description says that a plan with any other value fails.
- I kept the variable rather than dropping it, so the env roots are unchanged.
- `validate` confirms that the `region` attribute exists in aws 6.68.0.

**Red control:** none could be run, because a precondition fires only at plan, which this lane may not run. In both dns-mail roots, the provider region and the module input are the same `var.aws_region`, so they cannot differ today.
**needs-operator-apply:** none. The next plan of infra/envs/staging/dns-mail reads one more data source; no resource changes.

### Gates (main checkout, after the last commit)

| Gate | Exit |
| ---- | ---- |
| `yarn format:check` | 0 |
| `node scripts/assert-hosted-settings-parity.mjs` | 0 |
| `node scripts/assert-hosted-settings-parity.mjs --self-test` | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs` | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs --self-test` | 0 |
| `terraform fmt -check -recursive infra` | 0 |
| three dev-seed specs (36 tests) | 0 |
| `bash infra/scripts/check-settings-types.sh` | 0 |
| `init -backend=false` + `validate`: bootstrap, staging/example/scratch supabase, staging/example dns-mail | 0 each |
| `yarn lint:check` | 0 |

_Fixer: Claude (gsd-code-fixer), lane A, iteration 1_


## Lane B

**Scope:** WR-09 to WR-17 (infra/envs and infra/scripts, plus the module files and runbooks that WR-13, WR-14 and WR-16 needed).
**Where verification ran:** the main checkout `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra`, branch `feat/deployment-terraform-supabase` (`workflow.use_worktrees` is false, so no worktree was used). Every `init -backend=false` + `validate` ran with a throwaway `TF_DATA_DIR`, removed afterwards.
**Hosted commands:** none. No `aws`, no hosted `supabase` call, no plan, apply, import, refresh or state command. The inventory script was never run against AWS: only its `--self-test`, which now also drives the collection path with a stubbed `aws` function. No state or plan file was read.

**Equivalence harness (used for WR-12, WR-13, WR-14):** a scratchpad copy of each Supabase root's `variables.tf`, `terraform.tfvars` and module call, wired to a copy of the module's `variables.tf`, `settings.tf` and `hosted-settings.json` plus an output of `jsonencode(local.auth)` and `jsonencode(local.api)`, evaluated with `terraform console` (no provider, no backend). It was run on `HEAD` before each change and on the working tree after it.

| Finding | Outcome | Commit | needs-operator-apply |
| ------- | ------- | ------ | -------------------- |
| WR-09 | fixed | 05070d0b6 | none |
| WR-10 | fixed (rename; the stronger check would fail the plan role) | 70b569de6 | none |
| WR-11 | fixed | 4ebb01bca | none |
| WR-12 | fixed (root side; the module check from lane A already refuses the plan) | 1cb145b7a | none |
| WR-13 | fixed | 58be669ad | none today; see the note |
| WR-14 | fixed (effective values byte-identical) | 1a02b721b | none |
| WR-15 | fixed | c1fa7a7f5 | none |
| WR-16 | fixed | 97bcae1d3 | none |
| WR-17 | fixed: requires human verification (the no-op on the imported project is unobserved) | ed7d91c94 | infra/envs/staging/supabase: confirm only |

### WR-09: The assert modes never check the caller's account

**Status:** fixed
**Commit:** 05070d0b6
**Files:** `infra/scripts/account-inventory.sh`, `infra/bootstrap/README.md`, `infra/envs/staging/dns-mail/README.md`
**What changed:**
- `collect_caller` sets `MUST_FAILED` when the caller's account is not `OPENVAA_ACCOUNT_ID`, as well as when the call fails.
- A new `collect_in_account` collects the caller line first. It runs the given collector only when the caller is in the expected account, so no list of another account is read. Both assert modes and the default inventory go through it.
- In the default mode, a mismatch prints only the caller line, then exits 1.
- The judge (`evaluate`) also requires a caller line whose `account=` equals `OPENVAA_ACCOUNT_ID` and whose `match=` is `yes`. It reports FAIL when the caller is unreadable, when the input has no caller line, and when any caller line names another account. So a PASS can no longer describe another account, even when lines are fed to the judge directly.
- The header and the exit-code list describe this behaviour.
- The bootstrap Step 1 item 5 and the dns-mail Step 3 item 9 now state that precondition.

**Self-test:** 41 cases before, 52 after, all passing. The new cases:
- judge cases: a missing, an unreadable and a foreign caller, a caller line that claims `match=yes` for another account, and the path mode in another account;
- stubbed-CLI cases, with `aws` replaced by a shell function that records each call: a caller in another account sets the must-fail status, reads no `list-` call and exits 1 in the assert path; the default inventory reads nothing past the caller; a caller in the account does read `iam list-users`.

**Red control:** two copies of the script, each with one check removed:
- without the `MUST_FAILED` line in `collect_caller`: 3 cases fail;
- without the caller block in the judge: 5 cases fail.

**needs-operator-apply:** none. A script and runbook change only. The next sitting of either runbook simply gets the stricter exit status.

### WR-10: "--assert-managed-only" checks inline policies only

**Status:** fixed, by renaming the mode. I did not strengthen the check.
**Commit:** 70b569de6
**Files:** `infra/scripts/account-inventory.sh`, `infra/bootstrap/README.md`, `infra/envs/staging/dns-mail/README.md`
**Why the rename:** the review's other option was to fail on any attached `arn:aws:iam::aws:policy/` ARN. That would fail on this account as it is meant to be: the plan role `openvaa-plan` lies under `/openvaa/` and has the AWS-managed `ReadOnlyAccess` attached by design (bootstrap Step 4 expects `s7_plan_attached=ReadOnlyAccess,...`).
**What changed:**
- `--assert-managed-only <prefix>` is now `--assert-no-inline-under <prefix>`. The internal judge mode is now `under`, and the self-test case names follow.
- The old flag now exits 2 (usage) before any AWS call.
- The header says that attached policies are not judged, and that a role under the path with an AWS-managed policy such as ReadOnlyAccess passes.
- The bootstrap Step 4 item 7 and the dns-mail Step 3 item 9 use the new flag and new named lines (`s7_assert_no_inline_exit`, `s9_assert_no_inline_exit`). Their claim now reads "no role or user under `/openvaa/` carries an inline policy", and they say attached policies are not judged.
- The Observations rows that record earlier runs are unchanged. They say only that "both assert modes exited 0", which stays true.

**needs-operator-apply:** none.

### WR-11: The dns-mail runbook says the first apply creates the suppression setting

**Status:** fixed
**Commit:** 4ebb01bca
**File:** `infra/envs/staging/dns-mail/README.md`
**What changed:**
- Step 1 says the account's suppression setting is created only when `manage_account_suppression` is true. Staging sets it false, because other identities in the region share the setting, so the plan holds no `aws_sesv2_account_suppression_attributes` resource.
- Step 8 item 2 now also prints `s2a_suppression` (sorted `SuppressedReasons`). No request is filed unless it reads `BOUNCE,COMPLAINT`, which the request's use-case description relies on.

**needs-operator-apply:** none.

### WR-12: With `smtp` set and `TF_VAR_smtp_password` forgotten

**Status:** fixed. Lane A's module validation (eed525127) already closes the defect itself. This commit adds only the root side, and adds no duplicate validation.
**Commit:** 1cb145b7a
**Files:** `infra/envs/staging/supabase/variables.tf`, `infra/envs/example/supabase/variables.tf`, `infra/envs/staging/supabase/terraform.tfvars`, `infra/envs/example/supabase/terraform.tfvars`
**Evidence that the module check reaches the roots:** with the equivalence harness, the example root (which sets `smtp`), run with no `TF_VAR_smtp_password`, fails with `Invalid value for variable … smtp is set, so smtp_password must be set too`. So the root needs no validation of its own.
**What changed:**
- Both root `smtp_password` descriptions say the password is required whenever `smtp` is set, and that the module refuses the plan otherwise.
- Both tfvars headers say that a plan without the password fails: the example now, and staging once its `smtp` object is added.

**needs-operator-apply:** none.

### WR-13: The SMTP user name is destined for a tracked public tfvars

**Status:** fixed
**Commit:** 58be669ad
**Files:**
- `infra/modules/supabase/main.tf`, `infra/modules/supabase/settings.tf`, `infra/modules/supabase/variables.tf`
- `infra/envs/staging/supabase/{main.tf,variables.tf,terraform.tfvars,README.md}`
- `infra/envs/example/supabase/{main.tf,variables.tf,terraform.tfvars}`
- `infra/scripts/check-settings-types.sh`

**What changed:**
- The `smtp` object loses its `user` attribute, in the module and in both roots.
- A new sensitive `smtp_user` variable (default null) is read from `TF_VAR_smtp_user`. The module requires it whenever `smtp` is set, with the same validation shape as `smtp_password`. The staging and example roots pass it through.
- `local.auth_smtp` no longer holds `smtp_user`. `supabase_settings.smtp_secret` now sends `{ smtp_user, smtp_pass }`, so the id appears in no plan diff and in no tracked file.
- The example tfvars loses `user = "REPLACE-ME"`. Its header names `TF_VAR_smtp_user` and says that, for SES, it is the access key id of the SMTP user.
- The staging tfvars header names the variable too.
- The runbook's SMTP paragraph says the user name and the password come from the dns-mail root's outputs, are exported in the shell that plans, and go into no file.
- `check-settings-types.sh`:
  - its smtp case no longer passes `user`, and passes `-var smtp_user=unused-placeholder`;
  - it requires `smtp_user` and `smtp_pass` to be absent from the main `local.auth`;
  - its header describes this.

I invented no values. The dns-mail root's existing `smtp_username` output is the named source.

**Red controls:**
- A module copy with `smtp_user = nonsensitive(var.smtp_user)` put back into `auth_smtp` makes `check-settings-types.sh <copy>` exit 1 with `FINDING [smtp] smtp_user is present`.
- The example root with `smtp` set and no `TF_VAR_smtp_user` fails with `smtp is set, so smtp_user must be set too`.

**Unchanged values:** staging and scratch send byte-identical `local.auth` / `local.api` before and after (harness). Neither sets `smtp`, so `smtp_secret` has count 0. The parity guard and its self-test are green.

**needs-operator-apply:** none today. When the staging `smtp` object is added in a later stage, the operator exports `TF_VAR_smtp_user` (from `terraform output -raw smtp_username` in dns-mail, in that shell) as well as `TF_VAR_smtp_password`.

**Note for lane C:** the parity guard's own fixture module text (around `scripts/assert-hosted-settings-parity.mjs:1580`) still writes `smtp_user = var.smtp.user` inside its self-contained settings fixture. The guard is green, because it checks only that the real module's code writes `smtp_user` somewhere, and main.tf now does. Aligning the fixture is optional.

### WR-14: The env roots re-declare the rate-limit defaults

**Status:** fixed. The effective values sent are unchanged.
**Commit:** 1a02b721b
**Files:** `infra/envs/{staging,example,scratch}/supabase/variables.tf`, `infra/envs/staging/supabase/README.md`
**What changed:**
- In the staging and example roots, the `auth_rate_limits` attributes are `optional(number)` with no second argument, plus `nullable = false`. A limit left out, or set to null, therefore reaches the module as null, and the module's `optional(number, <default>)` fills it. The description now says exactly that.
- The duplicated `enable_access_token_hook` / `enable_send_email_hook` defaults are dropped from all three roots, which now carry `nullable = false`. Every `terraform.tfvars` already sets both switches to true, and a root that leaves one out now fails at plan instead of taking a value no file shows.
- The runbook's hook paragraph says the same.

**Proof of identical values:**
- First, a minimal console test confirmed that Terraform fills a module's `optional(..., default)` when the root passes null for that attribute.
- Then the harness: the encoded `local.auth` and `local.api` of staging, example and scratch are byte-identical between `HEAD` and the change. Staging's include `rate_limit_otp=30`, `verify=30`, `token_refresh=150`, `anonymous_users=30`, `sms_sent=30` and `web3=30`. The mail limit stays out, because smtp is null.
- `infra/envs/staging/supabase/terraform.tfvars` and `infra/modules/supabase/hosted-settings.json` are untouched by this commit. The parity guard is green.

**needs-operator-apply:** none. Nothing that is sent changes, so the next staging plan stays "No changes".

**Note for lane C (CR-01):** the Supabase roots no longer declare a default for either hook switch. So the effective value is the `terraform.tfvars` assignment, or a plan failure when it is missing. No root default exists any more for the guard to read.

### WR-15: The scratch rehearsal's Step 5 places an unconditional-looking `rm -f tfplan`

**Status:** fixed
**Commit:** c1fa7a7f5
**File:** `infra/envs/staging/supabase/README.md`
**What changed:** the fenced `rm -f tfplan; echo "s2_plan_file_removed=yes"` block between the checksum and the apply is gone. The removal is now inline in the "If they differ, stop here" sentence, word for word as in Step 11.
**needs-operator-apply:** none.

### WR-16: The supabase provider constraint admits 1.12+

**Status:** fixed
**Commit:** 97bcae1d3
**Files:** `infra/envs/{staging,example,scratch}/supabase/main.tf`, `infra/envs/staging/supabase/README.md`
**What changed:**
- The three roots require `version = "= 1.11.0"`, with a comment saying why and what raising the pin needs.
- The runbook's Traps section opens with the same.
- The module keeps `~> 1.11`, so it stays reusable. The roots narrow it.

**Lock files:** `init -backend=false` + `validate` passes in all three roots against the committed lock files, which select 1.11.0. Init left the lock files byte-unchanged. Their informational `constraints = "~> 1.11"` line records the constraint at selection time, and a later `init -upgrade` rewrites it.
**needs-operator-apply:** none. The provider version is the same.

### WR-17: Nothing in the Supabase roots stops Terraform from creating the project

**Status:** fixed, but requires human verification: the no-op on an already-imported project has not been observed.
**Commit:** ed7d91c94
**Files:** `infra/envs/{staging,example}/supabase/{main.tf,variables.tf,terraform.tfvars}`, `infra/envs/staging/supabase/README.md`
**What changed:**
- Both roots have a new required `project_ref` variable and an `import { to = module.supabase.supabase_project.this, id = var.project_ref }` block. A plan against a state that lacks the project therefore imports it instead of creating one, and a ref that names no project fails the plan.
- Staging's tfvars sets `project_ref = "cofbsatfrdysyphajsky"`, the public ref the runbook already records, so nothing was invented. The example uses the stand-in `replace-with-your-project-ref`.
- Both headers add "a creation of the project" to the never-apply list.
- Runbook changes:
  - the rule of the root states the import block;
  - Step 9 item 2 adds `project_ref`;
  - item 4 notes that the import block plans nothing once the CLI import has run;
  - a "Not yet observed" row covers the no-op on the imported project, checked by the next plan, which must still read "No changes".
- The scratch root is unchanged. Its throwaway ref is not in the repository, its header makes no such claim, and its runbook rehearses the CLI import.

`validate` passes in both roots.
**Effect on the staging plan:** expected none. Terraform documents an import block whose target is already in state as a no-op, and the state holds `module.supabase.supabase_project.this` with this ref (Observations, 2026-10-23). This could not be shown here, because no plan may be run.
**needs-operator-apply:** infra/envs/staging/supabase. Confirm only: the next plan must read "No changes" and show no "will be imported" line. If it shows an import or any change of the project, it is not applied.

### Gates (main checkout, after the last commit)

| Gate | Exit |
| ---- | ---- |
| `yarn format:check` | 0 |
| `node scripts/assert-hosted-settings-parity.mjs` | 0 |
| `node scripts/assert-hosted-settings-parity.mjs --self-test` | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs` | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs --self-test` | 0 |
| `terraform fmt -check -recursive infra` | 0 |
| `bash infra/scripts/account-inventory.sh --self-test` (52 cases) | 0 |
| `bash infra/scripts/check-settings-types.sh` | 0 |
| `init -backend=false` + `validate`: staging, example and scratch supabase roots, `infra/modules/supabase` | 0 each |
| three dev-seed specs (`infraValidateJobGate`, `hostedSettingsParityGate`, `noInlineIamPoliciesGate`) | 0 |
| `yarn lint:check` | 0 |

The dns-mail and aws roots had no `.tf` change in this lane, so they were not re-validated.

_Fixer: Claude (gsd-code-fixer), lane B, iteration 1_


## Lane C

**Scope:** CR-01 and WR-18 to WR-26. The files are the two guards under `scripts/` and the IAM guard's fixtures, the three gate specs under `packages/dev-seed/tests/`, and the `infra-validate` job in `.github/workflows/main.yaml`.

**Where verification ran:** the main checkout `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-infra`, on branch `feat/deployment-terraform-supabase`. `workflow.use_worktrees` is false, so no worktree was used.

**Hosted commands:** none. I ran no `aws`, no hosted `supabase`, no GitHub command, and no Terraform plan, apply, import, refresh or state command. I read no state or plan file. The spec copies of `infra/envs` take only `*.tf` and `terraform.tfvars`.

**How the red controls were run:** each guard change was checked twice:
- against the guard at the previous commit, with `git show HEAD:<guard>` written beside the real guard and removed afterwards;
- against the new guard.

Both were run on the same edited copy, built in the scratchpad from the real tree. In every case the previous guard exited 0 and the new one exited 1.

**Terraform plans:** none of these fixes changes a plan. Every change is in a guard, a spec, a fixture or a CI job.

| Finding | Outcome | Commit | needs-operator-apply |
| ------- | ------- | ------ | -------------------- |
| CR-01 | fixed | 731656d24 | none |
| WR-21 | fixed | faa06e482 | none |
| WR-22 | fixed | 2068572dc | none |
| WR-23 | fixed | a775f8509 | none |
| WR-24 | fixed | 3049e7376 | none |
| WR-25 | fixed | 520ab4c62 | none |
| WR-26 | fixed | 45d9b8d88 | none |
| WR-18 | fixed | 97d9c7c79 | none |
| WR-19 | fixed | 77bfe4a71, eda25307f | none |
| WR-20 | fixed | d7578a411 | none |

### CR-01: The hook-switch rule reads the wrong default and ignores the root's module call

**Status:** fixed
**Commit:** 731656d24
**Files:** `scripts/assert-hosted-settings-parity.mjs`, `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`

**What changed:** each root is now read from its `.tf` files as well as from its `terraform.tfvars`.

New readers:
- `supabaseCalls` finds every `module` block whose `source` ends in `modules/supabase`. It reads the arguments written directly in that block, and the trailing comment of each argument's line.
- `resolveSwitch` resolves each hook switch the way Terraform does:
  - a literal `true` or `false` in the module call is the value;
  - `var.<switch>` must be declared in the root. Its value is the root's `terraform.tfvars` assignment, or, when there is none, the root variable's default;
  - when the module call omits the argument, the value is the module variable's default.
- `resolveOrigin` reads `public_origin` from the same call. `var.public_origin` takes the tfvars assignment; a plain string literal is the origin itself.

What fails:
- A `false`, whether a literal in the call or an assignment in tfvars, fails unless its line carries `# hook off until <reason>`. Such a root is named in the census.
- A default of `false`, in the root or in the module, fails with no exemption.
- So does any of these:
  - an expression the guard cannot read, such as `local.x`;
  - an undeclared `var.<switch>`;
  - a switch passed twice;
  - a value that no tracked file holds (no tfvars line and no default);
  - a root with no call of the module.

Supporting changes:
- `readHookDefault` is replaced by `readBoolDefault`, which also reports a variable that has no default.
- `blocks` now uses `blocksAt`, which also returns each block's offset, so that line numbers are known.
- The doc block describes the resolution.

**Self-test:** 11 new cases.
- root tfvars line removed, root default `false`: finding against the root's `variables.tf`;
- the same with root default `true`: passes;
- tfvars line removed, no root default: finding;
- module call passes a literal `false`: finding against the root's `main.tf`;
- literal `false` with the stated comment: passes, and the census names the root;
- literal `true` over a tfvars `false`: passes, because the call decides;
- `local.hooks_on`: finding;
- undeclared variable: finding;
- literal loopback origin: finding;
- `local.origin`: finding;
- a module call of another module: finding.

The existing "tfvars sets false" case is kept. Total: 77 cases.

**Spec:** two red controls on a copy of `infra/envs`:
- the staging call passes `enable_send_email_hook = false`;
- the staging tfvars has no access-token line, and the root default is `false`.

A third test passes on the unedited copy.

**Red control on the real tree:** I ran both guards on three copies of `infra/envs`. All three used to exit 0 and are now red:
- the staging tfvars sets `false`;
- the staging tfvars line is removed and the root default is `false`;
- a `prod` root passes a literal `false`.

The previous guard exited 0 on the last two; the new one exits 1 on all three. The real tree stays green.

**needs-operator-apply:** none

### WR-21: A Supabase root with no tracked `terraform.tfvars` is skipped without a finding

**Status:** fixed
**Commit:** faa06e482
**Files:** `scripts/assert-hosted-settings-parity.mjs`, `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`

**What changed:**
- `readRoots` now treats a directory `envs/<env>/<root>` as a Supabase root when it is named `supabase` or when its `.tf` files call `modules/supabase`.
- A root found under another name is shown in the census as `<env>/<root>`.
- A root with no `terraform.tfvars` is kept, marked missing, and reported as `root/terraform.tfvars`.
- A root that passes `var.public_origin` while its tfvars assigns none is now a finding of its own. This is in addition to the existing rule that some root must yield an origin.

**Self-test:** two new cases, a missing tfvars and a tfvars without `public_origin`. The "no origin at all" case now expects three findings, one per root plus the envs-level one, each in its named file. Total: 79 cases.

**Spec:** two red controls:
- a `prod/supabase` root with no tfvars: exit 1, naming `prod/supabase/terraform.tfvars`;
- a root under `prod/app` with `enable_send_email_hook = false`: exit 1, naming `prod/app/terraform.tfvars`.

The previous guard exited 0 on both.

**needs-operator-apply:** none

### WR-22: A quoted or spaced TOML table header after a non-family table is ignored

**Status:** fixed
**Commit:** 2068572dc
**Files:** `scripts/assert-hosted-settings-parity.mjs`, `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`

**What changed:**
- A new `tableName` trims each dotted part of a header and strips the quotes around a quoted bare key, whether in `"` or `'` quotes. It then tests the result again.
- A header that still cannot be read is a `config/table-header` finding, whatever table came before it.
- The keys after such a header are attributed to an in-family sentinel table, `(unreadable)`, so each of them fails as unclassified.

**Self-test:** three new cases, each placed after `[edge_runtime]`:
- `[auth.external."github"]`: the key fails as unclassified;
- `[auth . external . google]`: the same;
- `[auth.external."git hub"]`: a header finding, plus the key under the sentinel.

Total: 82 cases.

**Spec:** a red control on a copy of the real `config.toml` with `[auth.external."github"]` appended. On a copy with both of the review's headers appended after `[experimental]`, the previous guard exited 0 and the new one exits 1 with two unclassified keys.

**needs-operator-apply:** none

### WR-23: The second-writer scan misses spellings of the push command and two directories

**Status:** fixed
**Commit:** a775f8509
**File:** `scripts/assert-hosted-settings-parity.mjs`

**What changed:** `PUSH_COMMAND` is still built from `PUSH_WORDS`, so the guard's own source never holds the command whole. It now allows:
- an optional `@<version>` on the CLI name;
- any number of flags in either gap, with or without a value;
- quotes, commas and brackets as separators, which matches the exec-form array.

`WRITER_DIRS` gains `apps/supabase/` and `tests/scripts/`. The gate now scans 334 tracked files, up from 203, and finds nothing.

**Self-test:** eight new cases:
- `npx` with `@latest`;
- `bunx` with `@2.40.0`;
- `--debug` before the middle word;
- `--workdir apps/supabase` before it and `--debug` after it;
- an exec-form array;
- a script under `apps/supabase/scripts/`;
- a script under `tests/scripts/`;
- `npx supabase@latest db push`, which must pass.

Total: 90 cases. The old pattern matched none of the review's four spellings; I checked this in `node`.

**needs-operator-apply:** none

### WR-24: "One owner per key" does not constrain what is merged into `local.auth` / `local.api`

**Status:** fixed
**Commit:** 3049e7376
**Files:** `scripts/assert-hosted-settings-parity.mjs`, `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`

**What changed:** the guard now reads the module's `locals` blocks, with each argument's whole expression across lines (`fullExpression`, `callArguments`). Each of these is a finding:
- `module/local.auth`: `local.auth` is not exactly `merge(local.hosted.auth, local.auth_hook, local.auth_send_email_hook, local.auth_rate_limits, local.auth_origin, local.auth_smtp)` in that order, or is not defined exactly once;
- `module/local.api`: `local.api` is not exactly `local.hosted.api`, or is not defined exactly once;
- `module/merge`: any other `merge(` call;
- `module/decode`: any call that reads a file or decodes a string (`jsondecode`, `yamldecode`, `csvdecode`, `base64decode`, `textdecodebase64`, `file`, `filebase64`, `templatefile`, `templatestring`, `fileset`), apart from the one read of `hosted-settings.json`;
- `module/variable-type`: any module variable whose type holds `map` or `any`. Such a variable can bring in keys that no word in the code names, which the merge check alone would not catch.

The doc block has a new "nothing else merged" row.

The embedded module fixture now matches the real module. `smtp_user` is sent by the `smtp_secret` resource, the `smtp` object has no `user` attribute, and a sensitive `smtp_user` variable is declared. This is the alignment lane B noted.

**Self-test:** six new cases:
- a `map(any)` variable merged last into `local.auth`;
- a second `jsondecode(file(...))` merged last;
- the merged maps in another order;
- a `merge` inside `auth_hook`;
- a second decoded file in a local;
- `local.auth` defined twice.

Five existing cases now also expect the new finding their own edit produces; their original findings are still expected. Total: 96 cases.

**Spec:** a red control on a copy of the module with `var.extra_auth` merged last. The review's own scenario (`var.extra_auth` of type `map(any)` with `default = {}`, plus `jsondecode(file("${path.module}/extra.json"))` merged last) made the previous guard exit 0. The new guard exits 1 with `module/local.auth`, `module/decode` and `module/variable-type`.

**needs-operator-apply:** none

### WR-25: The IAM guard skips symlinks and does not enforce "no external module"

**Status:** fixed
**Commit:** 520ab4c62

**Files:**
- `scripts/assert-no-inline-iam-policies.mjs`, `packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts`
- `scripts/fixtures/no-inline-iam-policies/{expected.violations,ok/main.tf,violations/main.tf}`
- new: `scripts/fixtures/no-inline-iam-policies/ok/child/main.tf` and `violations/linked.tf`, a symlink to `../ok/main.tf`

**What changed:**
- `walk` collects every symbolic link and does not follow it. Each link is reported as `<path>: path matches symbolic link`.
- A `module` block whose `source` is not a `./` or `../` path that resolves under the scanned root is reported as `module source outside the root`. So is a block with no single readable `source`.
- The doc block lists both. The "cannot see" paragraph no longer claims an unenforced assumption.

**Fixtures:**
- The violating root gains the symlink, a registry module (`terraform-aws-modules/iam/aws//modules/iam-role` with `create_inline_policy = true`) and a `../../elsewhere` module.
- The clean root gains a `./child` module and its file, which must pass.
- `expected.violations` lists the three new findings.

**Spec:** both finding names are added. A new red control builds a root whose `linked.tf` points at `../outside/iam.tf`, which holds an `aws_iam_role_policy`; the guard exits 1. The previous guard reported none of the three new findings on the new fixture.

`infra/` holds no symlink outside `.terraform/`, and every module source there is a local path. The gate still reads 42 `.tf` files and reports 0 findings.

**needs-operator-apply:** none

### WR-26: `awscc` inline policies are not matched, and the exclusive check needs a quoted label

**Status:** fixed
**Commit:** 45d9b8d88
**Files:** `scripts/assert-no-inline-iam-policies.mjs`, `packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts`, `scripts/fixtures/no-inline-iam-policies/{expected.violations,ok/main.tf,violations/main.tf}`

**What changed:**
- New patterns:
  - `awscc_iam_*_policy` matches `\bawscc_iam_(user|role|group)_policy\b`;
  - `cloudformation stack` matches `\baws(?:cc)?_cloudformation_stack\w*`. It covers stacks, stack sets and instances, and closes a blind spot the doc used to list.
- A new block read, `awscc_iam_* policies`, reports a `policies =` argument inside an `awscc_iam_{user,role,group}` resource block.
- `EXCLUSIVE.start` and the awscc block start accept a bare type label (`"?...?"\s`).
- The doc's "cannot see" paragraph now names what is still out of reach: an inline policy written by a provisioner or an external program, and policies that already exist in an account.

**Is the bare label real HCL?** I could not run `terraform validate`, because it needs a provider download. Instead I passed `resource aws_iam_group_policies_exclusive bare { ... }` to `terraform fmt -`, which parses it (exit 0) and rewrites it with quotes. So HCL accepts the bare label.

**Fixtures:**
- The violating root gains:
  - a bare-label `aws_iam_group_policies_exclusive` with `policy_names = ["kept"]`;
  - an `awscc_iam_role_policy`;
  - an `awscc_iam_role` with `policies = [...]`;
  - an `aws_cloudformation_stack`.
- The clean root gains an `awscc_iam_role` with `managed_policy_arns` only, which must pass.
- The violating root now gives 16 findings, up from 12.

The previous guard reported none of these four on the new fixture.

**needs-operator-apply:** none

### WR-18: `infra-validate` runs PR code with an unscoped `GITHUB_TOKEN` persisted into `.git/config`

**Status:** fixed
**Commit:** 97d9c7c79
**Files:** `.github/workflows/main.yaml`, `packages/dev-seed/tests/infraValidateJobGate.test.ts`

**What changed:**
- The job declares `permissions: contents: read`, and its checkout step sets `with: persist-credentials: false`. The job's comment states both.
- No later step needs git credentials:
  - `terraform init -backend=false` uses only local module sources;
  - `check-settings-types.sh` calls no git.
- The block is at job level only. A workflow-level block would also bind every other job. `supabase-tests` runs `dorny/paths-filter`, which reads the pull request's changed files through the API, so `contents: read` alone could break it on pull requests. No other job is changed.

**Spec:**
- New readers: `uncommented`, `blockOf`, `jobPermissions` and `checkoutsKeepingToken`.
- New assertions:
  - the job's grants are exactly `['contents: read']`, and a job with no block reads as `(none)`;
  - every `actions/checkout` step of the job sets `persist-credentials: false` within its own step.
- Red controls on made-up job text: no block; `write-all`; an extra `id-token: write`; a checkout without the setting; the setting on another step.

**needs-operator-apply:** none. This is a CI-only change. GitHub runs it on the next push or pull request, and no hosted command was run here.

### WR-19: The spec's "holds no credentials" tests have blind spots

**Status:** fixed
**Commits:** 77bfe4a71, and eda25307f. The first run of `yarn lint:check` exited 1: the comment-hygiene guard refused two `//` comments that wrapped across lines, one added under WR-18 and one under WR-19. eda25307f puts each on one line.
**File:** `packages/dev-seed/tests/infraValidateJobGate.test.ts`

**What changed:**
- A new `CREDENTIAL_READ` replaces `/\bsecrets\./`. It matches the `secrets` context in any `${{ }}` expression, `secrets.`, `secrets[`, a `secrets:` key, and `github.token`.
- The job block must not match it.
- Over the whole workflow, comments dropped:
  - the top-level `env:` must not match it;
  - the top-level `permissions:` must not match `WIDE_GRANT` (`write`, `write-all` or `id-token`).
- The test comment says why the workflow-level permissions are still held: the job's own block replaces them only while that block is there.

**Red controls on made-up text:**
- `${{ secrets['AWS_KEY'] }}`, `${{ toJSON(secrets) }}`, `${{ github.token }}`, `${{ secrets.X }}` and `secrets: inherit`;
- a workflow-level `env` that reads a secret;
- a workflow-level `id-token: write`;
- a workflow-level `write-all`;
- a workflow-level `contents: read`, which must not be flagged.

The docstring says the workflow level is checked.

**needs-operator-apply:** none

### WR-20: The state-key tests silently skip any root whose backend lives in `backend.tf`

**Status:** fixed
**Commit:** d7578a411
**File:** `packages/dev-seed/tests/infraValidateJobGate.test.ts`

**What changed:**
- `rootBackends` reads every backend block from all of a root's `.tf` files.
- `roots()` lists the bootstrap root and every `infra/envs/<env>/<root>` that holds a `.tf` file.
- `backendKeys()` is built from these, and the `pipeline_state_key` test uses them.

New assertions:
- Every root has exactly one backend, and it is S3 unless the root is on `LOCAL_BACKEND_ROOTS`, which holds only `infra/envs/scratch/supabase`. A root on that list must have a local backend.
- Every root in `REQUIRED_ROOTS` yields an S3 key.
- Every entry on the allow-list exists.

So a root that the reader misses fails by name.

**Red control on made-up files:** a root whose backend is in `backend.tf`, next to a commented-out decoy, yields that key. A root with no backend yields none.

**needs-operator-apply:** none

### Gates (main checkout, after the last commit eda25307f)

| Gate | Exit |
| ---- | ---- |
| `yarn format:check` | 0 |
| `node scripts/assert-hosted-settings-parity.mjs` | 0 |
| `node scripts/assert-hosted-settings-parity.mjs --self-test` (96 cases) | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs` (42 `.tf` files, 0 findings) | 0 |
| `node scripts/assert-no-inline-iam-policies.mjs --self-test` (16/16 findings, 0 on the clean root) | 0 |
| `terraform fmt -check -recursive infra` | 0 |
| three dev-seed specs (`infraValidateJobGate`, `hostedSettingsParityGate`, `noInlineIamPoliciesGate`): 57 tests | 0 |
| `bash infra/scripts/check-settings-types.sh` | 0 |
| `yarn lint:check` (final run; the first run exited 1, fixed by eda25307f) | 0 |

No `.tf` file under `infra/` was edited, so no root was re-validated.

_Fixer: Claude (gsd-code-fixer), lane C, iteration 1_

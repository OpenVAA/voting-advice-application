---
phase: 183-terraform-foundation-and-supabase-as-code
reviewed: 2026-10-25T09:23:56Z
depth: standard
files_reviewed: 83
files_reviewed_list:
  - .dockerignore
  - .github/workflows/main.yaml
  - .gitignore
  - infra/.terraform-version
  - infra/README.md
  - infra/bootstrap/.terraform.lock.hcl
  - infra/bootstrap/README.md
  - infra/bootstrap/backend.tf
  - infra/bootstrap/example.tfvars
  - infra/bootstrap/main.tf
  - infra/bootstrap/outputs.tf
  - infra/bootstrap/terraform.tfvars
  - infra/bootstrap/variables.tf
  - infra/envs/example/aws/.terraform.lock.hcl
  - infra/envs/example/aws/main.tf
  - infra/envs/example/aws/terraform.tfvars
  - infra/envs/example/aws/variables.tf
  - infra/envs/example/dns-mail/.terraform.lock.hcl
  - infra/envs/example/dns-mail/main.tf
  - infra/envs/example/dns-mail/terraform.tfvars
  - infra/envs/example/dns-mail/variables.tf
  - infra/envs/example/supabase/.terraform.lock.hcl
  - infra/envs/example/supabase/main.tf
  - infra/envs/example/supabase/terraform.tfvars
  - infra/envs/example/supabase/variables.tf
  - infra/envs/scratch/supabase/.terraform.lock.hcl
  - infra/envs/scratch/supabase/main.tf
  - infra/envs/scratch/supabase/terraform.tfvars
  - infra/envs/scratch/supabase/variables.tf
  - infra/envs/staging/aws/.terraform.lock.hcl
  - infra/envs/staging/aws/main.tf
  - infra/envs/staging/aws/terraform.tfvars
  - infra/envs/staging/aws/variables.tf
  - infra/envs/staging/dns-mail/.terraform.lock.hcl
  - infra/envs/staging/dns-mail/DELEGATION.md
  - infra/envs/staging/dns-mail/README.md
  - infra/envs/staging/dns-mail/main.tf
  - infra/envs/staging/dns-mail/terraform.tfvars
  - infra/envs/staging/dns-mail/variables.tf
  - infra/envs/staging/supabase/.terraform.lock.hcl
  - infra/envs/staging/supabase/README.md
  - infra/envs/staging/supabase/main.tf
  - infra/envs/staging/supabase/terraform.tfvars
  - infra/envs/staging/supabase/variables.tf
  - infra/modules/budget/main.tf
  - infra/modules/budget/outputs.tf
  - infra/modules/budget/variables.tf
  - infra/modules/dns-zone/main.tf
  - infra/modules/dns-zone/outputs.tf
  - infra/modules/dns-zone/variables.tf
  - infra/modules/github-oidc/main.tf
  - infra/modules/github-oidc/outputs.tf
  - infra/modules/github-oidc/policies.tf
  - infra/modules/github-oidc/variables.tf
  - infra/modules/mail-ses/main.tf
  - infra/modules/mail-ses/outputs.tf
  - infra/modules/mail-ses/smtp.tf
  - infra/modules/mail-ses/variables.tf
  - infra/modules/registry/README.md
  - infra/modules/registry/main.tf
  - infra/modules/registry/outputs.tf
  - infra/modules/registry/variables.tf
  - infra/modules/state-bucket/main.tf
  - infra/modules/state-bucket/outputs.tf
  - infra/modules/state-bucket/variables.tf
  - infra/modules/supabase/hosted-settings.json
  - infra/modules/supabase/main.tf
  - infra/modules/supabase/outputs.tf
  - infra/modules/supabase/settings.tf
  - infra/modules/supabase/variables.tf
  - infra/scripts/account-inventory.sh
  - infra/scripts/check-settings-types.sh
  - package.json
  - packages/dev-seed/tests/hostedSettingsParityGate.test.ts
  - packages/dev-seed/tests/infraValidateJobGate.test.ts
  - packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts
  - scripts/assert-hosted-settings-parity.mjs
  - scripts/assert-no-inline-iam-policies.mjs
  - scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json
  - scripts/fixtures/no-inline-iam-policies/expected.violations
  - scripts/fixtures/no-inline-iam-policies/ok/main.tf
  - scripts/fixtures/no-inline-iam-policies/violations/extra.tf.json
  - scripts/fixtures/no-inline-iam-policies/violations/main.tf
findings:
  critical: 1
  warning: 26
  info: 23
  total: 50
status: issues_found
---

# Phase 183: Code Review Report

**Reviewed:** 2026-10-25T09:23:56Z
**Depth:** standard
**Files Reviewed:** 83
**Status:** issues_found

## Summary

The review covers the phase's 83-file scope: the SUMMARY `key-files` lists (82 files) plus `infra/.terraform-version`, which the evaluation-scope resolver's cross-check added. The resolver (`check evaluation-scope`, source `task-commits`, status `resolved`, base `151d2303b`) reported a further 268 paths changed in the phase window by commits that are not this phase's task commits. Following the workflow, those stayed out of scope; most are under `apps/frontend`, `scripts/fixtures` and `tests/`. State files, plan files, `.terraform/` directories and `tmp/183-evidence/` were not read.

The scope was split across three `gsd-code-reviewer` lanes by directory, and their findings are merged here with IDs renumbered across the whole report (map at the end). Each lane's own summary follows, with its IDs rewritten to the merged numbering.

### Lane A: bootstrap root, the seven modules, infra READMEs

I reviewed the bootstrap root, all seven modules (state-bucket, registry, budget, github-oidc, dns-zone, mail-ses, supabase), the hosted settings JSON and the two infra READMEs. For context only, I also read the staging/example env roots, `.github/workflows/main.yaml` and the Claude workflows. I ran no credentialed command and read no state or plan file.

The state bucket hardening is sound: private, SSE-S3, versioned, BucketOwnerEnforced, TLS-only, prevent_destroy. The deploy role's S3 allow-list is tight. Sensitive variables and outputs are marked correctly.

The weak point is the plan role. It carries the AWS-managed `ReadOnlyAccess` with a two-statement deny, and its trust binds only the `:pull_request` subject. Together these give account-wide data-plane read access to any job in the repository that obtains a pull-request OIDC token. The `hand/` deny that keeps hand-applied state away from that role is a key-prefix convention, and it can be bypassed. The invariant behind it is enforced nowhere in code.

The Supabase module has two unguarded SMTP paths. A set `smtp` with no `smtp_password` sends a null password. The two settings resources write the same auth configuration with no ordering.

The rest is documentation drift and comments that contradict the code. I found no BLOCKER-class defect that is live today: the pipeline root is still empty and SMTP is not yet configured on staging.

### Lane B: environment roots and infra scripts

Lane B covers the seven environment roots (example, scratch and staging), their lock files, variable files and runbooks, and the two scripts under `infra/scripts/`. I read every file and checked it against the modules each root calls (`infra/modules/{dns-zone,mail-ses,supabase}`), the bootstrap example inputs, the `infra-validate` CI job and `.gitignore`/`.dockerignore`. Everything was inspected locally and read-only. No script was executed, no Terraform command was run and no state or plan file was opened.

What holds up:
- **Wiring:** every module argument matches a declared module variable.
- **State keys:** each root has its own key, and no two collide (`pipeline/staging/aws`, `hand/staging/{dns-mail,supabase}`, `pipeline/example/aws`, `hand/example/{dns-mail,supabase}`, and the scratch root on a local backend).
- **Lock files:** they are identical across roots of the same provider. Each pins one exact version (aws 6.68.0, supabase 1.11.0) and carries `zh:` hashes for every platform.
- **Ignored files:** `tfplan` and `*.tfstate*` are git-ignored, and the whole of `infra/` is excluded from the Docker build context.
- **Committed values:** no committed tfvars holds a secret. The account id, bucket name, organisation slug, project ref and hosted zone id are committed on purpose as public identifiers.

The defects found are these:
- **The account-inventory assertions overclaim.** The assert modes never check which account they ran against, and the "managed-only" mode does not check what its name and the runbook say it checks.
- **The SMTP inputs can fail silently or leak.** They allow a null password, and they route the SMTP user name (an access key id the dns-mail runbook treats as half a credential) into a tracked, public tfvars file.
- **The env-root `auth_rate_limits` type shadows the module defaults.** Its description says the module's defaults apply, but the env root's own copy of them is what gets sent.
- **The runbook contradicts the code or invites a mistake in places.** The dns-mail runbook says the apply creates the suppression setting, which staging turns off. A copy-paste trap in the scratch rehearsal deletes the plan before the apply.
- **The supabase provider constraint is wider than the version whose source the safety analysis was done against.**

### Lane C: guard scripts, gate tests, CI workflow, ignore rules, package.json

Lane C covers the two new guards (`assert-hosted-settings-parity.mjs`, `assert-no-inline-iam-policies.mjs`) with their fixtures, the three vitest gate specs, the new `infra-validate` CI job, and the phase's edits to `.gitignore`, `.dockerignore` and `package.json`. For the files that existed before the phase, only `git diff 151d2303b..HEAD` was reviewed.

What was run (all offline): both guards in gate mode and `--self-test` (all green: IAM 42 `.tf` files, 0 findings; parity 66 live keys, 3 origins, 66 self-test cases), and the three vitest files (36/36 pass). Each false negative below was then confirmed by running the real guard against inputs built in the scratchpad (`--root`, `--config`, `--envs-dir`, `--module-dir`). No source file was changed.

Main concerns:
- **The parity guard gets the hook-switch rule wrong.** It reads the default from the module's `variables.tf`, but every Supabase root passes `var.<switch>` through and declares its own default. So a root can turn either hook off while the guard stays green and its census reports "not applied in: none" (CR-01).
- **The parity guard has several confirmed false negatives:** a TOML table header that is quoted or has spaces around its dots, the push command written with a version pin or a global flag, extra arguments added to the module's `merge`, and a Supabase root that has no `terraform.tfvars` (WR-21 to WR-24).
- **The IAM guard can be bypassed** through a symlinked `.tf` file, a module sourced from a registry, or the `awscc` provider (WR-25, WR-26).
- **The `infra-validate` job says it holds no credentials, but nothing scopes its `GITHUB_TOKEN`.** The workflow has no `permissions:` block anywhere, and `actions/checkout` writes the token into `.git/config`. The job then runs a bash script and provider binaries that come from the PR's own tree. The spec that guards this job reads only the job block, so it cannot see workflow-level grants (WR-18, WR-19).

The `.gitignore` block is sound for the plan names the READMEs actually use (`-out=tfplan`) and for state, crash logs and CLI credentials. The `.dockerignore` change is correct for Docker's ordering rules, and the Dockerfile COPYs only `apps`, `packages` and `scripts`. So `tmp/` and `infra/` never reach an image layer.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The hook-switch rule reads the wrong default and ignores the root's module call, so a root can switch either hook off with the guard green

**File:** `scripts/assert-hosted-settings-parity.mjs:984-1014` (also `699-713`, `720-750`, `2213`)
**Issue:** The guard says (lines 32-35): "No assignment means the module's default, which must be `true`". That does not match how the roots are built. Every Supabase root (`infra/envs/{staging,scratch,example}/supabase/main.tf`) passes `enable_access_token_hook = var.enable_access_token_hook` and `enable_send_email_hook = var.enable_send_email_hook` into the module. Each root declares its own `variable` with its own `default`. When `terraform.tfvars` does not assign a switch, the value that applies is therefore the **root's** default, and the module's default is never used. The guard reads only the module's `variables.tf` (`readHookDefault(inputs.variables.text, …)`, with `variables` fixed to `<moduleDir>/variables.tf` at line 2213). It also never reads the root's `main.tf`, so a literal `enable_send_email_hook = false` in the module call is invisible to it.

Confirmed with `--envs-dir` against a copied tree:
- staging root: the `enable_send_email_hook` line removed from `terraform.tfvars`, and the root's `variables.tf` default set to `false`;
- a `prod` root whose `main.tf` passes `enable_send_email_hook = false` literally.

The guard exited 0 and printed `send-email hook not applied in: none`.

These are the exact edits the rule exists to catch. With the send-email hook off, the hosted auth service sends its own mail. With the access-token hook off, tokens no longer carry the claims that row-level security reads. Meanwhile the census, which is the guard's audit record, reports that both hooks are applied everywhere.

**Fix:** Make the root the unit of evaluation:
```js
// per root: read <root>/main.tf and <root>/variables.tf as well as terraform.tfvars
// 1. In the module "supabase" block, each switch must be passed as `<switch> = var.<switch>`;
//    any other right-hand side (a literal, a local, an expression) is a finding.
// 2. Effective value = tfvars assignment ?? root variables.tf default ?? (no default → finding).
//    Only fall back to the module default when the module call omits the argument entirely.
// 3. Apply the existing `# hook off until <reason>` rule to whichever source yields `false`.
```
A simpler and stricter alternative: require every root's `terraform.tfvars` to assign both switches explicitly, and require `main.tf` to pass `var.<switch>`. Then neither default matters. Add a self-test case for each of the two shapes above.

## Warnings

### WR-01: The plan role's `ReadOnlyAccess` reads all data in a shared account; the deny list covers only one bucket prefix and two secret APIs

**File:** `infra/modules/github-oidc/policies.tf:92-117`, `infra/modules/github-oidc/policies.tf:138-141`
**Issue:** `arn:aws:iam::aws:policy/ReadOnlyAccess` is not a metadata-only policy. It includes data-plane reads:
- `s3:Get*` on every bucket in the account
- `dynamodb:GetItem/Query/Scan/BatchGetItem`
- `logs:GetLogEvents/FilterLogEvents/StartQuery`
- `lambda:GetFunction` and `GetFunctionConfiguration`, which return environment variables in clear
- `ecs:DescribeTaskDefinition`, which returns container environment
- `ssm:GetParameter*` for String parameters
- `cloudformation:GetTemplate`, and more

`plan_deny` subtracts only the state bucket's `hand/*` objects and Secrets Manager/KMS. The account is shared: `envs/staging/dns-mail/terraform.tfvars:15` records other SES identities in the same region. The plan role is assumable by any job whose OIDC token has the subject `repo:OpenVAA/voting-advice-application:pull_request` (see WR-03). So every such job can read all data the account holds outside those two exclusions.

The policy description "Explicit deny for the plan role: the state of hand-applied roots and every secret read" (line 115) overstates what it does. So does the module header (line 3), "The plan role is denied secret reads".
**Fix:** Narrow the read surface. Either attach `ViewOnlyAccess` plus an explicit, per-service read policy for the resource types the pipeline root actually declares, or keep `ReadOnlyAccess` and extend `plan_deny` with the data-plane reads a plan never needs:
```hcl
statement {
  sid    = "DenyDataPlaneReads"
  effect = "Deny"
  actions = [
    "dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query", "dynamodb:Scan",
    "logs:GetLogEvents", "logs:FilterLogEvents", "logs:StartQuery", "logs:GetQueryResults",
    "ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath",
  ]
  resources = ["*"]
}
```
Also reword the description to state exactly what is denied.

### WR-02: The `hand/` deny is bypassed by any non-default workspace of a hand-applied root

**File:** `infra/modules/github-oidc/policies.tf:94-98`; claim in `infra/README.md:26-29`
**Issue:** The deny covers `${bucket}/hand/*` only. The S3 backend stores a non-default workspace's state at `<workspace_key_prefix>/<workspace>/<key>`, with `env:` as the default prefix. If an operator ever runs `terraform workspace new x` in `envs/staging/dns-mail`, that root's state, including the SMTP secret, lands at `env:/x/hand/staging/dns-mail/terraform.tfstate`. That key is outside the deny, and `ReadOnlyAccess` allows `s3:GetObject` on it. The same applies to any hand root whose backend key is typed without the `hand/` prefix.

The README's guarantee, "neither workflow role can read the state of a root applied by hand", therefore rests on an unenforced naming convention. Nothing in the code stops a workspace from being created.
**Fix:** Deny every workspace-prefixed key as well, so that the only readable state is the default-workspace pipeline key:
```hcl
resources = [
  "${var.state_bucket_arn}/${var.hand_state_prefix}*",
  "${var.state_bucket_arn}/env:/*",
]
```
Better still: the plan role needs only one object in this bucket. Deny `s3:GetObject*` on `${bucket}/*` in a statement whose `not_resources` are `local.pipeline_state_arn` and `local.pipeline_lock_arn`, scoped through a condition `StringEquals aws:ResourceAccount` / `s3:ResourceAccount` together with `ArnLike` on the bucket. Separately, add a line to `infra/README.md` § Rules of every apply: hand roots use the default workspace only.

### WR-03: Trust policies pin only `sub`; any pull-request-triggered job in the repo, including the AI-agent workflows, can assume the plan role, and the deploy role depends on an unenforced GitHub setting

**File:** `infra/modules/github-oidc/main.tf:23-105`; `infra/bootstrap/terraform.tfvars:16-18`
**Issue:**
1. The plan trust admits every token with `sub = repo:OpenVAA/voting-advice-application:pull_request`. That covers every workflow file and every job, including workflows the PR itself adds or edits. The repository already has jobs that request `id-token: write` and act on PR content: `.github/workflows/claude-code-review.yml:24`, reached from `claude.yml` on `pull_request_review*` events, and `claude.yml:7`. A job like that, or a `yarn test:*` step it runs from the PR checkout, can exchange its token for the plan role. The trust carries no `job_workflow_ref` (or workflow) restriction.
2. The deploy trust admits any job that declares `environment: staging`, from any branch, unless the GitHub Environment has a deployment-branch policy. That policy lives outside this code, and neither README states it as a prerequisite.
3. The staging tfvars set neither `github_repository_id` nor `github_repository_owner_id`, so both trusts are name-only. If the org or repository is renamed and the old name is taken by someone else, the name-based subject matches their tokens.

The module also offers `repository_id`/`repository_owner_id` conditions. That AWS STS evaluates those GitHub claim keys is listed nowhere in the "Not yet observed" table of `infra/bootstrap/README.md`. If AWS does not evaluate them, setting them makes the roles unassumable. That failure is closed, but it is unobserved.
**Fix:** Pin the workflow. Customise the repository's OIDC subject template (`include_claim_keys: ["repo","context","job_workflow_ref"]`) so that `sub` carries the workflow path, then write the exact subjects in `plan_subjects`/`deploy_subjects`. Alternatively, add a `StringEquals` condition on `token.actions.githubusercontent.com:job_workflow_ref` once AWS support for that key is confirmed. Set the numeric repository and owner ids in `terraform.tfvars`; they are public. Add "the `staging` Environment restricts deployments to `main`" as a prerequisite in `infra/README.md`, and add the AWS claim-key support to the "Not yet observed" table.

### WR-04: The plan role can create and delete the pipeline root's lock object

**File:** `infra/modules/github-oidc/policies.tf:119-134`
**Issue:** `plan_lock` grants `s3:PutObject` and `s3:DeleteObject` on `pipeline/.../terraform.tfstate.tflock` to the role every PR job can assume (WR-03). Such a job can do two things:
- put a lock object and leave it, so every deploy fails with "Error acquiring the state lock" until someone runs a manual `force-unlock`;
- delete the lock while a deploy apply holds it, which removes the only guard against a concurrent second apply writing the same state.

A plan does not need the lock, because it writes no state.
**Fix:** Drop `plan_lock` and its attachment, and run PR plans with `terraform plan -lock=false`. If locking during plan is really wanted, document the trade-off in the module header and keep `DeleteObject` off the plan role. Without `DeleteObject`, the plan role cannot release its own lock, so the stronger fix is `-lock=false`.

### WR-05: Nothing enforces that `pipeline_state_key` lies outside the hand prefix

**File:** `infra/bootstrap/variables.tf:69-72`; `infra/modules/github-oidc/variables.tf:58-67`
**Issue:** The security boundary between the workflow roles and hand-applied state (`infra/README.md:26-29`) depends on `pipeline_state_key` not starting with `hand_state_prefix`. Neither variable carries a validation. A typo or copy-paste such as `pipeline_state_key = "hand/staging/aws/terraform.tfstate"` would do two things silently:
- grant the deploy role read-write on a `hand/` key;
- leave the plan role's `plan_lock` pointing at a key whose state it is denied.

Both plans would look benign.
**Fix:**
```hcl
variable "pipeline_state_key" {
  # ...
  validation {
    condition     = startswith(var.pipeline_state_key, "pipeline/") && endswith(var.pipeline_state_key, "/terraform.tfstate")
    error_message = "pipeline_state_key must lie under pipeline/ and name a terraform.tfstate object."
  }
}
```
Add, in the module, a cross-variable check (Terraform >= 1.9) that `!startswith(var.pipeline_state_key, var.hand_state_prefix)`.

### WR-06: A set `smtp` with an unset `smtp_password` sends `{"smtp_pass": null}` to the hosted auth config

**File:** `infra/modules/supabase/main.tf:50-55`; `infra/modules/supabase/variables.tf:73-78`
**Issue:** `smtp_secret` is counted on `var.smtp == null`, not on `var.smtp_password`. `smtp_password` defaults to `null`. An operator who adds the `smtp` object to `terraform.tfvars` (staging tfvars line 6 says this will happen) but forgets `export TF_VAR_smtp_password=…` gets a plan that sends `auth = jsonencode({ smtp_pass = null })`, which is `{"smtp_pass":null}`. Because the value is sensitive, the plan shows only `(sensitive value)`, so the operator cannot see that the value is null. The hosted API then either clears the password or rejects the call. Either way, custom SMTP for the auth service breaks while the main settings resource has already applied the new host and user.
**Fix:** Add a cross-variable validation:
```hcl
variable "smtp_password" {
  # ...
  validation {
    condition     = var.smtp == null || (var.smtp_password != null && var.smtp_password != "")
    error_message = "smtp_password must be set (TF_VAR_smtp_password) whenever smtp is set."
  }
}
```

### WR-07: The two `supabase_settings` resources write the same auth configuration concurrently, with no ordering

**File:** `infra/modules/supabase/main.tf:39-55`
**Issue:** `supabase_settings.this` (the `smtp_*` keys) and `supabase_settings.smtp_secret` (`smtp_pass`) both PATCH the project's auth config. They share no dependency, so Terraform applies them in parallel. A server-side read-modify-write of the auth config can lose one partial update to the other. Separately, the first SMTP enablement sends `smtp_host`/`smtp_user` without a password, and the API may refuse that if it validates the SMTP block as a whole.

The comment at lines 47-48 calls this setup "untried", and the staging README lists it as unobserved. The race itself is avoidable today.
**Fix:** Serialise the two writers so that each PATCH sees the other's result:
```hcl
resource "supabase_settings" "smtp_secret" {
  count      = var.smtp == null ? 0 : 1
  depends_on = [supabase_settings.this]
  # ...
}
```
Alternatively, write the password first and make the main resource depend on it, if the API validates the SMTP block as a whole.

### WR-08: `mail-ses` trusts a separate `aws_region` input instead of the provider's region

**File:** `infra/modules/mail-ses/main.tf:53`; `infra/modules/mail-ses/outputs.tf:21-24`; `infra/modules/mail-ses/variables.tf:11-14`
**Issue:** The MAIL FROM MX target (`feedback-smtp.${var.aws_region}.amazonses.com`) and the advertised SMTP endpoint come from `var.aws_region`. The SMTP password (`ses_smtp_password_v4`) and the identity itself come from the provider's region. The variable description says the two "must equal", but nothing checks it. On a mismatch, the MX points at the wrong region's feedback host, MAIL FROM verification fails, and `behavior_on_mx_failure = "REJECT_MESSAGE"` (line 44) then stops all sending. The `smtp_endpoint` output also names an endpoint the password is not valid for.
**Fix:** Derive the region and drop the input, or at least assert equality:
```hcl
data "aws_region" "current" {}

locals {
  aws_region = data.aws_region.current.region
}
```
Alternatively, keep the variable and add `lifecycle { precondition { condition = var.aws_region == data.aws_region.current.region ... } }` on the identity.

### WR-09: The assert modes of account-inventory.sh never check the caller's account, so a PASS can describe another account

**File:** `infra/scripts/account-inventory.sh:666-685` (also `:141-156`, `:658-664`)
**Issue:** `--assert-no-inline-user-policies` and `--assert-managed-only` run only `collect_users` / `collect_roles`. They never call `aws sts get-caller-identity`, and never compare the account with `ACCOUNT_ID`. So from a shell signed in to any other account, they print `assert: PASS` and exit 0 for that account. The header (lines 28-29) says the caller "is compared with" `OPENVAA_ACCOUNT_ID`. Even in the default mode, `fmt_caller` only prints `match=no`: `main` exits 0 on a mismatch (lines 663-664), because only a failed call sets `MUST_FAILED`. The dns-mail runbook (Step 3, item 9) records these exit statuses as evidence about account 471112560111. The only thing tying them to that account is a manual `s2_account` check made earlier in the sitting.
**Fix:** Make the account check a must-succeed precondition of every non-self-test mode:
```bash
assert_account() {
  if ! call aws sts get-caller-identity --query Account --output text; then
    echo "assert: FAIL: caller unreadable ($ERR_CODE)" >&2; exit 1
  fi
  [ "$OUT" = "$ACCOUNT_ID" ] || { echo "assert: FAIL: caller account is not $ACCOUNT_ID" >&2; exit 1; }
}
# call assert_account right after make_workdir in all three non-self-test branches;
# in the default branch also set MUST_FAILED=1 when fmt_caller reports match=no.
```

### WR-10: "--assert-managed-only" and the runbook claim customer-managed policies only, but only inline policies are checked

**File:** `infra/envs/staging/dns-mail/README.md:183-186`; `infra/scripts/account-inventory.sh:467-505`
**Issue:** The runbook says the mode proves that "everything under the path `/openvaa/` has customer-managed policies only". The judge (`evaluate managed`) only tests `inline=[]`. A role under `/openvaa/` with an AWS-managed policy such as `AdministratorAccess` attached passes. `collect_roles` never even reads a role's attached policies (line 327). The mode's name, `managed-only`, makes the same overclaim. The Step 3 observation ("both assert modes exited 0") is therefore weaker evidence than the runbook presents.
**Fix:** One option is to read `list-attached-role-policies`/`list-attached-user-policies` with `--query 'AttachedPolicies[].PolicyArn'` and fail on any ARN beginning `arn:aws:iam::aws:policy/`. That makes the name true. The other is to rename the mode `--assert-no-inline-under` and correct the runbook sentence to "no role or user under `/openvaa/` carries an inline policy".

### WR-11: The dns-mail runbook says the first apply creates the account's suppression setting, but staging switches it off

**File:** `infra/envs/staging/dns-mail/README.md:92-94`
**Issue:** Step 1 says the apply creates "the account's suppression list setting for the region". `infra/envs/staging/dns-mail/terraform.tfvars:16` sets `manage_account_suppression = false`, so `aws_sesv2_account_suppression_attributes.this` has `count = 0`. The 14 resources recorded in the Observations table (line 432) match a plan with no suppression resource. An operator reading the plan against Step 1 sees a resource missing that the text promises. Step 8's use-case text, "Bounces and complaints go to the account suppression list" (line 373), is also stated for an account-level setting that this root no longer owns, and that no step reads back.
**Fix:** Change Step 1 to say the root owns the suppression setting only when `manage_account_suppression` is true, and that staging leaves it to the account's existing owner. If Step 8 relies on BOUNCE and COMPLAINT being suppressed, add a read-back line, for example `jq -r '"s2a_suppression=\(.SuppressionAttributes.SuppressedReasons|join(","))"'`.

### WR-12: With `smtp` set and `TF_VAR_smtp_password` forgotten, `smtp_pass: null` is sent silently

**File:** `infra/envs/example/supabase/variables.tf:65-70`, `infra/envs/staging/supabase/variables.tf:65-70` (inputs: `infra/envs/example/supabase/terraform.tfvars:33-41`)
**Issue:** `smtp_password` defaults to `null`, and nothing ties it to `smtp`. The example tfvars sets `smtp`, so the instructions it gives a forker plan `supabase_settings.smtp_secret` with `jsonencode({ smtp_pass = null })` (`infra/modules/supabase/main.tf:54`). The README's Traps section (line 633) says the provider decodes into a fixed structure. A null field is therefore most likely dropped from the update while state records the planned value. The plan and apply then succeed, the second plan is empty, and SMTP is configured without a password. Staging hits the same trap once its `smtp` object is added (staging tfvars line 6).
**Fix:** Add a cross-variable validation in each root, which Terraform >= 1.9 supports (or put it in the module):
```hcl
variable "smtp_password" {
  type      = string
  sensitive = true
  default   = null
  validation {
    condition     = var.smtp == null || (var.smtp_password != null && var.smtp_password != "")
    error_message = "smtp is set, so TF_VAR_smtp_password must be exported."
  }
}
```

### WR-13: The SMTP user name, which the dns-mail runbook treats as half the mail credential, is destined for a tracked public tfvars file

**File:** `infra/envs/example/supabase/terraform.tfvars:33-41` (line 38), `infra/envs/staging/supabase/terraform.tfvars:6`, `infra/envs/example/supabase/variables.tf:53-63`
**Issue:** The SES SMTP user name is the access key id of `aws_iam_access_key.smtp`. The dns-mail runbook says it "is the SMTP user name and half of the mail credential" (README lines 52-55). It forbids printing it (lines 151-156), and the root marks the output `sensitive`. The Supabase roots take it as `smtp.user` inside a non-sensitive object, set in `terraform.tfvars`. The example's header calls that file "tracked and public", and staging's line 6 says the `smtp` object will be added there. Following these files commits the access key id. It then also appears in clear text in every plan diff of `supabase_settings.this`, because `auth` is not sensitive.
**Fix:** Take the user name like the password. Remove `user` from the `smtp` object and add `variable "smtp_user" { type = string, sensitive = true, default = null }`, read from `TF_VAR_smtp_user`. Send it through the separate `smtp_secret` resource together with `smtp_pass`, so the main diff stays readable and the id stays out of Git.

### WR-14: The env roots re-declare the rate-limit defaults, so the module's defaults never apply and the description is false

**File:** `infra/envs/example/supabase/variables.tf:39-51`, `infra/envs/staging/supabase/variables.tf:39-51`
**Issue:** Each root declares `auth_rate_limits` with `optional(number, 30)` and so on, then passes the fully defaulted object to the module. The description says "Any limit left out takes the module's default", but it takes the env root's own copy. If a module default changes in `infra/modules/supabase/variables.tf:48-56`, these roots keep sending the old value, and nothing (validate, the settings-types script or the parity guard) notices. Three copies of the same seven numbers now have to be kept in step by hand.
**Fix:** Declare the root attributes without defaults, so that nulls reach the module and its `optional(..., default)` fills them in:
```hcl
type = object({
  rate_limit_otp             = optional(number)
  rate_limit_verify          = optional(number)
  # ... the rest likewise, no second argument
})
default = {}
```
Do the same for the duplicated `enable_*_hook` defaults, or drop the root defaults and require the tfvars to set them, as all three roots already do.

### WR-15: The scratch rehearsal's Step 5 places an unconditional-looking `rm -f tfplan` block between the checksum and the apply

**File:** `infra/envs/staging/supabase/README.md:296-316`
**Issue:** Item 1 prints the checksum. The prose then says "If they differ, stop here", but the removal command is its own fenced block (lines 305-307), placed in sequence before item 2's apply block. The runbook's model is "paste each block". An operator who runs the blocks in order removes the plan the go-ahead was given for, and then `terraform apply tfplan` fails. The persistent root's version of the same step (Step 11, lines 523-525) avoids this by keeping the command inline in the prose. The two copies of the step disagree.
**Fix:** Do as Step 11 does: inline the removal in the conditional sentence, or guard it, for example `[ "$(shasum -a 256 tfplan | cut -d' ' -f1)" = "<go-ahead sha>" ] || { rm -f tfplan; echo "s2_plan_file_removed=yes"; }`.

### WR-16: The supabase provider constraint admits 1.12+, while the runbook's safety reasoning rests on the 1.11.0 source

**File:** `infra/envs/staging/supabase/main.tf:9-13`, `infra/envs/example/supabase/main.tf:10-13`, `infra/envs/scratch/supabase/main.tf:9-13`
**Issue:** `version = "~> 1.11"` allows any 1.x from 1.11 up. The README's Traps section bases two of its stop rules on behaviour "read at version 1.11.0" (lines 633, 645): unknown keys are dropped silently, and the password is never read back. The commit that added the scratch root says it "lock[s] the provider at 1.11.0", but only the lock file does. A routine `terraform init -upgrade` to fix an unrelated lock problem would move the roots to a newer pre-2.0 provider whose import and decoding behaviour nobody has read. That is the behaviour the password and misspelled-key traps depend on. Because the provider is young and changes its behaviour within the 1.x line, the minor version matters.
**Fix:** Pin to the version that was read, for example `version = "~> 1.11.0"` (or `= 1.11.0`). Raise it deliberately, together with a re-read of the decode and import paths that the runbook cites.

### WR-17: Nothing in the Supabase roots stops Terraform from creating the project, though every header says it never does

**File:** `infra/envs/example/supabase/main.tf:1-5`, `infra/envs/staging/supabase/main.tf:1-4`
**Issue:** The headers say the project "is created by hand and imported" and that "Terraform never creates or deletes it". `prevent_destroy` covers deletion only. A plan in a root whose state lacks the project, for example a forker's copy of the example root, a state key typo or a lost state object, plans `supabase_project.this` as a **creation**. Applying it creates a new billed project with the exported database password. The example header lists only "a destroy or a replacement" as never-apply conditions, and a forker gets no other runbook.
**Fix:** Make the import declarative so that a missing project fails instead of being created. Add `variable "project_ref" {}` to each root (the ref is already public in the README) and:
```hcl
import {
  to = module.supabase.supabase_project.this
  id = var.project_ref
}
```
Also add "a creation of the project" to the never-apply list in the example header.

### WR-18: `infra-validate` runs code from the PR with an unscoped `GITHUB_TOKEN` persisted into `.git/config`

**File:** `.github/workflows/main.yaml:765-772`
**Issue:** The job's comment says it "holds no credentials" and "gets no secret, no identity-token permission and no credential action". No `id-token` is granted and no secret is read, which is true. But neither `main.yaml` nor this job declares `permissions:` (no `permissions` appears anywhere in `main.yaml`). So `GITHUB_TOKEN` gets the repository or organisation default, which is read/write on repositories with the legacy default. `actions/checkout` runs with its default `persist-credentials: true`, which writes that token into `.git/config` for every later step.

Two of those later steps run code the PR controls:
- `bash infra/scripts/check-settings-types.sh`, a script from the checked-out tree;
- `terraform init` / `validate`, which execute provider binaries.

On a same-repository PR, and on a push to `ci-evidence/**`, the token those steps can read is whatever the default grants. A PR from a fork is limited to read access by GitHub itself, but the job should not depend on that.

**Fix:**
```yaml
  infra-validate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: "Checkout source code"
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
        with:
          persist-credentials: false
```
Then add assertions for both settings to `infraValidateJobGate.test.ts` (see WR-19).

### WR-19: The spec's "holds no credentials" tests have blind spots a credential can pass through

**File:** `packages/dev-seed/tests/infraValidateJobGate.test.ts:147-173` (slice at `44-50`)
**Issue:** Each absence test reads only `JOB_BLOCK`, the lines of the job itself. A workflow-level `permissions: id-token: write` or `env: X: ${{ secrets.Y }}` added later applies to this job, and every test stays green. The patterns are also narrow:
- `/\bsecrets\./` does not match `${{ secrets['AWS_KEY'] }}` or `${{ toJSON(secrets) }}`.
- Nothing checks for `${{ github.token }}`, which is a credential.
- Nothing asserts an explicit `permissions:` restriction or `persist-credentials: false` (WR-18).

The file's docstring says "Each such absence is its own test below, so a failure names which one entered the job", but a credential can enter through any of the paths above.
**Fix:** Also assert, over the whole workflow text with comments dropped, that there is no top-level `permissions:` granting `id-token` or `write`, and no top-level `env:` reading `secrets`. Widen the job-block secret check to `/\bsecrets\s*[.\[]|toJSON\(\s*secrets\s*\)|github\.token/`. Assert that the job block contains `permissions:` with `contents: read`, and contains `persist-credentials: false`.

### WR-20: The state-key tests silently skip any root whose backend lives in `backend.tf`

**File:** `packages/dev-seed/tests/infraValidateJobGate.test.ts:79-96`, `176-180`
**Issue:** `backendKeys()` reads `infra/bootstrap/backend.tf`, but for env roots it reads only `infra/envs/<env>/<root>/main.tf`. The bootstrap root already keeps its backend in `backend.tf`. An env root that follows that layout has no S3 backend in `main.tf`, so `s3BackendKey` returns `undefined` and the root drops out of every check: key uniqueness, the `hand/`/`pipeline/` prefix, and the "only aws under pipeline/" rule. The test still passes. `expect(keys.length).toBeGreaterThan(0)` does not guard against this, because the bootstrap root alone satisfies it. The docstring says "The state keys are read from the backend blocks on disk", which is only partly true.
**Fix:** For each root, read every `*.tf` file and find the `backend` block in any of them. Assert that each root in `REQUIRED_ROOTS` yields an S3 key (or an explicit allow-list for local-backend roots such as `infra/envs/scratch/supabase`), so a root that drops out fails by name:
```ts
const tfFiles = readdirSync(rootDir).filter((f) => f.endsWith('.tf'));
const found = tfFiles.map((f) => s3BackendKey(`${rel}/${f}`)).filter((k) => k !== undefined);
```

### WR-21: A Supabase root with no tracked `terraform.tfvars` is skipped without a finding

**File:** `scripts/assert-hosted-settings-parity.mjs:2142-2161`
**Issue:** `readRoots` adds `infra/envs/<env>/supabase` only when `terraform.tfvars` exists. A root that takes its inputs from a `-var-file`, from `*.auto.tfvars` (which `.gitignore` excludes), or from `TF_VAR_*` is skipped silently. Its `public_origin` and hook switches are never checked. The census then counts one root fewer, and nothing names the missing root. The "examined nothing" rule only fires when **no** root yields an origin, so one good root hides any number of skipped ones. Confirmed: a `prod/supabase/main.tf` with no tfvars, next to the staging root, produced `1 origin(s) checked across 1 Supabase root(s)` and exit 0.
**Fix:** Treat any directory under `envs/<env>/` that holds a `.tf` file instantiating `modules/supabase` as a Supabase root. Report a finding when such a root has no tracked `terraform.tfvars`, or when that file yields no `public_origin`.

### WR-22: A quoted or spaced TOML table header after a non-family table is ignored, so new live keys escape classification

**File:** `scripts/assert-hosted-settings-parity.mjs:618-631`
**Issue:** When a header line fails `TABLE_NAME` (`/^[A-Za-z0-9_.-]+$/`), the guard reports a problem only if the **current** table is in the family. Otherwise it returns without changing `table`, and every following key is treated as part of the previous non-family table, so it is skipped. TOML allows both `[auth.external."github"]` and `[auth . external . google]`. Confirmed: both headers, with `enabled = true` under each, were appended to a copy of `config.toml` after `[experimental]`. `--config <copy>` exited 0 with "every classified key holds". The rule "A live key in no class fails" does not hold for these headers.
**Fix:** When a header fails `TABLE_NAME`, normalise it (strip quotes around simple keys, remove whitespace around dots) and re-test it. If it still cannot be read, report a finding whatever the current table, and set `table` to a sentinel so the following keys are not attributed to the previous table:
```js
if (header) {
  const name = header[1].split('.').map((p) => p.trim().replace(/^"([A-Za-z0-9_-]+)"$/, '$1')).join('.');
  if (TABLE_NAME.test(name)) { table = name; return; }
  problems.push({ id: `(line ${index + 1})`, what: `the table header '${line.trim()}' cannot be read` });
  table = '(unreadable)';
  return;
}
```
Treat the sentinel as in-family, so keys under it are findings too.

### WR-23: The second-writer scan misses common spellings of the push command and directories where a Supabase script would naturally go

**File:** `scripts/assert-hosted-settings-parity.mjs:529-537`
**Issue:** `PUSH_COMMAND` is `\bsupabase[\s\\]+config[\s\\]+push\b`, which needs only whitespace or backslashes between the three words. Confirmed misses:
- `npx supabase@latest config push`, `bunx supabase@2.40.0 config push` (a version pin is the usual way to run the CLI through `npx`/`bunx`);
- `supabase --debug config push` (the CLI takes global flags before the subcommand);
- `["supabase", "config", "push"]` (an exec-form array).

The scan also covers only `.github/workflows/`, `infra/`, `scripts/` and `package.json` files. `apps/supabase/scripts/`, where `check-schema-equivalence.sh` already lives, is not covered, and neither is `tests/scripts/`. A second writer of hosted settings added in either place goes unreported.
**Fix:** Allow an optional `@<version>` after `supabase` and any number of flags between the words:
```js
const PUSH_COMMAND = new RegExp(
  `\\b${PUSH_WORDS[0]}(?:@\\S+)?(?:[\\s\\\\"',\\[]+--?\\S+(?:[\\s=]+[^\\s-]\\S*)?)*[\\s\\\\"',\\[]+${PUSH_WORDS[1]}[\\s\\\\"',]+${PUSH_WORDS[2]}\\b`, 'g');
```
Then add `apps/supabase/` and `tests/scripts/` to `WRITER_DIRS`, with self-test cases for each new form.

### WR-24: "One owner per key" does not constrain what is merged into `local.auth` / `local.api`

**File:** `scripts/assert-hosted-settings-parity.mjs:1160-1192`, `1218-1256`
**Issue:** The structural check proves three things: a `hosted = jsondecode(file("…hosted-settings.json"))` exists somewhere, each group is read, and no JSON-owned key appears as a word in the module's code. It does not check what else is merged after the JSON. Confirmed with `--module-dir` against a copy of the module where `var.extra_auth` (a `map(any)` with `default = {}`) and `jsondecode(file("${path.module}/extra.json"))` were added as the last arguments of `merge(...)` in `local.auth`. The guard exited 0. Any `terraform.tfvars` could then set `extra_auth = { disable_signup = false }`, overriding a compared key, while the comparison stays green. The doc block says that "a later map in the merge would override the compared value". It protects against that only when the later map writes the key literally.
**Fix:** Parse the `auth = merge(...)` and `api = ...` expressions inside `locals` and require their arguments to be exactly the expected set (`local.hosted.auth`, `local.auth_hook`, `local.auth_send_email_hook`, `local.auth_rate_limits`, `local.auth_origin`, `local.auth_smtp` for auth; `local.hosted.api` for api), in order. Also flag any `jsondecode(` or `file(` call other than the one that reads `hosted-settings.json`.

### WR-25: The IAM guard skips symlinked `.tf` files and directories, and does not enforce the "no external module" assumption it relies on

**File:** `scripts/assert-no-inline-iam-policies.mjs:100-112` (doc at `20`)
**Issue:** `walk` keeps only `entry.isFile()` / `entry.isDirectory()`, so a `Dirent` for a symbolic link is neither and is dropped. Terraform follows symlinks when it loads a root or a local module, and Git tracks symlinks. Confirmed: `root/linked.tf -> ../outside/iam.tf`, where the target holds `resource "aws_iam_role_policy"`, gave "1 .tf file(s) read; 1 finding(s)", and the one finding was an unrelated line; the symlinked inline policy was never reported.

The doc also says the guard cannot see "a module sourced from outside `infra/` (the layout uses none)", but nothing enforces "uses none". Confirmed: a `module` block with `source = "terraform-aws-modules/iam/aws//modules/iam-role"` and `create_inline_policy = true` produced no finding. That registry module creates `aws_iam_role_policy` internally.
**Fix:** Report every symbolic link under the root as a path finding (or resolve it and scan the target, refusing targets outside the repository). Add a content finding for any `source =` inside a `module` block whose value does not start with `./` or `../`. Add both to the violating fixture and to `expected.violations`.

### WR-26: Inline policies through the `awscc` provider are not matched, and the exclusive-resource check needs a quoted type label

**File:** `scripts/assert-no-inline-iam-policies.mjs:52-65`
**Issue:**
- **`awscc` resources are not matched.** The patterns are anchored on the `aws_` prefix with `\b`. The Cloud Control provider's `awscc_iam_role_policy`, `awscc_iam_user_policy` and `awscc_iam_group_policy` resources each create an inline policy, and the `policies` attribute of `awscc_iam_role` / `awscc_iam_user` / `awscc_iam_group` embeds one. None of these match. Confirmed: `resource "awscc_iam_role_policy" "cc"` produced no finding.
- **`aws_cloudformation_stack` is not reported.** The doc names it as a blind spot, but the guard could simply report the resource type.
- **The exclusive check needs a quoted type label.** `EXCLUSIVE.start` requires `resource\s+"aws_iam_…_policies_exclusive"`. HCL's native syntax also accepts an identifier as a block label, and `resource aws_iam_role_policies_exclusive bare { policy_names = ["kept"] }` produced no finding. Confirm with `terraform validate` before relying on this point.
**Fix:**
```js
{ name: 'awscc inline policy', re: /\bawscc_iam_(?:user|role|group)_policy\b/ },
{ name: 'awscc embedded policies', re: /^\s*policies\s*=/ },   // or read awscc_iam_* blocks the way EXCLUSIVE is read
{ name: 'aws_cloudformation_stack', re: /\baws_cloudformation_stack(?:_set)?\b/ },
// EXCLUSIVE.start:
start: /^\s*resource\s+"?aws_iam_(?:user|role|group)_policies_exclusive"?\s/
```

## Info

### IN-01: `required_version = ">= 1.10"` everywhere, while the code relies on Terraform 1.16.5 behaviour

**File:** `infra/bootstrap/main.tf:2` (and every module's `main.tf:2`); `infra/.terraform-version:1`; `infra/modules/github-oidc/policies.tf:17-22`
**Issue:** The deploy role's list permission is justified by reading the S3 backend source "at v1.16.5". `use_lockfile` is experimental in 1.10. The READMEs require 1.16.5. A 1.10 or 1.11 binary would still pass the constraint.
**Fix:** Set the roots to `required_version = "~> 1.16"`, or at least `>= 1.11`. Modules may stay looser.

### IN-02: The runbook offers to track the alert address in `terraform.tfvars`; the variable and the overview forbid it

**File:** `infra/bootstrap/README.md:63-66`, `infra/bootstrap/README.md:143-144`; contradicted by `infra/bootstrap/variables.tf:37`, `infra/bootstrap/terraform.tfvars:1-2`, `infra/README.md:71`
**Issue:** The variable description says the address "is never written to a file, because the repository is public". The overview says "no personal address goes into" `terraform.tfvars`. The runbook tells the operator they may write it there and commit it.
**Fix:** Either remove the "tracked" option from the runbook (items 7 and 8 of Step 1), or reword the other three places to allow it explicitly.

### IN-03: "IAM is written … only as customer-managed policies" contradicts the AWS-managed `ReadOnlyAccess` attachment

**File:** `infra/README.md:80-82`
**Issue:** The plan role attaches `arn:aws:iam::aws:policy/ReadOnlyAccess` (`policies.tf:138-141`), which is neither customer-managed nor under `/openvaa/`.
**Fix:** Reword to "no inline policies; customer-managed policies live under `/openvaa/`; AWS-managed policies may be attached".

### IN-04: The reusable module's comment claims the subjects are name-based

**File:** `infra/modules/github-oidc/main.tf:19-22`
**Issue:** The module accepts any `repo:` subject, and `infra/bootstrap/example.tfvars:22-23` uses the id-bearing form. The comment describes staging's inputs, not the module.
**Fix:** Say that the subjects are exact matches in whichever form the caller's tokens carry, and move the rename caveat to the staging tfvars.

### IN-05: Rows of the "Not yet observed" table are contradicted by the Observations table

**File:** `infra/bootstrap/README.md:671-672`
**Issue:**
- Row 671 ("the spend of a quiet account … shows in the budget's computed spend within a day or two") was observed at line 689 (6.475 USD on 2026-10-21).
- Row 672's check, "Step 1, item 4, shows whether one exists", was done at line 682 (no provider present, so it was created).

The text at line 663 says such rows move once shown.
**Fix:** Move row 671 to Observations. Reword row 672 to the remaining unobserved part (that a second create fails).

### IN-06: The state bucket keeps every noncurrent state version forever

**File:** `infra/modules/state-bucket/main.tf:22-28`
**Issue:** Versioning is on, but there is no lifecycle rule. Every superseded state object, with every past secret in clear text (old SMTP keys, the database password a scratch apply sent), is retained indefinitely, along with incomplete multipart uploads. The TLS-only statement also does not set a minimum TLS version.
**Fix:** Add an `aws_s3_bucket_lifecycle_configuration` that expires noncurrent versions after N days, keeping the newest few for recovery, and aborts incomplete multipart uploads. Optionally add a `NumericLessThan s3:TlsVersion 1.2` deny.

### IN-07: `enable_*_hook = false` does not switch a hook off; it stops managing it

**File:** `infra/modules/supabase/variables.tf:32-44`; `infra/modules/supabase/settings.tf:18`, `infra/modules/supabase/settings.tf:24`
**Issue:** Both descriptions begin "Whether the … hook is switched on". With `false`, the keys are left out and the hosted hook stays enabled. An operator who sets `false` to disable the access-token hook sees a plan with no hook change, and the hook stays live.
**Fix:** Rename the variables to `manage_*_hook`, or make `false` send `hook_*_enabled = false` and keep a separate "unmanaged" mode.

### IN-08: The fork instructions overstate the stand-in guard and point at a runbook full of this account's literals

**File:** `infra/README.md:98-115`
**Issue:**
- Line 104-105, "Each stand-in account id makes the provider refuse every real shell", does not hold for `envs/example/supabase`, which declares no AWS provider and has no account id.
- Step 4, "Apply the roots … each from its runbook", sends a fork to `infra/bootstrap/README.md`. That runbook hard-codes `471112560111`, `openvaa-tfstate-471112560111`, `openvaa-plan`, `openvaa-staging-deploy` and `openvaa-monthly`, and its account check (line 119) tells the forker to stop on any other account.
**Fix:** Say which stand-in guards each example root (the account id for the AWS roots; the invalid bucket name and org slug for Supabase). Either parametrise the runbook's literals (`ACCOUNT=…`, `B=…`, role names from `terraform output`) or state that a fork substitutes them.

### IN-09: The OIDC provider sits inside the per-environment module, so a second deploy environment in the same account cannot reuse it

**File:** `infra/modules/github-oidc/main.tf:14-17`, `infra/modules/github-oidc/main.tf:115-119`
**Issue:** The deploy role is per environment (`${name_prefix}-${environment}-deploy`), but the module also creates the account-singleton `aws_iam_openid_connect_provider`. A second `module "github_oidc"` call for production in the same account would fail on the duplicate provider. Its `plan` role name and `plan-deny`/`plan-lock`/`ecr-push` policy names would also collide.
**Fix:** Move the provider out (pass `oidc_provider_arn` in), and include the environment in every role and policy name, or document that the module is one-per-account.

### IN-10: The example pipeline root's state key and bucket disagree with the bootstrap example inputs

**File:** `infra/envs/example/aws/main.tf:1-4, 17-23`
**Issue:** The example root uses bucket `REPLACE-ME-tfstate` and key `pipeline/example/aws/terraform.tfstate`. `infra/bootstrap/example.tfvars` names bucket `openvaa-tfstate-000000000000` and `pipeline_state_key = "pipeline/production/aws/terraform.tfstate"`, and its own comment says each "must equal" the other roots' backend values. The deploy role is allowed exactly `pipeline_state_key`. The in-file comment tells a forker to replace "the bucket" and the tfvars values only. `infra/README.md` step 2 also mentions the key, but someone following the file alone gets AccessDenied at the pipeline's `init`. The same holds for `environment = "example"` versus `deploy_environment = "production"`.
**Fix:** Use the same stand-ins in both places (for example key `pipeline/production/aws/terraform.tfstate`), or extend the header comment to say the key must equal the bootstrap root's `pipeline_state_key`.

### IN-11: The example Supabase root's backend comment has drifted from its siblings

**File:** `infra/envs/example/supabase/main.tf:16-18`
**Issue:** The other two example roots and the staging Supabase root carry the "Literal on purpose: no variable, no partial configuration and no -backend-config" rationale. This one says instead that "The name here is never read, because validation initialises with -backend=false", which is true of every example root. So the rationale a forker most needs to preserve is missing from the file they copy, and the header's claim that the root "differs only in its backend and its variable file" is looser than it reads.
**Fix:** Use the same backend comment as `infra/envs/staging/supabase/main.tf:15-17`.

### IN-12: The scratch root points the throwaway project's auth at the staging origin, and the root outlives its own removal condition

**File:** `infra/envs/scratch/supabase/terraform.tfvars:15`, `infra/envs/scratch/supabase/main.tf:3-4`
**Issue:** `public_origin = "https://staging.openvaa.org"` sets the throwaway project's `site_url` and redirect allow list to the staging frontend, which talks to a different project. While the throwaway project exists, its sign-in links land on an app that cannot complete them. The header says the root is removed once the throwaway project is deleted. The rehearsal is recorded as complete (README Observations, 2026-10-23), the root is still tracked, and nothing records whether the project was deleted.
**Fix:** Use a dedicated stand-in origin for the scratch root. Once the project's deletion is recorded, remove the root as its header promises.

### IN-13: The inventory's `join_list` drops a policy literally named `None`, which lets a user or role pass the judge

**File:** `infra/scripts/account-inventory.sh:103`
**Issue:** `[ "$item" = "None" ] && continue` is meant to skip the CLI's text rendering of null. `PolicyNames` is never null, though, and IAM allows a policy named `None`. An inline policy with that name gives `inline=[]`, and the assertion passes when it should fail.
**Fix:** Skip `None` only when it is the whole output (`[ "$1" = "None" ] && { printf '[]'; return; }`), or query with `--output json` and `jq -r '.[]'` for the inline lists.

### IN-14: The self-test writes a predictable temp file, and nothing runs it

**File:** `infra/scripts/account-inventory.sh:632-640`
**Issue:** `errfile="${TMPDIR:-/tmp}/openvaa-inventory-selftest.$$"` is written with `>`. On a shared `/tmp` (Linux, where TMPDIR is usually unset), a pre-planted symlink would redirect the write, and a failure midway leaves the file behind. `--self-test` is not wired into CI or any package script, so the redaction and judge cases it protects can drift without notice.
**Fix:** Use `errfile="$(mktemp "${TMPDIR:-/tmp}/openvaa-inventory-selftest.XXXXXX")"` with a `trap` cleanup. Run `bash infra/scripts/account-inventory.sh --self-test` as a step of `infra-validate`; it needs no credentials.

### IN-15: `required_version = ">= 1.10"` in every root admits any future major version, while the runbooks require 1.16.5

**File:** `infra/envs/*/*/main.tf:2` or `:6` (all seven roots)
**Issue:** The runbooks and CI use Terraform 1.16.5 (`infra/.terraform-version`), and the state-bucket policy comments cite the 1.16.5 S3 backend source. The constraint, though, accepts 1.10 (where S3 `use_lockfile` was new) and any 2.x.
**Fix:** Use `required_version = "~> 1.16"`, or `>= 1.16.5, < 2.0`.

### IN-16: The dns-mail runbook reuses named-line prefixes across steps

**File:** `infra/envs/staging/dns-mail/README.md:219-257, 328-405`
**Issue:** Step 4's lines all begin `s0_`, and Step 7 also prints `s0_account`. Steps 7-9 reuse `s2_`, `s3_` and `s4_`, which Steps 1-3 already use with different fields (`s2_account` and `s2_request_exit`, `s3_init_exit` and `s3_mailbox_exit`). Replies are per sitting, so nothing breaks today. But a reader matching pasted lines against the runbook can attribute a line to the wrong step, which defeats the named-line scheme.
**Fix:** Number items across the whole runbook, or prefix each line with its step (`st4_`, `st7_`).

### IN-17: The spec's `toContain` assertion for `inline_policy` would pass on the permission-set finding alone

**File:** `packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts:27-36`, `76-80`
**Issue:** `inline_policy` is a substring of `aws_ssoadmin_permission_set_inline_policy`. If the `inline_policy` pattern stopped matching, `expect(result.stdout).toContain('inline_policy')` would still pass on the permission-set line. Only the `--self-test` case (exact lines 17 and 40 in `expected.violations`) catches that regression.
**Fix:** Assert on `: ${name}$` per line (for example, split stdout into lines and check `lines.some((l) => l.endsWith(`: ${name}`))`).

### IN-18: The Terraform version is duplicated between the workflow and `infra/.terraform-version`

**File:** `.github/workflows/main.yaml:775`; `packages/dev-seed/tests/infraValidateJobGate.test.ts:111-114`
**Issue:** The job pins the literal `1.16.5`, and the test asserts that literal. Nothing ties either to `infra/.terraform-version`, which also says `1.16.5`. If the file moves, local and CI drift apart (`fmt` output can change between minor versions), and the test stays green.
**Fix:** In the test, read `infra/.terraform-version` and assert that `terraform_version: <that value>` is in the job block, or have the workflow read the file (`terraform_version` from a prior `cat` step output).

### IN-19: The `set` comparison accepts a local list with duplicates against a larger hosted set

**File:** `scripts/assert-hosted-settings-parity.mjs:852-857`
**Issue:** For `set`, the guard checks that the lengths are equal, that the hosted entries are unique, and that every local entry is in the hosted list. A local `schemas = ["public", "public"]` against hosted `"public,graphql_public"` passes, even though the hosted API exposes a schema the local side does not.
**Fix:** Also require `new Set(local).size === local.length`, or compare `new Set(local)` with `new Set(split)` both ways.

### IN-20: The loopback rule misses the FQDN spelling `localhost.`

**File:** `scripts/assert-hosted-settings-parity.mjs:771-780`
**Issue:** `new URL('https://localhost.').hostname` is `localhost.`, which matches neither `=== 'localhost'` nor `.endsWith('.localhost')`, and the bare-origin check accepts it. The module's own `validation` regex accepts it as well. Other non-canonical loopback spellings (`127.1`, `[0:…:1]`, `[::ffff:127.0.0.1]`) are already caught by the bare-origin check.
**Fix:** `const host = url.hostname.replace(/\.$/, '');` before the loopback tests.

### IN-21: The `.dockerignore` comment says the templates stay, but only `.env.example` is re-included; `.envrc` is not matched

**File:** `.dockerignore:4-8`
**Issue:** `**/.env.*` also excludes `.env.sample` and `.env.template`, which the root `.gitignore` treats as templates (lines 92-94). The comment "The templates stay" holds only for `.env.example`. Neither pattern matches direnv's `.envrc`, which commonly holds secrets. Because the Dockerfile COPYs all of `apps/` and `packages/`, a stray `.envrc` under either directory would go into an image layer.
**Fix:** Add `**/.envrc`. Either re-include `!**/.env.sample` and `!**/.env.template` as well, or reword the comment to say that only `.env.example` is kept.

### IN-22: The IAM guard's "examined nothing" exit is not covered by any test

**File:** `packages/dev-seed/tests/noInlineIamPoliciesGate.test.ts:69-97`
**Issue:** The guard's doc promises that "a root holding no `.tf` file exits 1", and `gate()` implements it (lines 182-188). Neither the spec nor `--self-test` exercises that path or the "cannot read" path, so a refactor that returned 0 there would stay green.
**Fix:** Add a case that runs `--root <mkdtemp dir>` and expects status 1 with `nothing was examined` in stderr, and one that runs `--root <nonexistent>`.

### IN-23: The validation glob reaches only `infra/envs/<env>/<root>/`, but the comment promises any later root

**File:** `.github/workflows/main.yaml:786` (comment at the job header)
**Issue:** "The roots are found by glob, so a root added later is validated without an edit here" holds only at exactly that depth. A root at `infra/envs/prod/eu/aws` or outside `envs/` is never validated, and the required-root list does not name it. Separately, a glob match that is a directory with no `.tf` file (for example a docs-only directory) passes both `init` and `validate`, and is counted as validated.
**Fix:** Discover roots as the directories that hold a `.tf` file with a `terraform { … backend … }` block, or a tracked `.terraform.lock.hcl`, outside `infra/modules/`. Or reword the comment to state the depth limit.

## Finding ID Map

The lane reports were renumbered on merge. This table maps each merged ID back to its lane-local ID.

| Merged ID | Lane | Lane-local ID |
|---|---|---|
| WR-01 | A | WR-01 |
| WR-02 | A | WR-02 |
| WR-03 | A | WR-03 |
| WR-04 | A | WR-04 |
| WR-05 | A | WR-05 |
| WR-06 | A | WR-06 |
| WR-07 | A | WR-07 |
| WR-08 | A | WR-08 |
| IN-01 | A | IN-01 |
| IN-02 | A | IN-02 |
| IN-03 | A | IN-03 |
| IN-04 | A | IN-04 |
| IN-05 | A | IN-05 |
| IN-06 | A | IN-06 |
| IN-07 | A | IN-07 |
| IN-08 | A | IN-08 |
| IN-09 | A | IN-09 |
| WR-09 | B | WR-01 |
| WR-10 | B | WR-02 |
| WR-11 | B | WR-03 |
| WR-12 | B | WR-04 |
| WR-13 | B | WR-05 |
| WR-14 | B | WR-06 |
| WR-15 | B | WR-07 |
| WR-16 | B | WR-08 |
| WR-17 | B | WR-09 |
| IN-10 | B | IN-01 |
| IN-11 | B | IN-02 |
| IN-12 | B | IN-03 |
| IN-13 | B | IN-04 |
| IN-14 | B | IN-05 |
| IN-15 | B | IN-06 |
| IN-16 | B | IN-07 |
| CR-01 | C | CR-01 |
| WR-18 | C | WR-01 |
| WR-19 | C | WR-02 |
| WR-20 | C | WR-03 |
| WR-21 | C | WR-04 |
| WR-22 | C | WR-05 |
| WR-23 | C | WR-06 |
| WR-24 | C | WR-07 |
| WR-25 | C | WR-08 |
| WR-26 | C | WR-09 |
| IN-17 | C | IN-01 |
| IN-18 | C | IN-02 |
| IN-19 | C | IN-03 |
| IN-20 | C | IN-04 |
| IN-21 | C | IN-05 |
| IN-22 | C | IN-06 |
| IN-23 | C | IN-07 |

---

_Reviewed: 2026-10-25T09:23:56Z_
_Reviewer: Claude (gsd-code-reviewer, 3 lanes merged by the orchestrator)_
_Depth: standard_

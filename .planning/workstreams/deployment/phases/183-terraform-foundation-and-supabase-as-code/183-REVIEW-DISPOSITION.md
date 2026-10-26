---
phase: 183
review: 183-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "The hook-switch rule reads the wrong default and ignores the root's module call, so a root can switch either hook off with the guard green"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "The plan role's `ReadOnlyAccess` reads all data in a shared account; the deny list covers only one bucket prefix and two secret APIs"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "The `hand/` deny is bypassed by any non-default workspace of a hand-applied root"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "Trust policies pin only `sub`; any pull-request-triggered job in the repo, including the AI-agent workflows, can assume the plan role, and the deploy role depends on an unenforced GitHub setting"
  - id: WR-04
    severity: warning
    disposition: deferred
    title: "The plan role can create and delete the pipeline root's lock object"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "Nothing enforces that `pipeline_state_key` lies outside the hand prefix"
  - id: WR-06
    severity: warning
    disposition: fixed
    title: "A set `smtp` with an unset `smtp_password` sends `{\"smtp_pass\": null}` to the hosted auth config"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "The two `supabase_settings` resources write the same auth configuration concurrently, with no ordering"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "`mail-ses` trusts a separate `aws_region` input instead of the provider's region"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "The assert modes of account-inventory.sh never check the caller's account, so a PASS can describe another account"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "\"--assert-managed-only\" and the runbook claim customer-managed policies only, but only inline policies are checked"
  - id: WR-11
    severity: warning
    disposition: fixed
    title: "The dns-mail runbook says the first apply creates the account's suppression setting, but staging switches it off"
  - id: WR-12
    severity: warning
    disposition: fixed
    title: "With `smtp` set and `TF_VAR_smtp_password` forgotten, `smtp_pass: null` is sent silently"
  - id: WR-13
    severity: warning
    disposition: fixed
    title: "The SMTP user name, which the dns-mail runbook treats as half the mail credential, is destined for a tracked public tfvars file"
  - id: WR-14
    severity: warning
    disposition: fixed
    title: "The env roots re-declare the rate-limit defaults, so the module's defaults never apply and the description is false"
  - id: WR-15
    severity: warning
    disposition: fixed
    title: "The scratch rehearsal's Step 5 places an unconditional-looking `rm -f tfplan` block between the checksum and the apply"
  - id: WR-16
    severity: warning
    disposition: fixed
    title: "The supabase provider constraint admits 1.12+, while the runbook's safety reasoning rests on the 1.11.0 source"
  - id: WR-17
    severity: warning
    disposition: fixed
    title: "Nothing in the Supabase roots stops Terraform from creating the project, though every header says it never does"
  - id: WR-18
    severity: warning
    disposition: fixed
    title: "`infra-validate` runs code from the PR with an unscoped `GITHUB_TOKEN` persisted into `.git/config`"
  - id: WR-19
    severity: warning
    disposition: fixed
    title: "The spec's \"holds no credentials\" tests have blind spots a credential can pass through"
  - id: WR-20
    severity: warning
    disposition: fixed
    title: "The state-key tests silently skip any root whose backend lives in `backend.tf`"
  - id: WR-21
    severity: warning
    disposition: fixed
    title: "A Supabase root with no tracked `terraform.tfvars` is skipped without a finding"
  - id: WR-22
    severity: warning
    disposition: fixed
    title: "A quoted or spaced TOML table header after a non-family table is ignored, so new live keys escape classification"
  - id: WR-23
    severity: warning
    disposition: fixed
    title: "The second-writer scan misses common spellings of the push command and directories where a Supabase script would naturally go"
  - id: WR-24
    severity: warning
    disposition: fixed
    title: "\"One owner per key\" does not constrain what is merged into `local.auth` / `local.api`"
  - id: WR-25
    severity: warning
    disposition: fixed
    title: "The IAM guard skips symlinked `.tf` files and directories, and does not enforce the \"no external module\" assumption it relies on"
  - id: WR-26
    severity: warning
    disposition: fixed
    title: "Inline policies through the `awscc` provider are not matched, and the exclusive-resource check needs a quoted type label"
  - id: IN-01
    severity: info
    disposition: open
    title: "`required_version = \">= 1.10\"` everywhere, while the code relies on Terraform 1.16.5 behaviour"
  - id: IN-02
    severity: info
    disposition: open
    title: "The runbook offers to track the alert address in `terraform.tfvars`; the variable and the overview forbid it"
  - id: IN-03
    severity: info
    disposition: open
    title: "\"IAM is written … only as customer-managed policies\" contradicts the AWS-managed `ReadOnlyAccess` attachment"
  - id: IN-04
    severity: info
    disposition: open
    title: "The reusable module's comment claims the subjects are name-based"
  - id: IN-05
    severity: info
    disposition: open
    title: "Rows of the \"Not yet observed\" table are contradicted by the Observations table"
  - id: IN-06
    severity: info
    disposition: open
    title: "The state bucket keeps every noncurrent state version forever"
  - id: IN-07
    severity: info
    disposition: open
    title: "`enable_*_hook = false` does not switch a hook off; it stops managing it"
  - id: IN-08
    severity: info
    disposition: open
    title: "The fork instructions overstate the stand-in guard and point at a runbook full of this account's literals"
  - id: IN-09
    severity: info
    disposition: open
    title: "The OIDC provider sits inside the per-environment module, so a second deploy environment in the same account cannot reuse it"
  - id: IN-10
    severity: info
    disposition: open
    title: "The example pipeline root's state key and bucket disagree with the bootstrap example inputs"
  - id: IN-11
    severity: info
    disposition: open
    title: "The example Supabase root's backend comment has drifted from its siblings"
  - id: IN-12
    severity: info
    disposition: open
    title: "The scratch root points the throwaway project's auth at the staging origin, and the root outlives its own removal condition"
  - id: IN-13
    severity: info
    disposition: open
    title: "The inventory's `join_list` drops a policy literally named `None`, which lets a user or role pass the judge"
  - id: IN-14
    severity: info
    disposition: open
    title: "The self-test writes a predictable temp file, and nothing runs it"
  - id: IN-15
    severity: info
    disposition: open
    title: "`required_version = \">= 1.10\"` in every root admits any future major version, while the runbooks require 1.16.5"
  - id: IN-16
    severity: info
    disposition: open
    title: "The dns-mail runbook reuses named-line prefixes across steps"
  - id: IN-17
    severity: info
    disposition: open
    title: "The spec's `toContain` assertion for `inline_policy` would pass on the permission-set finding alone"
  - id: IN-18
    severity: info
    disposition: open
    title: "The Terraform version is duplicated between the workflow and `infra/.terraform-version`"
  - id: IN-19
    severity: info
    disposition: open
    title: "The `set` comparison accepts a local list with duplicates against a larger hosted set"
  - id: IN-20
    severity: info
    disposition: open
    title: "The loopback rule misses the FQDN spelling `localhost.`"
  - id: IN-21
    severity: info
    disposition: open
    title: "The `.dockerignore` comment says the templates stay, but only `.env.example` is re-included; `.envrc` is not matched"
  - id: IN-22
    severity: info
    disposition: open
    title: "The IAM guard's \"examined nothing\" exit is not covered by any test"
  - id: IN-23
    severity: info
    disposition: open
    title: "The validation glob reaches only `infra/envs/<env>/<root>/`, but the comment promises any later root"
open: 23
total: 50
recorded: 2026-10-25T13:47:08.229Z
---

# Phase 183: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 731656d24 |
| WR-01 | warning | fixed | fixed in part, 2d8a04ac0; applied to infra/bootstrap 2026-10-26 (plan 2 add/2 destroy, apply 0, simulator denies observed, second plan 0; evidence/183-review-fix-applies.md); operator ruling 2026-10-26: option (a), keep ReadOnlyAccess with the current denies; the remaining data reads are deferred to phase 184 |
| WR-02 | warning | fixed | ee4ca9130; applied to infra/bootstrap 2026-10-26 (the env:/ workspace key reads explicitDeny in the simulator; evidence/183-review-fix-applies.md) |
| WR-03 | warning | fixed | fixed in part, 16f90b7e3 (validation + docs, no plan change); operator ruling 2026-10-26: the numeric GitHub ids, pinning the plan trust to a workflow and the staging Environment branch policy are deferred to phase 184 |
| WR-04 | warning | deferred | operator ruling 2026-10-26: keep decision A-08 and accept that a PR job can hold or delete the pipeline lock; revisit in phase 184, once the PR and deploy workflows exist |
| WR-05 | warning | fixed | 1e5740bcb |
| WR-06 | warning | fixed | eed525127 (module side) |
| WR-07 | warning | fixed | f7fc5d26f |
| WR-08 | warning | fixed | 39dcac2db |
| WR-09 | warning | fixed | 05070d0b6 |
| WR-10 | warning | fixed | 70b569de6 (mode renamed --assert-no-inline-under) |
| WR-11 | warning | fixed | 4ebb01bca |
| WR-12 | warning | fixed | 1cb145b7a (root side) |
| WR-13 | warning | fixed | 58be669ad; once staging sets smtp, export TF_VAR_smtp_user as well as TF_VAR_smtp_password |
| WR-14 | warning | fixed | 1a02b721b (values sent unchanged) |
| WR-15 | warning | fixed | c1fa7a7f5 |
| WR-16 | warning | fixed | 97bcae1d3 |
| WR-17 | warning | fixed | ed7d91c94; confirmed on infra/envs/staging/supabase 2026-10-26: init 0, plan -detailed-exitcode 0, "No changes." with no import line (evidence/183-review-fix-applies.md) |
| WR-18 | warning | fixed | 97d9c7c79 |
| WR-19 | warning | fixed | 77bfe4a71, eda25307f |
| WR-20 | warning | fixed | d7578a411 |
| WR-21 | warning | fixed | faa06e482 |
| WR-22 | warning | fixed | 2068572dc |
| WR-23 | warning | fixed | a775f8509 |
| WR-24 | warning | fixed | 3049e7376 |
| WR-25 | warning | fixed | 520ab4c62 |
| WR-26 | warning | fixed | 45d9b8d88 |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| IN-08 | info | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |
| IN-11 | info | open | - |
| IN-12 | info | open | - |
| IN-13 | info | open | - |
| IN-14 | info | open | - |
| IN-15 | info | open | - |
| IN-16 | info | open | - |
| IN-17 | info | open | - |
| IN-18 | info | open | - |
| IN-19 | info | open | - |
| IN-20 | info | open | - |
| IN-21 | info | open | - |
| IN-22 | info | open | - |
| IN-23 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.

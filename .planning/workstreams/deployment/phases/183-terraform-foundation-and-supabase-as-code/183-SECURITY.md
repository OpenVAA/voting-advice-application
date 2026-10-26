---
phase: "183"
slug: "terraform-foundation-and-supabase-as-code"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
threats_total: 70
threats_mitigated: 66
threats_accepted: 2
threats_transferred: 2
audited_tree: eda25307f
created: "2026-10-26"
---

# Phase 183 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

The register is the union of the `<threat_model>` blocks of plans 183-01 to 183-28, with each threat id counted once (T-183-SC recurs in many plans and is one threat). The audit was offline: static reading, the two guards in gate and self-test mode, the three infra gate specs and `attempt.sh --self-test`. Hosted state is known only through `evidence/*.md`. No state, plan or `.terraform` file was read. The audited code is the tree at `eda25307f`, which is the last code commit; later commits change only planning documents.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| workstation / branch → public repository | Everything committed or pushed is published for good; Terraform writes secrets next to the code | Terraform code, tracked tfvars and lock files; at risk: state, plan and local tfvars |
| operator's shell / identity → AWS account | Roots are applied by hand with administrator credentials | AWS credentials; IAM, S3, SES, Route 53 and Budgets calls |
| AWS principals → state bucket | State objects hold secrets in clear text | Terraform state (SMTP key and password, settings) |
| local state file → remote state | During migration the only copy of state is a file next to the code | Bootstrap state |
| GitHub Actions OIDC token → AWS STS | The trust policy decides which workflow becomes which role | OIDC JWT (aud, sub), STS credentials |
| plan role → state bucket and secret stores | A PR's plan runs PR code under the plan role | Pipeline state and lock object, read-only API responses |
| deploy role → state bucket | The pipeline can write one state key | Pipeline state and lock object |
| internet mail receivers → staging domain | Receivers judge whether mail is genuine from DNS | DKIM, SPF and DMARC records |
| SMTP key holder → SES | A long-lived credential handed to the hosted auth service and Edge Functions | SMTP user name and password, outgoing mail |
| SES → DNS records in the new zone | DKIM verifies only if the records point at SES's signing zone | DKIM tokens and signing zone |
| parent zone → delegated subdomain | Whoever controls the NS records controls every name under `staging.openvaa.org` | NS records |
| operator's shell → Supabase Management API | An account token can change or delete projects; an apply writes settings | Access token, settings JSON, database password |
| HCL / `hosted-settings.json` → hosted settings | The guard compares a file; the project gets what the HCL encodes | Auth and API settings |
| local `config.toml` (tested) → hosted settings (served) | Tests prove the local auth config; visitors meet the hosted one | Auth configuration values |
| hosted API key names → names the code uses | A key name the API does not know is dropped silently | Settings key names |
| typed project ref → Terraform state | An import binds the root to whatever project the ref names | Project ref |
| reviewed plan → applied plan | The plan text is the only warning; the file could change between review and apply | Plan text, plan-file SHA-256 |
| operator's shell → process list | A token on a command line is visible to other processes | Access token |
| contributor's change → infra `.tf`, settings and variable files | A PR can add IAM or weaken settings; the guards refuse it | Terraform, HCL, JSON and TOML edits |
| pull request code → CI job | `infra-validate` runs Terraform and scripts a contributor wrote | PR tree, read-only `GITHUB_TOKEN`, provider binaries |
| third-party actions → runner | An action's tag can be moved to other code | Action code |
| runbook → operator's hands | The operator runs what the runbook says with admin credentials | Shell commands |
| operator's terminal → planning record | Pasted output is stored in files on this branch | Named lines (at risk: secrets, addresses, session names) |
| operator's mailbox / SMTP outputs → branch files | A sandbox needs a recipient, and the SMTP key is one command away | Operator address, SMTP key |
| AWS Budgets → operator's mailbox | A mail is the only signal of runaway cost | Budget alert mail |
| existing account resources → what the roots create | Earlier deployments left resources nobody listed | Existing IAM, OIDC, SES, zones, buckets |
| forker's shell → forker's AWS account | Example roots are copied and applied outside this project | Example configuration |
| red control → shared checkout | A planted violation could be committed or hit by another executor | Planted violating files |
| edits during operator work → the last chain run | A guard or its inputs changed after the chain last ran | Guard, JSON and tfvars edits |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-183-01 | Information disclosure | `.gitignore` | high | mitigate | `.gitignore` ignores state, `.terraform/`, plan files, auto/local tfvars and overrides (check-ignore confirmed); no state file is tracked | closed |
| T-183-02 | Tampering | `.gitignore` | medium | mitigate | `terraform.tfvars`, `example.tfvars` and root lock files stay tracked; only module lock files are ignored | closed |
| T-183-03 | Information disclosure | `.dockerignore` | low | mitigate | `.dockerignore` excludes `infra` | closed |
| T-183-04 | Elevation of privilege | `provider "aws"` in AWS roots | medium | mitigate | `allowed_account_ids = [var.aws_account_id]` in all 5 AWS roots | closed |
| T-183-05 | Information disclosure | `infra/modules/state-bucket` | high | mitigate | `state-bucket/main.tf`: 4 public-access blocks, BucketOwnerEnforced, AES256, TLS-only deny; read back in `evidence/183-16` | closed |
| T-183-06 | Tampering / DoS | `aws_s3_bucket.this` | medium | mitigate | `state-bucket/main.tf`: `prevent_destroy = true` + versioning Enabled | closed |
| T-183-07 | Tampering | `aws_ecr_repository.frontend` | medium | mitigate | `registry/main.tf`: `image_tag_mutability = "IMMUTABLE"` | closed |
| T-183-08 | Information disclosure | `var.alert_email` | medium | mitigate | bootstrap and budget variables are sensitive with no default; no tracked assignment; state under `hand/` | closed |
| T-183-09 | Spoofing / EoP | trust policies, `github-oidc/main.tf` | high | transfer | StringEquals on aud/sub only, env-bound deploy subject, wildcard refused; workflow pin and Environment branch policy transferred to phase 184 (WR-03 ruling) | closed (transferred) |
| T-183-10 | Spoofing | name-based subject | medium | transfer | A-09 keeps name-based subject; id conditions and digit validation present but unset; transferred to phase 184 (WR-03 ruling) | closed (transferred) |
| T-183-11 | Elevation of privilege | `aws_iam_policy.plan_deny` | high | accept | `policies.tf` denies `hand/*`, `env:/*`, secret/KMS and data-plane reads (simulator: explicitDeny); remaining reads (WR-01 ruling) and lock write (WR-04 ruling) accepted | closed (accepted) |
| T-183-12 | Elevation of privilege | `aws_iam_policy.tfstate_pipeline` | high | mitigate | `policies.tf`: one key + `.tflock` allow-list, ListBucket on `s3:prefix`; key validation; deploy implicitDeny on `hand/` | closed |
| T-183-13 | Tampering | roles edited by hand | medium | mitigate | `github-oidc/main.tf`: `aws_iam_role_policies_exclusive` with `policy_names = []` on both roles | closed |
| T-183-14 | Denial of service | account-wide exclusive attachment | medium | mitigate | only `aws_iam_role_policy_attachment` used; IAM guard bans `aws_iam_policy_attachment` | closed |
| T-183-15 | Spoofing | DNS records, `mail-ses/main.tf` | medium | mitigate | 3 DKIM CNAMEs (2048-bit), SPF, DMARC `quarantine`, `REJECT_MESSAGE`; published (`evidence/183-19`) | closed |
| T-183-16 | Spoofing | `aws_iam_policy.ses_send` | medium | mitigate | `smtp.tf`: only `ses:SendRawEmail` on identity ARN, StringEquals `ses:FromAddress` | closed |
| T-183-17 | Information disclosure | SMTP outputs and dns-mail state | high | mitigate | module and root SMTP outputs `sensitive`; state key `hand/staging/dns-mail`; tfvars hold no secret | closed |
| T-183-18 | Tampering / DoS | `aws_route53_zone.this` | medium | mitigate | `dns-zone/main.tf`: `prevent_destroy = true`; hand-applied root | closed |
| T-183-19 | Tampering / DoS | `supabase_project.this` | critical | mitigate | `supabase/main.tf` `prevent_destroy`; parity guard asserts it; destroy plans refused (183-24, 183-25, exit 1) | closed |
| T-183-20 | Tampering | `database_password` after import | high | mitigate | `ignore_changes = [database_password]`, guard-asserted; 183-22 and 183-23 plans show no password line | closed |
| T-183-21 | Elevation of privilege | hosted auth weaker than local | high | mitigate | parity guard classifies every live key; per-root hook-switch resolution (CR-01 fix); gate + 96 cases exit 0 | closed |
| T-183-22 | Spoofing | redirect allowlist | high | mitigate | parity redirect rule (https, 2 fixed paths, no `**`, trailing `*` or host `*`); zero origins fails | closed |
| T-183-23 | Tampering | misspelled settings key | high | mitigate | parity known-key lists + exact HCL-owned names; 37/37 keys read back (183-25) | closed |
| T-183-24 | Tampering | type coercion, `settings.tf` | medium | mitigate | `for` filters / `cond ? obj : null`; `check-settings-types.sh` in CI; seen red (183-05) | closed |
| T-183-25 | Information disclosure | SMTP password in plan diff | medium | mitigate | `supabase_settings.smtp_secret` carries only `smtp_user`/`smtp_pass`, both sensitive | closed |
| T-183-26 | Information disclosure | tracked `terraform.tfvars` | high | mitigate | no tracked tfvars assigns a token or password; token comes from env; passwords are sensitive vars | closed |
| T-183-27 | Tampering | backend blocks | medium | mitigate | literal backends; unique keys and prefixes asserted in `infraValidateJobGate.test.ts` | closed |
| T-183-28 | Tampering | ways around a text guard | medium | mitigate | IAM guard reports `.tf.json`, symlinks, non-local module sources, awscc, CFN stacks | closed |
| T-183-29 | Tampering | guard examines nothing or does not run | medium | mitigate | empty root exits 1 (probed); spec checks `lint:check` membership and the violating fixture | closed |
| T-183-30 | Tampering | guard with unreadable input | medium | mitigate | unreadable channel exits 1 with verdict withheld (probed); zero origins is a finding | closed |
| T-183-31 | Tampering | second writer of hosted settings | high | mitigate | parity guard push-command scan (pins, flags, arrays; workflows, infra, scripts, apps/supabase, tests/scripts) | closed |
| T-183-32 | Tampering | actions in `infra-validate` | high | mitigate | `main.yaml`: both actions pinned by 40-hex SHA; spec asserts it | closed |
| T-183-33 | Elevation of privilege | validation job gaining credentials | medium | mitigate | no secret, id-token or credential action; `contents: read`; `persist-credentials: false`; spec asserts each | closed |
| T-183-34 | Information disclosure | plan artifact upload | medium | mitigate | job runs no plan, apply or import, and uploads no artifact; spec asserts it | closed |
| T-183-35 | Information disclosure | `account-inventory.sh` | medium | mitigate | only get/list/describe calls; no `set -x` (header forbids it); names, counts, redaction | closed |
| T-183-36 | Tampering | runbook step leading to a destructive act | high | mitigate | `bootstrap/README.md`: head-object + state list before `rm`; no status read through a pipe | closed |
| T-183-37 | Information disclosure | evidence commits | high | mitigate | `evidence/183-15`: index without `.planning/`, whole-tree scans, manual push, secret-scan result recorded | closed |
| T-183-38 | Information disclosure | pasted operator output | medium | mitigate | named lines only, stored through the `attempt.sh put` screen (183-16) | closed |
| T-183-39 | Elevation of privilege | applying identity | medium | mitigate | `evidence/183-14`: Identity Center permission set; assert over all IAM users exit 0 | closed |
| T-183-40 | Tampering / DoS | removing a legacy user | medium | mitigate | per-user operator decision `convert`; nothing deleted (183-14) | closed |
| T-183-41 | Tampering | collisions with existing resources | medium | mitigate | inventory showed no OIDC, SES, zone, bucket or same-named collision (183-14) | closed |
| T-183-42 | Tampering / DoS | state migration | high | mitigate | remote head-object + state list before local removal (183-16); bucket versioned | closed |
| T-183-44 | Tampering | records shadowed by the delegation | medium | mitigate | `answer_existing_staging_record=none` (183-18) | closed |
| T-183-45 | Spoofing | delegation to a foreign name server | high | mitigate | referral NS set equals the `DELEGATION.md` set (183-18) | closed |
| T-183-47 | Information disclosure | operator's own address | medium | mitigate | no mailbox identity created; only the sender and DMARC addresses appear (scanned) | closed |
| T-183-48 | Denial of service | silent budget alarm | medium | accept | alerts configured in `budget/main.tf`; mail unobserved; operator ruling `accept-console-alert` 2026-10-23 | closed (accepted) |
| T-183-49 | Tampering | unrehearsed settings on persistent project | high | mitigate | throwaway import first; key names confirmed against the API; nothing applied (183-21) | closed |
| T-183-50 | Tampering | wrong project imported | high | mitigate | ref bound decision → reply → review, and differs from the throwaway (183-23) | closed |
| T-183-51 | Tampering | project in the wrong region | high | mitigate | region decided before creation; import read `eu-north-1` (183-23) | closed |
| T-183-52 | Elevation of privilege | token reaching beyond the organisation | medium | mitigate | runbook asks for an org-only member token, read with `read -rs` per session, never filed | closed |
| T-183-54 | Elevation of privilege | where IAM is written | medium | mitigate | IAM only in hand-applied roots' modules; `staging/aws` declares no resource | closed |
| T-183-55 | Tampering | example roots applied unedited | low | mitigate | example tfvars `aws_account_id = "000000000000"`; bucket `REPLACE-ME-tfstate` is invalid | closed |
| T-183-56 | Tampering | planted violation reaching shared checkout | medium | mitigate | throwaway worktree removed and pruned (183-13); absent from `git worktree list` | closed |
| T-183-57 | Tampering | DKIM records pointing at the wrong zone | medium | mitigate | `SigningHostedZone` equals `dkim.amazonses.com` (183-17) | closed |
| T-183-58 | Information disclosure | SMTP key leak | high | mitigate | outputs sensitive; no runbook reads them; no access key id in evidence (scanned) | closed |
| T-183-59 | Tampering | password-change or destroy plan applied | high | mitigate | 183-22: five stop rules, `PLAN_REVIEWED=ok` with SHA-256 | closed |
| T-183-60 | Information disclosure | SMTP key read for a test send | medium | mitigate | no test send made; SMTP outputs not read (183-19) | closed |
| T-183-61 | Tampering | destructive or leaking runbook step | high | mitigate | Supabase runbook never-apply rules, plan/apply split, never `terraform destroy`; mail runbook reads no SMTP output | closed |
| T-183-62 | Tampering | JSON decoupled from the module | high | mitigate | parity "nothing else merged" checks (WR-24) + `check-settings-types.sh` in CI; red seen (183-26) | closed |
| T-183-63 | Repudiation | gate result of an unknown tree | low | mitigate | HEAD and tree sample recorded before and after each gate (183-13, 183-27) | closed |
| T-183-64 | Information disclosure | settings or secrets pasted with a plan | medium | mitigate | headings, summary and password lines only, stored through the screen (183-22) | closed |
| T-183-65 | Tampering | throwaway apply of an unreviewed plan | high | mitigate | `bound` PLAN_REVIEWED and OPERATOR_APPLIED carry the same SHA-256 (183-24) | closed |
| T-183-66 | Information disclosure | token on a command line | medium | mitigate | token piped to `curl -K -` by builtin `printf`; jq drops secret-suffixed keys | closed |
| T-183-67 | Tampering | persistent apply without a plan review | high | mitigate | saved plan, 5 stop rules, PLAN_REVIEWED bound to SHA-256 and ref (183-23) | closed |
| T-183-68 | Tampering | persistent apply of another plan | high | mitigate | checksum and ref bound to the apply (183-25) | closed |
| T-183-69 | Denial of service | project destroyed while proving it cannot be | high | mitigate | only `plan -destroy` run (exit 1, refused); runbook forbids `terraform destroy` | closed |
| T-183-70 | Tampering | guard edited after its chain last ran | medium | mitigate | lint and format exit 0 on the final tree (183-27) and after the fix pass at eda25307f | closed |
| T-183-71 | Information disclosure | reply stored by `attempt.sh put` | high | mitigate | five-rule screen + no-guarantee header; `--self-test` passes | closed |
| T-183-72 | Information disclosure | address or session name in a tracked file | medium | mitigate | role name cut from the ARN; inventory redaction; screen refuses; scan clean | closed |
| T-183-SC | Tampering | provider and package install | high | mitigate | aws 6.68.0 and supabase 1.11.0 locked with hashes; CI uses `-lockfile=readonly`; no yarn.lock change | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party or a later phase)*

Totals: 70 threats (1 critical, 30 high, 36 medium, 3 low). 66 closed with the mitigation present, 2 closed as accepted risk, 2 closed as transferred to phase 184, 0 open.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-183-01 | T-183-11 | The plan role keeps `ReadOnlyAccess` with the current explicit denies. S3 objects outside the denied keys, SSM String parameters, Lambda and ECS environments and CloudFormation templates stay readable across the account. Narrowing the remaining data reads is deferred to phase 184 | Operator ruling WR-01, option (a) (`183-REVIEW-DISPOSITION.md`, `evidence/183-review-fix-applies.md`) | 2026-10-26 |
| AR-183-02 | T-183-11 | The plan role can write and delete the pipeline lock, so a PR job can hold or delete it. Decision A-08 is kept; revisit in phase 184 once the PR and deploy workflows exist | Operator ruling WR-04 (`183-REVIEW-DISPOSITION.md`) | 2026-10-26 |
| AR-183-03 | T-183-48 | The budget alert was seen as triggered in the AWS Budgets console at the 1 USD test amount, but its mail was never received (the recipient address had not been confirmed). The forecast alert has not been seen. Delivery to the mailbox is unobserved | Operator ruling `accept-console-alert` (`evidence/183-20-budget-alert.md`) | 2026-10-23 |

### Transferred Risks

| Risk ID | Threat Ref | Rationale | Transferred To | Authority | Date |
|---------|------------|-----------|----------------|-----------|------|
| TR-183-01 | T-183-09 | The plan role trusts any job whose token subject is `repo:OpenVAA/voting-advice-application:pull_request`, including workflows that hold `id-token: write`; the deploy role trusts any branch's job that names `environment: staging`. Pinning the plan trust to a workflow and the staging Environment's deployment branch policy are deferred. No workflow assumes either role today; the branch-policy prerequisite is in `infra/README.md` § Prerequisites | Phase 184 | Operator ruling WR-03 (`183-REVIEW-DISPOSITION.md`) | 2026-10-26 |
| TR-183-02 | T-183-10 | The name-based subject stays per decision A-09. The `repository_id` / `repository_owner_id` conditions exist and are validated but unset, until AWS is confirmed to evaluate those claims (a row in the bootstrap runbook's "Not yet observed" table) | Phase 184 | Operator ruling WR-03 and decision A-09 | 2026-10-26 |

*Accepted risks do not resurface in future audit runs.*

### Non-blocking observations

These do not reopen a threat; they are recorded so phase 184 can pick them up.

- **T-183-SC:** the operator `terraform init` lines in `infra/bootstrap/README.md`, `infra/envs/staging/supabase/README.md` and `infra/envs/staging/dns-mail/README.md` omit `-lockfile=readonly`. A default init still checks the lock-file hashes and does not move locked versions, so the claim holds strictly for CI and executor inits only. The Supabase roots pin `= 1.11.0` while their lock files still record `constraints = "~> 1.11"`; the lock files were not regenerated.
- **T-183-52:** the runbook does not state that narrower token scoping is unverified; `evidence/183-21` records the token kind as unconfirmed.
- **T-183-37:** the CI `secret-scan` job concluded `failure` on the pushed green tree, attributed to two accepted dummy URI test inputs; the job log was not read.
- **T-183-08:** `infra/bootstrap/README.md` Step 1 items 7-8 still offer to commit the alert address (review finding IN-02). No tracked file holds one.
- Open review findings IN-06, IN-13 and IN-20 would further harden T-183-05, T-183-39 and T-183-22; they do not affect the declared mitigations.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-26 | 70 | 70 | 0 | gsd-security-auditor (offline, tree eda25307f) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-26

# Phase 183: Terraform Foundation and Supabase as Code - Research

**Researched:** 2026-10-11
**Domain:** Terraform on AWS (state, IAM, OIDC, ECR, Budgets, Route 53, SES) and the Supabase Terraform provider
**Confidence:** MEDIUM. Repository facts and provider source code were read this session (HIGH). Vendor documentation was read this session (MEDIUM). Nothing was applied, planned or imported, so every statement about what AWS, Supabase or Cloudflare will do is unobserved.

**How to read the tags.** `[VERIFIED: …]` means I read the named file or queried the named registry this session. `[CITED: url]` means I read that official page this session (2026-10-11). `[ASSUMED]` means training knowledge or my own inference; the Assumptions Log says how the plan can check each one. Repository line numbers are hints. The quoted text is the anchor.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Layout and roots

- **D-01 (183-3):** Directories: `infra/bootstrap`, `infra/modules/*`,
  `infra/envs/staging/{dns-mail,supabase,aws}`, `infra/envs/example/{…}`, `infra/scripts`. Each environment
  directory is a thin root with its own state key and a tracked, non-secret tfvars file. The wiring exists
  twice (staging and example); CI validates both. The `example` environment is validated and planned, never
  applied (A1).
- **D-02 (183-2, amends C3):** Four roots in all. `bootstrap` holds the state bucket, the OIDC provider, the
  roles and policies, the image registry and the budget. `staging/dns-mail` is a third long-lived root that
  holds the hosted zone, the SES identity and the SMTP user, because they must outlive the AWS root that phase
  185 destroys on purpose. `staging/supabase` and `staging/aws` are as C3 ruled. — **Reversibility:** costly —
  moving resources between roots later means state moves, and a recreated zone gets new name servers.
- **D-03 (183-4):** The bootstrap root is first applied with local state. Then the S3 backend is added, the
  state is migrated, the local file is deleted, and a second plan shows no change.
- **D-04 (183-14):** One phase, two waves. Wave A starts now and can close INFRA-15, INFRA-17, INFRA-18 and
  SUPA-11: ignore entries, layout, `bootstrap` and `dns-mail` written and applied, the delegation, the SES
  request, the budget, both guards seen failing, `infra-validate`, the Supabase HCL written and validated. Wave
  B waits for the operator's Supabase inputs: the throwaway import, key names corrected, the persistent import,
  the `prevent_destroy` refusal, settings applied. The Edge Function secrets resource is written in phase 184
  with the function deploy, not here.

#### DNS and mail (INFRA-18, SUPA-14)

- **D-05 (183-1):** A Route 53 zone serves `staging.openvaa.org` only. The parent zone `openvaa.org` stays
  where it is, **at Cloudflare** (operator's input). The operator adds one NS record set for `staging` there
  and removes any record at or under that name. The records changed are written down (INFRA-18).
- **D-06 (183-11):** `staging.openvaa.org` is the SES domain identity, with every record in the delegated
  zone: three DKIM CNAMEs, a custom MAIL FROM subdomain with MX and SPF, and a DMARC record with
  `p=quarantine`. The sender becomes `noreply@staging.openvaa.org`. The production-access request is filed once
  the identity shows verified. Figures for the request: about 100 mails a day expected, peak 2000 (operator's
  input). The DMARC report mailbox is not yet given (D-17); until it is, the record is written without a
  report address, and the mailbox is a variable.

#### IAM and access (INFRA-17, PIPE-01)

- **D-07 (183-5):** Only hand-applied roots write IAM, so the pipeline cannot create or change IAM and no
  permissions boundary is needed. Each permission is a customer-managed policy under one path, one per
  concern. The deploy role starts with state access and registry push; phases 185 and 187 add what the stack is
  seen to need. The plan role gets AWS-managed `ReadOnlyAccess` plus a customer-managed explicit deny on other
  roots' state and on secret reads.
- **D-08 (183-5, the check):** A Node `assert:*` guard in `lint:check` over `infra/**/*.tf` fails on
  `aws_iam_user_policy`, `aws_iam_role_policy`, `aws_iam_group_policy` and `inline_policy`, with a self-test.
  Inline policies on users, roles and groups are all banned. Trust policies and resource policies (the state
  bucket's deny on non-TLS access) are outside the rule. An account-side script the operator runs with
  credentials covers what already exists in the account.
- **D-09 (183-6):** OIDC trust: audience `sts.amazonaws.com`, exact matches only. Deploy role subject
  `repo:OpenVAA/voting-advice-application:environment:staging`. Plan role subject `…:pull_request`. Branch
  limits come from the GitHub Environment's branch rule in phase 187.
- **D-10 (183-13):** The operator runs every apply from a runbook the agent writes. The agent writes the code
  and reads non-secret output; it never holds the operator's credentials. The Supabase token and the database
  password are exported per session from the operator's password manager. The operator sets the database
  password at project creation; Terraform does not generate it. Tracked on purpose: the account id, the bucket
  name, the domain and the Supabase project ref.

#### Budget (INFRA-15)

- **D-11 (183-12):** A monthly cost budget for the whole account, alerts at 80 % actual and 100 % forecast,
  mailed directly to the operator's address (no SNS topic). It is first applied at 1 USD so that it is seen
  firing, then raised to **100 USD a month** (operator's input). If the account already has spend, it fires at
  once.

#### Supabase as code (SUPA-11)

- **D-12 (183-10):** The token holder creates the throwaway project by hand in the dedicated Pro organisation
  and the chosen region. A scratch root with local state imports it, which rehearses the exact import the
  persistent project gets. It is kept through phase 184, then deleted.
- **D-13 (183-8):** The parity guard requires every live key of `[api]`, `[auth]` and `[auth.*]` in
  `config.toml` to be classified in the guard's table: must agree, hosted may be stricter, differs by design,
  or not compared with a reason. An unclassified key fails. `max_rows` must agree three ways: `config.toml`,
  the HCL, and `staticSettings.dataAdapter.pageSize`. `config.toml` has three redirect entries, not the two
  SUPA-02 names. Hosted auth rate limits are set in the HCL at values chosen in planning and listed as "not
  compared" (the local `email_sent = 2` cannot be the hosted value).
- **D-14 (183-9):** The security-relevant hosted values sit in one JSON file in the Supabase module, and the
  HCL reads it with `jsondecode(file(…))`. The guard parses that JSON and line-reads `config.toml` with Node
  built-ins only. No npm package is added.
- **D-15 (milestone rulings C2, C4, carried):** The operator creates the persistent Pro project; Terraform
  imports it and never creates or destroys it. Terraform's `supabase_settings` is the only writer of hosted
  auth settings; `supabase config push` is used nowhere.

#### CI

- **D-16 (183-15):** The `infra-validate` job in `main.yaml` needs no credentials, formats and validates the
  Terraform, and is seen passing in a run. Actions this milestone adds are pinned by commit SHA. Existing
  actions, pinned by mutable major tags today, are left for a separate change.

#### Operator inputs

- **D-17:** Given on 2026-10-11: the DNS host of `openvaa.org` is Cloudflare; the budget is 100 USD a month to
  the operator's address; mail volume is about 100 a day with a peak of 2000; the deploy trigger is a GitHub
  Actions run on a push to `deploy/staging` (phase 187). The Supabase region was left blank, so it is
  `eu-north-1` if the dashboard offers it; a project's region cannot be changed later, so the runbook has the
  operator confirm it at creation. **Still to be given (TBA):**
  - the identity that applies Terraform by hand (an IAM Identity Center permission set, or an IAM user with
    MFA) — needed before the first apply of wave A;
  - the Supabase organisation and the holder of the access token — needed for wave B only;
  - a mailbox for DMARC reports, or none.
  Not answered: whether `staging` is unused at Cloudflare. The account and DNS inventory at the start of the
  phase checks it.

### Claude's Discretion

- Module boundaries under `infra/modules/*`, resource names, and the path that holds the customer-managed
  policies.
- The state bucket's name and the state keys.
- The values of the hosted auth rate limits, chosen in planning and recorded.
- Which checkpoints the plans place around the operator's hand applies.

### Deferred Ideas (OUT OF SCOPE)

- Re-pinning every existing action in `main.yaml` by commit SHA — a separate change.
- An SNS topic for alerts that INFRA-16 could reuse — decided against here; phase 187 decides for INFRA-16.
- The Edge Function secrets resource — phase 184.
- Moving all of `openvaa.org` to Route 53 — rejected.
- The move to publishable keys (FUT-02) — queued for right after both streams merge.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-15 (closed here) | A budget alarm notifies the operator when the account's spend passes a set threshold. | Q8: `aws_budgets_budget`, why the forecast alert cannot be seen at once, how to pick the test amount. |
| INFRA-17 (closed here) | Permissions come from customer-managed policies where an AWS-managed one does not fit. No permission depends on an inline user policy. | Q4 (policy set and limits), Q5 (complete resource list for the guard, account inventory script). |
| INFRA-18 (closed here) | A Route 53 zone serves `staging.openvaa.org`. The records the operator changes at the DNS host are documented. | Q6: the NS record set at Cloudflare, verification from outside, the observed state of the name today. |
| SUPA-11 (closed here) | A guard in `lint:check` fails when security-relevant keys of `config.toml` and the hosted settings disagree. | Q2: all 64 live keys classified with the hosted key for each. Q1: the exact hosted key names. |
| INFRA-01 (started) | Registry with immutable tags. | Q10: `image_tag_mutability = "IMMUTABLE"` in the bootstrap root. |
| INFRA-10 (started) | Remote, locked state. | Q3: S3 backend, `use_lockfile`, migration sequence, hardening. |
| INFRA-13 (started) | Cost tags on every resource. | Q10: provider `default_tags`. Activation as cost allocation tags is a billing step. |
| PIPE-01 (started) | OIDC provider, plan role, deploy role. | Q4: provider, trust conditions, subject formats, the 2026-07-15 change. |
| SUPA-02, SUPA-03 (started) | Hosted auth and API settings written in HCL and applied. | Q1, Q2: resource behaviour, key names, the JSON file. |
| SUPA-08 (started) | Hardened state bucket and ignore entries. | Q3, Q11. |
| SUPA-12 (started) | Import, `prevent_destroy`, separate state file. | Q1: what import leaves in state, what `prevent_destroy` covers and does not cover. |
| SUPA-14 (started) | SES domain identity with DKIM, SPF, DMARC. | Q7. |
</phase_requirements>

## Summary

The phase is buildable as decided. Reading the two providers' source and the vendor documents turned up eleven facts that change how plans must be written. None overturns a decision. Each is listed under "CONTEXT statements that need an amendment" below, and the affected decision is named.

The largest risks sit in the Supabase root. The provider sends only the keys the HCL declares, and it decodes them through a generated Go struct. A misspelled key is dropped before the request, yet it stays in Terraform state, so a second plan is empty and the setting never reaches the project. The exact key names are therefore the control, and I read all 234 of them from the API client the provider compiles against. After an import the provider holds no database password, so the first apply would call Supabase's password-update endpoint unless the plan chooses otherwise. `prevent_destroy` stops a destroy only while the resource block exists.

On the AWS side the work is standard. Three details are not: the DKIM record target varies by region and the provider does not export it; a forecast budget alert needs about five weeks of usage data; and a read-only plan role cannot take the state lock.

**Primary recommendation:** Write the four roots with literal backend blocks and a `required_version` of `>= 1.10`. Keep every hosted security value in one JSON file whose key names come from the table in Q1. Rehearse import, settings apply, second plan and the destroy refusal on the throwaway project before the persistent project is touched.

### CONTEXT statements that need an amendment

| # | Decision | What research found | Consequence for the plan |
|---|----------|--------------------|--------------------------|
| 1 | D-08 | The list of inline-policy resources is short by one, and three resources that look like attachers are not. See Q5. | The guard also fails on `aws_ssoadmin_permission_set_inline_policy`. It allows `aws_iam_*_policies_exclusive` only with `policy_names = []`. |
| 2 | D-06 | The three DKIM CNAME targets are `token.<SigningHostedZone>`. AWS says the hosted zone "varies by AWS Region and identity". `aws_sesv2_email_identity` exports the tokens and not the zone. | The zone is a variable. The runbook reads it from the SES API after the first apply and compares. |
| 3 | D-11 | A forecast alert "isn't triggered until you have enough historical usage information" (about 5 weeks). An actual alert is sent once per budget period. Budget data updates up to three times a day. | Only the actual alert can be expected to fire at the test amount. The mail can take a day. The test amount is derived from the observed month-to-date spend. |
| 4 | D-10, D-12 | After `terraform import` the project has no `database_password` in state. The next apply sends the configured password to Supabase's update endpoint. | The plan must choose: `ignore_changes = [database_password]`, or let Terraform re-set the password. See Q1. |
| 5 | D-15 | `supabase_settings` does not need to be imported for the persistent project. Create and update are the same partial update. Import is useful on the throwaway project, to list the keys. | Persistent root: import the project only. |
| 6 | A6 | `required_version = "~> 1.16"` (the sketch in `research/STACK.md`) would refuse OpenTofu, whose current version is 1.13.1. | Use `>= 1.10`. Pin 1.16.5 in CI and in a `.terraform-version` file. |
| 7 | D-07 | With `use_lockfile`, a plan takes a lock, which needs `s3:PutObject` and `s3:DeleteObject` on the `.tflock` object. `ReadOnlyAccess` has neither. The deny on secret reads also means `staging/aws` cannot hold secret values as resources it refreshes. | Phase 187 plans with `-lock=false`, or the plan role gets lock rights on one key. Phase 185 keeps secret values out of `staging/aws`. |
| 8 | D-09 | `OpenVAA/voting-advice-application` was created on 2022-10-06, so it keeps the name-based subject. A rename, a transfer, or an opt-in moves it to the id-bearing format. A fork made after 2026-07-15 uses the id-bearing format from the start. | Staging trust policy as ruled. The `example` environment shows the id-bearing form. See Q4. |
| 9 | D-16 | `main.yaml` runs on pushes to `main` and `ci-evidence/**` and on pull requests into `main`. A commit on this branch produces no run. | "Seen passing in a run" needs a `ci-evidence/**` push or a pull request. |
| 10 | D-11, D-10 | A tracked tfvars file with the operator's address publishes it in a public repository. The address is not on D-10's tracked list. | The alert address is a variable with no default, given per session. Or the operator names a role address that may be tracked. |
| 11 | D-01 | The widely used Terraform ignore template ignores `*.tfvars`. | The ignore entries are written by hand so that `terraform.tfvars` stays tracked. See Q11. |

Two open items of CONTEXT are answered by observation:

- **"Not answered: whether `staging` is unused at Cloudflare."** Public DNS answered `NXDOMAIN` for `staging.openvaa.org`, `x.staging.openvaa.org` and `_dmarc.staging.openvaa.org` on 2026-10-11T20:07Z (resolver 1.1.1.1). No public record exists at or under the name. The Cloudflare dashboard is still the full check, because a disabled or proxied record would not show. [VERIFIED: `dig`, this session]
- **"A premise that may be false: … the account may already hold IAM users with inline policies."** AWS documents that SES SMTP credentials created in the console before 2024-09-06 carry an inline user policy. If the Render deployment used such credentials in this account, the inventory will find one. [CITED: https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html]

## Architectural Responsibility Map

This phase has no browser or application tier. The tiers are the places where state and authority rest.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State bucket, OIDC provider, roles, policies, registry, budget | `infra/bootstrap` (hand-applied, AWS) | — | Things the other roots and the pipeline need before they can run. All IAM is here or in `dns-mail` (D-07). |
| Hosted zone, SES identity, DNS records for mail, SMTP user | `infra/envs/staging/dns-mail` (hand-applied, AWS) | Cloudflare (one NS record set, by hand) | Must outlive `staging/aws` (D-02). Creates an IAM user, so it is hand-applied. |
| Hosted project import, API and auth settings | `infra/envs/staging/supabase` (hand-applied, Supabase Management API) | — | Own state file, `prevent_destroy` (SUPA-12). |
| Frontend stack | `infra/envs/staging/aws` | — | Written in phase 185. In this phase it is a root that validates and holds no resources. |
| Hosted security values | `infra/modules/supabase/hosted-settings.json` | `apps/supabase/supabase/config.toml` (local truth) | One file the HCL reads and the guard parses (D-14). |
| Rule "no inline policy" in code | `scripts/assert-*.mjs` in `lint:check` | `infra/scripts` account script (operator, with credentials) | The repository half and the account half of INFRA-17. |
| Format and validation of Terraform | `infra-validate` job in `main.yaml` | Local `terraform fmt` and `validate` | No credentials (D-16). |
| Every apply, import and credentialed read | The operator's workstation | — | D-10. The agent reads non-secret output. |

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Terraform CLI | 1.16.5 (2026-10-02) | All provisioning | Ruling A6. [VERIFIED: GitHub Releases API, `hashicorp/terraform`, 2026-10-11] |
| `hashicorp/aws` provider | 6.68.0 (2026-10-07), constraint `~> 6.60` | AWS resources | Official tier. [VERIFIED: GitHub Releases API and registry.terraform.io `tier: official`] |
| `supabase/supabase` provider | 1.11.0 (2026-09-02), constraint `~> 1.11` | Project import, settings | Published from `github.com/supabase/terraform-provider-supabase`. Registry tier is `community`. Protocol 6.0. [VERIFIED: GitHub Releases API, registry.terraform.io, registry.opentofu.org] |
| `hashicorp/setup-terraform` | v4.0.1, commit `dfe3c3f87815947d99a8997f908cb6525fc44e9e` | Installs Terraform in CI | Official action. The tags `v4` and `v4.0.1` both point at this commit. [VERIFIED: GitHub git refs API, 2026-10-11] |
| AWS CLI v2 | 2.34.7 installed | Inventory and read-back by the operator | Already on the workstation. [VERIFIED: `aws --version`] |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| OpenTofu | 1.13.1 (2026-10-01) | Optional second validation leg | Only if the plan wants "OpenTofu-compatible" to be an observation and not a claim. [VERIFIED: GitHub Releases API] |
| `opentofu/setup-opentofu` | v2.0.2, commit `a1320f892987e89d278cc92dc5adc984fb93aca4` | Installs OpenTofu in CI | With the optional leg. [VERIFIED: GitHub git refs API] |
| `dig`, `jq`, `gh` | installed | Delegation checks, JSON reads, run inspection | The agent can run `dig` itself. [VERIFIED: `command -v`] |

`hashicorp/random` is not needed in this phase. D-10 rules that Terraform does not generate the database password.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Literal backend block per root | Partial backend plus `-backend-config` file | A wrong pairing of root and key becomes possible. D-01 rejected the same shape for var files. |
| Values by tfvars and name lookups | `terraform_remote_state` | Needs read access to the whole state snapshot of the other root. D-07 denies exactly that to the plan role. |
| `aws_sesv2_email_identity` | `aws_ses_domain_identity` and `aws_ses_domain_dkim` (v1 API) | The v1 resources also give no DKIM hosted zone. The v2 resource has the MAIL FROM companion and the verification status. |

**Installation (operator, once):**

```bash
brew install hashicorp/tap/terraform    # must report 1.16.5; the workstation has 1.14.7 today
terraform version
```

**Version verification done this session:** `curl https://api.github.com/repos/<repo>/releases` for each tool above, and `https://registry.terraform.io/v1/providers/…` and `https://registry.opentofu.org/v1/providers/…/versions` for the two providers.

## Package Legitimacy Audit

No npm, PyPI or crates package is installed in this phase (D-14). The `package-legitimacy` seam accepts only those three ecosystems (`Usage: gsd-tools package-legitimacy check --ecosystem <npm|pypi|crates>`), so the Terraform providers and actions were checked by hand.

| Item | Registry | Age | Use | Source Repo | Finding | Disposition |
|------|----------|-----|-----|-------------|---------|-------------|
| `hashicorp/aws` 6.68.0 | registry.terraform.io, tier `official`; also registry.opentofu.org | years | very wide | github.com/hashicorp/terraform-provider-aws | consistent | Approved |
| `supabase/supabase` 1.11.0 | registry.terraform.io, tier `community`; 1,119,026 downloads; also registry.opentofu.org with 13 platforms | first releases before 2026-03 | moderate | github.com/supabase/terraform-provider-supabase | source is Supabase's own organisation; the provider's doc pages are generated from this repo | Approved |
| `hashicorp/setup-terraform` v4.0.1 | GitHub | v3.0.0 dates from 2023-10 | wide | github.com/hashicorp/setup-terraform | pin by the SHA above | Approved |
| `opentofu/setup-opentofu` v2.0.2 | GitHub | v1.0.6 dates from 2025-08 | moderate | github.com/opentofu/setup-opentofu | optional | Approved if used |

**Removed:** none. **Flagged:** none. The repository's `npmMinimalAgeGate: 7d` does not apply to providers. All four items are older than seven days.

## Findings for the twelve open questions

### Q1. The Supabase Terraform provider

**Version and compatibility.** 1.11.0 is the latest release (2026-09-02). It speaks plugin protocol 6.0 and is listed in the OpenTofu registry with 13 platform builds. [VERIFIED: GitHub Releases API; `terraform-registry-manifest.json` at tag `v1.11.0`; `https://registry.opentofu.org/v1/providers/supabase/supabase/versions`] The provider reads `SUPABASE_ACCESS_TOKEN` from the environment. [CITED: https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/index.md] Whether the provider behaves the same under OpenTofu was not run. `[ASSUMED]`

**`supabase_project`.** Required: `database_password` (sensitive, at least 4 characters), `name`, `organization_id` (documented as the organisation slug), `region`. Optional and computed: `instance_size`, `legacy_api_keys_enabled` (deprecated). [VERIFIED: `internal/provider/project_resource.go` at `v1.11.0`]

Import syntax:

```shell
terraform import supabase_project.production <project_ref>
```

or an `import { to = …  id = … }` block. [CITED: provider `docs/resources/project.md` and `docs/tutorial.md` at `v1.11.0`]

What import and refresh write to state, read from the source:

- `organization_id`, `name`, `region` come from the project API. The read uses the response field `organization_id`, which the API client marks "Deprecated: Use `organization_slug` instead". The plan must copy the value that the throwaway import shows, not the value in the dashboard URL, until the two are seen equal.
- `instance_size` comes from the compute add-on, and is null when there is none.
- `legacy_api_keys_enabled` comes from its own endpoint. This is a free reading for SUPA-13.
- `database_password` is **not** read. The provider's own test says so: `// database_password is not refreshed from the API`, with `ImportStateVerifyIgnore: []string{"database_password"}`.

[VERIFIED: `project_resource.go` `readProject` and `project_resource_test.go` at `v1.11.0`]

What the update does:

- A changed `name` renames the project.
- A changed `database_password` calls `V1UpdateDatabasePasswordWithResponse`. After an import the state value is null, so the first plan shows a change, and the first apply sends the configured password to Supabase.
- A changed `region` or `organization_id` returns the error "Update is not supported for this attribute". No attribute carries a `RequiresReplace` plan modifier, so a wrong value never plans a replacement of the project.
- A declared `instance_size` that differs triggers a compute change.

[VERIFIED: `project_resource.go` `Update`]

**Recommendation for the project block.** Declare `organization_id`, `name` and `region` with the values the import shows. Do not declare `instance_size` or `legacy_api_keys_enabled`. For the password, the plan picks one of two, and the throwaway rehearsal shows which plan output each gives:

| Option | State holds the password | First apply | Note |
|--------|--------------------------|-------------|------|
| `lifecycle { ignore_changes = [database_password] }` (recommended) | No | No password call | The variable is still required by the schema, so it takes the per-session export of D-10 and is never sent. Phase 187 then reads the password from the GitHub Environment, not from state. |
| No `ignore_changes` | Yes | Calls the password-update endpoint with the exported value | A wrong export changes the live password. The effect of the call on open connections is unknown. |

That `ignore_changes` yields an empty plan for a required, never-read attribute is my reading of Terraform's behaviour and was not run. `[ASSUMED]`

**`prevent_destroy`.** Terraform "rejects plans that would destroy the infrastructure object … The argument must be present in the configuration. This rule doesn't prevent Terraform from destroying a resource if you remove its configuration." Terraform also "does not explicitly record a resource's `lifecycle` rule to state". [CITED: https://raw.githubusercontent.com/hashicorp/web-unified-docs/main/content/terraform/v1.16.x/docs/language/meta-arguments/lifecycle.mdx] It is a core feature, so it applies to an imported resource like any other. The refusal appears at plan time: `terraform plan -destroy` exits non-zero with "Instance cannot be destroyed", and nothing is applied. `[ASSUMED]` for the exact message.

What it does not cover: deleting or renaming the `supabase_project` block, or moving it between a root and a module without a `moved` block. Either plans a destroy with no protection. The plan should add an assertion to a guard that the Supabase module still holds `resource "supabase_project"` with `prevent_destroy = true`, and a runbook rule that a Supabase-root plan showing "destroy" is never applied.

**`supabase_settings`.** Attributes `api`, `auth`, `database`, `network`, `pooler`, `storage` are JSON strings. `ssl_enforcement` is a boolean. Import syntax:

```shell
terraform import supabase_settings.production <project_ref>
```

"On import, all setting categories (API, auth, etc.) are fetched from the API." [CITED: provider `docs/resources/settings.md` at `v1.11.0`]

Behaviour read from `internal/provider/settings_resource.go` at `v1.11.0` [VERIFIED]:

1. **Partial update.** Create and update send only the keys present in the JSON. The tutorial says: "there is no difference between creating and updating `supabase_settings` resource. Deletion is always a no-op." A destroy of this resource changes nothing on the project.
2. **State holds only the managed keys.** After an apply, `parseConfig` picks from the API response the keys that the plan named. After an import the state holds every non-null key, because there is nothing to pick by.
3. **Unknown keys are dropped in silence.** The plan JSON is decoded into a generated struct (`var body api.UpdateAuthConfigBody; plan.Auth.Unmarshal(&body)`; the same for `api.V1UpdatePostgrestConfigBody`). The provider's own comment on the database path describes the result: "encoding/json silently drops every other key … the apply reported success while the API replaced the config without them." The database path was fixed. The `auth` and `api` paths still decode through the struct. A misspelled key is therefore not sent, stays in state with the planned value, and gives an empty second plan.
4. **Secret fields.** The API returns `smtp_pass` and 32 other fields as a hash. The provider copies them from the plan or the prior state. A change made to them in the dashboard does not show in a plan. On import the state has no secret fields.
5. **`auth` is not marked sensitive in the schema.** If `smtp_pass` is written from a `sensitive` variable into the same `jsonencode`, Terraform hides the whole `auth` diff. If the variable is not sensitive, the password prints in the plan. A second `supabase_settings` resource that holds only `smtp_pass` would keep the main diff readable. Two resources for one project are possible by the code, since each picks its own keys. This was not run. `[ASSUMED]`

**Exact JSON keys.** The provider compiles against `github.com/supabase/cli/pkg v1.2.3` (its `go.mod`). I read `pkg/api/types.gen.go` at tag `pkg/v1.2.3`. [VERIFIED: https://raw.githubusercontent.com/supabase/cli/pkg/v1.2.3/pkg/api/types.gen.go]

`api` (`V1UpdatePostgrestConfigBody`), all four keys:

| Key | Type |
|-----|------|
| `db_schema` | string, comma-separated |
| `db_extra_search_path` | string, comma-separated |
| `max_rows` | integer |
| `db_pool` | integer |

`auth` (`UpdateAuthConfigBody`) has 234 keys. The ones this phase can use:

| Key | Type | Note |
|-----|------|------|
| `site_url` | string | |
| `uri_allow_list` | string, comma-separated | |
| `disable_signup` | boolean | inverse of `[auth] enable_signup` |
| `mailer_autoconfirm` | boolean | inverse of `[auth.email] enable_confirmations` |
| `external_email_enabled` | boolean | `[auth.email] enable_signup` |
| `external_phone_enabled` | boolean | `[auth.sms] enable_signup` |
| `external_anonymous_users_enabled` | boolean | |
| `security_manual_linking_enabled` | boolean | |
| `jwt_exp` | integer | |
| `refresh_token_rotation_enabled` | boolean | |
| `security_refresh_token_reuse_interval` | integer | |
| `password_min_length` | integer | |
| `password_required_characters` | enum string | `""` is a valid value |
| `mailer_secure_email_change_enabled` | boolean | `double_confirm_changes` |
| `security_update_password_require_reauthentication` | boolean | `secure_password_change` |
| `mailer_otp_length`, `mailer_otp_exp` | integer | |
| `smtp_max_frequency` | integer, seconds | `[auth.email] max_frequency` |
| `hook_custom_access_token_enabled`, `hook_custom_access_token_uri` | boolean, string | |
| `rate_limit_email_sent`, `rate_limit_sms_sent`, `rate_limit_anonymous_users`, `rate_limit_token_refresh`, `rate_limit_otp`, `rate_limit_verify`, `rate_limit_web3` | integer | seven keys, no others |
| `mfa_totp_enroll_enabled`, `mfa_totp_verify_enabled`, `mfa_phone_enroll_enabled`, `mfa_phone_verify_enabled`, `mfa_max_enrolled_factors` | boolean, integer | |
| `external_apple_enabled`, `external_web3_solana_enabled` | boolean | |
| `oauth_server_enabled`, `oauth_server_allow_dynamic_registration`, `oauth_server_authorization_path` | boolean, boolean, string | |
| `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_admin_email`, `smtp_sender_name` | strings | `smtp_port` is a **string** |
| `security_sb_forwarded_for_enabled` | boolean | for phase 184's measurement |

The local-to-hosted mapping and the two inversions come from the pinned CLI's own source, `apps/cli-go/pkg/config/auth.go` and `api.go` at tag `v2.118.0` [VERIFIED]: `DisableSignup: …(!a.EnableSignup)`, `body.MailerAutoconfirm = …(!e.EnableConfirmations)`, `body.RateLimitOtp = …(r.SignInSignUps)`, `body.RateLimitVerify = …(r.TokenVerifications)`, `UriAllowList: …(strings.Join(a.AdditionalRedirectUrls, ","))`.

**What only the throwaway import can show.** The key names are settled above. These are not:

- the string the API returns for `db_schema` and `uri_allow_list` (spacing, order). A returned string that differs from the sent one gives a plan that never empties;
- whether the hosted API accepts the three `oauth_server_*` keys (the CLI source says the feature "is behind a feature flag in the remote API");
- whether `rate_limit_email_sent` is accepted before SMTP is set (the docs say it is configurable "when you use custom SMTP or the Send Email hook"; the CLI sends it only then);
- the platform defaults of a new project, as values;
- `organization_id` as the provider reads it.

The runbook command that returns this without secrets (no SMTP password exists on a new project, and import writes no secret field):

```bash
terraform show -json | jq '.values.root_module | [.. | objects | select(.type? == "supabase_settings")][0].values
  | {api: (.api | fromjson), auth_keys: (.auth | fromjson | keys),
     auth_selected: (.auth | fromjson | with_entries(select(.key | test("^(site_url|uri_allow_list|disable_signup|mailer_autoconfirm|jwt_exp|password_|rate_limit_|smtp_max_frequency|mailer_otp|hook_custom_access_token_(enabled|uri)|oauth_server|security_(manual|refresh|update|sb_))"))))}'
```

**Confidence:** HIGH for what the provider code does. MEDIUM that the hosted API matches its generated client. LOW for the items marked `[ASSUMED]`.

### Q2. `config.toml` keys, classes and hosted keys

I read `apps/supabase/supabase/config.toml` in full this session. It has 64 live keys under `[api]`, `[api.tls]`, `[auth]` and `[auth.*]`. D-13 names `[api]`, `[auth]` and `[auth.*]`, which is 63. `[api.tls] enabled` is one more, and classifying it costs one row. [VERIFIED: `apps/supabase/supabase/config.toml:10-33,172-400`]

Classes: **A** must agree, **S** hosted may be stricter, **D** differs by design, **N** not compared (reason given).

`[api]` — verbatim: `enabled = true`, `port = 54321`, `schemas = ["public", "graphql_public"]`, `extra_search_path = ["public", "extensions"]`, `max_rows = 50000`; `[api.tls]` `enabled = false`.

| Key | Class | Hosted key | Rule or reason |
|-----|-------|-----------|----------------|
| `enabled` | N | — | Local service switch. Hosted "off" is an empty `db_schema`, which class A on `schemas` already excludes. |
| `port` | N | — | Local port. |
| `schemas` | A | `api.db_schema` | Same set. An extra exposed schema is an API surface. |
| `extra_search_path` | A | `api.db_extra_search_path` | Same list. |
| `max_rows` | A, three ways | `api.max_rows` | Equal to `config.toml`, the JSON and `pageSize`. |
| `[api.tls] enabled` | N | — | Local TLS only. |

`[auth]` — verbatim: `enabled = true`, `site_url = "http://127.0.0.1:5173"`, `additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:5173/api/auth/callback", "http://localhost:5173/*/api/auth/callback"]`, `jwt_expiry = 3600`, `enable_refresh_token_rotation = true`, `refresh_token_reuse_interval = 10`, `enable_signup = false`, `enable_anonymous_sign_ins = false`, `enable_manual_linking = false`, `minimum_password_length = 6`, `password_requirements = ""`.

| Key | Class | Hosted key | Rule or reason |
|-----|-------|-----------|----------------|
| `enabled` | N | — | Local service switch. |
| `site_url` | D | `auth.site_url` | Hosted is the public origin. Guard rule: `https`, no path, host is not `localhost` or a loopback address. |
| `additional_redirect_urls` | D | `auth.uri_allow_list` | See "redirect entries" below. |
| `jwt_expiry` | S | `jwt_exp` | Hosted ≤ local. |
| `enable_refresh_token_rotation` | A | `refresh_token_rotation_enabled` | |
| `refresh_token_reuse_interval` | A | `security_refresh_token_reuse_interval` | The server-side session refresh is tested at 10 s. |
| `enable_signup` | A, inverted | `disable_signup` | Hosted `true`. |
| `enable_anonymous_sign_ins` | A | `external_anonymous_users_enabled` | |
| `enable_manual_linking` | A | `security_manual_linking_enabled` | |
| `minimum_password_length` | S | `password_min_length` | Hosted ≥ local. |
| `password_requirements` | S | `password_required_characters` | Proposed hosted value `""`, equal to local. |

`[auth.rate_limit]` — verbatim: `email_sent = 2`, `sms_sent = 30`, `anonymous_users = 30`, `token_refresh = 150`, `sign_in_sign_ups = 30`, `token_verifications = 30`, `web3 = 30`. All seven are class N by D-13. Reason: local limits serve the test suite on one address, hosted limits are sized for a hosted topology and a mail quota.

| Local key | Hosted key |
|-----------|-----------|
| `email_sent` | `rate_limit_email_sent` |
| `sms_sent` | `rate_limit_sms_sent` |
| `anonymous_users` | `rate_limit_anonymous_users` |
| `token_refresh` | `rate_limit_token_refresh` |
| `sign_in_sign_ups` | `rate_limit_otp` |
| `token_verifications` | `rate_limit_verify` |
| `web3` | `rate_limit_web3` |

`[auth.email]` — verbatim: `enable_signup = true`, `double_confirm_changes = true`, `enable_confirmations = true`, `secure_password_change = false`, `max_frequency = "1s"`, `otp_length = 6`, `otp_expiry = 3600`.

| Key | Class | Hosted key | Rule or reason |
|-----|-------|-----------|----------------|
| `enable_signup` | A | `external_email_enabled` | Switches the email provider. |
| `double_confirm_changes` | A | `mailer_secure_email_change_enabled` | |
| `enable_confirmations` | A, inverted | `mailer_autoconfirm` | Hosted `false`. |
| `secure_password_change` | A | `security_update_password_require_reauthentication` | A stricter hosted value would change a flow no test covers. |
| `max_frequency` | S | `smtp_max_frequency` | Hosted ≥ local, in seconds. Proposed 60, the documented platform default. |
| `otp_length` | A | `mailer_otp_length` | |
| `otp_expiry` | S | `mailer_otp_exp` | Hosted ≤ local. |

`[auth.sms]` — verbatim: `enable_signup = false`, `enable_confirmations = false`, `template = "Your code is {{ .Code }}"`, `max_frequency = "5s"`. `[auth.sms.twilio]` — `enabled = false`, `account_sid = ""`, `message_service_sid = ""`, `auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"`.

| Key | Class | Hosted key | Rule or reason |
|-----|-------|-----------|----------------|
| `[auth.sms] enable_signup` | A | `external_phone_enabled` | Hosted `false`. |
| `[auth.sms]` other three | N | `sms_autoconfirm`, `sms_template`, `sms_max_frequency` | Inert while the phone provider is off. |
| `[auth.sms.twilio]` four keys | N | `sms_provider`, `sms_twilio_*` | Inert while the phone provider is off. One is an environment reference. |

`[auth.hook.custom_access_token]` — verbatim: `enabled = true`, `uri = "pg-functions://postgres/public/custom_access_token_hook"`. Both class A, hosted keys `hook_custom_access_token_enabled` and `hook_custom_access_token_uri`.

`[auth.mfa]` `max_enrolled_factors = 10`; `[auth.mfa.totp]` `enroll_enabled = false`, `verify_enabled = false`; `[auth.mfa.phone]` `enroll_enabled = false`, `verify_enabled = false`, `otp_length = 6`, `template = "Your code is {{ .Code }}"`, `max_frequency = "5s"`.

| Key | Class | Hosted key | Rule or reason |
|-----|-------|-----------|----------------|
| totp and phone `enroll_enabled`, `verify_enabled` (four) | A | `mfa_totp_enroll_enabled`, `mfa_totp_verify_enabled`, `mfa_phone_enroll_enabled`, `mfa_phone_verify_enabled` | A factor switched on changes the sign-in surface. |
| `max_enrolled_factors`, phone `otp_length`, `template`, `max_frequency` | N | `mfa_max_enrolled_factors`, `mfa_phone_*` | Inert while every factor is off. |

`[auth.external.apple]` — `enabled = false`, `client_id = ""`, `secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"`, `redirect_uri = ""`, `url = ""`, `skip_nonce_check = false`, `email_optional = false`. `enabled` is class A (`external_apple_enabled`). The other six are N, inert while disabled.

`[auth.web3.solana] enabled = false` — class A, `external_web3_solana_enabled`.

`[auth.third_party.firebase|auth0|aws_cognito|clerk] enabled = false` — four keys, class N. Third-party auth is a separate API and a separate resource (`supabase_third_party_auth`). It is not part of `supabase_settings.auth`.

`[auth.oauth_server]` — `enabled = false`, `authorization_url_path = "/oauth/consent"`, `allow_dynamic_registration = false`. `enabled` and `allow_dynamic_registration` are class A (`oauth_server_enabled`, `oauth_server_allow_dynamic_registration`) if the throwaway apply shows the API accepts them. If it does not, they become N with that observation as the reason. The path is N.

**Tally:** 24 A, 5 S, 2 D, 33 N, which is 64. The guard must fail on a live key that is in none of the four lists, and should fail on a listed key that no longer exists in the file, so the table cannot go stale in either direction.

**One limit of this guard.** It compares what `config.toml` declares. A provider that exists only on the hosted side, for example `external_google_enabled` switched on in the dashboard, is not in `config.toml` and is not seen. That is the conformance probe's job in phase 184 (SUPA-07).

**The three redirect entries — confirmed.** The first, `"https://127.0.0.1:3000"`, appears nowhere else under `apps`, `packages`, `tests` or `scripts`. It is the CLI template's default. [VERIFIED: `grep -rn "127.0.0.1:3000"`, one match] The other two carry the path suffixes `/api/auth/callback` and `/*/api/auth/callback` on `http://localhost:5173`. Proposed guard rule:

- the JSON holds `redirect_callback_paths` with exactly those two suffixes, and the HCL builds `uri_allow_list` as `<origin><suffix>` joined by a comma;
- each suffix of the JSON is the suffix of one local entry;
- no hosted entry contains `**`, ends in `*`, or has `*` in the host;
- the first local entry is listed as local-only.

**`max_rows`, `pageSize`, `email_sent` — confirmed.** `max_rows = 50000` [VERIFIED: `config.toml:29`]. `pageSize: 50000` under `dataAdapter`, with the comment "Must equal PostgREST `max_rows` in apps/supabase/supabase/config.toml (50000) or a hosted project's API setting." [VERIFIED: `packages/app-shared/src/settings/staticSettings.ts:12-18`] `email_sent = 2` [VERIFIED: `config.toml:224`]. No existing script compares the two 50000 values: `max_rows` appears only in `fetchAllRows.ts`, its test, and the two settings files. [VERIFIED: `grep -rln "max_rows"`] The guard reads `pageSize` with a line read of the `dataAdapter` block.

**Proposed hosted auth rate limits.** Documented platform defaults: 2 mails an hour with the built-in mailer, 30 SMS an hour, 30 sign-up and sign-in requests per 5 minutes per address, 30 verifications per 5 minutes per address, 150 token requests per 5 minutes per address, 30 anonymous sign-ins an hour, 30 Web3 per 5 minutes. [CITED: https://supabase.com/docs/guides/auth/rate-limits.md]

| Hosted key | Proposed staging value | Reason |
|-----------|------------------------|--------|
| `rate_limit_email_sent` | 100 | Counts mail the auth service itself sends (password recovery, email change). The invitation link is mailed by the Edge Function and is not counted. 2 an hour is unusable. 100 is above any staging use and below the SES sandbox quota of 200 a day. Declared only together with SMTP. |
| `rate_limit_otp` | 30 | Platform default, equal to local. Phase 184 measures at what rate one address meets 429, because the frontend's server calls arrive from the tasks' addresses. |
| `rate_limit_verify` | 30 | Same. This is the limit an invitation mailing would meet. Sizing it before the measurement would be a guess. |
| `rate_limit_token_refresh` | 150 | Platform default. |
| `rate_limit_anonymous_users` | 30 | Inert, anonymous sign-in is off. |
| `rate_limit_sms_sent` | 30 | Inert, phone is off. |
| `rate_limit_web3` | 30 | Inert, Web3 is off. |

These are design values. `[ASSUMED]` They are variables of the module, so the `example` environment can carry production-shaped numbers.

**Confidence:** HIGH for the key inventory and the mapping. MEDIUM for the classes, which are judgement. LOW for the rate-limit numbers.

### Q3. S3 backend, migration, hardening, reading another root

**`use_lockfile`.** "This backend also supports state locking which can be enabled by setting the `use_lockfile` argument to `true`." "DynamoDB-based locking is deprecated and will be removed in a future minor version." Permissions: `s3:ListBucket` on the bucket, `s3:GetObject` and `s3:PutObject` on the state key, and "If `use_lockfile` is set, `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` are required on the lock file, e.g., `arn:aws:s3:::mybucket/path/to/my/key.tflock`". "`s3:DeleteObject` is not required on the state file". [CITED: https://raw.githubusercontent.com/hashicorp/web-unified-docs/main/content/terraform/v1.16.x/docs/language/backend/s3.mdx]

**OpenTofu.** "This can be enabled by setting `use_lockfile=true`." "Both S3 and DynamoDB locking mechanisms are fully supported". [CITED: https://raw.githubusercontent.com/opentofu/opentofu/v1.13.1/website/docs/language/settings/backends/s3.mdx] The same backend block works in both tools.

**`required_version`.** OpenTofu checks this constraint against its own version, 1.13.1, so `~> 1.16` fails there. `>= 1.10` admits Terraform 1.16.5 and OpenTofu 1.13.1, and both have `use_lockfile`. `[ASSUMED]` for OpenTofu's handling of the constraint. A `tofu init -backend=false && tofu validate` step shows it.

**Migration sequence (D-03).** `terraform init` needs "`-reconfigure` or `-migrate-state`" when the backend changes. "The `-migrate-state` option will attempt to copy existing state to the new backend". [CITED: https://raw.githubusercontent.com/hashicorp/web-unified-docs/main/content/terraform/v1.16.x/docs/cli/commands/init.mdx]

Recommended mechanism: `infra/bootstrap/backend.tf` is tracked from the start with the S3 block. For the first apply the operator writes an untracked `backend_override.tf`:

```hcl
terraform {
  backend "local" {}
}
```

Then:

```bash
cd infra/bootstrap
terraform init                      # local backend, through the override
terraform apply                     # creates the bucket and the rest
rm backend_override.tf
terraform init -migrate-state       # answer yes; state is copied to S3
rm -f terraform.tfstate terraform.tfstate.backup
terraform plan -detailed-exitcode   # exit 0 means no change
```

The tracked tree does not change between the first apply and the migration, and a forker follows the same steps. `*_override.tf` is ignored by Git (Q11). That override files merge a `backend` block this way was not run. `[ASSUMED]` The literal alternative is two commits: the first without `backend.tf`, the second adding it. Both satisfy D-03.

**Bucket hardening.** Resources: `aws_s3_bucket` with `lifecycle { prevent_destroy = true }`; `aws_s3_bucket_versioning` (`Enabled`); `aws_s3_bucket_server_side_encryption_configuration` (`AES256`); `aws_s3_bucket_public_access_block` (all four `true`); `aws_s3_bucket_ownership_controls` (`BucketOwnerEnforced`); `aws_s3_bucket_policy` with a deny when `aws:SecureTransport` is `false`. All six exist in provider 6.68.0. [VERIFIED: file list of `website/docs/r` at `v6.68.0`] The bucket policy is a resource policy, outside the rule of D-08. SSE-S3 has no key to manage and no monthly key fee; a customer KMS key would add a key policy and a cost for no requirement. `[ASSUMED]` for the cost statement.

Read-back for criterion 1 (operator, output is not secret):

```bash
B=<bucket>
aws s3api get-bucket-encryption   --bucket "$B"
aws s3api get-bucket-versioning   --bucket "$B"
aws s3api get-public-access-block --bucket "$B"
aws s3api get-bucket-policy-status --bucket "$B"   # IsPublic: false
aws s3api get-bucket-policy --bucket "$B" --query Policy --output text | jq .
```

**Seeing the lock.** Terraform holds the lock while it waits at the approval prompt of `apply`. In a second terminal, `terraform plan` in the same root fails with "Error acquiring the state lock", and `aws s3api head-object --bucket "$B" --key <key>.tflock` returns the object. After the apply ends, `head-object` returns 404. `[ASSUMED]` that the lock is held at the prompt.

**How a root reads another root's values.** "Although `terraform_remote_state` only exposes output values, its user must have access to the entire state snapshot, which often includes some sensitive information." [CITED: https://raw.githubusercontent.com/hashicorp/web-unified-docs/main/content/terraform/v1.16.x/docs/language/state/remote-state-data.mdx] D-07 denies the plan role that access. Recommendation: no root uses `terraform_remote_state`.

| Kind of value | How it travels |
|---------------|----------------|
| Non-secret identifier (account id, bucket name, domain, project ref) | Tracked `terraform.tfvars` of the reading root (D-10). |
| AWS resource the other root made (zone, registry) | A data source lookup by name, for example `data "aws_route53_zone"` and `data "aws_ecr_repository"`. `ReadOnlyAccess` covers such reads. `[ASSUMED]` |
| The one secret that crosses roots in this phase (SMTP password, `dns-mail` to `supabase`) | `terraform output -raw` in one shell, exported as `TF_VAR_…` for the other apply. Never written to a file. |

**Confidence:** MEDIUM. The documents are clear. The sequence was not run.

### Q4. GitHub OIDC in AWS, subjects, the 2026-07-15 change, policies and limits

**Provider.** URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com` "if you are using the official action". [CITED: https://raw.githubusercontent.com/github/docs/main/content/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws.md]

**Thumbprints.** `thumbprint_list` is optional. "For certain OIDC identity providers (e.g., Auth0, GitHub, GitLab, Google …), AWS relies on its own library of trusted root certificate authorities (CAs) for validation instead of using any configured thumbprints." [CITED: https://raw.githubusercontent.com/hashicorp/terraform-provider-aws/v6.68.0/website/docs/r/iam_openid_connect_provider.html.markdown] Omit it. An account holds one provider per URL. `[ASSUMED]` If the inventory finds one for GitHub, the root imports it instead of creating it.

**Subject formats.** [CITED: https://raw.githubusercontent.com/github/docs/main/content/actions/reference/security/oidc.md]

- Environment: `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME`. "The subject claim includes the environment name when the job references an environment."
- Pull request: `repo:ORG-NAME/REPO-NAME:pull_request`, "but only if the job doesn't reference an environment".
- A `:` inside a value becomes `%3A`.

**What changed on 2026-07-15.** "repositories created after July 15, 2026 now use an immutable default subject format that includes both the owner ID and repository ID": `repo:OWNER@OWNER-ID/REPO@REPO-ID:…`. "Repositories created before July 15, 2026 keep the previous format unless you opt in to immutable subject claims. You can opt in at the organization or repository level". "Repository renames and transfers after July 15, 2026 also move to the immutable subject format." [CITED: same file]

**Does it affect this repository.** `OpenVAA/voting-advice-application` was created on 2022-10-06. Its id is 546467466 and the organisation's id is 115159211. [VERIFIED: `https://api.github.com/repos/OpenVAA/voting-advice-application`, 2026-10-11] It keeps the name-based subject of D-09 until someone opts in, renames it or transfers it. If that happens, the subject becomes `repo:OpenVAA@115159211/voting-advice-application@546467466:environment:staging`, and the role stops being assumable until the trust policy is re-applied by hand. Whether the organisation has opted in already was not checked and needs an organisation owner. The first real answer is phase 187's first role assumption.

A fork is a repository created after the date, so it gets the id-bearing format. The `example` environment's tfvars should show that form and say why.

**More condition keys exist.** AWS lists, for GitHub, `actor`, `actor_id`, `job_workflow_ref`, `repository`, `repository_id`, `repository_owner_id`, `workflow`, `ref`, `environment` and `enterprise_id`, usable in a role trust policy, and advises: "use the immutable identifiers that GitHub provides, such as `repository_id`, `repository_owner_id`, or `actor_id`, in your role trust policies". [CITED: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html] GitHub's page still carries the note "Support for custom claims for OIDC is unavailable in AWS". The two pages disagree in wording. A trust policy that adds exact matches on `token.actions.githubusercontent.com:repository_id` and `:repository_owner_id` beside the subject of D-09 stays inside "exact matches only" and survives a rename. It cannot be tested before a workflow uses the role, so I recommend making the subject list and the two ids variables, shipping D-09 as ruled, and leaving the extra conditions for phase 187 to switch on once a first assumption has worked.

**Limits.** [CITED: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html]

| Limit | Value |
|-------|-------|
| Customer managed policy size | 6,144 characters, white space not counted |
| Inline policies on a user, in total | 2,048 characters |
| Inline policies on a role, in total | 10,240 characters |
| Inline policies on a group, in total | 5,120 characters |
| Managed policies per role | 20 by default, 25 at most |
| Managed policies per user | 10 by default, 20 at most |
| Managed policies per group | 10 |
| Role trust policy length | 2,048 characters by default, 8,192 at most |
| Customer managed policies per account | 1,500 by default |
| OIDC providers per account | 100 by default |

"One policy per concern" has room: 20 per role.

**Policies of this phase.** All under one path. I propose `/openvaa/` for policies, roles and the SMTP user.

| Policy | Attached to | Statements |
|--------|------------|-----------|
| `tfstate-staging-aws` | deploy role | `s3:ListBucket` on the bucket with an `s3:prefix` condition for the aws root's key; `s3:GetObject`, `s3:PutObject` on that key; `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `<key>.tflock`. |
| `ecr-push` | deploy role | On the repository ARN: `ecr:CompleteLayerUpload`, `ecr:UploadLayerPart`, `ecr:InitiateLayerUpload`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:BatchGetImage`. On `*`: `ecr:GetAuthorizationToken`. [CITED: https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-push-iam.html] |
| `plan-deny` | plan role, beside AWS-managed `ReadOnlyAccess` | `Deny` on `s3:GetObject` and `s3:GetObjectVersion` for the state objects of the hand-applied roots; `Deny` on `secretsmanager:GetSecretValue`, `secretsmanager:BatchGetSecretValue` and `kms:Decrypt`. |
| `ses-send` (in `dns-mail`) | SMTP user | `ses:SendRawEmail`. See Q7. |

The deploy role reaches only one state key by allow-list, so it cannot read or write the Supabase root's state. That is the first half of PIPE-08.

**State keys that make the deny complete by construction.** A deny that lists the other roots one by one misses a root added later. Put every hand-applied root under one prefix and the pipeline root under another:

```
hand/bootstrap/terraform.tfstate
hand/staging/dns-mail/terraform.tfstate
hand/staging/supabase/terraform.tfstate
pipeline/staging/aws/terraform.tfstate
```

The deny is then on `arn:aws:s3:::<bucket>/hand/*`, and the allow of `tfstate-staging-aws` is on `pipeline/staging/aws/*`.

**Two consequences of D-07 for later phases.**

1. A plan under `ReadOnlyAccess` cannot write the lock object. Phase 187 either runs pull-request plans with `-lock=false`, or the plan role gets `PutObject` and `DeleteObject` on the one `.tflock` key.
2. With `kms:Decrypt` and secret reads denied, the plan role cannot refresh a resource that holds a secret value. Phase 185 therefore keeps secret values out of `staging/aws` and refers to them by ARN.

**A check the operator can run without any workflow.** The policy simulator shows the deny and the allow-list before phase 187:

```bash
aws iam simulate-principal-policy --policy-source-arn <plan-role-arn> \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::<bucket>/hand/staging/supabase/terraform.tfstate \
                  arn:aws:s3:::<bucket>/pipeline/staging/aws/terraform.tfstate \
  --query 'EvaluationResults[].[EvalResourceName,EvalDecision]' --output table
# expected: explicitDeny for the first, allowed for the second
```

`[ASSUMED]` for the exact contents of `ReadOnlyAccess`. The explicit deny makes the answer independent of them.

**Confidence:** MEDIUM. The formats and limits are quoted. No role was assumed.

### Q5. Inline-policy resources, account inventory, the guard pattern

**Every way provider 6.68.0 attaches an inline policy.** I listed all 1,724 resource documents at tag `v6.68.0` and read the IAM ones. [VERIFIED: GitHub trees API for `website/docs/r`; `iam_role.html.markdown`; `iam_role_policies_exclusive.html.markdown`]

| Resource or argument | What it does | Guard |
|---------------------|--------------|-------|
| `aws_iam_user_policy` | Inline policy on a user | fail |
| `aws_iam_role_policy` | Inline policy on a role | fail |
| `aws_iam_group_policy` | Inline policy on a group | fail |
| `inline_policy` block of `aws_iam_role` | Inline policies on the role. "The `inline_policy` argument is deprecated." An empty block removes all inline policies. | fail in any form |
| `aws_ssoadmin_permission_set_inline_policy` | Inline policy on an Identity Center permission set, which lands as an inline policy on the reserved role in the account | fail (not in D-08's list) |
| `aws_iam_user_policies_exclusive`, `aws_iam_role_policies_exclusive`, `aws_iam_group_policies_exclusive` | Attach nothing. They remove inline policies not named in `policy_names`. With `policy_names = []` they keep the entity free of inline policies on every apply. | allow only with `policy_names = []` |

`aws_iam_user` and `aws_iam_group` have no inline argument. Outside the rule, as D-08 says: `assume_role_policy` and resource policies such as `aws_s3_bucket_policy`, `aws_ecr_repository_policy` and `aws_sesv2_email_identity_policy`.

Three ways around a text guard, which the guard's header should name:

- a module from outside `infra/` (the layout uses none);
- a `*.tf.json` file. The guard should scan `infra/**/*.tf` and fail on any `infra/**/*.tf.json`;
- `aws_cloudformation_stack`, which can create anything.

A recommendation beyond INFRA-17: also fail on `aws_iam_policy_attachment`. It is not inline. It attaches a managed policy exclusively, so it detaches that policy from every other user, role and group in the account, the operator's own identity included. `[ASSUMED]` from long-standing provider behaviour. Use `aws_iam_role_policy_attachment` and `aws_iam_user_policy_attachment`.

A useful positive control: `aws_iam_role_policies_exclusive` with `policy_names = []` on the plan role and the deploy role, and `aws_iam_user_policies_exclusive` on the SMTP user. Terraform then removes an inline policy that someone adds by hand.

**Account inventory, read-only.** Proposed as `infra/scripts/account-inventory.sh`. It prints names and counts and no secret.

```bash
export AWS_PAGER=""; ACCT=471112560111; R=eu-north-1
aws sts get-caller-identity
aws organizations describe-organization --query 'Organization.MasterAccountId' 2>&1 | head -2
aws iam get-account-summary --query 'SummaryMap.{Users:Users,Groups:Groups,Roles:Roles,Policies:Policies,Providers:Providers}'

for u in $(aws iam list-users --query 'Users[].UserName' --output text); do
  echo "user $u inline=[$(aws iam list-user-policies --user-name "$u" --query PolicyNames --output text)]" \
       "attached=[$(aws iam list-attached-user-policies --user-name "$u" --query 'AttachedPolicies[].PolicyName' --output text)]" \
       "groups=[$(aws iam list-groups-for-user --user-name "$u" --query 'Groups[].GroupName' --output text)]" \
       "tags=[$(aws iam list-user-tags --user-name "$u" --query 'Tags[].[Key,Value]' --output text | tr '\t\n' '=,')]"
done
for g in $(aws iam list-groups --query 'Groups[].GroupName' --output text); do
  echo "group $g inline=[$(aws iam list-group-policies --group-name "$g" --query PolicyNames --output text)]"
done
for r in $(aws iam list-roles --query 'Roles[?!starts_with(Path, `/aws-service-role/`)].RoleName' --output text); do
  p=$(aws iam list-role-policies --role-name "$r" --query PolicyNames --output text); [ -n "$p" ] && echo "role $r inline=[$p]"
done

aws iam list-open-id-connect-providers
aws route53 list-hosted-zones --query 'HostedZones[].[Name,Id,Config.PrivateZone,ResourceRecordSetCount]' --output table
for reg in "$R" eu-west-1 eu-central-1 us-east-1; do
  echo "== SES $reg"
  aws sesv2 get-account --region "$reg" --query '{Production:ProductionAccessEnabled,Sending:SendingEnabled,Max24h:SendQuota.Max24HourSend,Suppression:SuppressionAttributes.SuppressedReasons}'
  aws sesv2 list-email-identities --region "$reg" --query 'EmailIdentities[].[IdentityName,IdentityType,VerificationStatus]' --output table
done
aws budgets describe-budgets --account-id "$ACCT" --query 'Budgets[].[BudgetName,BudgetLimit.Amount,CalculatedSpend.ActualSpend.Amount]' --output table
aws ecr describe-repositories --region "$R" --query 'repositories[].[repositoryName,imageTagMutability]' --output table
aws s3api list-buckets --query 'Buckets[].Name' --output table
```

What each line decides:

- **Inline user policies.** INFRA-17's account half. A user tagged `InvokedBy=SESConsole` with an inline policy named `AmazonSesSendingAccess` is the legacy SES case, and AWS documents the move to a group with a managed policy. [CITED: https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html]
- **OIDC providers.** An existing GitHub provider is imported, not created.
- **Hosted zones.** An existing `staging.openvaa.org` or `openvaa.org` zone changes D-05's work.
- **SES.** Sandbox status is per region. An existing identity or suppression setting in `eu-north-1` belongs to something else and must not be overwritten.
- **Budgets.** The call also shows whether the identity can reach the Budgets API at all. An access error here means billing access is not activated for IAM identities. `[ASSUMED]`
- **`describe-organization`.** Tells a standalone account from a member account, which matters for budgets and cost tags.

The script needs an assert mode that exits non-zero when any user has an inline policy. It is run again in phase 185.

**The applying identity and INFRA-17.** With an Identity Center permission set there is no IAM user, and the rule holds if the permission set uses the AWS-managed `AdministratorAccess` and no inline policy. With an IAM user, the user needs a managed policy attached and no inline policy. The common "force MFA" policy is usually written inline and would have to be a customer-managed policy. `[ASSUMED]`

**The existing guard pattern.** [VERIFIED: `package.json:53`, `scripts/assert-auth-signup-closed.mjs`, `scripts/assert-no-candidate-app-names.mjs`]

- A guard is `scripts/assert-<name>.mjs`, a script key `"assert:<name>": "node scripts/assert-<name>.mjs"`, and a link in `lint:check`. The chain ends today with `… && yarn assert:edge-function-env && yarn assert:auth-signup-closed`.
- Node built-ins only. The closest model reads `config.toml` by lines: "It is a line-oriented read (Node built-ins only, no TOML parser): a table starts at its `[name]` header and ends at the next header". It also states why that is exact: "The configuration file holds no multi-line value".
- Exit codes: 0 holds, 1 finding or unreadable input, 2 usage error. "A configuration this guard cannot read is never reported as closed."
- The exit status is set, not forced: `process.exitCode = …`.
- Self-test, two forms. Embedded cases: a `CASES` array of texts with the expected findings, and a check that a case "tests nothing" if it equals the correct text. Or fixtures: `scripts/fixtures/assert-<name>.input.<ext>` beside `…expected.<ext>.violations`.
- Findings go to stdout, the summary to stderr.
- Gate specs live in `packages/dev-seed/tests/*Gate.test.ts`. They assert that the link is in `lint:check` and exercise the guard.
- Phase 181's ruling 181-1 gives its guard "injectable paths and a fixture so it can be seen failing without editing the real file". The two guards here should take the same shape, for example `--root <dir>` and `--config <file> --settings <file>`.

Three facts of the tree that affect the new files:

- `assert-no-candidate-app-names` scans every tracked file. Terraform comments and names must not spell the Contestant app with the word that guard forbids.
- `assert-comment-hygiene` scans `const SCAN_ROOTS = ['apps', 'packages', 'tests'];`. It does not read `infra/` or `scripts/`. [VERIFIED: `scripts/assert-comment-hygiene.mjs:193-196`] The comment rules of `CLAUDE.md` should still be followed there, because the repository is public: no `.planning/` paths and no decision ids in comments.
- `lint:check` is a long `&&` chain. A red early link hides every later one. The new links belong at the end, and a red control must be read from the guard's own line in the output, with the exit status read directly.

**Confidence:** HIGH for the resource list and the pattern. MEDIUM for the inventory commands, which were not run.

### Q6. Delegating `staging.openvaa.org` from Cloudflare

**Observed today.** `openvaa.org` has the name servers `dora.ns.cloudflare.com.` and `ganz.ns.cloudflare.com.`. It has no `DS` and no `DNSKEY` record, so the zone is not signed. `staging.openvaa.org` and names under it answer `NXDOMAIN`. The zone's SOA carries a negative-cache time of 1800 s. `openvaa.org` has no `CAA` record. [VERIFIED: `dig @1.1.1.1`, 2026-10-11T20:07Z]

**What the operator enters.** "Create `NS` records for the subdomain", one per name server. The page is marked available on Free, Pro, Business and Enterprise. [CITED: https://developers.cloudflare.com/dns/manage-dns-records/how-to/subdomains-outside-cloudflare/index.md, last updated 2026-08-14]

| Type | Name | Content |
|------|------|---------|
| NS | `staging` | `ns-….awsdns-….com` |
| NS | `staging` | `ns-….awsdns-….net` |
| NS | `staging` | `ns-….awsdns-….org` |
| NS | `staging` | `ns-….awsdns-….co.uk` |

The four values are the `name_servers` output of the zone. An NS record has no proxy switch.

**Limits stated by Cloudflare.**

- "DNS delegation is not possible for Cloudflare domains using a CNAME setup (partial)". The zone uses Cloudflare's name servers, so it is a full setup.
- "Cloudflare supports up to 10 NS records per delegation name, but the best practice is to keep the set at seven or fewer." Route 53 gives four.
- "Cloudflare's CDN and security services are not applied to delegated subdomains."
- A `DS` record is needed only "if the delegated nameserver has DNSSEC enabled". Neither side is signed, so none is added.
- No glue is needed, because the Route 53 name servers are outside the delegated zone.
- Records left at or under the name become shadowed, and "no error is returned". [CITED: https://developers.cloudflare.com/dns/manage-dns-records/reference/shadowed-records/index.md] This is why D-05 has the operator remove them. Today there are none in public DNS.

**Verifying from outside.** The agent can run these, since they need no credential:

```bash
dig +norecurse NS staging.openvaa.org @dora.ns.cloudflare.com   # referral: four awsdns names in AUTHORITY, no "aa" flag
dig +short NS  staging.openvaa.org @1.1.1.1                     # the same four names
dig +short SOA staging.openvaa.org @1.1.1.1                     # an awsdns server and awsdns-hostmaster.amazon.com
dig +trace SOA staging.openvaa.org | tail -8
```

The first command answers at once. A public resolver that cached the `NXDOMAIN` can keep it for up to 30 minutes.

**Order.** The SES identity cannot verify until the DKIM records resolve in public, so the delegation comes before the verification. SES looks for the records for up to 72 hours.

**For INFRA-18's record.** Write down the four NS records added, the date, that no record at or under `staging` existed (with the `NXDOMAIN` observation above and the operator's look at the dashboard), and that no `DS` record was added.

**Confidence:** HIGH for the observed DNS state. MEDIUM for the Cloudflare steps, which are documented and not performed.

### Q7. SES in `eu-north-1`

**Identity and Easy DKIM.** `aws_sesv2_email_identity` with `email_identity = "staging.openvaa.org"`. It exports `dkim_signing_attributes[0].tokens`, `verification_status` and `verified_for_sending_status`. Easy DKIM uses a 2048-bit key by default. [CITED: provider doc `sesv2_email_identity.html.markdown` at `v6.68.0`; https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html]

**The CNAME target is not a constant.** "Each CNAME record's value is composed of the DKIM token followed by a hosted zone domain (for example, token.dkim.us-west-2.amazonses.com). The hosted zone portion varies by AWS Region and identity. You can retrieve the hosted zone directly from the API response. Both the CreateEmailIdentity and GetEmailIdentity responses include a SigningHostedZone field in the DkimAttributes object." [CITED: https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html] The resource does not export that field: its source at `v6.68.0` holds `tokens` and nothing named `hosted_zone`. [VERIFIED: `internal/service/sesv2/email_identity.go`] So the module takes the zone as a variable with the default `dkim.amazonses.com`, and the runbook checks it right after the first apply, before the delegation:

```bash
aws sesv2 get-email-identity --region eu-north-1 --email-identity staging.openvaa.org \
  --query '{verified:VerifiedForSendingStatus,dkim:DkimAttributes.Status,zone:DkimAttributes.SigningHostedZone,tokens:DkimAttributes.Tokens,mailFrom:MailFromAttributes.MailFromDomainStatus}'
```

A different `zone` is corrected in tfvars and applied again. The record name is `<token>._domainkey.staging.openvaa.org`, with no leading underscore on the token.

**Custom MAIL FROM.** `aws_sesv2_email_identity_mail_from_attributes` with `mail_from_domain` and `behavior_on_mx_failure` (`USE_DEFAULT_VALUE` or `REJECT_MESSAGE`). The MAIL FROM domain "has to be a subdomain of the parent domain of a verified identity", and "shouldn't be a subdomain that you also use to send email from" or to receive mail on. Records:

| Name | Type | Value |
|------|------|-------|
| `mail.staging.openvaa.org` | MX | `10 feedback-smtp.eu-north-1.amazonses.com` |
| `mail.staging.openvaa.org` | TXT | `"v=spf1 include:amazonses.com ~all"` |

"you must publish exactly one MX record". SES tries to detect it for 72 hours. [CITED: https://docs.aws.amazon.com/ses/latest/dg/mail-from.html] `mail` is my proposed label. I recommend `REJECT_MESSAGE`: with the fallback, a broken MAIL FROM is silent, because DKIM alone still passes DMARC.

**DMARC.** Name `_dmarc.staging.openvaa.org`, type TXT. Without a report address: `"v=DMARC1; p=quarantine"`. With one: `"v=DMARC1; p=quarantine; rua=mailto:<address>"`. SPF alignment with SES needs relaxed mode, which is the default when `aspf` is absent. [CITED: https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html] With the From address `noreply@staging.openvaa.org`, DKIM signs for `staging.openvaa.org` and the MAIL FROM is a subdomain of it, so both checks align. `[ASSUMED]` until phase 184 reads a received header.

**An option for the report mailbox.** The organisation already publishes `_dmarc.openvaa.org` as `"v=DMARC1; p=none; rua=mailto:dmarc_agg@vali.email;"`, and the receiving side already authorises reports for the subdomain: `staging.openvaa.org._report._dmarc.vali.email` answers `"v=DMARC1;"`. [VERIFIED: `dig`, 2026-10-11] The operator can reuse that address, name another, or have none. A record at `_dmarc.staging.openvaa.org` takes the place of the organisation's `p=none` for the subdomain. `[ASSUMED]` from the DMARC specification.

**SMTP credentials.** "The credentials that you use to send email through the SES SMTP interface are unique to each AWS Region." The user name is the access key id. The password is derived from the secret key: HMAC-SHA256 chained over `"11111111"`, the region, `"ses"`, `"aws4_request"` and `"SendRawEmail"`, with the version byte `0x04` in front, then Base64. "Don't use temporary AWS credentials to derive SMTP credentials." AWS's example conversion script lists `"eu-north-1",  # Europe (Stockholm)` among its SMTP regions. [CITED: https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html]

In Terraform this is `aws_iam_access_key.ses_smtp_password_v4`. Its documentation lists six "valid Provider regions" and `eu-north-1` is not among them. The code applies no such list: `sesSMTPPasswordFromSecretKeySigV4(createResp.AccessKey.SecretAccessKey, meta.(*conns.AWSClient).Region(ctx))` runs the same chain with the provider's region. [VERIFIED: `internal/service/iam/access_key.go` at `v6.68.0`] The `dns-mail` root's provider region must therefore be `eu-north-1`.

**Where the secret lands.** "`secret` … Note that this will be written to the state file." The same holds for `ses_smtp_password_v4`. [CITED: provider doc `iam_access_key.html.markdown`] The `dns-mail` state holds both in clear text. It sits under the `hand/` prefix that the plan role is denied.

**Endpoint and ports.** `email-smtp.eu-north-1.amazonaws.com`. STARTTLS on 25, 587 and 2587. TLS wrapper on 465 and 2465. "The Amazon SES SMTP endpoint requires that all connections be encrypted". [CITED: https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html] The port for the Edge Functions is measured in phase 184.

**The send permission, as a customer-managed policy.** AWS's example is `ses:SendRawEmail` on `*`. A narrower form:

```hcl
data "aws_iam_policy_document" "ses_send" {
  statement {
    effect    = "Allow"
    actions   = ["ses:SendRawEmail"]
    resources = [aws_sesv2_email_identity.this.arn]
    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = ["noreply@${var.domain}"]
    }
  }
}

resource "aws_iam_policy" "ses_send" {
  name   = "${var.name_prefix}-ses-send"
  path   = var.iam_path
  policy = data.aws_iam_policy_document.ses_send.json
}

resource "aws_iam_user_policy_attachment" "ses_send" {
  user       = aws_iam_user.smtp.name
  policy_arn = aws_iam_policy.ses_send.arn
}
```

That SES authorises an SMTP send against the identity ARN with this condition was not run. `[ASSUMED]` If phase 184's first send is refused, the fallback is `resources = ["*"]` with the condition kept.

**Sandbox.** Per region. Mail "to verified email addresses and domains, or to the Amazon SES mailbox simulator". "a maximum of 200 messages per 24-hour period". "a maximum of 1 message per second". [CITED: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html] The operator's mailbox is verified by hand (`aws sesv2 create-email-identity --email-identity <address>` and the link in the mail), outside Terraform, so a personal address does not enter the repository.

**The production-access request.** It asks for: mail type (Marketing or Transactional), website URL, up to four additional contact addresses, contact language (English or Japanese), and an acknowledgement "that you agree to only send email to individuals who've explicitly requested it and confirm that you have a process in place for handling bounce and complaint notifications". "The AWS Support team provides an initial response to your request within 24 hours." "verifying your domain with SES before requesting production access is a best practice". The CLI form:

```bash
aws sesv2 put-account-details --region eu-north-1 \
  --production-access-enabled --mail-type TRANSACTIONAL \
  --website-url https://openvaa.org \
  --additional-contact-email-addresses <address> --contact-language EN
```

Suggested inputs: Transactional. For the website, the organisation's site, because `staging.openvaa.org` serves nothing until phase 185. If Support asks for more, the figures of D-06 are about 100 a day and a peak of 2000 a day, the mail is sign-in links for invited people and password recovery, and bounces and complaints go to the account suppression list. To make that last sentence true in code, `dns-mail` can hold `aws_sesv2_account_suppression_attributes` with `suppressed_reasons = ["BOUNCE", "COMPLAINT"]`. It is an account-and-region setting, so the inventory checks first that nothing else relies on it.

**An early check the operator can make in the sandbox.** After the identity verifies and the operator's own mailbox is verified, one mail through SMTP shows that the derived password and the policy work, weeks before phase 184:

```bash
curl --ssl-reqd --url smtp://email-smtp.eu-north-1.amazonaws.com:587 \
  --user "$SMTP_USER:$SMTP_PASS" --mail-from noreply@staging.openvaa.org \
  --mail-rcpt "$MY_VERIFIED_ADDRESS" --upload-file mail.txt
```

It is optional. SUPA-14 still closes in phase 184.

**Confidence:** MEDIUM. The record formats and limits are quoted. The DKIM hosted zone for this identity, the policy scope and the alignment are unobserved.

### Q8. `aws_budgets_budget`

Arguments: `budget_type = "COST"`, `time_unit = "MONTHLY"`, `limit_amount`, `limit_unit = "USD"`, and one `notification` block per alert with `comparison_operator`, `threshold`, `threshold_type` (`PERCENTAGE` or `ABSOLUTE_VALUE`), `notification_type` (`ACTUAL` or `FORECASTED`) and `subscriber_email_addresses`. `cost_types` defaults include `include_credit = true` and `include_refund = true`. [CITED: provider doc `budgets_budget.html.markdown` at `v6.68.0`]

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "${var.name_prefix}-monthly"
  budget_type  = "COST"
  time_unit    = "MONTHLY"
  limit_amount = tostring(var.budget_limit_usd)
  limit_unit   = "USD"

  cost_types {
    include_credit = false
    include_refund = false
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
```

**What makes it fire at 1 USD, and what does not.** [CITED: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html and budgets-managing-costs.html]

- "AWS Budgets information is updated up to three times a day. Updates typically occur 8–12 hours after the previous update." The mail is not immediate.
- The actual alert fires when month-to-date cost passes 0.80 USD. In an account with no spend it does not fire.
- "AWS requires approximately 5 weeks of usage data to generate budget forecasts. If you set a budget to alert based on a forecasted amount, this budget alert isn't triggered until you have enough historical usage information." In a quiet account the forecast alert cannot be seen now.
- "Actual alerts are only sent out once per budget, per budget period, when a budget first reached the actual alert threshold."
- "Budget alerts can be sent to up to 10 email addresses and one Amazon SNS topic per alert."

**How the plan handles this.**

1. After the first apply, read the spend the budget itself computed: `aws budgets describe-budget --account-id 471112560111 --budget-name <name> --query 'Budget.CalculatedSpend.ActualSpend.Amount'`.
2. If it is below 0.80, the test amount is a variable given on the command line, set so that 80 % of it is below the observed spend. The hosted zone adds 0.50 USD once it is billed. `[ASSUMED]` for the price.
3. Record which alert arrived. If only the actual one did, the record says that the forecast alert is configured and unseen, with the reason quoted above.
4. When the limit is raised to 100, replace the budget so its alert state is new: `terraform apply -replace=<address>`. Whether an alert that fired at 1 USD fires again in the same month after an in-place raise is not documented. `[ASSUMED]`

**Credits.** With the default `include_credit = true`, credits are netted against cost. An account that runs on credits shows a spend near zero and the alarm stays silent. The example above excludes credits and refunds, so the alarm follows usage. This is a question for the operator.

**The address.** See amendment 10. A variable with no default, given per session, keeps a personal address out of the repository. It is still written to the bootstrap state.

**Confidence:** MEDIUM for the resource. The firing behaviour is quoted and not seen.

### Q9. The `infra-validate` job

**How `main.yaml` is organised today.** [VERIFIED: `.github/workflows/main.yaml`, read in full]

- Triggers: `push` to `main` and to `"ci-evidence/**"`, and `pull_request` into `main`, each with `paths-ignore` for `"**.md"` and the two `.env.example` patterns.
- Twelve jobs, each on `ubuntu-latest`, each beginning with `uses: actions/checkout@v7`: `skill-drift-check`, `secret-scan`, `frontend-and-shared-module-validation`, `docker-image-build`, `supabase-tests`, `sql-lint`, `dependency-audit`, `dev-seed-integration`, `supabase-types-drift`, `e2e-tests`, `e2e-visual`, `node-engine-range-negative-control`.
- Actions are pinned by tag: `actions/checkout@v7`, `actions/setup-node@v7`, `threeal/setup-yarn-action@v2`, `supabase/setup-cli@v3`, `dorny/paths-filter@v4`, `actions/upload-artifact@v7`, `trufflesecurity/trufflehog@v3.97.9`.
- Each job has a comment block above it that says why it exists and what it must not gain.
- Tests in `packages/dev-seed/tests/` read this file as text. `ciDockerImageBuildGate.test.ts` slices one job from its key to the next job key and asserts `expect(uses).toEqual(['actions/checkout@v7'])` for `docker-image-build` only. `nodeEngineGate.test.ts` slices its job "from its key down to the next top-level job key, or to the end of the file". A new job placed anywhere is safe for both. No test asserts that all `checkout` pins agree. [VERIFIED: `grep` over `packages/dev-seed/tests`]

**The job.**

```yaml
  # Formats and validates every Terraform root under infra/. It holds no credentials: `init
  # -backend=false` reads no state, and `validate` calls no cloud API.
  infra-validate:
    runs-on: ubuntu-latest
    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v7

      - name: "Setup Terraform 1.16.5"
        uses: hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e # v4.0.1
        with:
          terraform_version: 1.16.5
          terraform_wrapper: false

      - name: "Check Terraform formatting"
        run: terraform fmt -check -recursive -diff infra

      - name: "Validate every root"
        run: |
          set -euo pipefail
          for root in infra/bootstrap infra/envs/*/*/; do
            echo "::group::$root"
            terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly
            terraform -chdir="$root" validate -no-color
            echo "::endgroup::"
          done
```

Notes for the plan:

- **`-lockfile=readonly`** makes the job fail when a committed `.terraform.lock.hcl` lacks the Linux hashes. The lock files are written once with `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64 -platform=darwin_amd64`, which needs no credentials. `[ASSUMED]` for the exact failure text.
- **The glob lists the roots**, so a root added later is validated without an edit. A step that fails when the glob matches fewer than the expected roots guards against an empty loop that passes.
- **`checkout`.** D-16 leaves existing actions on their tags. Whether a new `uses: actions/checkout` line in a new job is "an action this milestone adds" is a reading. The tag `v7` points today at commit `3d3c42e5aac5ba805825da76410c181273ba90b1`. [VERIFIED: GitHub git refs API] Pinning the new line by that SHA costs nothing and matches the intent of 183-15. The plan should state the reading it takes.
- **Dependabot** already has a `github-actions` entry with `open-pull-requests-limit: 0`, so it raises security updates only. [VERIFIED: `.github/dependabot.yml`]
- **Optional OpenTofu leg.** One more step with `opentofu/setup-opentofu@a1320f892987e89d278cc92dc5adc984fb93aca4 # v2.0.2`, then `tofu init -backend=false` and `tofu validate` per root. It turns "kept OpenTofu-compatible" (DOCS-01) into a thing a run shows.
- **Seeing it pass, and fail.** A run exists only for a `ci-evidence/**` push or a pull request into `main`. The project's practice is a squashed, source-only commit without `.planning/` pushed to a `ci-evidence/<name>` branch. A second evidence commit with one badly formatted `.tf` line shows the job red. Read the job's own result, not the run's: the run can be red for the two E2E jobs.

**Confidence:** HIGH for the file's organisation. MEDIUM for the job, which was not run.

### Q10. Layout

```
infra/
├── README.md                     # what each root is, who applies it, the order
├── .terraform-version            # 1.16.5
├── bootstrap/                    # root, hand-applied, state key hand/bootstrap/…
│   ├── backend.tf                # literal S3 block
│   ├── versions.tf               # required_version, aws provider
│   ├── providers.tf              # region, default_tags
│   ├── main.tf                   # calls the four modules below
│   ├── variables.tf  outputs.tf
│   ├── terraform.tfvars          # tracked, non-secret
│   └── .terraform.lock.hcl       # tracked
├── modules/
│   ├── state-bucket/             # bucket and its five hardening resources
│   ├── github-oidc/              # provider, plan role, deploy role, their policies and attachments
│   ├── registry/                 # ECR repository, lifecycle policy
│   ├── budget/                   # aws_budgets_budget
│   ├── dns-zone/                 # aws_route53_zone, name_servers output
│   ├── mail-ses/                 # identity, MAIL FROM, DNS records, SMTP user, send policy
│   └── supabase/                 # supabase_project, supabase_settings, hosted-settings.json
├── envs/
│   ├── staging/
│   │   ├── dns-mail/             # root, key hand/staging/dns-mail/…
│   │   ├── supabase/             # root, key hand/staging/supabase/…
│   │   └── aws/                  # root, key pipeline/staging/aws/…; no resources until phase 185
│   ├── example/
│   │   ├── dns-mail/  supabase/  aws/    # same wiring, placeholder values, never applied
│   └── scratch/
│       └── supabase/             # throwaway project, local state (D-12); removed after phase 184
└── scripts/
    ├── account-inventory.sh      # Q5
    └── README.md                 # the runbook, or a pointer to it
```

Points of the layout:

- **A module is cut where a thing is created once and used with different values.** `bootstrap` is one root for the account, not one per environment. A forker edits its tfvars.
- **`staging/aws` exists now and is empty of resources.** It gives `infra-validate` and the deny policy a real root and key, and phase 185 fills it.
- **`example` roots carry placeholder values that validate.** A backend bucket named `REPLACE-ME` is never read, because CI uses `-backend=false`.
- **The scratch root** uses the same `supabase` module as staging, with a local backend. That is what makes the rehearsal "the exact import the persistent project gets".
- **Directory names to avoid.** The root `.gitignore` ignores `build/`, `dist/`, `target/`, `vendor/` and `tmp/` at any depth. [VERIFIED: `.gitignore:96-109`] A module with one of those names would be ignored in silence.
- **`infra/` stays out of the image.** The Dockerfile has `COPY apps apps`, `COPY packages packages`, `COPY scripts scripts`. [VERIFIED: `apps/frontend/Dockerfile:14-20`] It is still inside the Docker build context, and `.dockerignore` holds only `**/node_modules` and `**/build`. A local `docker build` would upload several hundred megabytes of provider binaries from `infra/**/.terraform/`. Adding `infra` to `.dockerignore` avoids that. `[ASSUMED]` for the size.
- **Prettier** runs `prettier --check .`. It checks the JSON file and the Markdown under `infra/`. It has no parser for `.tf`, `.tfvars` or `.hcl` and skips them. `[ASSUMED]` The JSON file must be Prettier-clean.

**Registry.**

```hcl
resource "aws_ecr_repository" "frontend" {
  name                 = var.repository_name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }
}
```

`image_tag_mutability` "Must be one of: `MUTABLE`, `IMMUTABLE`, `IMMUTABLE_WITH_EXCLUSION`, or `MUTABLE_WITH_EXCLUSION`. Defaults to `MUTABLE`." [CITED: provider doc `ecr_repository.html.markdown` at `v6.68.0`] The refusal of a second push of one tag is seen in phase 185. Read-back now: `aws ecr describe-repositories --query 'repositories[].imageTagMutability'`.

**Default tags.**

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "openvaa"
      Environment = var.environment   # "shared" in bootstrap
      Root        = var.root_name     # "bootstrap", "dns-mail", "aws"
      ManagedBy   = "terraform"
    }
  }
}
```

A tag appears in cost reports only after it is activated as a cost allocation tag in the Billing console, and activation can take a day. `[ASSUMED]` INFRA-13 closes in phase 185. The plan here only notes the step. `aws_ce_cost_allocation_tag` exists in the provider, and whether a member account may use it depends on the organisation.

**Confidence:** MEDIUM. The layout is a proposal inside D-01's discretion.

### Q11. `.gitignore`

The standard template ignores `*.tfvars` and `*.tfvars.json`. [CITED: https://raw.githubusercontent.com/github/gitignore/main/Terraform.gitignore] D-01 keeps tfvars tracked, so the entries are these:

```gitignore
# Terraform (infra/). State and plan files hold secrets in clear text.
.terraform/
*.tfstate
*.tfstate.*
.terraform.tfstate.lock.info
crash.log
crash.*.log
*.tfplan
tfplan
tfplan.*
# Local or secret variable files. `terraform.tfvars` in each root is tracked on purpose and holds no secret.
*.auto.tfvars
*.auto.tfvars.json
*.local.tfvars
*.secret.tfvars
# Local overrides, including the backend override of the first bootstrap apply.
override.tf
override.tf.json
*_override.tf
*_override.tf.json
.terraformrc
terraform.rc
```

- **`.terraform.lock.hcl` is tracked.** No pattern above matches it.
- **`*.log` and `.env.*` are ignored already.** [VERIFIED: `.gitignore:84,106`]
- **Checks for criterion 1**, runnable by the agent with no credentials:

```bash
git check-ignore -v infra/bootstrap/terraform.tfstate infra/bootstrap/.terraform/x \
  infra/bootstrap/tfplan infra/bootstrap/secrets.auto.tfvars infra/bootstrap/backend_override.tf
git check-ignore -v infra/bootstrap/terraform.tfvars infra/bootstrap/.terraform.lock.hcl; echo "exit=$?"   # exit 1: not ignored
```

- **"From the phase's first commit"** means the ignore entries land in the commit that creates `infra/`, or before it.
- **Prettier** reads `.gitignore` as an ignore file by default, so `.terraform/` is skipped by `format:check` too. `[ASSUMED]`

**Confidence:** HIGH.

### Q12. Operator checkpoints, in order

Each row is a point where the plan stops for the operator. "Returns" lists only non-secret output. The agent runs everything else.

**Before wave A (agent only):** ignore entries; layout, modules and roots; both guards with self-tests and red controls; `terraform fmt` and `validate` locally; the `infra-validate` job; the runbook.

**Wave A**

| # | The operator does | Returns to the agent |
|---|-------------------|---------------------|
| A1 | Names the applying identity. Installs Terraform 1.16.5. Answers the open questions below. | `terraform version`. `aws sts get-caller-identity` (account and ARN). The kind of identity. |
| A2 | Runs `infra/scripts/account-inventory.sh`. Converts or removes any inline user policy, then runs the assert mode. | The script's full output, twice if anything was converted. The assert mode's exit status. |
| A3 | Applies `bootstrap` with local state at the test budget amount, migrates the state, deletes the local files, plans again. | The "Apply complete" line. `terraform output`. The `-migrate-state` success line. The exit status of `plan -detailed-exitcode`. The five read-back outputs of Q3. The lock observation. `git status --short infra/`. |
| A4 | Applies `staging/dns-mail`. | `terraform output name_servers` and the zone id. The `get-email-identity` output of Q7, with `SigningHostedZone`. |
| A5 | Adds the four NS records at Cloudflare. Confirms in the dashboard that nothing existed at or under `staging`. | The four values entered and the time. The agent then runs the `dig` checks itself. |
| A6 | When the identity shows verified, files the production-access request and verifies their own mailbox for the sandbox. | The `get-email-identity` output showing verified. The date the request was filed. Later, the outcome. |
| A7 | Confirms that the budget mail arrived. Applies the real limit with `-replace`. | The date and subject line of the mail, and which alert it was. `describe-budget` output after the raise. |
| A8 | Pushes the evidence branch, or approves the orchestrator doing it. | Nothing. The agent reads the job results with `gh`. |

A3 to A7 overlap in time. The budget mail and the SES verification each take hours, so neither should block the next apply.

**Wave B** (needs the Supabase organisation and the token holder)

| # | The operator does | Returns to the agent |
|---|-------------------|---------------------|
| B1 | Creates the access token. Creates the throwaway project in the Pro organisation and confirms the region offered. | The project ref. The organisation slug as shown in the dashboard. The region shown. |
| B2 | In `envs/scratch/supabase`: exports the token and the password, imports the project and the settings. | The `jq` output of Q1. `terraform state show` of the project (it holds no secret after an import). |
| B3 | After the agent corrects key names and values: `plan`, `apply`, `plan -detailed-exitcode`, then `plan -destroy`. | The plan text (the password shows as "(sensitive value)"). The second plan's exit status. The refusal text and its exit status. |
| B4 | Creates the persistent Pro project and confirms the region. | The ref, the slug, the region. The agent writes them to the tracked tfvars. |
| B5 | In `envs/staging/supabase`: imports the project, applies, plans again, runs `plan -destroy` once. | The same four outputs as B3. A read of the served settings: selected non-secret fields of `GET /v1/projects/<ref>/config/auth` and `/postgrest`. |

If the API refuses to switch the hook on before its function exists (F2), B5 applies with the hook variable off and records that, and phase 184 switches it on.

**Confidence:** MEDIUM. The order follows the dependencies found above.

## Architecture Patterns

### System Architecture Diagram

```
                 operator's workstation (credentials per session, D-10)
                                   │
        ┌──────────────────────────┼───────────────────────────┬──────────────────────┐
        ▼                          ▼                           ▼                      ▼
  infra/bootstrap           envs/staging/dns-mail       envs/staging/supabase   envs/scratch/supabase
  (hand, first with         (hand)                      (hand)                  (hand, local state)
   local state)                    │                           │                      │
        │                          │                           │                      │
        ▼                          ▼                           ▼                      ▼
  S3 state bucket ◄──── state of every remote root      Supabase Management API  throwaway project
  OIDC provider         Route 53 zone ── name servers ─► Cloudflare: 4 NS records      │
  plan role, deploy     SES identity ── DKIM, MX, SPF,   (operator, by hand)     key names and API
  role, policies          DMARC records in the zone            │                 string formats
  ECR (immutable)       SMTP user + send policy ── SMTP ──────►│ (exported per          │
  budget ── mail ─► operator                 password      session)                    ▼
        │                                                       ▼          modules/supabase/hosted-settings.json
        │                                              persistent project                ▲
        │                                              (imported, prevent_destroy)       │ parsed by
        ▼                                                                                │
  role ARNs, registry URL ──► phase 185, 187              apps/supabase/supabase/config.toml ──► parity guard
                                                          staticSettings.ts (pageSize)     ──►  (lint:check)

  infra/**/*.tf ──► inline-policy guard (lint:check) ──► red on a banned resource
  infra/**      ──► infra-validate job (main.yaml)   ──► fmt -check, init -backend=false, validate
```

### Recommended Project Structure

See Q10.

### Pattern 1: A thin root over modules

**What:** A root holds a backend block, provider configuration, one or more module calls, variables and outputs. It holds no resource of its own, except in `bootstrap`, where the wiring between the modules is the content.
**When to use:** Every environment root, so that `staging` and `example` differ only in tfvars and the backend key.

### Pattern 2: Security values in data, environment values in variables

**What:** `hosted-settings.json` holds every value the parity guard compares. The module merges it with values derived from variables.

```hcl
locals {
  hosted = jsondecode(file("${path.module}/hosted-settings.json"))

  # A group that is switched by a variable is filtered key by key, which keeps each value's type.
  auth_hook       = { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }
  auth_email_rate = { for k, v in local.hosted.auth_rate_limit_email : k => v if var.smtp != null }

  auth = merge(
    local.hosted.auth,
    local.hosted.auth_rate_limits,
    local.auth_hook,
    local.auth_email_rate,
    {
      site_url       = var.public_origin
      uri_allow_list = join(",", [for p in local.hosted.redirect_callback_paths : "${var.public_origin}${p}"])
    },
  )
}

resource "supabase_settings" "this" {
  project_ref = supabase_project.this.id
  api         = jsonencode(local.hosted.api)
  auth        = jsonencode(local.auth)
}
```

**A type trap, seen this session.** I evaluated these expressions with `terraform console` on Terraform 1.14.7, with no provider, no state and no credentials. The obvious form `var.enable_access_token_hook ? local.hosted.auth_hook : {}` returned `tomap({ "hook_custom_access_token_enabled" = "true" … })`: Terraform unified the two branches into a map of strings, and the boolean became the string `"true"`. Collecting the optional groups in a list and expanding it into `merge` did the same, and gave `"rate_limit_email_sent":"100"`. The `for` filter above gave `"hook_custom_access_token_enabled":true` and `"rate_limit_email_sent":100`. `merge(a, cond ? b : null)` also kept the types. The provider decodes these keys into typed fields, so a string where a boolean belongs would be refused at apply. [VERIFIED: `terraform console`, 1.14.7, 2026-10-11] The plan should have `validate` plus one `terraform console` or `output` check that the encoded JSON holds bare booleans and numbers.

The JSON file, as a skeleton. Key names are those of Q1. Values follow the classes of Q2. The two comma-separated strings take the exact form that checkpoint B2 shows.

```json
{
  "api": {
    "db_schema": "public,graphql_public",
    "db_extra_search_path": "public,extensions",
    "max_rows": 50000
  },
  "auth": {
    "disable_signup": true,
    "mailer_autoconfirm": false,
    "external_email_enabled": true,
    "external_phone_enabled": false,
    "external_anonymous_users_enabled": false,
    "security_manual_linking_enabled": false,
    "jwt_exp": 3600,
    "refresh_token_rotation_enabled": true,
    "security_refresh_token_reuse_interval": 10,
    "password_min_length": 6,
    "password_required_characters": "",
    "mailer_secure_email_change_enabled": true,
    "security_update_password_require_reauthentication": false,
    "mailer_otp_length": 6,
    "mailer_otp_exp": 3600,
    "smtp_max_frequency": 60,
    "mfa_totp_enroll_enabled": false,
    "mfa_totp_verify_enabled": false,
    "mfa_phone_enroll_enabled": false,
    "mfa_phone_verify_enabled": false,
    "external_apple_enabled": false,
    "external_web3_solana_enabled": false
  },
  "auth_hook": {
    "hook_custom_access_token_enabled": true,
    "hook_custom_access_token_uri": "pg-functions://postgres/public/custom_access_token_hook"
  },
  "auth_rate_limits": {
    "rate_limit_otp": 30,
    "rate_limit_verify": 30,
    "rate_limit_token_refresh": 150,
    "rate_limit_anonymous_users": 30,
    "rate_limit_sms_sent": 30,
    "rate_limit_web3": 30
  },
  "auth_rate_limit_email": { "rate_limit_email_sent": 100 },
  "redirect_callback_paths": ["/api/auth/callback", "/*/api/auth/callback"]
}
```

The two `oauth_server_*` keys join `auth` if B2 shows that the API accepts them.

**Why:** `merge` lets a later map override an earlier one. If the variable-derived map could name a key the JSON owns, the guard would compare a value that is not the one applied. The guard should therefore also fail when a key name owned by the JSON appears in the module's `.tf` files.

### Pattern 3: Rehearse on the throwaway project

**What:** Import, key discovery, settings apply, second plan and the destroy refusal are all run first in `envs/scratch/supabase`.
**Why:** A misspelled key or a string the API rewrites gives no error. The rehearsal is the only place either is seen before the persistent project.

### Anti-Patterns to Avoid

- **`"${token}.dkim.amazonses.com"` as a constant.** AWS says the zone varies. Use the variable and the check of Q7.
- **`terraform_remote_state` between roots.** It needs the whole state of the other root.
- **`aws_iam_policy_attachment`.** It detaches the policy everywhere else.
- **Removing or renaming the `supabase_project` block.** `prevent_destroy` goes with it. Use a `moved` block for a rename and a `removed` block with `destroy = false` for a removal.
- **`instance_size` in the project block without having seen its imported value.** A difference triggers a compute change.
- **A secret in a tfvars file.** D-10 rejected it. Secrets arrive as `TF_VAR_…` in the shell of one session.
- **Reading a gate through a pipe.** `terraform plan -detailed-exitcode | tee` reports `tee`'s status. Capture the status first.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State locking | A lock table or a wrapper script | `use_lockfile = true` | Built in for both tools. The table is deprecated in Terraform. |
| SMTP password derivation | A script that runs the HMAC chain | `aws_iam_access_key.ses_smtp_password_v4` | The provider runs the documented algorithm with the provider's region. |
| Keeping inline policies off a role | A scheduled check | `aws_iam_role_policies_exclusive` with `policy_names = []` | Reconciles on every apply. |
| IAM policy JSON | Hand-written heredocs | `data "aws_iam_policy_document"` | Validated at plan, no quoting errors, stable formatting. |
| A TOML parser for the guard | A parser, or an npm package | The line read of `assert-auth-signup-closed.mjs` | D-14. The file holds no multi-line value. |
| Hosted settings calls | `curl` against the Management API in a script | `supabase_settings` | One writer (D-15), and a plan shows drift. |
| The DKIM records | Copying them from the console by hand | `aws_route53_record` with `for_each` over the tokens | The tokens are in state. Only the hosted zone needs the check. |

**Key insight:** In this phase the custom work is the two guards and the runbook. Everything else is a provider resource, and each hand-built substitute above would be a second writer of something a resource already owns.

## Common Pitfalls

### Pitfall 1: A misspelled settings key is accepted and never applied
**What goes wrong:** The key is not sent. State keeps it. The second plan is empty.
**Why it happens:** The provider decodes `auth` and `api` through a generated struct and Go drops unknown JSON keys.
**How to avoid:** Take key names only from the table of Q1. Let the guard check every key of the JSON file against a committed list of known keys. Read the served settings back after the apply.
**Warning signs:** A setting that the dashboard does not show although Terraform reports no change.

### Pitfall 2: The first apply after an import resets the database password
**What goes wrong:** Supabase receives a password update with whatever value the shell exported.
**Why it happens:** Import leaves `database_password` null in state.
**How to avoid:** `ignore_changes = [database_password]`, or a deliberate decision to let Terraform set it. Read the first plan on the throwaway project before deciding.
**Warning signs:** `~ database_password = (sensitive value)` in a plan.

### Pitfall 3: `prevent_destroy` is not in state
**What goes wrong:** A refactor that drops or renames the resource block plans a project deletion.
**How to avoid:** A guard assertion on the block and the argument. A runbook rule. `moved` and `removed` blocks.
**Warning signs:** "1 to destroy" in a Supabase-root plan.

### Pitfall 4: The API rewrites a string and the plan never empties
**What goes wrong:** `db_schema` or `uri_allow_list` comes back with other spacing or order.
**How to avoid:** Copy the exact form the throwaway import shows.
**Warning signs:** The same one-line diff on every plan.

### Pitfall 5: DKIM never verifies
**What goes wrong:** The CNAME targets point at the wrong hosted zone, or the delegation is not in place.
**How to avoid:** The `SigningHostedZone` check before the delegation. The `dig` checks after it.
**Warning signs:** `DkimAttributes.Status` stays `PENDING` for hours after the NS records resolve.

### Pitfall 6: The budget is applied and no mail comes
**What goes wrong:** The account has no spend, or runs on credits, or the next data update is hours away.
**How to avoid:** Read `ActualSpend` from the budget. Pick the test amount from it. Exclude credits. Treat the confirmation as a later checkpoint.
**Warning signs:** `ActualSpend` of 0 a day after the apply.

### Pitfall 7: A lock file without Linux hashes
**What goes wrong:** `infra-validate` fails on `init`, or passes locally and fails in CI.
**How to avoid:** `terraform providers lock` for the three platforms when the lock file is first written, and `-lockfile=readonly` in CI.

### Pitfall 8: A guard link that never runs
**What goes wrong:** An earlier link of `lint:check` is red, so the new guard is not reached, and the chain's status says nothing about it.
**How to avoid:** Run the guard directly as well. For the red control, find the guard's own line in the output and read the exit status without a pipe.

### Pitfall 9: An existing GitHub OIDC provider in the account
**What goes wrong:** The create fails with "already exists", half-way through the first apply.
**How to avoid:** The inventory. An `import` block when one is found.

### Pitfall 10: An in-place change of the trust policy locks the pipeline out
**What goes wrong:** After an opt-in, a rename or a transfer, the subject no longer matches.
**How to avoid:** Subjects as a variable. The id-bearing form written down beside it (Q4).

### Pitfall 11: A personal address or a secret in a tracked file
**What goes wrong:** The repository is public. `secret-scan` runs after the push.
**How to avoid:** The ignore entries first. No address or secret in tfvars. `git status` before every commit under `infra/`.

### Pitfall 12: A conditional turns booleans into strings
**What goes wrong:** `cond ? object : {}` yields a map of strings, so the settings JSON carries `"true"` and `"100"`.
**Why it happens:** Terraform unifies the two branch types. Seen with `terraform console` this session.
**How to avoid:** The `for` filter of Pattern 2, or `cond ? object : null` inside `merge`. `terraform validate` does not catch it: it reported "Success!" for the failing form.
**Warning signs:** Quoted booleans or numbers in the `auth` diff of a plan.

### Pitfall 13: Terraform 1.14.7 on the workstation
**What goes wrong:** State written by 1.16.5 in one place and an older binary in another, or `fmt` differences between versions.
**How to avoid:** `.terraform-version` and the A1 checkpoint. `[ASSUMED]` that the two versions format differently in any case that matters here.

## Code Examples

### Backend and versions of a root

```hcl
# Source: https://raw.githubusercontent.com/hashicorp/web-unified-docs/main/content/terraform/v1.16.x/docs/language/backend/s3.mdx
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }

  backend "s3" {
    bucket       = "openvaa-tfstate-471112560111"
    key          = "hand/staging/dns-mail/terraform.tfstate"
    region       = "eu-north-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

The bucket name is a proposal. An account id in the name makes it globally unique, and D-10 already tracks both.

### OIDC provider and the deploy role

```hcl
# Sources: provider doc iam_openid_connect_provider at v6.68.0; GitHub oidc-in-aws.md
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "deploy_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.deploy_subjects   # ["repo:OpenVAA/voting-advice-application:environment:staging"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "${var.name_prefix}-deploy"
  path               = var.iam_path
  assume_role_policy = data.aws_iam_policy_document.deploy_trust.json
}

resource "aws_iam_role_policy_attachment" "deploy_state" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.tfstate_staging_aws.arn
}

resource "aws_iam_role_policies_exclusive" "deploy" {
  role_name    = aws_iam_role.deploy.name
  policy_names = []
}
```

### The Supabase project block

```hcl
# Source: internal/provider/project_resource.go at v1.11.0
resource "supabase_project" "this" {
  organization_id   = var.organization_id   # the value the import shows
  name              = var.project_name
  region            = var.region
  database_password = var.database_password # sensitive, from TF_VAR_database_password

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [database_password]
  }
}
```

### The destroy refusal, with the status read directly

```bash
terraform plan -destroy -input=false -no-color > /tmp/destroy.log 2>&1; status=$?
grep -n "cannot be destroyed" /tmp/destroy.log || true
echo "exit=$status"     # expected: non-zero
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DynamoDB lock table | `use_lockfile = true` | Terraform 1.10; "deprecated" in the 1.16 docs | No table to bootstrap. |
| `thumbprint_list` for the GitHub provider | Omitted | AWS validates GitHub against its own trusted CAs | Nothing to rotate. |
| `inline_policy` and `managed_policy_arns` on `aws_iam_role` | Separate attachment resources and `*_exclusive` resources | Both arguments are marked deprecated in provider 6.68.0 | The guard bans the first. |
| `repo:ORG/REPO:…` subject for every repository | `repo:ORG@ID/REPO@ID:…` for repositories created after 2026-07-15 | 2026-07-15 | Forks differ from this repository. |
| Inline policy on SES SMTP users made in the console | Group with a managed policy | 2024-09-06 | Old users may still carry the inline policy. |

**Deprecated or outdated:**

- `supabase_project.legacy_api_keys_enabled`: marked deprecated in the provider. Do not declare it.
- `research/STACK.md`'s `required_version = "~> 1.16"` and its `hashicorp/random` for the database password: superseded by amendment 6 and by D-10.

## Assumptions Log

| # | Claim | Section | Risk if wrong | How the plan can check it |
|---|-------|---------|---------------|---------------------------|
| A1 | `ignore_changes = [database_password]` gives an empty plan on an imported project | Q1 | The plan is never empty, or the password is sent | Throwaway rehearsal, B3 |
| A2 | `plan -destroy` fails with "Instance cannot be destroyed" | Q1 | The red control greps for the wrong text | B3 |
| A3 | Two `supabase_settings` resources for one project work side by side | Q1 | The SMTP password must share the `auth` JSON and its diff is hidden | Throwaway rehearsal |
| A4 | The provider behaves the same under OpenTofu | Q1 | The documentation's compatibility statement is wrong | Optional `tofu validate` leg; a `tofu plan` is a later matter |
| A5 | OpenTofu checks `required_version` against its own version | Q3 | `>= 1.10` is looser than needed, harmless | The `tofu` leg |
| A6 | A `backend_override.tf` with a `local` block overrides the S3 block | Q3 | The first apply fails at `init` | Checkpoint A3; fallback is the two-commit route |
| A7 | Terraform holds the lock at the approval prompt | Q3 | The lock must be observed another way | A3 |
| A8 | `ReadOnlyAccess` lets a plan read what it must, and grants no `kms:Decrypt` | Q4 | Phase 187's plan fails on a missing read | Policy simulator in A3; phase 187 |
| A9 | One OIDC provider per URL per account | Q4 | None, if the inventory finds no provider | A2 |
| A10 | `aws_iam_policy_attachment` detaches the policy elsewhere | Q5 | The extra guard entry is unneeded | Provider documentation, not read this session |
| A11 | An access error from `describe-budgets` means billing access is off | Q5 | The budget apply fails for another reason | A2 |
| A12 | SES authorises an SMTP send against the identity ARN with `ses:FromAddress` | Q7 | The first mail is refused | Optional `curl` send in A6; phase 184 |
| A13 | A subdomain's own DMARC record replaces the organisation's policy for it | Q7 | Mail from the subdomain is judged by `p=none` | Phase 184 reads `Authentication-Results` |
| A14 | The hosted zone costs 0.50 USD a month and is billed within a day | Q8 | The test amount is picked wrong | `ActualSpend` read in A3 and A7 |
| A15 | An in-place raise of the limit may not re-arm a fired actual alert | Q8 | The `-replace` is unneeded | Not checkable in one month; `-replace` avoids the question |
| A16 | Prettier skips `.tf` and reads `.gitignore` | Q10, Q11 | `format:check` goes red on a Terraform file | Run `yarn format:check` after the first `infra/` commit |
| A17 | `.terraform/` under `infra/` is large enough to slow a local image build | Q10 | The `.dockerignore` entry is unneeded | `du -sh` after the first `init` |
| A18 | Cost tags need activation and that takes up to a day | Q10 | None in this phase | Phase 185 |
| A19 | The proposed rate-limit numbers suit staging | Q2 | A limit is too low or too high | Phase 184's measurement |
| A20 | `-lockfile=readonly` fails when a platform's hashes are missing | Q9 | The job passes with an incomplete lock file | The red evidence run |
| A21 | The "force MFA" policy of an IAM user is usually inline | Q5 | None, the inventory shows it either way | A2 |

## Open Questions

For the operator. The first three block wave A's first apply.

1. **Which identity applies Terraform by hand?**
   - What we know: an Identity Center permission set with `AdministratorAccess` has no IAM user and no inline policy. An IAM user needs managed policies only.
   - Recommendation: the permission set, if Identity Center is in use.

2. **May the alert address be public?**
   - What we know: a tracked tfvars file is public. D-10's tracked list does not include an address.
   - Recommendation: a role address that may be tracked, or a variable given per session.

3. **Does the account run on AWS credits?**
   - What we know: with credits included, the budget can read zero while resources run.
   - Recommendation: exclude credits and refunds, so the alarm follows usage.

4. **A mailbox for DMARC reports.**
   - What we know: `openvaa.org` already reports to `dmarc_agg@vali.email`, and that receiver already authorises `staging.openvaa.org`.
   - Recommendation: reuse it, or none. Either is one variable.

5. **Does Terraform send the database password, or only hold the variable?**
   - What we know: Q1's two options.
   - Recommendation: `ignore_changes`, so the state holds no password and nothing is reset.

6. **Has the organisation opted in to immutable OIDC subjects, and is a rename or transfer planned?**
   - What we know: neither was checked. The trust policy as ruled works only for the name-based subject.
   - Recommendation: answer before phase 187. The subject is a variable.

7. **The Supabase token.**
   - What we know: the provider needs `SUPABASE_ACCESS_TOKEN`. Whether a token can be scoped to one organisation was not verified.
   - Recommendation: a token of an account that is a member of the dedicated organisation only.

8. **Are the SMTP settings applied in wave B or in phase 184?**
   - What we know: SUPA-02 lists SMTP and closes in phase 184. The SMTP user exists after A4. The port from an Edge Function is measured in 184, and the auth service's own port is a separate choice.
   - What's unclear: whether wave B applies the SMTP keys or leaves them to 184.
   - Recommendation: write the variables now, apply them in 184 with the port it measures. Criterion 5 does not name SMTP.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Terraform | every root | ✓, wrong version | 1.14.7; 1.16.5 is ruled | Upgrade before A3. With `>= 1.10`, local `fmt` and `validate` run today. |
| OpenTofu | optional validation leg | ✗ | — | CI only, through the setup action |
| AWS CLI v2 | inventory, read-back | ✓ | 2.34.7 | — |
| `dig` | delegation checks | ✓ | 9.10.6 | — |
| `jq` | reading `terraform show -json` | ✓ | present | — |
| `gh` | reading run results | ✓ | 2.97.0 | The Actions web page |
| Node | guards | ✓ | 24.14.1 on this workstation | The repository asks for `>=24.15.0`; `yarn install` enforces it |
| AWS credentials | applies | operator only | — | None. D-10. |
| Supabase token, organisation, projects | wave B | ✗ (TBA) | — | Wave B waits. D-04. |

**Missing with no fallback:** the applying identity (blocks A3), the Supabase inputs (block wave B).

**Missing with a fallback:** Terraform 1.16.5 (upgrade), OpenTofu (CI only).

**A note on Node:** this workstation reports 24.14.1 and `package.json` has `"node": ">=24.15.0"`. The guards import only built-ins and run. `yarn lint:check` goes through `yarn`, whose install guard checks the engine, so the red control through `lint:check` needs the right Node. [VERIFIED: `node --version`; `package.json` `engines`]

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so this section applies.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node guards with `--self-test`; Vitest gate specs in `packages/dev-seed/tests/`; `terraform validate`; the `infra-validate` job |
| Config file | none new. Guards are script keys in `package.json`. |
| Quick run command | `node scripts/assert-<name>.mjs --self-test && node scripts/assert-<name>.mjs` |
| Full suite command | `yarn lint:check` (long; run it in the background and poll), then `yarn format:check`, then `yarn test:unit` |

### Success criteria, guards and the alert: what observes each, and its red control

"Who" is **A** when the agent can make the observation without credentials, **O** when only the operator can.

| # | Thing to be true | Observation | Red control | Who |
|---|------------------|-------------|-------------|-----|
| C1a | Bootstrap applied in the account and region | "Apply complete" line; `aws sts get-caller-identity` shows `471112560111` | — | O |
| C1b | State bucket encrypted, versioned, closed | The five `s3api` reads of Q3 | A plain-HTTP request is denied by the bucket policy (optional) | O |
| C1c | State locked during an apply | Second-terminal `plan` fails with the lock error while the first waits; `.tflock` exists, then is gone | The same step is the control | O |
| C1d | OIDC provider, two roles, registry with immutable tags | `terraform output`; `aws ecr describe-repositories` shows `IMMUTABLE` | The refusal of a second push is phase 185's | O |
| C1e | Second plan shows no change | `plan -detailed-exitcode` exits 0, status read directly | A changed variable gives exit 2 | O |
| C1f | Git ignores state, plan and local variable files | `git check-ignore -v` on five sample paths; exit 1 for `terraform.tfvars` and the lock file | The second command is the control | A |
| C2a | Every permission is a managed policy | The inline guard is green; `list-role-policies` and `list-user-policies` return empty for the new entities | — | A, then O |
| C2b | The repository check fails on an inline policy | `--self-test`; a gate run on a fixture root with each banned form exits 1 and names it; one run through `yarn lint:check` with a planted file | These are the red controls. The planted file is removed and the chain is seen green again. | A |
| C2c | No IAM user in the account has an inline policy | The inventory's assert mode exits 0 | A finding in the first inventory, if there is one. Otherwise the script's self-test over canned output. | O |
| C2d | The plan role's deny holds | `simulate-principal-policy` returns `explicitDeny` for a `hand/` state object and for a secret read | `allowed` for the `pipeline/` object shows the simulator is not denying everything | O |
| C3 | The budget notifies the operator | The mail, with its date and which alert it was; `describe-budget` shows the limit and both notifications | A budget whose threshold is above the spend sends nothing: the state before the test amount is chosen | O |
| C4a | The zone answers for `staging.openvaa.org` | The four `dig` commands of Q6 | Before the delegation the same commands return `NXDOMAIN` (seen 2026-10-11) | A |
| C4b | The changed records are written down | The INFRA-18 record names four NS records and the date | — | A writes, O confirms |
| C4c | SES identity verified, records published | `get-email-identity` shows verified, DKIM `SUCCESS`, MAIL FROM `SUCCESS`; `dig` for the three CNAMEs, the MX, the SPF TXT and the DMARC TXT | `PENDING` before the delegation | O for SES, A for `dig` |
| C5a | Project imported into its own root with its own state | `terraform state list` in `staging/supabase`; the state object under `hand/staging/supabase/` | — | O |
| C5b | A destroy of that root is refused | `plan -destroy` exits non-zero with the refusal text | First seen on the throwaway project | O |
| C5c | Settings applied, second plan empty | `plan -detailed-exitcode` exits 0; served settings read back equal the JSON file | A key changed in the JSON gives exit 2 | O |
| C5d | `supabase config push` is used nowhere | `git grep -n "config push" -- . ':!.planning'` returns nothing today. A guard clause over workflows, `infra/`, `scripts/` and every `package.json` keeps it so. | A planted line in a fixture | A |
| C5e | `lint:check` fails on a disagreeing security key | `--self-test`; a gate run with a fixture JSON whose `max_rows` is 49999; one run through `yarn lint:check` with the real JSON edited, then reverted | These are the red controls. One per class: A, S, D, an unclassified key, a stale table row, and `pageSize`. | A |
| C5f | `infra-validate` passes in a run | The job's result on a `ci-evidence/**` run | A second evidence commit with one misformatted line shows it red | A reads, O or orchestrator pushes |

**Observations only the operator can make:** every row marked O, the Cloudflare dashboard, the budget mail, the SES console.

**Observations left to later phases, and not to be written as fact here:** a role assumed through OIDC and a wrong subject refused (187); a second push of one tag refused (185); a mail with DKIM, SPF and DMARC passing (184); the forecast alert.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-17 | Banned IAM forms are found in `infra/**/*.tf` | guard self-test | `node scripts/assert-no-inline-iam-policies.mjs --self-test` | ❌ Wave 0 |
| INFRA-17 | The tree is clean | guard | `node scripts/assert-no-inline-iam-policies.mjs` | ❌ Wave 0 |
| INFRA-17 | The account has no user with an inline policy | operator script | `infra/scripts/account-inventory.sh --assert-no-inline-user-policies` | ❌ Wave 0 |
| SUPA-11 | Disagreement on a class A key fails | guard self-test | `node scripts/assert-hosted-settings-parity.mjs --self-test` | ❌ Wave 0 |
| SUPA-11 | An unclassified key fails | guard self-test | same | ❌ Wave 0 |
| SUPA-11 | `max_rows` agrees three ways | guard | `node scripts/assert-hosted-settings-parity.mjs` | ❌ Wave 0 |
| SUPA-11, INFRA-17 | Both links are in `lint:check` | unit | `yarn workspace @openvaa/dev-seed test:unit` (a new gate spec) | ❌ Wave 0 |
| INFRA-10, SUPA-08 | Every root is formatted and valid | smoke | `terraform fmt -check -recursive infra` and the loop of Q9 | ❌ Wave 0 |
| SUPA-08 | State and plan files are ignored | smoke | the two `git check-ignore` commands of Q11 | ✅ after the first commit |
| INFRA-15 | The budget notifies | manual only | — | operator reads a mail |
| INFRA-18 | The zone answers | smoke | the `dig` commands of Q6 | ✅ tools present |

The guard file names are proposals.

### Sampling Rate

- **Per task commit:** the two guards with `--self-test` and in gate mode; `terraform fmt -check -recursive infra`; `validate` of the roots the commit touched.
- **Per wave merge:** `yarn lint:check`, `yarn format:check`, `yarn test:unit`, each with its exit status read directly.
- **Phase gate:** the table above complete, with a date beside every O row.

### Wave 0 Gaps

- [ ] `scripts/assert-no-inline-iam-policies.mjs` with fixtures or embedded cases — INFRA-17
- [ ] `scripts/assert-hosted-settings-parity.mjs` with fixtures or embedded cases — SUPA-11
- [ ] `infra/modules/supabase/hosted-settings.json` — the hosted side the second guard reads
- [ ] A gate spec in `packages/dev-seed/tests/` for the two new links
- [ ] `infra/scripts/account-inventory.sh` with an assert mode and a self-test over canned output
- [ ] The `.gitignore` entries, before any `terraform init`
- [ ] The `infra-validate` job
- [ ] Terraform 1.16.5 on the operator's workstation

The local E2E suite is not part of this phase's gate. The phase changes no application code, and the roadmap's cardinal-rule clause names phases 181 and 182.

## Security Domain

`security_enforcement` is absent from the configuration, so this section applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OIDC federation for CI, no stored AWS keys. The operator's identity with MFA or Identity Center. Hosted auth settings: sign-up closed, confirmations on. |
| V3 Session Management | partly | `jwt_exp`, refresh rotation and reuse interval in the hosted settings, guarded for parity. |
| V4 Access Control | yes | Managed policies, one per concern. An allow-list for the deploy role's state key. An explicit deny for the plan role. Trust policies with exact matches. |
| V5 Input Validation | partly | The guards treat an unreadable or unclassified input as a failure. |
| V6 Cryptography | yes | SSE-S3 on the state bucket, TLS-only bucket policy, Easy DKIM with 2048-bit keys. Nothing hand-rolled. |
| V14 Configuration | yes | Settings as code with one writer. The parity guard. Ignore entries for state and plan files. Actions pinned by SHA. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A workflow in another repository or on another branch assumes the deploy role | Spoofing, Elevation | Exact `aud` and `sub`. The environment in the subject. Optionally `repository_id` and `repository_owner_id`. |
| A recycled organisation or repository name claims the old subject | Spoofing | The immutable ids of Q4. |
| A secret read from Terraform state | Information disclosure | Private, encrypted, versioned bucket. The `hand/` prefix denied to the plan role and absent from the deploy role's allow-list. No plan uploaded as an artifact. |
| A state or plan file committed to a public repository | Information disclosure | Ignore entries from the first commit. `secret-scan` as a backstop. |
| The hosted project deleted through Terraform | Tampering, Denial of service | `prevent_destroy`, the guard assertion on the block, the runbook rule, a separate root that the pipeline cannot reach. |
| A hosted auth setting weaker than the tested local one | Elevation | The parity guard, and phase 184's probe for what is served. |
| An open redirect through the allowlist | Spoofing | Two entries built from the origin and two fixed suffixes. The guard refuses a host wildcard, `**`, and a trailing `*`. |
| Mail spoofed from the staging domain | Spoofing | DKIM, SPF on the MAIL FROM domain, DMARC `p=quarantine`. |
| A compromised action tag in a workflow | Tampering | Pin by commit SHA for what this milestone adds. `infra-validate` holds no credentials. |
| The SMTP key used to send as another address | Spoofing | A send policy scoped to the identity and the From address. |
| A managed policy detached account-wide by an exclusive attachment | Denial of service | Do not use `aws_iam_policy_attachment`. |

## Sources

### Primary (HIGH confidence)

Read this session, in the worktree at `03d3c2c40`:

- `apps/supabase/supabase/config.toml` (whole file); `packages/app-shared/src/settings/staticSettings.ts`; `.github/workflows/main.yaml` (whole file); `package.json`; `.gitignore`; `.prettierignore`; `.dockerignore`; `apps/frontend/Dockerfile`; `scripts/assert-auth-signup-closed.mjs`; `scripts/assert-no-candidate-app-names.mjs`; `scripts/assert-comment-hygiene.mjs` (scan roots); `.github/dependabot.yml`; `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` and `nodeEngineGate.test.ts` (job slicing); `CLAUDE.md`; `.agents/code-review-checklist.md`.

Source code at pinned tags:

- `supabase/terraform-provider-supabase` `v1.11.0`: `internal/provider/project_resource.go`, `settings_resource.go`, `project_resource_test.go`, `go.mod`, `terraform-registry-manifest.json`, `docs/`.
- `supabase/cli` `pkg/v1.2.3`: `pkg/api/types.gen.go`. `supabase/cli` `v2.118.0`: `apps/cli-go/pkg/config/auth.go`, `api.go`.
- `hashicorp/terraform-provider-aws` `v6.68.0`: `internal/service/iam/access_key.go`, `internal/service/sesv2/email_identity.go`, and the resource documents named in the text.

Registries and public records, 2026-10-11:

- GitHub Releases and git refs APIs for `hashicorp/terraform`, `hashicorp/terraform-provider-aws`, `supabase/terraform-provider-supabase`, `hashicorp/setup-terraform`, `opentofu/opentofu`, `opentofu/setup-opentofu`, `actions/checkout`.
- `registry.terraform.io` and `registry.opentofu.org` provider endpoints.
- `api.github.com/repos/OpenVAA/voting-advice-application` (creation date and ids).
- Public DNS through `dig @1.1.1.1` for `openvaa.org`, `staging.openvaa.org` and the DMARC names.

### Secondary (MEDIUM confidence)

Official documentation read this session:

- Terraform: S3 backend, `init`, `lifecycle`, remote state data (`hashicorp/web-unified-docs`, `v1.16.x`).
- OpenTofu: S3 backend (`opentofu/opentofu`, `v1.13.1`).
- GitHub: `oidc.md`, `oidc-in-aws.md` (`github/docs`, `main`).
- AWS IAM: quotas; condition context keys.
- AWS SES: SMTP credentials; SMTP endpoints; production access; custom MAIL FROM; Easy DKIM; creating identities; DMARC.
- AWS Cost Management: budgets best practices; managing costs with budgets.
- AWS ECR: IAM permissions for pushing an image.
- Cloudflare: delegate subdomains; shadowed records.
- Supabase: auth rate limits.
- `github/gitignore`: `Terraform.gitignore`.

### Tertiary (LOW confidence)

- Every item in the Assumptions Log.
- Project memory about the `ci-evidence/**` practice and the state of the E2E jobs in CI. It was written in earlier sessions and not re-observed.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH. Versions and SHAs come from registries read today.
- Supabase provider behaviour: HIGH for what the code does, MEDIUM for what the hosted API returns.
- AWS architecture: MEDIUM. Documented and unapplied.
- Pitfalls: MEDIUM. Nine of thirteen come from source, quoted documents or a local evaluation, four from inference.
- Validation: MEDIUM. The observations are specified. None has been made.

**Tool seam:** the research-plan seam routed library questions to Context7, which is not available in this session, and `ctx7` is not installed. I read the same material from the providers' repositories at pinned tags.

**Research date:** 2026-10-11
**Valid until:** 2026-10-25 for versions and SHAs, which move weekly. 2026-11-10 for the rest.

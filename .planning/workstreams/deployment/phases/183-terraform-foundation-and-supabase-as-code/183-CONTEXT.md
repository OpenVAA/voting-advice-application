# Phase 183: Terraform Foundation and Supabase as Code - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The Terraform layout, its remote state and its access roles exist in AWS account `471112560111`, region
`eu-north-1`. A budget alarm notifies the operator. `staging.openvaa.org` is answered by a Route 53 zone and the
SES domain identity is verified. The hosted Supabase project is imported into a root of its own with
`prevent_destroy`, its API and auth settings are applied from HCL, and a parity guard compares them with
`config.toml`.

The phase closes INFRA-15, INFRA-17, INFRA-18 and SUPA-11. It builds toward INFRA-01, INFRA-10, INFRA-13,
PIPE-01, SUPA-02, SUPA-03, SUPA-08, SUPA-12 and SUPA-14. The frontend stack is phase 185; the pipeline is 187;
Edge Function secrets are 184.

All decisions below come from the operator's fill of
`.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md` on 2026-10-11. Every decision of this
phase took its ★ RECOMMENDED option. The operator's inputs are in D-17; three of them are still to be given.

</domain>

<decisions>
## Implementation Decisions

### Layout and roots

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

### DNS and mail (INFRA-18, SUPA-14)

- **D-05 (183-1):** A Route 53 zone serves `staging.openvaa.org` only. The parent zone `openvaa.org` stays
  where it is, **at Cloudflare** (operator's input). The operator adds one NS record set for `staging` there
  and removes any record at or under that name. The records changed are written down (INFRA-18).
- **D-06 (183-11):** `staging.openvaa.org` is the SES domain identity, with every record in the delegated
  zone: three DKIM CNAMEs, a custom MAIL FROM subdomain with MX and SPF, and a DMARC record with
  `p=quarantine`. The sender becomes `noreply@staging.openvaa.org`. The production-access request is filed once
  the identity shows verified. Figures for the request: about 100 mails a day expected, peak 2000 (operator's
  input). The DMARC report mailbox is not yet given (D-17); until it is, the record is written without a
  report address, and the mailbox is a variable.

### IAM and access (INFRA-17, PIPE-01)

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

### Budget (INFRA-15)

- **D-11 (183-12):** A monthly cost budget for the whole account, alerts at 80 % actual and 100 % forecast,
  mailed directly to the operator's address (no SNS topic). It is first applied at 1 USD so that it is seen
  firing, then raised to **100 USD a month** (operator's input). If the account already has spend, it fires at
  once.

### Supabase as code (SUPA-11)

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

  **Note (2026-10-18, phase 181.1):** Config as code was considered and rejected, and D-15 stands:
  Terraform's `supabase_settings` stays the only writer of hosted settings. `supabase config pull` writes
  `config.toml`, which holds local-development values. `supabase pull` writes migration history on the remote
  and needs Docker. `supabase config push` would be a second writer. `supabase config diff --exit-code` is the
  only read-only option (exit 2 on drift), and it is rejected too: the local-values `config.toml` would always
  differ from the hosted project, and the SUPA-11 guard of plan 183-10 already covers parity. Revisit it only
  if that guard proves insufficient. None of the 183 plans changes. Source: `181.1-CONTEXT.md` D-07.

### CI

- **D-16 (183-15):** The `infra-validate` job in `main.yaml` needs no credentials, formats and validates the
  Terraform, and is seen passing in a run. Actions this milestone adds are pinned by commit SHA. Existing
  actions, pinned by mutable major tags today, are left for a separate change.

### Operator inputs

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

</decisions>

<research_amendments>
## Amendments after research (2026-10-11)

`183-RESEARCH.md` found no decision overturned, but several need an amendment, and it raised questions for the
operator. Each question below is planned on its recommended answer. The operator has not ruled on them; they are
listed for the operator in `.planning/workstreams/deployment/v2.17-181-183-RESEARCH-FOLLOWUPS.md`. Where an
amendment and a decision above differ, the amendment wins.

- **A-01 (D-08):** The inline-policy guard also fails on `aws_ssoadmin_permission_set_inline_policy`. The three
  `aws_iam_*_policies_exclusive` resources attach nothing; they are allowed only with `policy_names = []`.
- **A-02 (D-06):** The hosted zone of the DKIM CNAME targets varies by region and identity, and the resource
  does not export it. It is a variable, checked against `SigningHostedZone` after the first apply.
- **A-03 (D-11):** A forecast alert needs about five weeks of usage data, and an actual alert is sent once per
  period. At 1 USD only the actual alert can be expected, only when month-to-date spend is at least 0.80 USD,
  and the mail can take a day. If the account runs on credits, the budget can read zero; the runbook has the
  operator check this first. The alert address is not written to a tracked file (the repository is public); it
  is given per session as a variable.
- **A-04 (D-10, D-12):** An import leaves no database password in state, and the first apply after it would
  send whatever the shell exported to the password-update endpoint. The project resource carries
  `ignore_changes = [database_password]`; Terraform holds the variable and never sends it.
- **A-05 (D-15):** `prevent_destroy` protects only while the resource block exists. A guard assertion checks
  that the `supabase_project` block and its `prevent_destroy` are present. `supabase_settings` is not imported
  for the persistent project; import is used on the throwaway project to learn string formats.
- **A-06 (D-13):** Setting keys are exact and a misspelled key is silently not sent. The key names are taken
  from the provider's generated client as the research lists them; the throwaway import confirms string
  formats (`db_schema`, `uri_allow_list`). `config.toml` has 64 live keys in scope, classified in the research.
- **A-07 (A6):** `required_version` is `>= 1.10`, not `~> 1.16`, so OpenTofu is not refused. Pins: Terraform
  1.16.5, `hashicorp/aws` 6.68.0, `supabase/supabase` 1.11.0, `hashicorp/setup-terraform` v4.0.1 by commit SHA.
  The operator's workstation has Terraform 1.14.7 and needs 1.16.5 before the first apply.
- **A-08 (D-07):** With `use_lockfile` a plan writes a lock object, which `ReadOnlyAccess` cannot do; the plan
  role gets that one write through a customer-managed policy. State keys are laid out as `hand/…` and
  `pipeline/…`, so the deny on other roots' state is complete by construction. The deny on secret reads means
  `staging/aws` cannot hold secret values it must refresh; this binds phases 185 and 187.
- **A-09 (D-09):** The repository was created on 2022-10-06 and keeps the name-based OIDC subject unless the
  organisation opts in to immutable subjects or the repository is renamed or transferred. Forks made after
  2026-07-15 use the id-bearing form, and the `example` environment shows it.
- **A-10 (D-16):** `main.yaml` runs only on `main`, on pull requests into `main` and on `ci-evidence/**`. The
  `infra-validate` job is seen passing through a `ci-evidence/**` push.
- **A-11 (D-01):** The standard Terraform ignore template ignores `*.tfvars`. The ignore entries are written by
  hand so that the tracked non-secret tfvars stay tracked.
- **A-12 (D-06, D-17):** Observed in public DNS on 2026-10-11: `openvaa.org` is at Cloudflare and unsigned;
  `staging.openvaa.org` and names under it answer `NXDOMAIN`, so nothing public exists at or under the name.
  The organisation already sends DMARC reports to `dmarc_agg@vali.email`, and that receiver already authorises
  `staging.openvaa.org`; the DMARC record reuses that address unless the operator says otherwise.
- **A-13 (D-04):** The SMTP settings are written in this phase and applied in phase 184 with the measured port.
- **A-14 (HCL trap):** `cond ? object : {}` turns booleans and numbers into strings and still validates. The
  settings HCL uses a `for` filter or `cond ? object : null` inside `merge`.

</research_amendments>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rulings and scope
- `.planning/workstreams/deployment/v2.17-181-183-DISCUSSION-POINTS.md` — the decisions of this phase with
  their evidence and rejected options; "Rulings as read, 2026-10-11", "Inputs only you can give" and "What you
  will do by hand in phase 183, in order" at the end
- `.planning/workstreams/deployment/v2.17-DISCUSSION-POINTS.md` § C, § D, F1 and "Rulings as read" — C2, C3,
  C4, C5, C6, C7, A1, A6 and the IAM note
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 183 — goal, five success criteria, operator
  preconditions, standing rules
- `.planning/workstreams/deployment/REQUIREMENTS.md` — INFRA-15, INFRA-17, INFRA-18, SUPA-11, and the
  build-toward ids INFRA-01, INFRA-10, INFRA-13, PIPE-01, SUPA-02, SUPA-03, SUPA-08, SUPA-12, SUPA-14; the Out
  of Scope list

### Research
- `.planning/workstreams/deployment/research/SUMMARY.md` — phase sketch and research flags (the exact
  `supabase_settings` JSON keys; the OIDC subject for repositories created after 2026-07-15; legacy against
  publishable keys)
- `.planning/workstreams/deployment/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`

### Code named by the decisions
- `apps/supabase/supabase/config.toml` — `[api]`, `[auth]`, `[auth.*]`, the three redirect entries, `max_rows`,
  `email_sent`
- `packages/app-shared/src/settings/staticSettings.ts` — `dataAdapter.pageSize`
- `.github/workflows/main.yaml` — where `infra-validate` is added; actions are pinned by major tag today
- `.gitignore` — the Terraform state, plan and local variable entries, from the phase's first commit
- `package.json` (`lint:check`) and `scripts/assert-*.mjs` — the guard family the two new guards join
- `apps/frontend/Dockerfile` — runs `COPY apps apps`, which is why `infra/` sits at the repository root

</canonical_refs>

<code_context>
## Existing Code Insights

Taken from the discussion document, whose grounding was three read-only analyses of the tree at `a5a1cf6e3`.
The orchestrator did not re-verify them; the researcher does.

### Reusable Assets
- The `assert:*` guard family in `lint:check`: Node-only scripts with self-tests. Both new guards (inline IAM
  policies, settings parity) follow it.

### Established Patterns
- No `infra/` directory exists yet. Terraform 1.16, HCL kept OpenTofu-compatible (A6).
- A premise that may be false: the research assumes an empty AWS account. The project earlier deployed on
  Render with AWS S3 and SES, so the account may already hold IAM users with inline policies, SES identities or
  an OIDC provider. The phase starts with a read-only inventory that the operator runs, and INFRA-17 needs the
  account to hold no IAM user with an inline policy, the applying identity included.

### Integration Points
- Phase 184 uses the Supabase root, the throwaway project and the SMTP credentials.
- Phase 185 applies `staging/aws` and destroys it once on purpose; `dns-mail` and `supabase` must survive.
- Phase 187 uses the OIDC roles and adds permissions to the deploy role through the hand-applied roots.

</code_context>

<specifics>
## Specific Ideas

- The operator's hand steps, in order: run the read-only inventory; convert or remove any inline user policy;
  apply `bootstrap`, migrate its state, plan again; apply `dns-mail`, copy the four name servers, enter the NS
  record set at Cloudflare; when the identity verifies, file the SES production-access request and verify their
  own mailbox for the sandbox; confirm the budget mail arrived, then apply the real limit; wave B.
- An NS record at Cloudflare for a subdomain is DNS-only by nature. Whether Cloudflare needs anything else for
  a delegated subdomain is a research question.
- Each guard and the budget alert count once seen failing or firing (standing rule).
- The operator's IAM note: write policies with care, and remember that inline user policies have a low size
  limit.
- Nothing is applied by the agent. Plans end in checkpoints where the operator applies and reports output.

</specifics>

<deferred>
## Deferred Ideas

- Re-pinning every existing action in `main.yaml` by commit SHA — a separate change.
- An SNS topic for alerts that INFRA-16 could reuse — decided against here; phase 187 decides for INFRA-16.
- The Edge Function secrets resource — phase 184.
- Moving all of `openvaa.org` to Route 53 — rejected.
- The move to publishable keys (FUT-02) — queued for right after both streams merge.

### Reviewed Todos (not folded)
The todo matcher returned only keyword matches unrelated to this phase's scope. None was folded.

</deferred>

---

*Phase: 183-Terraform Foundation and Supabase as Code*
*Context gathered: 2026-10-11*

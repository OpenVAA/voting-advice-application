# Requirements: v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay

**Defined:** 2026-10-11
**Workstream:** `deployment` (branch `feat/deployment-terraform-supabase`, phases from 181)
**Core value:** a deployer can stand up a tested OpenVAA instance on AWS and Supabase Cloud from the repository,
and every statement the project makes about a hosted deployment has been observed on one.

**Sources:** `research/FEATURES.md` (requirement groups and ids), `research/SUMMARY.md` (the fourteen resolved
disagreements D1 to D14), and `v2.17-DISCUSSION-POINTS.md` § "Rulings as read, 2026-10-11" (the operator's 28
rulings). Where this file and the research differ, this file follows the rulings. Ids from FEATURES.md keep
their numbers; ids above the FEATURES range are added by a ruling, which is named in brackets.

**Fixed inputs (F1):** AWS account `471112560111`, region `eu-north-1`; staging origin
`https://staging.openvaa.org`; SES production access requested at the start of the first cloud phase.

**Not yet given, and where each blocks:** the Supabase organisation, region and access-token holder (before the
Supabase root is applied, phase 183); a PostHog Cloud EU project, its token and a billing limit (before the relay
is verified on the stack, phase 188). Phases 181 and 182 need neither.

## v1 Requirements

### INFRA — AWS infrastructure

- [ ] **INFRA-01**: A deployer can push the production image to a registry whose tags are immutable and name the
      commit that built them.
- [ ] **INFRA-02**: The frontend runs as an ECS Fargate service behind an HTTPS application load balancer,
      written as explicit Terraform resources, in two availability zones. The task floor is a variable: 1 for
      staging, 2 for the production-shaped settings (D1).
- [ ] **INFRA-03**: The service is reached at a custom domain with a DNS-validated certificate, and HTTP is
      redirected to HTTPS.
- [ ] **INFRA-04**: A health endpoint answers without calling Supabase, and the load balancer's health check
      uses it with a start-up grace period.
- [ ] **INFRA-05**: Runtime configuration reaches the task as environment, with secrets from a secret store. It
      includes `PUBLIC_PROJECT_ID`. The service-role key never reaches the frontend task. A start with a required
      variable unset fails and names the variable.
- [ ] **INFRA-06**: The Node server is configured for its proxy (public origin, protocol and host headers,
      client-address header and depth), so that form posts succeed behind the load balancer and a spoofed
      forwarded address is not taken as the client's.
- [ ] **INFRA-07**: The service scales between a floor and a ceiling, and a scheduled action can raise the floor
      before a known peak.
- [ ] **INFRA-08**: Container output is collected to a durable log store with a set retention period.
- [ ] **INFRA-09**: A rollout is health-gated and rolls back by itself on failure, and a stopping task drains
      its requests. `SIGTERM` is shown to reach the Node process.
- [ ] **INFRA-10**: State is remote and locked; each environment has its own variables and outputs; the AWS stack
      can be destroyed cleanly.
- [ ] **INFRA-11**: Roles are least-privilege and only the load balancer reaches the tasks. Tasks run in public
      subnets with no NAT gateway (D2).
- [ ] **INFRA-12**: The stack is in `eu-north-1` by default, and the Supabase project's region is stated beside
      it.
- [ ] **INFRA-13**: Every resource carries cost tags, and a monthly estimate measured on the applied stack is
      documented.
- [ ] **INFRA-14**: A CDN serves the immutable build assets, and rendered HTML is never cached at the edge.
      [A2, added]
- [x] **INFRA-15**: A budget alarm notifies the operator when the account's spend passes a set threshold. [A2]
      [complete 2026-10-25 on the operator's ruling accept-console-alert of 2026-10-23 (plan 183-20): the
      actual alert was seen as triggered in the AWS Budgets console; no mail was received, so delivery to
      the operator's mailbox is not observed (WINDOWS 289)]
- [ ] **INFRA-16**: The operator is notified when a deployment fails or rolls back and when a build fails. Each
      alert is seen firing once. [A2, added]
- [x] **INFRA-17**: IAM permissions are granted through customer-managed policies where an AWS-managed policy
      does not fit; no permission depends on an inline user policy. [F1]
- [x] **INFRA-18**: A Route 53 hosted zone serves `staging.openvaa.org`, and the records the operator must
      change at the current DNS host are documented. [F1]
- [ ] **INFRA-19**: An `example` environment that a forker copies is validated and planned in CI and is never
      applied. It carries the production-shaped settings as variables. [A1]

### SUPA — Supabase project provisioning

- [x] **SUPA-01**: One command applies the schema migrations to the linked project and can be repeated safely.
- [x] **SUPA-02**: Hosted auth settings are applied from the repository by Terraform as the only writer:
      access-token hook on, site URL, the two redirect entries, public sign-up off, email confirmation on, SMTP.
      `supabase config push` is not used (C4).
- [ ] **SUPA-03**: Hosted API settings are applied from the repository, with maximum rows equal to
      `dataAdapter.pageSize`.
- [x] **SUPA-04**: The two storage buckets are created reproducibly by the migration.
- [ ] **SUPA-05**: The three Edge Functions are deployed and their secrets set from the operator's environment.
      `identity-callback`'s JWT setting is declared in `config.toml`.
- [x] **SUPA-06**: An idempotent bootstrap creates the rows a project needs (one account, one project, the
      `storage_config` row, `behind_cloudflare`) and commits no secret. `seed.sql` never reaches a hosted
      database, and a check after deploy fails if a seed user or a local URL is present.
- [x] **SUPA-07**: A conformance probe reads what the hosted project serves and fails by name. Each of its checks
      is seen failing once against a deliberately broken throwaway project.
- [ ] **SUPA-08**: The access token, database password and service-role key exist only in the pipeline's
      environment and in Terraform state. The state bucket is encrypted, versioned and closed to the public, and
      no plan is uploaded as an artifact (C7).
- [ ] **SUPA-09**: Tests run against a dedicated hosted project and never against a production one.
- [x] **SUPA-10**: The schema is deployable after its first push: the single migration is frozen as a named
      baseline at a cutover commit agreed with the v2.16 session, later changes are append-only numbered
      migrations, the parity guard enforces both, and a drift check after deploy reads its exit status directly.
      [C1]
- [x] **SUPA-11**: A guard in `lint:check` fails when the security-relevant keys of the local `config.toml` and
      the hosted settings in the HCL disagree. [A2]
- [ ] **SUPA-12**: The hosted project is created by the operator, imported into a long-lived Supabase Terraform
      root with `prevent_destroy`, and kept in a state file separate from the AWS root. A teardown of the AWS
      root leaves the database untouched. [C2, C3]
- [x] **SUPA-13**: The key model a new project issues is measured and recorded. The deployment stays on legacy
      keys if they work; the migration to publishable keys is filed to run right after both streams merge. [C5]
- [ ] **SUPA-14**: Mail is sent through SES from a verified domain identity with DKIM, SPF and DMARC. The port
      that works from a hosted Edge Function is measured and used. [C6]

### PIPE — Deploy pipeline

- [ ] **PIPE-01**: GitHub Actions reaches AWS without stored keys, through OIDC, with a read-only plan role and a
      deploy role bound to this repository and one GitHub Environment. A token with the wrong subject is seen
      refused.
- [ ] **PIPE-02**: On a pull request the Terraform is formatted, validated and planned, and the plan can be read
      in the run.
- [ ] **PIPE-03**: A pull request from a fork gets no cloud credentials, and its credentialed jobs skip visibly.
- [ ] **PIPE-04**: An apply runs only behind a GitHub Environment gate, and applies are serialised and never
      cancelled mid-run.
- [ ] **PIPE-05**: The image is built once, pushed, and deployed by digest.
- [ ] **PIPE-06**: A deploy runs in a fixed order: migrations, functions, frontend rollout, wait until stable.
- [ ] **PIPE-07**: A smoke run against the deployed URL fails the pipeline when it fails. It proves the build
      SHA and the project id, renders a voter page from hosted data, goes from questions to results, and signs
      one contestant in. It is read-mostly: no setup or teardown project, and `DEV_SEED_ALLOW_REMOTE` appears in
      no workflow (E1). The local gate suite and its preflight are unchanged.
- [ ] **PIPE-08**: A guarded destroy path removes the AWS stack and cannot reach the Supabase root.
- [ ] **PIPE-09**: One green run and one red run of the pipeline are observed and recorded, the red one from a
      deliberately broken build.
- [ ] **PIPE-10**: A push to a named per-environment branch deploys that environment; a manual dispatch and a
      `deploy-evidence/**` push also apply. A push to `main` does not deploy. [E3, F1]

### OBS — Hosted-behaviour observations

Each is run on a real project, recorded with its date, and acted on.

- [x] **OBS-01**: The served auth settings and the dashboard's names for the two switches are recorded.
- [ ] **OBS-02**: The redirect allowlist's behaviour is recorded: the single-segment pattern, the site URL's
      host on other ports, and what `/auth/v1/verify` returns when admitted and when refused.
- [ ] **OBS-03**: Whether the hosted gateway accepts a call with the anon key and no user token is recorded, and
      `account-access` works or is changed.
- [ ] **OBS-04**: The forwarded headers that reach an Edge Function, a PostgREST trigger and the frontend
      container are recorded.
- [x] **OBS-05**: Both refusing branches of `account-access`, and the release of a slot after a failed send, are
      seen on a served function.
- [ ] **OBS-06**: One invitation mail through real SMTP arrives with the correct origin and signs in. A manual
      observation, not a pipeline gate (E2).
- [ ] **OBS-07**: A read of more than 1000 rows is not truncated, and `anon` runs with an 8 s statement timeout.
- [ ] **OBS-08**: A frontend started from the template's variables alone reads from Supabase.
- [ ] **OBS-09**: The per-caller limit on the anonymous invitation operations is decided after OBS-04: built in
      this milestone if the measurement supports a design, otherwise deferred with the measurement and a date
      (A3).
- [ ] **OBS-10**: The feedback rate limit buckets by client on the hosted project with `behind_cloudflare` set
      as deployed.
- [ ] **OBS-11**: A load check of the voter journey and the relay against the deployed stack yields a recorded
      capacity figure. [A2]

### RELAY — Analytics relay

- [x] **RELAY-01**: A same-origin endpoint accepts events, answers at once, and never blocks the interface.
- [x] **RELAY-02**: The browser sends events with no third-party script and no third-party origin, and a send
      survives page unload.
- [x] **RELAY-03**: The server forwards through a provider interface chosen by configuration, with `none` as the
      default.
- [ ] **RELAY-04**: A PostHog provider captures server-side to the EU host (configurable), with no person
      profile and no client address, in batches, flushed at shutdown, failing open.
- [x] **RELAY-05**: No analytics identifier is written to the device or read from it. The `sessionStorage`
      session id leaves the tracking path. The stored consent choice is the only analytics-related state on the
      device.
- [x] **RELAY-06**: No fingerprint is computed: no hash of address and user agent, in the browser or on the
      server.
- [x] **RELAY-07**: The visitor's address and user agent stop at the relay.
- [x] **RELAY-08**: The relay accepts only a closed vocabulary of discrete events, bounds their size, and drops
      query strings from URLs (B6).
- [ ] **RELAY-09**: The endpoint resists abuse: same-origin requests only, a body-size cap, a bounded queue that
      drops when full, and no caller-chosen destination. A WAF rate rule exists as a Terraform variable, off by
      default (B8).
- [x] **RELAY-10**: The provider, its key and its host are server-side deployment configuration; whether events
      other than the server pageview are collected stays the `trackEvents` setting. With provider `none` nothing
      is sent. [reworded 2026-10-11 by ruling 182-1b]
- [x] **RELAY-11**: Consent mode is a deployment setting. Consent-gated is the default: no event other than the
      server pageview is sent before the visitor consents. Consent-free is opt-in. [B1 overruled by the B7 note]
- [x] **RELAY-12**: Tests prove the privacy properties, and each is seen failing once: no analytics identifier in
      any device store after a journey, no request to a third-party origin, nothing but the server pageview
      before consent in the default mode, and events without a prompt in consent-free mode.
- [x] **RELAY-13**: The privacy text describes the new model in all seven locales, and a visitor can object
      without anything being stored (`Sec-GPC` honoured at the relay).
- [x] **RELAY-14**: The Umami browser integration is removed.
- [x] **RELAY-15**: A simple pageview with no identifier is recorded from the server for every page view
      whenever a provider is configured, whether or not the visitor has consented and whatever `trackEvents`
      says. It carries the route, the route parameters that do not identify an entity or a nomination, and the
      duration. [B7 note; reworded 2026-10-11 by rulings 182-1 and 182-1b]
- [x] **RELAY-16**: The visit identifier is a setting with two modes: `memory` (default; held in a module
      variable, gone on reload) and `none` (a random id per event). [B3]
- [x] **RELAY-17**: In consent-free mode each event that carries an answer value has a fresh random id, so that
      no two answers, and no answer and pageview, can be linked. [B2]
- [x] **RELAY-18**: The survey link's `{sessionId}` is filled from the in-memory visit id in `memory` mode and
      is empty in `none` mode. [B4]
- [x] **RELAY-19**: The Contestant and Admin apps are tracked the same way as the voter app, and the terms of use
      say so in all seven locales. [B5]
- [x] **RELAY-20**: Every event is expressible as an OpenTelemetry log record and in the application's current
      logging format, with one mapping tested for each. [B6 note]
- [x] **RELAY-21**: A `log` provider writes events as structured lines to the container's output. [A2]

### DOCS — Documentation

- [ ] **DOCS-01**: The deployment guide is rewritten around the Terraform and Supabase-as-code path, and states
      that the HCL is kept OpenTofu-compatible (A6).
- [ ] **DOCS-02**: A settings reference lists each hosted setting, where the repository sets it, and how to
      verify it.
- [ ] **DOCS-03**: Every "unverified" statement about a hosted project is replaced by a dated observation or
      removed.
- [ ] **DOCS-04**: The environment-variable reference covers the proxy variables, the analytics variables and
      `PUBLIC_PROJECT_ID`.
- [ ] **DOCS-05**: The analytics documentation gives the event catalogue, how to add a provider, the privacy
      mechanism, and a checklist the deployer completes for their own jurisdiction. It says the consent
      determination is the deployer's and nowhere says that no consent is required (B7).
- [ ] **DOCS-06**: An operations runbook covers election-day scaling, rollback, teardown and restore, secret
      rotation, SES, and the limit that Admin job progress is unreliable above one task (D1).
- [ ] **DOCS-07**: `render.example.yaml` is fixed and documented as an untested alternative, and the orphan
      compose file is retired if nothing references it (A5).
- [ ] **DOCS-08**: Each of the seven absorbed todos has a closure record.

## Future Requirements

Recorded, not in this roadmap.

- **FUT-01**: The Admin job store moves to the database, so that job progress holds above one task (D1).
- **FUT-02**: The deployment moves to Supabase publishable keys. Queued for right after v2.16 and v2.17 merge
  (C5; todo filed).
- **FUT-03**: Answer events gain differential privacy, or masking of timestamp and insert order, so that they
  cannot be matched to access logs (B2; todo filed).
- **FUT-04**: A setting for an event allowlist and denylist (B3; todo filed).
- **FUT-05**: Alarms beyond budget and deployment or build errors: error rate, unhealthy targets, saturation.
- **FUT-06**: A scheduled plan that reports drift, and a scheduled read of the served settings.
- **FUT-07**: A production stack applied from the `example` environment.
- **FUT-08**: Session linkage after explicit opt-in, sampling at the relay, browser errors through the relay.
- **FUT-09**: An automated inbox round trip in the pipeline (E2).
- **FUT-10**: Rollback to the previous task definition when the smoke run fails.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Self-hosted Supabase | Ruled out by the operator before research. |
| AWS App Runner, Kubernetes, a serverless adapter | App Runner is closed to new customers; the others change the operating model or the tested adapter. |
| Bank authentication in the deployed test | Needs an identity-provider sandbox client with the deployed origin registered (A4). |
| A second applied environment | It observes nothing the staging stack does not (A1). |
| The whole E2E suite against the deployed stack | It seeds and tears down with the service-role key and its preflight rejects a deployed build by design. |
| Per-run seeding of the hosted project from CI | Arms prefix-scoped bulk deletes against a hosted database (E1). |
| `supabase config push`, and `seed.sql` on a hosted database | Local auth settings and known-password users would reach the hosted project. |
| Terraform creating the Supabase project | A destroy would delete the database (C2). |
| Load-balancer stickiness | Sets a cookie on every visitor (D1). |
| A NAT gateway | A standing monthly cost with no current need (D2). |
| A WAF rule on by default; Supabase preview branches | Cost scales with traffic; a paid second deployment model (A2). |
| A hash of address and user agent as a visitor id; PostHog's cookieless hash mode | A fingerprint (B3). |
| The PostHog browser SDK, session replay, autocapture, heatmaps | Each needs device storage or an identifier; replay would record political answers. |
| Self-hosted PostHog; PostHog as the log sink | Unsupported at this scale; the container log store holds server logs. |
| Caching rendered HTML at the edge | Pages vary by locale and by auth cookie. |
| A statement that no consent is required | The determination is the deployer's (B7). |
| A project-wide cap on the anonymous invitation operations | Any visitor could exhaust it for everyone. |
| Deploying on every push to `main` | Every merge would spend cloud money and could break staging (E3). |

## Traceability

Filled by the roadmap on 2026-10-11. Each requirement is mapped to one phase: the phase in which its last clause
is first observed. `ROADMAP.md` names, for each phase, the requirements it builds toward and a later phase
closes; those are not listed against the earlier phase here.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 185 | Pending |
| INFRA-02 | Phase 185 | Pending |
| INFRA-03 | Phase 185 | Pending |
| INFRA-04 | Phase 185 | Pending |
| INFRA-05 | Phase 185 | Pending |
| INFRA-06 | Phase 185 | Pending |
| INFRA-07 | Phase 185 | Pending |
| INFRA-08 | Phase 185 | Pending |
| INFRA-09 | Phase 185 | Pending |
| INFRA-10 | Phase 185 | Pending |
| INFRA-11 | Phase 185 | Pending |
| INFRA-12 | Phase 185 | Pending |
| INFRA-13 | Phase 185 | Pending |
| INFRA-14 | Phase 185 | Pending |
| INFRA-15 | Phase 183 | Complete |
| INFRA-16 | Phase 187 | Pending |
| INFRA-17 | Phase 183 | Complete |
| INFRA-18 | Phase 183 | Complete |
| INFRA-19 | Phase 187 | Pending |
| SUPA-01 | Phase 184 | Complete |
| SUPA-02 | Phase 184 | Complete |
| SUPA-03 | Phase 184 | Pending |
| SUPA-04 | Phase 184 | Complete |
| SUPA-05 | Phase 184 | Pending |
| SUPA-06 | Phase 184 | Complete |
| SUPA-07 | Phase 184 | Complete |
| SUPA-08 | Phase 187 | Pending |
| SUPA-09 | Phase 186 | Pending |
| SUPA-10 | Phase 181 | Complete |
| SUPA-11 | Phase 183 | Complete |
| SUPA-12 | Phase 185 | Pending |
| SUPA-13 | Phase 184 | Complete |
| SUPA-14 | Phase 184 | Pending |
| PIPE-01 | Phase 187 | Pending |
| PIPE-02 | Phase 187 | Pending |
| PIPE-03 | Phase 187 | Pending |
| PIPE-04 | Phase 187 | Pending |
| PIPE-05 | Phase 187 | Pending |
| PIPE-06 | Phase 187 | Pending |
| PIPE-07 | Phase 187 | Pending |
| PIPE-08 | Phase 187 | Pending |
| PIPE-09 | Phase 187 | Pending |
| PIPE-10 | Phase 187 | Pending |
| OBS-01 | Phase 184 | Complete |
| OBS-02 | Phase 184 | Pending |
| OBS-03 | Phase 184 | Pending |
| OBS-04 | Phase 185 | Pending |
| OBS-05 | Phase 184 | Complete |
| OBS-06 | Phase 185 | Pending |
| OBS-07 | Phase 184 | Pending |
| OBS-08 | Phase 185 | Pending |
| OBS-09 | Phase 188 | Pending |
| OBS-10 | Phase 185 | Pending |
| OBS-11 | Phase 188 | Pending |
| RELAY-01 | Phase 182 | Complete |
| RELAY-02 | Phase 182 | Complete |
| RELAY-03 | Phase 182 | Complete |
| RELAY-04 | Phase 188 | Pending |
| RELAY-05 | Phase 182 | Complete |
| RELAY-06 | Phase 182 | Complete |
| RELAY-07 | Phase 182 | Complete |
| RELAY-08 | Phase 182 | Complete |
| RELAY-09 | Phase 188 | Pending |
| RELAY-10 | Phase 182 | Complete |
| RELAY-11 | Phase 182 | Complete |
| RELAY-12 | Phase 182 | Complete |
| RELAY-13 | Phase 182 | Complete |
| RELAY-14 | Phase 182 | Complete |
| RELAY-15 | Phase 182 | Complete |
| RELAY-16 | Phase 182 | Complete |
| RELAY-17 | Phase 182 | Complete |
| RELAY-18 | Phase 182 | Complete |
| RELAY-19 | Phase 182 | Complete |
| RELAY-20 | Phase 182 | Complete |
| RELAY-21 | Phase 182 | Complete |
| DOCS-01 | Phase 189 | Pending |
| DOCS-02 | Phase 189 | Pending |
| DOCS-03 | Phase 189 | Pending |
| DOCS-04 | Phase 189 | Pending |
| DOCS-05 | Phase 189 | Pending |
| DOCS-06 | Phase 189 | Pending |
| DOCS-07 | Phase 189 | Pending |
| DOCS-08 | Phase 189 | Pending |

**Coverage:**
- v1 requirements: 83 total (INFRA 19, SUPA 14, PIPE 10, OBS 11, RELAY 21, DOCS 8)
- Mapped to phases: 83
- Unmapped: 0
- Per phase: 181: 1, 182: 19, 183: 4, 184: 14, 185: 19, 186: 1, 187: 13, 188: 4, 189: 8

Count corrected on 2026-10-11: this line said 81 when the requirements were defined. The six group counts sum to
83, and a count of the ids in this file gives 83.

---
*Requirements defined: 2026-10-11*
*Traceability filled: 2026-10-11*

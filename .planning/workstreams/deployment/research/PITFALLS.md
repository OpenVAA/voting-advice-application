# Pitfalls Research

**Domain:** Adding a Terraform-managed AWS deployment, a reproducibly configured hosted Supabase project, an apply-and-test CI pipeline and a consent-free first-party analytics relay to an existing SvelteKit (adapter-node) + Supabase monorepo
**Milestone:** v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay
**Researched:** 2026-10-10
**Confidence:** MEDIUM overall. HIGH for what was read in this worktree; MEDIUM for vendor behaviour read from official docs in this session; LOW where marked.

## How to read the evidence tags

Every claim below carries one of three tags. Nothing in this file was observed on a real hosted project or a real AWS account: the milestone exists because nothing is deployed.

| Tag | Meaning | Tier |
|-----|---------|------|
| `[REPO]` | Read in this worktree at `feat/deployment-terraform-supabase` (file named). | HIGH |
| `[DOCS]` | Read from the vendor's own documentation in this session (URL in Sources). The research seam routed every question to `websearch`; a finding cross-checked against the official page classifies as MEDIUM. | MEDIUM |
| `[UNVERIFIED]` | From training data, a single secondary source, or an inference. Treat as a hypothesis to measure. | LOW |

Suggested phase kinds, used in "Phase to address" (the roadmap does not exist yet):

- **FOUND** — foundation: state backend, CI identity, repository hygiene
- **SUPA** — hosted Supabase provisioning as code (migration model, config, secrets, functions, mail)
- **MEASURE** — hosted measurements that close the `174-` unknowns (may be the tail of SUPA)
- **RUNTIME** — frontend container and adapter-node hardening for a load balancer
- **APPLY** — first real `terraform apply` of the AWS stack
- **PIPE** — GitHub Actions plan/apply and the deployed smoke subset
- **RELAY** — analytics relay
- **DOCS** — operator runbook and deployment page

---

## Critical Pitfalls

### Pitfall 1: The single rewritten migration stops being deployable the moment a hosted project exists

**What goes wrong:**
`apps/supabase/supabase/migrations/` holds exactly one file, `00001_initial_schema.sql`, regenerated from `schema/*.sql` on every schema change, and `scripts/assert-schema-migration-parity.mjs` fails the build if a second migration file appears `[REPO]`. `supabase db push` records each applied migration by its version in `supabase_migrations.schema_migrations` and skips any version already recorded `[DOCS]`. So after the first push, every later edit to `00001` is silently never applied: the push reports nothing to do, the parity guard is green, and the hosted schema drifts from the repository with no red anywhere.

**Why it happens:**
The fold into one file was correct under the ruling "nothing is deployed, no back-compat is owed". That ruling ends with this milestone, and the guard's second conjunct ("exactly one `.sql` file") now forbids the only mechanism that updates a live database.

**How to avoid:**
Decide the migration model explicitly in the SUPA phase, before the first push. Two coherent options:

1. **Disposable hosted project (test target only):** every pipeline run rebuilds the schema from `00001` (`supabase db reset --linked --no-seed`). Honest, but destructive by design: it must be impossible to point at a project holding real data (see Pitfall 2), and it is not a production story.
2. **Baseline plus append-only:** freeze `00001` at a named cutover commit, change the parity guard to "byte-equal up to the baseline, then append-only numbered migrations", and regenerate `schema/` from the migrations rather than the reverse.

Either way add a drift check to the pipeline: `supabase db diff --linked` (or `supabase migration list`) must report no difference after deploy, and its exit status must be read directly, not through a pipe (repository precedent: `project_verify_gate_exit_status_not_piped`).

**Warning signs:**
`supabase db push` prints "Remote database is up to date" on a commit that changed `schema/`; `supabase migration list` shows one row forever; a hosted RPC returns `PGRST202` (function not found) for something that exists locally.

**Phase to address:** SUPA (decision and guard change), verified again in PIPE.

---

### Pitfall 2: `seed.sql` reaches the hosted project

**What goes wrong:**
`apps/supabase/supabase/seed.sql` is local-only data mixed with the one thing a deployment needs `[REPO]`:

- two `auth.users` rows with the password `password123`, one of them a project admin;
- `private.deployment_settings.behind_cloudflare = true`, which is correct for a hosted project but is set here for the E2E fixture's benefit;
- `storage_config` rows holding `http://kong:8000` and the public demo service-role JWT;
- the bootstrap account, project (`open_for_voters = true`) and `app_settings` row — the only part a real deployment also needs.

Three commands apply it to a remote: `supabase db push --include-seed`, `supabase db reset --linked` (seeds unless `--no-seed`, and first drops every user-created object) `[DOCS]`, and Supabase Branching, which seeds preview branches `[UNVERIFIED]`. The result is a publicly reachable project with an admin account whose password is in a public repository, and storage cleanup calls aimed at a host that does not exist.

**Why it happens:**
The CLI's seed flags look like the obvious way to get the bootstrap project row onto the hosted database, and the deployment page's manual alternative ("create one row in `accounts` and one in `projects` in the SQL editor") is not reproducible.

**How to avoid:**
Split the file: a `bootstrap` seed (account, project, `app_settings`, parameterised project id) that is safe everywhere, and a `local` seed (test users, kong URL, demo key). Point `[db.seed] sql_paths` at both locally and give the hosted remote only the bootstrap file through a `[remotes.<name>.db.seed]` block `[DOCS]`. Never put `--include-seed` or a bare `db reset --linked` in a workflow. Add a post-deploy assertion that fails by name when the hosted project holds any `@openvaa.test` user or a `storage_config.supabase_url` that is not the project's own URL.

**Warning signs:**
`--include-seed` or `db reset` anywhere under `.github/` or `infra/`; a hosted `auth.users` row with id `00000000-0000-0000-0000-000000000010`; `Storage cleanup failed` warnings in the hosted Postgres log.

**Phase to address:** SUPA.

---

### Pitfall 3: `supabase config push` writes the local development auth settings to the hosted project

**What goes wrong:**
`supabase config push` "updates the configuration of a linked project with your local `supabase/config.toml`" `[DOCS]`. This repository's `config.toml` is a local file by its own header `[REPO]`: `site_url = "http://127.0.0.1:5173"`, redirect URLs on `localhost:5173`, `[auth.rate_limit] email_sent = 2`, `max_frequency = "1s"`, `minimum_password_length = 6`, no `[auth.email.smtp]` section, and `env()` references that are unset in CI (`OPENAI_API_KEY`, `S3_HOST`, …). Pushed as is, mailed links point at a developer's loopback address and the auth service refuses the real callback URL. `account-access` then mails no link and logs one line — the "invited people receive no mail" failure the `174-` todo describes.

One secondary source reports that the push builds the full auth payload from the file plus the CLI's built-in template, so keys the file omits are reset to local defaults `[UNVERIFIED]`. If true, a partial `[remotes]` override is not enough.

**Why it happens:**
"Config as code" suggests the checked-in file is already the code. It is, for the local stack only.

**How to avoid:**
Give the hosted project its own `[remotes.<name>]` block (every standard option is available there `[DOCS]`) with the production `site_url`, the two exact allowlist entries (`<ORIGIN>/api/auth/callback`, `<ORIGIN>/*/api/auth/callback` — never a trailing or host wildcard `[REPO]`), SMTP, rate limits, `api.max_rows` and the custom-access-token hook. Run `supabase link` first and read its diff `[DOCS]`. Pick **one owner per setting**: either the CLI or the Terraform `supabase_settings` resource, never both, or every apply flips what the other wrote. After any push, assert the served result rather than the file: `GET <project>/auth/v1/settings` must hold `"disable_signup": true` and `"mailer_autoconfirm": false` (the label-independent check the `174-` todo names).

**Warning signs:**
A mailed link whose origin is `127.0.0.1`; `account-access` logging its allowlist refusal; `terraform plan` showing auth settings changing on every run with no code change.

**Phase to address:** SUPA; the served-settings assertion is reused by PIPE.

---

### Pitfall 4: Hosted state that no migration and no config file carries

**What goes wrong:**
Several things the application depends on live outside both `migrations/` and anything a push covers, so a project that "applied cleanly" is still broken `[REPO]`:

| Fact | Where it lives locally | Failure when missing on hosted |
|------|------------------------|--------------------------------|
| `public-assets`, `private-assets` buckets | `config.toml` `[storage.buckets.*]` only; `400-storage.sql` creates policies, not buckets | every upload fails; images 404 |
| `storage_config` (`supabase_url`, `service_role_key`) | `seed.sql` | cleanup triggers degrade to a `WARNING`; orphaned files accumulate silently |
| `behind_cloudflare = true` | `seed.sql` | all voters share one feedback rate-limit bucket (the last `x-forwarded-for` hop is a platform address) |
| API max rows = `dataAdapter.pageSize` (50000) | `config.toml` `[api] max_rows` | reads truncated at 1000 rows **with HTTP 200** (measured locally: 1000 of 1510 nominations) |
| `anon` `statement_timeout = '8s'` | in the migration (`001-role-settings.sql`) | the municipal-scale nominations read fails at the platform default with `57014` |
| Custom access token hook enabled | `config.toml` `[auth.hook.custom_access_token]` | JWTs carry no claims; RLS denies everything; users look unauthorised |
| Account / project / `app_settings` rows, `PUBLIC_PROJECT_ID` | `seed.sql` | the adapter throws at construction (`PUBLIC_PROJECT_ID is required`) |
| `Sb-Forwarded-For` enabled | not configured anywhere | see Pitfall 6 |

**Why it happens:**
Each was added as a local fix with a docs note ("a hosted project sets this in the dashboard"). The notes are correct and nobody has ever had to follow them.

**How to avoid:**
Turn the deployment page's manual steps into code, one mechanism per row: an idempotent bucket migration (`INSERT INTO storage.buckets … ON CONFLICT DO NOTHING`) or a scripted `supabase seed buckets --linked` `[UNVERIFIED: command not checked this session]`; a post-migration SQL step fed from Terraform outputs for `storage_config` and `behind_cloudflare`; `max_rows` in the remote config block. Then write **one hosted conformance probe** in the style of the repository's `assert:*` scripts that reads each fact from the served project (`pg_roles.rolconfig`, a row-count read above 1000, a decoded JWT's claims, a bucket list) and fails by name. Run it after every apply. Follow the repository's own discipline: prove each assertion fails against a deliberately broken throwaway project before trusting it.

**Warning signs:**
A list that stops at exactly 1000 rows; a signed-in contestant redirected to login in a loop; `Storage cleanup skipped: missing supabase_url or service_role_key` in the Postgres log.

**Phase to address:** SUPA (mechanisms), MEASURE (probe proven to fail), PIPE (probe as a gate).

---

### Pitfall 5: Three separate mail paths, each with its own way of sending nothing

**What goes wrong:**
Mail leaves a deployment by three routes and each has a hosted-only blocker:

1. **The auth service's own mail** (the recovery mail still comes from it, per the `174-` OTP todo `[REPO]`). With the built-in provider it sends only to members of the project's organisation, at 2 messages per hour; other recipients fail with "Email address not authorized" `[DOCS]`. Custom SMTP starts at 30 per hour until raised `[DOCS]`.
2. **`account-access` and `send-email`**, which use `nodemailer` with `secure: false` hard-coded and a configurable `SMTP_PORT` `[REPO]`. Hosted Edge Functions block outgoing connections to ports 25 and 587 `[DOCS]`. Port 465 needs implicit TLS, which `secure: false` does not speak. So the conventional SES settings (587) hang, and the obvious fallback (465) hangs too. SES also accepts STARTTLS on **2587** `[DOCS]`, which is the one port that works with the code as written.
3. **AWS SES itself.** A new account is in the sandbox per region: verified recipients only, 200 messages a day, 1 per second; production access is a support review with an initial response within 24 hours `[DOCS]`.

A failed send in `account-access` gives its slot back and logs `ERR_ENV_UNCONFIGURED` or the mail-step line, naming no variable `[REPO]`. From outside it is indistinguishable from an address with no invitation, by design.

**Why it happens:**
Local mail is Mailpit on an in-network port with no auth and no TLS, so none of the three constraints has ever been exercised.

**How to avoid:**
Request SES production access in the FOUND phase — it is the only item in the milestone with a human lead time. Verify the sending domain with DKIM, SPF and DMARC from Terraform. Set `SMTP_PORT=2587` for the functions, or change the transport to derive `secure` from the port and add `requireTLS: true` (with `secure: false` and no `requireTLS`, STARTTLS is opportunistic `[UNVERIFIED]`). Configure the same SES credentials as the auth service's custom SMTP and raise its hourly limit to match an invitation mailing. Consider the send-email hook the `174-` todo proposes so the auth service originates no mail at all. For tests, decide the inbox up front (see Pitfall 12).

**Warning signs:**
`account-access` logs "a link could not be issued or mailed; its slot is given back"; nodemailer `Greeting never received` / `ETIMEDOUT`; SES `MessageRejected: Email address is not verified`; the first invitation mailing stops after 30 messages.

**Phase to address:** FOUND (SES access request), SUPA (ports, SMTP, limits), MEASURE (observe one real send and both refusals).

---

### Pitfall 6: Per-IP auth limits collapse onto the frontend's single egress address

**What goes wrong:**
The hosted auth service limits by IP: 30 token verifications per 5 minutes, 30 sign-in-class requests per 5 minutes, 150 token requests per 5 minutes `[DOCS]`. This application makes auth calls from the **server**: `locals.supabase.auth.verifyOtp` in `/api/auth/callback`, `refreshSession` there and in `sessionAdmission.ts`, and `auth.getUser()` in `safeGetSession` on server requests `[REPO]`. Behind a NAT gateway every contestant therefore arrives at the auth service from one address. An invitation mailing to a few hundred candidates produces more than 30 link openings in five minutes and the rest get 429 on a link that is single-use and, per the `174-` todos, invalidated by a later link.

The fix the platform offers has a precondition this codebase does not meet: `Sb-Forwarded-For` is honoured only on requests made with a **secret API key**, not with publishable or legacy `anon`/`service_role` keys, and must first be enabled for the project `[DOCS]`. The SSR client is built with `PUBLIC_SUPABASE_ANON_KEY` `[REPO]`.

Two related draws on the same buckets: `account-access` probes the allowlist with a `GET /auth/v1/verify` from its own address `[REPO]`, and the docs list `/user` in the 30-per-5-minutes bucket — whether that includes the `GET /user` behind `getUser()` is `[UNVERIFIED]` and would be severe if it does.

**Why it happens:**
Locally every caller is `192.168.65.1` and nothing is limited at a level a test reaches (`174-05`, measurement E7 `[REPO]`). The topology only exists once there is a NAT.

**How to avoid:**
Measure before designing, as operator decision G1 (a) already rules: on the hosted project, record which headers the gateway sets and at what request rate each endpoint answers 429 from one address. Then choose: raise the per-IP limits for the project to match the single-egress topology (all are customisable `[DOCS]`), or move the server-side auth calls to a secret-key client that forwards the caller's address — which requires a correct `ADDRESS_HEADER`/`XFF_DEPTH` first (Pitfall 8), or the forwarded value is attacker-chosen. Do not "fix" it with a project-wide cap; the `174-` todo already rejects that.

**Warning signs:**
429 with `over_request_rate_limit` in the frontend's server log during a mailing; sign-ins failing for everyone at once and recovering five minutes later; failures that correlate with a load test rather than with any one user.

**Phase to address:** MEASURE (headers and thresholds), SUPA (limits), RUNTIME (address header).

---

### Pitfall 7: Building on API keys that are being retired this year

**What goes wrong:**
Supabase is deprecating the legacy `anon` and `service_role` JWT keys "by the end of 2026" in favour of publishable and secret keys, which are not JWTs and belong in the `apikey` header, not `Authorization: Bearer` `[DOCS]`. This milestone would freeze the legacy model into new infrastructure in the last quarter of that window. The repository's assumptions `[REPO]`:

- variable names `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` throughout the frontend, the functions and the Terraform that will carry them;
- the three functions read `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the platform (still injected, carrying the legacy keys; the new ones arrive as `SUPABASE_SECRET_KEYS` `[DOCS]`);
- the storage cleanup trigger sends **only** `Authorization: Bearer <service_role_key>` through `pg_net` — the header form the new keys are documented not to use;
- `config.toml` has no `[functions.<name>]` blocks, so whether each function is deployed with JWT verification is decided by a CLI flag at deploy time, and `account-access` is called "with the anon key and no user token" — a call the deployment page already marks unverified on a hosted gateway.

Whether a project created today still issues legacy keys, and whether `Sb-Forwarded-For` (Pitfall 6) can be used without migrating, are `[UNVERIFIED]`.

**Why it happens:**
The local stack prints both key sets and everything works with the old ones, so nothing forces the question.

**How to avoid:**
Decide in SUPA which key model the hosted project uses and record it. At minimum: declare `verify_jwt` per function in `config.toml` so deployment is reproducible `[DOCS]`; name Terraform variables and secrets by role, not by the legacy term; run the storage-cleanup E2E (`storage-cleanup.spec.ts`) once against the hosted project to observe whether the bearer-only delete is accepted; and file whatever stays on legacy keys as a dated follow-up rather than discovering it at the cutoff.

**Warning signs:**
401 from an Edge Function before its handler runs; `Storage cleanup failed` warnings after a key rotation; a dashboard banner about legacy keys on the new project.

**Phase to address:** SUPA (decision), MEASURE (observe the three call shapes).

---

### Pitfall 8: adapter-node behind a load balancer with the defaults it has locally

**What goes wrong:**
`svelte.config.js` passes `adapter({})` and no deployment has ever put a proxy in front of the build `[REPO]`. Behind an ALB or CloudFront:

- **Origin.** Without `ORIGIN`, or `PROTOCOL_HEADER`/`HOST_HEADER`, the server derives its origin from the `host` header and assumes `https`; when that is wrong, form POSTs fail with "Cross-site POST form submissions are forbidden" `[DOCS]` and every absolute URL built from `url.origin` (OIDC `redirect_uri`, auth `redirectTo`) is wrong. (`ORIGIN` is the variable in adapter-node 5.x; the newest docs describe `paths.origin` instead — check against the locked `@sveltejs/adapter-node@5.5.7` `[UNVERIFIED]`.)
- **Client address.** `getClientAddress()` returns the load balancer unless `ADDRESS_HEADER` and `XFF_DEPTH` are set, and the docs warn the header is spoofable unless the depth matches the real proxy chain `[DOCS]`. Every later use of the address (relay rate limit, `Sb-Forwarded-For`) inherits the error.
- **Environment.** `.env` files are not loaded in production `[DOCS]`; the app reads `$env/dynamic/*` everywhere (24 public, 9 private imports, no static ones `[REPO]`), which is good — one image serves every environment — but a variable missing from the task definition falls through the `??` defaults in `constants.ts` to plausible wrong values, and a missing `PUBLIC_PROJECT_ID` throws at adapter construction. Neither deployment template passes it today (todo `2026-10-02`, item 1).
- **Health check.** No health route exists `[REPO]`. Pointing the target group at `/` makes every probe an SSR render that reads Supabase; a slow Supabase then fails the probes and the load balancer removes every healthy task at once.
- **Keep-alive.** A Node keep-alive timeout shorter than the load balancer's idle timeout produces intermittent 502s on reused connections `[UNVERIFIED]`; adapter-node exposes `KEEP_ALIVE_TIMEOUT` and `HEADERS_TIMEOUT` for this `[DOCS]`.
- **Shutdown.** The server drains for `SHUTDOWN_TIMEOUT` (30 s) on `SIGTERM` `[DOCS]`; the ECS stop timeout and the target group's deregistration delay must be at least that, or deploys cut requests.

**Why it happens:**
`docker-compose.dev.yml` runs the production image directly on a published port, which is the one topology where every default is right.

**How to avoid:**
Give RUNTIME its own phase before APPLY: add a dependency-free `/healthz` route; set origin, address-header and timeout variables in the task definition from Terraform; add a startup check that names every required variable that is unset (the functions already have `requireEnv`; the frontend has nothing equivalent). Reproduce the topology locally with a reverse proxy in compose and run the auth-callback and OIDC specs through it before any AWS resource exists.

**Warning signs:**
403 on login POST only on the deployed URL; `redirect_uri` mismatch from the identity provider; tasks cycling "unhealthy" while the app answers by hand; sporadic 502s at low traffic.

**Phase to address:** RUNTIME, verified in APPLY.

---

### Pitfall 9: Secrets in Terraform state, plans, logs and public artifacts

**What goes wrong:**
State holds every value a resource was given: the Supabase database password (required by `supabase_project` `[DOCS]`), the service-role key, SMTP credentials, the identity provider's decryption JWKS, the PostHog key. Four leaks are specific to this repository:

- `.gitignore` has no Terraform entries `[REPO]`; a first local `terraform init` leaves `.terraform/` and possibly `terraform.tfstate` one `git add -A` away. The `secret-scan` job scans pushed commits with trufflehog `[REPO]`, which is after the fact.
- Plan files contain the same values as state. Uploading a plan as a workflow artifact for a later apply job publishes them; this is a public repository and its artifacts are downloadable by any signed-in GitHub user `[UNVERIFIED]`.
- `e2e-tests` uploads `tests/e2e-runs/ci/` for 30 days `[REPO]`. Against a local stack that is harmless. Against a hosted project the traces, storage state and mail captures contain live session cookies and sign-in links for a reachable deployment.
- The repository already forbids whole-environment dumps (rule PROH-174-29 and `withhold-stack-keys.mjs` `[REPO]`); `terraform output -json`, `supabase status`, `set -x` and `aws ecs describe-task-definition` are the same class and are not covered by any existing scan.

**Why it happens:**
Terraform's `sensitive` only redacts console output; it does not keep values out of state or plan files.

**How to avoid:**
First commit of FOUND adds the ignore entries. Use an S3 backend with `use_lockfile = true`, versioning, encryption and blocked public access; DynamoDB locking is deprecated `[DOCS]`. Keep secret *values* out of Terraform where possible: create them in Secrets Manager/SSM out of band or with write-only arguments, and reference them from the task definition by ARN rather than as plaintext `environment` entries. Pass plans between jobs only within one job, or encrypted. For the deployed smoke run, upload a report without traces and storage state, or keep the artifact private to the run. Extend the hygiene verdict to the new scripts' directories.

**Warning signs:**
`git status` showing `.terraform/` or `*.tfstate`; a workflow step named "upload plan"; a `*** ` mask missing next to a key-shaped string in a job log; a task definition in the AWS console showing a secret in clear text.

**Phase to address:** FOUND.

---

### Pitfall 10: The Supabase project and the AWS stack share a lifecycle

**What goes wrong:**
If one Terraform root manages both `supabase_project` and the AWS resources, the pipeline's teardown (`terraform destroy`) deletes the database. A recreated project gets a new ref, so its URL, keys, allowlist entries and the identity provider's registered redirect URIs all change. The Supabase provider documents that settings "are created and destroyed together with their corresponding project" `[DOCS]`.

The opposite failure is quieter: a Free-plan project is paused after about seven days of low activity `[DOCS]`, so a test target that only CI touches goes away between bursts of work and the next run fails in a way that looks like a code regression.

**Why it happens:**
One `terraform apply` for everything is the simplest thing to demo.

**How to avoid:**
Separate root modules and state files: a long-lived one for the Supabase project (with `prevent_destroy`, imported rather than created if it already exists `[DOCS]`) and SES identity; an ephemeral or frequently changed one for the AWS compute. CI teardown may only ever target the second. Budget a paid plan for the project the pipeline depends on, or add a readiness gate that distinguishes "paused" from "broken" and says so by name.

**Warning signs:**
A plan showing `supabase_project` will be replaced; a pipeline run failing with connection errors on an unchanged tree after a quiet week.

**Phase to address:** FOUND (state layout), SUPA (project lifecycle).

---

### Pitfall 11: A pipeline that cannot be observed, or that anyone can trigger

**What goes wrong:**
Four properties of this repository's CI interact badly with an apply workflow `[REPO]`:

- `main.yaml` runs only on pushes to `main` and `ci-evidence/**` and on pull requests into `main`. Integration branches produce no runs, and `workflow_dispatch` is offered only for workflows already on the default branch. A deploy workflow written on `feat/deployment-terraform-supabase` cannot be dispatched by hand and will not run on push unless its own trigger names the branch.
- `paths-ignore: "**.md"` means a commit touching only markdown produces no run, and "a missing run reads like a passing one".
- The E2E jobs had never passed in CI as of 2026-09-03 (todo `ci-e2e-ssr-500`) and the runner is about 4.3 times slower than the development host (project memory). The pipeline's smoke stage inherits both.
- This is a framework people fork ("1. Fork and configure" on the deployment page). A workflow that applies on push to `main` runs in every fork.

And four generic ones `[DOCS]` unless marked:

- The OIDC `sub` claim differs for a branch push, a pull request and a job that names an `environment:`. Adding an environment protection rule to an apply job changes its subject and breaks a trust policy written for the branch form. A wildcard subject hands the role to every branch and pull request.
- Pull requests from forks get no OIDC token and no secrets; a required "plan" check then fails for every outside contributor. `pull_request_target` "fixes" that by running untrusted code with secrets `[UNVERIFIED]`.
- Cancelling an apply mid-run (the default behaviour of a `concurrency` group with `cancel-in-progress`) leaves a half-created stack and a stale lock.
- Repositories created after 2026-07-15, or opted in, use an immutable subject format with numeric ids.

**How to avoid:**
Two roles: a read-only plan role assumable from pull requests of this repository, and an apply role bound to one protected environment's subject. Guard every deploy job with `if: github.repository == 'OpenVAA/voting-advice-application'` or a repository variable, so forks are inert until their owner opts in. A `concurrency` group keyed on the target stack with `cancel-in-progress: false`. Apply the saved plan from the same job, not a fresh plan. Use the `ci-evidence/**` channel to observe the first runs, and include a non-markdown path in each evidence commit. Treat "the workflow did not run" as a failure in the phase's success criteria, as the cardinal rule already does for tests.

**Warning signs:**
`Not authorized to perform sts:AssumeRoleWithWebIdentity`; a pull request with a green check list that contains no plan job; `Error acquiring the state lock`; a fork owner reporting red deploy runs.

**Phase to address:** FOUND (roles, trust policy), PIPE (triggers, concurrency, fork guard).

---

### Pitfall 12: Pointing the existing E2E suite at the deployed URL

**What goes wrong:**
"Run a smoke/E2E subset against the deployed URL" reads like `--grep @smoke` with a different base URL. The suite is welded to a local stack in ways that are deliberate guards, not accidents `[REPO]`:

- `global-setup.ts` runs the served-app preflight on every invocation shape and has "no bypass here by design": it asserts the listener serves **this checkout's** module root, which a production build never does.
- Setup projects seed and tear down through the service-role client; `assertLocalSupabaseUrl` refuses a non-local host unless `DEV_SEED_ALLOW_REMOTE=1`. Setting that variable for the smoke job also arms every prefix-scoped bulk delete against the hosted database.
- Mail is read from Mailpit on `localhost:54324`; a hosted project has no such inbox.
- The bank-auth specs use a mock OIDC issuer bound to `127.0.0.1:9443`, unreachable from a hosted Edge Function.
- The `perm-*` projects mutate the single `app_settings` row; on a shared project two runs corrupt each other (the Phase 124 contamination flake, now across the network). Teardown projects assert exact row accounting with `retries: 0`.
- `e2e-run.sh` owns a dev server and `yarn db:reset`.
- Timeouts are tuned to a local database; hosted adds a WAN round trip per request on top of the 4.3× slower runner, and the `anon` 8 s statement timeout is now reachable.

Bending any of these to admit a remote target weakens a guard that was proven to fail on purpose.

**Why it happens:**
The suite is the project's strongest asset, so reusing it looks like the high-quality choice.

**How to avoid:**
Leave the existing suite and its preflight untouched. Add a **separate Playwright config** for the deployed target with its own, smaller contract:

- a deployed-target preflight that asserts the *response* (the `data-project-id` attribute the app already publishes, plus a build identifier), keeping the served-app principle "the response is the thing under test";
- read-mostly voter journeys against a dataset seeded once, out of band, into a dedicated project row (the `E2E_PROJECT_ID` pattern), with no setup or teardown projects;
- at most one write path, namespaced by run id, with cleanup in an `always()` step and a scheduled sweeper for what a cancelled run leaves;
- one invitation mail round trip through a real inbox decided up front (an SES inbound rule to S3, or a hosted mail-capture service);
- one `concurrency` group per hosted project, so two runs never overlap;
- no fixed waits; a warm-up request before the first test.

Specs that cannot run against the deployed target are not in this config, so nothing is "skipped" or "did not run".

**Warning signs:**
A diff that adds an `if (process.env.DEPLOYED)` early return to `global-setup.ts` or `preflight.ts`; `DEV_SEED_ALLOW_REMOTE` in a workflow file; a smoke run reporting tests as skipped; two runs' teardown counts disagreeing.

**Phase to address:** PIPE, with the dataset decision made in SUPA.

---

### Pitfall 13: Deploy ordering between the schema, the functions and the frontend

**What goes wrong:**
A release now has four moving parts with independent rollouts: the migration, the Edge Functions and their secrets, the hosted config, and the frontend image. Applied in the wrong order, a new frontend calls an RPC that does not exist yet, or an old frontend keeps running against a schema that dropped a column — and because the repository rewrites its schema freely (no back-compat owed until now), most schema commits are breaking by construction.

Within the frontend alone, a rolling deploy across several tasks serves the new HTML from one task and requests its hashed chunks from an old one, which 404s; `kit.version.pollInterval` (5 minutes `[REPO]`) only tells an already-loaded client that a new version exists `[UNVERIFIED]`.

Values that must agree across systems drift for the same reason: `IDENTITY_PROVIDER_TYPE` and `IDENTITY_PROVIDER_CLIENT_ID` each exist as a frontend variable and an Edge Function secret that "MUST hold the same value" `[REPO]`; the site origin exists as the functions' `SITE_URL`, the auth service's `site_url`, the allowlist entries, the frontend's origin setting and the identity provider's registered redirect URI. Locally `yarn check:env-pairs-agree` compares two files; in a deployment the two halves live in AWS and in Supabase and nothing compares them.

**How to avoid:**
Fix the order in the pipeline and write it down: migration → functions and secrets → hosted config → conformance probe → image → service update → smoke. Derive every duplicated fact from one Terraform value and feed both systems from its output; extend the pair check to compare the two deployed halves by name, never by value. Serve `_app/immutable` so that assets of the previous build stay available during and after a rollout (object storage behind the CDN, or a deployment mode that never mixes versions behind one listener).

**Warning signs:**
`PGRST202`/`42883` in the frontend log for minutes after a deploy; a bank-auth round trip that redirects correctly and then fails with 401 at `identity-callback` (the audience twin disagrees); chunk-load errors in the browser console during a rollout.

**Phase to address:** PIPE (ordering), APPLY (single-source outputs), RUNTIME (asset strategy).

---

### Pitfall 14: "Consent-free" declared while the existing tracking code still stores an identifier

**What goes wrong:**
The operator's decision is no client-side storage and no consent prompt. The code that exists does the opposite in four places `[REPO]`:

- `trackingService.svelte.ts` creates `sessionId = sessionStorageState('appContext-sessionId', getUUID())` and stamps it on every event as `vaaSessionId`. `sessionStorage` is storage on the visitor's device.
- The same handle is passed to `surveyLink(...)`, so the identifier also leaves in the survey URL. Removing it from analytics alone leaves the storage in place and links survey answers to nothing, or to a different id.
- `shouldTrack` requires `userPreferences.dataCollection.consent === 'granted'`, with `DataConsent` components, a `dataConsent_granted` event, and the consent state itself in `localStorage`.
- `UmamiAnalytics.svelte` loads `https://cloud.umami.is/script.js` from the visitor's browser, and `staticSettings.analytics` is compiled into the bundle with a `platform.name` of `'umami'`.

Removing the consent gate while keeping the stored id produces exactly the situation the consent rule exists for. Keeping the gate while removing the prompt produces zero events.

A replacement identifier does not escape the question by being derived instead of stored: PostHog's own cookieless mode computes a daily-salted hash of team id, IP address, user agent and hostname on PostHog's servers, and PostHog's documentation states that the IP and user agent are themselves personal data even though it treats the hash as non-personal `[DOCS]`. The EDPB's Guidelines 2/2023 (v2, 7 October 2024) address IP-only tracking, URL/pixel tracking and locally processed information under Article 5(3); their conclusions could not be read in this session and are `[UNVERIFIED]` here. The French regulator's audience-measurement exemption is conditional (information and a right to object, single-publisher scope, no cross-referencing, truncated IP) and is opt-out, not "nothing to say" `[UNVERIFIED: secondary summary]`.

**Why it happens:**
"Relay" sounds like a transport change. For the consent claim it is a data-model change: what identifies a visit, and where that identifier is held.

**How to avoid:**
Make the session identifier in-memory only: created at application start, held in a module-level value, never written to `sessionStorage`, `localStorage`, a cookie, the URL or the Cache API. It survives client-side navigation in this single-page app and is lost on a full reload or a new tab; accept and document the resulting over-count of sessions rather than compensating with a fingerprint. Decide the survey link's fate in the same change. Add a guard in the repository's style: an E2E assertion that after a full voter journey `document.cookie`, `sessionStorage` and `localStorage` contain no analytics key, proven to fail by re-adding the old line. Update the privacy texts in all seven locales in the same phase; `staticSettings.type.ts` already warns that the `privacy` translations must match the platform. Have the "no consent needed" conclusion reviewed by someone qualified before it is stated in documentation; record it as the operator's position, not as a research finding.

**Warning signs:**
`appContext-sessionId` visible in the browser's storage inspector on the deployed site; a `vaaSessionId` property on events; the relay design mentioning "hash of IP and user agent"; privacy copy that still names Umami.

**Phase to address:** RELAY (first plan of the phase, before the endpoint), DOCS (copy and legal position).

---

### Pitfall 15: Voters' answers travel as events keyed to one identifier

**What goes wrong:**
The tracking vocabulary includes `answer`, `answer_delete`, `question_skip`, `results_ranked_*` and `filters_active`, and the setting's own description says it collects "usage data about all UI actions, including answers to statements" `[REPO]`. Every event carries the session identifier. On the receiving side that is one visitor's full set of political opinions, reconstructable in order, held by a third-party processor. Political opinions are a special category of personal data; whether a per-visit record without a name is personal data depends on what else arrives with it (address, user agent, timestamps, a rare combination of constituency and answers) `[UNVERIFIED: legal assessment not made here]`.

**Why it happens:**
The event set was designed for research use behind an explicit consent. The relay keeps the events and removes the consent.

**How to avoid:**
Review the event vocabulary as part of the relay's design, not after. Options, from safest: do not forward answer values at all (count that an answer happened); forward answers without any session linkage (a fresh random id per event, so no profile can be assembled); or keep linkage only behind a per-deployment setting that is off by default and documented as requiring the deployer's own legal basis. Enforce the choice in the relay's server-side schema, so a client change cannot widen it. Never forward free text (feedback, search or filter text, typed party names).

**Warning signs:**
An event property holding a question id together with a value and a session id; a PostHog "session" view that replays one voter's questionnaire.

**Phase to address:** RELAY (requirements), DOCS.

---

### Pitfall 16: The relay becomes the place the visitor's address and browser are recorded

**What goes wrong:**
Moving the request from the browser to a first-party endpoint does not remove the visitor's IP and user agent from the system; it moves them to four places the project now owns:

- **The forwarded event.** If the relay passes `$ip` or the user agent on, the processor has them again. `posthog-node` leaves GeoIP enrichment off by default (`disableGeoip: true`) `[DOCS]`, which is the safe default and is one option away from being undone. PostHog has project- and organisation-level "discard client IP" settings and EU organisations default to capture disabled `[DOCS]`; whether an address is used for GeoIP before being discarded is not stated `[UNVERIFIED]`.
- **Access logs.** Load balancer and CDN access logs record the client address and the request path for every relay call, with their own retention.
- **Application logs.** `track()` already calls `log.debug('Tracking event dispatched', { name, data })` `[REPO]`; a server-side equivalent with `PUBLIC_LOG_LEVEL=debug` writes event payloads next to request metadata in container stdout.
- **A rate limiter keyed on address.** It needs the address in memory or in a store to work at all.

Stripping the user agent has its own cost: PostHog classifies bots at query time from `$raw_user_agent`, keeps the events and labels them, and classifies an event with no user agent as `Automation` / `no_user_agent` `[DOCS]`. A relay that strips it makes every real voter look like a bot.

**How to avoid:**
Write down, per field, what the relay receives, what it forwards and what it logs, and make that table the endpoint's contract and its test. Forward neither address nor raw user agent. Classify at the relay instead (bot / not bot, device class, coarse locale) and forward only the derived category. Set the relay route's log line to carry no body and no address. Decide access-log retention for the relay path in Terraform. Do rate limiting at the edge (a WAF rate-based rule), where the address is processed transiently and never reaches application state.

**Warning signs:**
`$ip`, `$geoip_*` or `$raw_user_agent` properties on events in the PostHog project; relay bodies in CloudWatch; an in-process `Map` keyed by address.

**Phase to address:** RELAY, with log retention in APPLY.

---

### Pitfall 17: PostHog accepts the events and silently does the wrong thing

**What goes wrong:**
Four PostHog behaviours fail without an error `[DOCS]`:

- Events captured from a backend SDK or the API are **identified by default** and create person profiles. Anonymous capture requires `$process_person_profile: false` on every event, and is priced up to four times lower.
- The distinct id decides everything. A constant id (`'anonymous'`, `'relay'`) merges every voter into one person; the docs say to generate a random value per visit or session rather than reuse one. If an id already belongs to a person, the event counts as identified regardless of the flag.
- An event with a missing or empty `distinct_id` or name is dropped and the API still answers `200 OK`. Ids over 200 characters are truncated.
- `posthog-node` does not throw for background failures; errors surface only through `client.on('error', …)`. It batches 20 events or 5 seconds; queued events are lost unless `shutdown()` runs before the process exits.

In this deployment that last point fires on every rollout and every scale-in: adapter-node gets `SIGTERM`, drains requests, and exits. Nothing calls `shutdown()` today because nothing needs to.

**How to avoid:**
Pin the mapping in one adapter module and unit-test it: every forwarded event has `$process_person_profile: false`, a non-empty per-visit id, and an explicit client-side timestamp (otherwise a batch flushed on page hide carries the server's receive time for all of its events). Hook `sveltekit:shutdown` to `await client.shutdown()` `[DOCS]` and keep the ECS stop timeout above it. Register the error listener and count failures. Add one smoke assertion that an event sent through the deployed relay is retrievable from the PostHog project and has no person profile — a relay answering 204 proves only that the relay answered.

**Warning signs:**
The Persons list in PostHog is not empty; one person with thousands of events; event volume that dips at every deploy; a PostHog bill in the identified tier.

**Phase to address:** RELAY.

---

### Pitfall 18: An open ingest endpoint

**What goes wrong:**
The relay is an unauthenticated POST on the application's own origin that turns each request into a paid, stored event. Hiding the PostHog key on the server is the point of the design and it makes the endpoint the new key. Anyone with `curl` can inflate usage figures for a party's questions in the week before an election, exhaust the event quota so real data is dropped or billed, or use the route to consume the frontend's CPU during the traffic peak. An `Origin` or `Sec-Fetch-Site` check stops other websites' browsers, not scripts.

The repository has this conversation on record for a sibling surface: the feedback endpoint's per-address limit and its `behind_cloudflare` trust flag, and the `174-` todo's conclusion that "no identity of the caller is observable that the caller cannot choose" and that a project-wide cap lets any visitor deny service to everyone `[REPO]`.

**How to avoid:**
Layer cheap, privacy-neutral controls and accept that the data is advisory:

- validate against the closed `TrackingEventName` union and a per-event property schema on the server; drop unknown names and unknown keys; cap property lengths and events per request (the client already batches at most 45 sub-events);
- cap the body well below adapter-node's 512 kB default `[DOCS]`;
- require same-origin, a JSON content type, and the in-memory session id's shape;
- rate-limit at the edge with a WAF rule scoped to the relay path;
- make the forwarder bounded: a fixed-size queue that drops when the processor is slow, never unbounded memory;
- give CI, smoke tests and preview stacks a different PostHog project or a disabled relay, so test traffic does not look like voters.

**Warning signs:**
Event counts that do not track page views; one event name spiking outside any user flow; frontend memory rising while PostHog is degraded.

**Phase to address:** RELAY (schema, bounds), APPLY (WAF rule).

---

### Pitfall 19: The relay sits in the request path

**What goes wrong:**
Three ways the relay slows or breaks the pages it measures:

- capturing from `hooks.server.ts` or a `load` function and awaiting it, so time to first byte now includes a call to another continent's API;
- the client awaiting the relay before navigating, or the relay awaiting PostHog before answering;
- every page view becoming a second request to the same Fargate tasks that are already the bottleneck on election night, doubling request count for no user benefit.

Delivery at page exit has its own limits: the tracking service submits on leave or hide `[REPO]`; `fetch` with `keepalive` and `sendBeacon` are capped at about 64 kB and a beacon cannot set arbitrary headers `[UNVERIFIED]`. Content blockers match first-party paths that look like analytics (`/analytics`, `/collect`, `/track`, `/event`) `[UNVERIFIED]`, which silently removes a share of browsers.

**How to avoid:**
The endpoint validates, enqueues and answers 202 or 204 at once; forwarding happens after the response. The client fires and forgets, with `keepalive`, and never blocks navigation or rendering. No server-side capture inside SSR. Give the route a neutral name. State in the docs that counts are a lower bound. Load-test the relay path together with the voter journey, since they scale together.

**Warning signs:**
The relay route in the slowest-endpoints list; a visible delay between answering and the next question on the deployed site only; the questions route's latency tracking PostHog's status page.

**Phase to address:** RELAY, load-checked in APPLY or PIPE.

---

### Pitfall 20: First apply stalls on things Terraform waits for

**What goes wrong:**
A first apply against an empty account blocks on steps that need something outside the plan: a certificate waiting for DNS validation in a zone that is not delegated yet (and, for a CDN, in a different region than the stack `[UNVERIFIED]`); an ECS service created before any image exists in the registry, which never stabilises and times out after many minutes; SES identities waiting for DKIM records; default service quotas. Each failure leaves a partial stack that costs money while someone reads the error.

Idle cost is the other half. A NAT gateway and a load balancer bill by the hour whether or not anyone visits `[UNVERIFIED: order of tens of dollars a month each]`; the documented historical cost of this application on a PaaS was $80–350 a month `[REPO: CLAUDE.md]`, and a naive VPC design spends a large part of that on plumbing before the first request.

**How to avoid:**
Stage the first apply: registry and state first, push an image, then DNS and certificates, then compute. Make the split explicit as targets or separate roots so the pipeline can repeat it. Tag every resource with the stack name and add a budget alarm in FOUND. Decide deliberately between an always-on test stack and an ephemeral one: ephemeral is cheaper per month and adds ten or more minutes and several of the stalls above to every run. Write the destroy path in the same phase as the create path and run it once on purpose.

**Warning signs:**
An apply sitting on `aws_acm_certificate_validation` or `aws_ecs_service` for over ten minutes; resources with no stack tag in the billing view; a destroy that fails on a non-empty bucket or registry.

**Phase to address:** APPLY, with tagging and budget in FOUND.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Configure the hosted project by hand in the dashboard "just for the first run" | Working stack in an hour | The milestone's premise (reproducible) is unmet; the `174-` unknowns stay unrecorded; the next project repeats the guesswork | Only inside MEASURE, on a throwaway project, with each click replaced by code before the phase closes |
| Long-lived AWS access keys in GitHub secrets | No OIDC trust policy to debug | A standing credential in a public repository's settings; rotation nobody owns | Never |
| One Terraform root for Supabase and AWS | One command | Teardown deletes the database (Pitfall 10) | Never |
| Reuse the existing Playwright config with a remote flag | No second config to maintain | Guards proven to fail on purpose gain a bypass (Pitfall 12) | Never |
| Keep `sessionStorage` for the session id "for now" | Sessions survive a reload | The consent claim is false the day it ships (Pitfall 14) | Never |
| Interface shaped like PostHog (`distinct_id`, `$`-properties) behind a generic name | Fast first implementation | The "modular" promise is one implementation wide; a second service needs a rewrite | Acceptable if the seam is the repository's own `TrackingEvent`/`TrackingHandler` and the PostHog shape stays inside one adapter file |
| Relay rate limit in a per-process `Map` | No WAF to configure | Wrong across several tasks, holds addresses in memory, resets on deploy | A single-task test stack only |
| Shipping `900-test-helpers.sql` (`merge_jsonb_column`, executable by `authenticated`) to the hosted database | No split of the migration | A generic "update any JSONB column of any table" RPC on production, bounded only by RLS `[REPO]` | Acceptable for the test target; review before any real election |
| The production image as built today: whole-monorepo install, dev dependencies, runs as root, no health check `[REPO]` | It already builds in CI | Slow pulls delay scale-out at the traffic peak; larger attack surface | Acceptable for first apply; slim it before load testing |
| Leaving the in-memory admin `jobStore` as is `[REPO]` | No schema work | With more than one task, a job started on one is invisible on another | Acceptable while admin features are out of the deployed smoke scope; state it in the docs |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase CLI from GitHub runners | Connecting to the direct database host, which is IPv6 by default; hosted runners are IPv4-only `[DOCS]` | Keep the pinned CLI (2.118.0 `[REPO]`) and a linked project so it uses the pooler, or pass the session-pooler URL with the `postgres.<ref>` user |
| Supabase CLI versions | Local `yarn` catalog, `setup-cli` pin and the hosted platform drifting; `[inbucket]` is already deprecated in 2.118 `[REPO]` | One pinned version for local, CI and deploy; bump as its own change |
| Supabase access token | A personal access token carries its owner's privileges across their projects `[UNVERIFIED: no scoped PAT found]` | A dedicated machine account in a dedicated organisation; token stored as an environment-scoped secret |
| Supabase Management API | Looping settings calls in CI; the limit is 120 requests a minute per user per project `[DOCS]` | One settings write per apply; back off on 429 |
| Edge Function secrets | Names starting `SUPABASE_` are reserved; at most 100 secrets; secrets are per project and not copied to branches `[DOCS]` | Set from Terraform outputs in the pipeline; assert presence by name with the existing `assert:edge-function-env` logic pointed at the deployed list |
| Edge Function background work | Assuming `EdgeRuntime.waitUntil` runs as long as locally; the worker's wall clock is 150 s on Free, 400 s on paid, with 2 s CPU per request `[DOCS]` | Measure `account-access`'s background send on hosted; keep SMTP timeouts far below the limit |
| Identity provider (Signicat / Idura) | Registering only the production redirect URI; the JWKS URL must not redirect `[REPO]` | Register the test stack's origin too; treat the provider's sandbox client as a deployment input in Terraform variables |
| CDN in front of SSR | Default cache behaviour drops cookies and query strings or caches a signed-in or locale-negotiated page for everyone | Cache only `_app/immutable` and static assets at first; pass everything else through. Note the open todo: responses that set auth cookies already carry `no-store`, and a route setting its own `cache-control` on the same request throws `[REPO]` |
| Supabase and AWS regions | Frontend in one region, project in another: every SSR read pays a WAN round trip | Choose the project's region first and place the compute beside it |
| PostHog region | Default host is US in SDK examples `[DOCS]` | Set the EU host explicitly as a server-side private variable; never `PUBLIC_` |
| Free plan vs local config | Local buckets declare `500MiB` and image transformation is enabled; plan limits differ `[UNVERIFIED]` | Check each plan-gated feature in `config.toml` against the chosen plan before the first push |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Anonymous whole-project reads on every cold voter session | Database CPU pinned; `57014` timeouts; slow first paint | The read costs about 3.2–3.5 s at municipal scale `[REPO: spike 026]`. Size the database for the peak or cache the public reads; load-test with a realistic dataset, not the E2E seed | Election-day concurrency on the smallest compute tier |
| Default API row cap on hosted | Lists end at exactly 1000 with HTTP 200 | `max_rows` equal to `dataAdapter.pageSize`, asserted by the conformance probe | Any constituency over 1000 nominations |
| Health check that renders a page | All tasks marked unhealthy together during a Supabase slowdown | Dependency-free `/healthz` | First upstream latency spike |
| Scale-out slower than the spike | 503s for minutes after a televised debate | Pre-scale on a schedule for known events; smaller image; a floor of more than one task | Traffic that multiplies inside one minute |
| Relay doubling requests | Frontend CPU follows page views twice over | Batch on the client (already done); answer before forwarding | Peak traffic |
| Every auth call from one egress address | Simultaneous 429s for all contestants | Pitfall 6 | First invitation mailing |
| CI against a remote backend with local timeouts | Flakes only in the pipeline | Separate smoke config, no fixed windows, warm-up request | Immediately |
| Unbounded forward queue | Memory growth while the processor is degraded | Fixed-size queue, drop and count | A processor outage during peak |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Wildcard or missing `sub` condition on the OIDC trust policy | Any branch or pull request assumes the apply role | Exact subject per role; environment-bound apply role (Pitfall 11) |
| Redirect allowlist widened to make a test stack work | An open redirect on the sign-in link; the list is an exact-URL boundary by design `[REPO]` | Only `<ORIGIN>/api/auth/callback` and the single-segment `<ORIGIN>/*/api/auth/callback`, generated from the origin |
| Trusting `x-forwarded-for` without the right depth | A caller chooses its own address: bypasses limits, poisons anything keyed on it | `ADDRESS_HEADER` and `XFF_DEPTH` matched to the real chain; test with a spoofed header |
| Setting `behind_cloudflare = true` where the API is reachable without Cloudflare | A client sends its own `cf-connecting-ip` and picks its bucket `[REPO]` | True only for the hosted platform; never copied from `seed.sql` to another topology |
| Service-role key as a plaintext task environment variable | Readable in the console, in state and in `describe-task-definition` output | Secrets Manager reference; the frontend server needs the key (`.env.example` documents the construction-time throw `[REPO]`) |
| Service-role key in a plain table (`storage_config`) | Readable by anyone with database access; silently stale after rotation | Acceptable as designed for now; record rotation as a runbook step and assert freshness in the probe |
| Uploading traces or storage state from a run against a reachable deployment | Live sessions in a public repository's artifacts | Report-only artifacts for the deployed smoke run (Pitfall 9) |
| A test stack that looks like a real VAA | Voters use, share or index a staging site with test parties | `noindex`, a visible banner, the project closed to voters outside runs, a host name that says "test" |
| The auth service's `POST /otp` answering differently for registered addresses `[REPO]` | Account enumeration with the public key, around the invitation throttle | Re-measure on hosted; send-email hook as the todo proposes; state the residual |
| PostHog key or relay settings in `staticSettings` or a `PUBLIC_` variable | The key ships in the bundle and the relay is bypassable | `$env/dynamic/private` on the server only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Privacy copy that still describes consent-gated Umami | The notice misstates what happens; in seven locales | Rewrite the `privacy` texts in the same phase as the relay; native-speaker review is a known lead-time item in this project |
| Consent UI left in place with nothing behind it, or removed while the survey link still depends on the id | A prompt that changes nothing, or a broken survey hand-off | Remove or repurpose `DataConsent` deliberately; decide the survey link in the same change |
| Invitation mail from a new sending domain | Mail lands in spam or is rejected; candidates report "no mail" and the system reports nothing | DKIM, SPF, DMARC before the first real mailing; a seeded inbox test in the smoke run |
| Sign-in links with the wrong origin | A dead link, single use, from a deployment reporting no error | `SITE_URL` from the same Terraform value as the public origin; the smoke test opens a real mailed link |
| Deploys during voting hours | Chunk-load errors and dropped requests mid-questionnaire | Asset retention and drain settings (Pitfalls 8, 13); a freeze window in the runbook |
| Per-address limits where many users share an address | A party office or campus locked out together | Limits sized from measurement, not defaults |

## "Looks Done But Isn't" Checklist

- [ ] **Remote state:** bucket exists — verify versioning, encryption, public access block and `use_lockfile`, and that two concurrent plans produce a lock error.
- [ ] **Migrations:** `db push` succeeded — verify a schema change made *after* the first push reaches the hosted database, and that the drift check fails when it does not.
- [ ] **Seed:** bootstrap rows exist — verify no `@openvaa.test` user and no `kong` URL on the hosted project.
- [ ] **Auth config:** pushed — verify `/auth/v1/settings` served values, not the file; verify a redirect to `<ORIGIN>/fi/api/auth/callback` is admitted and `<ORIGIN>/fi/api/evil` is refused.
- [ ] **Access-token hook:** function exists — verify a real JWT carries the claims.
- [ ] **Buckets and cleanup:** policies exist — verify an upload, and that deleting the owning row removes the object.
- [ ] **Row cap:** verify a read of more than 1000 rows returns all of them.
- [ ] **Mail:** variables set — verify one real invitation mail arrives at an address outside the organisation, its link has the public origin, and it signs in; verify both refusal log lines once on a throwaway project.
- [ ] **Edge Functions:** deployed — verify an anon-key-only `check-code` call passes the gateway, and record the forwarded headers.
- [ ] **Bank auth:** variables set — verify the round trip against the provider's sandbox with the deployed origin registered.
- [ ] **Frontend behind the load balancer:** page loads — verify a form POST, the OIDC redirect URI, `getClientAddress()` with a spoofed header, and a deploy with requests in flight.
- [ ] **Pipeline:** workflow file merged — verify an *observed* run for plan, apply, smoke and teardown, and an observed red for a deliberately broken smoke test.
- [ ] **Fork safety:** verify the deploy jobs do nothing in a repository without the opt-in variable.
- [ ] **Teardown:** destroy ran — verify nothing with the stack tag remains and the Supabase project is untouched.
- [ ] **Relay storage claim:** events arrive — verify cookies, `sessionStorage` and `localStorage` hold no analytics key after a full journey, and that the guard fails when the old line is restored.
- [ ] **Relay privacy claim:** verify no `$ip`, GeoIP or raw user-agent property on stored events, no person profiles, and no event bodies in logs.
- [ ] **Relay delivery:** endpoint answers 204 — verify the event is retrievable from the processor, with a client timestamp, and that events queued at `SIGTERM` are delivered.
- [ ] **Relay abuse:** verify an unknown event name, an oversized body and a cross-origin POST are each rejected.
- [ ] **Docs:** the deployment page no longer says "unverified" or "in the SQL editor" for anything this milestone automated, and each closed `174-` todo records what was observed.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Schema drift after an edited `00001` | MEDIUM on a test project, HIGH with real data | Test target: `db reset --linked --no-seed` and re-bootstrap. Real data: write the missing change as a new migration, or run the SQL and `supabase migration repair --status applied`; repair only edits the history table `[DOCS]` |
| Local seed applied to hosted | LOW if caught at once | Delete the test users, rotate nothing unless they signed in, restore `storage_config` and re-run the conformance probe; audit `auth.audit_log_entries` |
| Local auth config pushed | LOW | Push the corrected remote block; re-read `/auth/v1/settings`; resend any invitation mailed in the window |
| Secret in state, plan or artifact exposed | HIGH | Rotate that secret at its source (database password, service-role or secret key, SMTP, provider client secret), delete the artifact, purge the state version; rewriting git history does not un-publish it |
| Stale Terraform lock after a cancelled apply | LOW | Confirm no run is active, `terraform force-unlock`, then plan to see the half-applied resources |
| Supabase project destroyed by teardown | HIGH | Recreate, re-push schema and config, re-register redirect URIs with the identity provider, update every consumer of the project ref; no data recovery on a plan without backups |
| Project paused | LOW | Restore from the dashboard (possible for a limited period `[DOCS]`); re-run the probe; move to a paid plan |
| Rate-limit lockout during a mailing | MEDIUM | Raise the per-IP limits for the project, wait out the five-minute window, re-issue links (a later link invalidates the earlier one `[REPO]`) |
| Identified events or merged persons in PostHog | MEDIUM | Fix the adapter; delete the persons; past events stay billed as they were captured |
| Analytics identifier found in storage after release | MEDIUM | Ship the removal, state the period in the privacy notice, and clear the key on next load |
| Polluted analytics from an abused endpoint | LOW to MEDIUM | Tighten the schema and edge rule; filter the period in analysis; counts are advisory by design |

## Pitfall-to-Phase Mapping

| # | Pitfall | Prevention Phase | Verification |
|---|---------|------------------|--------------|
| 1 | Rewritten single migration | SUPA | A post-baseline schema change reaches hosted; drift check proven red |
| 2 | `seed.sql` on hosted | SUPA | Probe finds no test user and no `kong` URL; no seed flag in any workflow |
| 3 | Local config pushed | SUPA | Served `/auth/v1/settings` and allowlist behaviour asserted |
| 4 | State outside migrations and config | SUPA, MEASURE | Conformance probe, each assertion observed failing once |
| 5 | Three mail paths | FOUND, SUPA, MEASURE | A real mail to an outside address; SES out of the sandbox |
| 6 | Per-IP limits on one egress | MEASURE, SUPA, RUNTIME | Recorded headers and 429 thresholds; a burst test from the deployed frontend |
| 7 | Retiring API keys | SUPA, MEASURE | Recorded key model; three call shapes observed |
| 8 | adapter-node behind a proxy | RUNTIME | Auth and OIDC specs through a local reverse proxy; then on the stack |
| 9 | Secrets in state, plans, artifacts | FOUND | Ignore rules in the first commit; no plan or trace artifact; hygiene scan covers new scripts |
| 10 | Shared lifecycle | FOUND, SUPA | Destroy of the AWS root leaves the project intact |
| 11 | Unobservable or over-open pipeline | FOUND, PIPE | Observed runs on the evidence channel; fork guard; trust policy test with a wrong subject |
| 12 | Existing suite on the deployed URL | PIPE | Separate config; existing preflight byte-identical; no skipped tests |
| 13 | Deploy ordering and duplicated facts | PIPE, APPLY, RUNTIME | Ordered pipeline; deployed pair check; no chunk errors during a rollout |
| 14 | Stored identifier under a consent-free claim | RELAY, DOCS | Storage guard E2E with a negative control; locale copy updated |
| 15 | Answers as linked events | RELAY | Server-side schema test; reviewed event list |
| 16 | Address and browser recorded by the relay | RELAY, APPLY | Field contract test; no `$ip` or body in stored events or logs |
| 17 | Silent PostHog misbehaviour | RELAY | Adapter unit tests; round-trip smoke assertion; shutdown flush observed |
| 18 | Open ingest endpoint | RELAY, APPLY | Rejection tests; edge rule in Terraform |
| 19 | Relay in the request path | RELAY | Endpoint answers before forwarding; load check with the journey |
| 20 | First-apply stalls and idle cost | APPLY, FOUND | Staged apply repeated from empty; destroy run on purpose; budget alarm |

**Ordering consequences for the roadmap:**

- FOUND comes first and contains the only human lead-time item (SES production access) and the only irreversible mistake class (secrets in state).
- SUPA and MEASURE precede PIPE: the pipeline's gates are the conformance probe and the served-settings assertions, which do not exist until the hosted project has been configured by code and its unknowns measured. Several `174-` todos change design depending on what is measured (the per-caller limit, the key model), so measuring late causes rework.
- RUNTIME precedes APPLY: every item in Pitfall 8 can be reproduced with a local reverse proxy at no cloud cost.
- RELAY is independent of the AWS work until its edge rule and log retention, and can run in parallel after RUNTIME fixes the client-address question. Its first plan is the data model (Pitfalls 14 and 15), not the endpoint.

**Phases that need deeper research when planned:** SUPA (migration model after baseline; CLI versus Terraform ownership per setting; key model), MEASURE (it is research by construction), RELAY (the legal position on consent and special-category data needs a qualified reviewer, not more searching).
**Phases on standard patterns:** FOUND and APPLY (well documented), provided the repository-specific items above are carried into their plans.

## Sources

Read in this worktree (`[REPO]`):

- `apps/supabase/supabase/config.toml`, `seed.sql`, `schema/107-feedback.sql`, `schema/400-storage.sql`, `schema/900-test-helpers.sql`, `functions/.env.example`, `functions/account-access/index.ts`, `functions/send-email/index.ts`
- `scripts/assert-schema-migration-parity.mjs`; `packages/dev-seed/src/localSupabaseUrl.ts`
- `.github/workflows/main.yaml`, `release.yml`, `docs.yml`
- `apps/frontend/svelte.config.js`, `Dockerfile`, `src/hooks.server.ts`, `src/lib/contexts/app/tracking/*`, `src/lib/components/analytics/umami/UmamiAnalytics.svelte`, `src/routes/api/auth/callback/+server.ts`, `src/lib/server/admin/jobs/jobStore.ts`
- `tests/playwright.config.ts`, `tests/global-setup.ts`, `tests/tests/fixtures/shared/emailBucket.fixture.ts`, `tests/scripts/e2e-run.sh`
- `render.example.yaml`; `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`
- `.planning/todos/pending/`: `2026-10-08-next-milestone-…`, `2026-10-07-174-hosted-project-auth-settings-…`, `2026-10-07-174-no-per-caller-limit-…`, `2026-10-07-174-auth-service-otp-endpoint-…`, `2026-10-07-174-allowlist-probe-…`, `2026-09-02-deployment-guide-production-redirect-allowlist`, `2026-10-02-deployment-config-gaps-found-by-docs-rewrite`, `2026-09-18-document-supabase-api-limits-for-deployments`, `2026-09-03-ci-e2e-ssr-500`, `2026-09-03-consolidate-supabase-hosting-ci-jobs`, `2026-10-03-auth-cookie-cache-control-vs-route-setheaders`, `2026-10-03-supabase-config-inbucket-section-deprecated`, `2026-08-31-evaluate-self-hosted-posthog-log-sink`, `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e`

Vendor documentation read in this session (`[DOCS]`, MEDIUM):

- Supabase — Edge Function limits: https://supabase.com/docs/guides/functions/limits
- Supabase — Auth rate limits and `Sb-Forwarded-For`: https://supabase.com/docs/guides/auth/rate-limits
- Supabase — custom SMTP and the built-in provider's restrictions: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase — API keys and the legacy-key deprecation: https://supabase.com/docs/guides/api/api-keys
- Supabase — database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase — CLI reference (`db push`, `db reset --linked`, `config push`): https://supabase.com/docs/reference/cli/supabase-db-push
- Supabase — branching configuration and `[remotes]`: https://supabase.com/docs/guides/deployment/branching/configuration
- Supabase — config as code: https://supabase.com/blog/cli-v2-config-as-code
- Supabase — free project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase — Terraform provider: https://github.com/supabase/terraform-provider-supabase and https://supabase.com/docs/guides/deployment/terraform
- Supabase — IPv4/IPv6 compatibility: https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP
- Supabase — Management API rate limits: https://supabase.com/docs/reference/api/introduction
- Supabase — Postgres 17 release notes: https://supabase.com/changelog/35851-forthcoming-postgres-17-release-notes
- PostHog — anonymous and identified events: https://posthog.com/docs/data/anonymous-vs-identified-events
- PostHog — capture API: https://posthog.com/docs/api/capture
- PostHog — Node SDK: https://posthog.com/docs/libraries/node
- PostHog — controlling data collection: https://posthog.com/docs/privacy/data-collection
- PostHog — bot and traffic detection: https://posthog.com/docs/web-analytics/bot-detection
- PostHog — cookieless tracking (read through search excerpts only; the page body did not load): https://posthog.com/docs/privacy/cookieless-tracking
- HashiCorp — S3 backend: https://developer.hashicorp.com/terraform/language/backend/s3
- GitHub — OpenID Connect in AWS: https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- AWS — SES SMTP endpoints: https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html
- AWS — SES sandbox and production access: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
- SvelteKit — adapter-node: https://svelte.dev/docs/kit/adapter-node

Located but not read, or secondary (`[UNVERIFIED]`, LOW):

- EDPB Guidelines 2/2023 on the technical scope of Art. 5(3) ePrivacy Directive, v2.0 (7 October 2024): https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en — the PDF was fetched and could not be parsed here; its conclusions on IP-only tracking and locally held information are not quoted.
- CNIL, sheet no. 16 on audience measurement: https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications — conditions taken from a search summary.
- One third-party report on `supabase config push` resetting omitted auth keys to template defaults (CLI v2.116.0); no official confirmation found.
- From training data, not re-checked: Terraform version that introduced `use_lockfile`; NAT gateway and load balancer pricing; load balancer idle timeout versus Node keep-alive; SvelteKit chunk 404s during mixed-version rollouts; `sendBeacon` and `keepalive` size caps; content-blocker path rules; visibility of public-repository workflow artifacts; Supabase Free-plan file-size limit and project count; preview-branch seeding; `supabase seed buckets`.

---
*Pitfalls research for: v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay*
*Researched: 2026-10-10*

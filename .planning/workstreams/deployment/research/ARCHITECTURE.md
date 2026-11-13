# Architecture Research

**Domain:** Deployment of an existing SvelteKit + Supabase application (AWS by Terraform, hosted Supabase) and a first-party analytics relay
**Milestone:** v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay
**Researched:** 2026-10-10
**Confidence:** HIGH for everything read from this repository; MEDIUM for external tooling facts (verified against official docs or the provider's repository); LOW items are marked where they appear

Scope: only what integrates the new capabilities. The existing application architecture is described where a new component attaches to it and nowhere else.

---

## 1. What the code says today (the facts the design rests on)

Every row was read from the tree at `feat/deployment-terraform-supabase`.

| Fact | Where | Consequence for this milestone |
|------|-------|--------------------------------|
| The frontend reads all configuration at run time: `$env/dynamic/public` and `$env/dynamic/private` | `apps/frontend/src/lib/utils/constants.ts`, `apps/frontend/src/lib/server/constants.ts` | One image is promotable across environments. Nothing environment-specific is baked in at build time except `staticSettings.ts` (fork-and-edit). |
| `PUBLIC_PROJECT_ID` has no fallback; the adapter throws at construction when it is unset | `.env.example` § Project scoping; `supabaseAdapter.ts` | It must be in the task definition. Neither `render.example.yaml` nor `docker-compose.dev.yml` passes it today. |
| The same project id is read by the frontend and by `identity-callback`, `send-email` and `account-access`, under one name | `apps/supabase/supabase/config.toml` `[edge_runtime.secrets]`; `functions/.env.example` | One Terraform value must feed two runtimes. `.env.example` states that no existing guard can compare a deployed function's configuration with a separately configured frontend host; Terraform closes that gap by construction. |
| Four more variables exist twice (`PUBLIC_` twin for the frontend, un-prefixed for Deno) and must agree | `.env.example` § Cross-runtime environment pairs | Same: one Terraform local, two sinks. |
| The production image is the `production` target of `apps/frontend/Dockerfile`, built from the repo root; it copies all of `apps/`, `packages/`, `scripts/` | `apps/frontend/Dockerfile` | Anything placed under `apps/` lands in the image and invalidates its layer cache. Terraform must not live under `apps/`. |
| `main.yaml`'s `docker-image-build` job is asserted by a unit test to have no push, no registry login, no secrets and no third-party action | `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` | Publishing the image belongs in a separate workflow file. Modifying that job reddens the unit suite. |
| CI triggers: `push` to `main` and to `ci-evidence/**`; `pull_request` to `main`; `paths-ignore` for Markdown | `.github/workflows/main.yaml` lines 3-37 | See § 6 for the evidence channel. |
| `config.toml` configures the local stack only; hosted settings are set by hand today | `config.toml` (the `max_rows` comment), deployment guide § 2-3 | `max_rows = 50000`, `enable_signup = false`, `enable_confirmations = true`, the access-token hook, `site_url` and the two redirect entries all need a hosted owner. |
| The two storage buckets are declared only in `config.toml`; the migration creates their policies, not the buckets | `config.toml` `[storage.buckets.*]`; `schema/400-storage.sql`; todo `2026-10-02-deployment-config-gaps…` item 4 | A hosted project has no buckets until something creates them. |
| `seed.sql` creates the default account, the default project, `storage_config` (Storage URL + service-role key, read by `pg_net` cleanup triggers) and `private.deployment_settings.behind_cloudflare`; it is local-only and creates test users | `apps/supabase/supabase/seed.sql`; deployment guide § 2.5-2.7 | A hosted project needs a separate, idempotent bootstrap for those four things. `private` is not exposed through PostgREST, so one of them needs SQL access. |
| `ensureProject()` attaches every project to account `…0001` and relies on `seed.sql` having inserted it | `packages/dev-seed/src/supabaseAdminClient.ts` (`DEFAULT_ACCOUNT_ID`) | On a hosted database the E2E global setup fails on a foreign key unless the bootstrap creates that account. |
| Every service-role client refuses a non-local Supabase host unless `--allow-remote` or `DEV_SEED_ALLOW_REMOTE=1` | `packages/dev-seed/src/localSupabaseUrl.ts` | Remote seeding is possible by an existing, deliberate opt-out. No new mechanism is needed. |
| Playwright's `baseURL` is `http://localhost:${FRONTEND_PORT}`; `globalSetup` asserts the target is this checkout's Vite dev server by probing `/@fs` | `tests/playwright.config.ts` (`use.baseURL`); `tests/global-setup.ts`; `tests/tests/support/preflight.ts` | The existing gate suite cannot target a deployed URL, by design: the identity clause is unsatisfiable against a production build. |
| The served document publishes the configured project id on `<body data-project-id>` | `apps/frontend/src/app.html`; `hooks.server.ts` `transformPageChunk` | `assertServedProject` works unchanged against a production build. |
| `tests/scripts/e2e-run.sh` starts local Supabase, spawns and owns a dev server and polls local Storage | `tests/scripts/e2e-run.sh` | Not reusable for a deployed run. |
| Mailed links are read from the local Mailpit | `tests/tests/fixtures/shared/emailBucket.fixture.ts`, `tests/tests/utils/mailedLink.ts` | Any spec that follows an email cannot run against a hosted project without a mail catcher. |
| Analytics: `TrackingServiceImpl` buffers events and hands them to a handler the root layout installs from `UmamiAnalytics.svelte`, which loads `https://cloud.umami.is/script.js` and calls `window.umami.track` | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts`; `apps/frontend/src/routes/+layout.svelte`; `apps/frontend/src/lib/components/analytics/umami/` | The provider is chosen in the browser. This is the seam the relay replaces. |
| The tracking gate is `browser && analytics.trackEvents && consent === 'granted'`; the session id lives in `sessionStorage` (`appContext-sessionId`); consent lives in `localStorage` (`appContext-userPreferences.dataCollection`) | `trackingService.svelte.ts`; `userPreferences.type.ts` | Both storage writes and the consent gate go, per the operator's decision. |
| The survey link interpolates the same session id | `apps/frontend/src/lib/contexts/app/survey.svelte.ts` | The id must survive as an in-memory value or the `{sessionId}` template breaks. |
| About 30 call sites use `startEvent` / `track` | `grep -rn "startEvent\|track(" apps/frontend/src` | The consumer-facing API must not change. |
| An API route with a server-side writer already exists | `apps/frontend/src/routes/api/feedback/+server.ts`; `apps/frontend/src/lib/api/base/universalApiRoutes.ts` | The relay route has a direct analog and a home for its path constant. |

---

## 2. System overview

```
                           Operator-supplied, once
   ┌──────────────────────────────────────────────────────────────────────┐
   │ AWS account + region · Supabase org + access token · PostHog project │
   │ token · SMTP credentials · (optional) DNS zone                       │
   └───────────────┬──────────────────────────────────────────────────────┘
                   │ GitHub Environment secrets / tfvars
                   ▼
 ┌───────────────────────────── Provisioning plane ─────────────────────────────┐
 │                                                                              │
 │  infra/terraform/bootstrap      infra/terraform/envs/<env>                   │
 │  (applied once, by hand)        (applied by the pipeline)                    │
 │  ┌──────────────────────┐       ┌───────────────┐  ┌──────────────────────┐  │
 │  │ state bucket         │       │ module        │  │ module               │  │
 │  │ GitHub OIDC provider │       │ supabase-     │  │ frontend-service     │  │
 │  │ deploy role          │       │ project       │  │ (+ network)          │  │
 │  │ ECR repository       │       └───────┬───────┘  └──────────┬───────────┘  │
 │  └──────────────────────┘               │ ref, URL, anon key  │ public URL   │
 │                                         └──────────┬──────────┘              │
 │                                                    │ terraform output        │
 │  infra/scripts (Supabase CLI + psql)  ◄────────────┘                         │
 │  db push · functions deploy · bootstrap.sql                                  │
 └───────────────────────────────┬──────────────────────────────────────────────┘
                                 │
 ┌───────────────────────────────▼───────────── Runtime plane ──────────────────┐
 │                                                                              │
 │   Browser ──HTTPS──► load balancer ──► frontend container (adapter-node)     │
 │      │                                   │  hooks.server.ts                  │
 │      │                                   │  routes/api/health      (new)     │
 │      │   POST /api/analytics (new) ─────►│  routes/api/analytics   (new)     │
 │      │                                   │      └─► AnalyticsProvider ──────────► PostHog
 │      │                                   │  SSR loads ──┐                    │
 │      └── supabase-js (PUBLIC_SUPABASE_URL) ─────────────┴──► Hosted Supabase │
 │                                             Postgres 17 · Auth · Storage ·   │
 │                                             3 Edge Functions                 │
 └──────────────────────────────────────────────────────────────────────────────┘
                                 ▲
 ┌───────────────────────────────┴───────────── Verification plane ─────────────┐
 │  .github/workflows/deploy.yaml:  image → plan → apply → backend deploy →     │
 │  build-identity preflight → remote seed → Playwright deployed subset         │
 └──────────────────────────────────────────────────────────────────────────────┘
```

The browser keeps talking to Supabase directly for data; that does not change. The only new first-party hop is the analytics relay.

### Component responsibilities

| Component | Responsibility | New or modified |
|-----------|----------------|-----------------|
| `infra/terraform/bootstrap` | The things the pipeline itself needs before it can run: state bucket, GitHub OIDC trust, deploy role, image repository | NEW |
| `infra/terraform/modules/supabase-project` | The hosted project, its settings, its Edge Function secrets, its API keys as outputs | NEW |
| `infra/terraform/modules/frontend-service` | Running one container image behind HTTPS with an environment and a set of secrets; emits `public_origin` | NEW |
| `infra/terraform/envs/<env>` | Composition: wires one value to every sink that needs it | NEW |
| `infra/scripts/` | The Supabase CLI and SQL steps Terraform does not own | NEW |
| `.github/workflows/deploy.yaml` | Plan, apply, deploy, smoke | NEW |
| `apps/frontend/src/routes/api/analytics/+server.ts` + `apps/frontend/src/lib/server/analytics/` | The relay and the provider interface | NEW |
| `apps/frontend/src/lib/contexts/app/tracking/` | The client emitter; same consumer API, new transport, no storage, no consent gate | MODIFIED |
| `tests/playwright.deployed.config.ts` + `tests/global-setup.deployed.ts` | A second, small Playwright entry that targets a URL | NEW |
| `tests/playwright.config.ts`, `tests/global-setup.ts`, `tests/scripts/e2e-run.sh` | The local gate suite | UNCHANGED (deliberately; see Pattern 5) |

---

## 3. Recommended project structure

```
infra/                                   # NEW top-level directory, not a Yarn workspace
├── README.md                            # operator runbook: bootstrap, first apply, teardown
├── terraform/
│   ├── bootstrap/                       # applied once with operator credentials
│   │   ├── main.tf                      # S3 state bucket, OIDC provider, deploy role, ECR repo
│   │   ├── variables.tf                 # github_repository, allowed environment name
│   │   └── outputs.tf                   # state_bucket, deploy_role_arn, ecr_repository_url
│   ├── modules/
│   │   ├── supabase-project/
│   │   │   ├── main.tf                  # supabase_project, supabase_settings,
│   │   │   │                            # supabase_edge_function_secrets, data.supabase_apikeys
│   │   │   ├── variables.tf             # public_origin, app_project_id, smtp_*, identity_provider_*, rate limits
│   │   │   └── outputs.tf               # project_ref, api_url, anon_key, service_role_key (sensitive), db_password (sensitive)
│   │   ├── network/                     # VPC, public subnets, security groups
│   │   └── frontend-service/
│   │       ├── main.tf                  # cluster, task definition, service, load balancer, certificate, logs, IAM, secrets
│   │       ├── variables.tf             # image, environment (map), secrets (map), domain (optional)
│   │       └── outputs.tf               # public_origin, service_name, cluster_name
│   └── envs/
│       ├── test/                        # the stack the pipeline applies and exercises
│       │   ├── backend.tf               # S3 backend, use_lockfile = true, key = openvaa/test/terraform.tfstate
│       │   ├── main.tf                  # module composition (§ 5 shows the wiring)
│       │   ├── variables.tf
│       │   ├── outputs.tf               # everything infra/scripts and the smoke job read
│       │   └── terraform.tfvars         # non-secret values only
│       └── example/                     # the copy-me reference deployment (successor of render.example.yaml)
└── scripts/
    ├── deploy-backend.sh                # supabase link → db push → functions deploy
    ├── bootstrap.sql                    # idempotent rows a hosted database needs (§ 4)
    └── export-outputs.sh                # terraform output -json → masked $GITHUB_ENV

.github/workflows/deploy.yaml            # NEW
apps/frontend/src/routes/api/health/+server.ts          # NEW
apps/frontend/src/routes/api/analytics/+server.ts       # NEW
apps/frontend/src/lib/server/analytics/                 # NEW
tests/playwright.deployed.config.ts                     # NEW
tests/global-setup.deployed.ts                          # NEW
tests/tests/specs/deployed/                             # NEW: hosted-only probes
```

### Structure rationale

- **`infra/` at the repo root, not `apps/infra`.** `apps/frontend/Dockerfile` runs `COPY apps apps`, so a directory under `apps/` enters the image and its `.terraform/` cache would bust the install layer. The root `workspaces` list is `packages/*` and `apps/*`; Terraform is neither built by Turborepo nor resolved by Yarn, so it gains nothing from being a workspace. Add `infra/**/.terraform/`, `*.tfstate*` and `*.auto.tfvars` to `.gitignore` and `.prettierignore` (root `prettier --check .` walks the whole tree).
- **`bootstrap/` separate from `envs/`.** The state bucket and the role the pipeline assumes cannot be created by the pipeline that needs them. This layer is small, changes almost never, and is the one apply that needs a human with administrator credentials.
- **Directories per environment, not Terraform workspaces.** Each environment has its own backend key and its own variable file in plain sight. A forking organisation copies `envs/example/` and edits one file; with workspaces the differences would be hidden in CLI state.
- **Modules cut at the ownership line, not the vendor line.** `supabase-project` and `frontend-service` each expose a narrow interface; the environment root is the only place a value crosses from one to the other. The internals of `frontend-service` (explicit Fargate service with a load balancer, or ECS Express Mode) can change without touching the wiring.
- **`infra/scripts/` beside Terraform, not under `apps/supabase`.** These scripts are deployment procedure that consumes Terraform outputs. `apps/supabase` stays what it is: schema, functions and local-stack configuration.

---

## 4. The Terraform / Supabase CLI boundary

**Rule: Terraform owns what exists and how it is configured. The Supabase CLI owns what ships with a commit. A bootstrap script owns rows in the application database.**

| Concern | Owner | Mechanism | Why this owner |
|---------|-------|-----------|----------------|
| Project existence, region, instance size | Terraform | `supabase_project` | Declarative, has a lifecycle, produces the ref everything else depends on |
| API keys | Terraform (read) | `data.supabase_apikeys` | The anon key is an input of the frontend's task definition |
| API settings (`max_rows` = `dataAdapter.pageSize` = 50000, exposed schemas) | Terraform | `supabase_settings.api` | Today a dashboard click; silently truncates responses at 1000 rows when forgotten |
| Auth settings: site URL, redirect allowlist, sign-up closed, confirmations on, access-token hook, SMTP, rate limits | Terraform | `supabase_settings.auth` | The four "never observed on a hosted project" items of todo `2026-10-07-174-hosted-project-auth-settings…` become reviewed code |
| Edge Function secrets (`PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_*`, `IDENTITY_PROVIDER_*`) | Terraform | `supabase_edge_function_secrets` | They are configuration, and several are twins of frontend variables: one value, two sinks |
| Schema (migrations) | Supabase CLI | `supabase db push` | Ordered, versioned with the code, and already the repo's unit of schema change |
| Edge Function code | Supabase CLI | `supabase functions deploy` (`identity-callback` with `--no-verify-jwt`) | Ships per commit. The provider's `supabase_edge_function` resource exposes no JWT-verification argument, and `identity-callback` must run without it |
| Storage buckets | Migration (recommended) | `INSERT INTO storage.buckets … ON CONFLICT DO NOTHING` in `schema/400-storage.sql`, then `yarn schema:regenerate` | The policies already live there; one source for local and hosted. See research flag F3 |
| Default account, the deployment's project row, its `app_settings` row, `storage_config`, `behind_cloudflare` | `infra/scripts/bootstrap.sql` | `psql` over the pooler, parameters from Terraform outputs | Rows, not infrastructure. `private.deployment_settings` is not reachable through the API |
| Election data | Admin App / import for a real deployment; `yarn db:seed --template e2e/base --allow-remote` for the test stack | existing tools | Unchanged |
| `apps/supabase/supabase/config.toml` | Local stack only | unchanged | See Anti-Pattern 1 |

Provider facts (MEDIUM, read from `supabase/terraform-provider-supabase` v1.11.0, released 2026-09-02): resources `supabase_project`, `supabase_settings`, `supabase_apikey`, `supabase_branch`, `supabase_edge_function`, `supabase_edge_function_secrets`, `supabase_third_party_auth`; data sources `supabase_apikeys`, `supabase_branch`, `supabase_network_bans`, `supabase_pooler`. `supabase_settings` takes each block as a JSON string. `supabase_edge_function_secrets` stores plaintext values in state and rejects names starting with `SUPABASE_`. There is no resource for migrations or for buckets.

**A parity guard keeps the two worlds honest.** `config.toml` remains the local truth and Terraform becomes the hosted truth, so the same decision is written twice. Follow the repository's own pattern (`scripts/assert-auth-signup-closed.mjs`, `scripts/assert-env-pair-registry.mjs`): a new `scripts/assert-hosted-settings-parity.mjs` that reads `config.toml` and the Terraform module and fails when `max_rows`, the sign-up and confirmation switches, the hook URI or the shape of the redirect entries disagree. Wire it into `yarn lint:check`.

---

## 5. Data and secret flow

### One value, every sink

```
terraform variable / resource             sinks
────────────────────────────────────────────────────────────────────────────────
var.app_project_id                ──►  frontend task env  PUBLIC_PROJECT_ID
                                  ──►  edge secret        PUBLIC_PROJECT_ID
                                  ──►  bootstrap.sql      projects.id, app_settings.project_id

module.frontend.public_origin     ──►  supabase_settings.auth  site_url
                                  ──►  supabase_settings.auth  uri_allow_list:
                                         <origin>/api/auth/callback, <origin>/*/api/auth/callback
                                  ──►  edge secret        SITE_URL
                                  ──►  frontend task env  ORIGIN

module.supabase.api_url           ──►  frontend task env  PUBLIC_SUPABASE_URL
                                  ──►  bootstrap.sql      storage_config.supabase_url
data.supabase_apikeys.anon_key    ──►  frontend task env  PUBLIC_SUPABASE_ANON_KEY
data.supabase_apikeys.service_role_key
                                  ──►  bootstrap.sql      storage_config.service_role_key
                                  ──►  smoke job env      SUPABASE_SERVICE_ROLE_KEY (masked)
                                  ✗    NEVER the frontend task

var.identity_provider_type        ──►  frontend task env  PUBLIC_IDENTITY_PROVIDER_TYPE
                                  ──►  edge secret        IDENTITY_PROVIDER_TYPE
var.identity_provider_client_id   ──►  both twins, same way

var.smtp_*                        ──►  supabase_settings.auth  (Auth mail)
                                  ──►  edge secrets       SMTP_HOST / PORT / FROM / USER / PASS

var.analytics_provider, var.posthog_host
                                  ──►  frontend task env  ANALYTICS_PROVIDER, ANALYTICS_POSTHOG_HOST
var.posthog_project_token         ──►  secret store ──►   frontend task secret ANALYTICS_POSTHOG_KEY
random_password.analytics_salt    ──►  secret store ──►   frontend task secret ANALYTICS_SALT_SECRET

var.image_tag (git SHA)           ──►  frontend task definition image
random_password.db                ──►  supabase_project.database_password
                                  ──►  deploy-backend.sh  SUPABASE_DB_PASSWORD
```

Additional runtime variables the task definition must carry, none of which exist in any template today:

| Variable | Value | Reason |
|----------|-------|--------|
| `ORIGIN` | the public origin | adapter-node derives the request origin from the `host` header; setting it removes the dependency on what the load balancer forwards. LOW confidence on the exact mechanism in adapter-node 5.5.7: the current upstream docs describe `paths.origin` in the Vite config instead, which may belong to a newer major. Verify against the installed version in the phase. |
| `ADDRESS_HEADER=X-Forwarded-For`, `XFF_DEPTH=<number of trusted proxies>` | 1 behind a load balancer alone | `event.getClientAddress()` otherwise returns the load balancer's address; the relay's visitor hash needs the client's |
| `PORT=3000`, `HOST=0.0.0.0` | defaults | explicit beats implicit in a task definition |
| `PUBLIC_LOG_LEVEL` | `warn` or `info` | server logs reach the container log group |

`PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` have no consumer outside `constants.ts` (todo `2026-10-02-deployment-config-gaps…` item 2). Do not carry them into the task definition; decide their removal in the same phase.

### Where secrets rest

| Secret | Rests in | Reaches the runtime by |
|--------|----------|------------------------|
| Supabase access token | GitHub Environment secret | `SUPABASE_ACCESS_TOKEN` for the provider and the CLI |
| AWS credentials | nowhere | GitHub OIDC, short-lived, role from `bootstrap/` |
| Database password | Terraform state (generated) | `terraform output` into the backend-deploy step |
| Service-role key | Terraform state (data source) and the `storage_config` table | bootstrap script; smoke job |
| Edge Function secrets | Terraform state (plaintext, by the provider's design) and the Supabase project | the Edge runtime |
| PostHog token, analytics salt | AWS secret store | task-definition `secrets` |

The state file therefore holds the database password, the service-role key and every Edge Function secret. The bucket must be encrypted, versioned, private, and readable only by the deploy role and the operator.

### Image build and publish

1. `docker build --file apps/frontend/Dockerfile --target production --build-arg BUILD_SHA=$GITHUB_SHA .` The Dockerfile gains one `ARG`; `apps/frontend/svelte.config.js` sets `kit.version.name` from it, so the build's identity is served at `/_app/version.json`.
2. Push to the repository created by `bootstrap/`, tagged with the commit SHA. Never `latest`.
3. `terraform apply -var image_tag=$GITHUB_SHA`. Terraform is the only writer of the task definition. Do not also call `aws ecs update-service`: two writers produce drift on the next plan.

The image needs no rebuild per environment. It does need a rebuild per fork, because `staticSettings.ts` is compiled in.

### Request flow of the analytics relay

```
component            TrackingService           relayTransport            /api/analytics             AnalyticsProvider
   │ startEvent(name) ─► buffer                    │                          │                          │
   │                     │                         │                          │                          │
   │ (navigation, visibilitychange, destroy)       │                          │                          │
   │                     └─ submitAllEvents ──────►│ sendBeacon(JSON batch)   │                          │
   │                                               └─────────────────────────►│ validate (zod, allowlist,│
   │                                                                          │ size caps, same origin)  │
   │                                                                          │ enrich: visitorHash,     │
   │                                                                          │ projectId, receivedAt    │
   │                                               ◄──────── 204 ─────────────┤                          │
   │                                                                          └─ capture(batch) ────────►│ POST <host>/batch/
```

The route answers before the provider call resolves; a slow or failing provider never delays or fails the browser's request. Provider errors go to the structured logger (`@openvaa/app-shared` `log.warn`) with a constant message.

---

## 6. Architectural patterns

### Pattern 1: Composition root wires twins

**What:** the environment root computes each shared value once and passes it to both modules.
**When:** every value in § 5 with more than one sink.
**Trade-off:** `frontend-service` and `supabase-project` reference each other's outputs (origin one way, URL and key the other). The graph stays acyclic because `supabase_project` and `supabase_settings` are separate resources: project → keys → task definition; load balancer → origin → settings.

```hcl
module "supabase" {
  source         = "../../modules/supabase-project"
  public_origin  = module.frontend.public_origin
  app_project_id = var.app_project_id
}

module "frontend" {
  source = "../../modules/frontend-service"
  image  = "${var.ecr_repository_url}:${var.image_tag}"
  environment = {
    PUBLIC_SUPABASE_URL      = module.supabase.api_url
    PUBLIC_SUPABASE_ANON_KEY = module.supabase.anon_key
    PUBLIC_PROJECT_ID        = var.app_project_id
    ANALYTICS_PROVIDER       = var.analytics_provider
  }
}
```

If the origin comes from a domain variable rather than from a generated load-balancer name, the cross-reference disappears and `public_origin` is a plain local.

### Pattern 2: Server-side provider interface, selected by environment

**What:** the browser knows one endpoint. The server holds an interface with one real implementation and a null one, chosen at process start from a private variable.
**When:** always. This is what makes the service swappable per deployment without touching the client or rebuilding the image.

```ts
// apps/frontend/src/lib/server/analytics/analyticsProvider.type.ts
export interface AnalyticsProvider {
  readonly name: string;
  capture(batch: EnrichedBatch): Promise<void>;
}

// apps/frontend/src/lib/server/analytics/index.ts
export function getAnalyticsProvider(): AnalyticsProvider {
  switch (constants.ANALYTICS_PROVIDER) {
    case 'posthog': return createPostHogProvider({ host: constants.ANALYTICS_POSTHOG_HOST, token: constants.ANALYTICS_POSTHOG_KEY });
    case 'log':     return logProvider;   // writes each batch through the shared logger; for local use
    default:        return noopProvider;  // unset means off; never throws
  }
}
```

The PostHog implementation is a plain `fetch` to `<host>/batch/` with `$process_person_profile: false` on every event; no SDK. The relay already receives batches, so an SDK's own queue and flush timer would add a shutdown concern and nothing else.

Three levels of swap, each cheaper than the last: change `ANALYTICS_PROVIDER` in Terraform (no build); add a file under `providers/` and a `case` (one PR); set `analytics.trackEvents` to `false` in the project's `app_settings` (the client stops emitting).

### Pattern 3: Identity derived on the server, never stored on the client

**What:** two identifiers, neither written to any browser storage.

- `pageSessionId`: a UUID created in memory when the client application boots. It lives as long as the document does (client-side navigations keep it; a reload does not). It replaces `sessionStorageState('appContext-sessionId', …)` and still feeds `survey.svelte.ts`.
- `visitorHash`: computed in the relay as an HMAC over client address, user agent, host and project id, keyed with a salt that changes daily. The daily salt is itself derived (`HMAC(ANALYTICS_SALT_SECRET, UTC date)`), so every task of the service computes the same hash without shared state.

**Trade-off:** a derived daily salt can be recomputed by anyone holding the secret, the address and the user agent; a random salt discarded each day cannot, but needs shared storage across tasks. The derived form is the right default for a stateless service; state the property in the privacy text.

The client address and user agent do not need to leave the relay. The PostHog adapter sends `distinct_id = visitorHash` and omits `$ip`.

"No client-side storage" is read here as: the analytics path writes none. The application's functional storage (voter answers in `localStorage`, feedback and survey status) is untouched. Confirm this reading with the operator.

### Pattern 4: The deployed build proves its own identity

**What:** the local suite refuses to run against a server it cannot identify as this checkout. A deployed run needs the equivalent, and the equivalent for a production build is the commit: `GET <base>/_app/version.json` must return the SHA the pipeline built.
**When:** first step of the deployed global setup, before anything is written to the database. Then `assertServedProject` (unchanged logic), then `ensureProject()`.
**Why:** a load balancer still serving the previous task set returns green results for the wrong build. The repository's rule is that the response is the thing under test.

### Pattern 5: A second Playwright entry, not a mode switch

**What:** `tests/playwright.deployed.config.ts` with its own `globalSetup`, `baseURL` from a required `DEPLOYED_BASE_URL`, and a short project list that reuses existing setup files, fixtures and specs.
**Why not a flag in `tests/playwright.config.ts`:** that file is 1400 lines of config-load guards and a project graph calibrated for a local dev server (perf budgets, visual baselines, the perm serial chain over the `app_settings` singleton). A branch inside it puts the cardinal rule's suite at risk for every change to the deployed path. A second entry leaves the gate suite byte-identical.

Deployed subset, in dependency order:

| Project | Reuses | Notes |
|---------|--------|-------|
| `data-setup-base` | `tests/tests/setup/shared/base.setup.ts` | Seeds `e2e/base` under the stack's project; needs `DEV_SEED_ALLOW_REMOTE=1` |
| `deployed-probes` | new `tests/tests/specs/deployed/*.spec.ts` | API-level: `/api/health`; `/auth/v1/settings` holds `disable_signup: true` and `mailer_autoconfirm: false`; a read returns more than 1000 rows or the configured cap; `account-access` `check-code` with the anon key; `POST /api/analytics` returns 204 |
| `voter-smoke` | voter fixtures; a slim spec or the existing journey | Read path through the hosted API and Storage |
| `auth-setup` + one contestant spec | `tests/tests/setup/shared/auth.setup.ts` | Force-registers through the admin API (no email); a successful login proves the access-token hook on the hosted project |
| `data-teardown-base` | `tests/tests/setup/shared/base.teardown.ts` | Leaves the stack reusable |

Excluded from the first version: anything that follows a mailed link (no Mailpit), the perm chain, visual regression, perf budgets, bank auth.

Seed data on the hosted project: the test stack's `app_project_id` is the harness's own `00000000-0000-0000-0000-0000000000e2`, so the deployed frontend serves the project the suite seeds and `assertServedProject` passes with no override. The bootstrap script creates account `…0001`; `ensureProject()` creates the project and settings rows; `e2e/base` supplies the content.

### Pattern 6: The evidence channel for a workflow that holds credentials

**What exists:** `main.yaml` runs on pushes to `ci-evidence/**`. GitHub uses the workflow file from the pushed commit for `push` events, so the glob is live on the first push of a branch that carries it; `workflow_dispatch` cannot substitute, because it exists only for workflows on the default branch. `paths-ignore` still applies, so an evidence commit must touch a non-Markdown path. The standing practice is to push a squashed, source-only tree without `.planning/`, because the repository is public.

**What the deploy workflow needs:** the same mechanism under its own namespace. `deploy.yaml` triggers on `workflow_dispatch` (usable after merge) and on `push` to `deploy-evidence/**`. It must not listen on `ci-evidence/**`, or every unrelated evidence push would deploy.

**The difference that matters:** this workflow receives cloud credentials. A push glob means any branch matching it executes that commit's workflow file. Bind the credentials to a GitHub Environment (for example `deploy-test`): the secrets and the OIDC subject (`repo:<org>/<repo>:environment:deploy-test`) are released only to jobs that name the environment, and the environment's protection rules (deployment branch pattern, optional required reviewer) are enforced by GitHub rather than by the workflow file.

A credential-free job (`terraform fmt -check`, `terraform init -backend=false`, `terraform validate`) belongs in `main.yaml`, where it runs on every pull request.

---

## 7. New versus modified, by file

### Deployment

| Path | Status | Change |
|------|--------|--------|
| `infra/**` | NEW | § 3 |
| `.github/workflows/deploy.yaml` | NEW | Pattern 6; § 8 for the job order |
| `.github/workflows/main.yaml` | MODIFIED | add a credential-free `infra-validate` job; leave `docker-image-build` untouched |
| `apps/frontend/Dockerfile` | MODIFIED | `ARG BUILD_SHA`; optionally a non-root user and a `HEALTHCHECK` |
| `apps/frontend/svelte.config.js` | MODIFIED | `kit.version.name` from the build argument |
| `apps/frontend/src/routes/api/health/+server.ts` | NEW | answers without touching Supabase, so a database outage does not take the service out of rotation |
| `apps/supabase/supabase/schema/400-storage.sql` + `migrations/00001_initial_schema.sql` | MODIFIED | create the two buckets idempotently; regenerate with `yarn schema:regenerate` |
| `packages/dev-seed/src/supabaseAdminClient.ts` | MODIFIED or left | either `ensureProject()` upserts the default account, or `bootstrap.sql` owns it; pick one |
| `scripts/assert-hosted-settings-parity.mjs` | NEW | § 4 |
| `.gitignore`, `.prettierignore` | MODIFIED | Terraform working files |
| `render.example.yaml`, `docker-compose.dev.yml` | MODIFIED | add `PUBLIC_PROJECT_ID` (confirmed missing); decide whether the Render template stays as an alternative |
| `.env.example` | MODIFIED | `ANALYTICS_*` server-only block; they have no `PUBLIC_` twin and are not registry pairs |
| `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` and the environment-variables page | MODIFIED | rewritten around the Terraform path; the hand-made steps become "what Terraform does" |

### E2E against a deployed URL

| Path | Status | Change |
|------|--------|--------|
| `tests/playwright.deployed.config.ts` | NEW | Pattern 5 |
| `tests/global-setup.deployed.ts` | NEW | Pattern 4 |
| `tests/tests/support/servedProject.ts` | NEW (extraction) | move `assertServedProject` out of `tests/global-setup.ts` so both setups import it |
| `tests/global-setup.ts` | MODIFIED | import only; behaviour unchanged |
| `tests/tests/specs/deployed/*.spec.ts` | NEW | hosted-only probes |
| `tests/tests/utils/supabaseAdminClient.ts` | MODIFIED if used | line with `SUPABASE_URL.replace('54321', '5173')` assumes local ports; parametrise before any deployed spec reaches it |
| `tests/playwright.config.ts`, `tests/scripts/e2e-run.sh`, `tests/tests/support/preflight.ts` | UNCHANGED | |
| `package.json` | MODIFIED | `test:e2e:deployed` script |

### Analytics relay

| Path | Status | Change |
|------|--------|--------|
| `apps/frontend/src/routes/api/analytics/+server.ts` | NEW | `POST`: validate, enrich, answer 204, dispatch |
| `apps/frontend/src/lib/server/analytics/analyticsProvider.type.ts` | NEW | the interface |
| `apps/frontend/src/lib/server/analytics/index.ts` | NEW | provider selection |
| `apps/frontend/src/lib/server/analytics/relay.ts` | NEW | validation, caps, enrichment |
| `apps/frontend/src/lib/server/analytics/visitorHash.ts` | NEW | Pattern 3 |
| `apps/frontend/src/lib/server/analytics/providers/{posthog,noop,log}.ts` | NEW | one real implementation, two trivial ones |
| `apps/frontend/src/lib/contexts/app/tracking/relayTransport.ts` | NEW | `navigator.sendBeacon` with a JSON `Blob`; `fetch(..., { keepalive: true })` fallback |
| `apps/frontend/src/lib/contexts/app/tracking/relayContract.ts` | NEW | zod schema of the batch and its limits, imported by client and server |
| `apps/frontend/src/lib/api/base/universalApiRoutes.ts` | MODIFIED | the route constant |
| `apps/frontend/src/lib/server/constants.ts` | MODIFIED | `ANALYTICS_PROVIDER`, `ANALYTICS_POSTHOG_HOST`, `ANALYTICS_POSTHOG_KEY`, `ANALYTICS_SALT_SECRET` |
| `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` | MODIFIED | gate becomes `browser && trackEvents`; session id in memory; transport internal; flush sends an array of discrete events instead of the `NN__name` keys packed into one `pageview` (that packing existed for Umami's 50-property limit) |
| `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts` | MODIFIED | `sendTrackingEvent` and `TrackingHandler` removed |
| `apps/frontend/src/lib/contexts/app/tracking/trackingEvent.type.ts` | MODIFIED | `dataConsent_granted` removed; the name union becomes the relay's allowlist |
| `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts` | MODIFIED | it locks the producer's exact own-key surface |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts`, `appContext.type.ts` | MODIFIED | drop the `sendTrackingEvent` forward and `setDataConsent` |
| `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`, `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | MODIFIED | drop the `setDataConsent` forwards |
| `apps/frontend/src/lib/contexts/app/userPreferences.type.ts` | MODIFIED | drop `dataCollection` and `ConsentStatus` |
| `apps/frontend/src/routes/+layout.svelte` | MODIFIED | remove `umamiRef`, its effect and the dynamic import; the `visibilitychange` effect keys on `analytics.trackEvents` instead of `analytics.platform` |
| `apps/frontend/src/routes/(voters)/+layout.svelte` | MODIFIED | remove the consent-popup push |
| `apps/frontend/src/routes/(voters)/privacy/+page.svelte` | MODIFIED | describe the first-party relay; no consent control |
| `apps/frontend/src/lib/components/analytics/umami/` | DELETED | |
| `apps/frontend/src/lib/dynamic-components/dataConsent/` | DELETED | `DataConsent`, `DataConsentInfoButton`, `popup/DataConsentPopup` |
| `packages/app-shared/src/settings/staticSettings.type.ts`, `staticSettings.ts` | MODIFIED | `analytics` loses `platform` (the browser no longer knows the provider); keep `trackEvents`; keep an optional `infoUrl` if the privacy page links to the provider |
| `packages/app-shared/src/data/schemas/storedSettings.schema.ts` + test | MODIFIED | the schema is strict at every level, so removing `platform` must land together with every stored blob that carries it |
| `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts`, `shared.ts` | MODIFIED | the analytics overlay loses `platform` |
| `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}` | MODIFIED | remove the consent strings; rewrite the analytics paragraph; regenerate `translationKey.ts` |
| `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | MODIFIED | the capture seam moves from `window.umami.track` to the request to `/api/analytics` (`page.waitForRequest` / `page.route`), which is the real boundary |
| `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` | MODIFIED | emit-versus-suppress keys on `trackEvents`; add an assertion that no analytics key appears in `localStorage`, `sessionStorage` or cookies |

**Kept as is:** the `TrackingService` consumer API (`startEvent`, `track`, `startPageview`, `submitAllEvents`, `resetAllEvents`), all of its call sites, the flush points in the root layout, and the `analytics.trackEvents` setting.

---

## 8. Suggested build order

Ordered by dependency. Steps 1 and 2 need no cloud account and can start at once, in parallel.

| # | Step | Depends on | Needs from the operator | Verifiable how |
|---|------|------------|-------------------------|----------------|
| 0 | **Preconditions decided.** AWS account and region; whether a DNS zone is available; Supabase organisation and plan; PostHog project (region); SMTP source | nothing | all of it | a written list |
| 1 | **Make the application deployable.** Health route; build SHA at `/_app/version.json`; Dockerfile argument; buckets in the migration; `bootstrap.sql` (run against the local stack first); the default-account dependency of `ensureProject()`; `PUBLIC_PROJECT_ID` in the two templates | nothing | nothing | `docker-compose.dev.yml` production image against local Supabase; existing gate suite stays green |
| 2 | **Analytics relay.** Contract, route, provider interface, PostHog and null providers, client transport, removal of Umami, consent and storage, E2E at the relay boundary | nothing | nothing (a PostHog token only for step 5) | unit tests with an injected `fetch`; the rewritten tracking spec; full local suite green |
| 3 | **Terraform skeleton.** `infra/` layout, the three modules, `envs/test`, the credential-free validate job in `main.yaml`, the settings parity guard | 1 (variable names) | nothing | `terraform validate`; `yarn lint:check` |
| 4 | **Bootstrap layer applied.** State bucket, OIDC trust, deploy role, image repository | 3 | AWS administrator credentials, once | `terraform plan` clean on a second run |
| 5 | **First real apply, by hand.** Image pushed; `envs/test` applied; `db push`; functions deployed; bootstrap SQL; the site loads over HTTPS. Observe and record each "never observed" item: `/auth/v1/settings`, the redirect allowlist, the hook, `account-access` through the hosted gateway, the row cap, forwarded headers | 1, 3, 4 | Supabase access token and organisation; SMTP credentials; PostHog token; the DNS decision | an operator-run checklist; closes todos `2026-10-07-174-hosted-project-auth-settings…`, `2026-09-02-…redirect-allowlist`, `2026-09-18-…api-limits` |
| 6 | **Deployed E2E entry.** Second Playwright config, build-identity setup, remote seed, the subset and the hosted probes, run from a workstation against the stack of step 5 | 1, 5 | the stack's URL and keys | the subset green; a negative control (wrong SHA, wrong project id) red |
| 7 | **Pipeline.** `deploy.yaml`: image → plan → apply → backend deploy → wait for the service → step 6's suite → artifacts. GitHub Environment with its secrets. One observed green run on a `deploy-evidence/**` branch and one observed red run from a planted failure | 4, 5, 6 | Environment secrets entered; the first evidence push | job-level results of the two runs |
| 8 | **Relay verified on the deployed stack.** Provider switched to PostHog by Terraform; an event arrives; switching to `none` stops it without a rebuild | 2, 5 | access to the PostHog project | an event visible in PostHog; the probe in step 6 |
| 9 | **Documentation and reference.** Deployment guide around Terraform; `envs/example`; the measured hosted limits; the fate of `render.example.yaml` | 5-8 | review | docs build; links |

Ordering rationale:

- **Step 1 before any Terraform.** The health route and the build identity are inputs of the service definition and of the deployed preflight; discovering their absence during a real apply costs a cloud round trip each.
- **The relay (2) is independent of the deployment.** It is a frontend change with local tests. Its only coupling is four variables in the task definition, which step 3 can declare before the relay exists. Sequencing it first also means the image that step 5 deploys already contains it.
- **A manual first apply (5) before the pipeline (7).** Every hosted-Supabase statement in this repository is unobserved. Debugging first contact through CI logs, with an approval gate on each attempt, is the slow way to learn it. Automate what has been seen to work.
- **The deployed E2E entry (6) before the pipeline (7).** The pipeline's last stage is that suite; build and prove it from a workstation first.
- **The per-caller limit on the anonymous invitation operations** (todo `2026-10-07-174-no-per-caller-limit…`, operator decision G1 (a)) can only be measured after step 5. Whether its design lands in this milestone or the measurement alone does is a requirements decision.

Suggested job order inside `deploy.yaml`, with the reason for each position:

1. Static checks (`fmt`, `validate`).
2. Build and push the image. The repository comes from the bootstrap layer, so this needs no apply.
3. `terraform plan`, saved as an artifact; then `apply` of that plan.
4. `infra/scripts/deploy-backend.sh` (migrations, functions) and `bootstrap.sql`. On the very first apply the service starts before the schema exists; the health route does not touch the database, so the service still stabilises.
5. Wait for the service to be stable; run the build-identity preflight.
6. Remote seed and the Playwright subset; upload the report.
7. Optional scale-down or destroy, by a dispatch input.

---

## 9. Scaling considerations

A VAA's load is a spike around one election, on a mostly read-only voter path that talks to Supabase from the browser.

| Scale | Adjustment |
|-------|------------|
| Test stack, demos | One small task, one small Supabase instance. A long-lived stack that the pipeline re-applies is cheaper in time than create-and-destroy per run (project creation takes minutes, and plans limit project counts). |
| One national election | Two or more tasks behind the load balancer for availability; target-tracking autoscaling on CPU. The relay is stateless by Pattern 3, so it scales with the service. Supabase instance size is a Terraform variable. |
| Election-night peak | The frontend container is not the bottleneck: SSR does a handful of Supabase reads and the browser does the rest. The first limit is the hosted API and database (the row cap, pooler connections), then Auth rate limits for contestants. A CDN in front of the immutable assets under `/_app/immutable` is the cheap win; it adds one proxy hop, so `XFF_DEPTH` becomes 2. |

**First bottleneck for the deployed test suite, not for users:** Auth rate limits. `config.toml` allows 30 sign-ins per five minutes per address and 2 emails per hour locally; a hosted project applies its own defaults, and the whole suite signs in from one runner address. Keep the deployed subset small and make the limits explicit variables of the `supabase-project` module.

**Relay under load:** one request per page view rather than one per event, because the client buffers and flushes on navigation. Cap batch size and body size in the route; put a rate rule at the load balancer if abuse appears. The endpoint is an unauthenticated write, so validation against the event-name allowlist is what keeps junk out of the provider.

---

## 10. Anti-patterns

### Anti-pattern 1: `supabase config push` beside Terraform

**What people do:** push `config.toml` to the hosted project because the CLI offers it.
**Why it is wrong here:** `config.toml` is the local stack's truth: `site_url = "http://127.0.0.1:5173"`, redirect entries on `localhost`, an email rate of 2 per hour. Pushing it would write local values over the hosted ones, and it would make two writers of the same settings. One third-party report claims the push also sends local defaults for keys the file does not declare (LOW confidence, unverified against the CLI source).
**Do this instead:** Terraform's `supabase_settings` is the only writer of hosted settings; `config.toml` stays local; the parity guard of § 4 compares them.

### Anti-pattern 2: The service-role key on the frontend service

**What people do:** add it "for server routes".
**Why it is wrong:** nothing under `apps/frontend/src` reads it, by design; `.env.example` and the deployment guide both forbid it. A task definition is readable by anyone who can describe the service.
**Do this instead:** the key reaches exactly two places, the bootstrap script and the smoke job.

### Anti-pattern 3: Choosing the analytics provider in the browser

**What people do:** keep `analytics.platform.name` in settings and branch on it in the layout, loading a vendor script per provider.
**Why it is wrong:** that is today's design and the reason the service cannot be swapped without a client change. It also sends every visitor's address to the vendor's origin.
**Do this instead:** Pattern 2. The browser's only knowledge is `trackEvents` and one path.

### Anti-pattern 4: Teaching the local gate suite a remote mode

**What people do:** add `if (process.env.DEPLOYED)` to the preflight and the config.
**Why it is wrong:** the preflight's value is that it has no bypass; the file says so. A bypass variable is the hole a foreign server walked through once already.
**Do this instead:** Pattern 5, a separate entry with its own, equally strict identity check.

### Anti-pattern 5: Two writers of the task definition

**What people do:** let Terraform create the service and let the pipeline roll new images with the AWS CLI.
**Why it is wrong:** the next `terraform plan` shows a diff nobody made, and people learn to ignore plans.
**Do this instead:** the image tag is a Terraform variable.

### Anti-pattern 6: Terraform under `apps/`

**What people do:** follow the monorepo's "applications live in `apps/`" convention.
**Why it is wrong:** the frontend image copies `apps/` wholesale.
**Do this instead:** `infra/` at the root.

### Anti-pattern 7: Running `seed.sql` on a hosted database

**What people do:** `supabase db push --include-seed` to get the default account and project.
**Why it is wrong:** `seed.sql` holds the local demo service-role key, sets `behind_cloudflare` for the local E2E fixture's reasons, and the deployment guide states it creates test users with a known password.
**Do this instead:** `infra/scripts/bootstrap.sql`, parameterised and idempotent.

---

## 11. Integration points

### External services

| Service | Integration | Notes |
|---------|-------------|-------|
| Hosted Supabase (management) | Terraform provider `supabase/supabase`; Supabase CLI 2.118.0 (the version `main.yaml` pins) | Both authenticate with `SUPABASE_ACCESS_TOKEN`. Pin the CLI to the same version in `deploy.yaml`. |
| Hosted Supabase (database, for `db push` and `psql`) | pooler connection string | GitHub-hosted runners have no IPv6 route; a direct database host may be IPv6-only. Use the session pooler. MEDIUM. |
| Hosted Supabase (runtime) | unchanged: `supabase-js` from the browser and from SSR | The feedback rate limit needs `behind_cloudflare = true` on hosted Supabase (deployment guide). |
| AWS | Terraform provider `hashicorp/aws`; GitHub OIDC for credentials | App Runner is closed to new customers since 2026-04-30, so the container runs on ECS Fargate. Whether the module uses an explicit service with a load balancer or `aws_ecs_express_gateway_service` is a stack decision; the module interface in § 3 holds either way. |
| PostHog | server-side `POST <host>/batch/` from the relay | Anonymous events with `$process_person_profile: false`. The project token is not a credential in PostHog's model, but it stays server-side so the browser has no knowledge of the provider. |
| SMTP | `supabase_settings.auth` and the Edge Function secrets | `account-access` sends with nodemailer and `secure: false`; a STARTTLS port works. If SES is used, sandbox mode restricts recipients until AWS grants production access, which is a manual request. |
| GitHub Actions | `deploy.yaml`, a GitHub Environment | Pattern 6 |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `envs/<env>` ↔ modules | Terraform variables and outputs | The only place a value crosses between Supabase and AWS |
| Terraform ↔ `infra/scripts` | `terraform output -json`, masked into the job environment | Scripts take everything as environment variables so they run the same from a workstation |
| Client tracking ↔ relay | `POST /api/analytics`, schema in `relayContract.ts` | Versioned (`v: 1`); same-origin only |
| Relay ↔ provider | `AnalyticsProvider.capture(batch)` | The provider never sees the request; the relay never sees provider types |
| `hooks.server.ts` ↔ new API routes | none needed | `appGateHandle` already skips API routes (`isApiRoute`); the Supabase handle builds a per-request client without a network call |
| Deployed Playwright entry ↔ existing fixtures | imports | Fixtures that assume `localhost` ports are listed in § 1; the subset avoids them |
| Unit-test gates ↔ workflows | text-level assertions in `packages/dev-seed/tests/ci*.test.ts` | They read `main.yaml`. A new workflow file is outside them; a guard for `deploy.yaml` (for example "every job that holds credentials names the environment") would follow the same pattern |

---

## 12. Research flags for phase planning

| # | Open point | Confidence now | Resolve in |
|---|------------|----------------|------------|
| F1 | Exact JSON keys of `supabase_settings.auth` and `.api` (hook enablement and URI, allowlist, sign-up, confirmations, SMTP, rate limits, max rows). Import the resource from a scratch project to list them. | MEDIUM that all are settable; LOW on names | Terraform skeleton |
| F2 | Whether the access-token hook can be enabled before the migration has created `public.custom_access_token_hook`. If not, the first apply needs a targeted first pass or the hook moves after `db push`. | LOW | First real apply |
| F3 | Whether a bucket row inserted by the migration coexists with the `[storage.buckets.*]` declaration on the local stack. The local Storage service has a history of a 502 wedge after resets. Fallback: create buckets from the bootstrap step through the Storage API. | LOW | Deployability step |
| F4 | Whether a new hosted project runs Postgres 17 by default; the provider has no version argument. `config.toml` requires the hosted major to match. | LOW | First real apply |
| F5 | Whether new projects still issue the legacy `anon` and `service_role` JWT keys. The provider marks `legacy_api_keys_enabled` deprecated and also exports a publishable key and secret keys. The frontend, the Edge Functions and the `pg_net` cleanup trigger (`Authorization: Bearer <service_role_key>`) all assume the legacy pair. | LOW | Terraform skeleton |
| F6 | `ORIGIN` handling in adapter-node 5.5.7 versus `paths.origin` in newer documentation. | LOW | Deployability step |
| F7 | Whether PostHog accepts an arbitrary `$session_id` from server-side events or requires a specific format. If unclear, send the page session as a custom property. | LOW | Relay |
| F8 | What a hosted gateway does with a call that carries the anon key and no user token (`account-access`), which forwarded headers it sets, and the hosted Auth rate limits the suite will meet. | unobserved by definition | First real apply |
| F9 | Whether "no consent prompt" holds for the hashed-address visitor id under the operator's legal reading. The design stores nothing on the device; the hash is still derived from personal data. | operator decision | Requirements |
| F10 | A spec file under `tests/tests/specs/deployed/` matches no project of the local config. Confirm no existing guard counts unmatched spec files as dropped. | MEDIUM that none does | Deployed E2E entry |

---

## Sources

Repository (HIGH; read directly): the files cited inline, principally `apps/frontend/Dockerfile`, `apps/frontend/svelte.config.js`, `apps/frontend/src/hooks.server.ts`, `apps/frontend/src/lib/utils/constants.ts`, `apps/frontend/src/lib/server/constants.ts`, `apps/frontend/src/lib/contexts/app/tracking/*`, `apps/frontend/src/routes/+layout.svelte`, `apps/supabase/supabase/config.toml`, `apps/supabase/supabase/seed.sql`, `apps/supabase/supabase/functions/.env.example`, `packages/dev-seed/src/localSupabaseUrl.ts`, `packages/dev-seed/src/supabaseAdminClient.ts`, `tests/playwright.config.ts`, `tests/global-setup.ts`, `tests/tests/support/preflight.ts`, `tests/scripts/e2e-run.sh`, `.github/workflows/main.yaml`, `.env.example`, `render.example.yaml`, the deployment guide, and the pending todos named in the milestone todo.

External (MEDIUM unless marked):

- Supabase Terraform provider, resource and data-source list and v1.11.0 release date: https://github.com/supabase/terraform-provider-supabase (docs/resources, docs/data-sources, releases API)
- Supabase Terraform guide: https://supabase.com/docs/guides/deployment/terraform
- `supabase config push` reference: https://supabase.com/docs/reference/cli/supabase-config-push
- Supabase CLI config as code (remotes block, drift check with `supabase link`): https://supabase.com/blog/cli-v2-config-as-code
- AWS App Runner availability change: https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html
- ECS Express Mode resource (CloudFormation reference; Terraform resource reported from provider 6.23): https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ecs-expressgatewayservice.html
- Terraform S3 backend, `use_lockfile`, DynamoDB locking deprecated: https://developer.hashicorp.com/terraform/language/backend/s3
- PostHog server-side capture with anonymous events (`/i/v0/e/`, `/batch/`, `$process_person_profile`): https://posthog.com/docs/web-analytics/sending-http-logs and https://posthog.com/docs/data/anonymous-vs-identified-events
- PostHog cookieless mode (the server-hash model Pattern 3 mirrors): https://posthog.com/docs/privacy/cookieless-tracking
- PostHog sessions for server-side events: https://posthog.com/docs/data/sessions
- SvelteKit adapter-node runtime variables: https://svelte.dev/docs/kit/adapter-node

---
*Architecture research for: v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay*
*Researched: 2026-10-10*

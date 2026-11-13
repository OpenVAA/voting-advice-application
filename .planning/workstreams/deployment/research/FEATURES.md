# Feature Research

**Domain:** Deployment of an existing SvelteKit (adapter-node) + hosted Supabase application to AWS by Terraform, with a deploy-and-smoke pipeline and a consent-free first-party analytics relay
**Milestone:** v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay
**Researched:** 2026-10-10
**Confidence:** MEDIUM overall. Repository facts are observed. Engineering practice is MEDIUM. The legal reading in the consent section is LOW to MEDIUM and must not be treated as a legal conclusion.

## How to read this document

Six categories, each meant to become one requirement group:

| Prefix | Category | What it delivers |
| ------ | -------- | ---------------- |
| `INFRA` | AWS infrastructure | A Terraform module that runs the frontend container on AWS |
| `SUPA` | Supabase project provisioning | A hosted project brought to the required state from the repository |
| `PIPE` | Deploy pipeline | A GitHub Actions workflow that plans, applies and smoke-tests |
| `OBS` | Hosted-behaviour observations | Things the repository asserts about a hosted project, measured once and recorded |
| `RELAY` | Analytics relay | A first-party event endpoint with a provider interface and a PostHog implementation |
| `DOCS` | Documentation | The deployment guide, the settings reference, the runbook and the todo closures |

Confidence labels:

- **OBSERVED** — read in this worktree at commit `0f97645a7`.
- **MEDIUM** — a web finding checked against the primary document (the GSD classifier's tier for a verified web search).
- **LOW** — one source, or vendor documentation fetched without a second source, or knowledge from training that was not re-checked in this run.

No web claim here is HIGH: no curated documentation provider was available in this run.

Complexity is LOW / MEDIUM / HIGH for implementation effort, not for risk.

---

## Feature Landscape

### Table Stakes (operators expect these)

Missing any of these makes the deployment unusable, unsafe or not reproducible.

#### INFRA — AWS infrastructure

| ID | Feature | Why expected | Complexity | Notes and dependencies on existing code |
| -- | ------- | ------------ | ---------- | --------------------------------------- |
| INFRA-01 | Image registry with immutable, commit-addressed tags | A deploy must name the exact build it runs | LOW | Built from `apps/frontend/Dockerfile`, target `production`, context the repository root (OBSERVED). The image carries the whole workspace install, so it is large; pull time sets how fast a new task starts. |
| INFRA-02 | The container running as a service behind an HTTPS load balancer, at least two tasks in two availability zones | One task is one failure away from an outage on election day | MEDIUM | The server listens on port 3000 (OBSERVED). See the admin job store constraint under Dependency Notes before choosing a task count. |
| INFRA-03 | TLS and a custom domain: certificate, DNS validation, HTTP redirected to HTTPS | Auth cookies and mailed links need one stable HTTPS origin | MEDIUM | Operators often keep DNS elsewhere. The module should accept an existing zone or emit the records to create by hand. |
| INFRA-04 | A health endpoint and a health check with a start-up grace period | The load balancer and the rollout both need a truth signal | LOW | **No health route exists** (OBSERVED: `apps/frontend/src/routes/api/` has no such route). It must answer without calling Supabase, or a Supabase incident takes every task out of rotation. |
| INFRA-05 | Runtime configuration injected as environment, secrets from a secret store | The image is environment-neutral by design | MEDIUM | The frontend reads its configuration at run time (OBSERVED, deployment page). Must include `PUBLIC_PROJECT_ID`: the Supabase adapter throws without it and neither template passes it (todo `2026-10-02`, item 1, recorded there as UNCONFIRMED because it was never run). `SUPABASE_SERVICE_ROLE_KEY` must never reach this service. |
| INFRA-06 | The Node server told that it sits behind a proxy: public origin, protocol and host headers, client-address header and depth | Without it form actions are refused as cross-site | LOW | `contestant/login` and `admin/login` use form actions (OBSERVED). Nothing in the repository sets these variables today (OBSERVED: no reference to `ORIGIN`, `PROTOCOL_HEADER`, `ADDRESS_HEADER`, `XFF_DEPTH`). The documented error is "Cross-site POST form submissions are forbidden" (LOW, SvelteKit docs). The mechanism differs by version; see Open Questions. |
| INFRA-07 | Autoscaling with a floor and a ceiling, plus a scheduled scale-out before a known peak | Election day is a known date; reactive scaling alone arrives late | MEDIUM | Request count per target is the usual metric for a web service; scheduled actions suit predictable peaks (LOW, community sources). |
| INFRA-08 | Container output collected to a durable log store with a retention period | Production logging was turned on in Phase 157.1 with no durable sink | LOW | `@openvaa/app-shared` writes records to the console, which on the server is container stdout (OBSERVED, todo `2026-08-31`). Collecting stdout is the server half of that todo. |
| INFRA-09 | Health-gated rolling deploys with automatic rollback, and a graceful drain | A bad image must not replace a good one | MEDIUM | adapter-node drains on `SIGTERM` and force-closes after `SHUTDOWN_TIMEOUT`, 30 s by default (LOW, SvelteKit docs). The image's `CMD` is in shell form (OBSERVED); whether the signal reaches the Node process is **unverified** and must be tested, not assumed. |
| INFRA-10 | Remote state with locking, per-instance variables, outputs, and a clean `destroy` | A VAA instance is seasonal: it is created for an election and removed after it | MEDIUM | "Instance" is already the operator's unit in `render.example.yaml` (`<INSTANCE_NAME>`). |
| INFRA-11 | Least-privilege roles and network rules: only the load balancer reaches the tasks | Baseline for anything public | MEDIUM | — |
| INFRA-12 | An EU region by default, stated beside the Supabase project's region | Data residency is a governance question for a VAA; latency between the two matters for SSR | LOW | `render.example.yaml` uses `frankfurt` (OBSERVED). |
| INFRA-13 | Cost tags and a documented monthly estimate | Operators are small organisations with a fixed budget | LOW | `CLAUDE.md` quotes $80–350 a month for the earlier Render setups (OBSERVED; that file is stale in other respects). |

#### SUPA — Supabase project provisioning

What a hosted project needs is already enumerated by the deployment page, § 2, as nine hand-made steps (OBSERVED). The table stakes turn each into something the repository does.

| ID | Feature | Why expected | Complexity | Notes and dependencies on existing code |
| -- | ------- | ------------ | ---------- | --------------------------------------- |
| SUPA-01 | Schema migrations applied to the linked project by one command, safely repeatable | The schema is the contract the frontend is built against | LOW | `apps/supabase/supabase/migrations/`; `assert:schema-migration-parity` already guards the source (OBSERVED). |
| SUPA-02 | Auth settings applied from the repository: access-token hook on, site URL, the two redirect entries, public sign-up off, email confirmation on, SMTP | The authorisation model depends on the hook, and the invitation model on sign-up being closed | MEDIUM to HIGH | Local values live in `config.toml` (`site_url = "http://127.0.0.1:5173"`, localhost redirect entries — OBSERVED), so the file cannot be pushed as it stands. Mechanism is a stack decision: per-remote overrides in `config.toml`, the Terraform provider's settings resource, or the Management API. Closes todos `2026-09-02` and `2026-10-07` (hosted auth settings). |
| SUPA-03 | API settings applied from the repository: maximum rows equal to `dataAdapter.pageSize` | With the default of 1000, large reads are silently truncated with HTTP 200 (todo `2026-09-18`, spike 026) | LOW | Local value 50000 (OBSERVED). The Terraform provider's example manages `max_rows` and `statement_timeout` (LOW). |
| SUPA-04 | The two storage buckets created reproducibly | The migrations create the policies, not the buckets (OBSERVED, todo `2026-10-02`, item 4) | LOW | The todo's own option is an idempotent migration. `supabase seed buckets --linked` exists but its behaviour on a hosted project is not documented (LOW). |
| SUPA-05 | The three Edge Functions deployed and their secrets set from the operator's environment | Invitations, bank identification and mail all run there | MEDIUM | `account-access`, `identity-callback`, `send-email` (OBSERVED). `identity-callback` runs without JWT verification. Variables are listed on the deployment page; `assert:edge-function-env` exists (OBSERVED). |
| SUPA-06 | A bootstrap for the rows a project needs: one account, one project, the `storage_config` row, `behind_cloudflare` | `seed.sql` creates test users with a known password and must never run on a hosted database (OBSERVED) | MEDIUM | `storage_config` holds the service-role key in a table, so the bootstrap takes the key from the operator's environment and commits nothing. The project row's id becomes `PUBLIC_PROJECT_ID`. |
| SUPA-07 | A verification step that reads what the project serves and fails by name | The repository's guards check the local file, not the project (`assert:auth-signup-closed`, OBSERVED) | MEDIUM | Checks that need no dashboard label: `GET /auth/v1/settings` holds `disable_signup: true` and `mailer_autoconfirm: false`; `pg_roles` shows `statement_timeout=8s` for `anon`; both buckets exist; one `check-code` call is accepted. Each check must be seen failing once (project discipline). |
| SUPA-08 | Secrets kept to the pipeline's environment: access token, database password, service-role key | The service-role key bypasses row-level security | LOW | — |
| SUPA-09 | A separate hosted project for testing; tests never run against a production project | The E2E harness seeds and tears down with the service-role key | LOW | `E2E_PROJECT_ID` isolates rows within one database (OBSERVED), which is not isolation between deployments. |

#### PIPE — Deploy pipeline

| ID | Feature | Why expected | Complexity | Notes and dependencies on existing code |
| -- | ------- | ------------ | ---------- | --------------------------------------- |
| PIPE-01 | Keyless cloud credentials through OpenID Connect, the role bound to this repository and one environment | Long-lived keys in repository secrets are the standard leak | LOW to MEDIUM | Trust policy must condition on `sub`; GitHub recommends environments with protection rules (MEDIUM, GitHub docs). |
| PIPE-02 | On a pull request: format, validate and plan, with the plan readable in the run | A reviewer must see what an apply would change | LOW to MEDIUM | `main.yaml` triggers only on `main`, on pull requests to `main`, and on `ci-evidence/**` (OBSERVED). The new workflow needs its own triggers. |
| PIPE-03 | No cloud credentials for pull requests from forks | The project is open source and takes outside contributions | LOW | A plan job that needs credentials must skip, visibly, for a fork. |
| PIPE-04 | Apply only behind a gate: a protected environment or a manual dispatch, serialised by a concurrency group | Two applies at once corrupt state; an unreviewed apply to production is an incident | LOW to MEDIUM | — |
| PIPE-05 | The image built once, pushed, and deployed by digest | "Tested" must mean the same bytes that were built | MEDIUM | `docker-image-build` in `main.yaml` already builds the production image without pushing (OBSERVED). |
| PIPE-06 | A fixed order: migrations, then functions, then the frontend rollout, then wait until stable | The frontend and the schema are coupled | MEDIUM | Nothing is deployed, so no compatibility window is owed yet; the order still has to be written down. |
| PIPE-07 | A smoke run against the deployed URL that fails the pipeline: health, a voter page rendered with data from the hosted project, one pass from questions to results | The operator's definition of "tested" | MEDIUM to HIGH | The Playwright config fixes `baseURL` to `http://localhost:<port>` and carries a preflight that proves the listener is this checkout's Vite dev server, with no bypass (OBSERVED). A deployed production build fails that check by design, so a deployed-target mode is new work. Mail-dependent specs rely on the local mail catcher. |
| PIPE-08 | A guarded `destroy` path | A test stack left running costs money every day | LOW | — |
| PIPE-09 | An observed red run as well as a green one | Project rule: a guard is not accepted until it has been seen failing | MEDIUM | Deploy a deliberately broken build and record that the smoke run reddens the pipeline. |

#### OBS — Hosted-behaviour observations

Each item is "run it on a real project, record what happened, act on it". All depend on INFRA, SUPA and PIPE existing. Complexity is LOW each unless stated; the cost is in having the stack.

| ID | Observation | Source | Consequence of the result |
| -- | ----------- | ------ | ------------------------- |
| OBS-01 | The served auth settings, and the dashboard's actual names for the two switches | Deployment page marks the names "unverified" | Docs corrected |
| OBS-02 | The redirect allowlist: the single-segment pattern is admitted; whether the auth service also admits its own site URL's host on any port; what `Location` `/auth/v1/verify` returns when admitted and when refused | Todo `2026-10-07` (hosted auth settings), inferred and not measured | Decides whether `account-access`'s redirect check proves the entry exists |
| OBS-03 | Whether the hosted gateway accepts a call that carries the anon key and no user token | Same todo | `account-access` works or needs a change |
| OBS-04 | Which forwarded headers reach an Edge Function, a PostgREST trigger, and the frontend container | Todo `2026-10-07` (no per-caller limit), R-d; operator decision G1 (a) | Input to OBS-09. Community threads say the client address is in `X-Forwarded-For` and leave spoofing unanswered (LOW). |
| OBS-05 | Both refusing branches of `account-access`, and the release of a slot after a failed send, on a served function | Same todos; held today only by unit tests with injected answers | Guards proven or fixed |
| OBS-06 | One invitation mail through real SMTP: the link's origin, and that it signs in | Hosted auth settings todo, step 4 | End-to-end proof of SUPA-02 and SUPA-05 |
| OBS-07 | A read of more than 1000 rows is not truncated; `anon` runs with an 8 s statement timeout | Todo `2026-09-18` | Proof of SUPA-03 |
| OBS-08 | A frontend started from the template's variables alone reads from Supabase | Todo `2026-10-02`, item 1 (UNCONFIRMED there) | Templates fixed |
| OBS-09 | A decision on the per-caller limit, made after OBS-04, and its implementation or a recorded deferral | Todo `2026-10-07` (no per-caller limit) | MEDIUM to HIGH. The todo rules out a project-wide cap. |
| OBS-10 | Feedback rate limit with `behind_cloudflare = true` buckets by client on the hosted project | Deployment page, feedback section | Proof of SUPA-06 |

#### RELAY — Analytics relay

Current state (OBSERVED): `TrackingServiceImpl` collects events per page into one compound `pageview` event and hands it to a single injected handler, `sendTrackingEvent`. The only handler is `UmamiAnalytics.svelte`, which loads `https://cloud.umami.is/script.js` with automatic tracking. Sending is gated on `analytics.trackEvents` and on `userPreferences.dataCollection.consent === 'granted'`. Every event is stamped with `vaaSessionId`, read from `sessionStorage` under `appContext-sessionId`. Consent is kept in `localStorage` under `appContext-userPreferences`. The event-name union has 30 members, two of them templates over the entity type, and `answer` carries `{ questionId, value }` for each statement the voter answers (`answerState.svelte.ts`).

| ID | Feature | Why expected | Complexity | Notes and dependencies on existing code |
| -- | ------- | ------------ | ---------- | --------------------------------------- |
| RELAY-01 | A same-origin ingestion endpoint that accepts the batched event, answers at once and never blocks the interface | The definition of the feature | MEDIUM | `/api/feedback` is the precedent: a server route in front of a server-chosen writer (OBSERVED). Choose a path that filter lists do not block. |
| RELAY-02 | A browser sender that survives page unload, with no third-party script and no third-party origin | Events are flushed on navigation and when the tab is hidden (OBSERVED in the root layout) | LOW to MEDIUM | `sendTrackingEvent` is already the injection point, so the sender is one more `TrackingHandler`. A beacon with a text body passes through SvelteKit's cross-site check, which ties this to INFRA-06. |
| RELAY-03 | A server-side provider interface, selected by configuration, with a no-op default and an in-memory or console provider for tests | "Modular, with one real implementation" | MEDIUM | Precedents in the tree: the `IdentityProvider` interface and `LoggerConfig.sink`. |
| RELAY-04 | The PostHog provider: server-side capture, EU host by default and configurable, no person profile, no client address, batched, flushed at shutdown, failing open | The operator's preferred service | MEDIUM | Capture is `POST /i/v0/e/` or `/batch/` on `https://eu.i.posthog.com`; an event is anonymous when `$process_person_profile` is `false` and its `distinct_id` belongs to no person (MEDIUM, PostHog docs). An event with an empty `distinct_id` is dropped with `200 OK`, so success cannot be read from the status. |
| RELAY-05 | Nothing written to the device for analytics, and nothing read from it | The operator's condition | LOW to MEDIUM | Remove the `sessionStorage` session id from the tracking path. Its storage key is documented as load-bearing, and `surveyLink` substitutes `{sessionId}` into the survey URL (OBSERVED), so the survey link needs a ruling. |
| RELAY-06 | No identifier and no fingerprint: no session id, no hash of address and user agent, a random `distinct_id` per event | Without it the events are personal data, and answer events are data on political opinions | LOW | The work is in proving absence; see RELAY-12. |
| RELAY-07 | Client address and user agent stop at the relay | Same | LOW | PostHog uses the address of the capture request when no `$ip` is sent, which for a relay is the server's address; its project setting discards client addresses and EU organisations default to discarding (MEDIUM). Whether the Node SDK disables GeoIP by default was not confirmed. Load-balancer access logs hold addresses and paths and need their own decision. |
| RELAY-08 | Validation and minimisation at the relay: an allowlist of event names, bounded size, sanitised URLs | The endpoint is public and unauthenticated | MEDIUM | `TrackingEventName` is the natural schema source. `pageview` carries `href` and `from`; query strings can carry codes and must be dropped. |
| RELAY-09 | Abuse resistance: same-origin requests only, a body limit, a coarse rate limit, no caller-chosen destination | Otherwise it is an open forwarder that spends the operator's event quota | MEDIUM | A limit keyed on address uses the address transiently; say so in the privacy text. |
| RELAY-10 | Configuration split: the provider, its key and its host are server-side deployment configuration; whether events are collected is a runtime setting | The browser no longer needs to know the provider | MEDIUM | Resolves todo `2026-06-01`. Touches `staticSettings.type.ts` (`platform.name: 'umami'`), the strict `storedSettings.schema.ts` and its pinned tests, and `MINIMAL_BASE_APP_SETTINGS`, which 23 dev-seed templates write (OBSERVED in the schema's own comment, not counted here). |
| RELAY-11 | Consent mode as a deployment setting: consent-free by default, consent-gated retained | The legal answer differs by country, and OpenVAA is deployed in several | LOW to MEDIUM | The gate already exists in `TrackingServiceImpl`. See the consent section for why this is a table stake and not an extra. |
| RELAY-12 | Tests that prove the privacy properties: after a voter journey no analytics key exists in any device store, no request leaves for a third-party origin, events arrive with no prompt, and in consent-gated mode nothing arrives before consent | An untested privacy claim is a claim | MEDIUM | `trackingIntercept.fixture.ts` stubs `window.umami.track` and must be rebuilt around the relay route. `perm-analytics-tracking` arms the current integration (OBSERVED). |
| RELAY-13 | Transparency and objection: privacy text for the new model in all seven locales, and a stateless way to object | Named as conditions by every regulator read here | MEDIUM | `privacy.dataCollection.platform.umami` exists per locale and says "completely anonymously" (OBSERVED). Honouring the `Sec-GPC` request header at the relay needs no storage. |
| RELAY-14 | The Umami browser integration removed | Two paths, one of them third-party, defeats the relay | LOW | `UmamiAnalytics.svelte`, its type, and the root layout's dynamic import (OBSERVED). |

#### DOCS — Documentation

| ID | Feature | Why expected | Complexity | Notes |
| -- | ------- | ------------ | ---------- | ----- |
| DOCS-01 | The deployment guide rewritten around the Terraform and Supabase-as-code path | The page describes nine manual steps and a Render Blueprint | MEDIUM | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` |
| DOCS-02 | A settings reference for the hosted project: each setting, where the repository sets it, how to verify it | Todos `2026-09-02` and `2026-09-18` ask for exactly this | LOW | Carries the `pg_roles` query and the `/auth/v1/settings` request. |
| DOCS-03 | Every "unverified" statement about a hosted project replaced by a dated observation or removed | The deployment page hedges in three places (the gateway, the switch names, the two refusals) | LOW | Fed by OBS. |
| DOCS-04 | The environment-variable reference updated: proxy variables, analytics variables, `PUBLIC_PROJECT_ID` | Todo `2026-10-02`, items 1 and 2 | LOW | Decide `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL`, which have no consumer (OBSERVED in the todo). |
| DOCS-05 | Analytics documentation: the event catalogue, how to add a provider, the privacy model, and a checklist the deployer completes for their own jurisdiction | The legal conclusion belongs to the deployer | MEDIUM | — |
| DOCS-06 | An operations runbook: scaling for election day, rollback, teardown and restore, secret rotation | Operators run this a few times a year and forget it in between | MEDIUM | — |
| DOCS-07 | A disposition for `render.example.yaml` and the orphan compose file: fixed and kept as an alternative, or retired | Todo `2026-10-02`, items 1 and 3 | LOW | — |
| DOCS-08 | A closure record for each absorbed todo | The milestone's stated scope | LOW | See the todo map below. |

### Differentiators (valuable, not required)

| ID | Feature | Value | Complexity | Notes |
| -- | ------- | ----- | ---------- | ----- |
| INFRA-D1 | A content delivery network in front, caching only the immutable build assets | Absorbs the cheapest share of a spike; keeps old chunks reachable during a rollout | MEDIUM | Do not cache rendered HTML in this milestone; see anti-features. |
| INFRA-D2 | A rate-based web application firewall rule | One place to bound the relay and the API routes | MEDIUM | Also the simplest answer to "put a rate limit in front" for anything proxied through the frontend. |
| INFRA-D3 | Alarms on error rate, unhealthy targets and saturation, sent by mail | The operator learns before the voters do | LOW to MEDIUM | — |
| INFRA-D4 | A second environment from the same module | Staging is a variable file away | LOW once the module exists | — |
| SUPA-D1 | The Supabase project itself created by Terraform | A whole instance from one apply | MEDIUM | Puts the database password in state. |
| SUPA-D2 | A scheduled read of the served settings, compared with the repository | Dashboard edits are caught | MEDIUM | The Terraform provider keeps secret fields from state, so it does not show out-of-band changes to them (LOW). |
| SUPA-D3 | A guard that the hosted configuration and the local `config.toml` agree on the security-relevant keys | The class of `assert:auth-signup-closed`, extended to the hosted source | LOW to MEDIUM | — |
| PIPE-D1 | A workflow an operator's fork can run with only its own environment secrets | The documented model is "fork and configure" | MEDIUM | Means no account id, organisation name or region is hard-coded. Worth designing for even if it ships later. |
| PIPE-D2 | A scheduled plan that reports drift | Catches console edits | LOW | — |
| PIPE-D3 | Rollback to the previous task definition when the smoke run fails | The rollout's own rollback sees only health-check failures | MEDIUM | — |
| PIPE-D4 | Static scanning of the Terraform and a cost estimate on the plan | Cheap review aids | LOW each | — |
| OBS-D1 | A load test of the voter read path against the deployed stack, with a recorded capacity figure | Traffic is spiky; voters' browsers read from Supabase directly, so the database tier, not the container, is the likely limit | MEDIUM to HIGH | Spike 026 measured 3.2–3.5 s for the whole-project nominations read at municipal scale (todo `2026-09-18`). |
| OBS-D2 | `EXPLAIN` of the grant-holder arm of `invitation_link_request` on a realistic number of users | The todo infers a sequential scan any anonymous caller can cause | LOW | — |
| OBS-D3 | Time from scale-out decision to a task serving traffic | Sets how early the scheduled scale-out must start | LOW | — |
| RELAY-D1 | A log provider that writes events as structured lines to stdout | A vendor-free option that lands in the log store of INFRA-08, and a second implementation that keeps the interface honest | LOW | Could double as the test provider of RELAY-03. |
| RELAY-D2 | Session linkage only after explicit opt-in | Keeps the research value of a visit's sequence for those who agree | MEDIUM to HIGH | The existing consent interface becomes an upgrade instead of a gate. Needs the operator's ruling. |
| RELAY-D3 | Sampling at the relay | Protects the event budget on election day; PostHog's first million events a month are free (MEDIUM) | LOW to MEDIUM | — |
| RELAY-D4 | Browser errors reported through the same endpoint | The browser half of the durable-sink gap in todo `2026-08-31` | MEDIUM | — |
| DOCS-D1 | A troubleshooting section keyed on the log lines actually observed in OBS | Fastest path from symptom to cause | LOW | — |

### Anti-Features (do not build)

| Anti-feature | Why it is requested | Why it is a problem | Do instead |
| ------------ | ------------------- | ------------------- | ---------- |
| Self-hosted Supabase on AWS | "One cloud" | Ruled out by the operator | Hosted project |
| AWS App Runner | The simplest container service | Closed to new customers since 30 April 2026 (MEDIUM, AWS notice through search) | A container service on Fargate behind a load balancer |
| Kubernetes | Familiarity | An operating burden far beyond one stateless container | Same |
| A serverless adapter | Scale to zero | Changes the adapter the app is built and tested with; the Admin app keeps running jobs in process memory (OBSERVED, `jobStore.ts`) | Keep adapter-node |
| Caching rendered HTML at the network edge | Spike protection | Pages vary by locale and by auth cookie; an open todo already concerns cache headers on auth routes | Cache immutable assets only |
| Database migrations at container start | Convenience | Every task races to migrate; a failed migration becomes a crash loop | A pipeline step before the rollout |
| Unreviewed automatic apply to production | Speed | No human sees the plan | Protected environment |
| Long-lived cloud keys in repository secrets | Simpler setup | Standard leak path | OpenID Connect |
| The whole E2E suite against the deployed stack | "More coverage" | It seeds and tears down with the service-role key, needs the local mail catcher, and its preflight rejects anything but this checkout's dev server (OBSERVED) | A tagged, read-mostly subset |
| `seed.sql` on a hosted database | It is the only bootstrap that exists | Creates users with a known password (OBSERVED) | SUPA-06 |
| Pushing the local `config.toml` unchanged | One command | It holds localhost URLs; one third-party source also claims undeclared auth settings go out at local defaults (LOW, unverified) | Per-remote values, and a diff read before any push |
| Supabase preview branches per pull request | Parity with the app pipeline | A paid add-on and a second deployment model | One persistent test project |
| A per-caller limit designed before the hosted gateway is measured | It closes a todo | Operator decision G1 (a): it cannot be designed first | OBS-04, then OBS-09 |
| A project-wide cap on the anonymous invitation operations | Simple | Any visitor could exhaust it for everyone (todo) | A limit keyed on something the caller cannot choose |
| A transparent reverse proxy for the PostHog browser SDK | PostHog documents it, for evading blockers | It ships the SDK, which stores to the device by default, and forwards what the browser sends | The application-level relay |
| PostHog's cookieless server-hash mode through the relay | "Cookieless" and still counts visitors | The hash is computed from the visitor's address and user agent, so the relay would have to forward both, and the result is a daily device identifier (LOW, PostHog docs through search) | Random id per event |
| Session replay, autocapture, heatmaps, feature flags, surveys | They come with PostHog | Each needs the browser SDK or an identifier; replay would record political answers | Named events only |
| Any hashed-address "anonymous id" | A visitor count | It is derived from the device's own information, which the EDPB treats as within scope (MEDIUM) | Accept that visitors are not counted |
| Self-hosted PostHog in the same Terraform | Data stays in the account | The open-source deployment is documented for about 100k events a month and carries no support (LOW, PostHog README through search) | PostHog Cloud EU; keep the host configurable |
| PostHog as the application's log sink | One tool | It is an analytics product; the container log store already holds server logs (todo `2026-08-31` asks for this comparison) | INFRA-08 |
| A consent banner "to be safe" | Caution | It is the outcome the operator ruled out, and it does not make undisclosed processing lawful | RELAY-11, with the deployer's own assessment |
| Consent-free tracking in the Contestant and Admin apps | Symmetry | Their users are signed in, so their events relate to an identifiable person | Voter app only, or gated |

---

## What makes event tracking exempt from a consent prompt

**This section reports what regulators have published. It is not legal advice, and no conclusion in it is certain. Each deployer needs their own assessment for their own country.**

### Two separate questions

1. **The device rule** (ePrivacy Directive, Article 5(3), and each country's version of it). This is where consent prompts come from. It concerns storing information on a user's device and gaining access to information stored there. It applies whether or not the information is personal data.
2. **The GDPR**, which applies if what is collected relates to an identifiable person. It then requires a lawful basis and transparency, and it restricts special categories of data. Political opinions are one of them; that is statutory text recalled from training and not re-read in this run (LOW by protocol).

A design can pass one and fail the other.

### What the sources say

| Source | What it says | Confidence |
| ------ | ------------ | ---------- |
| EDPB Guidelines 2/2023, version 2.0, adopted 7 October 2024 (primary PDF read) | The device rule's scope is read broadly. JavaScript by which an entity "instructs the browser of the user to send asynchronous requests with the targeted information" "clearly falls within the scope" (para. 33). Storage is independent of the medium, and RAM is named (para. 38), with no minimum duration (para. 37). Collecting protocol data such as the address or the user agent, "for example in the context of fingerprinting", "can lead to the application" of the rule (paras. 42–43). Tracking by address alone is in scope where the address originates from the device, and "unless the entity can ensure" it does not, "it has to take all the steps" (para. 55). | MEDIUM |
| Same | Being in scope "does not systematically mean that consent needs to be collected"; the two exemptions must be assessed, and the guidelines "do not analyse" them (paras. 40, 56). The exemptions are transmission of a communication, and what is strictly necessary for a service the user explicitly requested. | MEDIUM |
| Traficom, guidance on cookies for service providers, 11 November 2022 (primary PDF read) | The Finnish rule, section 205 of the Act on Electronic Communications Services, covers saving "cookies or other data concerning the use of the service in the user's terminal device" and using such data. Analytics cookies "cannot unambiguously be considered essential". To treat them as essential a provider "must present clear grounds" and ensure "no data collected through analytics are shared with third parties and no individual users can be identified based on the data"; otherwise "consent for the analytics needs to be requested". Legitimate interest is not a ground. Asking a device to send more data about itself in order to profile it needs consent. | MEDIUM |
| CNIL, audience-measurement exemption (page dated 11 June 2020) | Exempt where the operator informs users, lets them object, limits the purpose to audience measurement and A/B testing, does not cross-check with other processing, keeps the tracker to one publisher, truncates the last byte of the address, and limits tracker lifetime to 13 months. The regime becomes opt-out. It is still personal-data processing. The page does not discuss server-side or cookieless measurement. A search reports revised guidance from July 2025, which was not read. | MEDIUM |
| European Commission "Digital Omnibus" proposal | Would move the device rule into the GDPR with an exemption for a controller's own aggregated audience measurement. It is a proposal; secondary sources put adoption in 2027–2028 at the earliest. | LOW |
| PostHog documentation | Calls the server-computed daily hash "not considered Personal Data". That is the vendor's position. | LOW |

### What follows for the design

| Design property | The hook it removes | Residual |
| --------------- | ------------------- | -------- |
| Nothing written to the device | The "storing" limb; the literal text of the Finnish rule, which is about data saved in the device | None for this limb |
| Nothing read from device storage or device interfaces | The classic "access" limb; fingerprinting | None for this limb |
| Events hold only what the voter just did in the app | Weakens the argument that stored information is accessed | On the EDPB's reading, script-instructed sending is still in scope (paras. 33, 53, 62) |
| No identifier of any kind; a random id per event | Events cannot be related to a person, which is what keeps them outside the GDPR and keeps answer events outside the special-category rules; Traficom's "no individual users can be identified" | A long, unusual event could single someone out; keep events small |
| The address and user agent stop at the relay | Identifiability; EDPB para. 55 | The address is still processed in transit and may sit in access logs |
| First-party endpoint, one processor under contract, EU region, no reuse | Traficom's "not shared with third parties"; CNIL's single-publisher and no-cross-checking conditions | Whether a processor counts as a third party is a legal question |
| Purpose limited to aggregate statistics | CNIL's purpose condition | — |
| Information and a way to object | CNIL's first two conditions; Traficom recommends informing even where no consent is needed | — |

**Reading, with its confidence.** Removing device storage, identifiers and addresses is necessary, and it is what makes omitting a prompt defensible. It is not, by itself, sufficient everywhere (LOW to MEDIUM as a legal conclusion):

- Under the **literal Finnish text**, a design that saves nothing on the device and uses nothing saved there appears to fall outside the rule. That is this document's reading of a quoted statute, not Traficom's statement.
- Under the **EDPB's reading**, events sent by the app's own script are within scope, and omitting a prompt then rests on an exemption. Neither Traficom nor the Working Party it cites grants analytics that exemption automatically.
- Under the **CNIL's regime**, measurement of this kind is exempt on stated conditions, which this design can meet.

This is why RELAY-11 is a table stake: the consent-free mode is the default the operator asked for, and the consent-gated mode stays available for a deployer whose assessment requires it.

**One point is firmer than the rest.** The existing design stamps a stored session id on every event, including answers to political statements. Linking a visit's answers to one identifier, sent alongside an address, is the configuration with the most exposure under both questions. Dropping the session id is the single change that matters most, and the operator has already ruled for it.

### What PostHog offers, and what fits

| Option | Stored on the device | Identifier | Address reaching PostHog | Fit |
| ------ | -------------------- | ---------- | ------------------------ | --- |
| Browser SDK, defaults | Cookie and local storage | Persistent | Visitor's | No |
| Browser SDK, memory persistence | Nothing | One per page load, held in memory | Visitor's | No: ships the SDK, sends from the browser to a third party |
| Browser SDK, `cookieless_mode: 'always'` | Nothing | Daily hash of team, salt, address, user agent and host, computed by PostHog; needs a project setting | Visitor's, required | No |
| Browser SDK, `cookieless_mode: 'on_reject'` | Nothing until consent | Hash for those who refuse | Visitor's | No: still a prompt |
| **Server-side capture as anonymous events** | Nothing | None that persists; random per event | The relay's | **Yes** |

Costs of the fitting option (MEDIUM, PostHog docs): no person properties, cohorts, lifecycle or group analytics; "unique users" and session-based web analytics are meaningless because every event has its own id. Counts, trends and breakdowns by event property work. The existing compound `pageview` event already carries a page's sub-events together, so within-page analysis survives without any identifier.

---

## Feature Dependencies

```
INFRA-04 health endpoint ─┐
INFRA-06 proxy settings ──┼──> INFRA-02 service ──> INFRA-09 rollout ──┐
INFRA-05 runtime config ──┘                                            │
                                                                       ├──> PIPE-07 smoke ──> PIPE-09 red run
SUPA-01 migrations ──> SUPA-06 bootstrap ──> SUPA-07 verification ─────┘
SUPA-02 auth settings ──> SUPA-05 functions ──> OBS-02, OBS-03, OBS-05, OBS-06
SUPA-03 API settings ──> OBS-07
INFRA + SUPA + PIPE ──> every OBS item ──> DOCS-03
OBS-04 headers ──> OBS-09 per-caller limit

RELAY-03 provider interface ──> RELAY-04 PostHog provider
RELAY-01 endpoint ──> RELAY-02 sender ──> RELAY-14 Umami removed
RELAY-05, RELAY-06 ──> RELAY-12 privacy tests
RELAY-10 configuration split ──> RELAY-11 consent mode ──> RELAY-13 privacy text
RELAY-01 ──requires──> INFRA-06 (cross-site check on the beacon)
RELAY-04 ──observed on──> the deployed stack (PIPE-07)

INFRA-D1 network edge ──enhances──> INFRA-09 (old chunks stay reachable)
RELAY-D1 log provider ──enhances──> RELAY-03, INFRA-08
RELAY-D2 opt-in linkage ──conflicts with──> removing the consent interface outright
```

### Dependency Notes

- **The application needs small changes before any infrastructure works.** A health route, the proxy settings, `PUBLIC_PROJECT_ID` in the templates, the bucket migration and the bootstrap are all application or schema work. They gate INFRA, SUPA and PIPE.
- **The relay does not depend on the deployment to be built.** It can be developed and E2E-tested locally against the in-memory provider. Only RELAY-04's real capture and the final privacy checks need the deployed stack. The two parts of the milestone can proceed in parallel and meet at PIPE-07.
- **The admin job store constrains the task count.** Admin jobs are held in process memory (OBSERVED), so with two tasks a progress request can reach a task that does not hold the job. Options are load-balancer stickiness, which sets a cookie on every visitor and complicates the "nothing stored" statement, or accepting the limit and documenting it. This needs a ruling before INFRA-02 is specified.
- **The survey link depends on the session id.** `surveyLink` substitutes `{sessionId}` (OBSERVED). Removing the id (RELAY-05) changes what that template can carry.
- **Settings changes ripple into the seed data.** The stored-settings schema is strict and pins `analytics.platform`; 23 dev-seed templates and `perm-analytics-tracking` write `analytics` (per the schema's comment). RELAY-10 must move all of them together or settings parsing degrades to `{}`, which the schema's own comments record as a past regression.
- **OBS-09 is blocked on OBS-04 by operator decision**, and may legitimately end in a recorded deferral.
- **SUPA-02's mechanism is the largest unknown in the Supabase group.** It should be settled by phase research on a throwaway project before requirements name a tool.

---

## Milestone Definition

### Core (the milestone is not done without these)

- [ ] INFRA-01 to INFRA-13 — a stack that can be applied and destroyed
- [ ] SUPA-01 to SUPA-09 — a hosted project reproducible from the repository, with verification
- [ ] PIPE-01 to PIPE-09 — plan, gated apply, smoke, and one observed red run
- [ ] OBS-01 to OBS-08, OBS-10 — measured and recorded
- [ ] OBS-09 — decided; implemented or deferred with its reason
- [ ] RELAY-01 to RELAY-14 — the relay, the PostHog provider, the privacy tests, Umami removed
- [ ] DOCS-01 to DOCS-08

### Add if capacity allows

- [ ] RELAY-D1 log provider — cheap, and makes the provider interface real
- [ ] INFRA-D1 network edge for immutable assets — when rollout skew or spike cost is observed
- [ ] INFRA-D3 alarms — before any real election
- [ ] PIPE-D1 fork-runnable workflow — design for it now even if it ships later
- [ ] OBS-D1 load test — before any real election
- [ ] SUPA-D3 hosted-and-local parity guard

### Defer

- [ ] RELAY-D2 opt-in session linkage — needs the operator's ruling and a legal view
- [ ] RELAY-D3 sampling, RELAY-D4 browser errors
- [ ] SUPA-D1 project creation by Terraform, SUPA-D2 settings drift job
- [ ] INFRA-D2 firewall, INFRA-D4 second environment, PIPE-D2 to PIPE-D4

## Feature Prioritization Matrix

| Feature | Operator value | Cost | Priority |
| ------- | -------------- | ---- | -------- |
| INFRA-04, INFRA-05, INFRA-06 (app-side prerequisites) | HIGH | LOW | P1 |
| INFRA-01 to INFRA-03, INFRA-07 to INFRA-13 | HIGH | MEDIUM | P1 |
| SUPA-01, SUPA-03, SUPA-04, SUPA-08, SUPA-09 | HIGH | LOW | P1 |
| SUPA-02, SUPA-05, SUPA-06, SUPA-07 | HIGH | MEDIUM to HIGH | P1 |
| PIPE-01 to PIPE-06, PIPE-08 | HIGH | MEDIUM | P1 |
| PIPE-07, PIPE-09 | HIGH | MEDIUM to HIGH | P1 |
| OBS-01 to OBS-08, OBS-10 | HIGH | LOW each | P1 |
| OBS-09 | MEDIUM | MEDIUM to HIGH | P1 to decide, P2 to build |
| RELAY-01 to RELAY-09, RELAY-12, RELAY-14 | HIGH | MEDIUM | P1 |
| RELAY-10, RELAY-11, RELAY-13 | HIGH | MEDIUM | P1 |
| DOCS-01 to DOCS-08 | HIGH | LOW to MEDIUM | P1 |
| RELAY-D1, INFRA-D3, SUPA-D3 | MEDIUM | LOW | P2 |
| INFRA-D1, PIPE-D1, OBS-D1 | MEDIUM to HIGH | MEDIUM | P2 |
| RELAY-D2, RELAY-D3, RELAY-D4, SUPA-D1, SUPA-D2, INFRA-D2, INFRA-D4, PIPE-D2 to PIPE-D4, OBS-D2, OBS-D3 | LOW to MEDIUM | varies | P3 |

## Todo absorption map

| Todo | Absorbed by | Expected disposition |
| ---- | ----------- | -------------------- |
| `2026-08-31-evaluate-self-hosted-posthog-log-sink` | INFRA-08, RELAY-04, RELAY-D4, and the two anti-features on self-hosting and log sinks | Closed with the comparison recorded: container logs are the durable server sink; PostHog Cloud EU receives analytics; self-hosting is not provisioned |
| `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e` | RELAY-10, RELAY-11, RELAY-12 | Closed |
| `2026-09-02-deployment-guide-production-redirect-allowlist` | SUPA-02, OBS-02, DOCS-02 | Closed |
| `2026-09-18-document-supabase-api-limits-for-deployments` | SUPA-03, OBS-07, DOCS-02 | Closed |
| `2026-10-02-deployment-config-gaps-found-by-docs-rewrite` | INFRA-05, OBS-08 (item 1); DOCS-04 (item 2); DOCS-07 (item 3); SUPA-04 (item 4) | Closed, with a ruling needed on items 2 and 3 |
| `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables` | SUPA-02, SUPA-05, SUPA-07, OBS-01 to OBS-03, OBS-05, OBS-06, DOCS-03 | Closed, with the observations recorded where it is closed |
| `2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations` | OBS-04, OBS-09, OBS-D2 | Measured and decided; closed only if the limit is built |

## Comparable approaches

| Aspect | Today's reference (`render.example.yaml`) | Common practice | Approach here |
| ------ | ----------------------------------------- | --------------- | ------------- |
| Frontend hosting | A Blueprint an operator edits by hand | Infrastructure as code, one module per instance | INFRA |
| Supabase configuration | Nine dashboard and SQL-editor steps | CLI and settings applied from the repository, verified after | SUPA |
| Deploy | Render's automatic deploy, off by default | Plan on review, gated apply, smoke test | PIPE |
| Hosted behaviour | Stated, marked unverified | Observed and recorded | OBS |
| Analytics | A third-party script in the browser, gated on consent, with a stored session id | A first-party endpoint that forwards server-side | RELAY |

## Open questions for the operator

1. **Consent mode.** Keep the consent-gated mode as a setting (recommended, RELAY-11), or remove the consent interface outright?
2. **Answer events.** Are answers to statements sent in consent-free mode? They are the most sensitive events and, once unlinked, also the least useful one at a time.
3. **Session linkage.** None (recommended for this milestone), or an opt-in tier (RELAY-D2)?
4. **Survey link.** What replaces `{sessionId}` when there is no session id?
5. **Contestant and Admin apps.** Excluded from consent-free tracking (recommended)?
6. **Admin jobs and the task count.** Stickiness, a documented limit, or moving the job store?
7. **`render.example.yaml`.** Fixed and kept, or retired?
8. **The test project.** A persistent hosted project for the pipeline is assumed. Whether a free-tier project stays awake between runs was not checked.

## Gaps this research did not close

- The mechanism for SUPA-02, including what `supabase config push` sends for settings the file does not declare. One third-party source claims local defaults go out; it is unverified and must be tested on a throwaway project before any push to a real one.
- Whether `supabase seed buckets --linked` creates the declared buckets on a hosted project.
- Which origin mechanism the installed adapter-node uses. The current SvelteKit documentation shows `paths.origin` in the Vite configuration fed from `process.env.ORIGIN`; the repository pins `@sveltejs/kit ^2.70.3` and `adapter-node ^5.5.7`. Confirm against the installed version.
- Whether `SIGTERM` reaches the Node process with the image's shell-form `CMD`.
- Whether the Node SDK for PostHog disables GeoIP by default.
- The full text of PostHog's cookieless documentation: the page body could not be fetched, and the claims here come from search extracts of it.
- CNIL's 2025 revision of its audience-measurement guidance, and the current state of the Digital Omnibus proposal.
- Whether the app depends on Supabase's image transformation, which is enabled in the local `config.toml`. No call was found in a quick search of `apps/frontend/src`; that search was not exhaustive.

## Sources

Primary documents read in full or in the relevant part:

- [EDPB Guidelines 2/2023 on the Technical Scope of Art. 5(3) of the ePrivacy Directive, version 2.0](https://edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf) — MEDIUM
- [Traficom, Guidance on the use of web cookies for service providers, 11 November 2022](https://kyberturvallisuuskeskus.fi/files/media/regulation/Guidance_on_the_use_of_web_cookies_for_the_service_providers%20%28002%29.pdf) — MEDIUM
- [CNIL, Sheet n°16: Use analytics on your websites and applications](https://cnil.fr/en/node/677) — MEDIUM
- [PostHog, Anonymous vs identified events](https://posthog.com/docs/data/anonymous-vs-identified-events) — MEDIUM
- [PostHog, Capture API](https://posthog.com/docs/api/capture) — MEDIUM
- [PostHog, Controlling data collection](https://posthog.com/docs/privacy/data-collection) — MEDIUM
- [GitHub, Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) — MEDIUM

Vendor documentation from one fetch, no second source:

- [SvelteKit, adapter-node](https://svelte.dev/docs/kit/adapter-node) — LOW
- [Supabase Terraform provider, `supabase_settings`](https://github.com/supabase/terraform-provider-supabase/blob/main/docs/resources/settings.md) — LOW
- [Supabase CLI, `config push`](https://supabase.com/docs/reference/cli/supabase-config-push) — LOW
- [Supabase, Branching configuration](https://supabase.com/docs/guides/deployment/branching/configuration) — LOW
- [Supabase CLI, `seed buckets`](https://supabase.com/docs/reference/cli/supabase-seed-buckets) — LOW
- [PostHog, Reverse proxy](https://posthog.com/docs/advanced/proxy) — LOW
- [PostHog, Node.js SDK reference](https://posthog.com/docs/references/posthog-node) — LOW

Through search extracts only:

- [PostHog, Cookieless tracking](https://posthog.com/docs/privacy/cookieless-tracking) — LOW
- [AWS, App Runner availability change](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html) — MEDIUM (several sources agree)
- [PostHog repository README, self-hosting](https://github.com/PostHog/posthog) — LOW
- [Supabase discussion on `X-Forwarded-For` in Edge Functions](https://github.com/orgs/supabase/discussions/7884) — LOW
- Secondary commentary on the Digital Omnibus proposal — LOW

Repository, observed at `0f97645a7`:

- `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`
- `render.example.yaml`, `docker-compose.dev.yml`, `apps/frontend/Dockerfile`, `.env.example`
- `apps/frontend/src/lib/contexts/app/tracking/` and `apps/frontend/src/lib/components/analytics/umami/`
- `apps/frontend/src/routes/+layout.svelte`, `apps/frontend/src/routes/api/`
- `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte`
- `apps/frontend/src/lib/contexts/app/survey.svelte.ts`, `apps/frontend/src/lib/server/admin/jobs/jobStore.ts`
- `packages/app-shared/src/settings/staticSettings.type.ts`, `packages/app-shared/src/data/schemas/storedSettings.schema.ts`
- `packages/app-shared/src/logging/logger.type.ts`
- `apps/supabase/supabase/config.toml`
- `tests/playwright.config.ts`, `tests/tests/fixtures/shared/trackingIntercept.fixture.ts`
- `.github/workflows/main.yaml`
- the eight todos named in the milestone context, under `.planning/todos/pending/`

---
*Feature research for: v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay*
*Researched: 2026-10-10*

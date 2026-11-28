# Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit - Research

**Researched:** 2026-11-15
**Domain:** Analytics relay (SvelteKit server + PostHog Cloud EU), CloudFront/WAF (Terraform), load testing (k6), Postgres rate limiting behind a Supabase Edge Function
**Confidence:** MEDIUM overall (repo facts HIGH; PostHog billing behaviour LOW; WAF/CloudFront/k6 MEDIUM)

## Summary

Almost all of the phase can be written and proven locally before 187's pipeline exists. The code changes are small: one new analytics variable through the task-environment contract (5 files and 2 tests must move together), a skip-while-in-flight timer in `queue.ts`, one new root pass-through (`stop_timeout_seconds` is **not passed by either AWS root today**, so B-05 needs a root variable, not just a tfvars line), one nullable WAF variable in the module, and one appended migration plus a function change for the per-caller limit. The deployed half is a sequence of operator sittings, all after 187's first green run.

The research changes four of CONTEXT's assumptions. (1) The function's conformance test pins **more than** `flowConformance.test.ts:257`: three other assertions break the moment `index.ts` reads `req.headers` (the read-set pin, the one-header-read pin) or awaits inside a link branch (the uniform-answer pins). The take must therefore sit in the handler **before** the operation branches, and two pins must be amended deliberately. (2) The **local** stack seeds `behind_cloudflare = true` (`seed.sql`), so "trust only when behind_cloudflare" alone would make the local limit key on whatever a client sends. The rule must be: trusted **and** the header is present **and** parses as an address, otherwise skip. Because Kong forwards a client-sent `cf-connecting-ip` locally, the limit can also be proven locally with `curl` before anything is pushed. (3) B-03's "which `distinct_id` placement was used" is unobservable, because both placements carry the same value; PostHog's capture docs settle it (the top level wins). (4) PostHog's free plan is "1 project" and needs no card. Whether a billing limit can be set without a card is not stated anywhere I could open. So A-02 becomes "record which plan the org is on and what its UI offers". The free plan's own drop at 1M is a search extract only.

On the provisional items: WAF pay-as-you-go pricing is confirmed ($5 + $1 + $0.60/M, every distribution request billed). CloudFront now sells per-distribution flat-rate plans; the **Free plan ($0) covers the web ACL, rules and request fees** for up to 1M requests a month. That is worth recording beside the figure, but it is console-subscribed, needs an associated web ACL that cannot be removed while subscribed, and is out of this phase's scope. k6 **2.4.0** (released 2026-11-12) is current, and its official image is `grafana/k6`. Nothing in the AWS or Supabase policies forbids a workstation-sized load check of your own staging stack. Supabase asks only Team/Enterprise plans for two weeks' notice of *heavy* load testing.

**Primary recommendation:** Run the eight local plans first (flush variable + overlap fix, stop timeout, WAF variable + terraform test, caller-limit migration/RPC + pgTAP, function change + vitest, k6 script + wrapper, refusal script, closing gates + one E2E run). Then run the operator-gated sittings in the order PostHog setup → pipeline run → capture/SIGTERM/fail-open/none/refusals/queue → hosted limit → WAF plan → load check. Prove the per-caller limit and the refusal script locally first; they are the two deployed checks most likely to surprise.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Relay judgement (origin, size, schema) | Frontend Server (SvelteKit route `/api/usage`) | — | `relay.ts` runs in the adapter-node process; the browser only posts |
| Batching, flush timer, shutdown flush | Frontend Server (`queue.ts`, `runtime.ts`) | ECS (stop timeout, SIGTERM) | The process owns the queue; ECS owns the signal and the kill deadline |
| PostHog privacy (no `$ip`, no GeoIP) | External service (PostHog project settings) | Frontend Server (`$process_person_profile:false`, `$geoip_disable:true`) | The address PostHog sees is the task's; only the project setting discards it |
| Provider switch without rebuild | Infra (Terraform task definition env) | Frontend Server (read at start) | Env var change → new task definition revision, same image digest |
| Relay rate rule (WAF) | CDN / Edge (CloudFront-scope web ACL, us-east-1) | — | CloudFront sees the viewer address directly; opt-in, off by default |
| Per-caller limit on invitation operations | API / Backend (Edge Function reads header) | Database (RPC takes the slot, decides trust) | The browser calls the function directly; no tier we own sits in front of it; trust lives in `private.deployment_settings` |
| Load check | External generator (workstation, k6 in Docker) | CDN, Frontend Server, Supabase | Measures the serving path; the generator's own CPU must be read |

## User Constraints

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Every answer below is the unreviewed ★ RECOMMENDED option of `188-DISCUSSION-POINTS.md`. The operator was away and may overrule any of them there before execution; CONTEXT.md is then rewritten from the fill. Decisions marked **provisional — research** take the research step's answer where it contradicts them, and the plan says so.

#### Inputs and sequencing
- **A-01** The PostHog key already stored at `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` (185-11, 2026-11-12, `answer_posthog_kind=real`) is kept, after the operator confirms it is a Cloud EU project dedicated to staging that they own. The phase never handles its value. The first capture also proves the region. — **Reversibility:** costly — a different project means an overwrite of the parameter, a forced deployment and a stale 185 record.
- **A-02 (provisional — research)** A Product analytics billing limit at the lowest amount PostHog accepts (ideally $0, stopping at the 1M free events), other products off; the operator sets it, the phase records amount and date. Research settles whether a limit needs a paid plan and what the free plan does past 1M. — **Reversibility:** reversible — a UI setting.
- **A-03** Local plans run now; every deployed observation waits for 187's first green pipeline run, which brings this phase's image to staging. Transient observations are hand applies with `-var image_digest=<running digest>` and `environment_overrides` (185-15 pattern), each restored. — **Reversibility:** costly — an all-hand path would leave hand state for the first pipeline run to reconcile.
- **A-04** Events are read back with an operator-created, read-only, project-scoped personal API key from the keychain, via HogQL on the EU app host, in an approved sitting; reads print named lines only.

#### The relay on the stack (RELAY-04)
- **B-01** `ANALYTICS_PROVIDER = "posthog"` stays in `infra/envs/staging/aws/terraform.tfvars` at the end of the phase. — **Reversibility:** reversible — one tfvars line and a rollout.
- **B-02** The PostHog project discards client IP data and has GeoIP off (operator, UI); no code change. The read requires `$ip` absent.
- **B-03** First capture: one consenting browser journey, one HogQL read over its window. Named lines: events > 0; `$ip`, `$geoip_*`, `$user_agent`/`$raw_user_agent`, `$current_url`, `$referrer`, `$host` absent; person processing off and no person row; `$session_id` accepted on visit-id events, absent on the pageview; which `distinct_id` placement was used (the duplicate stays).
- **B-04** A new private `ANALYTICS_FLUSH_INTERVAL_MS` (default 2000, accepted 500–600000, a `value` entry in `infra/modules/frontend-service/task-environment.json`, not required, resolved and unit-tested with the other analytics variables). SIGTERM observation: override to 600000, send K events, `aws ecs stop-task`, count exactly K in PostHog, shutdown line in CloudWatch. — **Reversibility:** costly — a new entry in the task-environment contract, its docs and its tests.
- **B-05** `stop_timeout_seconds = 40` in the staging tfvars (≥ `SHUTDOWN_TIMEOUT` 25 + forward timeout 10 + 5), the bound stated in the variable's description.
- **B-06** Fail-open: hand override `ANALYTICS_POSTHOG_HOST=https://posthog.invalid`; deployed smoke run green, relay 204, warn line `transport: ENOTFOUND`; restored.
- **B-07** Switch to `none`: hand apply with the running digest and `ANALYTICS_PROVIDER=none`; same digest before and after in the task definition; 0 events after the rollout; restored.
- **B-08** Batching evidenced by the unit tests on the served commit plus one read: one relay request of N events yields N events within one flush interval.

#### Abuse resistance (RELAY-09)
- **C-01** One committed `curl` script, provider active, named lines: `Sec-Fetch-Site: cross-site` → 403; foreign `Origin` without it → 403; declared 33 KiB → 413; chunked 33 KiB undeclared → 413; extra envelope key (`destination`/`host`) → 400; `url`/`host` inside an event → 204 and nothing at PostHog. The provider-`none` 204 of 2026-11-15 is the recorded control.
- **C-02** Full queue: with the 600000 override on one task (floor = ceiling = 1 for the burst), 21 requests × 50 events → `dropped: 50` in CloudWatch, memory flat.
- **C-03** `queue.ts`: a timer tick is skipped while a flush is in flight (bound 2 × cap), with a unit test of a hanging provider.
- **C-04** One nullable module variable `relay_rate_limit = null`. When set: CLOUDFRONT-scope `aws_wafv2_web_acl` through `aws.us_east_1`, default allow, one rate-based rule keyed on source address and scoped down to `/api/usage`, action block; `web_acl_id` on the distribution. When null: no resource, the running stack's plan unchanged. `terraform test` asserts both; the staging root passes it through unset. — **Reversibility:** costly — the module interface and the distribution resource; a wrong default would change the live distribution.
- **C-05 (provisional — research)** Planned, not applied: one hand plan with the variable on, resource list recorded. Cost recorded with its date: $5/month ACL + $1/month rule + $0.60 per million requests, every distribution request inspected. The deploy role gets no `wafv2` permission; the variable's description says one is needed before switching it on. Research checks CloudFront flat-rate plans.

#### The load check (OBS-11) — provisional — research
- **D-01** k6 from its official container image at a pinned version; no repository dependency. — **Reversibility:** costly — the tool fixes the script language and the method the recorded figure rests on.
- **D-02** An HTTP replay of one recorded voter journey: server-rendered pages through CloudFront, the Supabase reads the browser makes (recorded once, filtered to the two hosts), relay posts with valid batches; immutable assets left out.
- **D-03** Provider `log` for the run (hand override), restored afterwards.
- **D-04** Stepped arrival rate, 5-minute steps, stack as configured (floor 1, ceiling 2). Thresholds: page p95 < 1000 ms, relay p95 < 300 ms, errors < 1 %; abort at > 5 % for a minute. The figure is the highest step meeting all thresholds, in journeys per minute, with date, commit, task count and CPU, and the bounding resource named. Script and method committed; the JSON summary in evidence.
- **D-05** Generated from this workstation, the generator's CPU and network read per step.
- **D-06** Nothing runs before research records AWS's and Supabase's load-testing policies and the operator states the hosted project's plan; step sizes stay under its limits.

#### The per-caller limit (OBS-09)
- **E-01** Built in this phase, keyed on `cf-connecting-ip` at `account-access` (184-13: the client on every served request, a client-sent value refused by Cloudflare). — **Reversibility:** one-way — it lands as an appended migration on the hosted project.
- **E-02** The function reads `cf-connecting-ip` and passes it to a new `service_role`-only RPC in an appended migration, which takes a slot keyed `caller:<project>:<address>` via `private.invitation_throttle_take` and trusts the header only when `private.deployment_settings.behind_cloudflare` is true; otherwise the per-caller limit is skipped, never a shared bucket. IPv6 keyed by /64. The take runs first, for all four operations (`check-code`, `request-link`, `code-sign-in`, `request-recovery`). The conformance pin at `flowConformance.test.ts:257` stays (it does not name `cf-connecting-ip`). — **Reversibility:** one-way — schema is append-only after the freeze.
- **E-03** One bucket per caller per project across the four operations, 30 takes per 10 minutes, constants in the migration.
- **E-04** The address is the key (feedback-limit precedent); the take deletes `caller:` rows whose window has ended. The privacy docs name it. — **Reversibility:** costly — what is stored about callers is a privacy statement the docs make.
- **E-05** HTTP 429 with `Retry-After`, the same body for every operation; the frontend shows its existing function-failure error; no new strings.
- **E-06** Seen on the hosted function: `check-code` with unknown codes from the workstation until the 31st answers 429; at the same minute from AWS CloudShell answered normally; after the window the workstation is answered again. Locally: pgTAP with `behind_cloudflare` set inside the test transaction, a Deno unit test of the header read.
- **E-07** Migration and function reach the hosted project through 187's pipeline steps (the first appended migration there). The todo `2026-10-07-174-…` closes with the evidence; its sequential-scan item moves to a new todo.

#### Records and gates
- **F-01** Raw evidence in `188-*/evidence/`; dated Observations rows in `infra/envs/staging/aws/README.md` (capacity, WAF cost, PostHog checks) and `infra/envs/staging/supabase/README.md` (the limit); the load method beside its script.
- **F-02** Targeted unit, `terraform test` and pgTAP checks per plan; one full local E2E run via `tests/scripts/e2e-run.sh` at phase end; the deployed smoke run after every staging rollout.

### Claude's Discretion
- File locations of the load script and the refusal script, and the RPC's name.
- The exact validation bounds of `relay_rate_limit` (within AWS's accepted values).
- The HogQL queries, as long as they print named lines only.

### Deferred Ideas (OUT OF SCOPE)
- Applying the WAF rule (opt-in; needs `wafv2` on the deploy role first).
- The sequential scan of `invitation_link_request` (new todo).
- Removing the duplicate `distinct_id` placement, if B-03 shows one is ignored.
- A dedicated "too many attempts" message in seven locales.

Also out of scope (CONTEXT § Phase Boundary): a project-wide cap on the invitation operations; any change to 187's workflow files; a second environment (A1).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RELAY-04 | A PostHog provider captures server-side to the EU host (configurable), with no person profile and no client address, in batches, flushed at shutdown, failing open. | § PostHog findings (IP setting, GeoIP transformation, query API, `distinct_id` precedence); Pattern 1 (flush variable); Pattern 2 (overlap fix); Pitfalls 1–5; § Root pass-through for `stop_timeout_seconds` |
| RELAY-09 | Same-origin only, body cap, bounded queue that drops when full, no caller-chosen destination; WAF rate rule as an off-by-default Terraform variable. | Pattern 3 (WAF variable shape and test); § WAF cost; Pitfalls 6–8 (chunked through CloudFront, the drop line's timing, memory metric) |
| OBS-09 | Per-caller limit decided after OBS-04: built if the measurement supports a design. | Pattern 4 (migration/RPC), Pattern 5 (function wiring and the conformance pins that must move); Pitfalls 9–14 |
| OBS-11 | Load check of the voter journey and relay against the deployed stack yields a recorded capacity figure. | § Load check (k6 2.4.0 image, method, policies, thresholds); Pattern 6; Pitfalls 15–17 |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E is a cardinal gate:** no plan completes with a failing E2E test; no "known-flaky" exemptions; "did not run" counts as failure; a void run (exit 8, `VOID-host-suspend.txt`) is not evidence and is re-run under a new `--run-dir`. Standing rule (memory, 2026-11-09): targeted runs within the phase, **one** full run at phase end via `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`.
- **Schema is frozen:** a schema change is one commit with three parts: the `schema/` edit, the next numbered migration (`00002_<name>.sql`), and its manifest line with sha256. Then `yarn check:schema-equivalence` (Docker), read the migration, and `yarn db:types`. `yarn assert:schema-migration-parity` (in `lint:check`) fails on any edit of a listed migration.
- **After a schema change:** `yarn db:types` regenerates `packages/supabase-types/`; `yarn db:lint:sql` lints the applied DB (needs `yarn db:start`).
- **Comment hygiene** under `apps/`, `packages/`, `tests/`: no historical narrative, no `.planning/` paths, no plan/decision ids, no reviewer-addressed text; the only allowed form is a bare `see phase N`. Gated by `assert:comment-hygiene` in `lint:check`.
- **TypeScript strictly:** no `any`; TSDoc on exported symbols.
- **Localization:** all user-facing strings in every locale (E-05's "no new strings" keeps this phase clear of it).
- **Never commit secrets** (the anon key, the PostHog key and personal key, the DB password).
- **Code review checklist** `.agents/code-review-checklist.md` applies.
- **Skills:** `Skill("database")` for the migration, RPC and pgTAP (and the user-installed `supabase-postgres-best-practices`: load before writing SQL). The project skill wins on conflict (`recommended-skills`).
- **Memory constraints relevant here:** the shared local Supabase stack may be reset from `-infra` freely; check `edge_runtime` is up after a host reboot; `yarn test:unit` needs the stack running; background long gates (600 s executor watchdog); never read a gate's status through a pipe; executors ignore "CONTEXT WARNING NN%".

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| k6 (official image `grafana/k6`) | 2.4.0, pin `grafana/k6:2.4.0@sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276` | Load generator: arrival-rate executors, thresholds with abort, JSON summary | `[VERIFIED: Docker Hub API tag list, 2026-11-15; GitHub release v2.4.0 published 2026-11-12]`. The digest is the tag's digest as Docker Hub reports it; the executor confirms it is the multi-arch index with `docker buildx imagetools inspect grafana/k6:2.4.0` before committing it |
| Terraform | 1.16.5 (installed; same as pipeline) | `terraform test` of the module's WAF branch | `[VERIFIED: terraform version]` |
| hashicorp/aws provider | `~> 6.60` (module constraint) | `aws_wafv2_web_acl` with `rate_based_statement` | `[VERIFIED: infra/modules/frontend-service/main.tf:5-9]` |
| vitest | catalog (repo) | Frontend analytics unit tests; function tests (run under Node, **not** Deno) | `[VERIFIED: apps/supabase/vitest.config.ts includes 'supabase/functions/**/*.test.ts']` |
| pgTAP via `supabase test db` | Supabase CLI 2.118.0 (workspace devDependency) | RPC behaviour, grants, census pins | `[VERIFIED: apps/supabase/node_modules/.bin/supabase --version]` |
| PostHog query API | Cloud EU, `https://eu.posthog.com/api/projects/:project_id/query/` | Read-back with HogQL | `[CITED: posthog.com/docs/api/queries]` |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `curl` 8.7.1 | The refusal script (C-01) and the per-caller observation (E-06) | Local first (dev server; local function), then deployed |
| `infra/scripts/running-image-digest.sh` | Every hand apply's `-var image_digest=` and the B-07 before/after check | Every deployed sitting |
| `infra/scripts/request-loop.sh` | Beside a rollout (B-07) to show no non-2xx answer | Optional on B-07 / B-05 rollouts |
| Playwright (repo) `tests/playwright.deployed.config.ts` | Recording the voter journey's request list once (D-02); the deployed smoke run after each rollout | D-02 recording; F-02 |
| AWS CloudWatch `AWS/ECS` `CPUUtilization` / `MemoryUtilization` (service dimensions) | C-02 "memory flat", D-04 CPU per step | Deployed sittings; no Container Insights needed `[ASSUMED]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written k6 script from a recorded request list | `har-to-k6` converter | Adds an npm tool and replays hard-coded ids and headers (anon key, cookies) into a committed file; rejected |
| Pay-as-you-go WAF figure | CloudFront flat-rate **Free** plan ($0 incl. WAF for ≤1M req/month) | Console subscription per distribution; requires a web ACL that cannot be removed while subscribed; AWS Free Tier accounts ineligible; Terraform support not confirmed. Record it as the alternative figure; do not adopt it here |
| Postgres throttle row | Upstash Redis (Supabase's official Edge Function rate-limit example) | External service and a new secret; the repo already has `private.invitation_throttle_take` |

**Installation:** nothing is installed into the repository. k6 runs as `docker run --rm -i -v <dir>:/scripts:ro grafana/k6:2.4.0@sha256:… run /scripts/<file>.js`.

## Package Legitimacy Audit

No npm, PyPI or crates package is added by this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `grafana/k6` (container image, not a package) | Docker Hub | official Grafana image, tag 2.4.0 pushed 2026-11-12 | n/a | github.com/grafana/k6 | not run (the seam covers npm/pypi/crates only) | Approved, pinned by digest; executor re-checks the digest |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                 ┌──────────── browser (voter) ─────────────┐
                 │  page loads          POST /api/usage      │  supabase.functions.invoke('account-access')
                 └────┬─────────────────────┬────────────────┘           │
                      ▼                     ▼                            ▼
              CloudFront (us-east-1 web ACL: only when relay_rate_limit set;   Cloudflare (sets cf-connecting-ip,
              rate rule scoped to /api/usage, else no ACL)                       refuses a client-sent one: 403)
                      │                                                          │
                      ▼                                                          ▼
              ALB (x-origin-verify) ──► ECS task (adapter-node)            Edge Function account-access
                                        │   SSR load ──► Supabase REST       │ parse body → project_id
                                        │                                    │ take = rpc(caller_take, {project, cf-connecting-ip})
                                        ▼                                    │   ├─ 429 + Retry-After (same body, every op)
                                  relay(): provider none? → 204              │   ├─ rpc error → 500 internal
                                   Sec-GPC → 204; origin → 403;              │   └─ admitted → existing branches unchanged
                                   type → 415; size → 413; schema → 400      ▼
                                        │ enqueue (cap 1000, drop+count)   Postgres: invitation_caller_take()
                                        ▼                                    │ trusted? (behind_cloudflare AND header parses)
                                  queue timer (ANALYTICS_FLUSH_INTERVAL_MS;  │   no → admit, no row
                                   tick skipped while a flush is in flight)  │   yes → project exists? → key caller:<p>:<addr|/64>
                                        │            ▲ sveltekit:shutdown    │        delete ended caller: rows; throttle_take(30, 10 min)
                                        ▼            │ (after drain ≤25 s)   ▼
                                  provider: none | log (stdout→CloudWatch) | posthog → https://eu.i.posthog.com/batch/
                                                                                   │ (10 s timeout, warn on failure)
                                                                                   ▼
                                                              PostHog EU project: discard IP, GeoIP transformation off
                                                                                   ▲
                                              HogQL read: POST https://eu.posthog.com/api/projects/<id>/query/ (personal key)
```

### Recommended Project Structure (new files only)
```
apps/frontend/src/lib/server/analytics/
├── config.ts                # + flushIntervalMs in ANALYTICS_ENV and AnalyticsConfig
├── runtime.ts               # passes it to createQueue
└── queue.ts                 # tick skipped while a flush is in flight
apps/supabase/supabase/
├── migrations/00002_invitation_caller_limit.sql
├── schema/506-invitation-rpcs.sql        # same function + comment updates
├── schema/107-feedback.sql               # comment: deployment_settings now has two readers
├── tests/database/48-invitation-caller-limit.test.sql
└── functions/account-access/
    ├── callerLimit.ts       # pure: read header, build 429 answer; importable by vitest
    └── callerLimit.test.ts
infra/modules/frontend-service/
├── waf.tf                   # count-gated aws_wafv2_web_acl (provider aws.us_east_1)
├── edge.tf                  # web_acl_id = one(aws_wafv2_web_acl.relay[*].arn)
└── variables.tf             # relay_rate_limit (nullable object), stop_timeout description
infra/scripts/
├── load-check.sh + load-check/voter-journey.js + load-check.test.ts   # Claude's discretion: location
└── relay-refusals.sh + relay-refusals.test.ts                         # Claude's discretion: location
```
Put the k6 script under `infra/`, not `tests/`. `tests/` is linted (`eslint tests`) and typechecked (`typecheck:tests`), and `k6/http` imports resolve nowhere in Node. `infra/` is no workspace; its vitest config includes only `scripts/**/*.test.ts` `[VERIFIED: infra/vitest.config.ts]`.

### Pattern 1: `ANALYTICS_FLUSH_INTERVAL_MS` through the task-environment contract (B-04)

**What:** one value entry that must move together through every place the contract checks.

**Exact touch list** (each verified this session):
- `apps/frontend/src/lib/server/analytics/config.ts:11-17`, which today reads verbatim:
  ```ts
  export const ANALYTICS_ENV = {
    provider: 'ANALYTICS_PROVIDER',
    consentMode: 'ANALYTICS_CONSENT_MODE',
    visitIdMode: 'ANALYTICS_VISIT_ID_MODE',
    posthogKey: 'ANALYTICS_POSTHOG_KEY',
    posthogHost: 'ANALYTICS_POSTHOG_HOST'
  } as const;
  ```
  `[VERIFIED: config.ts:11-17]`. Add `flushIntervalMs: 'ANALYTICS_FLUSH_INTERVAL_MS'`; add `flushIntervalMs: number` to `AnalyticsConfig`. Parse `^\d+$`, accept 500..600000, and default to 2000 when unset. Out of range or non-integer → `{ variable, reason: 'invalid' }` with **no** `provided` (the existing rule: `provided` only for vocabulary variables `[VERIFIED: config.ts:40]`). Because "any problem at all resolves the provider to `none`" `[VERIFIED: config.ts:50, 77]` and `analyticsStartupProblems` feeds `STARTUP_RULES` `[VERIFIED: requiredEnv.ts:22]`, an invalid value **refuses start** by name. That is consistent with the other analytics variables; state it in the description.
- `runtime.ts:29`: `createQueue({ provider })` becomes `createQueue({ provider, flushIntervalMs: analyticsConfig.flushIntervalMs })` `[VERIFIED: runtime.ts:29]`.
- `infra/modules/frontend-service/task-environment.json`: new `{ "name": "ANALYTICS_FLUSH_INTERVAL_MS", "source": "value", "required": false, "description": "…" }`.
- `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts:33-39`: the locally restated `ANALYTICS_NAMES` must gain the name. The test asserts the list "holds every name of `ANALYTICS_ENV`", that every name is in `.env.example` (live or commented line), that every name is in backticks in the runbook section starting `## The task` of `infra/envs/staging/aws/README.md`, and that every AWS root's `environment_values` sets every `value` name `[VERIFIED: taskEnvironment.test.ts:2, 41-48, 103-119]`.
- `.env.example` (Analytics block, ~line 320): add `# ANALYTICS_FLUSH_INTERVAL_MS=2000` with one comment line.
- `infra/envs/staging/aws/terraform.tfvars` **and** `infra/envs/example/aws/terraform.tfvars`: `ANALYTICS_FLUSH_INTERVAL_MS = "2000"`. Both are required, because the module's `missing_values` precondition requires every value entry `[VERIFIED: main.tf:50]`.
- `infra/envs/staging/aws/README.md` § "The task's environment" table (~line 212): a row for the name.
- `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`: both `environment_values` blocks (~lines 126-141 and ~288) gain the key, and `length(output.task_environment_names) == 16` at line 186 becomes 17 `[VERIFIED: grep line 186]`.
- `config.test.ts`: every `toEqual` of a resolved config gains `flushIntervalMs: 2000`; add the bounds cases (499, 500, 600000, 600001, `"2s"`, `" 2000 "`, blank).
- Optional parity: `docker-compose.dev.yml` passes the other `ANALYTICS_*` through `[VERIFIED: docker-compose.dev.yml:21-25]`; add the line for symmetry (no test enforces it).

### Pattern 2: Skip a tick while a flush is in flight (C-03)

Today the timer calls `setInterval(() => void flush(), flushIntervalMs)` `[VERIFIED: queue.ts:96]`, and each `flush()` splices the whole pending array `[VERIFIED: queue.ts:86]`. With a 10 s forward timeout `[VERIFIED: posthog.ts:16]` and a 2 s interval, five flushes overlap.

```ts
// Source: repo pattern; vitest fake timers as in queue.test.ts:127-149
let inFlight: Promise<void> | undefined;
const timer = setInterval(() => {
  if (inFlight) return; // at most one timer flush holds taken events besides the queue
  inFlight = flush().finally(() => {
    inFlight = undefined;
  });
}, flushIntervalMs);
timer.unref();
```
The shutdown handler keeps calling `flush()` directly (`queue.ts:113-118`), so a shutdown during a hung timer flush still sends the rest. Bound: cap in `pending` plus one taken batch, so 2 × cap. Unit test: a provider whose `capture` returns a promise resolved only by the test; `vi.advanceTimersByTimeAsync(10_000)` with interval 2000 → `capture` called once, not five times; resolve it, and the next tick flushes again.

### Pattern 3: The off-by-default WAF variable (C-04)

```hcl
# variables.tf — bounds from AWS: windows 60/120/300/600 s; lowest limit 10
variable "relay_rate_limit" {
  description = "Requests per window per viewer address that /api/usage admits before CloudFront answers 429; null (the default) creates no web ACL. Switching it on needs wafv2 actions on the deploy role first, and adds about $6 a month plus $0.60 per million requests, every request to the distribution being inspected."
  type = object({
    limit          = number
    window_seconds = number
  })
  default  = null
  nullable = true
  validation {
    condition = var.relay_rate_limit == null || (
      contains([60, 120, 300, 600], var.relay_rate_limit.window_seconds) &&
      var.relay_rate_limit.limit >= 10 && var.relay_rate_limit.limit <= 2000000000 &&
      floor(var.relay_rate_limit.limit) == var.relay_rate_limit.limit
    )
    error_message = "relay_rate_limit needs window_seconds of 60, 120, 300 or 600 and an integer limit from 10."
  }
}

# waf.tf
resource "aws_wafv2_web_acl" "relay" {
  count    = var.relay_rate_limit == null ? 0 : 1
  provider = aws.us_east_1
  name     = "${local.name}-relay"
  scope    = "CLOUDFRONT"
  default_action { allow {} }
  rule {
    name     = "relay-rate"
    priority = 0
    action {
      block {
        custom_response { response_code = 429 }
      }
    }
    statement {
      rate_based_statement {
        limit                 = var.relay_rate_limit.limit
        evaluation_window_sec = var.relay_rate_limit.window_seconds
        aggregate_key_type    = "IP"
        scope_down_statement {
          byte_match_statement {
            search_string         = "/api/usage"
            positional_constraint = "STARTS_WITH"
            field_to_match { uri_path {} }
            text_transformation {
              priority = 0
              type     = "NORMALIZE_PATH"
            }
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "relay-rate"
      sampled_requests_enabled   = false
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-relay"
    sampled_requests_enabled   = false
  }
}

# edge.tf, inside aws_cloudfront_distribution.this
web_acl_id = one(aws_wafv2_web_acl.relay[*].arn)
```
Sources: `[CITED: terraform-provider-aws website/docs/r/wafv2_web_acl.html.markdown]` for `evaluation_window_sec` values, `aggregate_key_type`, the `us-east-1` rule, the required `visibility_config` fields, `byte_match_statement` arguments and the 50-byte `search_string` limit. `[CITED: docs.aws.amazon.com/waf … rate-based-high-level-settings]` for "lowest limit setting allowed is 10" and "any rule action except Allow". The upper bound 2,000,000,000, the `custom_response` block, `NORMALIZE_PATH` and `STARTS_WITH` are `[ASSUMED]`; the executor confirms them in the provider docs before committing.

**Tests** (`frontend_service.tftest.hcl`): add `mock_resource "aws_wafv2_web_acl"` with an ARN default (`arn:aws:wafv2:us-east-1:000000000000:global/webacl/openvaa-test-relay/00000000-0000-0000-0000-000000000000`) to the `us_east_1` mock. Then four runs:
1. `relay_rate_limit_off`: `length(aws_wafv2_web_acl.relay) == 0` and the distribution's `web_acl_id == null`.
2. `relay_rate_limit_on`: one ACL, scope `CLOUDFRONT`, the rule's limit/window as given, scope-down `search_string == "/api/usage"`, and `web_acl_id ==` the ACL's ARN.
3. `relay_rate_limit_refuses_a_window`: window 90, `expect_failures = [var.relay_rate_limit]`.
4. `relay_rate_limit_refuses_below_ten`.

The staging root (and, for parity, the example root) adds `variable "relay_rate_limit"` with default `null` and passes it; nothing sets it.

**"Plan unchanged" is proven only against real state:** a hand plan of the staging root with the variable unset must read `No changes` (or show only this phase's other intended changes). The plan role has `ReadOnlyAccess` `[VERIFIED: infra/modules/github-oidc/policies.tf:161]`, which also lets it plan the "on" case: going from 0 to 1 resource needs reads of the distribution only.

### Pattern 4: The caller-limit RPC (E-02 to E-05)

What the RPC builds on, verbatim:
- `private.invitation_throttle_take (p_key text, p_max integer, p_window interval) RETURNS boolean … SECURITY DEFINER SET search_path = ''`, which takes `pg_advisory_xact_lock(hashtext('invitation_throttle:' || p_key))`, upserts `count`/`window_start`, `RETURN v_count <= p_max;`, and revokes EXECUTE from `PUBLIC, anon, authenticated, service_role` `[VERIFIED: 506-invitation-rpcs.sql:642-666]`.
- `private.deployment_settings (singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton), behind_cloudflare boolean NOT NULL DEFAULT false)` `[VERIFIED: 107-feedback.sql:36-41]`, read as `COALESCE((SELECT behind_cloudflare FROM private.deployment_settings), false)` `[VERIFIED: 107-feedback.sql:145]`.
- The address parse precedent: `host(p_candidate::inet)` inside `BEGIN … EXCEPTION WHEN invalid_text_representation THEN NULL; END;` `[VERIFIED: 107-feedback.sql:79-87]`.

Recommended shape (name at Claude's discretion; `invitation_caller_take` keeps it inside the `invitation\_%` census family):
```sql
-- 00002_invitation_caller_limit.sql (mirror in schema/506-invitation-rpcs.sql)
CREATE OR REPLACE FUNCTION public.invitation_caller_take (p_project_id uuid, p_address text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_max      constant integer  := 30;
  v_window   constant interval := interval '10 minutes';
  v_trusted  boolean;
  v_inet     inet;
  v_caller   text;
  v_key      text;
  v_start    timestamptz;
BEGIN
  v_trusted := COALESCE((SELECT behind_cloudflare FROM private.deployment_settings), false);
  IF NOT v_trusted OR NULLIF(btrim(p_address), '') IS NULL THEN
    RETURN 0;                                    -- skipped: never a shared bucket
  END IF;
  BEGIN
    v_inet := btrim(p_address)::inet;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN 0;
  END;
  v_caller := CASE family(v_inet) WHEN 6 THEN network(set_masklen(v_inet, 64))::text ELSE host(v_inet) END;
  IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = p_project_id) THEN
    RETURN 0;                                    -- an unknown project makes no row
  END IF;
  DELETE FROM private.invitation_throttle t
   WHERE t.key LIKE 'caller:%' AND t.window_start + v_window <= now();
  v_key := 'caller:' || p_project_id::text || ':' || v_caller;
  IF private.invitation_throttle_take(v_key, v_max, v_window) THEN
    RETURN 0;
  END IF;
  SELECT t.window_start INTO v_start FROM private.invitation_throttle t WHERE t.key = v_key;
  RETURN GREATEST(1, ceil(extract(epoch FROM (v_start + v_window - now())))::integer);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.invitation_caller_take (uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_caller_take (uuid, text) TO service_role;
```
Return 0 = admitted (or skipped), N > 0 = refused, retry after N seconds. A scalar return keeps it outside `assert:rpc-nullability`, which only harvests `RETURNS TABLE` `[VERIFIED: scripts/assert-rpc-return-nullability.mjs header]`. The IPv6 functions `family`, `set_masklen` and `network` are standard Postgres `[ASSUMED]`. Note that the `inet` cast accepts CIDR text such as `10.0.0.0/8`; normalise with `host()` / `set_masklen` as shown so a mask in the header cannot widen a key. Optionally add a partial index for the delete: `CREATE INDEX invitation_throttle_caller_window_idx ON private.invitation_throttle (window_start) WHERE key LIKE 'caller:%';`. `link:`/`code:` rows are never deleted except by the invitation-delete trigger `[VERIFIED: 506-invitation-rpcs.sql:670-690]`, so without the index the delete scans the whole table on every take. That is cheap on staging, so this is planner's call.

**Comments that become false and must change in `schema/` (SQL `--` comments do not affect `check:schema-equivalence`):**
- `506-invitation-rpcs.sql` throttle header: "No key holds an address in clear. … no key is derived from a request header." `[VERIFIED: 506:614]`. After this phase a `caller:` key holds an address and comes from a header the function passes.
- `107-feedback.sql:30`: "Its only reader is `check_feedback_rate_limit`" `[VERIFIED]`. Now there are two readers.

**pgTAP census pins that move** (new file `48-invitation-caller-limit.test.sql`, plus edits):
- `07-rpc-security.test.sql:428`: the service-role-only definer census string `'delete_storage_object,invitation_code_claimant_email,invitation_code_status,invitation_link_release,invitation_link_request,invitation_link_witness,invitation_link_witness_open,recovery_link_request,resolve_email_variables'` with the description "exactly the nine listed" `[VERIFIED]`. Add `invitation_caller_take` alphabetically; it becomes ten.
- `39-invitations.test.sql:~4697-4724`: `'11 true'`, "each of the eleven functions is SECURITY DEFINER with an empty pinned search_path", counting `p.proname LIKE 'invitation\_%'` `[VERIFIED]`. It becomes `'12 true'`.
- `39-invitations.test.sql` also hashes or counts the whole `private.invitation_throttle` table in places (`:3958`, `:4474`) `[VERIFIED: grep]`. These are unaffected unless the new RPC is called in that file; keep the new tests in file 48.
- File 48 cases: 30 admitted then the 31st refused with N in 1..600; a second address admitted at the same time; `behind_cloudflare=false` → 0 and no row; header absent, blank or malformed → 0 and no row; two IPv6 addresses in one /64 share a bucket and one in another /64 does not; an unknown project → 0 and no row; a row whose `window_start` is moved back 10 minutes is deleted by the next take of **another** caller; `now()` is frozen in a transaction, so move `window_start` with `UPDATE`, as `39-invitations` does at `:3793`; anon and authenticated refused (`42501`), service_role allowed. Set `behind_cloudflare` with `UPDATE private.deployment_settings SET behind_cloudflare = …` inside the test transaction, as `35-feedback-rate-limit-key.test.sql:42, 343` does `[VERIFIED: grep]`.

### Pattern 5: Wiring the function without breaking its conformance properties (E-02, E-05)

The function's tests are **vitest under Node** reading `index.ts` as text (`flowConformance.test.ts` header: vitest cannot import `index.ts` because of `npm:` specifiers and the Deno global) `[VERIFIED: flowConformance.test.ts:1-9]`. "A Deno unit test of the header read" therefore means a vitest test of a pure module.

Pins that the change breaks, verbatim `[VERIFIED: flowConformance.test.ts:249-265]`:
```ts
it('reads nothing of the request but its method and its body', () => {
  const read = new Set(Array.from(CODE.matchAll(/\breq\.(\w+)/g)).map((match) => match[1]));
  expect([...read].sort()).toEqual(['json', 'method']);
  …
it('reads one response header only, the Location of the redirect question', () => {
  const headerReads = Array.from(CODE.matchAll(/(\w+)\.headers\.get\(\s*'([^']*)'\s*\)/g)).map(…);
  expect(headerReads).toEqual(['response:location']);
```
And the uniform-answer pins for both link branches: `expect(branch).not.toMatch(/\bawait\b/)`, `count(branch, 'return ') == 1`, `count(branch, 'answer(') == 1` `[VERIFIED: flowConformance.test.ts:86-104]`. The pin at `:257` (origin headers) is unaffected.

Recommended wiring:
1. `callerLimit.ts` (pure, importable): `export const CALLER_ADDRESS_HEADER = 'cf-connecting-ip';` and `export function callerAddress(headers: Headers): string | null` (returns the trimmed value, or `null` when absent or empty; no parsing, because the RPC parses). Add `TOO_MANY_REQUESTS_BODY = Object.freeze({ error: 'too-many-requests' } as const)` in `contract.ts`. `contract.test.ts:292-299` has a census of `*_BODY` exports `[VERIFIED]` that must gain it.
2. In `index.ts`, **after** `parseAccountAccessRequest` and **before** the first `if (request.operation === 'request-link')`:
   ```ts
   const { data: retryAfter, error: takeError } = await createAdminClient().rpc('invitation_caller_take', {
     p_project_id: request.projectId,
     p_address: callerAddress(req.headers)
   });
   if (takeError) { log('the caller limit could not be read', describeFailure(takeError)); return answer(INTERNAL_ERROR_BODY, 500); }
   if (typeof retryAfter === 'number' && retryAfter > 0) return tooManyRequests(retryAfter);
   ```
   `tooManyRequests` adds `Retry-After` beside `corsHeaders`. Do not compare `error.code` or `.status`: the test forbids any `.code` comparison but `email_exists` and any `.status/.message/.name ===` `[VERIFIED: flowConformance.test.ts:~196-203]`.
3. Amend exactly two pins, deliberately: the read set becomes `['headers', 'json', 'method']`, plus a new pin that `req.headers` appears once, only as `callerAddress(req.headers)`; the header-read pin either stays `['response:location']`, because the read lives in `callerLimit.ts` as `headers.get(CALLER_ADDRESS_HEADER)`, or is widened explicitly. Add pins that the take precedes every operation branch, that the branches still contain no `await`, and that no `log(` call receives the address.
4. **Fail closed** on an RPC error (500): every operation needs the database anyway, and a silently skipped limit is the worse failure. The planner may choose otherwise, but must say so.

`describeFailure` and `log` already restrict log detail to a failure's name and code `[VERIFIED: index.ts:77-81]`.

The frontend needs no change: `#accountAccess` throws on any `error` from `functions.invoke`, which includes a non-2xx `[VERIFIED: supabaseDataWriter.ts:446-455]`.

**Docs that become false when the limit lands** (same plan as the function): `apps/docs/.../backend/authentication/+page.md:145` ("Anonymous code checks are unlimited … puts a rate limit in front of the Edge Function, at its gateway") and `:148` ("No limit uses the caller's identity …"), and `apps/docs/.../deployment/+page.md:106` ("A deployment that needs a bound … at its gateway") `[VERIFIED: git grep]`. E-04's privacy statement (the address is stored as the key only while its window runs) goes in the same edit. Phase 189 may polish; this phase must not leave the false sentences.

### Pattern 6: The load check (OBS-11)

```js
// infra/scripts/load-check/voter-journey.js (k6 2.4.0)
import http from 'k6/http';
import { group, sleep } from 'k6';
export const options = {
  discardResponseBodies: true,
  dns: { ttl: '1m', select: 'random', policy: 'preferIPv4' }, // spread over the edge's returned IPs
  scenarios: {
    journeys: {
      executor: 'ramping-arrival-rate',
      startRate: 0, timeUnit: '1m', preAllocatedVUs: 20, maxVUs: 200,
      stages: [ /* hold each step 5 min: e.g. 5, 10, 20, 40, 80 journeys/min; caps from D-06 */ ]
    }
  },
  thresholds: {
    'http_req_duration{kind:page}':  ['p(95)<1000'],
    'http_req_duration{kind:relay}': ['p(95)<300'],
    http_req_failed: ['rate<0.01', { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '1m' }]
  }
};
export function handleSummary(data) { return { '/out/summary.json': JSON.stringify(data) }; }
```
Sources: `[CITED: grafana.com/docs/k6/latest … ramping-arrival-rate]` (options and example), `[CITED: … thresholds]` (`abortOnFail`, `delayAbortEval`, tagged sub-metric thresholds, `http_req_failed` rate), `[CITED: … custom-summary]` (`handleSummary` returns `{ path: JSON.stringify(data) }`), `[CITED: … k6-options/reference]` (`dns.ttl/select/policy`, `discardResponseBodies`).

Method notes:
- **Thresholds are whole-run in k6, not per step.** For "the highest step that met every threshold", tag each request with its step (derive it from `exec.scenario` elapsed time, or run one `constant-arrival-rate` scenario per step with `startTime` offsets and a `step` tag), and compute per-step p95 and error rate from the JSON summary with per-step sub-metric thresholds (`'http_req_duration{kind:page,step:3}'`). Keep `abortOnFail` only on the global error rate. `[ASSUMED: per-step submetrics need a threshold defined on each to appear in the summary]`
- **The journey:** SSR pages already make server-side Supabase reads; Step 7 item 4 of the staging runbook recorded "five inlined fetches of the hosted project's REST host" in `/` and `/questions` `[VERIFIED: infra/envs/staging/aws/README.md Observations 2026-11-13]`. So page requests load the task **and** Supabase; the browser's own post-hydration reads add more. Record the request list once by running `tests/tests/deployed/voter.smoke.ts` with a `page.on('request')` collector that writes method, host and path template only (no headers, no bodies), filtered to `staging.openvaa.org` and `cofbsatfrdysyphajsky.supabase.co`, excluding `/_app/immutable/`. Hand-write the script from it. The anon key comes from `__ENV`, never the file.
- **Relay posts** carry `Content-Type: application/json`, `Sec-Fetch-Site: same-origin` and a valid batch (route id from the pageview allowlist, a supported locale, ≤ 50 events, ≤ 16 KiB) `[VERIFIED: constants.ts:9-15, batch.schema.ts:19-27]`.
- **Generator:** Docker Desktop's VM on macOS. Read `docker stats --no-stream` per step and the host's network. A bound at the generator is named, not reported as capacity.
- **Local dry run first:** run the same script against the local dev server (`http://host.docker.internal:5173`) at a token rate to prove it parses, tags and writes its summary. `k6 inspect` validates options without traffic `[ASSUMED]`.

### Anti-Patterns to Avoid
- **Reading `cf-connecting-ip` when `behind_cloudflare` is false, or falling back to `x-forwarded-for`:** 184-13 measured the function's `x-forwarded-for` as platform-rebuilt, with a last entry that is "neither the client nor private" `[VERIFIED: 184-13 evidence § 2]`. A fallback makes one shared bucket.
- **Awaiting the take inside a link branch:** it breaks the uniform-answer pins and moves the take after the answer is built.
- **One shared bucket when the header is missing** (`unknown`, as the feedback limit does): locally the header is absent on every call, so the E2E suite would share one bucket of 30.
- **Testing "plan unchanged" with mocks only:** mock plans cannot see `null` vs `""` drift on the live distribution; only a real plan can.
- **Stopping the task inside the 2 s window to "prove" SIGTERM:** a race, which is why B-04's override exists.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Windowed counter with concurrency | A new table and lock scheme | `private.invitation_throttle_take` | Already serialised by an advisory lock, tested, with the right grants |
| Address parsing and IPv6 masking | Regex over the header in TypeScript | Postgres `inet`, `family`, `set_masklen`, `host`, `network` | Handles every textual form; one place decides |
| Relay rate limit | An in-process address map | CloudFront WAF rate rule (opt-in) | A per-process map is wrong with two tasks (research D12) |
| Load generation, percentiles, abort | A curl loop with `time` | k6 arrival-rate executor + thresholds | Open-model arrival rate, correct percentiles, abort-on-fail |
| Event read-back | Scraping the PostHog UI | HogQL via `/api/projects/:id/query/` | Named lines, repeatable, within the 2400/h limit |
| Before/after image digest | Parsing `describe-task-definition` by hand | `infra/scripts/running-image-digest.sh` | Already tested; prints `running_image_digest=` |

**Key insight:** every new mechanism here has an existing primitive in the repo or the platform; the phase's risk is in the seams (contract files, census pins, trust flags), not in the mechanisms.

## Runtime State Inventory

Not a rename/refactor phase; one runtime-state item matters anyway:
- **Stored data:** the appended migration creates `caller:` rows in `private.invitation_throttle` on the hosted project. They expire through the take's delete. Nothing is migrated.
- **Live service config:** PostHog project settings (IP discard, GeoIP transformation, billing limit) live only in PostHog's UI. Record them as text in the evidence (G1–G3).
- **OS-registered state / secrets:** the personal PostHog key lives in the operator's keychain; revoke it after the phase or keep it for 189 (an Open Question).
- **Build artifacts:** none.

## Common Pitfalls

### Pitfall 1: The stop timeout is not reachable from the root
**What goes wrong:** writing `stop_timeout_seconds = 40` into `infra/envs/staging/aws/terraform.tfvars` fails `terraform validate`/plan with an undeclared-variable error.
**Why:** neither AWS root declares or passes `stop_timeout_seconds`; the module default 30 applies `[VERIFIED: grep: only variables.tf:134 and service.tf:31 name it]`.
**How to avoid:** add `variable "stop_timeout_seconds"` to `infra/envs/staging/aws/variables.tf` (and the example root for parity), pass it in `main.tf`'s `module "frontend"` block, then set it in tfvars. Update the module variable's description with the bound (≥ SHUTDOWN_TIMEOUT + forward timeout + margin).

### Pitfall 2: A shutdown flush is up to ten forwards, not one
**What goes wrong:** the 25 + 10 + 5 budget assumes one forward; the shutdown flush sends slices of 100 **sequentially** `[VERIFIED: queue.ts:86-93]`, so a full queue against a hanging host takes up to 10 × 10 s.
**How to avoid:** state the bound as "for a responsive PostHog" in the description; with B-04's K well under 100 the observation has one slice. Not worth changing the code.

### Pitfall 3: `aws ecs stop-task` deregisters first
**What goes wrong:** the sitting expects SIGTERM at once. ECS moves the task through DEACTIVATING, where "the target group deregistration occurs", then STOPPING, which sends SIGTERM and then SIGKILL after `StopTimeout` `[CITED: docs.aws.amazon.com/AmazonECS/latest/developerguide/task-lifecycle-explanation.html]`. The deregistration delay is 30 s `[VERIFIED: variables.tf:128-132]`.
**How to avoid:** send the K events, wait for the 204s, then stop. The read window covers stop + 30 s + drain + flush. adapter-node emits `sveltekit:shutdown` only after `httpServer.close` completes (≤ `SHUTDOWN_TIMEOUT`) `[VERIFIED: node_modules/@sveltejs/adapter-node/files/index.js:78-100, v5.5.7]`.

### Pitfall 4: B-03's `distinct_id` placement cannot be observed
**What goes wrong:** both placements carry the same value `[VERIFIED: posthog.ts:44-52]`, so no read can tell which one PostHog used.
**How to avoid:** record PostHog's capture docs instead: "Put `distinct_id` at the top level"; the top level takes precedence when both are set `[CITED: posthog.com/docs/api/capture]`. The duplicate stays (deferred item).

### Pitfall 5: `$user_agent` or `$ip` present ≠ a visitor leak
**What goes wrong:** if the IP setting is off, `$ip` holds the **task's** egress address; if PostHog derives a user agent from the request, it is Node's fetch UA, not the visitor's.
**How to avoid:** B-03's named lines print only presence. If something is present, a second line says whether it equals a value the relay could have forwarded (it cannot: the provider is never given the request `[VERIFIED: posthog.ts:1-6]`). The region is proven by the events appearing in the **EU** project read, not by the capture status: a 401 `invalid_api_key` is documented for an invalid token `[CITED: posthog.com/docs/api via search extract]`, but whether a US key at the EU host gets one is `[ASSUMED]`. The provider logs `status` on any ≥ 400 `[VERIFIED: posthog.ts:93]`, a secondary signal.

### Pitfall 6: The "undeclared" 33 KiB body may arrive declared
**What goes wrong:** CloudFront may buffer a chunked or HTTP/2 streamed request body and forward a `Content-Length`; the relay then refuses at the declared-length check, not in `readBody` `[ASSUMED]`.
**How to avoid:** the named line records the status (413 either way); the unit tests cover the streamed path `[VERIFIED: relay.ts:137-150]`. Do not claim the deployed line proves the streaming path.

### Pitfall 7: The drop line appears at the next flush, which is minutes away
**What goes wrong:** with the 600000 override the `dropped: 50` warn line is written at the **next** flush `[VERIFIED: queue.ts:80-85]`, ten minutes later or at a stop.
**How to avoid:** C-02 reads CloudWatch after the next tick or ends with the B-04 stop; run C-02 under provider `log` (or a separate window from B-04) so its 1000 kept events do not pollute B-04's exact-K count. "Memory flat" reads `AWS/ECS MemoryUtilization` per service, 1-minute resolution `[ASSUMED: available without Container Insights]`.

### Pitfall 8: The refusals are invisible under provider `none`
`relay.ts:76` returns 204 before any header is read `[VERIFIED]`. C-01 runs only with a provider on (the staging `posthog` after B-01, or `log` locally). Validate the script locally first against `yarn dev`: `.env.example` sets `ANALYTICS_PROVIDER=log` `[VERIFIED: .env.example:320]`, and the dev server's origin is the local one.

### Pitfall 9: The local stack trusts `cf-connecting-ip`
**What goes wrong:** `seed.sql` sets `behind_cloudflare = true` so the feedback fixture can pick buckets `[VERIFIED: apps/supabase/supabase/seed.sql:26-36]`. A rule of "trusted → key on the header, else `unknown`" makes every local call without the header share one bucket of 30 across the whole E2E suite.
**How to avoid:** header absent, blank or unparseable → skip (return 0, no row). Locally the E2E suite sends no `cf-connecting-ip` to the function (only the feedback fixture injects it, on `POST /rest/v1/feedback`) `[VERIFIED: tests/tests/fixtures/shared/feedbackDialog.fixture.ts:36-50]`, so the suite is unaffected.
**Bonus:** the local gateway forwards a client-sent `cf-connecting-ip` (the fixture's comment, for PostgREST) `[VERIFIED: fixture comment]`; whether it does so for `/functions/v1` is `[ASSUMED]`. If it does, a local `curl` loop (31 × `check-code` with `cf-connecting-ip: 198.51.100.7`, then one with `198.51.100.8`) proves the limit end to end before the hosted push.

### Pitfall 10: Project-id rotation
**What goes wrong:** the key includes the caller-chosen `project_id`; without a check, a caller gets a fresh bucket per random uuid and writes a row per request.
**How to avoid:** the RPC admits without a row when the project does not exist (Pattern 4). A real project's codes can only be probed with that project's id, so R-a stays bounded.

### Pitfall 11: Census pins in pgTAP and the contract test
`07-rpc-security:428` (nine names), `39-invitations` `'11 true'` and `contract.test.ts:292-299` (`*_BODY` census) all fail on a correct change until updated `[VERIFIED]`. Plan them into the same tasks as the function and RPC.

### Pitfall 12: Cloudflare Worker callers share one address
Cross-zone Worker subrequests carry `CF-Connecting-IP: 2a06:98c0:3600::103` `[CITED: developers.cloudflare.com/fundamentals/reference/http-headers, via search extract]`. With /64 keying, every Worker-originated caller shares one bucket: it is not a bypass, but Worker users limit each other. Record it as accepted; 184-13 lists "a request sent from another Cloudflare Worker" as not measured `[VERIFIED: 184-13 § 3]`.

### Pitfall 13: Migration before function
The pipeline pushes migrations before deploying functions `[VERIFIED: .github/workflows/deploy.yml:264-311]`. A function deployed by hand before the push answers 500 to everything (fail closed). Never hand-deploy the function ahead of the push. PostgREST's schema cache is reloaded on DDL by Supabase's event trigger `[ASSUMED]`; if the first call returns PGRST202, `NOTIFY pgrst, 'reload schema'` is the remedy.

### Pitfall 14: The hosted measurement was IPv4 only
`client_v6_known=no` in 184-13 `[VERIFIED]`. The /64 rule is proven by pgTAP only; E-06's evidence says so.

### Pitfall 15: Single-client CloudFront load
CloudFront's guide says a single client measures "only a small subset of the resources in one CloudFront edge location", and recommends multiple regions, independent DNS per client and spreading across the returned IPs `[CITED: docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/load-testing.html]`. The figure is the **origin's** capacity (task + Supabase), not CloudFront's. Use k6's `dns.select: 'random'` and say so in the method.

### Pitfall 16: k6 v2 output and commands differ from v1 tutorials
v2 removed `k6 login`, the `externally-controlled` executor and the default API server `[CITED: grafana.com/docs/k6/latest/release-notes/v2.0.0 via search extract]`; the machine-readable summary changed in v1.5 and became the v2 default `[CITED: grafana.com … custom-summary]`. Use `handleSummary`, and read field paths from a local dry run, not from older blog posts.

### Pitfall 17: Supabase's own auth limits
The load journey must not call `/auth/v1/*`: `verify` is limited to 360/h with bursts of 30 `[CITED: supabase.com/docs/guides/deployment/going-into-prod]`. The voter journey is anonymous; keep the contestant app and `account-access` out of the script.

## Code Examples

### HogQL read (named lines only)
```bash
# Source: posthog.com/docs/api/queries (endpoint, body, EU host, Bearer)
# PH_KEY from the keychain, PH_PROJECT the numeric id; never echo either.
curl -sS -X POST "https://eu.posthog.com/api/projects/${PH_PROJECT}/query/" \
  -H "Authorization: Bearer ${PH_KEY}" -H 'Content-Type: application/json' \
  --data @- <<'JSON' | jq -r '.results[0] | "events=\(.[0]) ip_present=\(.[1]) geoip_present=\(.[2]) ua_present=\(.[3]) url_present=\(.[4])"'
{"query":{"kind":"HogQLQuery","query":"SELECT count(), countIf(properties.$ip IS NOT NULL), countIf(properties.$geoip_country_code IS NOT NULL), countIf(properties.$raw_user_agent IS NOT NULL OR properties.$user_agent IS NOT NULL), countIf(properties.$current_url IS NOT NULL OR properties.$referrer IS NOT NULL OR properties.$host IS NOT NULL) FROM events WHERE timestamp > now() - INTERVAL 30 MINUTE AND properties['openvaa.app'] IS NOT NULL"},"name":"188-b03"}
JSON
```
The property names `$geoip_country_code`, the `properties['openvaa.app']` syntax and a person check (`person_mode`, or a read of `persons` by the batch's distinct ids) are `[ASSUMED]`; validate each query once in the PostHog SQL editor during H8. Limits: 240/min, 2400/h, 3 concurrent, 10 s execution `[CITED: posthog.com/docs/api/queries]`.

### Relay refusal cases (shape)
```bash
# Source: relay.ts:79-102 statuses; constants.ts MAX_BODY_BYTES = 32 * 1024
B=https://staging.openvaa.org/api/usage
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
echo "c01_cross_site=$(code -X POST "$B" -H 'Sec-Fetch-Site: cross-site' -H 'Content-Type: application/json' --data '{}')"
echo "c01_foreign_origin=$(code -X POST "$B" -H 'Origin: https://evil.example' -H 'Content-Type: application/json' --data '{}')"
head -c 33792 /dev/zero | tr '\0' 'a' > "$L/big.txt"
echo "c01_declared_33k=$(code -X POST "$B" -H 'Sec-Fetch-Site: same-origin' -H 'Content-Type: application/json' --data-binary @"$L/big.txt")"
echo "c01_chunked_33k=$(code -X POST "$B" -H 'Sec-Fetch-Site: same-origin' -H 'Content-Type: application/json' -H 'Transfer-Encoding: chunked' --data-binary @"$L/big.txt")"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WAF on CloudFront only pay-as-you-go | Per-distribution flat-rate plans (Free $0 / Pro $15 / Business $200 / Premium $1000) incl. WAF | late 2025 (page read 2026-11-15) | A $0 alternative for low-traffic deployments; record it, don't adopt here |
| k6 v0/v1 | k6 v2.x (2.4.0 on 2026-11-12) | v2.0.0 on 2026-05-11 | Old tutorials' CLI and summary paths differ |
| Rate rule minimum 100 | Minimum 10, windows 60–600 s | `[ASSUMED: change date]` | A tight relay limit is possible |

**Deprecated/outdated:** `--summary-export` usage in older k6 guides (use `handleSummary`); PostHog `app.posthog.com` as API host (EU app host is `eu.posthog.com`, ingest `eu.i.posthog.com`) `[CITED: posthog.com/docs/api]`.

## Provisional decisions: what research found

| Decision | Finding | Effect on the plan |
|----------|---------|--------------------|
| A-01 (refusal status) | An invalid token gets 401 `invalid_api_key` (docs); a US key at the EU host is unverified | Region is proven by the EU read, not by the capture status (Pitfall 5) |
| A-02 | Free plan: no card, **one project**, 1M events free `[CITED: posthog.com/pricing.md, docs/billing/common-questions]`; past a billing limit data is dropped, "lost forever", mails at 80/100 % `[CITED: posthog.com/docs/billing/limits-alerts]`; that the free plan drops past 1M is a search extract only `[ASSUMED]`; whether a limit needs a card, or can be $0: **not stated anywhere opened** | H1 records the org's plan and the billing page's text. Free plan: the plan's own cap is the limit, quoted from the UI. Paid plan: set the Product analytics limit at the lowest the UI accepts. If the org already has a project, a dedicated staging project needs a paid plan, and then the limit is mandatory |
| C-05 | Pay-as-you-go $5 ACL + $1 rule + $0.60/M requests, billed "regardless of the rule action" `[CITED: aws.amazon.com/waf/pricing]`; flat-rate Free covers ACL, rules and request fees for 1M req/month `[CITED: aws.amazon.com/cloudfront/pricing; CloudFront DG flat-rate-pricing-plan]` | Record both figures with the date; the ★ (planned, not applied, no `wafv2` on the deploy role) stands |
| D-01 | k6 2.4.0, `grafana/k6` official image, pinned by digest | Stands |
| D-02 | SSR already reads Supabase server-side | Record the list via a Playwright request collector; hand-write the script |
| D-05/D-06 | AWS permits testing CloudFront/ECS/Fargate/ELB; stress tests have their own policy; no approval below 1 Gbps; CloudFront pre-approval above 500k rps or 300 Gbps `[CITED: aws.amazon.com/security/penetration-testing; DLT docs via search extract]`. Supabase: load test on staging, k6 named; Team/Enterprise give 2 weeks' notice of heavy load testing `[CITED: supabase.com/docs/guides/deployment/going-into-prod]` | A workstation load of tens of journeys per minute needs no notice. G5 (the plan) still sets the step caps. Keep the first step tiny, abort at 5 % |

## Recommended plan order

Wave A (autonomous, local; each with targeted gates):
1. **Flush variable + overlap fix** (B-04 code, C-03): config/runtime/queue, the contract files of Pattern 1, `config.test.ts`, `queue.test.ts`, `taskEnvironment.test.ts`, tftest count 16→17.
2. **Stop timeout pass-through** (B-05): root variables (staging + example), `main.tf`, tfvars `40`, module description. `terraform test` of the module and the example root.
3. **WAF variable** (C-04): `waf.tf`, `edge.tf`, `variables.tf`, mock + four runs; staging/example root pass-through.
4. **Caller-limit migration and RPC** (E-02 to E-04): `schema/506` + `00002_…sql` + manifest line in one commit; comment fixes in 506/107; pgTAP file 48 + census edits in 07/39; `yarn db:reset`, `yarn test:db`, `yarn check:schema-equivalence`, `yarn db:types`, `yarn db:lint:sql`.
5. **Function wiring** (E-02, E-05): `callerLimit.ts` + test, `contract.ts` body + census, `index.ts` take, the two amended conformance pins + new pins, the docs sentences of Pattern 5. Local proof by `curl` against `http://127.0.0.1:54321/functions/v1/account-access` (Pitfall 9) recorded as local evidence.
6. **Refusal script** (C-01) with a local run against `yarn dev` (provider `log`) and a vitest of its usage refusals.
7. **Load script + wrapper** (D-01, D-02, D-04): pinned image, `--confirm`/target guards, local dry run against the dev server; the request-list recorder spec, run later against staging.
8. **Closing local gates**: `yarn lint:check`, `yarn test:unit` (stack running), the frontend build, and one full `tests/scripts/e2e-run.sh` run (background it; watchdog).

Wave B (operator-gated, in this order; each a runbook step with named lines, F-01 records):
9. H1–H3 PostHog: plan/limit text, IP discard, GeoIP transformation off; H2 the personal key + project id (G1–G4).
10. H5: push to `deploy/staging` after 187's first green run (G6). The commit sets `ANALYTICS_PROVIDER = "posthog"` and `stop_timeout_seconds = 40`, and carries migration 00002 + the function; push-migrations dry run shows `push_pending=00002`; deployed smoke green.
11. B-03 capture + read; B-08 batch read; C-01 refusals (provider on).
12. Hand applies (H6), one at a time, each restored and followed by the smoke run: flush 600000 → B-04 (K events, stop-task, exactly K) → C-02 (log provider, floor = ceiling = 1, burst, drop line, memory); B-06 unreachable host; B-07 provider none (digest before/after, 0 events).
13. E-06 hosted limit (workstation + CloudShell), todo closure + new scan todo.
14. C-05 WAF plan with the variable on (H10), plus the unset plan reading no change.
15. D-04 load check (H11) after G5, provider `log` by hand apply, restored.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostHog's free plan drops events past 1M (search extract attributes the sentence to posthog.com; not opened) | A-02 finding | The limit record would misstate the guard; H1 reads the UI |
| A2 | A billing limit can be set (and at what minimum) on the operator's plan | A-02 | If the UI requires a card, the operator adds one or accepts the free plan's cap |
| A3 | A US project key sent to `eu.i.posthog.com` is answered 401 | Pitfall 5 | None if the region is proven by the EU read, as recommended |
| A4 | WAF `custom_response` 429, `NORMALIZE_PATH`, `STARTS_WITH` and limit upper bound 2,000,000,000 as written | Pattern 3 | `terraform validate`/test fails; fix from the provider docs |
| A5 | `AWS/ECS MemoryUtilization`/`CPUUtilization` per service are available without Container Insights | Standard Stack, Pitfall 7 | C-02/D-04 need another metric source |
| A6 | Postgres `family`/`set_masklen`/`network` behave as in Pattern 4 for /64 keys | Pattern 4 | pgTAP catches it locally |
| A7 | The local gateway forwards a client-sent `cf-connecting-ip` to `/functions/v1` | Pitfall 9 | Only the local `curl` proof is lost; pgTAP + hosted E-06 remain |
| A8 | CloudFront may turn a chunked body into a declared one | Pitfall 6 | The line still reads 413; only its interpretation changes |
| A9 | Supabase reloads PostgREST's schema cache on DDL | Pitfall 13 | First calls after the push answer 500 until a reload |
| A10 | HogQL property names and syntax in the example query | Code Examples | Validate in the SQL editor before the sitting |
| A11 | k6 per-step sub-metrics appear in the summary only with thresholds defined on them | Pattern 6 | The per-step figure is computed from raw output instead |
| A12 | CloudShell is usable from the operator's account and region with a public IPv4 egress distinct from the workstation's | E-06 | Fall back to the phone-hotspot option of E-06 |
| A13 | The AWS account is not on the AWS Free Tier plan (flat-rate eligibility) | C-05 note | Only the alternative figure's footnote changes |

## Open Questions

1. **Which PostHog plan is the org on, and does it already hold a project?**
   - Known: the free plan has one project and no card.
   - Unclear: whether the stored key's project is the org's only one, and whether the billing page offers a limit without a card.
   - Recommendation: H1 asks both; the record quotes the UI text.
2. **Fail closed or fail open when the take RPC errors?**
   - Recommendation: fail closed (500), as argued in Pattern 5; the planner states the choice in the plan.
3. **Keep the personal PostHog key after the phase?**
   - Recommendation: revoke at phase end unless 189 needs reads; record the revocation date.
4. **Supabase plan of `cofbsatfrdysyphajsky` (G5).** It bounds the load steps. If it is Team/Enterprise, open the two-week ticket first.
5. **Does the example AWS root also take `stop_timeout_seconds = 40` and `relay_rate_limit`?**
   - Recommendation: yes for both (a forker copies the example). No test forces it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | k6 image, `check:schema-equivalence`, local Supabase | ✓ | 29.7.2 (server up) | — |
| Local Supabase stack | pgTAP, `db:types`, function proof, unit gate | ✓ (13 `openvaa-local` containers up) | CLI 2.118.0 | `yarn db:start` |
| Terraform | `terraform test`, hand plans | ✓ | 1.16.5 | — |
| AWS CLI | hand applies, stop-task, metrics | ✓ | 2.34.7 | — |
| psql | drift check, pushes by hand | ✓ | 17.6 | — |
| Node / Yarn | frontend, vitest, Playwright | ✓ | 24.21.0 / 4.18.1 | — |
| jq, curl | scripts | ✓ | 1.7.1 / 8.7.1 | — |
| k6 binary | load check | ✗ | — | the pinned `grafana/k6` image (the decided route) |
| Deno | function tests | ✗ | — | not needed: the tests run under vitest |
| PostHog project, personal key | B-03 onward | operator (G1–G4) | — | none: blocks RELAY-04 observations |
| 187 pipeline first green run | every deployed observation | ✗ (187-14…25 unrun) | — | none under A-03 |

**Missing dependencies with no fallback:** G1–G7 (operator inputs) and 187's first run. Only Wave A and the C-05 plan can run before them.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Frameworks | vitest (frontend, functions under Node, infra scripts); pgTAP (`supabase test db`); `terraform test` (mock providers); Playwright E2E via `tests/scripts/e2e-run.sh` |
| Config files | `apps/frontend/vite(st) config`, `apps/supabase/vitest.config.ts`, `infra/vitest.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql`, `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`, `tests/playwright.config.ts` |
| Quick run commands | `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics` · `yarn workspace @openvaa/supabase test:unit account-access` · `yarn workspace @openvaa/supabase test:db` · `terraform -chdir=infra/modules/frontend-service test` · `yarn test:unit:infra load-check` |
| Full suite command | `yarn lint:check && yarn test:unit && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-close --no-db-reset` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RELAY-04 | Flush interval resolves, bounds refuse, startup names it | unit | `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics/config.test.ts` | ✅ (extend) |
| RELAY-04 | Contract: every place lists the new name | unit | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts` | ✅ (extend) |
| RELAY-04 | Task receives 17 entries | terraform test | `terraform -chdir=infra/modules/frontend-service test` | ✅ (extend) |
| RELAY-04 | Shutdown flush, batching | unit | `… test:unit src/lib/server/analytics/queue.test.ts` | ✅ |
| RELAY-04 | Deployed capture, SIGTERM, fail-open, none | manual-only (operator sittings H5–H8) | named lines in evidence | — |
| RELAY-09 | Tick skipped while a flush hangs | unit | `… queue.test.ts` | ✅ (new case) |
| RELAY-09 | WAF off: no ACL; on: shape; bounds refuse | terraform test | `terraform -chdir=infra/modules/frontend-service test` | ✅ (new runs) |
| RELAY-09 | Refusal script parses its flags, prints named lines | unit + local run | `yarn test:unit:infra relay-refusals` | ❌ Wave 0 |
| RELAY-09 | Deployed refusals, full queue, WAF plan | manual-only (H9, H10) | named lines | — |
| OBS-09 | RPC: 30 then refused, trust and skip rules, /64, project check, grants | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ Wave 0 (`48-…test.sql`) |
| OBS-09 | Census pins updated | pgTAP | same | ✅ (edit 07, 39) |
| OBS-09 | Header read, 429 body, take precedes branches, no address in logs | unit (vitest) | `yarn workspace @openvaa/supabase test:unit account-access` | ❌ Wave 0 (`callerLimit.test.ts`); ✅ edit `flowConformance`, `contract` |
| OBS-09 | Schema and migrations build the same database | script | `yarn check:schema-equivalence` | ✅ |
| OBS-09 | Hosted: one caller limited, another not | manual-only (H12) | named lines | — |
| OBS-11 | k6 script options/thresholds present, wrapper refuses an unconfirmed or foreign target | unit + local dry run | `yarn test:unit:infra load-check` | ❌ Wave 0 |
| OBS-11 | Capacity figure | manual-only (H11) | JSON summary in evidence | — |

### Sampling Rate
- **Per task commit:** the quick command of the touched area (seconds to a minute; pgTAP about a minute).
- **Per plan:** the area's full command plus `yarn lint:check` (background it if it nears the watchdog).
- **Phase gate:** `yarn test:unit` (stack running) and one full E2E run green, then the deployed smoke run after each staging rollout.

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/tests/database/48-invitation-caller-limit.test.sql`: covers OBS-09.
- [ ] `apps/supabase/supabase/functions/account-access/callerLimit.test.ts`: covers OBS-09.
- [ ] `infra/scripts/relay-refusals.test.ts`: covers RELAY-09's script.
- [ ] `infra/scripts/load-check.test.ts`: covers OBS-11's script and wrapper.
- No framework install is needed.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (no auth change) | — |
| V4 Access Control | yes | RPC `SECURITY DEFINER`, `search_path=''`, EXECUTE to `service_role` only; census pins in 07/39 |
| V5 Input Validation | yes | zod strict envelope (existing); address parsed as `inet` in SQL; flush interval `^\d+$` + bounds |
| V7 Errors and Logging | yes | No address, key or body in any log line (`describeFailure`, provider warn whitelist); drop logged as a count |
| V8 Data Protection | yes | Address stored only as a `caller:` key while its window runs; PostHog IP discard + GeoIP off; personal key in keychain, revoked after |
| V11 Business Logic (anti-automation) | yes | Per-caller limit 30/10 min; opt-in WAF rate rule; bounded queue |
| V6 Cryptography | no | — |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client chooses its own bucket by sending `cf-connecting-ip` | Spoofing | Trust only when `behind_cloudflare`; Cloudflare refuses a client-sent value (184-13); a trusted but unparseable or absent value → skip, never shared |
| Bucket inflation by random project ids | DoS / Tampering | Admit unknown projects without a row |
| Code oracle (R-a) and mail flood (R-b) | Information disclosure / DoS | 30 takes per 10 min per caller per project, before any operation's work |
| Response reveals code or address existence | Information disclosure | Same 429 body for all four operations; uniform link answers unchanged |
| Relay flood | DoS | Same-origin check, 32 KiB cap, cap-1000 queue with skip-while-in-flight; WAF rule opt-in |
| Caller-chosen destination | Tampering / SSRF | Configured origin + `/batch/`, `redirect: 'error'` (existing) |
| Visitor address reaching PostHog | Information disclosure | Relay forwards none; project discards the task's `$ip`; `$geoip_disable` + transformation off |

## Sources

### Primary (HIGH confidence, repository, read this session)
- `apps/frontend/src/lib/server/analytics/{queue,relay,config,env,runtime}.ts`, `providers/posthog.ts`, `lib/analytics/{constants,batch.schema}.ts`, `server/startup/{requiredEnv.ts,taskEnvironment.test.ts}`
- `infra/modules/frontend-service/{main,edge,variables,service}.tf`, `task-environment.json`, `tests/frontend_service.tftest.hcl`; `infra/envs/staging/aws/{main.tf,variables.tf,terraform.tfvars,README.md}`; `infra/modules/github-oidc/{policies,deploy-policies}.tf`; `.github/workflows/deploy.yml`
- `apps/supabase/supabase/schema/{506-invitation-rpcs,107-feedback}.sql`, `seed.sql`, `migrations.manifest.json`, `tests/database/{07,35,39}-*.test.sql`, `functions/account-access/{index,contract,flowConformance.test,contract.test}.ts`, `apps/supabase/README.md`, `.claude/skills/database/SKILL.md`
- `node_modules/@sveltejs/adapter-node/files/index.js` (v5.5.7)
- `184-*/evidence/184-13-throwaway-headers-timeout-drift.md`; the todo `2026-10-07-174-…`

### Secondary (MEDIUM, official docs fetched)
- posthog.com/docs/privacy/data-collection; /docs/data/anonymous-vs-identified-events; /docs/billing/limits-alerts; /docs/billing/common-questions; /pricing.md; /docs/product-analytics/pricing; /docs/api; /docs/api/queries; /docs/api/personal-api-keys; /docs/api/capture
- aws.amazon.com/waf/pricing; docs.aws.amazon.com/waf … rate-based-high-level-settings; aws.amazon.com/cloudfront/pricing; CloudFront DG flat-rate-pricing-plan; CloudFront DG load-testing; ECS DG task-lifecycle-explanation; aws.amazon.com/security/penetration-testing
- terraform-provider-aws `website/docs/r/wafv2_web_acl.html.markdown`
- grafana.com/docs/k6/latest: ramping-arrival-rate, thresholds, custom-summary, k6-options reference; Docker Hub `grafana/k6` tag API; GitHub release v2.4.0
- supabase.com/docs/guides/deployment/going-into-prod

### Tertiary (LOW, search extracts only)
- PostHog free-plan overage wording; PostHog 401 `invalid_api_key`; k6 v2.0.0 breaking changes; AWS DLT load-testing thresholds; Cloudflare Worker `CF-Connecting-IP` value; Supabase Upstash rate-limit example

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH. The k6 version and digest were read from the registry; the Terraform and repo tools were checked locally.
- Architecture: HIGH for the repo seams (every touch point read). MEDIUM for the WAF HCL details flagged A4.
- Pitfalls: HIGH for the repo-derived ones (1, 2, 4, 7–11, 13, 14). MEDIUM for platform behaviour (3, 12, 15–17). LOW for 5's region status and 6.
- PostHog billing: LOW. The decisive facts must be read in the operator's UI.

**Research date:** 2026-11-15
**Valid until:** 2026-12-15 for repo facts and AWS pricing; 7 days for PostHog plan behaviour and k6's latest tag

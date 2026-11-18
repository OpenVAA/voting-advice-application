# Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit - Context

**Gathered:** 2026-11-15
**Status:** Ready for execution (the operator's 2026-11-17 fill overruled A-02 only; every other decision is its ★ option)

<domain>
## Phase Boundary

Events sent from `https://staging.openvaa.org` arrive in a PostHog Cloud EU project as anonymous events with no person profile, no address, no GeoIP property and no user agent; they arrive in batches, survive a task's `SIGTERM`, and the site keeps working when PostHog is unreachable; the key comes from the parameter store, and switching the provider to `none` stops events with no rebuild (RELAY-04). Against the deployed relay, a cross-origin post, an oversized body and a caller-chosen destination are refused and a full queue drops; a WAF rate rule exists as an opt-in Terraform variable, planned on and costed (RELAY-09). A load check of the voter journey and the relay yields a dated capacity figure with its method (OBS-11). The per-caller limit on the anonymous invitation operations is built from the OBS-04 header record and seen limiting one caller and not another (OBS-09).

Out of scope: a project-wide cap on the invitation operations (roadmap); the sequential scan of `invitation_link_request` (moved to a new todo); applying the WAF rule; any change to 187's workflow files; a second environment (A1).

</domain>

<decisions>
## Implementation Decisions

Every answer below is the ★ RECOMMENDED option of `188-DISCUSSION-POINTS.md`, except A-02, which the operator overruled in the fill. The operator was away and may overrule any of them there before execution; CONTEXT.md is then rewritten from the fill. Decisions marked **provisional — research** take the research step's answer where it contradicts them, and the plan says so.

### Inputs and sequencing
- **A-01** The PostHog key already stored at `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` (185-11, 2026-11-12, `answer_posthog_kind=real`) is kept, after the operator confirms it is a Cloud EU project dedicated to staging that they own. The phase never handles its value. The first capture also proves the region. — **Reversibility:** costly — a different project means an overwrite of the parameter, a forced deployment and a stale 185 record.
- **A-02 (operator overrule, 2026-11-17 fill)** A Product analytics billing limit of a small positive amount (about $10 a month), every other product off or at the lowest amount; the operator sets it in the UI, the phase records the amount, the currency, the date and a text read of the setting. The load check itself stays on provider `log` (D-03). On the free plan, where a limit may need a paid plan or a card, the operator decides whether to upgrade; the record quotes the billing page either way. — **Reversibility:** reversible — a UI setting.
- **A-03** Local plans run now; every deployed observation waits for 187's first green pipeline run, which brings this phase's image to staging. Transient observations are hand applies with `-var image_digest=<running digest>` and `environment_overrides` (185-15 pattern), each restored. — **Reversibility:** costly — an all-hand path would leave hand state for the first pipeline run to reconcile.
- **A-04** Events are read back with an operator-created, read-only, project-scoped personal API key from the keychain, via HogQL on the EU app host, in an approved sitting; reads print named lines only.

### The relay on the stack (RELAY-04)
- **B-01** `ANALYTICS_PROVIDER = "posthog"` stays in `infra/envs/staging/aws/terraform.tfvars` at the end of the phase. — **Reversibility:** reversible — one tfvars line and a rollout.
- **B-02** The PostHog project discards client IP data and has GeoIP off (operator, UI); no code change. The read requires `$ip` absent.
- **B-03** First capture: one consenting browser journey, one HogQL read over its window. Named lines: events > 0; `$ip`, `$geoip_*`, `$user_agent`/`$raw_user_agent`, `$current_url`, `$referrer`, `$host` absent; person processing off and no person row; `$session_id` accepted on visit-id events, absent on the pageview; which `distinct_id` placement was used (the duplicate stays).
- **B-04** A new private `ANALYTICS_FLUSH_INTERVAL_MS` (default 2000, accepted 500–600000, a `value` entry in `infra/modules/frontend-service/task-environment.json`, not required, resolved and unit-tested with the other analytics variables). SIGTERM observation: override to 600000, send K events, `aws ecs stop-task`, count exactly K in PostHog, shutdown line in CloudWatch. — **Reversibility:** costly — a new entry in the task-environment contract, its docs and its tests.
- **B-05** `stop_timeout_seconds = 40` in the staging tfvars (≥ `SHUTDOWN_TIMEOUT` 25 + forward timeout 10 + 5), the bound stated in the variable's description.
- **B-06** Fail-open: hand override `ANALYTICS_POSTHOG_HOST=https://posthog.invalid`; deployed smoke run green, relay 204, warn line `transport: ENOTFOUND`; restored.
- **B-07** Switch to `none`: hand apply with the running digest and `ANALYTICS_PROVIDER=none`; same digest before and after in the task definition; 0 events after the rollout; restored.
- **B-08** Batching evidenced by the unit tests on the served commit plus one read: one relay request of N events yields N events within one flush interval.

### Abuse resistance (RELAY-09)
- **C-01** One committed `curl` script, provider active, named lines: `Sec-Fetch-Site: cross-site` → 403; foreign `Origin` without it → 403; declared 33 KiB → 413; chunked 33 KiB undeclared → 413; extra envelope key (`destination`/`host`) → 400; `url`/`host` inside an event → 204 and nothing at PostHog. The provider-`none` 204 of 2026-11-15 is the recorded control.
- **C-02** Full queue: with the 600000 override on one task (floor = ceiling = 1 for the burst), 21 requests × 50 events → `dropped: 50` in CloudWatch, memory flat.
- **C-03** `queue.ts`: a timer tick is skipped while a flush is in flight (bound 2 × cap), with a unit test of a hanging provider.
- **C-04** One nullable module variable `relay_rate_limit = null`. When set: CLOUDFRONT-scope `aws_wafv2_web_acl` through `aws.us_east_1`, default allow, one rate-based rule keyed on source address and scoped down to `/api/usage`, action block; `web_acl_id` on the distribution. When null: no resource, the running stack's plan unchanged. `terraform test` asserts both; the staging root passes it through unset. — **Reversibility:** costly — the module interface and the distribution resource; a wrong default would change the live distribution.
- **C-05 (provisional — research)** Planned, not applied: one hand plan with the variable on, resource list recorded. Cost recorded with its date: $5/month ACL + $1/month rule + $0.60 per million requests, every distribution request inspected. The deploy role gets no `wafv2` permission; the variable's description says one is needed before switching it on. Research checks CloudFront flat-rate plans.

### The load check (OBS-11) — provisional — research
- **D-01** k6 from its official container image at a pinned version; no repository dependency. — **Reversibility:** costly — the tool fixes the script language and the method the recorded figure rests on.
- **D-02** An HTTP replay of one recorded voter journey: server-rendered pages through CloudFront, the Supabase reads the browser makes (recorded once, filtered to the two hosts), relay posts with valid batches; immutable assets left out.
- **D-03** Provider `log` for the run (hand override), restored afterwards.
- **D-04** Stepped arrival rate, 5-minute steps, stack as configured (floor 1, ceiling 2). Thresholds: page p95 < 1000 ms, relay p95 < 300 ms, errors < 1 %; abort at > 5 % for a minute. The figure is the highest step meeting all thresholds, in journeys per minute, with date, commit, task count and CPU, and the bounding resource named. Script and method committed; the JSON summary in evidence.
- **D-05** Generated from this workstation, the generator's CPU and network read per step.
- **D-06** Nothing runs before research records AWS's and Supabase's load-testing policies and the operator states the hosted project's plan; step sizes stay under its limits.

### The per-caller limit (OBS-09)
- **E-01** Built in this phase, keyed on `cf-connecting-ip` at `account-access` (184-13: the client on every served request, a client-sent value refused by Cloudflare). — **Reversibility:** one-way — it lands as an appended migration on the hosted project.
- **E-02** The function reads `cf-connecting-ip` and passes it to a new `service_role`-only RPC in an appended migration, which takes a slot keyed `caller:<project>:<address>` via `private.invitation_throttle_take` and trusts the header only when `private.deployment_settings.behind_cloudflare` is true; otherwise the per-caller limit is skipped, never a shared bucket. IPv6 keyed by /64. The take runs first, for all four operations (`check-code`, `request-link`, `code-sign-in`, `request-recovery`). The conformance pin at `flowConformance.test.ts:257` stays (it does not name `cf-connecting-ip`). — **Reversibility:** one-way — schema is append-only after the freeze.
- **E-03** One bucket per caller per project across the four operations, 30 takes per 10 minutes, constants in the migration.
- **E-04** The address is the key (feedback-limit precedent); the take deletes `caller:` rows whose window has ended. The privacy docs name it. — **Reversibility:** costly — what is stored about callers is a privacy statement the docs make.
- **E-05** HTTP 429 with `Retry-After`, the same body for every operation; the frontend shows its existing function-failure error; no new strings.
- **E-06** Seen on the hosted function: `check-code` with unknown codes from the workstation until the 31st answers 429; at the same minute from AWS CloudShell answered normally; after the window the workstation is answered again. Locally: pgTAP with `behind_cloudflare` set inside the test transaction, a Deno unit test of the header read.
- **E-07** Migration and function reach the hosted project through 187's pipeline steps (migration `00023`, the first appended after the `00002`–`00022` that 187-21 pushed). The todo `2026-10-07-174-…` closes with the evidence; its sequential-scan item moves to a new todo.

### Records and gates
- **F-01** Raw evidence in `188-*/evidence/`; dated Observations rows in `infra/envs/staging/aws/README.md` (capacity, WAF cost, PostHog checks) and `infra/envs/staging/supabase/README.md` (the limit); the load method beside its script.
- **F-02** Targeted unit, `terraform test` and pgTAP checks per plan; one full local E2E run via `tests/scripts/e2e-run.sh` at phase end; the deployed smoke run after every staging rollout.

### Claude's Discretion
- File locations of the load script and the refusal script, and the RPC's name.
- The exact validation bounds of `relay_rate_limit` (within AWS's accepted values).
- The HogQL queries, as long as they print named lines only.

</decisions>

<operator_inputs>
## What the operator must provide (all outstanding)

G1 confirmation that the stored key is a dedicated Cloud EU project's (or a new one); G2 the billing limit and its amount; G3 discard-IP and GeoIP-off settings; G4 a read-only project-scoped personal API key and the project id; G5 the Supabase plan of `cofbsatfrdysyphajsky`; G6 187's first green pipeline run; G7 approval of each sitting of § H in the discussion points (H1–H12).

Before 187's pipeline exists, only the local plans and the read-only WAF plan (C-05) can run.

</operator_inputs>

<code_context>
## Existing Code Insights

- Relay: `apps/frontend/src/routes/api/usage/+server.ts`, `apps/frontend/src/lib/server/analytics/{relay,queue,runtime,config,env}.ts`, `providers/posthog.ts`. Provider `none` returns 204 at `relay.ts:76` before any check.
- Queue: cap 1000, slices 100, 2000 ms timer, overlapping flushes possible (`queue.ts:86-96`); shutdown flush on `sveltekit:shutdown` (`queue.ts:113-118`).
- Task environment: `infra/modules/frontend-service/task-environment.json` (value/parameter entries), wired in `main.tf:17-48`; staging values in `infra/envs/staging/aws/terraform.tfvars:26-44`; parameter path `/openvaa/staging/frontend`.
- Edge: `infra/modules/frontend-service/edge.tf` (distribution, no `web_acl_id`; `aws.us_east_1` alias in use).
- Pipeline: `.github/workflows/deploy.yml` builds per commit (`build-push-image.sh` reuses only an existing commit tag); hand applies per `infra/envs/staging/aws/README.md`.
- Invitation operations: `apps/supabase/supabase/functions/account-access/index.ts`; RPCs and throttle in `apps/supabase/supabase/schema/506-invitation-rpcs.sql:619-658`; trust precedent `schema/107-feedback.sql` (`behind_cloudflare`). Baseline frozen: appended migrations only.
- Header record: `184-*/evidence/184-13-throwaway-headers-timeout-drift.md` (Supabase side), `185-*/evidence/185-15-headers-and-locks.md` (frontend side).

</code_context>

<specifics>
## Specific Ideas

- The relay's checks can only be seen with a provider active, so C-01 runs after the provider is on.
- The flush-interval override serves both B-04 and C-02.
- CloudShell gives a second public address for E-06 with no setup.

</specifics>

<deferred>
## Deferred Ideas

- Applying the WAF rule (opt-in; needs `wafv2` on the deploy role first).
- The sequential scan of `invitation_link_request` (new todo).
- Removing the duplicate `distinct_id` placement, if B-03 shows one is ignored.
- A dedicated "too many attempts" message in seven locales.

</deferred>

<canonical_refs>
## Canonical References

- `.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-DISCUSSION-POINTS.md` — the decisions, their baseline and rejected options
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 188; `REQUIREMENTS.md` RELAY-04, RELAY-09, OBS-04, OBS-09, OBS-11
- `.planning/workstreams/deployment/v2.17-DISCUSSION-POINTS.md` rulings A2, A3, B6, B8, F1
- `.planning/workstreams/deployment/phases/182-analytics-relay/182-CONTEXT.md`, `182-VERIFICATION.md`
- `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-VERIFICATION.md`, `evidence/185-11-parameters-and-role.md`, `evidence/185-15-headers-and-locks.md`
- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-13-throwaway-headers-timeout-drift.md`
- `.planning/workstreams/deployment/phases/187-deploy-pipeline/187-CONTEXT.md`
- `.planning/todos/pending/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md`
- `.planning/workstreams/deployment/research/SUMMARY.md` (PostHog, WAF, load-test notes)

</canonical_refs>

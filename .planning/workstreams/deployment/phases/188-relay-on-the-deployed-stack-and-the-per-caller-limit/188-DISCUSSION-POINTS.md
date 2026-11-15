# Phase 188 — Discussion points

**Phase:** Relay on the Deployed Stack, and the Per-Caller Limit (workstream `deployment`)
**Written:** 2026-11-15, from a scout of the tree at `5c1673dc2`, read-only requests to `https://staging.openvaa.org` and public pricing and documentation pages
**Closes:** RELAY-04, RELAY-09, OBS-09, OBS-11
**Depends on:** 182 (the relay), 185 (the stack and the header record of OBS-04), 187 (the pipeline; its 12 outward plans 187-14 to 187-25 are not yet run, so no pipeline run exists)

## How to fill this

- Each decision lists its options as checkboxes. Exactly one is marked **★ RECOMMENDED**.
- **If you leave every box in a decision unticked, the ★ option is chosen.** Tick a box only to overrule it.
- Tick one other box to overrule. A `**NOTE:**` or `**EDIT:**` line beats any box.
- **⚠ DECIDE** marks the nine decisions that change the shape of the phase: **A-01, A-02, A-03, B-01, B-04, C-04, D-01, E-01, E-02**. Read those first.
- **provisional — research** marks a decision whose ★ rests on facts the research step of `/gsd-plan-phase --research-phase` must still confirm (the roadmap's research flag). If research contradicts the ★, the plan takes the research answer and says so; it does not wait for a new fill.
- You were away when this was written. `188-CONTEXT.md` has already been written from the ★ options, so planning can start. Overrule here before execution, and CONTEXT.md is rewritten from your fill.
- Everything you must **provide** is in § G. Every **outward action** (each one an operator checkpoint) is in § H.

Not asked here, because a ruling already settles it:

- The relay's mandatory defences are the closed schema, the body cap, the same-origin check and the bounded queue; the WAF rule is an opt-in variable, off by default (B8).
- Discrete events, a PostHog billing limit and a drop-when-full forwarder (B6). PostHog Cloud EU, not self-hosted (research SUMMARY).
- The per-caller limit is measured, then built if the measurement supports a design, otherwise deferred with the measurement and a date (A3). A project-wide cap is out of scope (roadmap note).
- One applied environment, staging (A1). The load check is in (A2).
- Function secrets and hosted auth settings stay hand-applied (C4, C7); the pipeline does not touch them (187 scope).

---

## Factual baseline (re-verified 2026-11-15)

| Claim the phase inherits | On the tree, or as served | Evidence |
|---|---|---|
| Staging is serving | `GET /api/health` 200 through CloudFront | `curl`, 2026-11-15 |
| Staging's analytics today | `ANALYTICS_PROVIDER = "none"`, consent `gated`, visit id `memory`, host `https://eu.i.posthog.com` | `infra/envs/staging/aws/terraform.tfvars:39-42` |
| With provider `none` the relay judges nothing | It returns 204 before reading a header. A cross-origin POST (`Origin: https://evil.example`) to staging's `/api/usage` answered **204** today. So none of criterion 2's refusals can be seen until a provider is active | `apps/frontend/src/lib/server/analytics/relay.ts:76`; `curl -X POST`, 2026-11-15 |
| The relay's checks when active | `Sec-GPC` → 204 drop; same origin by `Sec-Fetch-Site`, else `Origin` → 403; media type → 415; declared length and streamed length over 32 KiB → 413; strict envelope → 400; a bad event inside a good envelope is dropped, not refused | `relay.ts:79-102, 117-120, 137-150`; `apps/frontend/src/lib/analytics/constants.ts:9-15`; `apps/frontend/src/lib/analytics/batch.schema.ts:19, 45-56` |
| No caller-chosen destination | The destination is the configured origin plus `/batch/`, `redirect: 'error'`; the host must be `https:` (or loopback `http:`) and is reduced to its origin | `apps/frontend/src/lib/server/analytics/providers/posthog.ts:72, 80-86`; `apps/frontend/src/lib/server/analytics/config.ts:66-77, 149-158` |
| The PostHog item | `$process_person_profile: false`, `$geoip_disable: true`, a fresh `distinct_id` for every pageview, `$session_id` only from a visit id, `distinct_id` written twice because "which placement the batch endpoint reads is not settled". No address, user agent, URL or referrer is put in | `posthog.ts:4, 36-58` |
| The PostHog side still stores the sender's address | PostHog's docs: it "still receives the client IP address with each event"; the project's "IP data capture" setting under Settings > Project > General discards `$ip` before storage; `$geoip_disable` skips location enrichment per event. For a server-side capture the address PostHog sees is the **task's** public address, not the visitor's | posthog.com/docs/privacy/data-collection, read 2026-11-15 |
| Batching and the queue | Cap 1000 events, slices of 100 per `capture`, a flush every 2000 ms on an unref'd timer; drops beyond the cap are counted and logged as a count only | `apps/frontend/src/lib/server/analytics/queue.ts:14-21, 72-94, 96-97` |
| Flushes can overlap | The timer starts a new `flush()` every 2 s whether or not the last one has finished. With a provider hanging until its 10 s timeout, about five flushes are in flight, each holding up to 1000 spliced events. Memory stays bounded (by timeout ÷ interval), but by about five times the queue cap, not by the cap | `queue.ts:86-96`; `posthog.ts:16, 85` |
| Shutdown flush | One flush on `sveltekit:shutdown`, which adapter-node emits after the drain. The 2026-11-13 built-server run saw the shutdown line with `reason: 'SIGTERM'`; no deployed observation of queued events surviving a stop exists | `queue.ts:113-118`; `apps/frontend/src/lib/server/analytics/runtime.ts:29-30`; `185-*/evidence/185-03-built-server.md:73-85` |
| The stop budget | `SHUTDOWN_TIMEOUT = 25`, `stop_timeout_seconds` default 30, forward timeout 10 s. A drain that uses its full 25 s leaves 5 s for a flush that may take 10, then SIGKILL | `terraform.tfvars:37`; `infra/modules/frontend-service/variables.tf:134-137`; `posthog.ts:16` |
| The key reaches the task from the secret store | `ANALYTICS_POSTHOG_KEY` is `source: parameter`; ECS reads `<parameter_path>/<NAME>` at task start | `infra/modules/frontend-service/task-environment.json:87-92`; `infra/modules/frontend-service/main.tf:42-48`; `service.tf:33` |
| **A PostHog key is already stored** | `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY`, SecureString, version 1, 2026-11-12T19:36:16Z, recorded as `answer_posthog_kind=real` (not a stand-in). Its project's region, its IP setting and a billing limit are recorded nowhere, and STATE.md still says the project is "not yet given" | `185-*/evidence/185-11-parameters-and-role.md:4, 24, 30, 129`; `STATE.md` Blockers |
| A changed parameter value rolls nothing | The task definition names the parameter, not its value, so an overwritten key reaches only tasks started afterwards (a forced new deployment) | `main.tf:42-48` |
| Egress to PostHog is open | Tasks in public subnets, no NAT, egress 443 to `0.0.0.0/0` | `main.tf:73-74, 196-203` |
| How a configuration change reaches the task | A tfvars value, applied by the pipeline's `terraform apply` (187) or by a hand apply (185 runbook). The pipeline builds the image of the pushed commit; `build-push-image.sh` reuses an image only when the **commit's** tag exists, so a tfvars commit is a new commit and **a new build**. A hand apply passes `-var image_digest=<running digest>` and `environment_overrides`, which 185-15 used twice | `.github/workflows/deploy.yml:121-153`; `infra/scripts/build-push-image.sh:19-21`; `infra/envs/staging/aws/README.md:65-73`; `185-*/evidence/185-15-headers-and-locks.md:33-50` |
| No WAF exists | No `aws_wafv2_*` resource and no `web_acl_id` anywhere under `infra/`; the distribution has none. The module already has the `aws.us_east_1` provider alias that a CloudFront-scope web ACL needs. The deploy role's policies (187) name no `wafv2` action | `git grep -i wafv2 -- infra` empty; `infra/modules/frontend-service/edge.tf:4-7, 64-136`; `187-CONTEXT.md:21` |
| WAF price | $5.00 per web ACL per month, $1.00 per rule per month, $0.60 per million requests inspected; rate-based rules have no separate price. AWS also sells CloudFront flat-rate plans that include WAF | aws.amazon.com/waf/pricing, read 2026-11-15 |
| PostHog price | The first 1,000,000 events a month are free, anonymous or identified; anonymous events are "up to 4x cheaper". Billing limits are set per product in the organisation's billing settings; past a limit PostHog stops processing that product's data and the excess "is lost forever"; mails at 80 % and 100 %. Whether a limit needs a paid plan, and what the free plan does past 1M, is **not stated** | posthog.com/docs/data/anonymous-vs-identified-events, posthog.com/docs/billing/limits-alerts, read 2026-11-15 |
| No load tool in the tree | No k6, Artillery or autocannon in `package.json`, `tests/` or `infra/` | `git grep` |
| Scaling as deployed | Floor 1, ceiling 2, CPU target 60 %, 512 CPU / 1024 MiB | `terraform.tfvars:19-22`; `variables.tf:203-207` |
| OBS-04, frontend side | Behind CloudFront and the ALB, `x-forwarded-for` has two entries (viewer, edge), a client-sent entry stays first, `XFF_DEPTH=2` confirmed | `185-*/evidence/185-15-headers-and-locks.md:16-27, 56-74` |
| OBS-04, Supabase side (the one the per-caller limit needs) | At an Edge Function and at PostgREST, `cf-connecting-ip` **is the client on every served request**; a client-sent `cf-connecting-ip` is refused by Cloudflare with 403 before the project; the function sees a platform-rebuilt `x-forwarded-for` (spoof dropped). Measured over IPv4 only (`client_v6_known=no`) | `184-*/evidence/184-13-throwaway-headers-timeout-drift.md:36-55, 62-69` |
| Who calls the anonymous operations | The browser, directly: `supabase.functions.invoke('account-access', …)` from the client data writer. Four operations: `check-code`, `request-link`, `code-sign-in`, `request-recovery`. The frontend server is not in the path, so a CloudFront WAF cannot limit them | `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:446-476` |
| The RPCs behind them | Seven `SECURITY DEFINER` RPCs, `service_role` only; the function is the only entry. A generic throttle exists: `private.invitation_throttle_take(p_key, p_max, p_window)`, one row per key, never deleted except by the invitation-delete trigger | `apps/supabase/supabase/schema/506-invitation-rpcs.sql:619-658, 1102-1116` |
| The precedent for trusting `cf-connecting-ip` | `private.deployment_settings.behind_cloudflare`, read by the feedback limit, which stores the raw address per window | `apps/supabase/supabase/schema/107-feedback.sql:30-40, 60-79, 139-170` |
| The function reads no address header today | Its conformance test pins that it names none of `origin`, `referer`, `host`, `x-forwarded-host`, `x-forwarded-for`, `x-real-ip` (`cf-connecting-ip` is not in that list) | `apps/supabase/supabase/functions/account-access/flowConformance.test.ts:257` |
| The schema is frozen | One baseline, `00001_initial_schema.sql`; changes are appended migrations (181 freeze done) | `apps/supabase/supabase/migrations/`; ROADMAP § 181 |
| The todo | `2026-10-07-174-no-per-caller-limit-…` (R-a unlimited code checks, R-b one mail a minute indefinitely, R-d unmeasured topology, plus an unconfirmed sequential scan in `invitation_link_request`). It closes only if the limit is built | `.planning/todos/pending/2026-10-07-174-…md`; ROADMAP § 188 notes |

---

## A — Inputs and sequencing

### A-01 — Which PostHog project ⚠ DECIDE

A real project key has been in the parameter store since 2026-11-12 (baseline), but nothing records its region or settings, and STATE.md says the project has not been given.

- [ ] ★ RECOMMENDED — **Keep the stored key, after you confirm three facts:** it belongs to a PostHog **Cloud EU** project made for OpenVAA staging (no other data in it), you hold its owner role, and you will set the settings of B-02 and the limit of A-02 on it. The phase then never handles the key's value. The first real capture (B-03) also proves the region: a key of a US project is refused by `eu.i.posthog.com` (provisional — research: the exact refusal status).
- [ ] A new EU project made for this phase. Its key is written over the parameter (`put-parameter --overwrite`, version 2) and a forced new deployment rolls it to the tasks (A changed value rolls nothing by itself, baseline). One more outward action, and the 185-11 record goes stale.
- [ ] Use a PostHog project you already use for something else. Staging and smoke events then mix with other data, and the billing limit is shared.

### A-02 — The billing limit ⚠ DECIDE — provisional — research

The free allowance is 1M events a month. The docs do not say whether a limit needs a paid plan or what the free plan does past 1M (baseline).

- [ ] ★ RECOMMENDED — **A Product analytics billing limit at the lowest amount PostHog accepts (ideally $0, i.e. ingestion stops at the free allowance), every other product off or at $0.** You set it in the UI; the phase records the amount, the date and a screenshot-free text read of the setting. If research shows a limit needs a card, the card is yours to add; if it shows the free plan already stops at 1M, the record says so and quotes the page.
- [ ] A limit of a small positive amount (say $10 a month). Room for a load check through PostHog, at a cost you accept.
- [ ] No explicit limit, relying on the free plan's behaviour. Contradicts B6 ("with a PostHog billing limit") unless research proves the free plan caps by itself.

### A-03 — Doing the deployed work before or after 187's pipeline exists ⚠ DECIDE

187's 12 outward plans are unrun, so no pipeline run exists. Almost all of this phase's code can be written now (§ G/H list what cannot).

- [ ] ★ RECOMMENDED — **Two halves.** Local plans run now: the flush fixes (B-04, C-03), the WAF variable and its tests (C-04), the per-caller limit with its migration, function change and tests (E-02 to E-05), the load script (D-01, D-02). Every deployed observation waits for 187's first green run, so the image with this phase's code reaches staging through the pipeline, as the roadmap's dependency says. Single observations that need a value only for minutes (B-04, B-06, B-07, C-02) are hand applies with the running digest and `environment_overrides`, the 185-15 pattern, each restored afterwards.
- [ ] Everything by hand now, through the 185 runbook (image built and pushed by hand, hand applies). Starts the deployed half before 187, but bypasses the dependency, and a later first pipeline run then deploys over hand state you must reconcile.
- [ ] Everything through the pipeline, including the transient overrides. Each override becomes a tfvars commit, a new build (baseline: tag = commit) and a second commit to restore it; B-07's "no rebuild of the image" cannot be shown at all.

### A-04 — How events are read back from PostHog

- [ ] ★ RECOMMENDED — **A personal API key you create, scoped to this one project with read-only query access, kept in your keychain**, used from this workstation by the orchestrator in a sitting you approve (184 sitting pattern), against the EU app host's query endpoint with HogQL. Every read prints named lines (`counts`, `present`/`absent` per property), never an event body or the key.
- [ ] You read the events in the PostHog UI and type the named lines into the evidence. No extra key, but each check (B-03, B-04, B-06, B-07) needs you at the screen, and the absence checks are only as good as a manual read.

---

## B — The relay on the stack (RELAY-04)

### B-01 — Staging's analytics state when the phase ends ⚠ DECIDE

- [ ] ★ RECOMMENDED — **`ANALYTICS_PROVIDER = "posthog"` stays in the staging tfvars.** Staging is then the reference deployment that phase 189's docs describe, and every pipeline run's smoke run sends a few anonymous pageviews, well inside the free allowance and under A-02's limit.
- [ ] Back to `none` at the end of the phase. Nothing is sent from staging afterwards; phase 189 documents a configuration no running stack shows, and a later check of RELAY-04 needs another rollout.

### B-02 — Keeping addresses out of the PostHog project

The relay sends no visitor address, but PostHog records the sending address (the task's) as `$ip` unless the project discards it (baseline).

- [ ] ★ RECOMMENDED — **Turn on the project's "discard client IP data" setting, and turn GeoIP enrichment off project-wide as well as per event** (outward action H3). B-03's read then requires `$ip` absent, not merely "not the visitor's". No code changes.
- [ ] Also send `$ip: null` from the provider. Untested in PostHog's docs (they describe only the project setting); a code change that may do nothing.
- [ ] Leave the setting. `$ip` then holds a task's public address: no visitor address, but an address in every event, and B-03's check has to tell the two apart.

### B-03 — What the first real capture checks

- [ ] ★ RECOMMENDED — With the provider on, one browser journey through staging's consent prompt (accept), then one HogQL read over that time window. Named lines: events found (> 0, the pageview and at least one consented event); per event: `$ip`, any `$geoip_*`, `$user_agent`/`$raw_user_agent`, `$current_url`, `$referrer`, `$host` absent; person processing off (`person_mode` propertyless, no person row for any `distinct_id`); `$session_id` accepted on the visit-id events (research SUMMARY: must be UUIDv7) and absent on the pageview; which `distinct_id` placement PostHog used. If the top-level placement alone is read, the duplicate in `properties` stays (removing it is a later, reversible change).
- [ ] A count only. Proves arrival, not the absence the criterion asks for.

### B-04 — Seeing queued events survive `SIGTERM` ⚠ DECIDE

With a 2 s flush interval, whether any event is still queued when the signal lands is a race, so a deployed run proves nothing either way.

- [ ] ★ RECOMMENDED — **A private `ANALYTICS_FLUSH_INTERVAL_MS` variable** (default 2000, accepted 500 to 600000, a `value` entry in `task-environment.json`, not required, unit-tested). For the observation, a hand apply sets it to 600000 (A-03), K events are sent through the relay, the task is stopped (`aws ecs stop-task`), and the read counts exactly K in PostHog, with the shutdown line in CloudWatch. Restored afterwards. C-02 reuses the same override.
- [ ] No new variable: send events and stop the task within the 2 s window. Cheaper, but a green result may be an ordinary timer flush, and a red one may be timing.
- [ ] Prove it with the `log` provider (event lines after the shutdown line in CloudWatch). Still the same race, and it shows nothing about PostHog.

### B-05 — The stop budget

- [ ] ★ RECOMMENDED — **`stop_timeout_seconds = 40` in the staging tfvars** (≥ `SHUTDOWN_TIMEOUT` 25 + forward timeout 10 + 5 s margin), with the bound written in the variable's description. A one-line change; deploys of a stopping task can take up to 10 s longer.
- [ ] Keep 30 and document that a full-length drain can lose the last flush. No change, a known hole.

### B-06 — Seeing the site keep working when PostHog is unreachable

- [ ] ★ RECOMMENDED — A hand apply overriding `ANALYTICS_POSTHOG_HOST` to `https://posthog.invalid` (resolves nowhere), then the deployed smoke run (186) green, the relay answering 204, and the provider's `Analytics forward to PostHog failed` warn line with `transport: ENOTFOUND` in CloudWatch. Restored afterwards.
- [ ] A host that never answers (each forward waits 10 s). Shows the timeout path too, but slower, and it exercises the overlapping-flush hole of C-03.

### B-07 — Switching the provider to `none` without a rebuild

- [ ] ★ RECOMMENDED — A hand apply with `-var image_digest=<the running digest>` and `environment_overrides={ANALYTICS_PROVIDER="none"}`; the new task definition revision names the same digest (read before and after), and a read over the following window counts 0 events after the rollout completes. Then restored by a plain apply.
- [ ] A tfvars commit through the pipeline. Builds a new image of the new commit (baseline), so "no rebuild" is not shown.

### B-08 — "Events arrive in batches"

- [ ] ★ RECOMMENDED — The queue's and provider's unit tests on the served commit (served SHA = tested SHA), plus one deployed read: one relay request carrying N events yields N events in PostHog with timestamps inside one flush interval. The wire itself is not captured.
- [ ] Capture the outbound requests. Needs a proxy in the egress path that the stack does not have.

---

## C — Abuse resistance (RELAY-09)

### C-01 — The deployed refusals

- [ ] ★ RECOMMENDED — With a provider active, one committed `curl` script, each case a named line with its status: `Sec-Fetch-Site: cross-site` → 403; no `Sec-Fetch-Site` and a foreign `Origin` → 403; a declared 33 KiB body → 413; the same body chunked with no declared length → 413; an envelope with an extra `destination`/`host` key → 400; an event carrying `url` or `host` inside a valid envelope → 204 and nothing for it at PostHog. The provider-`none` 204 seen on 2026-11-15 is recorded as the control that shows why the checks need a provider.
- [ ] Only the three cases the criterion names. Leaves the undeclared-length and in-envelope cases unseen on the stack.

### C-02 — Seeing a full queue drop

- [ ] ★ RECOMMENDED — With B-04's override at 600000 on one task, a burst of 21 requests of 50 events (1050 > cap 1000), then the next flush's `Analytics queue was full and dropped events` line with `dropped: 50` in CloudWatch, and task memory flat (Container Insights or the task metric). Floor and ceiling held at 1 for the burst so one task takes it.
- [ ] The unit test only. RELAY-09's "against the deployed relay" is then not met for the queue.

### C-03 — Overlapping flushes

- [ ] ★ RECOMMENDED — **A tick is skipped while a flush is in flight**, so at most one flush's events are held besides the queue (bound: 2 × cap). A small change to `queue.ts` with a unit test that a hanging provider sees one `capture` per timeout, not five.
- [ ] Leave it; memory stays bounded by timeout ÷ interval × cap (about 5000 events). Documented, not fixed.

### C-04 — The WAF variable's shape ⚠ DECIDE

- [ ] ★ RECOMMENDED — **One nullable module variable, `relay_rate_limit = null`** (object: requests per evaluation window and the window, validated to AWS's accepted values). When set: a CLOUDFRONT-scope `aws_wafv2_web_acl` through `aws.us_east_1`, default action allow, one rate-based rule keyed on the source address (CloudFront sees the viewer directly) and scoped down to the path `/api/usage`, action block; the distribution's `web_acl_id` names it. When null: no resource and **the running stack's plan is unchanged**. `terraform test` asserts both. The staging root passes it through, unset.
- [ ] The same rule over the whole site. Protects every page, but a rate tuned for pages is wrong for the relay and the reverse.
- [ ] Add AWS managed rule groups as well. Each group is $1 a month more and none is asked for.

### C-05 — Planning it on, and its cost — provisional — research

- [ ] ★ RECOMMENDED — **Planned, not applied:** one hand plan of the staging root with `-var 'relay_rate_limit={…}'` (read-only, your plan session), its resource list recorded. Cost recorded from the pricing page with its date: $5 + $1 a month plus $0.60 per million requests, where every request to the distribution is inspected, not only `/api/usage`. The deploy role gets no `wafv2` permission; the variable's description says one must be added (a bootstrap hand apply) before it is switched on. Research checks whether a CloudFront flat-rate plan changes the figure.
- [ ] Apply it for an hour and see a 429. Shows the rule work, costs a prorated few cents plus an IAM change to the deploy role or a hand apply, and asks more than the criterion.

---

## D — The load check (OBS-11) — whole section provisional — research

### D-01 — The tool ⚠ DECIDE

- [ ] ★ RECOMMENDED — **k6, run from its official container image at a pinned version** (no package added to the repository). Scripted HTTP, arrival-rate executors, thresholds with abort, a JSON summary to keep as evidence.
- [ ] Artillery (Node, with a Playwright engine). Closer to a real browser, but a new dev dependency and far fewer virtual users per machine.
- [ ] Playwright at concurrency. Reuses the smoke fixtures, but a workstation runs only tens of browsers, which measures the generator, not the stack.

### D-02 — What one journey is

The browser reads Supabase directly after hydration; the frontend task serves the server-rendered pages and the relay (baseline).

- [ ] ★ RECOMMENDED — **An HTTP replay of one recorded voter journey:** the page requests through CloudFront (front page, intro, questions, results, server-rendered), the Supabase reads the browser makes, recorded once from a real run and filtered to the two hosts, and the relay posts (with `Sec-Fetch-Site: same-origin`, valid batches). Assets under `/_app/immutable/` are left out, since CloudFront caches them.
- [ ] Frontend requests only. Misses the hosted project, which may be the bound.
- [ ] k6's browser module. Realistic, but heavy, and the same generator limit as Playwright.

### D-03 — The provider during the load check

- [ ] ★ RECOMMENDED — **`log`**, by a hand override for the run: the relay, the schema, the queue and a provider are all exercised, PostHog's quota and data are untouched, and CloudWatch ingestion of the event lines costs cents.
- [ ] `posthog`. The real path, but it spends the free allowance (or A-02's limit) and fills the project with load events.
- [ ] `none`. The relay returns at its first line (baseline), so it is not measured.

### D-04 — Shape, thresholds and the figure

- [ ] ★ RECOMMENDED — Steps of increasing arrival rate, 5 minutes each, on the stack as configured (floor 1, ceiling 2, scaling on). Thresholds: page p95 < 1000 ms, relay p95 < 300 ms, errors < 1 %; abort when errors pass 5 % for a minute, to protect the shared hosted project. **The figure** is the highest step that met every threshold, in journeys per minute, stated with the date, the commit, the task count and CPU at that step, and the resource that bound it (task CPU, Supabase, or the generator). The script and the method are committed; the JSON summary goes in the evidence.
- [ ] Pin the stack to one task and report a per-task figure. Cleaner to read, but it does not describe the stack that is deployed.

### D-05 — Where the load comes from

- [ ] ★ RECOMMENDED — **This workstation**, with the generator's own CPU and network read during each step, so a bound at the generator is named rather than reported as capacity.
- [ ] A short-lived machine in `eu-north-1` (EC2 or CloudShell). More headroom, but new IAM and a cost line.
- [ ] A GitHub Actions job. Touches the 187 workflow files and their guard tests.

### D-06 — Permission to load the hosted services

- [ ] ★ RECOMMENDED — Research reads AWS's and Supabase's policies on load testing your own resources and the hosted project's plan limits; you state the Supabase plan of `cofbsatfrdysyphajsky` (§ G). The step sizes stay under whatever the plan states; nothing is run before both are recorded.
- [ ] Run without checking. Risks throttling or a policy breach on the one hosted project the smoke run needs.

---

## E — The per-caller limit (OBS-09)

### E-01 — Build or defer ⚠ DECIDE

The header record (OBS-04, 184-13) gives what the todo asked for: at the Edge Function `cf-connecting-ip` is the connecting client and a client cannot choose it (baseline).

- [ ] ★ RECOMMENDED — **Build it in this phase**, keyed on `cf-connecting-ip` at `account-access`. The todo closes when it is seen limiting one caller without limiting another.
- [ ] Defer with the measurement and a date. Costs nothing now; R-a and R-b stay open on a stack that serves the public, and the deployment page's "put a limit at your gateway" advice stays, though no gateway the deployer owns sits in front of the function.
- [ ] A limit at a gateway we own. There is none: the browser calls Supabase directly, so a CloudFront WAF never sees these calls.

### E-02 — Where the limit is enforced and what it trusts ⚠ DECIDE

- [ ] ★ RECOMMENDED — **The function reads `cf-connecting-ip` and passes it to a new `service_role`-only RPC in an appended migration**, which takes one throttle slot keyed `caller:<project>:<address>` through `private.invitation_throttle_take`, and **trusts the header only when `private.deployment_settings.behind_cloudflare` is true**, the feedback limit's precedent. When it is false (the local stack, an untrusted self-hosted gateway) **the per-caller limit is skipped**, never collapsed into one shared bucket. An IPv6 address is keyed by its /64. The take runs before the operation's own work, for all four operations.
- [ ] The function decides alone from a function secret (`TRUST_CF_CONNECTING_IP`). No new RPC for the trust, but function secrets are hand-applied (C7), so the trust lives in two places that can disagree.
- [ ] Key on the function's `x-forwarded-for`. The platform rebuilds it and the measured last entry was neither the client nor private; nothing promises its shape.

### E-03 — Rate and scope

- [ ] ★ RECOMMENDED — **One bucket per caller per project across the four operations, 30 takes per 10 minutes.** Generous for candidates behind one school or office address (each mail is already limited per address per minute); it stops the unlimited code oracle (R-a) and bounds R-b per caller. Constants in the migration, documented.
- [ ] One bucket per operation. Finer, but three more numbers to justify and an attacker gets four times the budget.
- [ ] Tighter (10 per 10 minutes). Stronger, but a shared address of a class of candidates meets it.

### E-04 — What is stored

- [ ] ★ RECOMMENDED — **The address itself as the key, as the feedback limit stores it**, and the take deletes `caller:` rows whose window has ended, so an address is kept only while its window runs. The privacy docs name it.
- [ ] A keyed hash of the address. No address at rest, but the key is a new function secret (hand-applied, C7), and an unkeyed hash is reversible over the IPv4 space, so it must be keyed.

### E-05 — The answer when the limit is reached

- [ ] ★ RECOMMENDED — **HTTP 429 with `Retry-After`, the same body for every operation**, which reveals nothing about codes or addresses. The frontend shows the error it already shows when the function fails; no new string in the seven locales.
- [ ] A dedicated "too many attempts, try again in a few minutes" message. Clearer for a user behind a shared address, but seven translations that need a speaker's review, as 182's still do.

### E-06 — Seeing it limit one caller and not another

- [ ] ★ RECOMMENDED — From this workstation, `check-code` with unknown codes (writes nothing, sends no mail) until the 31st call answers 429; at the same minute, the same call from AWS CloudShell (a second public address, no setup) answers normally; after the window the workstation is answered again. Named lines only, no address. Locally, pgTAP with `behind_cloudflare` set inside the test transaction, and a Deno unit test of the function's header read.
- [ ] Your phone's hotspot as the second caller. Works, but needs you at the keyboard on two networks.

### E-07 — Rollout and the todo

- [ ] ★ RECOMMENDED — The migration and the function reach the hosted project through the pipeline's migration and function steps (187), the first appended migration on the hosted project. The todo is closed with the evidence. Its unrelated item, the unconfirmed sequential scan in `invitation_link_request`, moves to a new todo, noting that the per-caller limit now bounds how often one caller can cause it.
- [ ] Push and deploy by hand per the 184 runbook. Possible before 187, but the first hosted append then happens outside the path it is meant to take.

---

## F — Records and gates

### F-01 — Where the records go

- [ ] ★ RECOMMENDED — Raw evidence in `188-*/evidence/`; dated rows in the "Observations" tables of `infra/envs/staging/aws/README.md` (capacity figure, WAF cost, PostHog checks) and `infra/envs/staging/supabase/README.md` (the limit); the load-check method beside its script. Phase 189 writes the user docs from these.
- [ ] Phase evidence only. 189 then digs them out of plan evidence.

### F-02 — Gates

- [ ] ★ RECOMMENDED — Plans run targeted unit, `terraform test` and pgTAP checks; one full local E2E run through `tests/scripts/e2e-run.sh` at the end of the phase (standing rule of 2026-11-09); the deployed smoke run after every staging rollout of this phase. A void run is made again.
- [ ] A full local E2E run after every plan. Stronger, about 10 minutes a run.

---

## G — What you must provide

| # | What | Needed by | Blocks |
|---|---|---|---|
| G1 | Confirmation that the key stored on 2026-11-12 is a PostHog **Cloud EU** project's key, dedicated to OpenVAA staging, that you own (A-01); or a new EU project and its key | B-03 onward | every RELAY-04 observation |
| G2 | The billing limit, set by you on that project, and its amount (A-02); a card if PostHog requires one | before the provider is switched on | B-01, B-03 |
| G3 | The project settings of B-02: discard client IP data, GeoIP off | before the first capture | B-03 |
| G4 | A personal API key, read-only, scoped to the project, in your keychain, and the project's numeric id (A-04) | the first read | B-03, B-04, B-06, B-07, B-08, C-01 |
| G5 | The Supabase plan of `cofbsatfrdysyphajsky` (D-06) | before the load check | OBS-11 |
| G6 | 187's first green pipeline run (its outward plans 187-14 to 187-25) | every deployed observation under A-03 ★ | RELAY-04, RELAY-09 deployed half, OBS-11, E-06 |
| G7 | Approval of each sitting in § H | per sitting | — |

## H — Outward actions (each an operator checkpoint)

| # | Action | Where | Reversible |
|---|---|---|---|
| H1 | Confirm or create the EU project; set the billing limit (G1, G2) | PostHog UI, by you | yes |
| H2 | Create the personal API key (G4) | PostHog UI, by you | yes (revoke) |
| H3 | Set "discard client IP data" and GeoIP off (G3) | PostHog UI, by you | yes |
| H4 | Only if A-01 is overruled: overwrite the SSM parameter and force a new deployment | AWS, your admin session | yes |
| H5 | Push of this phase's commits to `deploy/staging` (or a `deploy-evidence/**` branch) and approval of the gated run: provider `posthog`, `stop_timeout_seconds = 40`, the new code; the first appended migration and the new `account-access` | GitHub, by you | the migration is one-way (appended only) |
| H6 | Hand applies with the running digest, each restored: flush interval 600000 (B-04, C-02), unreachable host (B-06), provider `none` (B-07), provider `log` for the load check (D-03), floor and ceiling 1 for C-02 | AWS, your admin session | yes |
| H7 | `aws ecs stop-task` for B-04 | AWS | yes (the service replaces it) |
| H8 | The PostHog reads with the personal key (A-04) | this workstation, a sitting | read-only |
| H9 | The deployed refusal script (C-01) and the queue burst (C-02) | staging | writes events only |
| H10 | The WAF plan with the variable on (C-05) | your plan session | read-only |
| H11 | The load check (D-04, D-05) | staging and the hosted project | load only; abort threshold |
| H12 | The per-caller observation from the workstation and CloudShell (E-06) | the hosted function | throttle rows only; expire |

**What can run before 187's pipeline exists:** every local plan (B-04's variable, B-05's tfvars line, C-03, C-04 with its `terraform test`, E-02 to E-05 with pgTAP and Deno tests, the D-01/D-02 script, the C-01 script), and the read-only C-05 plan. Under A-03 ★, nothing deployed does.

---

## Fill status

| Section | Decisions | ⚠ |
|---|---|---|
| A Inputs and sequencing | 4 | 3 |
| B The relay on the stack | 8 | 2 |
| C Abuse resistance | 5 | 1 |
| D The load check | 6 | 1 |
| E The per-caller limit | 7 | 2 |
| F Records and gates | 2 | 0 |
| **Total** | **32** | **9** |

Provisional — research: A-01 (refusal status only), A-02, C-05, all of D.

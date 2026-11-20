---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
verified: 2026-11-20T08:00:00Z
status: passed
score: 4/4 must-haves verified
covered_files:
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-01-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-01-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-02-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-02-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-03-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-03-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-04-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-04-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-05-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-05-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-06-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-06-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-07-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-07-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-08-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-08-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-09-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-09-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-10-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-10-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-11-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-11-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-12-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-12-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-13-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-13-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-14-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-14-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-15-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-15-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-16-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-16-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-17-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-17-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-18-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-18-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-19-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-19-SUMMARY.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-20-PLAN.md
  - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-20-SUMMARY.md
  - apps/frontend/src/lib/server/analytics/providers/posthog.ts
  - apps/frontend/src/lib/server/analytics/queue.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql
  - apps/supabase/supabase/migrations/00024_invitation_caller_take_without_waits.sql
  - infra/modules/frontend-service/waf.tf
  - infra/scripts/load-check.sh
  - infra/scripts/load-check/figure.mjs
covered_digest: "v4:sha256:f5995178bc2c06a142034aa5cb2654f32ac9b987af1852270baf24392aef0d87"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "H-1: one read-only hand plan of the staging AWS root with relay_rate_limit set, after the CR-01 scope-down change"
    expected: "Plan: 1 to add, 1 to change, 0 to destroy, with the URL_DECODE + NORMALIZE_PATH regex match accepted"
    why_human: "The 188-17 rule-on plan predates the fix; the fix is covered by terraform test against mock providers only"
  - test: "H-2: two live sessions against invitation_caller_take after migration 00024, and a hosted check-code series on 00024"
    expected: "No wait and no deadlock; the limit still refuses the 31st call"
    why_human: "pgTAP reads the function text only; the concurrency demo script is not in the tree; the hosted observation ran on 00023"
  - test: "H-3: read task definition :23 and a plan with the digest alone; note trackEvents is false on staging"
    expected: "provider posthog, EU host, flush 2000, stopTimeout 40, key from the parameter store, No changes"
    why_human: "188-19 read the end state on :22; the review-fix deploy to :23 is recorded without that read-back"
  - test: "H-4: decide whether the 40 journeys a minute, measured under pre-WR-03 tagging, stands, and annotate the staging Observations row"
    expected: "A recorded decision; optionally one repeat under the fixed method"
    why_human: "The figure is a lower bound at the Supabase step cap, and its recorded method differs from the committed one"
  - test: "H-5: acknowledge the operator-sanctioned deviations and residuals (billing limit 20 USD, code-sign-in outside the take, IPv6 keying by pgTAP only, chunked 413 source, 57-minute override, extra WAF plans, flat-rate allowance)"
    expected: "Accepted as recorded or turned into todos"
    why_human: "Deliberate or recorded deviations only the operator can accept"
---

# Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit - Verification Report

**Phase Goal:** Events from the deployed stack arrive in PostHog EU as anonymous events, the stack's capacity is measured, and the per-caller limit on the anonymous invitation operations is built or deferred on the evidence.
**Verified:** 2026-11-20
**Status:** human_needed
**Re-verification:** No, initial verification

Scope of this verification. The deployed observations (188-09 to 188-19) were run by the operator and recorded in `evidence/`; they were read, cross-checked against each other and against the code, and not re-run. Nothing touched AWS, hosted Supabase or PostHog. No E2E ran. Read-only reruns that were done: `vitest` of `apps/frontend/src/lib/server/analytics` (7 files, 198 tests, pass), `vitest` of `infra/scripts/load-check.test.ts` (37 tests, pass), `e2e-spec-verdict.mjs` over the recorded run `tests/e2e-runs/188-close3-20261119T213204Z` (729 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run), and an independent re-check of all 146 backticked lines of the `TRACE_` block of `evidence/188-19-closing.md`.

## Goal Achievement

### Observable Truths (the four roadmap success criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | An event from staging is retrievable in PostHog EU with no person profile, no visitor address, no GeoIP, no raw user agent; events arrive in batches; queued events are delivered at `SIGTERM`; the site works when PostHog is unreachable; the token comes from the secret store; provider `none` stops events with no rebuild | VERIFIED | `188-11`: `B03_EVENTS=12`, `B03_IP_PRESENT=0`, `B03_GEOIP_PRESENT=0`, `B03_USER_AGENT_PRESENT=0`, `B03_URL_PRESENT=0`, `B03_REFERRER_PRESENT=0`, `B03_HOST_PRESENT=0`, `B03_PERSON_PROFILE_EVENTS=0`, `B03_PERSONS=0`, `B03_REGION_PROVEN=eu`, `B08_EVENTS=5`. `188-12`: `B04_POST_EVENTS=7`, `B04_EVENTS=7`, `B04_SHUTDOWN_REASON=SIGTERM`, `B04_TIMER_TICK_IN_WINDOW=no` (so the seven came from the shutdown flush, not the timer). `188-14`: `B06_POST_STATUS=204`, `B06_SMOKE_VERDICT_EXIT=0`, `B06_FORWARD_FAILURES_ENOTFOUND=6`, `B06_AFTER_RESTORE_EVENTS=1`. `188-15`: `B07_DIGEST_UNCHANGED=yes`, `B07_WINDOW_UNDER_NONE_FINAL=0`, control window 11 events. `188-10`: `TD_SECRET_NAMES=PUBLIC_SUPABASE_ANON_KEY,ANALYTICS_POSTHOG_KEY`, `TD_POSTHOG_KEY_IN_ENVIRONMENT=0`. Code: `providers/posthog.ts` builds the onward request from events alone (only `Content-Type` header, `$process_person_profile: false`, `$geoip_disable: true`, `redirect: 'error'`, 10 s timeout, logs only a symbolic code or status); `queue.ts` flushes in slices and on `sveltekit:shutdown`; the analytics unit tests pass (198). `stop_timeout_seconds = 40` in the staging tfvars. Caveat in item H-3. |
| 2   | Against the deployed relay, a cross-origin post, an oversized body and a caller-chosen destination are refused; a full queue drops instead of growing; a WAF rate rule exists as a Terraform variable, off by default, a plan with it on shows the rule, and its cost is recorded | VERIFIED (with H-1, H-2) | `188-11`: nine cases, `c01_cross_site 403`, `c01_foreign_origin 403`, `c01_declared_33k 413`, `c01_chunked_33k 413`, `c01_envelope_destination 400`, `c01_envelope_host 400`, `c01_event_url 204`/`c01_event_host 204` with `C01_URL_EVENTS=0`, `C01_HOST_EVENTS=0`, `C01_REFUSED_CASE_EVENTS=0`, `c01_summary cases=9 failed=0`. `188-13`: `C02_POSTS=21`, `C02_DROP_LINES=1`, `C02_DROPPED=60` (50 offered x 21 less cap 1000, the 10 smoke pageviews explain 60 not 50), `C02_MEMORY_FLAT=yes` (+0.634 points). `188-17`: unset plan `No changes.`; rule-on plan `Plan: 1 to add, 1 to change, 0 to destroy.` creating `module.frontend.aws_wafv2_web_acl.relay[0]` and changing `web_acl_id` on the distribution, scope CLOUDFRONT, aggregate IP, scope-down `/api/usage`, response 429, never applied (`APPLIED=no`, distribution `WebACLId` empty and 0 CLOUDFRONT web ACLs read again in `188-19`); cost recorded 2026-11-19: 5.00 + 1.00 USD a month + 0.60 USD per million requests, every distribution request inspected, estimate 6.00. Code: `waf.tf` count is `var.relay_rate_limit == null ? 0 : 1`, `edge.tf` takes `one(aws_wafv2_web_acl.relay[*].arn)`; the staging tfvars sets no `relay_rate_limit`. The module's `terraform test` was recorded at 38 passing after the review fix. |
| 3   | A load check of the voter journey and the relay against the deployed stack yields a capacity figure, recorded with its date and its method | VERIFIED, weak (see H-4) | `188-18`: steps 2, 5, 10, 20, 40 journeys a minute, 5 minutes each, all five met (page p95 288, 237, 201, 178, 203 ms; relay p95 126, 105, 105, 97, 109 ms; error rate at most 0.0001); `LOAD_FIGURE_JOURNEYS_PER_MINUTE=40`, `LOAD_FIGURE_DATE=2026-11-19`, `LOAD_FIGURE_COMMIT=a7003b490...`, `LOAD_FIGURE_TASKS=1`, task CPU 44.86 %, `LOAD_BOUND=none-reached`, `LOAD_FIGURE_IS_LOWER_BOUND=yes`. Summary JSON present and secret-free; k6 image pinned by digest; method in `infra/scripts/load-check/README.md`; Observations row in `infra/envs/staging/aws/README.md`. The figure is a floor, equal to the Supabase-plan step cap, not a reached capacity. See H-4 for the effect of the review fix WR-03. |
| 4   | The per-caller limit is decided from the OBS-04 header record: built and seen limiting one caller without limiting another, or deferred with the measurement and a date | VERIFIED (with H-5) | Decision: built (CONTEXT E-01, `cf-connecting-ip`, trusted only when `behind_cloudflare`), `188-16` first reads `BEHIND_CLOUDFLARE=true`. Hosted: `E06_CS_200=30`, `E06_CS_FIRST_429=31`; with CloudShell still limited, `E06_WS_FIRST_STATUS=200`, `E06_SAME_WINDOW=yes`, then `E06_WS_200=30`, `E06_WS_FIRST_429=31`, `E06_429_BODY=too-many-requests`, and after the window `E06_WS_AFTER_WINDOW=200`. Local: `188-05` (30 x 200, 31st 429 with `Retry-After`, another caller and no-header 200), pgTAP 2932 tests pass after the fixes. Code read: `migrations/00023` and `00024` (`invitation_caller_take`, `service_role` only, take-before-cleanup, `FOR UPDATE SKIP LOCKED`, IPv4-mapped keyed as IPv4, /64 for IPv6), `account-access/index.ts` takes the slot before the work of `check-code`, `request-link`, `request-recovery`, answers 429 with `Retry-After`, 500 if the take fails. The todo `2026-10-07-174-no-per-caller-limit-...` is in `.planning/todos/completed/`; the sequential scan item is the pending todo `2026-11-15-invitation-link-request-sequential-scan.md`. |

**Score:** 4/4 roadmap truths verified; 0 truths left present-but-behavior-unverified; 5 human-verification items (H-1 to H-5), none a failed truth.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| ----------- | ------------ | ----------- | ------ | -------- |
| RELAY-04 | 188-01, 188-09 to 188-15, 188-20 | PostHog provider: EU host, no person profile, no client address, batches, flush at shutdown, fail open | SATISFIED | Truth 1 |
| RELAY-09 | 188-02, 188-03, 188-06, 188-11, 188-13, 188-17, 188-20 | Same-origin only, body cap, bounded queue, no caller-chosen destination, WAF variable off by default | SATISFIED | Truth 2 |
| OBS-09 | 188-04, 188-05, 188-10, 188-16 | Per-caller limit decided after OBS-04 | SATISFIED | Truth 4 |
| OBS-11 | 188-07, 188-18 | Load check yields a recorded capacity figure | SATISFIED as a lower bound | Truth 3, H-4 |

No orphaned requirement: the roadmap names exactly these four for phase 188 and every plan frontmatter claims a subset of them. The four checkboxes in REQUIREMENTS.md are intentionally left unticked by this verification.

### Required Artifacts and Key Links (spot-verified in the tree)

| Artifact | Status | Details |
| -------- | ------ | ------- |
| `apps/frontend/src/lib/server/analytics/queue.ts` | VERIFIED | Tick skipped while a flush is in flight (`inFlight` guard), shutdown flush, drop counter, timer `unref`; unit tests pass |
| `apps/frontend/src/lib/server/analytics/providers/posthog.ts` | VERIFIED | Anonymous batch item, no visitor input, fail-open logging whitelist |
| `infra/modules/frontend-service/waf.tf`, `edge.tf`, `variables.tf` | VERIFIED | Nullable `relay_rate_limit`, ACL count 0 when null, distribution `web_acl_id` wired, input validation |
| `apps/supabase/supabase/migrations/00023`, `00024` and `migrations.manifest.json` | VERIFIED | RPC, privileges, keying; pushed to hosted (`push_pending=00023`, later `00024`) |
| `apps/supabase/supabase/functions/account-access/index.ts` + `callerLimit.ts` | VERIFIED | Take before work, 429 + `Retry-After`; `code-sign-in` and `confirm-address` outside the take (operator ruling 2026-11-19) |
| `infra/scripts/load-check.sh`, `load-check/*` | VERIFIED | Pinned k6, wrapper, figure, extractor; 37 tests pass |
| `infra/envs/staging/aws/terraform.tfvars` | VERIFIED | provider `posthog`, flush 2000, `stop_timeout_seconds = 40`, no overrides, no `relay_rate_limit` |

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| task definition secrets | SSM `ANALYTICS_POSTHOG_KEY` | secret entry, not environment | WIRED (`188-10`, `188-19` read-back) |
| `account-access` | `invitation_caller_take` | `rpc` before each limited operation | WIRED |
| `edge.tf` distribution | `aws_wafv2_web_acl.relay` | `one(...[*].arn)` | WIRED (null when off) |

Data-flow (level 4): the relay's events flow from the browser through `/api/usage` to PostHog and were read back by HogQL (12 and 5 and 7 events); the capacity figure flows from k6's summary through `figure.mjs` (verified by tests and the recorded summary).

### Behavior-dependent truths

The shutdown flush, the full-queue drop, the in-flight tick guard and fail-open are state or cleanup invariants. Each has a deployed observation and a unit test, so they are VERIFIED and not merely present. The caller limit's concurrency property (WR-01) is the exception: see H-2.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| 84 files changed by the phase outside markdown | - | `TBD`/`FIXME`/`XXX` | none | grep found none |
| `188-19-closing.md` trace | TRACE_RELAY_09 | cites `E2E_TREE_SHA=d523abcd5...` as a whole line, which the file does not hold (it holds `9789bbcf6...`; the file's later lines carry `d523abcd5` and `0b947a34b`) | Info | The only miss of my own 146-line recheck; the E2E claim itself is true and current (below) |

### Behavioral Spot-Checks and Probes

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Analytics relay, queue, provider, config | `vitest run src/lib/server/analytics` in `apps/frontend` | 7 files, 198 tests passed | PASS |
| Load-check tooling | `vitest run --config infra/vitest.config.ts infra/scripts/load-check.test.ts` | 37 passed | PASS |
| Latest full E2E | `node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/188-close3-20261119T213204Z --no-flaky` | `VERDICT OK: 729 tests -- passed 729, failed 0, flaky 0, skipped 0, did not run 0` | PASS |
| E2E covers the current tree | `git diff --stat 0b947a34b HEAD -- apps packages tests infra` | empty | PASS |

Probe execution: no `probe-*.sh` is declared by the phase. Step 7c not applicable.

The E2E hard rule is met: the closing run is a complete, non-void, green run on the tree that is deployed (`E2E_TREE_SHA` `0b947a34b`; per-project counts equal to the previous full run). The red 188-05 targeted run (`ERR_NETWORK_CHANGED`) stays on record as a failure, was accepted by the operator, and was followed by three green full runs; it is not a blocker.

## Judgement requested by the caller: does the WR-03 retag weaken "capacity is measured"?

Explicit answer: it weakens the precision of the recorded figure and its traceability, it does not defeat the criterion, and it does not flip the verdict.

- What the recorded run did: every base-origin GET was `kind: page`, so a journey replayed 14 page-kind requests (5 documents and 9 font files) and, after each, one relay post: 14 relay posts. After the review fix a journey has 5 relay posts and the 9 font requests are `kind: asset` (still requested, no relay post, outside the page threshold).
- Direction of the error on the relay: the recorded run was heavier on the relay than the fixed method (14 posts against 5 a journey), so for the relay half the figure is conservative.
- Direction on the page threshold: the recorded page p95 mixed 9 fast font requests with 8 document requests (5 plus 3 redirect follow-ups), so a documents-only p95 would be somewhat higher than the 178 to 288 ms recorded. The threshold is 1000 ms and the recorded values leave a factor of 3.5 or more, so no step would plausibly have been unmet, but this is an inference and was not measured. The step maxima of the page tag (386, 1033, 1095, 404, 649 ms) show that single slow requests exist, which a p95 tolerates.
- Direction on every other measurement (Supabase p95, task CPU 44.86 %, memory 20.46 %, 36,378 requests, 387 iterations against 390 expected): unchanged, because the requests to the base host, the Supabase reads and the RPCs are the same set.
- The figure was never a capacity reached: `LOAD_BOUND=none-reached`, 40 equals the step cap taken from the Supabase plan. It is "at least 40 journeys a minute at the measured configuration (1 task, 512 CPU units, floor 1, ceiling 2, no scale-out), with a pageview-only relay load". That is a floor, and the criterion says "yields a capacity figure, recorded with its date and its method", which a dated, method-bound floor satisfies. The weaker part of the criterion is not the retag but the absence of a reached bound.
- Two record defects that follow from the retag, neither a gap in the criterion: (a) the Observations row in `infra/envs/staging/aws/README.md` and `188-18-load-check.md` describe the old model ("a relay batch after each of the 14 page-kind requests") while the committed method (`infra/scripts/load-check/README.md`, `journey-from-trace.mjs`, `staging-journey.json`) at HEAD is the new one, and the row carries no note that the figure was measured under the earlier tagging (the fact is recorded only in `188-REVIEW-FIX.md` WR-03); (b) the dropped-iterations check of IN-04 did not exist for the recorded run, whose summary holds no `dropped_iterations` metric, and the 3 iterations short of 390 are unexplained (k6 counts only finished iterations, so an unfinished tail is the likely cause).
- Recommended handling (human decision H-4): accept the figure as a dated lower bound, add one sentence to the staging Observations row naming the pre-WR-03 tagging, and, if a figure under the fixed method is wanted, repeat the check once on the next pipeline rollout. Not a reason to hold the phase.

## Human Verification Required

### H-1. WAF match rule, rule-on plan after the code review (CR-01)

**Test:** With the operator's credentials, run one hand plan of `infra/envs/staging/aws` with `-var 'relay_rate_limit={limit=300,window_seconds=300}'` and the running digest (read-only, never apply) and read that it still plans 1 to add, 1 to change, 0 to destroy and shows the regex match statement with `URL_DECODE` then `NORMALIZE_PATH`.
**Expected:** The plan accepts the new `regex_match_statement` (AWS's regex engine is not exercised offline), and the rule matches `/api/usage` and `/<locale>/api/usage`.
**Why human:** The `188-17` rule-on plan was made on the pre-fix rule (`^/api/usage`, byte-match). The fix is covered by `terraform test` against mock providers only (38 pass), and the review fix report itself marks it "requires human verification". The off-by-default state is unaffected: the review-fix deploy planned only the task definition.

### H-2. Concurrency of `invitation_caller_take` after migration 00024 (WR-01)

**Test:** Two live sessions: one holding a row lock on an ended `caller:` row, another taking for a different address under a short `lock_timeout`; the second must return 0 at once and leave the locked row.
**Expected:** No wait, no deadlock.
**Why human:** pgTAP cannot run two transactions, so its new assertions read the function text for take-before-cleanup, `x.key <> v_key` and `FOR UPDATE SKIP LOCKED` (presence). The behavioral demonstration was a scratch script that is not in the tree. Also, the hosted per-caller observation (`188-16`) ran on 00023; `00024` replaced the function body on the hosted project in the review-fix deploy (`push_pending=00024`) and no hosted observation row or re-observation records it. A single `check-code` series from one address and CloudShell would settle it; the local suites (pgTAP 2932 pass) already cover the logic.

### H-3. Staging state after the review-fix deploy, and `trackEvents`

**Test:** Read the running task definition `:23` (digest `878f98f5...`) for provider `posthog`, EU host, flush 2000, `stopTimeout` 40 and the `ANALYTICS_POSTHOG_KEY` secret, and a hand plan with the digest alone reading `No changes.`.
**Expected:** Same end state as `188-19` recorded for `:22`.
**Why human:** `188-19` read the end state on `:22` (build `a7003b490`); the later deploy (run `44681047626`, `:23`, deployed smoke 2 passed) is recorded in `188-REVIEW-FIX.md` without that read-back. The tfvars and module are unchanged, so low risk. Separately, `analytics.trackEvents` is `false` on staging (`TRACK_EVENTS_NOW=false`): staging today emits only the server pageview, and the privacy counts rest on one consenting journey of 12 events taken while it was on. Turning it on is blocked by the pending todo `2026-11-19-deployed-voter-smoke-fails-when-track-events-is-on`, which would turn the pipeline's smoke stage red. This is a known, recorded limitation, not a phase 188 failure, but a deployer reading "events arrive" should know it.

### H-4. Capacity figure after the WR-03 retag

**Test:** Decide whether the 40 journeys a minute (measured under the pre-fix tagging) stands as the phase's figure; optionally repeat `infra/scripts/load-check.sh` under the fixed method.
**Expected:** The decision recorded, and one sentence added to the staging Observations row.
**Why human:** See the judgement section above. It is the operator's call whether a lower bound under superseded tagging satisfies OBS-11 or is to be repeated.

### H-5. Operator-sanctioned deviations and open residuals to acknowledge

**Test:** Acknowledge: (a) the PostHog billing limit is 20 USD, not the "about 10" of A-02, and other products were left above their lowest levels by the operator (`BILLING_OTHER_PRODUCTS=operator-set`, `BILLING_TEXT=none found`); (b) `code-sign-in` is outside the per-caller take (operator ruling), bounded by the per-code budget and the auth service's per-address limit, the shared auth sign-in budget a pre-launch risk; (c) IPv6 /64 keying rests on pgTAP only; (d) the chunked-33-KiB 413 on the deployed relay may come from the declared-length check; (e) 188-14's override stayed on staging for 57 minutes through a host sleep, losing staging's own events in that window; (f) 188-17 made four plans where two were approved (EXTRA_PLANS=2); (g) the CloudFront flat-rate plan's request allowance was not re-confirmed.
**Expected:** Accepted as recorded, or turned into todos.
**Why human:** Each is a deliberate or recorded deviation that only the operator can accept; none contradicts a roadmap success criterion.

## Gaps Summary

No roadmap success criterion fails. All four are met by recorded deployed observations that agree with each other, with the code in the tree, and with a green, current full E2E run (729 passed, 0 unexpected, 0 flaky, 0 skipped, 0 did not run, tree `0b947a34b` identical to HEAD for `apps`, `packages`, `tests` and `infra`). The status is `human_needed`, not `passed`, because the review fixes made after the observations (the WAF match, the 00024 function body, the retagged load method) are covered by unit and pgTAP tests only, and five items need the operator's judgement or one read-only sitting (H-1 to H-5). No FAILED truths and no deferred items. Override suggestions: none needed.

---

_Verified: 2026-11-20_
_Verifier: Claude (gsd-verifier)_

## Operator Resolution (2026-11-20)

The operator resolved every human-verification item, and the status moved from `human_needed` to `passed`:

- **H-4:** accepted as a dated lower bound and annotated. The Observations row in `infra/envs/staging/aws/README.md` now says the figure predates the WR-03 split of document and asset requests, and that it is to be measured again under the current method on a later rollout.
- **H-1, H-2, H-3:** accepted without a hosted re-observation. CR-01 rests on `terraform test`. Migration 00024 rests on pgTAP and the green deploy run `44681047626` (drift check 00001–00024). Task definition `:23` rests on that run's rollout check, the deployed smoke run (2 passed) and the served-build read-back `8a6c02395`.
- **H-5:** the listed deviations and residuals are acknowledged as accepted.

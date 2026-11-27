# Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-15
**Phase:** 188-relay-on-the-deployed-stack-and-the-per-caller-limit
**Areas discussed:** Inputs and sequencing, The relay on the stack, Abuse resistance, The load check, The per-caller limit, Records and gates

The operator was away. No question was asked; every decision was written to `188-DISCUSSION-POINTS.md` with a ★ option, and "User's choice" below is that ★, unreviewed.

---

## Inputs and sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| A-01 keep the stored key | After the operator confirms EU, dedicated, owned | ✓ |
| A-01 new EU project | Overwrite parameter, forced deployment | |
| A-01 a shared project | Mixed data and limit | |
| A-02 lowest limit ($0 if accepted) | Product analytics only; provisional — research | ✓ |
| A-02 small positive limit | Room for load through PostHog | |
| A-02 no explicit limit | Contradicts B6 unless free plan caps | |
| A-03 local now, deployed after 187 green, transient hand overrides | | ✓ |
| A-03 all by hand now | Bypasses the 187 dependency | |
| A-03 all through the pipeline | Each override a rebuild; B-07 unprovable | |
| A-04 read-only personal API key, HogQL | | ✓ |
| A-04 operator reads the UI | | |

**User's choice:** the ★ of each (unreviewed).
**Notes:** the baseline found a real key already stored (185-11) although STATE.md says the project was not given; A-01 asks the operator to confirm it.

---

## The relay on the stack

| Option | Description | Selected |
|--------|-------------|----------|
| B-01 provider stays `posthog` on staging | | ✓ |
| B-01 back to `none` at phase end | | |
| B-02 discard IP + GeoIP off in the project | | ✓ |
| B-02 also send `$ip: null` | Undocumented effect | |
| B-02 leave the setting | Task address in every event | |
| B-03 full absence read | | ✓ |
| B-03 count only | | |
| B-04 `ANALYTICS_FLUSH_INTERVAL_MS` + stop-task | Deterministic | ✓ |
| B-04 race within 2 s | | |
| B-04 `log` provider ordering | | |
| B-05 `stop_timeout_seconds = 40` | | ✓ |
| B-05 keep 30, document | | |
| B-06 `https://posthog.invalid` | | ✓ |
| B-06 a host that never answers | | |
| B-07 hand apply, same digest | | ✓ |
| B-07 tfvars through the pipeline | Rebuilds | |
| B-08 unit tests + one N-event read | | ✓ |
| B-08 egress capture | No proxy exists | |

**User's choice:** the ★ of each (unreviewed).

---

## Abuse resistance

| Option | Description | Selected |
|--------|-------------|----------|
| C-01 six-case script | | ✓ |
| C-01 the three named cases | | |
| C-02 burst over the cap with long interval | | ✓ |
| C-02 unit test only | | |
| C-03 skip a tick while flushing | | ✓ |
| C-03 leave, document | | |
| C-04 nullable `relay_rate_limit`, `/api/usage` scope | | ✓ |
| C-04 whole-site rule | | |
| C-04 plus managed groups | | |
| C-05 plan only, cost recorded | provisional — research | ✓ |
| C-05 apply for an hour | | |

**User's choice:** the ★ of each (unreviewed).

---

## The load check

| Option | Description | Selected |
|--------|-------------|----------|
| D-01 k6, pinned container image | | ✓ |
| D-01 Artillery | | |
| D-01 Playwright at concurrency | | |
| D-02 HTTP replay incl. Supabase reads | | ✓ |
| D-02 frontend only | | |
| D-02 k6 browser | | |
| D-03 `log` provider | | ✓ |
| D-03 `posthog` | | |
| D-03 `none` | Not measured | |
| D-04 stepped, as configured, thresholds + abort | | ✓ |
| D-04 one pinned task | | |
| D-05 workstation | | ✓ |
| D-05 EC2/CloudShell | | |
| D-05 GitHub Actions | | |
| D-06 policies and plan recorded first | | ✓ |
| D-06 run without checking | | |

**User's choice:** the ★ of each (unreviewed). Whole area provisional — research.

---

## The per-caller limit

| Option | Description | Selected |
|--------|-------------|----------|
| E-01 build | 184-13 supports a design | ✓ |
| E-01 defer with measurement and date | | |
| E-01 gateway limit | No owned gateway in path | |
| E-02 function passes header, RPC trusts per `behind_cloudflare`, skip otherwise | | ✓ |
| E-02 function secret decides | | |
| E-02 key on `x-forwarded-for` | | |
| E-03 one bucket, 30 / 10 min | | ✓ |
| E-03 per operation | | |
| E-03 10 / 10 min | | |
| E-04 raw address, expired rows purged | | ✓ |
| E-04 keyed hash | | |
| E-05 429 + existing error | | ✓ |
| E-05 dedicated message | | |
| E-06 workstation + CloudShell | | ✓ |
| E-06 hotspot | | |
| E-07 through the pipeline; todo closed, scan to new todo | | ✓ |
| E-07 by hand per 184 runbook | | |

**User's choice:** the ★ of each (unreviewed).

---

## Records and gates

| Option | Description | Selected |
|--------|-------------|----------|
| F-01 evidence + README Observations rows | | ✓ |
| F-01 evidence only | | |
| F-02 targeted + one full run at end + smoke after rollouts | | ✓ |
| F-02 full run per plan | | |

**User's choice:** the ★ of each (unreviewed).

## Claude's Discretion

- Script locations, the RPC's name, the bounds of `relay_rate_limit`, the HogQL query text.

## Deferred Ideas

- Applying the WAF rule; the `invitation_link_request` sequential scan (new todo); removing the duplicate `distinct_id`; a dedicated rate-limit message.

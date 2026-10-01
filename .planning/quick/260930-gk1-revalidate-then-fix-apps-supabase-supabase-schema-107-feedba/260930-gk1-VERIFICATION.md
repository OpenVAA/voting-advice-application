---
phase: quick-260930-gk1
verified: 2026-09-30T00:00:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick 260930-gk1 Verification Report

**Goal:** The feedback rate limit must not be keyed on the client-supplied first `x-forwarded-for` entry.
**Commits checked:** eb1e6ebf6, 8765d4a2b, 37975cf64 (branch fix/888-review-findings)
**Status:** passed. E2E was NOT RUN, which the plan defers to the batch-level gate and does not count as a gap.

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Finding re-observed at HEAD before change | VERIFIED (SUMMARY only) | SUMMARY records Probe A at HEAD as seven 201s, and the RED run of file 35 against the HEAD function. The pre-fix code is in `git show 0ff348c57`. I could not re-run it because the fix is now live. |
| 2 | Rotating the first x-forwarded-for entry no longer escapes the limit | VERIFIED | I ran Probe A through the local gateway and got `201 201 201 201 201 400 400`. |
| 3 | Key is cf-connecting-ip, else the LAST x-forwarded-for entry, else 'unknown'; no earlier entry is read | VERIFIED | `private.feedback_client_ip` in 107-feedback.sql uses `split_part(..., ',', -1)` and never falls back to earlier fields. The live DB function body is identical. A malformed cf-connecting-ip with a rotating first entry gave `201 x5, 400`, so it falls through to the gateway hop. |
| 4 | Distinct cf-connecting-ip values behind one shared last hop keep separate buckets | VERIFIED | Probe B1 gave eight 201s. The pgTAP shared-hop case passes. |
| 5 | Schema and migration agree; local DB rebuilt; nothing pushed to a remote | VERIFIED | `assert:schema-migration-parity` reports "generated copy is current" (26 files, 6294 lines). The live `check_feedback_rate_limit` calls `private.feedback_client_ip`. There are 0 non-comment `',', 1` matches in 00001. No remote command appears in the diff or SUMMARY. |
| 6 | Full pgTAP suite passes | VERIFIED (partly re-run) | I re-ran 00-helpers plus 35: 41 tests, PASS, with plan(32) matching the real count. The full suite (35 files, 1293 tests) is from the SUMMARY only. I did not re-run it, to avoid load on the shared DB. |
| 7 | E2E fixture gives each POST its own bucket through cf-connecting-ip, and the premise holds through the gateway | VERIFIED (statically) | The fixture sets `'cf-connecting-ip': ip` and no `x-forwarded-for` key. Probe B1 confirms the premise through Kong. Specs were not run. |

**Score:** 7/7. Behavior-dependent truths (2, 4) are backed by a passing pgTAP file and by live gateway probes that I ran myself.

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `apps/supabase/supabase/schema/107-feedback.sql` | VERIFIED | Helper is plpgsql, IMMUTABLE, SECURITY INVOKER, `search_path = ''`. The trigger keys both the counter and the advisory lock on it. |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | VERIFIED | Parity guard is green, so it matches schema/. |
| `apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql` | VERIFIED | 32 assertions, all passing. |
| `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` | VERIFIED | Uses cf-connecting-ip, with a docblock that describes the new mechanism. |
| `schema/301-auth-functions.sql` (added beyond the plan) | VERIFIED | Revokes EXECUTE on the helper from anon, authenticated and service_role after the blanket private-schema grant. Live `proacl` is `{postgres=X/postgres}`. The deviation is justified by T-gk1-07. |

## Key Links

| From | To | Status |
|------|----|--------|
| trigger `check_feedback_rate_limit` | `private.feedback_client_ip(current_setting('request.headers', true)::json)` | WIRED (live function body checked) |
| schema 107 | migration 00001 | WIRED (parity green) |
| fixture | helper via Kong | WIRED (Probe B1) |
| test 35 | trigger and helper | WIRED (passes) |

## Behavioral Spot-Checks (run by verifier, local DB only)

Only rate-limit keys outside `203.0.113.%` and `unknown` were cleared, and probe rows were deleted afterwards. No db:reset was run.

| Probe | Result | Status |
|-------|--------|--------|
| A: rotate first x-forwarded-for | `201 201 201 201 201 400 400` | PASS |
| B1: distinct cf-connecting-ip, shared x-forwarded-for | `201` x8 | PASS |
| B2: one cf-connecting-ip, rotating x-forwarded-for | `201 201 201 201 201 400 400` | PASS |
| Junk cf-connecting-ip, rotating first entry | `201` x5, then `400` | PASS |
| pgTAP 00-helpers plus 35 | 41 tests, PASS | PASS |
| `yarn assert:comment-hygiene` | 0 violations | PASS |
| `gk1-verify-probe` rows left behind | 0 | PASS |

## Anti-Patterns

No TBD, FIXME or XXX markers were found in the changed files. There are no stubs.

## Residual Risks (accepted in the plan, not gaps)

- Without Cloudflare in front (local stack, self-hosted Kong), a client can still choose its own cf-connecting-ip. This is no worse than before, and the schema comment documents the mitigation.
- The hosted gateway behavior is cited from Supabase discussions and was not measured.
- The fixture's random 203.0.113.x among 254 values has a small collision chance. This is unchanged from before.

## Human Verification / Gates Still Pending

- Post-batch E2E gate (voter-journey and voter-journey-mobile, 0 failed and 0 did-not-run). The plan defines it as a batch-level gate, so it is not a gap for this item.

## Gaps Summary

None. The goal is achieved: the rate limit no longer reads any client-written x-forwarded-for entry, and this is proven by the pgTAP file and by the live gateway.

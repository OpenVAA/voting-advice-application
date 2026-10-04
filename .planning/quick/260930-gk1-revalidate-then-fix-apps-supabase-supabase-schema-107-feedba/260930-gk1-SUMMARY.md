---
phase: quick-260930-gk1
plan: 01
quick_id: 260930-gk1
status: complete
subsystem: database
tags: [supabase, rate-limit, security, pgtap, e2e-fixture]
requires: []
provides:
  - "private.feedback_client_ip(json): cf-connecting-ip, then the last x-forwarded-for hop, then 'unknown'"
  - "check_feedback_rate_limit keyed on the gateway-set client address"
affects:
  - voter feedback submission (anon insert into public.feedback)
  - E2E fixture isolateFeedbackRateLimit (voter-journey, voter-journey-mobile)
tech-stack:
  added: []
  patterns:
    - "Header-derived keys parse as inet and are normalised with host(); an unparsable value falls through, never to a client-written entry"
key-files:
  created:
    - apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql
  modified:
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
decisions:
  - "The feedback rate-limit key is cf-connecting-ip, else the gateway-appended last x-forwarded-for hop, else 'unknown'; earlier x-forwarded-for entries are never read"
  - "EXECUTE on private.feedback_client_ip is revoked from the API roles right after the blanket private-schema grant in 301-auth-functions.sql"
metrics:
  duration: "~35 min"
  completed: 2026-09-30
actuals:
  tokens: 6300
  tasks: 3
  commits: 3
plan_head_before: 0ff348c57204c5d3a89475613eb01f8ae2dcc544
plan_head_after: 37975cf644ecccf800ac02c928b8f46ceb86bc28
---

# Quick 260930-gk1: Feedback rate limit keyed on the gateway-set client address

The anonymous-feedback rate limit (five inserts per five minutes) keyed on the first `x-forwarded-for` entry, which the client writes. It now keys on `cf-connecting-ip`, then on the last hop the gateway appends, then on `unknown`, through the new helper `private.feedback_client_ip`. The finding held at HEAD and is fixed. Through the real local Kong, rotating the first entry now gets `201 ×5, 400 ×2` instead of seven 201s.

## Evidence

**Task 1: revalidation at HEAD 0ff348c57, before any change**

- Static grep for non-comment `',', 1` in 107-feedback.sql: `1`. The trigger took field 1 of the comma-split `x-forwarded-for`.
- `yarn assert:schema-migration-parity`: exit 0, "26 schema file(s) -> 6244 line(s) … generated copy is current."
- Precondition: `yarn db:status` exit 0, and `GET http://127.0.0.1:54321/rest/v1/` returned 200. The stack is `supabase_kong_openvaa-local` / `supabase_db_openvaa-local` on 54321 and 54322. The second stack on this host, `next-supabase-skimle2` on 54331 and 54332, was not touched.
- Live function (`live_fn`) at HEAD:
  ```
  13:  -- Extract first IP from x-forwarded-for header (handles proxy chains)
  14:  p_client_ip := SPLIT_PART(
  16:      (current_setting('request.headers', true)::json ->> 'x-forwarded-for'),
  ```
- **Probe A at HEAD:** `201 201 201 201 201 201 201`. The finding HOLDS. Cleanup left 0 `gk1-probe` rows.

**Task 2: RED against the HEAD function** (`00-helpers` + `35`, 20 assertions at that point). The run exited 1 with all four blocks red:
```
# Failed test 6: "rotation: a sixth insert with a new first entry behind the same gateway hop is refused"   caught: no exception / wanted: P0001
# Failed test 7: "rotation: the counter is keyed on the gateway hop and holds the five accepted inserts"      have: NULL / want: 5
# Failed test 8: "rotation: no counter is keyed on a client-written x-forwarded-for entry"                   have: 6 / want: 0
# Failed test 14: "cf-connecting-ip: a sixth insert from the same cf-connecting-ip is refused whatever the last hop"  caught: no exception
# Failed test 20: "shared hop: a sixth insert from a sixth cf-connecting-ip succeeds, …"                     died: P0001: Rate limit exceeded.
Failed 5/20 subtests — Result: FAIL
```

**Task 2: GREEN**

- `yarn schema:regenerate` changed exactly 107-feedback.sql and 00001_initial_schema.sql, 62 lines each. A line-by-line comparison of the two diffs' `+`/`-` lines was identical: the hunks mirror.
- `yarn db:reset` (local only) exited 0. The live trigger now reads `p_client_ip := private.feedback_client_ip(current_setting('request.headers', true)::json);`.
- `00-helpers` + `35`: PASS (29 tests).
- **Probe A after the fix:** `201 201 201 201 201 400 400`. The refused response body is `{"code":"P0001","details":null,"hint":null,"message":"Rate limit exceeded. Please try again later."}`.

**Task 3**

- The helper cases (12 more; the file now has 32 assertions) first showed that anon and authenticated DID hold EXECUTE (tests 31 and 32 failed), with `proacl {postgres=X, anon=X, authenticated=X, service_role=X}`. The cause is the blanket `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private` in 301-auth-functions.sql, which runs after 107 (see Deviations). After the fix, `db:reset` gives `proacl {postgres=X/postgres}`.
- `00-helpers` + `35`: PASS (41 tests).
- **Probe B1** (distinct cf-connecting-ip behind one x-forwarded-for, the fixture's premise): `201 201 201 201 201 201 201 201`
- **Probe B2** (one cf-connecting-ip, rotating x-forwarded-for): `201 201 201 201 201 400 400`
- **Probe A** (re-run): `201 201 201 201 201 400 400`
- Each probe ran with its cleanup. `gk1-probe` rows remaining: 0.

**Gates (each run bare, exit status read directly)**

- `yarn workspace @openvaa/supabase test:db`: exit 0. `Files=35, Tests=1293, Result: PASS`, which includes 10, 22 and 34, whose single-entry `x-forwarded-for` inserts stay valid.
- `yarn db:lint:sql`: exit 0. "No schema errors found", 0 errors and 3 warnings (the pre-existing unindexed-FK baseline).
- `yarn lint:check`: exit 0. That includes parity (26 files, 6294 lines, current), comment hygiene (0 violations), typecheck:tests and eslint over tests/.
- Plan greps: non-comment `',', 1` in 107 is `0` and in 00001 is `0`. There are 3 non-comment `private.feedback_client_ip` references in 107, 1 `'cf-connecting-ip':` in the fixture code, and 0 `x-forwarded-for':` keys in the fixture code.

## Verdict

**fixed.** At HEAD the finding HELD (Probe A: seven 201s), and the fix follows.

The key precedence (`private.feedback_client_ip(json)`, plpgsql, IMMUTABLE, SECURITY INVOKER, `search_path = ''`):
1. `cf-connecting-ip`, when it parses as `inet`.
2. Otherwise the LAST `x-forwarded-for` entry, when it parses. Earlier entries are never read, even when the last one is malformed.
3. Otherwise `'unknown'`.

Values are normalised with `host(value::inet)`. The trigger uses the result both as the `private.feedback_rate_limits` key and in the advisory-lock key. Everything else in the trigger is unchanged: the window, the limit, the RAISE text and the ERRCODE.

Gateway facts:
- **Measured locally** (Kong 2.8.1, Supabase CLI v2.83.0): Kong appends its TCP peer to any client `x-forwarded-for` and overwrites `x-real-ip`. It forwards a client-sent `cf-connecting-ip` unchanged. Probes A, B1 and B2 re-observed this after the fix.
- **Hosted, cited, not measured** (no project is published, and nothing may be linked):
  - supabase/supabase discussion #34647 (2025-04): a spoofed header arrives as `x-forwarded-for: spoofed,<real>` with `cf-connecting-ip: <real>`.
  - Discussion #18532 (2023-10): `x-real-ip` and the last hop were platform-internal, and `cf-connecting-ip` was the client.
  - Cloudflare documents that `CF-Connecting-IP` is the connecting client.
  - This is why `cf-connecting-ip` comes before the last hop.

Nothing was pushed to or linked with a remote Supabase project. Every DB step targeted 127.0.0.1:54321/54322 (openvaa-local).

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality / threat T-gk1-07] The API roles kept EXECUTE on the helper**
- **Found during:** Task 3, in the `has_function_privilege` assertions for anon and authenticated.
- **Issue:** `REVOKE EXECUTE … FROM PUBLIC` in 107 is not enough. 301-auth-functions.sql runs later and issues `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon, authenticated, service_role`, which also reaches the new helper.
- **Fix:** 301-auth-functions.sql now issues `REVOKE EXECUTE ON FUNCTION private.feedback_client_ip (json) FROM anon, authenticated, service_role`, with a comment, right after that blanket grant. The helper's comment in 107 names both revokes. The migration was regenerated and its diff read, and the local DB was reset. The trigger is SECURITY DEFINER (owner postgres), so it still calls the helper. The existing censuses in 07, 16 and 17 name their functions explicitly and are unaffected (the full suite passes).
- **Files modified:** apps/supabase/supabase/schema/301-auth-functions.sql (not in the plan's `files_modified`), 107-feedback.sql, 00001_initial_schema.sql.
- **Commit:** 8765d4a2b, a separate `fix[db]` commit ahead of the test commit. The plan named two commits; this item has three.

**2. [Rule 1 - Bug in the new test] The range filters use LIKE, not `::inet`**
- **Found during:** Task 2, while writing the RED file.
- **Issue:** `ip_address::inet <<= …` would raise on an `'unknown'` row left in the local table.
- **Fix:** The filters now use `ip_address LIKE '192.0.2.%'` / `'198.51.100.%'`. No commit is separate; the change is part of eb1e6ebf6.

## Residual risks

Accepted rows of the threat model:
- **T-gk1-03 (medium, accept):** where no Cloudflare sits in front (the local CLI stack, a self-hosted Kong), Kong forwards a client-sent `cf-connecting-ip` unchanged, so a client can still pick its bucket there. This is no worse than HEAD, where the first entry was equally client-chosen. The helper's schema comment tells operators to strip or overwrite the header at their edge.
- **T-gk1-05 (low, accept):** keying is per address, so an IPv6 client can rotate addresses inside its own /64. Aggregating IPv6 to /64 is a follow-up candidate.
- **T-gk1-06 (low, accept):** if hosted Supabase ever stops sending `cf-connecting-ip`, the key falls back to the last hop, which may be platform-internal. Genuine feedback would then be refused under a shared bucket, which is observable. The header is present in both hosted captures (2023 and 2025).
- **T-gk1-SC (accept):** no packages were installed.

## E2E

**NOT RUN.** The voter-journey and voter-journey-mobile feedback submissions go through `isolateFeedbackRateLimit`, which now sends a unique `cf-connecting-ip` per POST. They are verified at the batch-level post-merge gate (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>`), where 0 failed and 0 did-not-run is required. They are NOT claimed green here. The fixture's premise, that distinct `cf-connecting-ip` values behind one `x-forwarded-for` chain get separate buckets through the real local Kong, is proven by Probe B1 (eight 201s).

## Known Stubs

None.

## Threat Flags

None. The new helper is inside the plan's threat model (T-gk1-07), and no new network endpoint or auth path was added.

## Commits

- eb1e6ebf6 fix[db]: key the feedback rate limit on the gateway-set client address
- 8765d4a2b fix[db]: the API roles cannot execute the feedback rate-limit key helper
- 37975cf64 test: pin the feedback rate-limit key and isolate E2E submissions via cf-connecting-ip

## Self-Check: PASSED

- The files exist: 35-feedback-rate-limit-key.test.sql, 107-feedback.sql, 301-auth-functions.sql, 00001_initial_schema.sql and feedbackDialog.fixture.ts.
- Commits eb1e6ebf6, 8765d4a2b and 37975cf64 are on fix/888-review-findings. `git rev-list --count 0ff348c57..HEAD` is 3.

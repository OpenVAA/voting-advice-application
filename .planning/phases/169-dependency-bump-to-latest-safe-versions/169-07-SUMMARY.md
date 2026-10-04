---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 07
subsystem: auth
tags: [supabase, supabase-js, supabase-ssr, cookies, cache-control, edge-functions, deno, jose, nodemailer, bank-auth, supply-chain]

requires:
  - phase: 169-06
    provides: "Supabase CLI 2.118.0 service stack (PG15), regenerated database.ts, 12/12 gates, E2E 171/171"
provides:
  - "@supabase/supabase-js 2.117.2 for every workspace through the catalog (root on catalog:)"
  - "@supabase/ssr 0.12.7; createSupabaseCookieAdapter forwards ssr's cache headers through event.setHeaders, once per name per request, unit-tested"
  - "Exact npm: pins in the Edge Functions: npm:@supabase/supabase-js@2.117.2 (all three) and npm:jose@6.2.12 (identity-callback); no esm.sh or deno.land import left"
  - "A unit test that holds the installed jose to the identity-callback pin"
  - "Group 5 gates 12/12, full E2E 171/171, bank-auth 8/8 x3 and bank-auth-journey 131/131 x3"
affects: [169-08, 169-13]

actuals:
  tokens: 15000   # chars/4 over the realized diff 5104dc8af..dd9c94679 (57 819 chars, evidence and todo included) plus this summary
  tasks: 3        # Tasks 1 and 2 complete; Task 3 complete except the nodemailer pin, which is held by the age rule (recorded)
  commits: 5      # git rev-list --count 5104dc8af..dd9c94679 (the SUMMARY and state commits follow)
plan_head_before: 5104dc8af84e7b81d0c6a2c89766c4aa26f522e9
plan_head_after: dd9c94679f5f8eef87045df6f7975e72f53113c6

tech-stack:
  added: ["@supabase/supabase-js 2.117.2 (+ auth-js, functions-js, postgrest-js, realtime-js, storage-js 2.117.2)", "@supabase/phoenix 0.4.5", "@supabase/ssr 0.12.7", "Deno npm:@supabase/supabase-js@2.117.2", "Deno npm:jose@6.2.12"]
  removed: ["@supabase/supabase-js 2.99.3 family", "@types/phoenix", "@types/ws", "@supabase/ssr 0.9.0", "esm.sh @supabase/supabase-js@2 (floating)", "deno.land/x/jose@v5.9.6"]
  patterns:
    - "A Deno npm: pin is proven by an edge-runtime boot check that binds: OPTIONS gives 200, and a planted bogus specifier gives 503 BOOT_ERROR"
    - "A Deno pin that must equal an npm resolution is enforced by a unit test that compares the source-text pin with the installed package.json version"

key-files:
  created:
    - .planning/todos/pending/2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-07-SUMMARY.md
  modified:
    - .yarnrc.yml
    - package.json
    - yarn.lock
    - apps/frontend/src/lib/supabase/server.ts
    - apps/frontend/src/lib/supabase/server.test.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/tests/cli/localityGuard.test.ts
    - apps/supabase/supabase/functions/send-email/index.ts
    - apps/supabase/supabase/functions/invite-candidate/index.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
    - apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts
    - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
    - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
    - apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts
    - apps/supabase/supabase/functions/send-email/callerAuthority.ts
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/deferred-items.md

key-decisions:
  - "supabase-js 2.117.2 and ssr 0.12.7, measured live (8.2 d and 25.3 d; 0.12.0 is 116 d old)"
  - "ssr 0.12 reads 0.9's cookies (same base64url default, same base64- prefix, identical chunker), so a deploy signs no one out"
  - "Cache headers are forwarded once per lower-cased name per adapter, and one adapter serves one request (hooks.server.ts is the only caller)"
  - "nodemailer 10 HELD: 10.0.0 is 29.28 d old (it clears 2026-10-04T07:45Z), and every older line carries an open high advisory, so per PROH-169-16 send-email stays on npm:nodemailer@6.9.10 for now; the todo has the resume steps"
  - "bank-auth 3x ran as two projects x3, as 166-04 did, because one served function has one IDENTITY_PROVIDER_ISSUER and the plan's single combined command cannot satisfy both tokens"

patterns-established:
  - "The postgrest-js read retries (3 retries, 1/2/4 s back-off) lengthen any 'cannot reach' path that starts with a GET; tests asserting such a path need a budget that matches"

requirements-completed: [DEPS-07]

coverage:
  - id: D1
    description: "supabase-js 2.117.2 through the catalog, root on catalog:, one resolution"
    requirement: "DEPS-07"
    verification:
      - kind: other
        ref: "yarn why @supabase/supabase-js (one 2.117.2 for root, frontend, dev-seed); grep -c '\"@supabase/supabase-js\": \"catalog:\"' package.json = 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Session gates and a real candidate login on supabase-js 2.117.2"
    requirement: "DEPS-07"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend vitest run src/lib/supabase/ (22/22); yarn assert:cookie-names (0)"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-07-supabase-js --project auth-setup (3/3/0/0/0); tracer re-run 169-07-supabase-js-tracer (3/3/0/0/0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ssr 0.12.7 with cache-header forwarding (three new cases), round-trip and cookie gates"
    requirement: "DEPS-07"
    verification:
      - kind: unit
        ref: "vitest run src/lib/supabase/ (25/25); yarn assert:cookie-names (0); yarn workspace @openvaa/frontend check (0/0)"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-07-ssr --project auth-setup (3/3/0/0/0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Exact npm: pins for supabase-js and jose in the Edge Functions, boot-checked, advisory-clean"
    requirement: "DEPS-09"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/supabase test:unit (206/206, incl. the jose pin case with a negative control)"
        status: pass
      - kind: integration
        ref: "OPTIONS 200 x3 after db:stop/db:start; bogus specifier gives 503 BOOT_ERROR; gh api advisories: 0 for both pins"
        status: pass
    human_judgment: false
  - id: D5
    description: "nodemailer >= 10.0.6 in send-email"
    requirement: "DEPS-09"
    verification:
      - kind: other
        ref: "npm view nodemailer time: 10.0.0 is 29.28 d old on 2026-10-03 (the 30-day rule clears 2026-10-04T07:45:32Z)"
        status: fail
    human_judgment: false
    rationale: "Held by D-03 / PROH-169-16 (the task waits); todo 2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md"
  - id: D6
    description: "Group 5 gates, full E2E, bank-auth 3x"
    requirement: "DEPS-09"
    verification:
      - kind: other
        ref: "169-gates.sh 169-07-group5 (12 rows of 0)"
        status: pass
      - kind: e2e
        ref: "169-e2e.sh 169-07-group5-r2 (171/171/0/0/0); 169-07-bankauth-{1,2,3} (8/8 each); 169-07-bankauth-journey-{1,2,3} (131/131 each)"
        status: pass
    human_judgment: false

duration: 58min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 07: supabase-js 2.117.2, ssr 0.12.7 with cache-header forwarding, and exact Deno pins for supabase-js and jose 6 Summary

**supabase-js 2.117.2 and `@supabase/ssr` 0.12.7 now serve every workspace through the catalog. The cookie adapter
forwards ssr's no-cache headers through `event.setHeaders`, once per name per request. The three Edge Functions import
`npm:@supabase/supabase-js@2.117.2`, and `identity-callback` imports `npm:jose@6.2.12`. The gates are 12/12, full E2E
171/171, bank-auth 8/8 ×3 and bank-auth-journey 131/131 ×3. The nodemailer 10 pin is held by the age rule until
2026-10-04T07:45Z.**

## Performance

- **Duration:** 58 min (2026-10-03T14:26Z to 15:24Z)
- **Tasks:** 3. Task 3 is complete except the nodemailer pin, which is held and recorded.
- **Files modified (source):** 16

## Accomplishments

- **supabase-js 2.117.2.** The catalog entry is `^2.117.2`, and the root manifest's direct range is now `catalog:`.
  - The lockfile diff stays inside the supabase-js family.
  - The only new name is `@supabase/phoenix` 0.4.5, legitimacy OK.
  - Two postgrest-js changes were adapted in the same commit, both in dev-seed: the inline computed-key `upsert` row
    is now named and typed, and three teardown guard tests got a budget that covers the new 1/2/4 s read retries.
  - A real candidate login (`auth-setup`) passed.
- **ssr 0.12.7.**
  - RED: three header-forwarding cases in `server.test.ts`.
  - GREEN: `createSupabaseCookieAdapter` types `setAll` from `SetAllCookies` and forwards `Cache-Control` / `Expires`
    / `Pragma` through `event.setHeaders`, skipping names already forwarded.
  - 0.12 keeps 0.9's cookie encoding byte for byte, so existing sessions survive a deploy.
  - svelte-check is clean, and `auth-setup` passes.
- **Edge Function pins.** No `esm.sh` or `deno.land` import and no major-only pin is left.
  - jose 6 needed no code change: the RSA-OAEP family is kept, and `importJWK` → `compactDecrypt` works.
  - A new unit case holds the installed `jose` to the function's exact pin.
  - Comments and docblocks describe `npm:` imports.
  - All three functions boot (OPTIONS 200). A planted bad specifier gives 503 `BOOT_ERROR`, so the check binds.
  - Both pins have zero GitHub advisories.
- **Group 5 gates and E2E.**
  - `169-07-group5` 12/12, with lint identical to 169-06 (0 errors / 17 warnings).
  - Full suite `169-07-group5-r2` 171/171, after one UNCONFIRMED voter-journey flake that passed 3/3 in isolation.
  - bank-auth 8/8 ×3 and bank-auth-journey 131/131 ×3, each on a fresh dev server.

## Task Commits

1. **Task 1: supabase-js 2.117.2 through the catalog**: `3f4fe2ebf` (chore)
2. **Task 2 RED: cache-header forwarding specified**: `fd8b72ce7` (test)
3. **Task 2 GREEN: ssr 0.12.7 and the header forwarding**: `9075a027b` (chore)
4. **Task 3: exact npm: pins for supabase-js and jose 6**: `cce9b5b16` (fix)
5. **Evidence, todo, deferred item**: `dd9c94679` (docs)

**Plan metadata:** the SUMMARY and state commits follow `dd9c94679`.

## Files Created/Modified

- `.yarnrc.yml`: catalog `@supabase/supabase-js ^2.117.2`, `@supabase/ssr ^0.12.7`.
- `package.json`: root `@supabase/supabase-js` → `catalog:`.
- `yarn.lock`: the supabase-js family 2.117.2 plus `@supabase/phoenix`; ssr 0.12.7.
- `apps/frontend/src/lib/supabase/server.ts`: `setAll` on the `SetAllCookies` contract, with header forwarding.
- `apps/frontend/src/lib/supabase/server.test.ts`: three forwarding cases.
- `packages/dev-seed/src/supabaseAdminClient.ts`: typed join-table upsert row.
- `packages/dev-seed/tests/cli/localityGuard.test.ts`: a 30 s budget on the three past-the-guard teardown cases.
- `apps/supabase/supabase/functions/{send-email,invite-candidate,identity-callback}/index.ts`: `npm:` pins. In
  `identity-callback`, also jose 6 and a true `// reason:`.
- `apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts`: the skew paragraph rewritten, plus the
  pin-equality case.
- `apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts`, `*/flowConformance.test.ts`,
  `*/callerAuthority.ts` (both byte-identical copies): docblocks describe `npm:` specifiers.
- `.planning/todos/pending/2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md`: the hold and its resume steps.
- `169-EVIDENCE.md`: §§ 1, 2, 3, 4, 6 and 7 for 169-07. `deferred-items.md`: the voter-journey flake.

## Decisions Made

- **Versions** from the live probe at 14:26Z: supabase-js 2.117.2 and ssr 0.12.7. The Deno pins match the npm side:
  jose 6.2.12 from `yarn.lock`, and supabase-js 2.117.2 from the catalog.
- **Header forwarding is once per name per adapter.** SvelteKit throws on a repeated `setHeaders` name. ssr 0.12.6
  already sends the headers only with a client's first write, and one adapter serves one request.
- **nodemailer is held, not downgraded or force-taken.** PROH-169-16 and the plan's "the task waits" rule it out. The
  2-day security exception covers patch age, not the 30-day new-major rule, and the plan names the wait explicitly.
- **Bank-auth 3× ran as two projects ×3.** The plan's combined command needs one function to accept two issuers.
  166-04's precedent and the runbook's E/B procedures run them separately, with Edge env files that differ only in
  `IDENTITY_PROVIDER_ISSUER`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] dev-seed typecheck broke on postgrest-js 2.117's `upsert` row inference**
- **Found during:** Task 1, step 3 (`TURBO_FORCE=true yarn typecheck`).
- **Issue:** TS2345 at `supabaseAdminClient.ts` `upsertJoinRows`. With `RejectExcessProperties<Insert, Row>` and an
  untyped client, TypeScript infers `Row = string` from an inline computed-key object.
- **Fix:** the row is named and typed as `Record<string, string>`, with a one-line comment saying why. Runtime is
  unchanged.
- **Files modified:** `packages/dev-seed/src/supabaseAdminClient.ts` (not in the plan's file list).
- **Verification:** typecheck 23/23.
- **Commit:** `3f4fe2ebf`.

**2. [Rule 1 - Test budget] Three teardown locality-guard tests timed out on postgrest-js's new read retries**
- **Found during:** Task 1, step 3 (`yarn workspace @openvaa/dev-seed test:unit`, 3 failures at 5 s).
- **Issue:** `fetchWithRetry` retries a rejected GET three times (1 s, 2 s, 4 s). The teardown CLI's first call is a
  read, so "Cannot reach Supabase" now takes about 7 s; `secs=7` measured.
- **Fix:** those three cases take `{ timeout: 30000 }`, with a comment explaining it. No assertion changed. The budget
  now matches what is awaited.
- **Files modified:** `packages/dev-seed/tests/cli/localityGuard.test.ts` (not in the plan's file list).
- **Verification:** 17/17 in the file and 901/901 in the package.
- **Commit:** `3f4fe2ebf`.

**3. [Rule 2 - Comment hygiene] Two more stale specifier comments**
- **Found during:** Task 3, step 2. `invite-candidate/callerAuthority.ts` and `send-email/callerAuthority.ts` said
  `index.ts` "resolves an `https://esm.sh` specifier".
- **Fix:** both byte-identical copies were updated identically, keeping `assert:edge-env-defaults` green.
- **Commit:** `cce9b5b16`.

**4. [Rule 2 - Correctness] A test enforces the jose pin**
- **Why:** the plan let the verifyConfig skew paragraph either "say so or drop" that the function and the test run the
  same jose. A claim with no check drifts silently, so the claim is now enforced: a new case compares
  `npm:jose@<v>` in `index.ts` with the installed `jose/package.json`. A planted `6.2.11` reddens it.
- **Commit:** `cce9b5b16`.

### Plan steps adapted

**5. nodemailer 10 held (D-03 / PROH-169-16; the plan says "the task waits")**
- **What:** `npm:nodemailer@6.9.10` is unchanged.
  - 10.0.0 is 29.28 d old and clears 2026-10-04T07:45:32Z.
  - 10.0.11 (7 d at 2026-10-04T07:50:47Z) would be the target.
  - Every older line has an open high advisory.
- **Recorded:** EVIDENCE § 1, § 2, § 3 (hold row) and § 7; todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md`.
- **Impact:** DEPS-09 stays Pending. The change itself is one line plus a boot check and a full E2E run.

**6. Bank-auth 3× as two projects ×3, not one combined command**
- The combined command cannot pass, because one served function has one `IDENTITY_PROVIDER_ISSUER`. The synthetic
  token is issued by `test-idp.example.com` and the journey's by `127.0.0.1:9443`.
- The runs followed 166-04: `bank-auth` ×3 with the E-1 env, then `bank-auth-journey` ×3 with the issuer set to the
  mock. The summaries are at `tests/e2e-runs/169-07-bankauth-{1,2,3}` (the plan's verify loop passes) and
  `169-07-bankauth-journey-{1,2,3}`.

**7. The "email and invite specs" do not exist as Edge Function callers**
- No E2E spec invokes `send-email` or `invite-candidate`; this confirms 168-03 F2.
- Their runtime proof here is the boot check plus an anon-token probe. The probe returns 401 from
  `callerClient.auth.getUser()` and so exercises the new `npm:` supabase-js client.

### Issues re-tested

**8. One full-suite failure, root cause UNCONFIRMED**
- **What:** `169-07-group5` gave 1 failed / 88 did not run. `voter-journey` timed out at Base-6: the spec pressed `End`
  and clicked Next 14 ms later, and no answer was stored.
- **Why not attributed to this plan:** nothing here touches the client-side answer path.
- **Re-test:** 3/3 in isolation, then inside all three journey chains, then the full re-run `169-07-group5-r2`, which
  passed 171/171 and is the verdict.
- **Follow-up:** logged in `deferred-items.md` with a suggested spec fix (await the stored answer before Next).

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 test budget, 2 hygiene/correctness), 3 plan steps adapted (1 recorded
hold, 2 procedure), 1 UNCONFIRMED flake re-tested green.
**Impact on plan:** D-22 is fully done. D-09 is done for supabase-js and jose and waits one calendar day for nodemailer.

## Issues Encountered

- `functions serve --env-file` replaces the project's edge-runtime container, and killing it removes the container.
  The default stack was restored with `yarn db:stop && yarn db:start` and read back by key.
- The Docker credential helper was not needed this time. Every `db:start` ran with the scratch `DOCKER_CONFIG` and
  pulled nothing.

## User Setup Required

None.

## Operator items

- **nodemailer 10 pin** after 2026-10-04T07:51Z (todo). It is time-boxed and high severity, because `send-email`
  still runs a version with four distinct high advisories.
- `send-email` / `invite-candidate` have no E2E caller (168-03 F2, confirmed).
- Auth responses now carry `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`. A future route
  that calls `setHeaders` with `cache-control` on a session-refreshing request would collide (EVIDENCE § 7).
- The voter-journey number-slider race (deferred-items.md, UNCONFIRMED).

## Known Stubs

None.

## Threat Flags

None. The only new surface is response headers that tighten caching (T-169-23, mitigated as planned).

## Next Phase Readiness

- **169-08** (faker 10) can start.
  - The local stack is `openvaa-local` on PG15 with the CLI 2.118.0 images and its default function env. It is
    restarted, not reset: the bank-auth baseline reset ran, then the suites' own setup and teardown, and there are no
    orphans. Run `db:reset` before relying on a pristine DB.
  - No dev server, Playwright, function server or JWKS server is running. Ports 5273, 8777 and 9443 are free.
- **Whichever plan runs after 2026-10-04T07:51Z** (169-13 at the latest) should apply the nodemailer todo. DEPS-09
  also has a 169-13 part: the `audit:deps` blind-spot todo (T-169-26).
- **DEPS-07** is complete:
  - CLI part: 169-06.
  - supabase-js / ssr part with its gates: here.
  - Postgres 17 is DEPS-08, still Pending.

## Self-Check: PASSED

- Files exist: `169-07-SUMMARY.md`, the nodemailer todo, `server.ts` (2 `setHeaders`), `send-email/index.ts`
  (`npm:@supabase/supabase-js@2.117.2`), `identity-callback/index.ts` (`npm:jose@6.2.12`).
- Commits in `git log`: `3f4fe2ebf`, `fd8b72ce7`, `9075a027b`, `cce9b5b16`, `dd9c94679`.
- `tests/e2e-runs/169-gates/169-07-group5/summary.tsv`: 12 rows, all 0.
- `tests/e2e-runs/169-e2e/169-07-group5-r2/summary.json`, `169-07-supabase-js`, `169-07-ssr`: failed, flaky and
  didNotRun all 0.
- `tests/e2e-runs/169-07-bankauth-{1,2,3}/summary.json`: the plan's verify loop exits 0. The journey summaries are clean
  too.
- Not met by design: the artifact `contains: "npm:nodemailer@10."` (held, Deviation 5).

---
phase: 42-runtime-validation-and-poc
plan: 02
subsystem: infra
tags: [deno, sveltekit, adapter-node, supabase-auth, playwright, e2e, runtime-validation]

# Dependency graph
requires:
  - phase: 42-01
    provides: Deno 2.x hybrid workspace with deno.json, nodeModulesDir manual
provides:
  - SvelteKit production build validated under Deno runtime (VAL-01)
  - Supabase PKCE auth flow validated on Deno (VAL-05)
  - 54/67 Playwright E2E tests passing against Deno-served frontend (VAL-02)
  - Reusable smoke test script at scripts/deno-serve-test.sh
  - Documented Deno permission set for SvelteKit serving
affects: [43-evaluation, 44-report]

# Tech tracking
tech-stack:
  added: []
  patterns: [deno-serve-sveltekit, origin-env-csrf-protection, unstable-bare-node-builtins]

key-files:
  created:
    - scripts/deno-serve-test.sh
  modified: []

key-decisions:
  - "--unstable-bare-node-builtins required for Paraglide JS async_hooks import"
  - "ORIGIN env var required by adapter-node for SvelteKit CSRF protection on form actions"
  - "No cookie serialization issues found (Pitfall 6 from research disproven)"
  - "0 Deno-specific test failures out of 67 E2E tests (all failures are pre-existing)"

patterns-established:
  - "Deno SvelteKit serving: deno run --allow-env --allow-read --allow-net --unstable-bare-node-builtins build/index.js"
  - "ORIGIN env var must be set when serving SvelteKit with adapter-node under Deno (or Node) for CSRF"

requirements-completed: [VAL-01, VAL-02, VAL-05]

# Metrics
duration: 32min
completed: 2026-03-26
---

# Phase 42 Plan 02: SvelteKit on Deno Validation Summary

**SvelteKit production build serving under Deno with 54/67 E2E tests passing, Supabase PKCE auth validated, zero Deno-specific failures**

## Performance

- **Duration:** 32 min
- **Started:** 2026-03-26T15:40:10Z
- **Completed:** 2026-03-26T16:12:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 1

## Accomplishments
- SvelteKit production build starts and serves valid HTML under Deno runtime (VAL-01 PASS)
- Supabase PKCE auth flow works end-to-end on Deno: login, error handling, session persistence, protected routes (VAL-05 PASS)
- 54 of 67 Playwright E2E tests pass against Deno-served frontend with zero Deno-specific failures (VAL-02 PASS)
- Documented exact Deno permission set: `--allow-env --allow-read --allow-net --unstable-bare-node-builtins`
- Disproved Pitfall 6 from research: no cookie serialization issues found

## Task Commits

Each task was committed atomically:

1. **Task 1: Validate SvelteKit production build serves under Deno (VAL-01)** - `8714bc773` (feat)
2. **Task 2: Validate Supabase auth and E2E tests against Deno frontend (VAL-05, VAL-02)** - `fde089c50` (feat)
3. **Task 3: Verify E2E results and auth flow** - checkpoint (human-verify, approved)

## Files Created/Modified
- `scripts/deno-serve-test.sh` - Reusable smoke test script for SvelteKit under Deno with permission documentation

## E2E Test Results

| Category | Passed | Failed | Skipped | Total |
|----------|--------|--------|---------|-------|
| All specs | 54 | 12 | 1 | 67 |
| Deno-specific failures | 0 | 0 | - | 0 |

**Failure breakdown:**
- 1 pre-existing failure: registration email URL port mismatch (not Deno-related)
- 11 cascade failures from the registration failure (dependent tests)
- 1 skipped (pre-existing)
- 0 Deno-specific failures

## Deno Permission Set

The following permissions are required to serve SvelteKit production builds under Deno:

| Permission | Reason |
|------------|--------|
| `--allow-env` | Read PORT, HOST, Supabase env vars |
| `--allow-read` | Serve static files from build/client/ |
| `--allow-net` | Listen on HTTP port, connect to Supabase API |
| `--unstable-bare-node-builtins` | Paraglide JS imports `async_hooks` without `node:` prefix |

**Notable:** `--allow-sys` was NOT needed (contrary to research hypothesis). `--allow-write` was NOT needed.

## Environment Variables

| Variable | Required | Reason |
|----------|----------|--------|
| `PORT` | Yes | HTTP listening port |
| `ORIGIN` | Yes | adapter-node CSRF protection for form actions |
| `PUBLIC_SUPABASE_URL` | Yes | Supabase client initialization |
| `PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client initialization |

## Decisions Made
- **--unstable-bare-node-builtins over patching:** Paraglide JS uses bare `async_hooks` import (without `node:` prefix). Using the Deno flag is cleaner than patching the library, and Deno plans to stabilize this flag
- **ORIGIN env var added to smoke test:** Required by SvelteKit adapter-node for CSRF protection on form actions. Without it, POST requests to form actions fail with 403
- **No cookie serialization workaround needed:** Research flagged Deno's `set-cookie` handling as a potential issue (Pitfall 6), but testing showed Supabase auth cookies work correctly without any workaround

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added ORIGIN env var for adapter-node CSRF protection**
- **Found during:** Task 2 (E2E test execution)
- **Issue:** SvelteKit form actions returned 403 Forbidden because adapter-node requires the ORIGIN env var for CSRF validation
- **Fix:** Added `ORIGIN="${ORIGIN:-http://localhost:$PORT}"` to the smoke test script's env var block
- **Files modified:** scripts/deno-serve-test.sh
- **Verification:** E2E tests that use form actions (auth login) pass after adding ORIGIN
- **Committed in:** fde089c50 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for auth validation. ORIGIN is a standard adapter-node requirement, not Deno-specific. No scope creep.

## Issues Encountered
- Registration email URL port mismatch: 1 pre-existing E2E failure where the registration email contains a different port than the test expects. This is a test environment configuration issue, not a Deno issue. It cascades to 11 dependent tests.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 42 is now complete: all 8 requirements validated (POC-01/02/03, VAL-01/02/03/04/05)
- Phase 43 (Evaluation and Benchmarking) can proceed with concrete evidence:
  - Deno serves SvelteKit with only 4 permission flags
  - Zero Deno-specific E2E failures
  - PKCE auth works without cookie workarounds
  - `--unstable-bare-node-builtins` is the only unstable flag needed
- Key data points for Phase 43 benchmarking: startup time comparison (Deno vs Node), permission model assessment

## Self-Check: PASSED

- FOUND: scripts/deno-serve-test.sh (on feat-42-02-deno-validation branch)
- FOUND: .planning/phases/42-runtime-validation-and-poc/42-02-SUMMARY.md
- FOUND: commit 8714bc773 (Task 1)
- FOUND: commit fde089c50 (Task 2)

---
*Phase: 42-runtime-validation-and-poc*
*Completed: 2026-03-26*

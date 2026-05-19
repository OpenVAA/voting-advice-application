---
phase: 48-backward-compatibility-and-testing
plan: 02
subsystem: testing
tags: [vitest, jose, jar, private-key-jwt, oidc, edge-function, claim-extraction, signicat, idura]

# Dependency graph
requires:
  - phase: 45-provider-abstraction-and-configuration
    provides: IdentityProvider interface, signicatProvider, iduraProvider, authConfig modules
  - phase: 46-idura-authorization-and-token-exchange
    provides: Idura JAR construction (/api/oidc/authorize), private_key_jwt token exchange (/api/oidc/token)
  - phase: 47-edge-function-provider-support
    provides: Identity-callback Edge Function with PROVIDER_CONFIGS and extractIdentityClaims
  - phase: 48-01
    provides: Shared test fixtures (createTestKeySet, createTestJwe), vi.hoisted pattern, @vitest-environment node convention
provides:
  - JAR construction endpoint tests (9 tests covering RS256 signing, payload fields, signature verification, cookie management)
  - Token exchange endpoint tests (10 tests covering Idura private_key_jwt assertion and Signicat client_secret backward compat)
  - Extracted claimConfig.ts pure functions (no Deno imports) from Edge Function index.ts
  - Edge Function claim extraction tests (16 tests covering both provider configs and extractIdentityClaims)
  - Vitest setup for @openvaa/supabase workspace
affects: [48-03, future-edge-function-tests]

# Tech tracking
tech-stack:
  added: [vitest in @openvaa/supabase workspace]
  patterns: [pure function extraction from Edge Functions for vitest testing, route handler testing with mock RequestEvent]

key-files:
  created:
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
    - apps/supabase/vitest.config.ts
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/package.json
    - yarn.lock

key-decisions:
  - "Test files must NOT be placed in routes/ with + prefix (SvelteKit reserves +server.test.ts as route files)"
  - "Extract pure functions from Edge Function into claimConfig.ts for vitest testability (no Deno deps)"
  - "Add vitest + type:module to @openvaa/supabase workspace for Edge Function pure function tests"
  - "Return shape from extractIdentityClaims uses matchValue/extraClaims (not identityMatchValue/extractedClaims)"
  - "Mock global fetch to intercept token endpoint calls and inspect request body for assertion verification"
  - "Dynamic mockPublicConstants switching enables testing both Idura and Signicat paths in same test file"

patterns-established:
  - "Route handler tests go in __tests__/ under lib/, NOT co-located in routes/ (SvelteKit + prefix conflict)"
  - "Edge Function pure function extraction pattern: claimConfig.ts has no Deno imports, importable by both Edge Function and vitest"
  - "Token endpoint testing pattern: mock fetch, invoke handler, capture URLSearchParams for assertion inspection"

requirements-completed: [TEST-01]

# Metrics
duration: 12min
completed: 2026-03-27
---

# Phase 48 Plan 02: Endpoint and Edge Function Unit Tests Summary

**JAR construction, private_key_jwt assertion, and Edge Function claim extraction tests with 35 new tests across 4 test files and extracted claimConfig.ts pure functions**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-27T12:31:12Z
- **Completed:** 2026-03-27T12:43:30Z
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 3

## Accomplishments

- Created authorize endpoint tests verifying JAR RS256 signing, payload fields (response_type, client_id, redirect_uri, iss, aud, state, nonce), signature verification with public key, and cookie management for CSRF/replay protection
- Created token endpoint tests verifying Idura private_key_jwt assertion structure (RS256 header, iss/sub=client_id, aud=token_endpoint, 5min exp, jti present) and Signicat client_secret backward compatibility (client_secret sent, no client_assertion)
- Extracted PROVIDER_CONFIGS and extractIdentityClaims from Edge Function index.ts into claimConfig.ts (pure TypeScript, no Deno imports) for vitest testability
- Created Edge Function claim extraction tests covering both provider configs, claim value extraction, missing claim error handling, and optional claim omission
- Added vitest infrastructure to @openvaa/supabase workspace (vitest.config.ts, package.json scripts + deps)
- Full test suite passes: 613 tests across all workspaces (35 new, 0 regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: JAR construction and private_key_jwt client assertion tests** - `45e28ca65` (test)
2. **Task 2: Edge Function claim extraction tests (extract pure functions)** - `3159a0a44` (test)

## Files Created/Modified

- `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` - 9 tests: JAR RS256 signing, payload fields, signature verification, cookie management
- `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` - 10 tests: Idura private_key_jwt assertion (6), Signicat client_secret backward compat (4)
- `apps/supabase/supabase/functions/identity-callback/claimConfig.ts` - Extracted pure functions (PROVIDER_CONFIGS, extractIdentityClaims, ProviderClaimConfig interface)
- `apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts` - 16 tests: provider configs (8), claim extraction (8)
- `apps/supabase/vitest.config.ts` - Vitest configuration for supabase workspace (node env, functions glob)
- `apps/supabase/supabase/functions/identity-callback/index.ts` - Updated to import from claimConfig.ts, removed inline duplicate
- `apps/supabase/package.json` - Added type:module, vitest dep, test:unit script
- `yarn.lock` - Updated for new vitest dependency

## Decisions Made

- **Route handler test placement:** SvelteKit reserves all files prefixed with `+` in `routes/` as route files. Test files (`+server.test.ts`) placed in `routes/` break `yarn build`. Solution: place tests in `$lib/api/utils/auth/__tests__/` with relative imports to route handlers.
- **Edge Function pure function extraction:** Extracted `PROVIDER_CONFIGS` and `extractIdentityClaims` into `claimConfig.ts` with zero Deno dependencies. The Edge Function `index.ts` now imports from `./claimConfig.ts` (Deno-compatible relative import). This makes the business logic testable with standard vitest.
- **Supabase workspace vitest setup:** Added `vitest` as devDependency and `type: module` to `apps/supabase/package.json`. This enables `yarn workspace @openvaa/supabase test:unit` and gets picked up by `yarn test:unit` (turbo run).
- **Return shape normalization:** The extracted `extractIdentityClaims` uses `matchValue`/`extraClaims` naming (more generic than `identityMatchValue`/`extractedClaims`). The Edge Function `index.ts` destructures with aliases to maintain backward compatibility.
- **Dynamic provider switching in tests:** Using `vi.hoisted` mock state at file level allows both Idura and Signicat test suites to share the same `vi.mock` factories, switching `PUBLIC_IDENTITY_PROVIDER_TYPE` in `beforeEach`.
- **Token endpoint testing strategy:** Mock `globalThis.fetch` to intercept the actual HTTP call to the token endpoint, then inspect the captured `URLSearchParams` body. The handler throws 401 after fetch (because `getIdTokenClaims` fails on mock token), but the assertion body is already captured for inspection.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SvelteKit rejects test files with + prefix in routes/**
- **Found during:** Task 1 (running `yarn test:unit` via turbo which triggers build first)
- **Issue:** SvelteKit build scans `routes/` and treats any file starting with `+` as a route file. `+server.test.ts` files caused "Files prefixed with + are reserved" error.
- **Fix:** Moved test files from `routes/api/oidc/authorize/+server.test.ts` and `routes/api/oidc/token/+server.test.ts` to `lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` and `token-endpoint.test.ts` with updated import paths.
- **Files modified:** Both test files (rename + import path update)
- **Verification:** `yarn test:unit` passes (turbo runs build then test)
- **Committed in:** 3159a0a44 (Task 2)

**2. [Rule 3 - Blocking] @openvaa/supabase workspace needs ESM type for vitest**
- **Found during:** Task 2 (first run of `yarn workspace @openvaa/supabase test:unit`)
- **Issue:** vitest.config.ts failed with `ERR_REQUIRE_ESM` because `package.json` lacked `"type": "module"`
- **Fix:** Added `"type": "module"` to `apps/supabase/package.json`
- **Files modified:** `apps/supabase/package.json`
- **Verification:** `yarn workspace @openvaa/supabase test:unit` passes (16 tests)
- **Committed in:** 3159a0a44 (Task 2)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for test infrastructure to work. No scope creep.

## Known Stubs

None - all test files are complete with real assertions against actual implementations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All endpoint and Edge Function logic is tested with 35 new tests
- claimConfig.ts extraction creates a clean boundary for future Edge Function testing
- @openvaa/supabase workspace now has vitest infrastructure for future function tests
- Full test suite (613 tests across all workspaces) passes with zero regressions
- Ready for Plan 03 (E2E regression verification)

## Self-Check: PASSED

- All 5 created files exist on disk
- Both task commits (45e28ca65, 3159a0a44) found in git log
- Full test suite: 613/613 pass across all workspaces (0 failures)

---
*Phase: 48-backward-compatibility-and-testing*
*Completed: 2026-03-27*

---
phase: 48-backward-compatibility-and-testing
plan: 01
subsystem: testing
tags: [jose, jwe, jwt, oidc, vitest, rsa-oaep, signicat, idura, provider-abstraction]

# Dependency graph
requires:
  - phase: 45-provider-abstraction-and-configuration
    provides: IdentityProvider interface, signicatProvider, iduraProvider, authConfig modules
  - phase: 46-idura-authorization-and-token-exchange
    provides: Idura JAR construction, private_key_jwt client assertion
provides:
  - Shared test fixtures for RSA key pair generation and JWE/JWT token building
  - Signicat provider interface compliance tests (12 tests)
  - Idura provider interface compliance tests (13 tests)
  - getIdTokenClaims JWE decryption tests for RSA-OAEP and RSA-OAEP-256 (5 tests)
  - Patterns for mocking jose ESM module and SvelteKit env vars in vitest
affects: [48-02, 48-03, future-provider-tests]

# Tech tracking
tech-stack:
  added: []
  patterns: [vi.hoisted for dynamic mock state, vi.mock jose with importOriginal, @vitest-environment node for jose crypto]

key-files:
  created:
    - apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/keys.ts
    - apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/tokens.ts
    - apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/fixtures.test.ts
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
    - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
    - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts
  modified: []

key-decisions:
  - "@vitest-environment node for all jose crypto tests (jsdom Uint8Array instanceof mismatch with jose v6)"
  - "vi.hoisted pattern for sharing dynamic state between vi.mock factories and beforeAll"
  - "vi.mock('jose', importOriginal) to replace createRemoteJWKSet with createLocalJWKSet"
  - "Single signing key pair shared across tests to avoid JWKS ambiguity (ERR_JWKS_MULTIPLE_MATCHING_KEYS)"
  - "Mock $lib/server/constants directly for Idura tests (constants captured at module load time)"

patterns-established:
  - "jose crypto tests must use @vitest-environment node (jsdom polyfills break Uint8Array instanceof checks)"
  - "vi.hoisted(() => ({ state })) for dynamic mock values accessible from hoisted vi.mock factories"
  - "vi.mock('jose', async (importOriginal) => ({ ...actual, createRemoteJWKSet: replacement })) for ESM module mocking"
  - "Use single JWKS signing key when JWT header has no kid to avoid ERR_JWKS_MULTIPLE_MATCHING_KEYS"

requirements-completed: [PROV-03, TEST-01]

# Metrics
duration: 16min
completed: 2026-03-27
---

# Phase 48 Plan 01: Provider and JWE Test Fixtures Summary

**Shared JWE/JWT test fixtures with jose v6 and 36 unit tests covering both Signicat and Idura provider compliance plus RSA-OAEP/RSA-OAEP-256 decryption**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-27T12:09:05Z
- **Completed:** 2026-03-27T12:25:30Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- Created reusable test fixtures (createTestKeySet, createTestJwe, createTestJwt) using jose v6 with proper alg and kid fields
- Signicat provider tests verify interface compliance, PKCE URL parameters, client_id inclusion, and no fetch calls (client-side only)
- Idura provider tests verify interface compliance, JAR URL structure, signed request object claims with correct state/nonce
- getIdTokenClaims tests verify JWE decryption with both RSA-OAEP (Signicat) and RSA-OAEP-256 (Idura), plus error handling for kid mismatches
- Full test suite passes: 578 tests (36 new, 0 regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared test fixture factories (keys and tokens)** - `6005fde93` (test)
2. **Task 2: Provider interface compliance tests and JWE decryption tests** - `bc19fbdfc` (test)

## Files Created/Modified

- `apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/keys.ts` - RSA key pair generation factory (createTestKeySet)
- `apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/tokens.ts` - JWE/JWT token builders (createTestJwe, createTestJwt)
- `apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/fixtures.test.ts` - Smoke tests validating fixture correctness
- `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts` - 12 tests: interface compliance (D-04), PKCE URL shape (D-09/D-10), no fetch
- `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` - 13 tests: interface compliance (D-04), JAR URL shape, signed request object claims
- `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts` - 5 tests: RSA-OAEP and RSA-OAEP-256 decryption (D-08), kid mismatch handling

## Decisions Made

- **@vitest-environment node for jose tests:** jsdom environment polyfills `Uint8Array` with its own class, breaking jose v6's `instanceof Uint8Array` check in `FlattenedSign`. Using `node` environment avoids this.
- **vi.hoisted for dynamic mock state:** vi.mock factories are hoisted above all imports and cannot reference module-level variables. `vi.hoisted(() => state)` creates state at the same hoisted level, enabling dynamic values (like signing keys generated in beforeAll).
- **vi.mock('jose') with importOriginal:** ESM module exports are not configurable, so `vi.spyOn(jose, 'createRemoteJWKSet')` fails. Instead, mock the entire module with `importOriginal` and only override `createRemoteJWKSet`.
- **Single signing key pair:** Using separate signing keys per algorithm causes `ERR_JWKS_MULTIPLE_MATCHING_KEYS` because the inner JWT has no `kid` header and the JWKS has multiple matching `RS256` keys.
- **Mock $lib/server/constants for Idura:** The constants module reads env at import time. Mocking `$env/dynamic/private` with a getter doesn't help because the value is already captured. Mocking `$lib/server/constants` directly with a getter allows dynamic values from beforeAll.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jsdom environment breaks jose v6 crypto operations**
- **Found during:** Task 1 (fixture smoke tests)
- **Issue:** jose v6 `FlattenedSign` checks `payload instanceof Uint8Array` but jsdom's TextEncoder returns a different Uint8Array class
- **Fix:** Added `@vitest-environment node` docblock to all test files that use jose crypto
- **Files modified:** All 4 test files
- **Verification:** All tests pass with node environment
- **Committed in:** 6005fde93 (Task 1), bc19fbdfc (Task 2)

**2. [Rule 3 - Blocking] jose exportJWK omits alg field needed by importJWK**
- **Found during:** Task 1 (fixture smoke tests)
- **Issue:** `exportJWK` output lacks `alg` field, causing `importJWK` to throw "alg argument is required"
- **Fix:** Added `alg` field to exported JWKs in createTestKeySet fixture
- **Files modified:** `__fixtures__/keys.ts`
- **Verification:** Fixture smoke tests pass for both RSA-OAEP and RSA-OAEP-256
- **Committed in:** 6005fde93 (Task 1)

**3. [Rule 3 - Blocking] ESM module exports not configurable for vi.spyOn**
- **Found during:** Task 2 (getIdTokenClaims tests)
- **Issue:** `vi.spyOn(jose, 'createRemoteJWKSet')` throws "Module namespace is not configurable in ESM"
- **Fix:** Used `vi.mock('jose', async (importOriginal) => ({ ...actual, createRemoteJWKSet: replacement }))` instead
- **Files modified:** `getIdTokenClaims.test.ts`
- **Verification:** All 5 getIdTokenClaims tests pass
- **Committed in:** bc19fbdfc (Task 2)

**4. [Rule 1 - Bug] Multiple matching keys in JWKS causes verification failure**
- **Found during:** Task 2 (getIdTokenClaims tests)
- **Issue:** Using separate signing key pairs per algorithm created JWKS with 2 RS256 keys. JWT header has no kid, so jose finds both and throws ERR_JWKS_MULTIPLE_MATCHING_KEYS
- **Fix:** Restructured to use a single signing key pair shared across all tests, with only encryption keys differing
- **Files modified:** `getIdTokenClaims.test.ts`
- **Verification:** All decryption tests pass with single JWKS entry
- **Committed in:** bc19fbdfc (Task 2)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes necessary for test infrastructure correctness. No scope creep.

## Issues Encountered

- The plan referenced `apps/frontend/` paths but this was correct for the gsd repo which has the Phase 45-47 code
- jose v6 ESM-only design requires different mocking patterns compared to CommonJS libraries

## Known Stubs

None - all test files are complete with real assertions against actual provider implementations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Test fixtures (keys.ts, tokens.ts) are ready for reuse in Plan 02 (JAR construction) and Plan 03 (Edge Function)
- Mock patterns established for SvelteKit env vars, jose ESM module, and server constants
- All 578 tests pass with zero regressions

## Self-Check: PASSED

- All 6 created files exist on disk
- Both task commits (6005fde93, bc19fbdfc) found in git log
- Full test suite: 578/578 pass (29 test files, 0 failures)

---
*Phase: 48-backward-compatibility-and-testing*
*Completed: 2026-03-27*

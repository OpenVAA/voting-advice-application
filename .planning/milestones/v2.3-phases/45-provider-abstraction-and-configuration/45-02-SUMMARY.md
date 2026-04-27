---
phase: 45-provider-abstraction-and-configuration
plan: 02
subsystem: auth
tags: [oidc, jose, signicat, idura, provider-pattern, ftn]

# Dependency graph
requires:
  - phase: 45-provider-abstraction-and-configuration/01
    provides: IdentityProvider interface, AuthConfig type, SIGNICAT_AUTH_CONFIG, IDURA_AUTH_CONFIG, types.ts, authConfig.ts
provides:
  - signicatProvider implementing IdentityProvider with PKCE + client_secret flow
  - iduraProvider implementing IdentityProvider with working getIdTokenClaims and stub authorize/token
  - getActiveProvider() factory dispatching on PUBLIC_IDENTITY_PROVIDER_TYPE env var
  - Re-exported IdentityProvider, AuthConfig, ProviderType types from index.ts
affects: [phase-46-idura-authorization-and-token-exchange, phase-47-consumer-migration, phase-48-backward-compatibility]

# Tech tracking
tech-stack:
  added: []
  patterns: [provider-factory-pattern, config-driven-claim-extraction, discriminated-union-results]

key-files:
  created:
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
    - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
    - apps/frontend/src/lib/api/utils/auth/providers/index.ts
  modified: []

key-decisions:
  - "Used direct SIGNICAT_AUTH_CONFIG/IDURA_AUTH_CONFIG references instead of this.authConfig (plain objects, not class instances)"
  - "Idura getIdTokenClaims is fully implemented (not a stub) since JWE+JWT flow is identical to Signicat"

patterns-established:
  - "Provider factory pattern: getActiveProvider() returns correct IdentityProvider based on env var"
  - "Config-driven claim extraction: extractedClaims built from authConfig.extractClaims array via Object.fromEntries"

requirements-completed: [PROV-01, PROV-02]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 45 Plan 02: Provider Implementations and Factory Summary

**Signicat OIDC provider wrapping existing PKCE+client_secret auth, Idura provider with working JWE claims and Phase 46 stubs, and factory dispatching on PUBLIC_IDENTITY_PROVIDER_TYPE**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T10:53:54Z
- **Completed:** 2026-03-27T10:56:57Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Signicat provider wraps existing PKCE authorize URL, client_secret token exchange, and JWE decrypt + JWT verify into IdentityProvider interface with config-driven claim extraction
- Idura provider has fully functional getIdTokenClaims (RSA-OAEP-256 JWE + JWT) with stub authorize/token methods referencing Phase 46
- Factory function getActiveProvider() correctly dispatches based on PUBLIC_IDENTITY_PROVIDER_TYPE env var, defaulting to signicat for backward compatibility
- All 5 provider files in place: types.ts, authConfig.ts, signicat.ts, idura.ts, index.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Signicat provider wrapping existing auth code** - `58efbeb42` (feat)
2. **Task 2: Implement Idura provider stub and provider factory** - `0073ac4fb` (feat)

## Files Created/Modified

- `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts` - Signicat OIDC provider: PKCE authorize URL, client_secret token exchange, JWE decrypt + JWT verify with SIGNICAT_AUTH_CONFIG claim extraction
- `apps/frontend/src/lib/api/utils/auth/providers/idura.ts` - Idura OIDC provider: working getIdTokenClaims with RSA-OAEP-256, stub getAuthorizeUrl/exchangeCodeForToken for Phase 46
- `apps/frontend/src/lib/api/utils/auth/providers/index.ts` - Provider factory: getActiveProvider() dispatches on env var, re-exports IdentityProvider/AuthConfig/ProviderType

## Decisions Made

- Used direct config constant references (SIGNICAT_AUTH_CONFIG, IDURA_AUTH_CONFIG) instead of `this.authConfig` since providers are plain objects, not class instances with `this` binding
- Fully implemented Idura getIdTokenClaims rather than stubbing it, since the JWE+JWT verification flow is identical to Signicat (jose handles RSA-OAEP-256 transparently)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Provider abstraction layer complete: types, configs, both providers, and factory all in place
- Phase 46 can implement Idura getAuthorizeUrl (JAR construction) and exchangeCodeForToken (private_key_jwt)
- Phase 47 can migrate consumers from direct auth calls to getActiveProvider()
- Phase 48 can add backward compatibility testing

## Self-Check: PASSED

- All 3 created files exist on disk
- Both task commit hashes found in git log (58efbeb42, 0073ac4fb)

---
*Phase: 45-provider-abstraction-and-configuration*
*Completed: 2026-03-27*

---
phase: 46-idura-authorization-and-token-exchange
plan: 01
subsystem: auth
tags: [oidc, jar, private-key-jwt, jose, rs256, ftn, idura]

# Dependency graph
requires:
  - phase: 45-provider-abstraction-and-configuration/02
    provides: IdentityProvider interface, iduraProvider stub, getActiveProvider() factory, types.ts, authConfig.ts
provides:
  - Fully implemented Idura getAuthorizeUrl with JAR (RFC 9101) RS256-signed request objects
  - Fully implemented Idura exchangeCodeForToken with private_key_jwt client assertion (RFC 7523)
  - Server-side /api/oidc/authorize endpoint with state/nonce cookie storage
  - Provider-abstracted /api/oidc/token endpoint (no hardcoded client_secret)
  - AuthorizeResult type extended with optional state/nonce fields
affects: [46-02-callback-and-frontend, 47-consumer-migration, 48-backward-compatibility]

# Tech tracking
tech-stack:
  added: []
  patterns: [jar-signed-authorization-request, private-key-jwt-client-assertion, state-nonce-cookie-storage]

key-files:
  created:
    - apps/frontend/src/routes/api/oidc/authorize/+server.ts
  modified:
    - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - apps/frontend/src/routes/api/oidc/token/+server.ts

key-decisions:
  - "AuthorizeResult extended with optional state/nonce rather than creating a separate IduraAuthorizeResult type"
  - "getSigningKey helper extracts shared JWKS parsing to avoid duplication between authorize and token methods"
  - "Token route delegates entirely to provider abstraction -- no direct constant imports"
  - "Used CryptoKey | Uint8Array for signing key type (jose v6 removed KeyLike export)"

patterns-established:
  - "JAR construction: SignJWT with response_type, response_mode, client_id, redirect_uri, scope, state, nonce, iss, aud in payload"
  - "private_key_jwt: SignJWT with iss=sub=clientId, aud=tokenEndpoint, exp=5m, unique jti per request"
  - "State/nonce storage: httpOnly cookies with sameSite=lax, maxAge=600, secure=true"
  - "Authorize endpoint pattern: POST receives redirectUri, returns { authorizeUrl }"

requirements-completed: [AUTH-01, TOKN-01, TOKN-02]

# Metrics
duration: 255s
completed: 2026-03-27
---

# Phase 46 Plan 01: Idura Authorization and Token Exchange Summary

**RS256-signed JAR authorization requests and private_key_jwt token exchange for Idura FTN, with provider-abstracted server-side authorize and token endpoints**

## Performance

- **Duration:** 4 min 15s
- **Started:** 2026-03-27T11:04:09Z
- **Completed:** 2026-03-27T11:08:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Idura provider fully implements JAR-based getAuthorizeUrl (RS256 signed JWT request object with response_type, response_mode, client_id, redirect_uri, scope, state, nonce, iss, aud)
- Idura provider fully implements private_key_jwt exchangeCodeForToken (client assertion JWT with 5min exp, unique jti, aud=token endpoint URL)
- New /api/oidc/authorize POST endpoint delegates to active provider and stores state/nonce in httpOnly cookies
- Token exchange route uses provider abstraction instead of hardcoded client_secret -- works for both Signicat and Idura

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Idura provider getAuthorizeUrl and exchangeCodeForToken** - `d345a23b0` (feat)
2. **Task 2: Create authorize endpoint and update token exchange route** - `3d3bad08c` (feat)

## Files Created/Modified

- `apps/frontend/src/lib/api/utils/auth/providers/idura.ts` - Full Idura provider: JAR authorize, private_key_jwt token exchange, getSigningKey helper
- `apps/frontend/src/lib/api/utils/auth/providers/types.ts` - AuthorizeResult extended with optional state/nonce fields
- `apps/frontend/src/routes/api/oidc/authorize/+server.ts` - New server-side authorize endpoint with cookie-based state/nonce storage
- `apps/frontend/src/routes/api/oidc/token/+server.ts` - Refactored to use provider abstraction, removed hardcoded client_secret exchange

## Decisions Made

- Extended AuthorizeResult with optional state/nonce rather than creating a separate type -- keeps the interface simple since Signicat returns undefined for these fields
- Used `CryptoKey | Uint8Array` instead of `jose.KeyLike` for the signing key return type since jose v6 removed the KeyLike export
- Token endpoint URL used as `aud` claim for client assertion (not domain root) -- this is the most common convention per OAuth spec and Auth0 docs
- Extracted getSigningKey helper function to avoid duplicating JWKS parsing between getAuthorizeUrl and exchangeCodeForToken

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jose v6 removed KeyLike type export**
- **Found during:** Task 1 (Idura provider implementation)
- **Issue:** Plan referenced `jose.KeyLike` for the getSigningKey return type, but jose v6 no longer exports `KeyLike`
- **Fix:** Used `CryptoKey | Uint8Array` which is the actual return type of `jose.importJWK()` in v6
- **Files modified:** apps/frontend/src/lib/api/utils/auth/providers/idura.ts
- **Verification:** TypeScript compilation passes with no errors in provider files
- **Committed in:** d345a23b0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type adjustment for jose v6 compatibility. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in unrelated Supabase adapter files (dataProvider, dataWriter, adminWriter) -- not caused by this plan's changes, not fixed per scope boundary rules.

## User Setup Required

None - no external service configuration required. Environment variables were configured in Phase 45.

## Known Stubs

None -- all files contain complete implementations. No TODOs, FIXMEs, or placeholder values.

## Next Phase Readiness

- Idura authorize and token exchange fully functional
- Plan 02 (callback route and frontend migration) can now create /api/oidc/callback that uses provider.exchangeCodeForToken() directly
- Plan 02 can update the preregister page to call /api/oidc/authorize instead of building URLs client-side
- State/nonce cookies are stored and ready for verification in the callback route

## Self-Check: PASSED

All 4 files found on disk. Both task commit hashes (d345a23b0, 3d3bad08c) verified in git log.

---
*Phase: 46-idura-authorization-and-token-exchange*
*Completed: 2026-03-27*

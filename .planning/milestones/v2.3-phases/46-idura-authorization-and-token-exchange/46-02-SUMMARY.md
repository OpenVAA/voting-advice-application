---
phase: 46-idura-authorization-and-token-exchange
plan: 02
subsystem: auth
tags: [oidc, callback, csrf-state, pkce, cookie-auth, svelte, route-map]

# Dependency graph
requires:
  - phase: 46-idura-authorization-and-token-exchange/01
    provides: Server-side /api/oidc/authorize endpoint, provider-abstracted /api/oidc/token endpoint, getActiveProvider factory, IdentityProvider interface with exchangeCodeForToken and getIdTokenClaims
  - phase: 45-provider-abstraction-and-configuration/01
    provides: IdentityProvider interface, signicatProvider, iduraProvider, getActiveProvider factory
provides:
  - Provider-agnostic /api/oidc/callback GET server route handling both Idura and Signicat auth code exchange
  - Updated preregister page using /api/oidc/authorize for both providers (Idura JAR, Signicat PKCE)
  - Updated route map with CandAppPreregisterIdentityProviderCallback pointing to /api/oidc/callback
  - Deleted old Signicat-specific callback page and directories
  - Cookie-based code_verifier storage replacing localStorage for server-side access
affects: [47-edge-function-update, 48-backward-compatibility, e2e-preregistration-tests]

# Tech tracking
tech-stack:
  added: []
  patterns: [provider-agnostic-callback, cookie-code-verifier, dual-provider-authorize-endpoint]

key-files:
  created:
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
  modified:
    - apps/frontend/src/routes/candidate/preregister/+page.svelte
    - apps/frontend/src/lib/utils/route/route.ts
  deleted:
    - apps/frontend/src/routes/candidate/preregister/signicat/oidc/callback/+page.svelte

key-decisions:
  - "Callback route verifies state cookie only when present (backward compat with Signicat PKCE which may not store state server-side)"
  - "Both Idura and Signicat preregister flows now use /api/oidc/authorize endpoint for URL construction"
  - "Code verifier stored in cookie (samesite=lax, max-age=600) instead of localStorage for server-side accessibility"
  - "Nonce cleanup in callback without active verification (deferred to future enhancement)"

patterns-established:
  - "Provider-agnostic callback: single /api/oidc/callback handles both Idura and Signicat auth flows"
  - "Cookie-based PKCE: code_verifier in cookie replaces localStorage for server route access"
  - "Dual-provider authorize: preregister page branches on PUBLIC_IDENTITY_PROVIDER_TYPE for Idura vs Signicat"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 46 Plan 02: Callback and Frontend Update Summary

**Provider-agnostic /api/oidc/callback with CSRF state verification, dual-provider preregister page, and cookie-based code_verifier replacing localStorage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T11:12:09Z
- **Completed:** 2026-03-27T11:16:03Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 2 modified, 1 deleted)

## Accomplishments
- Created provider-agnostic /api/oidc/callback server route that handles both Idura (JAR + private_key_jwt) and Signicat (PKCE + client_secret) authorization code exchange
- Updated preregister page to use /api/oidc/authorize endpoint for both providers, eliminating inline Signicat URL construction
- Replaced localStorage code_verifier storage with cookie-based storage for server-side callback access
- Deleted old Signicat-specific callback page and empty parent directories (signicat/oidc/callback)
- Updated route map to point CandAppPreregisterIdentityProviderCallback to /api/oidc/callback, resolving existing TODO

## Task Commits

Each task was committed atomically:

1. **Task 1: Create provider-agnostic callback server route** - `7d5f4f90f` (feat)
2. **Task 2: Update preregister page, route map, and delete old callback** - `ee8262ebb` (feat)

## Files Created/Modified
- `apps/frontend/src/routes/api/oidc/callback/+server.ts` - Provider-agnostic callback GET handler: validates code, verifies state cookie, reads code_verifier cookie, exchanges code via provider, verifies claims, sets id_token cookie, redirects to preregister
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` - Updated redirectToIdentityProvider() to use /api/oidc/authorize for both Idura and Signicat, cookie-based code_verifier
- `apps/frontend/src/lib/utils/route/route.ts` - Changed CandAppPreregisterIdentityProviderCallback from signicat/oidc/callback to /api/oidc/callback
- `apps/frontend/src/routes/candidate/preregister/signicat/oidc/callback/+page.svelte` - Deleted (old Signicat-specific callback page)

## Decisions Made
- **State verification is conditional:** The callback only verifies state when the oidc_state cookie exists. This supports Signicat PKCE flow which may not set state cookies server-side, while ensuring Idura flow (which always sets state via the authorize endpoint) gets full CSRF protection.
- **Both providers use /api/oidc/authorize:** Rather than keeping inline URL construction for Signicat, both flows now call the authorize endpoint. This makes the flow truly provider-agnostic: authorize -> IdP redirect -> callback -> preregister.
- **Cookie-based code_verifier:** Changed from localStorage to a cookie with `samesite=lax; max-age=600; secure` so the server-side callback route can access it. The lax samesite is needed because the cookie must survive the cross-origin redirect from the identity provider.
- **Nonce cleanup without verification:** The callback cleans up the oidc_nonce cookie but does not verify it against the id_token nonce claim. This is documented as a future enhancement.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 46 complete: the full Idura OIDC flow (authorize -> IdP -> callback -> preregister) is now implemented
- The Edge Function for identity matching may need updating for provider-agnostic claim extraction (future phase)
- E2E tests for the preregistration flow should be updated to reflect the new callback URL

## Self-Check: PASSED

All files verified present/deleted. All commits verified in git log. SUMMARY.md created.

---
*Phase: 46-idura-authorization-and-token-exchange*
*Completed: 2026-03-27*

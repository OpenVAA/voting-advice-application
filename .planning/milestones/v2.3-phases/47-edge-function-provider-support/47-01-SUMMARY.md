---
phase: 47-edge-function-provider-support
plan: 01
subsystem: auth
tags: [edge-function, oidc, jose, deno, identity-provider, signicat, idura]

# Dependency graph
requires:
  - phase: 45-provider-abstraction-and-configuration
    provides: Provider abstraction layer with IDENTITY_PROVIDER_TYPE env var
  - phase: 46-idura-authorization-and-token-exchange
    provides: Idura JAR + private_key_jwt auth flow
provides:
  - Provider-agnostic identity-callback Edge Function with PROVIDER_CONFIGS
  - Config-driven claim mapping for Signicat (birthdate) and Idura (sub)
  - Audit trail in app_metadata (identity_provider, identity_match_prop, identity_match_value)
  - Frontend preregister route invoking identity-callback
affects: [48-backward-compatibility-and-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PROVIDER_CONFIGS record maps provider type to claim property names"
    - "Config-driven extractIdentityClaims with dynamic property access"
    - "identity_match_value in app_metadata for provider-agnostic user lookup"

key-files:
  created:
    - apps/supabase/supabase/functions/identity-callback/index.ts
  modified:
    - apps/frontend/src/routes/api/candidate/preregister/+server.ts
    - .claude/skills/database/SKILL.md

key-decisions:
  - "PROVIDER_CONFIGS as inline TypeScript object (not env var parsing) for type safety and simplicity"
  - "Default provider type 'signicat' via ?? operator for backward compatibility"
  - "Clean break: findUserByIdentityMatch searches only identity_match_value, not birthdate_id (D-06)"

patterns-established:
  - "Provider config pattern: Record<string, ProviderConfig> with identityMatchProp, firstNameProp, lastNameProp, extractClaims"
  - "IDENTITY_PROVIDER_* env var prefix for all provider-related secrets"

requirements-completed: [EDGE-01, EDGE-02, EDGE-03]

# Metrics
duration: 36min
completed: 2026-03-27
---

# Phase 47 Plan 01: Edge Function Provider Support Summary

**Provider-agnostic identity-callback Edge Function with PROVIDER_CONFIGS mapping Signicat (birthdate) and Idura (sub) claim-based identity matching, full audit metadata in app_metadata**

## Performance

- **Duration:** 36 min
- **Started:** 2026-03-27T11:23:30Z
- **Completed:** 2026-03-27T11:59:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created provider-agnostic identity-callback Edge Function replacing Signicat-specific signicat-callback
- Implemented PROVIDER_CONFIGS with both Signicat (birthdate match) and Idura (sub match) entries
- Generalized claim extraction, user lookup, and audit metadata storage in app_metadata
- Updated frontend caller and database skill documentation to reference identity-callback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create provider-agnostic identity-callback Edge Function** - `8b7da6119` (feat)
2. **Task 2: Update frontend caller and documentation references** - `bd2dcb685` (feat)

## Files Created/Modified
- `apps/supabase/supabase/functions/identity-callback/index.ts` - New provider-agnostic Edge Function with PROVIDER_CONFIGS, generalized claim extraction, identity matching, and audit metadata
- `apps/frontend/src/routes/api/candidate/preregister/+server.ts` - Updated to invoke identity-callback instead of signicat-callback
- `.claude/skills/database/SKILL.md` - Updated Edge Function references from signicat-callback to identity-callback

## Files Deleted
- `apps/supabase/supabase/functions/signicat-callback/index.ts` - Replaced by identity-callback (D-02)

## Decisions Made
- Used inline PROVIDER_CONFIGS TypeScript object rather than parsing provider config from env vars -- type safety, simpler, and all config visible in one place
- Default provider type 'signicat' via nullish coalescing for backward compatibility with existing deployments
- Clean break for user lookup: findUserByIdentityMatch searches only identity_match_value in app_metadata, not the old birthdate_id field (per D-06)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Existing deployments must update Supabase secrets when switching env var names:
- `SIGNICAT_DECRYPTION_JWKS` -> `IDENTITY_PROVIDER_DECRYPTION_JWKS`
- `SIGNICAT_JWKS_URI` -> `IDENTITY_PROVIDER_JWKS_URI`
- `SIGNICAT_CLIENT_ID` -> `IDENTITY_PROVIDER_CLIENT_ID`
- New: `IDENTITY_PROVIDER_TYPE` (set to 'signicat' or 'idura')

## Next Phase Readiness
- Identity callback Edge Function ready for both Signicat and Idura providers
- Phase 48 (backward compatibility and testing) can validate the full auth flow end-to-end

## Self-Check: PASSED

- All created/modified files verified to exist on disk
- signicat-callback directory confirmed deleted
- Both task commits (8b7da6119, bd2dcb685) verified in git log
- No blocking stubs detected (bank-auth.placeholder email is intentional existing logic)

---
*Phase: 47-edge-function-provider-support*
*Completed: 2026-03-27*

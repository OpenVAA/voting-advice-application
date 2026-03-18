---
phase: 10-authentication-and-roles
plan: 05
subsystem: auth
tags: [signicat, oidc, jwe, jwt, jose, edge-function, bank-auth, deno]

# Dependency graph
requires:
  - phase: 10-authentication-and-roles (plans 01-02)
    provides: user_roles table, candidates table with auth_user_id, RLS policies, Custom Access Token Hook
provides:
  - Signicat OIDC bank auth callback Edge Function
  - JWE decryption + JWT verification for Finnish bank ID tokens
  - Self-service candidate pre-registration via bank auth
affects: [frontend-candidate-login, signicat-configuration, candidate-onboarding]

# Tech tracking
tech-stack:
  added: [jose (deno import for Edge Function)]
  patterns: [Edge Function bank auth callback, JWE/JWT dual token handling, birthdate-based user matching]

key-files:
  created:
    - apps/supabase/supabase/functions/signicat-callback/index.ts

key-decisions:
  - "Used paginated listUsers + app_metadata filter for birthdate_id matching (no custom table for identity mapping)"
  - "Placeholder email pattern (userId@bank-auth.placeholder) for magic link generation since user has no email at bank auth time"
  - "Graceful fallback when magic link fails -- returns user/candidate info so frontend can prompt for email first"
  - "Support both JWE (5-part) and plain JWT (3-part) tokens via compact serialization part count detection"

patterns-established:
  - "Edge Function bank auth: decrypt JWE, verify JWT, create user+candidate, generate session"
  - "Token format detection: split('.').length === 5 for JWE vs 3 for JWT"
  - "Admin user lookup by app_metadata field via paginated listUsers iteration"

requirements-completed: [AUTH-08]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 10 Plan 05: Signicat Callback Summary

**Signicat OIDC bank auth Edge Function with JWE decryption via jose, identity claim extraction, auto-provisioning of Supabase auth user + candidate record, and magic link session generation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T14:02:32Z
- **Completed:** 2026-03-13T14:04:26Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created signicat-callback Edge Function handling Signicat OIDC bank auth callback
- JWE decryption using jose compactDecrypt with private JWKS from environment
- JWT verification against Signicat's remote public JWKS endpoint
- Identity claim extraction (given_name, family_name, birthdate) from verified payload
- Auth user lookup by birthdate_id in app_metadata with auto-creation for new users
- Candidate record and role assignment creation for new bank auth users
- Magic link session generation for immediate post-auth login
- Dual token format support (JWE 5-part encrypted and plain JWT 3-part)
- CORS headers and proper HTTP error codes (400/401/405/500)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create signicat-callback Edge Function** - `eb12ba640` (feat)

**Plan metadata:** `98945595c` (docs: complete plan)

## Files Created/Modified
- `apps/supabase/supabase/functions/signicat-callback/index.ts` - Edge Function for Signicat bank auth OIDC callback with JWE/JWT processing, user provisioning, and session creation

## Decisions Made
- Used paginated `listUsers()` + `app_metadata.birthdate_id` filter for finding existing bank auth users. This avoids needing a separate identity mapping table while being correct for the expected user volume.
- Used placeholder email pattern (`${userId}@bank-auth.placeholder`) for magic link generation since the user has no email at bank auth time. Per user decision, candidate is prompted to enter email after session is established.
- Implemented graceful fallback when `generateLink` fails: returns user and candidate info with a message prompting the frontend to handle session establishment via an alternative mechanism (e.g., prompt for email first).
- Detect token format by counting dot-separated parts in the compact serialization (5 = JWE, 3 = JWT) to support both encrypted and plain token configurations without breaking changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The Edge Function uses environment variables (`SIGNICAT_DECRYPTION_JWKS`, `SIGNICAT_JWKS_URI`, `SIGNICAT_CLIENT_ID`, `DEFAULT_PROJECT_ID`) that will be configured as Supabase secrets during deployment.

## Next Phase Readiness
- Signicat bank auth callback ready for frontend integration
- Frontend will need to implement the OIDC redirect flow that sends the id_token to this Edge Function
- Candidate profile completion flow (email entry, password setup) needed after bank auth session
- All Phase 10 plans (01-05) now have implementations; phase authentication foundation complete

## Self-Check: PASSED

- FOUND: apps/supabase/supabase/functions/signicat-callback/index.ts
- FOUND: .planning/phases/10-authentication-and-roles/10-05-SUMMARY.md
- FOUND: commit eb12ba640

---
*Phase: 10-authentication-and-roles*
*Completed: 2026-03-13*

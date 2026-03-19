---
phase: 24-auth-migration
plan: 02
subsystem: auth
tags: [supabase, session, sveltekit, hooks, authcontext, route-guard]

# Dependency graph
requires:
  - phase: 23-supabase-adapter
    provides: Supabase adapter mixin and DataWriter base classes
provides:
  - Session-based route guards in hooks.server.ts using safeGetSession
  - Session-based layout loaders for candidate and admin apps
  - Session-based AuthContext with isAuthenticated (no authToken)
  - Session-based getUserData utility
  - authContext unit tests
affects: [24-auth-migration plan 03 (consumer updates), candidate app, admin app]

# Tech tracking
tech-stack:
  added: []
  patterns: [session-derived-auth-state, empty-authToken-for-supabase-adapter]

key-files:
  created:
    - frontend/src/lib/contexts/auth/authContext.test.ts
  modified:
    - frontend/src/hooks.server.ts
    - frontend/src/app.d.ts
    - frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts
    - frontend/src/routes/[[lang=locale]]/admin/+layout.server.ts
    - frontend/src/lib/contexts/auth/authContext.type.ts
    - frontend/src/lib/contexts/auth/authContext.ts
    - frontend/src/lib/auth/getUserData.ts
    - frontend/src/lib/auth/index.ts

key-decisions:
  - "AuthContext.isAuthenticated derived via `derived(page, (p) => !!p.data.session)` -- single source of truth for auth state"
  - "Empty string authToken passed to DataWriter methods -- Supabase adapter ignores it (cookie-based auth)"
  - "Unified route guard handles both candidate and admin paths in single section 4 of hooks.server.ts"

patterns-established:
  - "Session-derived auth: All client-side auth state derived from page.data.session, never from tokens"
  - "Empty authToken pattern: Pass '' for WithAuth type constraint since Supabase adapter uses cookies"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 24 Plan 02: Session Infrastructure Summary

**Session-based hooks route guard, layout loaders, and AuthContext replacing Strapi JWT token auth with safeGetSession-derived auth state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T06:49:55Z
- **Completed:** 2026-03-19T06:53:55Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- hooks.server.ts route guard rewritten to verify sessions against Supabase Auth server via safeGetSession instead of dual cookie checking
- Both candidate and admin layout loaders pass { session, user } instead of { token }
- AuthContext fully rewritten: isAuthenticated derived from session, authToken removed entirely (clean break per user decision)
- authContext unit tests verify session-based auth state derivation (6 tests passing)
- getUserData simplified to session-based auth (no token parameter)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite hooks.server.ts route guard and layout server loaders** - `67786c394` (feat)
2. **Task 2 RED: Failing tests for session-based AuthContext** - `1c173f388` (test)
3. **Task 2 GREEN: AuthContext and getUserData implementation** - `ea0c21a31` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `frontend/src/hooks.server.ts` - Session-based route guard for candidate and admin, removed AUTH_TOKEN_KEY
- `frontend/src/app.d.ts` - Removed token field from PageData interface
- `frontend/src/routes/[[lang=locale]]/candidate/+layout.server.ts` - Session/user loader via safeGetSession
- `frontend/src/routes/[[lang=locale]]/admin/+layout.server.ts` - Session/user loader via safeGetSession
- `frontend/src/lib/contexts/auth/authContext.type.ts` - Session-based type with isAuthenticated, no authToken
- `frontend/src/lib/contexts/auth/authContext.ts` - Session-based implementation deriving from page.data.session
- `frontend/src/lib/contexts/auth/authContext.test.ts` - Unit tests for session-based auth state derivation
- `frontend/src/lib/auth/getUserData.ts` - Session-based user data fetching
- `frontend/src/lib/auth/index.ts` - Removed authToken re-export

## Decisions Made
- AuthContext.isAuthenticated derived via `derived(page, (p) => !!p.data.session)` -- single source of truth for client-side auth state
- Empty string ('') passed as authToken to DataWriter methods (logout, setPassword, getBasicUserData) since Supabase adapter ignores it -- auth is cookie-based
- Unified candidate/admin route guard in hooks.server.ts section 4 instead of separate blocks
- setPassword public API takes only { password }, passes empty currentPassword internally to satisfy type constraint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Session infrastructure complete; consumers (candidateContext, candidateUserDataStore, adminContext) still reference authToken from AuthContext and need updating in Plan 03
- Plan 03 will update all authToken consumers to use isAuthenticated instead

## Self-Check: PASSED

All 9 files verified present. All 3 commits verified in git log.

---
*Phase: 24-auth-migration*
*Completed: 2026-03-19*

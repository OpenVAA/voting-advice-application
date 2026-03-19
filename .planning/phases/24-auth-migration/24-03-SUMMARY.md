---
phase: 24-auth-migration
plan: 03
subsystem: auth
tags: [supabase, session, adapter, datawriter, authtoken-removal, strapi-cleanup]

# Dependency graph
requires:
  - phase: 24-auth-migration plan 01
    provides: SupabaseDataWriter auth methods (login, logout, requestForgotPasswordEmail, setPassword)
  - phase: 24-auth-migration plan 02
    provides: Session-based hooks, layout loaders, AuthContext with isAuthenticated (no authToken)
provides:
  - All auth route consumers wired to DataWriter adapter
  - All AuthContext consumers updated from authToken to isAuthenticated
  - All protected layouts using session-based auth
  - Admin server pages using serverClient instead of cookie-based token
  - hasAuthHeaders inlined into universalAdapter.ts
  - All Strapi auth files deleted (clean break complete)
affects: [25-data-migration, 26-password-flows, 28-registration]

# Tech tracking
tech-stack:
  added: []
  patterns: [adapter-based-login-pattern, session-based-protected-layout-pattern]

key-files:
  created: []
  modified:
    - frontend/src/routes/[[lang=locale]]/candidate/login/+page.server.ts
    - frontend/src/routes/[[lang=locale]]/admin/login/+page.server.ts
    - frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte
    - frontend/src/lib/contexts/candidate/candidateContext.ts
    - frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
    - frontend/src/lib/contexts/admin/adminContext.ts
    - frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.ts
    - frontend/src/routes/[[lang=locale]]/admin/(protected)/+layout.ts
    - frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+page.server.ts
    - frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+page.server.ts
    - frontend/src/lib/api/base/universalAdapter.ts

key-decisions:
  - "Login form actions use DataWriter.login() with role verification via getBasicUserData, not direct Supabase calls"
  - "Forgot-password uses AuthContext.requestForgotPasswordEmail instead of direct Supabase browser client"
  - "Password-reset uses recovery session from auth callback + setPassword, no code query param"
  - "candidateUserDataStore takes isAuthenticated: Readable<boolean> instead of authToken: Readable<string | undefined>"
  - "Admin server pages use serverClient: locals.supabase for session-based auth instead of AUTH_TOKEN_KEY cookie"
  - "hasAuthHeaders inlined into universalAdapter.ts as local function per user decision to delete authHeaders.ts"

patterns-established:
  - "Adapter-based login: Form actions use DataWriter.login() + role check, not direct auth provider calls"
  - "Empty authToken pattern: All WithAuth params pass '' since Supabase adapter ignores it (cookie-based auth)"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 24 Plan 03: Auth Route Consumer Migration & Strapi Cleanup Summary

**All auth route consumers wired to DataWriter adapter, authToken replaced with isAuthenticated in all three consumer files, protected layouts session-based, and all Strapi auth files deleted for clean break**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T06:56:57Z
- **Completed:** 2026-03-19T07:03:48Z
- **Tasks:** 2 (+ 1 checkpoint pending)
- **Files modified:** 17 (12 modified, 5 deleted)

## Accomplishments
- All login form actions (candidate and admin) refactored to use DataWriter adapter with role verification
- Forgot-password page uses AuthContext.requestForgotPasswordEmail instead of direct Supabase browser client import
- Password-reset page rewritten for recovery session flow (setPassword, no code query param)
- All three AuthContext consumers (candidateContext, candidateUserDataStore, adminContext) updated from authToken to isAuthenticated
- All protected layouts use session-based auth checks instead of token-based
- Admin server pages use serverClient for session-based auth instead of AUTH_TOKEN_KEY cookie
- hasAuthHeaders inlined into universalAdapter.ts; authHeaders.ts and test deleted
- All Strapi auth files deleted: authToken.ts, api/auth/login, api/auth/logout
- Zero AUTH_TOKEN_KEY references remain outside Strapi adapter directory

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor login form actions and forgot/reset password pages** - `c7af4d011` (feat)
2. **Task 2: Update authToken consumers, protected layouts, admin pages, inline hasAuthHeaders, and delete Strapi auth files** - `149e31a58` (feat)
3. **Task 3: Verify auth migration end-to-end** - checkpoint:human-verify (pending)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `frontend/src/routes/[[lang=locale]]/candidate/login/+page.server.ts` - DataWriter-based login with role verification
- `frontend/src/routes/[[lang=locale]]/admin/login/+page.server.ts` - DataWriter-based admin login with role verification
- `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` - AuthContext.requestForgotPasswordEmail
- `frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte` - Recovery session + setPassword flow
- `frontend/src/lib/contexts/candidate/candidateContext.ts` - isAuthenticated instead of authToken
- `frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` - isAuthenticated: Readable<boolean> parameter
- `frontend/src/lib/contexts/admin/adminContext.ts` - isAuthenticated with auth guard in injectAuthToken
- `frontend/src/routes/[[lang=locale]]/candidate/(protected)/+layout.ts` - Session-based auth check
- `frontend/src/routes/[[lang=locale]]/admin/(protected)/+layout.ts` - Removed parent().token access
- `frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+page.server.ts` - serverClient auth
- `frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+page.server.ts` - serverClient auth
- `frontend/src/lib/api/base/universalAdapter.ts` - hasAuthHeaders inlined, import removed

**Deleted files:**
- `frontend/src/lib/auth/authToken.ts` - AUTH_TOKEN_KEY constant (no longer needed)
- `frontend/src/lib/api/utils/authHeaders.ts` - Inlined into universalAdapter.ts
- `frontend/src/lib/api/utils/authHeaders.test.ts` - Source file deleted
- `frontend/src/routes/[[lang=locale]]/api/auth/login/+server.ts` - Strapi login API route
- `frontend/src/routes/[[lang=locale]]/api/auth/logout/+server.ts` - Strapi logout API route

## Decisions Made
- Login form actions use DataWriter.login() with role verification via getBasicUserData, matching both Strapi and Supabase adapters
- Forgot-password uses AuthContext method instead of direct Supabase browser client, keeping the adapter abstraction consistent
- Password-reset page no longer uses code query param; recovery session is established by auth callback route (Plan 01)
- candidateUserDataStore parameter changed from authToken: Readable<string|undefined> to isAuthenticated: Readable<boolean>
- Admin server pages use serverClient: locals.supabase for session-based auth instead of AUTH_TOKEN_KEY cookie
- hasAuthHeaders inlined into universalAdapter.ts as local function (only usage site) per user decision to delete authHeaders.ts
- Removed unused `page` import from forgot-password page after removing Supabase browser client dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `page` import from forgot-password page**
- **Found during:** Task 1 (forgot-password refactor)
- **Issue:** After removing `createSupabaseBrowserClient` and `$page.params.lang`, the `page` import from `$app/stores` became unused
- **Fix:** Removed the unused import to prevent linting errors
- **Files modified:** `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte`
- **Committed in:** c7af4d011 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor cleanup of unused import. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete auth migration: all routes use adapter, all consumers use session-based auth
- Ready for end-to-end verification (Task 3 checkpoint pending)
- Phase 24 fully complete after human verification passes
- Strapi auth code fully cleaned up; no AUTH_TOKEN_KEY references remain

## Self-Check: PASSED

All 12 modified files verified present. All 5 deleted files confirmed absent. Both commit hashes (c7af4d011, 149e31a58) confirmed in git log.

---
*Phase: 24-auth-migration*
*Completed: 2026-03-19*

---
phase: 10-authentication-and-roles
plan: 04
subsystem: auth
tags: [supabase, edge-function, deno, invite, pre-registration, rbac]

# Dependency graph
requires:
  - phase: 10-01
    provides: user_roles table, auth_user_id columns, Custom Access Token Hook for JWT claims
  - phase: 10-02
    provides: RLS policies allowing service_role to manage candidates and user_roles
provides:
  - invite-candidate Edge Function for admin-initiated candidate pre-registration
  - POST /functions/v1/invite-candidate endpoint with JWT-based admin verification
affects: [10-05-signicat-oidc, frontend-candidate-registration]

# Tech tracking
tech-stack:
  added: []
  patterns: [Edge Function with service_role admin client, JWT claims-based role verification, candidate invite with rollback]

key-files:
  created:
    - apps/supabase/supabase/functions/invite-candidate/index.ts
  modified: []

key-decisions:
  - "Dual token verification: decode JWT for role claims + getUser() for server-side validation"
  - "Rollback strategy: delete candidate record if invite fails, log-only if role assignment fails (invite already sent)"
  - "account_admin treated as project-scoped (can invite to any project in account) without explicit scope_id check"

patterns-established:
  - "Edge Function auth pattern: verify caller via getUser() then decode JWT for role claims"
  - "Graceful degradation: critical steps fail hard (candidate create, invite), non-critical steps log and continue (role assignment, auth_user_id link)"

requirements-completed: [AUTH-03]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 10 Plan 04: Invite-Candidate Edge Function Summary

**Deno Edge Function for admin-initiated candidate pre-registration using inviteUserByEmail with JWT role verification and candidate record creation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-13T14:01:57Z
- **Completed:** 2026-03-13T14:03:23Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Edge Function at `/functions/v1/invite-candidate` handles the full pre-registration flow
- Admin role verification via JWT claims (project_admin, account_admin, super_admin)
- Atomic flow: create candidate record, send invite email, create role assignment, link auth user
- Rollback on failure: candidate record deleted if invite fails

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invite-candidate Edge Function** - `05a5742ee` (feat)

## Files Created/Modified
- `apps/supabase/supabase/functions/invite-candidate/index.ts` - Edge Function handling POST requests for admin-initiated candidate invites with full RBAC verification, candidate DB record creation, Supabase inviteUserByEmail call, user_roles assignment, and auth_user_id linking

## Decisions Made
- Dual token verification: first call getUser() to validate the token server-side (prevents spoofed JWTs), then decode the JWT payload to read user_roles claims for authorization
- Rollback strategy: if inviteUserByEmail fails after candidate creation, the candidate record is deleted; if role assignment or auth_user_id linking fails after a successful invite, the error is logged but the request succeeds (invite email already sent to the candidate)
- account_admin role grants project access without explicit project scope check (account admins can manage any project in their account -- scope_id check deferred to a future enhancement if needed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Edge Function ready for deployment alongside Supabase instance
- Plan 05 (Signicat OIDC) can proceed -- it will create a separate Edge Function following the same pattern
- Frontend candidate registration flow can call this endpoint once admin UI is built

## Self-Check: PASSED

- FOUND: apps/supabase/supabase/functions/invite-candidate/index.ts
- FOUND: commit 05a5742ee

---
*Phase: 10-authentication-and-roles*
*Completed: 2026-03-13*

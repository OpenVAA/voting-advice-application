---
phase: 10-authentication-and-roles
plan: 01
subsystem: database
tags: [postgres, supabase, auth, jwt, rls, user-roles, security-definer]

# Dependency graph
requires:
  - phase: 09-schema-and-data-model
    provides: All content tables (elections, candidates, organizations, etc.) and deny-all RLS placeholders
provides:
  - user_roles table with user_role_type enum for role-based access control
  - auth_user_id FK columns on candidates and organizations for auth user linking
  - published boolean columns on 10 voter-facing tables for visibility control
  - Custom Access Token Hook injecting user_roles into JWT claims
  - has_role(), can_access_project(), is_candidate_self() RLS helper functions
  - Test auth users and role assignments in seed data
affects: [10-authentication-and-roles, rls-policies, sveltekit-auth, edge-functions]

# Tech tracking
tech-stack:
  added: []
  patterns: [Custom Access Token Hook for JWT claim injection, SECURITY DEFINER with empty search_path for RLS helpers, supabase_auth_admin grants to prevent circular RLS, partial indexes on published for anon RLS performance]

key-files:
  created:
    - apps/supabase/supabase/schema/011-auth-tables.sql
    - apps/supabase/supabase/schema/012-auth-hooks.sql
  modified:
    - apps/supabase/supabase/schema/003-entities.sql
    - apps/supabase/supabase/schema/009-indexes.sql
    - apps/supabase/supabase/config.toml
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/column-map.ts

key-decisions:
  - "Published indexes placed in 011-auth-tables.sql (not 009-indexes.sql) to ensure columns exist before indexing in schema concatenation order"
  - "SECURITY DEFINER with SET search_path = '' on all RLS helper functions to prevent search_path injection attacks"
  - "supabase_auth_admin gets full GRANT on user_roles; authenticated/anon/public get REVOKE ALL to prevent circular RLS"
  - "Test seed uses fixed UUIDs in 00000000-0000-0000-0000-00000000001X range with ON CONFLICT DO NOTHING for idempotent seeding"

patterns-established:
  - "Auth hook pattern: custom_access_token_hook reads user_roles -> injects into JWT claims -> RLS helpers read from auth.jwt()"
  - "RLS helper pattern: SECURITY DEFINER + SET search_path = '' + reads (SELECT auth.jwt()) for single evaluation per query"
  - "Migration regeneration: concatenate schema/*.sql files in order to produce migrations/00001_initial_schema.sql"

requirements-completed: [AUTH-04, AUTH-06, MTNT-05, MTNT-06]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 10 Plan 1: Auth Foundation Summary

**user_roles table with Custom Access Token Hook injecting roles into JWT, SECURITY DEFINER RLS helpers (has_role, can_access_project, is_candidate_self), auth_user_id on entities, and published flags on 10 tables**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T13:38:33Z
- **Completed:** 2026-03-13T13:46:35Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- user_roles table with user_role_type enum (candidate, party, project_admin, account_admin, super_admin), unique constraint, and RLS preventing circular access
- Custom Access Token Hook that reads user_roles and injects them into JWT claims on every token issue/refresh
- Three SECURITY DEFINER RLS helper functions: has_role() for role checks, can_access_project() for project-level access, is_candidate_self() for candidate ownership
- auth_user_id columns on candidates and organizations tables for linking to auth.users
- Published boolean columns on 10 voter-facing tables with partial indexes for efficient anon access
- Test seed data with admin and candidate users plus role assignments

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth tables, columns, and published flags** - `5e984b507` (feat)
2. **Task 2: Create Custom Access Token Hook and RLS helper functions** - `7ce980e86` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `apps/supabase/supabase/schema/011-auth-tables.sql` - user_roles table, user_role_type enum, published columns, RLS policies for auth admin/service role
- `apps/supabase/supabase/schema/012-auth-hooks.sql` - Custom Access Token Hook, has_role(), can_access_project(), is_candidate_self() functions
- `apps/supabase/supabase/schema/003-entities.sql` - Added auth_user_id column to candidates and organizations
- `apps/supabase/supabase/schema/009-indexes.sql` - Added auth_user_id indexes
- `apps/supabase/supabase/config.toml` - Enabled custom_access_token hook
- `apps/supabase/supabase/seed.sql` - Test admin user, candidate user, candidate record, and role assignments
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - Regenerated from all schema files
- `packages/supabase-types/src/column-map.ts` - Added authUserId and published mappings

## Decisions Made
- Published indexes placed in 011-auth-tables.sql rather than 009-indexes.sql because the columns are added via ALTER TABLE in 011, which runs after 009 in concatenation order
- SECURITY DEFINER with empty search_path on all RLS helper functions for security hardening
- supabase_auth_admin gets full access to user_roles while authenticated/anon/public are revoked to prevent circular RLS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Published indexes moved from 009-indexes.sql to 011-auth-tables.sql**
- **Found during:** Task 1 (verification)
- **Issue:** Plan specified published indexes in 009-indexes.sql, but published columns are added via ALTER TABLE in 011-auth-tables.sql which runs after 009 in the concatenated migration
- **Fix:** Moved partial indexes on published to 011-auth-tables.sql, kept auth_user_id indexes in 009 (those columns are defined in 003)
- **Files modified:** apps/supabase/supabase/schema/009-indexes.sql, apps/supabase/supabase/schema/011-auth-tables.sql
- **Verification:** supabase db reset succeeds, all indexes created
- **Committed in:** 5e984b507 (Task 1 commit)

**2. [Rule 3 - Blocking] Migration regeneration from schema files**
- **Found during:** Task 1 (verification)
- **Issue:** Plan did not mention updating migrations/00001_initial_schema.sql which is the actual file applied by supabase db reset
- **Fix:** Regenerated migration by concatenating all schema/*.sql files in order
- **Files modified:** apps/supabase/supabase/migrations/00001_initial_schema.sql
- **Verification:** supabase db reset succeeds end-to-end
- **Committed in:** 5e984b507 and 7ce980e86 (both task commits)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for the migration to work. Schema file ordering and migration regeneration are inherent to the declarative schema pattern. No scope creep.

## Issues Encountered
- Transient 502 error from Supabase container restart after db reset -- this is a known non-blocking issue during container restarts and does not affect schema correctness

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Auth foundation is in place for Plan 02 (RLS policies) to replace deny-all placeholders with real role-based policies
- JWT claims structure established: `user_roles` array with `{role, scope_type, scope_id}` objects
- RLS helper functions ready to be referenced in policy definitions
- Test seed data available for verifying RLS policies work correctly

---
*Phase: 10-authentication-and-roles*
*Completed: 2026-03-13*

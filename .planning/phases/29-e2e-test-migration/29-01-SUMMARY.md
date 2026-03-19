---
phase: 29-e2e-test-migration
plan: 01
subsystem: testing
tags: [supabase, supabase-js, service-role, rpc, jsonb, deep-merge, admin-auth-api, e2e]

# Dependency graph
requires:
  - phase: 22-supabase-schema
    provides: "bulk_import/bulk_delete RPCs, user_roles table, app_settings table"
  - phase: 28-admin-app-integration
    provides: "invite-candidate and send-email Edge Functions"
provides:
  - "SupabaseAdminClient class with all methods replacing StrapiAdminClient"
  - "merge_jsonb_column RPC for deep-merging JSONB columns"
  - "@supabase/supabase-js in root devDependencies"
affects: [29-02, 29-03, 29-04]

# Tech tracking
tech-stack:
  added: ["@supabase/supabase-js (root devDependency)"]
  patterns: ["Stateless service_role admin client (no login/dispose lifecycle)", "Deep JSONB merge via recursive SQL function"]

key-files:
  created:
    - "tests/tests/utils/supabaseAdminClient.ts"
    - "apps/supabase/supabase/schema/020-test-helpers.sql"
  modified:
    - "package.json"
    - "yarn.lock"

key-decisions:
  - "user_roles table has no project_id column; forceRegister uses scope_type='candidate' + scope_id=candidate.id"
  - "sendEmail uses auth.admin.generateLink for candidates with existing auth users; throws for candidates without auth_user_id"
  - "sendForgotPassword uses auth.resetPasswordForEmail (sends actual email via Inbucket) instead of admin.generateLink"
  - "findData adds documentId alias (= id) to each result row for StrapiAdminClient backward compatibility"
  - "linkJoinTables uses upsert with onConflict for idempotent join table population"

patterns-established:
  - "SupabaseAdminClient: stateless wrapper around @supabase/supabase-js with service_role key"
  - "COLLECTION_MAP and FIELD_MAP for Strapi-to-Supabase name translation during migration"
  - "merge_jsonb_column: generic deep-merge RPC usable for any table's JSONB column"

requirements-completed: [TEST-01, TEST-02, TEST-03]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 29 Plan 01: SupabaseAdminClient Summary

**Stateless SupabaseAdminClient with 14 async methods wrapping @supabase/supabase-js service_role, plus jsonb_recursive_merge RPC for deep-merging app_settings**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T20:34:48Z
- **Completed:** 2026-03-19T20:40:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created merge_jsonb_column and jsonb_recursive_merge RPCs for generic deep JSONB merging
- Built SupabaseAdminClient class with 14 async methods covering bulk data, auth, settings, answers, and join tables
- Installed @supabase/supabase-js as root devDependency for E2E test infrastructure
- Eliminated Strapi "Pitfall 2" (full component replace) via deep-merge updateAppSettings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create merge_jsonb_column RPC and install @supabase/supabase-js** - `9705dc381` (feat)
2. **Task 2: Create SupabaseAdminClient with all methods** - `9577b49f5` (feat)

## Files Created/Modified
- `apps/supabase/supabase/schema/020-test-helpers.sql` - jsonb_recursive_merge helper and merge_jsonb_column RPC with SECURITY INVOKER
- `tests/tests/utils/supabaseAdminClient.ts` - Full SupabaseAdminClient: bulkImport, bulkDelete, importAnswers, linkJoinTables, updateAppSettings, findData, query, update, setPassword, forceRegister, unregisterCandidate, sendEmail, sendForgotPassword, deleteAllTestUsers
- `package.json` - Added @supabase/supabase-js to root devDependencies
- `yarn.lock` - Updated with @supabase/supabase-js and transitive deps

## Decisions Made
- **user_roles has no project_id:** The plan's interface section incorrectly showed project_id on user_roles. Actual schema uses scope_type + scope_id. forceRegister adapted accordingly (Rule 1 auto-fix).
- **sendEmail approach:** For candidates with existing auth users, uses auth.admin.generateLink (magiclink type). For candidates without auth_user_id, throws descriptive error directing caller to forceRegister first.
- **sendForgotPassword approach:** Uses auth.resetPasswordForEmail (not admin.generateLink) because it actually sends the email via Inbucket, which is what E2E tests need to extract the reset link from.
- **findData backward compatibility:** Adds documentId alias pointing to Supabase id on each result row, so existing test code referencing documentId works during migration.
- **Idempotent join table linking:** linkJoinTables uses upsert with onConflict to safely re-run without duplicate key errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected user_roles insert in forceRegister (no project_id column)**
- **Found during:** Task 2 (SupabaseAdminClient implementation)
- **Issue:** Plan interface section stated user_roles has project_id column, but actual schema only has user_id, role, scope_type, scope_id
- **Fix:** Removed project_id from user_roles insert; scope_type='candidate' + scope_id=candidate.id is the correct pattern (matching seed.sql)
- **Files modified:** tests/tests/utils/supabaseAdminClient.ts
- **Verification:** Compared with seed.sql role assignments pattern
- **Committed in:** 9577b49f5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in plan interface)
**Impact on plan:** Essential fix for correct user_role creation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SupabaseAdminClient ready for all 17 consumer files to import
- merge_jsonb_column RPC ready for updateAppSettings deep merge
- Plan 29-02 (dataset conversion) can proceed: bulkImport, importAnswers, linkJoinTables methods available
- Plan 29-03 (consumer migration) can proceed: all StrapiAdminClient replacement methods available
- Plan 29-04 (email helper rewrite) can proceed: Inbucket integration pattern established

---
*Phase: 29-e2e-test-migration*
*Completed: 2026-03-19*

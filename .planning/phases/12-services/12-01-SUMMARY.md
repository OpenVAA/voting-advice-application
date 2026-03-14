---
phase: 12-services
plan: 01
subsystem: database
tags: [supabase-storage, rls, pg_net, storage-cleanup, storedimage, triggers]

# Dependency graph
requires:
  - phase: 10-auth
    provides: RLS helper functions (can_access_project, has_role), published columns, user_roles
  - phase: 09-schema
    provides: Entity tables with image jsonb columns, validate_answer_value function
provides:
  - Storage buckets (public-assets, private-assets) with RLS policies
  - StoredImage JSONB validation for image-type question answers
  - Automatic storage file cleanup on entity deletion and image column update
  - storage_config table for pg_net trigger configuration
affects: [frontend-adapter, admin-app, candidate-app]

# Tech tracking
tech-stack:
  added: [pg_net]
  patterns: [storage-rls-with-path-parsing, async-cleanup-triggers, storage-config-table]

key-files:
  created:
    - apps/supabase/supabase/schema/014-storage.sql
  modified:
    - apps/supabase/supabase/config.toml
    - apps/supabase/supabase/schema/000-functions.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "storage_config table instead of PostgreSQL custom GUC parameters (postgres user lacks superuser privileges in Supabase local)"
  - "storage.objects.name qualified column reference in RLS policies to avoid ambiguity with entity table name columns (jsonb)"
  - "net.http_post for batch delete via Storage API prefixes endpoint (not net.http_delete for individual files)"

patterns-established:
  - "Storage path convention: {project_id}/{entity_type}/{entity_id}/filename.ext"
  - "Published-entity gating via is_storage_entity_published() helper with dynamic SQL"
  - "Cleanup triggers using delete_storage_object() with pg_net async HTTP"
  - "storage_config table for trigger configuration (portable across environments)"

requirements-completed: [SRVC-01, SRVC-02, SRVC-03]

# Metrics
duration: 12min
completed: 2026-03-14
---

# Phase 12 Plan 01: Storage & Services Foundation Summary

**Storage buckets with 15 RLS policies, StoredImage validation, and pg_net cleanup triggers across 11 entity tables**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-14T18:11:49Z
- **Completed:** 2026-03-14T18:24:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Configured public-assets (public) and private-assets (private) storage buckets with 500MiB file size limits
- Created 15 RLS policies on storage.objects enforcing: anon read for published entities only, candidate upload to own folder, admin project-wide access
- Implemented StoredImage JSONB validation with path (required), pathDark, alt, width, height, focalPoint (all optional with type checks)
- Added cleanup triggers on all 11 entity tables for both entity deletion (AFTER DELETE) and image column update (BEFORE UPDATE)
- Configured pg_net extension with storage_config table for async Storage API calls from triggers
- Verified Inbucket email testing UI accessible at localhost:54324 (SRVC-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure storage buckets and create RLS policies** - `a678a66b2` (feat)
2. **Task 2: Update StoredImage validation and seed data for storage config** - `caca032cb` (feat)

## Files Created/Modified
- `apps/supabase/supabase/schema/014-storage.sql` - Storage RLS policies, cleanup triggers, helper functions, storage_config table
- `apps/supabase/supabase/config.toml` - public-assets and private-assets bucket definitions
- `apps/supabase/supabase/schema/000-functions.sql` - StoredImage validation in validate_answer_value()
- `apps/supabase/supabase/seed.sql` - storage_config seed data (supabase_url, service_role_key)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - Regenerated migration with all schema changes

## Decisions Made
- Used `storage_config` table instead of PostgreSQL custom GUC parameters (`app.supabase_url`, `app.service_role_key`) because the `postgres` user in Supabase local dev lacks superuser privileges required for `ALTER DATABASE SET` and `set_config` on custom parameters
- Qualified column references as `storage.objects.name` in all RLS policies to avoid ambiguity with entity table `name` columns (jsonb type) inside EXISTS subqueries -- without qualification, PostgreSQL resolves `name` to the inner scope's `candidates.name` (jsonb), causing `storage.foldername(jsonb) does not exist` errors
- Used `net.http_post` to the Storage API batch delete endpoint with `prefixes` array body, rather than `net.http_delete` for individual files -- enables directory-level cleanup on entity deletion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed storage.foldername(jsonb) type mismatch in RLS policies**
- **Found during:** Task 1 (Storage RLS policies)
- **Issue:** Unqualified `name` column in EXISTS subqueries resolved to `candidates.name` (jsonb) instead of `storage.objects.name` (text), causing `storage.foldername(jsonb) does not exist`
- **Fix:** Qualified all column references as `storage.objects.name` in RLS policies
- **Files modified:** apps/supabase/supabase/schema/014-storage.sql
- **Verification:** `supabase db reset` succeeds, all 15 policies created
- **Committed in:** a678a66b2

**2. [Rule 1 - Bug] Fixed extensions.http_post to net.http_post function reference**
- **Found during:** Task 1 (delete_storage_object function)
- **Issue:** Initially used `extensions.http_post()` but pg_net functions are in the `net` schema, not `extensions`
- **Fix:** Changed to `net.http_post()`
- **Files modified:** apps/supabase/supabase/schema/014-storage.sql
- **Verification:** Function created successfully
- **Committed in:** a678a66b2

**3. [Rule 3 - Blocking] Replaced PostgreSQL custom GUC settings with storage_config table**
- **Found during:** Task 2 (Seed data for storage config)
- **Issue:** `ALTER DATABASE postgres SET app.supabase_url` fails with `permission denied to set parameter` because `postgres` user is not a superuser in Supabase local dev
- **Fix:** Created `storage_config` table with key/value pairs, seeded in seed.sql, updated `delete_storage_object()` to query the table
- **Files modified:** apps/supabase/supabase/schema/014-storage.sql, apps/supabase/supabase/seed.sql
- **Verification:** `supabase db reset` succeeds, storage_config table populated
- **Committed in:** caca032cb

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes were necessary for correctness. The storage_config table approach is actually more portable than GUC parameters. No scope creep.

## Issues Encountered
- Database connection refused during first `db reset` attempt (transient Docker container restart timing) -- resolved on retry
- Pre-existing schema files 015-external-id.sql and 016-bulk-operations.sql in working tree needed to be included in migration concatenation to avoid breaking existing state

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Storage buckets and RLS policies ready for frontend adapter to call Supabase Storage SDK
- StoredImage validation active -- image-type question answers will be validated on write
- Cleanup triggers in place -- entity deletions and image updates automatically clean up storage files
- Inbucket captures all dev emails at http://127.0.0.1:54324

## Self-Check: PASSED

- All 5 created/modified files verified to exist
- Both task commits (a678a66b2, caca032cb) verified in git history
- supabase db reset succeeds with no errors
- 15 storage RLS policies confirmed on storage.objects
- StoredImage validation tested (valid + invalid cases)
- Inbucket accessible at http://127.0.0.1:54324

---
*Phase: 12-services*
*Completed: 2026-03-14*

---
phase: 12-services
plan: 02
subsystem: database
tags: [postgres, plpgsql, rpc, external-id, bulk-import, bulk-delete, upsert, dynamic-sql]

# Dependency graph
requires:
  - phase: 09-schema
    provides: content table definitions (elections, candidates, nominations, etc.)
  - phase: 10-authentication-and-roles
    provides: RLS policies with can_access_project() helper, SECURITY INVOKER pattern
provides:
  - external_id columns on all 12 content tables with composite unique indexes
  - immutability trigger preventing external_id changes once set
  - bulk_import(jsonb) RPC for collection-keyed upsert with external_id relationship resolution
  - bulk_delete(jsonb) RPC with prefix, UUID, and external_id deletion modes
  - resolve_external_ref() helper for external_id to UUID lookup
affects: [frontend-adapter, admin-tools, data-import]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamic-sql-upsert, external-id-based-relationship-resolution, dependency-ordered-processing]

key-files:
  created:
    - apps/supabase/supabase/schema/015-external-id.sql
    - apps/supabase/supabase/schema/016-bulk-operations.sql
  modified:
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "external_id immutability enforced via BEFORE UPDATE trigger (NULL to value allowed, value to different value blocked)"
  - "Relationship resolution via dynamic SQL helper resolve_external_ref() supporting both external_id objects and direct UUIDs"
  - "Collection processing order hardcoded in dependency-safe sequence to allow same-batch cross-references"
  - "bulk_delete processes in reverse dependency order to avoid FK violations"

patterns-established:
  - "External ID pattern: nullable text column with composite unique index (project_id, external_id) WHERE NOT NULL"
  - "Dynamic upsert pattern: _bulk_upsert_record() builds INSERT ON CONFLICT DO UPDATE via format() with per-table relationship mappings"
  - "xmax = 0 detection: distinguishes INSERT from UPDATE in ON CONFLICT upserts"

requirements-completed: [SRVC-04, SRVC-05]

# Metrics
duration: 7min
completed: 2026-03-14
---

# Phase 12 Plan 02: External ID and Bulk Operations Summary

**external_id columns on 12 content tables with immutability trigger, plus bulk_import/bulk_delete RPC functions using dynamic SQL upsert with external_id relationship resolution**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-14T18:12:06Z
- **Completed:** 2026-03-14T18:19:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added external_id columns with composite unique indexes to all 12 content tables for project-scoped external identifier support
- Created bulk_import() RPC that processes collection-keyed JSON in dependency order, resolves external_id relationship references to UUIDs, and performs upserts with insert/update tracking
- Created bulk_delete() RPC supporting three deletion modes (prefix-based, UUID list, external_id list) processed in reverse dependency order to avoid FK violations
- Both RPC functions use SECURITY INVOKER to enforce admin RLS policies on the caller

## Task Commits

Each task was committed atomically:

1. **Task 1: Add external_id columns and immutability trigger** - `6f467481e` (feat)
2. **Task 2: Create bulk_import and bulk_delete RPC functions** - `47aa91129` (feat)

## Files Created/Modified
- `apps/supabase/supabase/schema/015-external-id.sql` - external_id columns, composite unique indexes, and immutability trigger for all 12 content tables
- `apps/supabase/supabase/schema/016-bulk-operations.sql` - resolve_external_ref(), _bulk_upsert_record(), bulk_import(), and bulk_delete() RPC functions with GRANT statements
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - regenerated migration with new schema files concatenated

## Decisions Made
- external_id immutability is enforced at the trigger level (BEFORE UPDATE) rather than at the column constraint level, allowing NULL-to-value assignment while blocking value-to-different-value changes
- Used a single shared trigger function `enforce_external_id_immutability()` across all 12 tables rather than per-table functions
- Relationship mappings in `_bulk_upsert_record()` are defined as JSONB literals per table (CASE statement) rather than a separate lookup table, keeping everything self-contained in one function
- bulk_import requires project_id in each item (not a top-level parameter) to support mixed-project imports and proper RLS enforcement
- bulk_delete uses a top-level project_id (single project per delete call) for simpler API and safer operation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- external_id infrastructure ready for use by frontend data adapters and admin tooling
- bulk_import/bulk_delete functions callable via PostgREST RPC endpoints
- Plan 12-03 (transactional email) can proceed independently

## Self-Check: PASSED

All artifacts verified:
- 015-external-id.sql: FOUND (130 lines)
- 016-bulk-operations.sql: FOUND (434 lines)
- Commit 6f467481e: FOUND
- Commit 47aa91129: FOUND
- Min line requirements: PASSED

---
*Phase: 12-services*
*Completed: 2026-03-14*

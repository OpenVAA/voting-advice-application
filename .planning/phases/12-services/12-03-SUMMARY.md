---
phase: 12-services
plan: 03
subsystem: database
tags: [edge-function, email, smtp, nodemailer, plpgsql, rpc, template-resolution, inbucket, deno]

# Dependency graph
requires:
  - phase: 12-services/01
    provides: Storage buckets with RLS, cleanup triggers, StoredImage validation
  - phase: 12-services/02
    provides: external_id columns, bulk_import/bulk_delete RPC functions
  - phase: 10-authentication-and-roles
    provides: user_roles table, Custom Access Token Hook, RLS helpers (has_role, can_access_project)
  - phase: 09-schema
    provides: Entity tables (candidates, organizations), nominations, elections, constituencies, get_localized()
provides:
  - resolve_email_variables() RPC function for server-side template variable resolution
  - send-email Edge Function with multilingual template support and dry-run preview
  - Regenerated migration from all 18 schema files (000-017) in dependency order
  - Updated TypeScript types with external_id columns, all RPC function types, and storage types
affects: [frontend-adapter, admin-app, candidate-notifications]

# Tech tracking
tech-stack:
  added: [nodemailer]
  patterns: [edge-function-smtp-transport, rpc-template-variable-resolution, user-role-entity-context-resolution]

key-files:
  created:
    - apps/supabase/supabase/schema/017-email-helpers.sql
    - apps/supabase/supabase/functions/send-email/index.ts
  modified:
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts

key-decisions:
  - "resolve_email_variables uses SECURITY DEFINER to read auth.users (not accessible to regular authenticated users)"
  - "Edge Function admin check accepts any admin role (project_admin, account_admin, super_admin) without project scope check"
  - "SMTP transport defaults to Inbucket Docker hostname (inbucket:2500) with configurable env vars for production"
  - "Template variable replacement uses simple regex; unresolved variables left as-is (not stripped)"

patterns-established:
  - "Email Edge Function pattern: parse request, verify admin JWT, call RPC for variable resolution, render templates per locale, send or dry-run"
  - "RPC template resolution: user_roles -> entity tables -> relationship joins with get_localized() for locale-aware fields"
  - "SMTP configuration: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS env vars with sensible local dev defaults"

requirements-completed: [SRVC-06]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 12 Plan 03: Email Service & Type Finalization Summary

**send-email Edge Function with multilingual template resolution via resolve_email_variables RPC, plus regenerated migration and TypeScript types for all Phase 12 schema work**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T18:33:51Z
- **Completed:** 2026-03-14T18:38:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created resolve_email_variables() RPC function that resolves template variable paths (candidate.first_name, organization.name, nomination.constituency.name, nomination.election.name) by joining user_roles to entity tables with locale-aware field resolution
- Created send-email Edge Function with full multilingual template support: validates admin role, resolves variables via RPC, selects correct locale per recipient, and sends via configurable SMTP or returns dry-run preview
- Regenerated migration from all 18 schema files (000-017) in correct dependency order
- Regenerated TypeScript types with external_id columns, bulk_import/bulk_delete/resolve_email_variables RPC function types, and storage bucket types

## Task Commits

Each task was committed atomically:

1. **Task 1: Create email template resolution RPC and send-email Edge Function** - `10536f7c5` (feat)
2. **Task 2: Regenerate migration and TypeScript types** - `da3bc3123` (chore)

## Files Created/Modified
- `apps/supabase/supabase/schema/017-email-helpers.sql` - resolve_email_variables() RPC with SECURITY DEFINER for auth.users access
- `apps/supabase/supabase/functions/send-email/index.ts` - Transactional email Edge Function with CORS, admin auth, multilingual template rendering, SMTP sending, and dry-run support
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - Regenerated from all 18 schema files in dependency order
- `packages/supabase-types/src/database.ts` - Regenerated with all Phase 12 additions (1492 lines)

## Decisions Made
- resolve_email_variables() uses SECURITY DEFINER with SET search_path = '' because it needs to read auth.users which is not accessible to regular authenticated roles
- The Edge Function admin check accepts project_admin, account_admin, or super_admin without requiring a specific project scope -- this is appropriate since the email function is a platform-level tool, not project-scoped
- SMTP transport configuration defaults to Docker internal hostname 'inbucket' on port 2500 for local development, with SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS env vars for production override
- Unresolved template variables (e.g., {{unknown.path}}) are left as-is in the rendered output rather than being stripped or raising an error

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Transient 502 error on container restart after `supabase db reset` (same timing issue documented in 12-01-SUMMARY.md) -- database functions verified working after restart completes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 12 (Services) work is complete: storage buckets with RLS, StoredImage validation, cleanup triggers, external_id with bulk operations, and email service
- send-email Edge Function ready for admin panel integration
- resolve_email_variables RPC ready for direct use by other Edge Functions or via PostgREST
- TypeScript types package fully updated for all Phase 12 schema changes
- Inbucket captures all dev emails at http://127.0.0.1:54324

## Self-Check: PASSED

- All 4 created/modified files verified to exist
- Both task commits (10536f7c5, da3bc3123) verified in git history
- supabase db reset succeeds with migration applying cleanly
- All 3 RPC functions (bulk_import, bulk_delete, resolve_email_variables) confirmed in database
- Edge Function directory exists: apps/supabase/supabase/functions/send-email/index.ts (303 lines, min 80)
- Schema file exists: apps/supabase/supabase/schema/017-email-helpers.sql (157 lines, min 30)
- TypeScript types include external_id (36 occurrences), resolve_email_variables, bulk_import, bulk_delete
- Types compile without errors (npx tsc --noEmit passes)
- Inbucket accessible at http://127.0.0.1:54324 (HTTP 200)

---
*Phase: 12-services*
*Completed: 2026-03-14*

---
phase: 28-edge-functions
plan: 01
subsystem: api
tags: [supabase, edge-functions, invite-candidate, send-email, datawriter]

# Dependency graph
requires:
  - phase: 23-supabase-adapter
    provides: supabaseAdapterMixin exposing Supabase client with functions.invoke()
  - phase: 26-datawriter
    provides: SupabaseDataWriter with _preregister stub and DataWriter interface
provides:
  - sendEmail method on DataWriter interface with SendEmailOptions/SendEmailResult types
  - _preregister implementation calling invite-candidate Edge Function with projectId resolution
  - _sendEmail implementation calling send-email Edge Function with camelCase-to-snake_case mapping
affects: [28-02-PLAN, admin-app]

# Tech tracking
tech-stack:
  added: []
  patterns: [Edge Function invocation via supabase.functions.invoke(), camelCase-to-snake_case param mapping for Edge Function bodies]

key-files:
  created: []
  modified:
    - frontend/src/lib/api/base/dataWriter.type.ts
    - frontend/src/lib/api/base/universalDataWriter.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts

key-decisions:
  - "_preregister ignores identifier param -- Supabase uses email-based invite, not personal ID"
  - "_preregister resolves projectId from elections table via first nomination's electionId"
  - "_sendEmail maps camelCase recipientUserIds/dryRun to snake_case recipient_user_ids/dry_run for Edge Function"
  - "sendEmail added to DataWriter interface with throwing stubs in both Strapi and Supabase adapters"

patterns-established:
  - "Edge Function invocation: this.supabase.functions.invoke(name, { body: {...} }) with { data, error } destructuring"
  - "camelCase-to-snake_case mapping in Edge Function body params (JS convention to API convention)"

requirements-completed: [EDGE-01, EDGE-03]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 28 Plan 01: Edge Function Integration Summary

**invite-candidate and send-email Edge Functions wired into SupabaseDataWriter with projectId resolution and camelCase-to-snake_case param mapping**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T17:48:51Z
- **Completed:** 2026-03-19T17:53:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added sendEmail method to DataWriter interface with SendEmailOptions and SendEmailResult types
- Implemented _preregister to call invite-candidate Edge Function, resolving projectId from electionId
- Implemented _sendEmail to call send-email Edge Function with proper param mapping
- 5 new tests covering both Edge Function integrations (all 33 tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sendEmail to DataWriter interface and UniversalDataWriter base class** - `a1da9f2de` (feat)
2. **Task 2 RED: Add failing tests for Edge Function integration** - `a8ad60ed4` (test)
3. **Task 2 GREEN: Implement _preregister and _sendEmail** - `963abbfff` (feat)

## Files Created/Modified
- `frontend/src/lib/api/base/dataWriter.type.ts` - Added SendEmailOptions, SendEmailResult types and sendEmail to DataWriter interface
- `frontend/src/lib/api/base/universalDataWriter.ts` - Added sendEmail public method and _sendEmail abstract method
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` - Implemented _preregister (invite-candidate) and _sendEmail (send-email)
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` - Added functions mock and 5 test cases for Edge Function integration
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` - Added throwing _sendEmail stub

## Decisions Made
- _preregister ignores the `identifier` param because Supabase uses email-based invite, not personal ID
- _preregister resolves projectId by querying the `elections` table with the first nomination's electionId
- _sendEmail maps camelCase params (recipientUserIds, dryRun) to snake_case (recipient_user_ids, dry_run) matching the Edge Function API contract
- sendEmail added to the DataWriter interface (not kept Supabase-only) for interface consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- invite-candidate and send-email Edge Functions fully integrated
- Plan 02 (signicat-callback integration) can proceed independently
- Admin UI for using these methods is deferred to post-v3.0

---
*Phase: 28-edge-functions*
*Completed: 2026-03-19*

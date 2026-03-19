---
phase: 26-datawriter
plan: 03
subsystem: api
tags: [datawriter, supabase, rpc, storage, file-upload, answers, postgrest]

# Dependency graph
requires:
  - phase: 26-datawriter-plan-01
    provides: Narrowed DataWriter interface with LocalizedAnswers and UpdatedEntityProps return types
  - phase: 22-supabase-schema
    provides: upsert_answers RPC, storage bucket policies, candidates table with terms_of_use_accepted
provides:
  - SupabaseDataWriter._setAnswers with upsert_answers RPC (merge and overwrite modes)
  - File detection and Storage upload in _setAnswers (SSR-safe with typeof File guard)
  - SupabaseDataWriter._updateEntityProperties for termsOfUseAccepted via PostgREST
  - Unit tests covering merge, overwrite, file upload, and error handling paths
affects: [candidate-app-answers, candidate-app-profile]

# Tech tracking
tech-stack:
  added: []
  patterns: [file-detection-ssr-safe, lazy-project-id-fetch, uuid-storage-path]

key-files:
  created: []
  modified:
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts

key-decisions:
  - "_setAnswers uses lazy project_id fetch from candidates table (only when File objects detected) to avoid unnecessary DB queries for text-only answers"
  - "_updateEntityProperties does NOT handle image upload -- property updates are text-only (termsOfUseAccepted)"
  - "Storage path uses crypto.randomUUID() for collision-free filenames under {projectId}/candidates/{entityId}/"

patterns-established:
  - "File detection guard: typeof File !== 'undefined' && value instanceof File (SSR-safe)"
  - "Storage path convention: {projectId}/candidates/{entityId}/{uuid}.{ext} matching database RLS policies"

requirements-completed: [WRIT-01, WRIT-02]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 26 Plan 03: setAnswers/updateEntityProperties Summary

**Implemented _setAnswers with upsert_answers RPC, File-to-Storage upload with UUID paths, and _updateEntityProperties for termsOfUseAccepted via PostgREST**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T15:26:56Z
- **Completed:** 2026-03-19T15:30:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- _setAnswers calls upsert_answers RPC with merge (overwrite=false) and overwrite modes
- _setAnswers detects File objects in answer values with SSR-safe guard, uploads to Storage, and replaces File with {path: storagePath} object before calling RPC
- _updateEntityProperties updates termsOfUseAccepted via PostgREST UPDATE on candidates table
- 7 new tests (18 total) covering merge, overwrite, file upload, error handling, and property updates

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1 RED: _setAnswers failing tests** - `b98594e56` (test)
2. **Task 1 GREEN: _setAnswers implementation** - `519f6ea37` (feat)
3. **Task 2 RED: _updateEntityProperties failing tests** - `2e6f04e19` (test)
4. **Task 2 GREEN: _updateEntityProperties implementation** - `f44a94616` (feat)

## Files Created/Modified
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` - Implemented _setAnswers with File detection, Storage upload, and upsert_answers RPC; implemented _updateEntityProperties for termsOfUseAccepted via PostgREST
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` - Added 7 tests: merge mode, overwrite mode, File upload with Storage, RPC error, Storage upload error, successful property update, property update error

## Decisions Made
- _setAnswers uses lazy project_id fetch from candidates table (only when File objects are detected) to avoid unnecessary DB queries for text-only answers
- _updateEntityProperties does NOT handle image upload -- property updates are text-only (termsOfUseAccepted)
- Storage path uses crypto.randomUUID() for collision-free filenames under {projectId}/candidates/{entityId}/

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All DataWriter write methods (_setAnswers, _updateEntityProperties) are now implemented for the Supabase adapter
- 18 total tests pass in the supabaseDataWriter test file
- Ready for candidate app integration testing

## Self-Check: PASSED

All files verified present. All 4 commits verified in git log.

---
*Phase: 26-datawriter*
*Completed: 2026-03-19*

---
phase: 26-datawriter
plan: 02
subsystem: api
tags: [datawriter, supabase, rpc, jwt, session, candidate, nominations]

# Dependency graph
requires:
  - phase: 26-datawriter-plan-01
    provides: Updated DataWriter interface with BasicUserData, CandidateUserData types
  - phase: 25-dataprovider
    provides: toDataObject, parseStoredImage, mapRow utilities
  - phase: 24-auth-migration
    provides: Supabase auth adapter with GoTrue session management
provides:
  - get_candidate_user_data SQL RPC for fetching entity row by auth_user_id
  - _getBasicUserData extracting user data from Supabase session/JWT without DB query
  - _getCandidateUserData fetching candidate entity via RPC with optional nominations
  - Unit tests for register, getBasicUserData, getCandidateUserData
affects: [26-datawriter-plan-03, candidate-app, auth-flows]

# Tech tracking
tech-stack:
  added: []
  patterns: [jwt-claim-extraction, rpc-entity-lookup, session-based-user-data]

key-files:
  created:
    - apps/supabase/supabase/migrations/00003_get_candidate_user_data_rpc.sql
  modified:
    - apps/supabase/supabase/schema/005-nominations.sql
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts

key-decisions:
  - "_getBasicUserData decodes JWT access_token to extract user_roles claim -- no DB query needed for basic user data"
  - "Role mapping: candidate/party JWT roles map to 'candidate', admin roles map to 'admin', else null"
  - "_getCandidateUserData uses toDataObject + parseStoredImage for consistent entity transformation"
  - "Nominations loaded via PostgREST from() query filtered by candidate_id, not via get_nominations RPC"

patterns-established:
  - "JWT claim extraction: atob(access_token.split('.')[1]) for reading custom claims injected by Access Token Hook"
  - "RPC single-row fetch: .rpc('name', params).single() pattern for entity lookup by auth_user_id"

requirements-completed: [WRIT-04]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 26 Plan 02: User Data Methods Summary

**get_candidate_user_data RPC and _getBasicUserData/_getCandidateUserData methods extracting user data from JWT session and database entity row**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T15:26:37Z
- **Completed:** 2026-03-19T15:32:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- get_candidate_user_data RPC appended to 005-nominations.sql and created as migration 00003 -- generic for candidates and organizations via entity_type parameter
- _getBasicUserData extracts id, email, username, role, and language from Supabase session and JWT access token claims without any database query
- _getCandidateUserData calls RPC, transforms entity row via toDataObject/parseStoredImage, optionally loads nominations
- 28 unit tests pass including 8 new tests for register, getBasicUserData, and getCandidateUserData

## Task Commits

Each task was committed atomically:

1. **Task 1: Create get_candidate_user_data RPC** - already existed in HEAD (created by prior 26-03 TDD RED commit `b98594e56`)
2. **Task 2 RED: Add failing tests** - `0aa0a3ddd` (test)
3. **Task 2 GREEN: Implement methods** - `f52b9b863` (feat)

## Files Created/Modified
- `apps/supabase/supabase/schema/005-nominations.sql` - get_candidate_user_data RPC appended (already in HEAD from prior commit)
- `apps/supabase/supabase/migrations/00003_get_candidate_user_data_rpc.sql` - Migration for the new RPC (already in HEAD)
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` - Implemented _getBasicUserData (JWT extraction) and _getCandidateUserData (RPC + toDataObject)
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` - Added getSession mock, register tests, getBasicUserData tests (5 cases), getCandidateUserData tests (3 cases)

## Decisions Made
- _getBasicUserData decodes JWT access_token to extract user_roles claim -- no DB query needed for basic user data
- Role mapping: candidate/party JWT roles map to 'candidate', admin roles (project_admin, account_admin, super_admin) map to 'admin', else null
- _getCandidateUserData uses toDataObject + parseStoredImage for consistent entity transformation matching DataProvider patterns
- Nominations loaded via PostgREST from('nominations') query filtered by candidate_id, not via get_nominations RPC (simpler for candidate-scoped nominations)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SQL RPC already existed from prior commit**
- **Found during:** Task 1
- **Issue:** get_candidate_user_data RPC and migration file were already created by the 26-03 TDD RED commit (b98594e56) which ran before this plan
- **Fix:** Verified content matches plan requirements, skipped redundant commit
- **Files modified:** None (content already correct)
- **Verification:** All acceptance criteria pass via grep checks

---

**Total deviations:** 1 (plan ordering overlap with 26-03 TDD RED)
**Impact on plan:** No scope creep. SQL artifacts were already correct; implementation proceeded normally.

## Issues Encountered
- Pre-existing TS6310 error (supabase-types project reference config) -- unrelated to changes, no new type errors introduced

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- _getBasicUserData and _getCandidateUserData now functional, enabling candidate app user data loading
- Plan 03 (_setAnswers, _updateEntityProperties) already has TDD RED tests committed
- All 28 supabaseDataWriter tests pass

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 26-datawriter*
*Completed: 2026-03-19*

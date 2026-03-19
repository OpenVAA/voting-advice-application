---
phase: 26-datawriter
plan: 01
subsystem: api
tags: [datawriter, interface, typescript, supabase, strapi, svelte, registration]

# Dependency graph
requires:
  - phase: 24-auth-migration
    provides: Supabase auth adapter with login/logout/password methods
  - phase: 25-dataprovider
    provides: DataProvider with entity/question/nomination data types
provides:
  - Updated DataWriter interface with narrowed return types (LocalizedAnswers, UpdatedEntityProps)
  - Simplified register method (password-only, no registrationKey)
  - Removed checkRegistrationKey from entire interface chain
  - SupabaseDataWriter._register implementation via supabase.auth.updateUser
  - candidateUserDataStore.save() with partial merge pattern
  - Invite-based registration page flow
affects: [26-datawriter-plan-02, 26-datawriter-plan-03, auth-registration]

# Tech tracking
tech-stack:
  added: []
  patterns: [partial-return-merge, invite-based-registration]

key-files:
  created: []
  modified:
    - frontend/src/lib/api/base/dataWriter.type.ts
    - frontend/src/lib/api/base/universalDataWriter.ts
    - frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts
    - frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
    - frontend/src/lib/contexts/candidate/candidateContext.ts
    - frontend/src/lib/contexts/candidate/candidateContext.type.ts
    - frontend/src/routes/[[lang=locale]]/candidate/register/+page.svelte
    - frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte

key-decisions:
  - "Write methods return narrower types (LocalizedAnswers, UpdatedEntityProps) instead of full LocalizedCandidateData -- enables adapters to return only what RPC provides"
  - "candidateUserDataStore.save() uses inline savedData.update() for partial merges instead of full-entity replacement via updateCandidateData"
  - "StrapiDataWriter._register throws instead of being implemented -- Strapi is being sunset"
  - "Register page redirects to password page when email param present (invite-based flow) instead of showing registration key form"

patterns-established:
  - "Partial return merge: write methods return only the changed subset, caller merges into local state via savedData.update()"
  - "Invite-based registration: users arrive via invite link through auth callback, no explicit registration key validation needed"

requirements-completed: [WRIT-01, WRIT-02, WRIT-03]

# Metrics
duration: 10min
completed: 2026-03-19
---

# Phase 26 Plan 01: DataWriter Interface Changes Summary

**Narrowed DataWriter write method return types to LocalizedAnswers/UpdatedEntityProps, removed checkRegistrationKey from entire interface chain, and implemented invite-based registration flow**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-19T11:53:26Z
- **Completed:** 2026-03-19T12:03:41Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- DataWriter interface, UniversalDataWriter abstract class, and both adapters updated with narrowed return types for updateAnswers (LocalizedAnswers) and updateEntityProperties (UpdatedEntityProps)
- checkRegistrationKey removed from the entire interface chain: DataWriter, UniversalDataWriter, StrapiDataWriter, SupabaseDataWriter, candidateContext, candidateContext.type, and register page
- candidateUserDataStore.save() rewritten to merge partial returns into saved data instead of full-entity replacement
- SupabaseDataWriter._register implemented via supabase.auth.updateUser({ password })
- Register page updated from registration-key form to invite-based redirect flow
- Password page simplified to call register({ password }) without registrationKey

## Task Commits

Each task was committed atomically:

1. **Task 1: Update DataWriter interface, abstract class, and types** - `f28a7f59d` (feat)
2. **Task 2: Update both adapter implementations, candidateUserDataStore, and register route pages** - `94bb55341` (feat)

## Files Created/Modified
- `frontend/src/lib/api/base/dataWriter.type.ts` - Removed checkRegistrationKey, CheckRegistrationData; simplified register; narrowed return types; added UpdatedEntityProps; removed image from EditableEntityProps
- `frontend/src/lib/api/base/universalDataWriter.ts` - Updated abstract methods to match new interface signatures
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` - Removed _checkRegistrationKey; simplified _register (throws); narrowed _setAnswers and _updateEntityProperties return types
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` - Removed _checkRegistrationKey stub; implemented _register via supabase.auth.updateUser
- `frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` - Rewrote save() for partial merge pattern; removed image from save flow
- `frontend/src/lib/contexts/candidate/candidateContext.ts` - Removed checkRegistrationKey wrapper and from returned context object
- `frontend/src/lib/contexts/candidate/candidateContext.type.ts` - Removed checkRegistrationKey property; simplified register type
- `frontend/src/routes/[[lang=locale]]/candidate/register/+page.svelte` - Replaced registration key form with invite-based redirect
- `frontend/src/routes/[[lang=locale]]/candidate/register/password/+page.svelte` - Removed registrationKey; calls register({ password }) only

## Decisions Made
- Write methods return narrower types (LocalizedAnswers, UpdatedEntityProps) instead of full LocalizedCandidateData -- enables Supabase adapter to return only what RPC/query provides
- candidateUserDataStore.save() uses inline savedData.update() for partial merges instead of full-entity replacement
- StrapiDataWriter._register throws on call since Strapi registration key flow is removed from the interface (Strapi is sunset)
- Register page redirects to password page when email search param is present (invite-based flow) instead of showing registration key form
- updateCandidateData helper kept for reloadCandidateData; save() uses direct savedData.update() calls

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TS6310 error (Referenced project supabase-types may not disable emit) -- unrelated to changes, verified by checking against pre-change state
- Smart/curly quotes (Unicode U+2018/U+2019) were introduced by the Edit tool in candidateContext.type.ts -- fixed with sed replacement

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- DataWriter interface is now ready for Plans 02 (getCandidateUserData) and 03 (setAnswers/setProperties) to implement the Supabase adapter methods
- All existing supabaseDataWriter tests pass (11/11)
- TypeScript compiles with zero new errors

---
*Phase: 26-datawriter*
*Completed: 2026-03-19*

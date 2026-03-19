---
phase: 29-e2e-test-migration
plan: 04
subsystem: testing
tags: [supabase, e2e, playwright, migration, spec-files, supabase-js]

# Dependency graph
requires:
  - phase: 29-e2e-test-migration
    provides: "SupabaseAdminClient class (Plan 01), snake_case datasets (Plan 02), setup/teardown migration (Plan 03)"
provides:
  - "All 10 consumer spec files migrated from StrapiAdminClient to SupabaseAdminClient"
  - "Complete E2E test suite ready to run against Supabase backend"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Stateless admin client: no login/dispose lifecycle in test specs"
    - "candidateExternalId for sendEmail instead of documentId lookup"
    - "Email-based auth ops: setPassword(email, pwd) and sendForgotPassword(email)"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-registration.spec.ts
    - tests/tests/specs/candidate/candidate-profile.spec.ts
    - tests/tests/specs/candidate/candidate-settings.spec.ts
    - tests/tests/specs/voter/voter-settings.spec.ts
    - tests/tests/specs/voter/voter-popups.spec.ts
    - tests/tests/specs/voter/voter-static-pages.spec.ts
    - tests/tests/specs/variants/multi-election.spec.ts
    - tests/tests/specs/variants/results-sections.spec.ts
    - tests/tests/specs/variants/constituency.spec.ts
    - tests/tests/specs/variants/startfromcg.spec.ts

key-decisions:
  - "sendEmail uses candidateExternalId from dataset JSON directly (no findData lookup for documentId needed)"
  - "sendForgotPassword takes plain email string (Supabase auth.resetPasswordForEmail API)"
  - "setPassword takes (email, password) pair (Supabase admin.updateUserById by email lookup)"
  - "Pitfall 2 workaround comments removed (updateAppSettings does deep merge via merge_jsonb_column RPC)"
  - "trace: 'off' setting kept for serial describe blocks (Playwright trace writer issue is independent of admin client)"

patterns-established:
  - "SupabaseAdminClient consumer pattern: construct stateless, call methods directly, no lifecycle"
  - "Dataset field access via snake_case (external_id, not externalId)"

requirements-completed: [TEST-01, TEST-04]

# Metrics
duration: 8min
completed: 2026-03-19
---

# Phase 29 Plan 04: Consumer Spec Migration Summary

**Migrate all 10 E2E spec files from StrapiAdminClient to SupabaseAdminClient with simplified method signatures, removed Pitfall 2 workarounds, and eliminated login/dispose lifecycle**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T20:43:07Z
- **Completed:** 2026-03-19T20:51:34Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Migrated all 10 consumer spec files to SupabaseAdminClient (3 candidate + 3 voter + 4 variant)
- Removed all login()/dispose() lifecycle calls across every describe block (stateless service_role)
- Eliminated all Pitfall 2 workaround comments (deep merge makes them unnecessary)
- Updated method signatures: sendEmail(candidateExternalId), sendForgotPassword(email), setPassword(email, pwd)
- Updated SES email references to Inbucket in comments

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate candidate spec files (registration, profile, settings)** - `dc9a4f708` (feat)
2. **Task 2: Migrate voter + variant spec files (7 files)** - `39de7b7b4` (feat)

## Files Created/Modified
- `tests/tests/specs/candidate/candidate-registration.spec.ts` - Migrated: SupabaseAdminClient, candidateExternalId for sendEmail, email-based sendForgotPassword/setPassword
- `tests/tests/specs/candidate/candidate-profile.spec.ts` - Migrated: SupabaseAdminClient, candidateExternalId for sendEmail, removed findData documentId lookup
- `tests/tests/specs/candidate/candidate-settings.spec.ts` - Migrated: SupabaseAdminClient, removed all login/dispose from 5 describe blocks
- `tests/tests/specs/voter/voter-settings.spec.ts` - Migrated: SupabaseAdminClient, removed Pitfall 2 comments, simplified settings documentation
- `tests/tests/specs/voter/voter-popups.spec.ts` - Migrated: SupabaseAdminClient, removed Pitfall 2 comments
- `tests/tests/specs/voter/voter-static-pages.spec.ts` - Migrated: SupabaseAdminClient, removed login/dispose
- `tests/tests/specs/variants/multi-election.spec.ts` - Migrated: SupabaseAdminClient, updated entity settings comment
- `tests/tests/specs/variants/results-sections.spec.ts` - Migrated: SupabaseAdminClient, simplified results settings comment
- `tests/tests/specs/variants/constituency.spec.ts` - Migrated: SupabaseAdminClient, removed login/dispose
- `tests/tests/specs/variants/startfromcg.spec.ts` - Migrated: SupabaseAdminClient, findData works via backward-compat translation

## Decisions Made
- **sendEmail uses candidateExternalId directly from dataset:** Instead of querying findData to get documentId and passing it as candidateId, the new pattern reads external_id from the snake_case dataset JSON and passes it directly as candidateExternalId. This simplifies the test code by removing the intermediate findData call.
- **sendForgotPassword takes email string:** The Supabase auth.resetPasswordForEmail API takes an email address, not a documentId. The test simply passes the candidate email.
- **setPassword takes (email, password):** The Supabase admin API looks up users by email, so the test passes the email and new password as two arguments.
- **trace: 'off' kept:** The Playwright trace writer ENOENT issue in serial describe blocks is about Playwright's trace writer conflicting when shared pages span beforeAll/afterAll, not about the admin client type. Kept the workaround.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The entire E2E test suite (all 16 consumer files + supabaseAdminClient.ts) now uses SupabaseAdminClient exclusively
- No spec or setup file imports from strapiAdminClient.ts
- The strapiAdminClient.ts file itself is preserved for Phase 30 cleanup (final removal of Strapi code)
- Phase 29 E2E test migration is complete

## Self-Check: PASSED

- All 10 modified files exist on disk
- Both task commits verified in git log (dc9a4f708, 39de7b7b4)

---
*Phase: 29-e2e-test-migration*
*Completed: 2026-03-19*

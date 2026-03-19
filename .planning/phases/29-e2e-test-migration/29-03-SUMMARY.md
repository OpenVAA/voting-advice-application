---
phase: 29-e2e-test-migration
plan: 03
subsystem: testing
tags: [playwright, supabase, inbucket, e2e, setup-teardown]

# Dependency graph
requires:
  - phase: 29-01
    provides: SupabaseAdminClient with bulkImport/bulkDelete/importAnswers/linkJoinTables methods
  - phase: 29-02
    provides: Converted test datasets in Supabase snake_case format
provides:
  - Inbucket-based email helper for E2E test email verification
  - Supabase-backed setup/teardown projects for Playwright test data management
  - Frontend data adapter switched to supabase for E2E test runs
affects: [29-04-spec-migration, e2e-tests, frontend-data-loading]

# Tech tracking
tech-stack:
  added: []
  patterns: [bulkImport-importAnswers-linkJoinTables pipeline, Inbucket mailbox-based email testing, service_role stateless auth]

key-files:
  created: []
  modified:
    - tests/tests/utils/emailHelper.ts
    - tests/tests/setup/data.setup.ts
    - tests/tests/setup/data.teardown.ts
    - tests/tests/setup/variant-multi-election.setup.ts
    - tests/tests/setup/variant-constituency.setup.ts
    - tests/tests/setup/variant-startfromcg.setup.ts
    - tests/tests/setup/variant-data.teardown.ts
    - tests/playwright.config.ts
    - packages/app-shared/src/settings/staticSettings.ts

key-decisions:
  - "Data import follows bulkImport -> importAnswers -> linkJoinTables pipeline for each dataset"
  - "bulkDelete includes candidates collection (safe with Supabase upsert-by-external_id)"
  - "Password restore uses try/catch with setPassword fallback to forceRegister (no findData needed)"
  - "Playwright local workers increased from 4 to 6 (no Strapi rate limiting bottleneck)"

patterns-established:
  - "Supabase setup pattern: new SupabaseAdminClient() -> bulkDelete -> bulkImport -> importAnswers -> linkJoinTables -> updateAppSettings (no login/dispose)"
  - "Inbucket email testing: mailbox = email.split('@')[0], fetch /api/v1/mailbox/{name}"

requirements-completed: [TEST-01, TEST-02, TEST-03, TEST-04]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 29 Plan 03: Setup/Teardown Migration Summary

**Inbucket email helper, 6 Supabase-backed setup/teardown projects, and frontend data adapter switched to supabase**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T20:42:50Z
- **Completed:** 2026-03-19T20:47:08Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Rewrote emailHelper.ts from LocalStack SES + mailparser to Inbucket REST API with native fetch
- Migrated all 6 setup/teardown files from StrapiAdminClient to SupabaseAdminClient with bulkImport/importAnswers/linkJoinTables pipeline
- Switched staticSettings.dataAdapter.type from 'strapi' to 'supabase' so frontend loads Supabase data provider during E2E tests
- Updated Playwright config: removed Strapi rate limiting comment, increased local workers from 4 to 6

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite emailHelper for Inbucket REST API** - `1ff423e67` (feat)
2. **Task 2: Migrate setup/teardown projects, Playwright config, and data adapter type** - `faefe299a` (feat)

## Files Created/Modified
- `tests/tests/utils/emailHelper.ts` - Inbucket REST API email helper (fetchEmails, getLatestEmailHtml, extractLinkFromHtml, getRegistrationLink, countEmailsForRecipient, purgeMailbox)
- `tests/tests/setup/data.setup.ts` - Main data setup using SupabaseAdminClient with full import pipeline
- `tests/tests/setup/data.teardown.ts` - Main data teardown using bulkDelete + unregisterCandidate
- `tests/tests/setup/variant-multi-election.setup.ts` - Multi-election variant setup using SupabaseAdminClient
- `tests/tests/setup/variant-constituency.setup.ts` - Constituency variant setup using SupabaseAdminClient
- `tests/tests/setup/variant-startfromcg.setup.ts` - StartFromCG variant setup using SupabaseAdminClient
- `tests/tests/setup/variant-data.teardown.ts` - Shared variant teardown using SupabaseAdminClient
- `tests/playwright.config.ts` - Removed Strapi rate limiting comment, increased workers to 6
- `packages/app-shared/src/settings/staticSettings.ts` - Data adapter type switched to 'supabase'

## Decisions Made
- Data import follows bulkImport -> importAnswers -> linkJoinTables pipeline for each dataset (3 separate calls per dataset)
- bulkDelete includes candidates collection since Supabase uses upsert-by-external_id (Strapi version skipped candidates to preserve user-permissions links)
- Password restore uses simple try/catch with setPassword, falling back to forceRegister (no findData + documentId dance needed since Supabase setPassword takes email directly)
- Playwright local workers increased from 4 to 6 since Supabase has no rate limiting bottleneck like Strapi admin API

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All setup/teardown infrastructure now uses Supabase -- ready for spec file migration in Plan 04
- emailHelper exports unchanged (fetchEmails, getLatestEmailHtml, extractLinkFromHtml, getRegistrationLink, countEmailsForRecipient, purgeMailbox) -- consumer specs can migrate with minimal changes
- Frontend data adapter switched to supabase -- SvelteKit dev server will load Supabase data provider during E2E test runs

## Self-Check: PASSED

All 9 files verified on disk. Both task commits (1ff423e67, faefe299a) found in git log. SUMMARY.md exists.

---
*Phase: 29-e2e-test-migration*
*Completed: 2026-03-19*

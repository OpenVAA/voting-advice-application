---
phase: 01-infrastructure-foundation
plan: 01
subsystem: testing
tags: [playwright, e2e, testids, strapi-admin-tools, api-client]

# Dependency graph
requires: []
provides:
  - Playwright 1.58.2 with project dependencies config (5 projects)
  - StrapiAdminClient class for Admin Tools API data management
  - Central testIds constants file for all data-testid attributes
  - Empty directory structure for setup/specs (Plan 02+ populates)
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07, 01-08]

# Tech tracking
tech-stack:
  added: ['@playwright/test@1.58.2']
  patterns: [project-dependencies, admin-api-client, testid-constants]

key-files:
  created:
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/strapiAdminClient.ts
    - tests/tests/setup/.gitkeep
    - tests/tests/specs/candidate/.gitkeep
    - tests/tests/specs/voter/.gitkeep
  modified:
    - tests/playwright.config.ts
    - package.json

key-decisions:
  - 'Playwright 1.58.2 installed at root workspace; docs workspace retains 1.57.0 independently'
  - 'Admin Tools API body sent via JSON.stringify wrapper per controller JSON.parse requirement'
  - 'testIds organized as nested as-const object with candidate/voter/shared top-level namespaces'

patterns-established:
  - 'Project dependencies: data-setup -> auth-setup -> candidate-app, data-setup -> voter-app'
  - 'Admin API client: StrapiAdminClient with login/importData/deleteData/findData/dispose lifecycle'
  - 'TestId constants: import from testIds.ts, never use inline strings'

requirements-completed: [INFRA-02, INFRA-03, INFRA-05]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 1 Plan 01: Playwright Upgrade and Test Infrastructure Foundation Summary

**Playwright 1.58.2 with 5-project dependency config, StrapiAdminClient API wrapper, and comprehensive testId constants covering both apps**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T19:58:27Z
- **Completed:** 2026-03-03T20:03:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Upgraded Playwright from 1.49.1 to 1.58.2 with matching browser binaries installed
- Replaced globalSetup/single-project config with 5-project dependency chain (data-setup, data-teardown, auth-setup, candidate-app, voter-app)
- Created StrapiAdminClient class with full Admin Tools API coverage (login, importData, deleteData, findData, dispose)
- Created comprehensive testIds constants file with 53 testId entries organized by candidate/voter/shared namespaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Playwright and create testIds constants** - `c211df8d4` (feat)
2. **Task 2: Rewrite playwright.config.ts with project dependencies and create strapiAdminClient.ts** - `84f67cecb` (feat)

## Files Created/Modified

- `tests/tests/utils/testIds.ts` - Central testId constants with nested as-const object for all data-testid strings
- `tests/tests/utils/strapiAdminClient.ts` - Admin Tools API client with login, importData, deleteData, findData, dispose methods
- `tests/playwright.config.ts` - Rewritten with 5 project dependencies replacing globalSetup pattern
- `package.json` - Playwright version already at ^1.58.2 (confirmed)
- `tests/tests/setup/.gitkeep` - Empty directory for data.setup.ts and auth.setup.ts (Plan 02)
- `tests/tests/specs/candidate/.gitkeep` - Empty directory for candidate app spec files (Phase 2+)
- `tests/tests/specs/voter/.gitkeep` - Empty directory for voter app spec files (Phase 3+)

## Decisions Made

- Playwright 1.58.2 resolved correctly at root workspace level; the docs workspace independently uses 1.57.0 which does not affect E2E tests
- Admin Tools API body format verified: controller does `JSON.parse(ctx.request.body)`, so StrapiAdminClient sends `data: JSON.stringify({ data })` to ensure correct parsing
- testIds file includes 53 comprehensive test IDs covering all planned test scenarios for Plans 03-04
- Per-test timeout set to 30s (replacing the old 100s globalTimeout) for faster feedback on stuck tests

## Deviations from Plan

None - plan executed exactly as written. The Playwright version and eslint-plugin-playwright dependency were already present in HEAD from a prior commit, so Task 1 focused on the testIds constants creation and browser binary installation.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Config ready for Plan 02 to create data.setup.ts, data.teardown.ts, auth.setup.ts, and default dataset
- testIds constants ready for Plans 03-04 to wire into Svelte components via data-testid attributes
- StrapiAdminClient ready for Plan 02 data setup projects to use for import/delete operations
- Existing global-setup.ts and spec files preserved for Phase 2 migration reference

## Self-Check: PASSED

All files verified present. Both commit hashes (c211df8d4, 84f67cecb) confirmed in git log.

---

_Phase: 01-infrastructure-foundation_
_Completed: 2026-03-03_

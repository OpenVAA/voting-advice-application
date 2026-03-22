---
phase: 34
plan: 3
subsystem: frontend-adapter
tags: [supabase, adapter-switch, settings, dynamic-import]
requires: [@openvaa/app-shared]
provides: [SupabaseDataAdapter-type, supabase-switch-cases]
affects: [dataProvider, dataWriter, feedbackWriter, staticSettings]
tech-stack:
  added: []
  patterns: [dynamic-import-switch, proxy-stub-pattern]
key-files:
  created:
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/index.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/index.ts
    - apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/index.ts
  modified:
    - packages/app-shared/src/settings/staticSettings.type.ts
    - apps/frontend/src/lib/api/dataProvider.ts
    - apps/frontend/src/lib/api/dataWriter.ts
    - apps/frontend/src/lib/api/feedbackWriter.ts
key-decisions:
  - "Created proxy stub modules for Supabase adapter subdirectories to satisfy Rollup module resolution at build time — stubs throw descriptive error at runtime until Phase 35 implements actual providers"
requirements-completed: [ADPT-06]
duration: 2 min
completed: 2026-03-22
---

# Phase 34 Plan 3: Wire Dynamic Adapter Switch for Supabase Summary

SupabaseDataAdapter type added to settings union, and 'supabase' cases wired into all 3 adapter switch files (dataProvider, dataWriter, feedbackWriter). Proxy stub modules created for Supabase adapter subdirectories to satisfy Rollup — Phase 35 replaces stubs with real implementations. Default remains 'strapi', full build passes with 457 tests green.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Add SupabaseDataAdapter type | 645ee2e |
| 2 | Add Supabase case to dataProvider | e69c011 |
| 3 | Add Supabase case to dataWriter | e69c011 |
| 4 | Add Supabase case to feedbackWriter | e69c011 |
| 5 | Verify build + tests pass | a28b096 |

## Deviations from Plan

**[Rule 3 - Blocking] Add proxy stub modules** — Found during: Task 5. Rollup resolves all dynamic import paths at build time, even dead code paths in switch statements. Created proxy stub modules in adapters/supabase/{dataProvider,dataWriter,feedbackWriter}/index.ts that throw descriptive errors at runtime if Supabase is selected before Phase 35. Files created: 3 stub index.ts files. Commit: a28b096.

## Issues Encountered

None (deviation was auto-fixed as Rule 3 blocker).

## Self-Check: PASSED

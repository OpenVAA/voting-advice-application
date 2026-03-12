---
phase: 08-infrastructure-setup
plan: 03
subsystem: infra
tags: [supabase, postgres, linting, rls, splinter, schema-validation]

# Dependency graph
requires:
  - phase: 08-01
    provides: "@openvaa/supabase workspace with start/stop/reset/status scripts"
provides:
  - "Two-layer database lint: PL/pgSQL via supabase db lint + Splinter-derived schema checks"
  - "Custom lint-schema.mjs with RLS-disabled and unindexed-FK checks"
  - "Combined lint:all script and root supabase:lint alias"
affects: [09-schema, ci-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [splinter-derived-schema-linting, two-layer-lint-strategy]

key-files:
  created:
    - apps/supabase/scripts/lint-schema.mjs
  modified:
    - apps/supabase/package.json
    - package.json

key-decisions:
  - "Used psql stdin for SQL execution to avoid shell escaping issues with multiline queries"
  - "Unindexed FK check reports all schemas (not just public) for comprehensive coverage"
  - "Warnings from Supabase internal schemas are expected and acceptable at this stage"

patterns-established:
  - "Schema lint pattern: custom Node.js scripts in apps/supabase/scripts/ querying pg_catalog"
  - "Two-layer lint: built-in PL/pgSQL + custom Splinter-derived schema advisors"

requirements-completed: [INFRA-05]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 8 Plan 03: Database Linting Summary

**Two-layer database lint combining Supabase PL/pgSQL checks with custom Splinter-derived RLS and index coverage validation via `yarn supabase:lint`**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T18:16:30Z
- **Completed:** 2026-03-12T18:20:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created custom schema lint script with Splinter-derived SQL queries for RLS and unindexed FK checks
- Wired lint, lint:schema, and lint:all scripts into @openvaa/supabase workspace
- Added root `supabase:lint` alias for single-command lint from monorepo root
- Verified full workflow against running Supabase instance (0 errors, 21 internal warnings)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create custom schema lint script with Splinter SQL queries** - `e4bd98e39` (feat)
2. **Task 2: Wire lint scripts into workspace and root aliases** - `2a4e43917` (chore)

## Files Created/Modified
- `apps/supabase/scripts/lint-schema.mjs` - Custom Splinter-derived lint script checking RLS disabled tables and unindexed foreign keys
- `apps/supabase/package.json` - Added lint, lint:schema, and lint:all scripts
- `package.json` - Added supabase:lint root alias

## Decisions Made
- Used psql stdin (not `-c` flag) for SQL execution to avoid shell escaping issues with multiline queries containing special characters
- Unindexed FK check scans all schemas (auth, storage, etc.) rather than just public, providing broader visibility even for Supabase internal tables
- Warnings from Supabase internal schemas (21 unindexed FKs in auth/storage) are expected and acceptable -- these are upstream Supabase choices, not our responsibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SQL execution via psql stdin instead of -c flag**
- **Found during:** Task 1 (schema lint script creation)
- **Issue:** Using `JSON.stringify` to pass SQL via `-c` flag caused `\n` literal characters in the shell command, breaking psql parsing
- **Fix:** Changed `runQuery` to pass SQL via stdin using `execSync`'s `input` option instead of `-c` flag
- **Files modified:** apps/supabase/scripts/lint-schema.mjs
- **Verification:** Script runs successfully against local Supabase Postgres
- **Committed in:** e4bd98e39 (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial implementation fix, no scope creep.

## Issues Encountered
- psql `-c` flag does not handle Node.js JSON.stringify-escaped newlines properly -- resolved by passing SQL via stdin.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Lint infrastructure ready to catch RLS and index issues when Phase 9 adds custom tables
- `supabase db lint` will check PL/pgSQL functions once Phase 9 adds any
- `--strict` flag available for CI to treat warnings as errors if desired

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 08-infrastructure-setup*
*Completed: 2026-03-12*

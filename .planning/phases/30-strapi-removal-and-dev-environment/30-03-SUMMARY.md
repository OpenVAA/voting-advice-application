---
phase: 30-strapi-removal-and-dev-environment
plan: 03
subsystem: infra
tags: [ci, github-actions, supabase-cli, pgtap, dependabot, render, deployment]

# Dependency graph
requires:
  - phase: 30-strapi-removal-and-dev-environment
    plan: 01
    provides: "Strapi code removed, supabase app directory exists"
provides:
  - "CI workflow without Strapi backend-validation job"
  - "E2E CI jobs using supabase CLI instead of Docker compose"
  - "pgTAP CI job with path-based filtering via dorny/paths-filter"
  - "Dependabot config without backend/vaa-strapi monitoring"
  - "Render blueprint for frontend-only deployment with Supabase env vars"
affects: []

# Tech tracking
tech-stack:
  added: [supabase/setup-cli@v1, dorny/paths-filter@v3]
  patterns: [supabase-cli-in-ci, path-filtered-test-jobs]

key-files:
  created: []
  modified:
    - .github/workflows/main.yaml
    - .github/dependabot.yml
    - render.example.yaml

key-decisions:
  - "E2E jobs use supabase start + yarn workspace dev & pattern instead of Docker compose"
  - "pgTAP job uses dorny/paths-filter to skip when no supabase/types changes"
  - "Render blueprint removes backend service and databases section entirely"

patterns-established:
  - "CI supabase pattern: setup-cli -> supabase start -> test -> supabase stop (if: always())"
  - "Frontend wait loop: curl poll with 60x2s timeout for dev server readiness"

requirements-completed: [ENVR-04]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 30 Plan 03: CI/CD Pipeline and Deployment Config Summary

**CI workflow purged of all Strapi references, E2E tests use supabase CLI, pgTAP job with path filtering, Render blueprint frontend-only with Supabase env vars**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T07:43:23Z
- **Completed:** 2026-03-20T07:45:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed entire backend-validation CI job (Strapi build step)
- Rewrote both E2E CI jobs to use supabase CLI for backend services instead of Docker compose
- Added new supabase-tests job with pgTAP and dorny/paths-filter for path-based triggering
- Removed Strapi entry from dependabot monitoring
- Simplified Render blueprint to frontend-only deployment with Supabase configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Update CI workflow** - `b45b0944c` (feat)
2. **Task 2: Update dependabot and Render blueprint** - `1fb451ca6` (feat)

## Files Created/Modified
- `.github/workflows/main.yaml` - CI workflow: removed backend-validation, rewrote E2E for supabase CLI, added supabase-tests job
- `.github/dependabot.yml` - Removed /backend/vaa-strapi monitoring entry
- `render.example.yaml` - Removed backend service and databases, added Supabase env vars

## Decisions Made
- E2E jobs start supabase via CLI (`supabase start`) and frontend via `yarn workspace dev &` with a curl-based readiness check loop (60 iterations, 2s apart)
- pgTAP job filters on `apps/supabase/**` and `packages/supabase-types/**` paths to avoid unnecessary runs
- Render blueprint completely removes backend service and databases section (Supabase is external)
- Removed BACKEND_API_TOKEN from Render config (pre-registration uses Supabase Edge Functions now)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CI/CD pipeline fully reflects Supabase-only architecture
- Ready for remaining phase 30 plans (Docker cleanup, documentation updates)

---
*Phase: 30-strapi-removal-and-dev-environment*
*Completed: 2026-03-20*

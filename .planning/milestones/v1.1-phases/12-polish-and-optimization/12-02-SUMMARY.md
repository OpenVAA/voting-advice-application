---
phase: 12-polish-and-optimization
plan: 02
subsystem: infra
tags: [turborepo, linting, typecheck, ci-cache, eslint, typescript]

# Dependency graph
requires:
  - phase: 08-build-orchestration
    provides: Turborepo build system (turbo.json with build/test:unit tasks)
  - phase: 12-polish-and-optimization
    provides: Yarn 4.13.0 with dependency catalog for shared dev dependencies
provides:
  - Per-workspace lint pipeline via Turborepo with caching
  - Per-workspace typecheck pipeline via Turborepo with caching
  - Vercel remote cache configuration for CI workflows
affects: [ci-workflows, developer-experience]

# Tech tracking
tech-stack:
  added: [turborepo-lint-pipeline, turborepo-typecheck-pipeline, vercel-remote-cache]
  patterns: [per-workspace-lint-via-turbo, per-workspace-typecheck-via-turbo, ci-remote-cache-env-vars]

key-files:
  created: []
  modified: [turbo.json, package.json, packages/core/package.json, packages/data/package.json, packages/matching/package.json, packages/filters/package.json, packages/app-shared/package.json, packages/llm/package.json, packages/argument-condensation/package.json, packages/question-info/package.json, apps/frontend/package.json, apps/strapi/package.json, apps/docs/package.json, apps/strapi/src/plugins/openvaa-admin-tools/package.json, .github/workflows/release.yml, .github/workflows/docs.yml]

key-decisions:
  - "shared-config excluded from lint/typecheck scripts (no src directory, exports config files only)"
  - "docs lint simplified to eslint-only (prettier check is separate concern via format:check)"
  - "admin-tools plugin lint targets admin/src/ and server/src/ (matching existing directory structure)"
  - "Pre-existing lint/typecheck errors not fixed (out of scope per deviation rules)"

patterns-established:
  - "Per-workspace lint: Each workspace has 'lint' script, turbo runs with ^lint dependency chain"
  - "Per-workspace typecheck: Each workspace has 'typecheck' script, turbo runs with ^build dependency"
  - "CI remote cache: TURBO_TOKEN secret + TURBO_TEAM variable in workflow env block"

requirements-completed: [POL-01, POL-03]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 12 Plan 02: Per-Workspace Lint/Typecheck Pipelines Summary

**Per-workspace lint and typecheck via Turborepo with content-based caching, plus Vercel remote cache for CI builds**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T16:57:27Z
- **Completed:** 2026-03-14T17:03:04Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Added lint and typecheck task definitions to turbo.json with proper dependency chains and content-based caching
- Added lint/typecheck scripts to 12 workspace package.json files (8 standard packages, 3 apps, 1 plugin)
- Replaced monolithic root lint with turbo-based per-workspace pipeline (root lint:check still covers tests/ separately)
- Configured TURBO_TOKEN/TURBO_TEAM env vars in release.yml and docs.yml for Vercel remote cache

## Task Commits

Each task was committed atomically:

1. **Task 1: Add lint and typecheck tasks to Turborepo and all workspaces** - `fe330eff3` (feat)
2. **Task 2: Enable Vercel remote cache in CI workflows** - `57158c183` (chore)

## Files Created/Modified
- `turbo.json` - Added lint and typecheck task definitions with dependsOn, inputs, and caching config
- `package.json` (root) - Updated lint:check/lint:fix to use turbo run lint + separate tests/ coverage
- `packages/core/package.json` - Added lint and typecheck scripts
- `packages/data/package.json` - Added lint and typecheck scripts
- `packages/matching/package.json` - Added lint and typecheck scripts
- `packages/filters/package.json` - Added lint and typecheck scripts
- `packages/app-shared/package.json` - Added lint and typecheck scripts
- `packages/llm/package.json` - Added lint and typecheck scripts
- `packages/argument-condensation/package.json` - Added lint and typecheck scripts
- `packages/question-info/package.json` - Added lint and typecheck scripts
- `apps/frontend/package.json` - Added lint (eslint) and typecheck (svelte-check) scripts
- `apps/strapi/package.json` - Added lint and typecheck scripts
- `apps/docs/package.json` - Simplified lint to eslint-only, added typecheck, renamed old lint to lint:full
- `apps/strapi/src/plugins/openvaa-admin-tools/package.json` - Added lint (admin/src + server/src) and typecheck (dual tsconfig)
- `.github/workflows/release.yml` - Added TURBO_TOKEN/TURBO_TEAM env vars to release job
- `.github/workflows/docs.yml` - Added TURBO_TOKEN/TURBO_TEAM env vars to build job

## Decisions Made
- shared-config excluded from lint/typecheck scripts because it has no src/ directory (only exports config files)
- docs lint simplified to just `eslint .` (prettier checking moved to format:check; old combined lint renamed to lint:full)
- admin-tools plugin typecheck mirrors existing test:ts:front/test:ts:back pattern (dual tsconfig compilation)
- Pre-existing lint errors in 4 workspaces (docs, frontend, strapi, strapi-admin-tools) not fixed -- out of scope per deviation rules. These are surfaced correctly by the new pipeline but existed before this plan.
- Strapi tsc --noEmit passes without needing || true fallback (pre-existing TS errors in generateMockData.ts did not cause typecheck failure)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing lint errors surfaced by new per-workspace pipeline: docs has 13336 ESLint parsing errors (shared config lacks svelte parser for Svelte 5), frontend has 1 unused variable, strapi/admin-tools have 1 naming convention error each. These are pre-existing and not caused by this plan.
- Frontend typecheck (svelte-check) has 8 pre-existing errors. Not caused by this plan.

## User Setup Required
For Vercel remote cache to activate in CI:
- **TURBO_TOKEN**: Create at https://vercel.com/account/tokens, add as GitHub repository secret
- **TURBO_TEAM**: Add as GitHub repository variable with your Vercel team slug
- Workflows function correctly without these -- remote caching is simply skipped

## Next Phase Readiness
- All Phase 12 plans complete
- Monorepo has Yarn 4.13.0 with dependency catalog + per-workspace lint/typecheck pipelines
- CI remote cache ready to activate when secrets configured
- Pre-existing lint/typecheck errors should be addressed in a future cleanup effort

## Self-Check: PASSED

All files verified present. Both task commits (fe330eff3, 57158c183) verified in git log.

---
*Phase: 12-polish-and-optimization*
*Completed: 2026-03-14*

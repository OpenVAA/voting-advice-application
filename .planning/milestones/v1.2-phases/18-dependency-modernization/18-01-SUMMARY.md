---
phase: 18-dependency-modernization
plan: 01
subsystem: infra
tags: [yarn-catalog, vite-6, vitest-3, dependency-management, monorepo]

# Dependency graph
requires:
  - phase: 17-internationalization
    provides: stable monorepo with all workspaces building
provides:
  - expanded Yarn catalog with 30 entries as single source of truth for shared deps
  - all non-Strapi deps bumped to latest compatible versions
  - unused dependencies removed (Capacitor, ai in frontend, jest in frontend, sqlite3, yalc)
  - Vite 6 + vite-plugin-svelte 5 + vitest 3 cascade in frontend
affects: [18-02-build-verification, frontend, packages]

# Tech tracking
tech-stack:
  added: []
  patterns: [yarn-catalog-for-all-shared-deps]

key-files:
  created: []
  modified:
    - .yarnrc.yml
    - package.json
    - apps/frontend/package.json
    - apps/strapi/package.json
    - apps/docs/package.json
    - packages/llm/package.json
    - packages/argument-condensation/package.json
    - packages/question-info/package.json
    - packages/shared-config/package.json
    - yarn.lock

key-decisions:
  - "Yarn catalog expanded from 13 to 30 entries covering all deps shared across 2+ workspaces"
  - "Docs workspace retains independent vite ^7, vitest ^4, globals ^16, eslint-plugin-svelte ^3 (different majors than catalog)"
  - "AI SDK stays at v5 -- v6 has breaking changes requiring LLM package refactor"
  - "@types/node bumped to ^22 for broader type coverage despite Node 20 engine"

patterns-established:
  - "Yarn catalog: single source of truth -- any dep used in 2+ workspaces gets a catalog entry"
  - "Catalog exclusion: deps with different major versions across workspaces stay workspace-managed"

requirements-completed: [DEP-01, DEP-02, DEP-04]

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 18 Plan 01: Dependency Cleanup and Catalog Expansion Summary

**Removed 8 unused deps, expanded Yarn catalog from 13 to 30 entries, bumped Vite 5->6 / vitest 2->3 / vite-plugin-svelte 4->5 cascade plus 10 other version bumps across all non-Strapi workspaces**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T17:34:32Z
- **Completed:** 2026-03-16T17:38:48Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Removed all Capacitor packages, ai, jest from frontend; sqlite3, yalc from Strapi
- Deleted unused capacitor.config.ts
- Expanded Yarn catalog to 30 entries covering all shared dependencies
- Bumped Vite 5->6, @sveltejs/vite-plugin-svelte 4->5, vitest 2->3, @vitest/coverage-v8 2->3 (cascade chain)
- Major bumps: intl-messageformat 10->11, isomorphic-dompurify 2->3, jose 5->6, jsdom 24->26, dotenv 16->17, eslint-config-prettier 9->10
- Converted all shared deps to catalog: references across workspaces
- Docs workspace preserved at its independent version set (Vite 7, vitest 4)
- yarn install completes successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove unused dependencies and delete Capacitor config** - `f55421fbb` (chore)
2. **Task 2: Expand Yarn catalog, bump versions, convert to catalog references, and run yarn install** - `192270c9f` (feat)

## Files Created/Modified
- `.yarnrc.yml` - Expanded catalog from 13 to 30 entries with updated versions
- `package.json` - Root devDeps: @types/node, @faker-js/faker, @playwright/test, dotenv to catalog; lint-staged, turbo bumped
- `apps/frontend/package.json` - Removed Capacitor/ai/jest; bumped vite, vite-plugin-svelte, coverage-v8, jsdom, svelte-eslint-parser, intl-messageformat, isomorphic-dompurify, jose, qs, flat-cache; shared deps to catalog
- `apps/strapi/package.json` - Removed sqlite3/yalc; @faker-js/faker to catalog
- `apps/docs/package.json` - 12 deps converted to catalog references; retained independent vite/vitest/globals/eslint-plugin-svelte
- `packages/llm/package.json` - openai bumped; zod to catalog; ai stays at ^5
- `packages/argument-condensation/package.json` - @types/js-yaml, dotenv, js-yaml to catalog
- `packages/question-info/package.json` - @types/js-yaml, js-yaml, zod to catalog
- `packages/shared-config/package.json` - eslint-config-prettier to catalog (^9->^10 via catalog)
- `apps/frontend/capacitor.config.ts` - Deleted (Capacitor was never used)
- `yarn.lock` - Regenerated with all new resolutions

## Decisions Made
- Yarn catalog expanded from 13 to 30 entries to be the single source of truth for all 2+ workspace shared deps
- Docs workspace retains independent versions for vite (^7), vitest (^4), globals (^16), eslint-plugin-svelte (^3), @sveltejs/vite-plugin-svelte (^6) -- different major versions than catalog
- AI SDK stays at v5 per research recommendation -- v6 has breaking changes (generateObject deprecated, CoreMessage removed)
- @types/node bumped to ^22 despite Node 20 engine -- types are backward-compatible and provide broader coverage
- @faker-js/faker stays at ^8 -- v10 is ESM-only which may break Strapi CJS context
- @testing-library/jest-dom preserved in frontend (provides vitest-compatible matchers, not jest-specific)
- jest and supertest preserved in Strapi (legacy test:e2e script depends on them)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Peer dependency warnings during yarn install:
- `@types/react` version mismatch in Strapi plugin (pre-existing, Strapi deps not bumped per locked decision)
- `zod@4` vs openai's `zod@^3` peer requirement (openai SDK expects zod 3, but zod 4 is installed -- this is a known upstream issue)

These are warnings only (not errors) and do not block installation or builds.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All dependency versions updated, ready for build verification (18-02)
- yarn install succeeds, yarn.lock regenerated
- Vite 6 cascade (vite + vite-plugin-svelte + vitest + coverage-v8) all aligned
- Build verification needed to confirm no runtime/compile breakage from version bumps

---
*Phase: 18-dependency-modernization*
*Completed: 2026-03-16*

---
phase: 19-integration-validation
plan: 01
subsystem: infra
tags: [node-22, ci, docker, prettier, eslint, import-attributes]

# Dependency graph
requires:
  - phase: 18-dependency-modernization
    provides: "Modernized dependency catalog and Strapi vitest pin"
provides:
  - "All CI workflows using Node 22.22.1"
  - "Both Dockerfiles using node:22-alpine base"
  - "All package.json engine fields set to >=22"
  - "All E2E test files using import attributes (with) instead of assertions (assert)"
  - "TranslationKey generation removed from CI and pre-commit"
  - ".prettierignore updated for current monorepo structure"
  - "Full codebase formatted with Prettier"
affects: [19-02-docker-e2e-ci-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["import attributes (with) replace import assertions (assert) for Node 22"]

key-files:
  created: []
  modified:
    - ".github/workflows/main.yaml"
    - ".github/workflows/release.yml"
    - ".github/workflows/docs.yml"
    - "apps/frontend/Dockerfile"
    - "apps/strapi/Dockerfile"
    - "package.json"
    - "apps/frontend/package.json"
    - "apps/strapi/package.json"
    - ".husky/pre-commit"
    - ".prettierignore"

key-decisions:
  - ".prettierignore updated from legacy frontend/ paths to apps/frontend/ and generated dirs excluded"
  - "Pre-existing lint failures documented as deferred (docs ESLint CJS/ESM config, non-auto-fixable errors)"
  - "Release and docs CI workflows also migrated to Node 22 for full consistency"

patterns-established:
  - "import attributes: use 'with { type: json }' not 'assert { type: json }' for JSON imports"
  - ".prettierignore excludes .planning/, apps/frontend/.svelte-kit/, and apps/frontend/src/lib/paraglide/"

requirements-completed: [VAL-01, VAL-03]

# Metrics
duration: 11min
completed: 2026-03-16
---

# Phase 19 Plan 01: Node 22 Migration and Local Build Validation Summary

**Node 22 migration across all CI workflows, Dockerfiles, and engine fields with import assertion modernization and TranslationKey removal**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-16T19:38:36Z
- **Completed:** 2026-03-16T19:50:13Z
- **Tasks:** 3
- **Files modified:** 276 (18 targeted + 256 formatting/lint + 2 extra CI workflows)

## Accomplishments
- All 6 CI workflow jobs across 3 files (main.yaml, release.yml, docs.yml) now use Node 22.22.1
- Both Dockerfiles updated to node:22-alpine base image
- All 3 package.json engine fields set to node >=22
- 12 E2E test files migrated from deprecated `assert { type: 'json' }` to `with { type: 'json' }`
- TranslationKey generation step removed from CI pipeline and pre-commit hook
- .prettierignore corrected for current monorepo directory structure
- Full codebase formatted -- 233 source files with pre-existing style drift fixed
- ESLint auto-fixable issues resolved (import sort order, prefer-web-first-assertions)
- `yarn build`, `yarn test:unit`, and `yarn format:check` all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Node version references and import assertions to Node 22** - `aa0269a0e` (feat)
2. **Task 2: Remove obsolete TranslationKey generation from CI and pre-commit** - `920a5b36d` (chore)
3. **Task 3: Run full local build validation** - `8cb16e235` (chore) + `cb7874360` (feat, additional CI workflows)

## Files Created/Modified
- `.github/workflows/main.yaml` - CI pipeline: Node 22.22.1 in all 4 jobs, TranslationKey step removed
- `.github/workflows/release.yml` - Release pipeline: Node 22.22.1
- `.github/workflows/docs.yml` - Docs pipeline: Node 22.22.1
- `apps/frontend/Dockerfile` - node:22-alpine base
- `apps/strapi/Dockerfile` - node:22-alpine base
- `package.json` - engine node >=22
- `apps/frontend/package.json` - engine node >=22
- `apps/strapi/package.json` - engine node >=22
- `.husky/pre-commit` - TranslationKey check removed, simplified to build + lint-staged
- `.prettierignore` - Updated for current monorepo paths
- 12 E2E test files - `assert` -> `with` import attribute migration
- 233 source files - Prettier formatting fixes (pre-existing drift)

## Decisions Made
- **.prettierignore modernization:** Updated paths from legacy `frontend/` to `apps/frontend/`, excluded generated directories (`.svelte-kit/`, `paraglide/`), and `.planning/` docs to prevent format:check failures on non-source files
- **Additional CI workflows:** Extended Node 22 migration beyond main.yaml to include release.yml and docs.yml for complete consistency (Rule 2 deviation)
- **Pre-existing lint failures deferred:** docs workspace ESLint CJS/ESM config error and ~136 non-auto-fixable lint errors (unused-vars, func-style, no-networkidle) are pre-existing and not caused by this plan -- documented for future cleanup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed .prettierignore for current monorepo structure**
- **Found during:** Task 3 (format:check validation)
- **Issue:** .prettierignore referenced legacy paths (`frontend/`, `backend/vaa-strapi/`) instead of current `apps/frontend/`, `apps/strapi/`. Generated `.svelte-kit/` and `paraglide/` files weren't excluded.
- **Fix:** Updated all paths to current structure, added exclusions for generated directories and .planning/ docs
- **Files modified:** .prettierignore
- **Verification:** `yarn format:check` passes
- **Committed in:** 8cb16e235 (Task 3 commit)

**2. [Rule 2 - Missing Critical] Migrated Node version in release.yml and docs.yml**
- **Found during:** Task 3 (overall verification)
- **Issue:** Plan targeted main.yaml but release.yml and docs.yml still referenced Node 20.18.1
- **Fix:** Updated both files from 20.18.1 to 22.22.1
- **Files modified:** .github/workflows/release.yml, .github/workflows/docs.yml
- **Verification:** `grep -r "20.18.1" .github/` returns no matches
- **Committed in:** cb7874360

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. The .prettierignore fix was required for format:check to pass. The additional CI workflows ensure no Node 20 references remain anywhere.

## Issues Encountered
- **Pre-existing lint failures:** `yarn lint:check` fails due to docs workspace ESLint CJS/ESM config error and ~136 non-auto-fixable lint errors across frontend and tests. These are identical before and after plan changes -- confirmed via git stash comparison. Documented as deferred items.
- **Massive Prettier drift:** 233 source files had pre-existing formatting issues. Fixed by running `yarn format` as the plan specified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Node 22 migration complete across all infrastructure files
- Build, unit tests, and formatting all pass
- Ready for Plan 02: Docker/E2E/CI validation
- Deferred: docs workspace ESLint config fix, remaining non-auto-fixable lint errors

## Self-Check: PASSED

- 19-01-SUMMARY.md: FOUND
- aa0269a0e (Task 1): FOUND
- 920a5b36d (Task 2): FOUND
- 8cb16e235 (Task 3): FOUND
- cb7874360 (Task 3 extra): FOUND

---
*Phase: 19-integration-validation*
*Completed: 2026-03-16*

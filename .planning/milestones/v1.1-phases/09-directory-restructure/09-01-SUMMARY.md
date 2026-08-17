---
phase: 09-directory-restructure
plan: 01
subsystem: infra
tags: [monorepo, yarn-workspaces, turborepo, docker, ci, typescript]

# Dependency graph
requires:
  - phase: 08-build-orchestration
    provides: Turborepo build orchestration (turbo.json, yarn build replaces build:shared)
provides:
  - Standard apps/ + packages/ monorepo directory layout
  - All three apps (frontend, strapi, docs) under apps/
  - Updated Docker configs for new paths
  - Updated CI workflows for new paths
  - E2E test path alias constants (REPO_ROOT, FRONTEND_DIR, STRAPI_DIR)
  - Updated CLAUDE.md with new directory references
affects: [10-versioning, 11-publishing, 12-ci-quality]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "apps/ directory for application workspaces, packages/ for libraries"
    - "Test path aliases via tests/tests/utils/paths.ts for filesystem operations"
    - "COPY apps apps in Dockerfiles instead of individual COPY per directory"

key-files:
  created:
    - tests/tests/utils/paths.ts
  modified:
    - package.json
    - apps/frontend/tsconfig.json
    - apps/docs/tsconfig.json
    - apps/docs/scripts/docs-scripts.config.ts
    - apps/frontend/docker-compose.dev.yml
    - apps/strapi/docker-compose.dev.yml
    - apps/frontend/Dockerfile
    - apps/strapi/Dockerfile
    - docker-compose.dev.yml
    - .github/workflows/docs.yml
    - .github/workflows/main.yaml
    - .github/dependabot.yml
    - .husky/pre-commit
    - .lintstagedrc.json
    - render.example.yaml
    - tests/tests/utils/buildRoute.ts
    - tests/tests/utils/translations.ts
    - CLAUDE.md
    - .env.example

key-decisions:
  - "Big-bang atomic move: all three directories moved in single operation to avoid broken intermediate states"
  - "COPY apps apps in Dockerfiles: cleaner and future-proof vs individual COPY per app"
  - "yarn build replaces build:shared in Dockerfiles and CI (Phase 8 alignment)"
  - "Container-internal paths mirror repo structure (/opt/apps/frontend, /opt/apps/strapi)"
  - "Static imports updated directly; path.join aliases only for filesystem operations"

patterns-established:
  - "apps/* workspace glob auto-discovers new apps"
  - "Test path constants in tests/tests/utils/paths.ts for filesystem operations"

requirements-completed: [DIR-01, DIR-02, DIR-03, DIR-04, DIR-05]

# Metrics
duration: 14min
completed: 2026-03-13
---

# Phase 9 Plan 01: Directory Restructure Summary

**Moved frontend, strapi, and docs to apps/ directory with all Docker, CI, TypeScript, and test path references updated**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-13T06:18:01Z
- **Completed:** 2026-03-13T06:32:00Z
- **Tasks:** 3
- **Files modified:** 20+

## Accomplishments
- Moved frontend/, backend/vaa-strapi/, and docs/ into apps/frontend/, apps/strapi/, apps/docs/
- Updated all workspace, Docker, CI, TypeScript, Husky, lint-staged, Dependabot, and Render configs
- Replaced stale build:shared with yarn build in Dockerfiles and CI workflows (Phase 8 alignment)
- Created test path alias module (paths.ts) with REPO_ROOT, FRONTEND_DIR, STRAPI_DIR
- Updated CLAUDE.md with comprehensive new directory structure documentation
- Full verification: yarn install, yarn build, yarn test:unit all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Move directories and update workspace, TypeScript, and root configs** - `9501259ec` (feat)
2. **Task 2: Update Docker and CI configurations** - `33e3c0a9a` (feat)
3. **Task 3: Final verification sweep and CLAUDE.md update** - `90240ca5f` (chore)

## Files Created/Modified
- `apps/frontend/` - Frontend app (moved from frontend/)
- `apps/strapi/` - Strapi backend (moved and flattened from backend/vaa-strapi/)
- `apps/docs/` - Documentation site (moved from docs/)
- `package.json` - Updated workspaces array and script paths
- `apps/frontend/tsconfig.json` - Updated 8 TypeScript project references
- `apps/docs/tsconfig.json` - Updated 1 TypeScript project reference
- `apps/docs/scripts/docs-scripts.config.ts` - Updated REPO_ROOT and FRONTEND_ROOT
- `docker-compose.dev.yml` - Updated 4 extends file paths
- `apps/frontend/docker-compose.dev.yml` - Updated context, dockerfile, and volume paths
- `apps/strapi/docker-compose.dev.yml` - Updated dockerfile and volume paths
- `apps/frontend/Dockerfile` - COPY apps, yarn build, updated stage paths
- `apps/strapi/Dockerfile` - COPY apps, yarn build, updated stage paths
- `.github/workflows/docs.yml` - Updated paths, cd commands, artifact path
- `.github/workflows/main.yaml` - Updated build:shared, .env copy, cache path
- `.husky/pre-commit` - Updated cd path and build command
- `.lintstagedrc.json` - Replaced build:app-shared with turbo command
- `.github/dependabot.yml` - Updated directory paths
- `render.example.yaml` - Updated Dockerfile paths
- `tests/tests/utils/paths.ts` - New: path alias constants for test utilities
- `tests/tests/utils/buildRoute.ts` - Updated frontend import paths
- `tests/tests/utils/translations.ts` - Updated imports and TRANSL_DIR path
- `CLAUDE.md` - Updated all directory references for new structure
- `.env.example` - Updated comment path reference

## Decisions Made
- **Big-bang atomic move:** All three directories moved together to avoid broken intermediate states (workspace resolution would fail with partial moves)
- **COPY apps apps in Dockerfiles:** Instead of individual COPY per app directory, single COPY is cleaner and automatically includes future apps
- **Container paths mirror repo:** /opt/apps/frontend and /opt/apps/strapi inside Docker containers match the repo layout for easier debugging
- **build:shared -> yarn build:** Both Dockerfiles and 2 CI workflows had stale build:shared references from Phase 8; replaced with yarn build (Turborepo caching makes full builds efficient)
- **build:app-shared -> turbo run build --filter=@openvaa/app-shared...:** Pre-commit hook and lint-staged config had stale references; replaced with explicit turbo filter command

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale path comments in source code**
- **Found during:** Task 3 (stale path sweep)
- **Issue:** Source code comments in route.ts and strapiAdapter.ts referenced old backend/vaa-strapi/ paths
- **Fix:** Updated comment paths to apps/strapi/ for developer reference accuracy
- **Files modified:** apps/frontend/src/lib/utils/route/route.ts, apps/frontend/src/lib/api/adapters/strapi/strapiAdapter.ts
- **Committed in:** 90240ca5f (Task 3 commit)

**2. [Rule 1 - Bug] Updated .env.example comment path**
- **Found during:** Task 3 (stale path sweep)
- **Issue:** .env.example had comment referencing /frontend/src/... instead of /apps/frontend/src/...
- **Fix:** Updated path in comment
- **Files modified:** .env.example
- **Committed in:** 90240ca5f (Task 3 commit)

**3. [Rule 1 - Bug] Updated strapi package.json echo message**
- **Found during:** Task 2 (stale path grep)
- **Issue:** Error message in generate:types script referenced old backend/vaa-strapi/ path
- **Fix:** Updated to apps/strapi/
- **Files modified:** apps/strapi/package.json
- **Committed in:** 33e3c0a9a (Task 2 commit)

**4. [Rule 1 - Bug] Updated Docker container-internal volume paths**
- **Found during:** Task 2 (Docker config updates)
- **Issue:** Frontend docker-compose volume mounts referenced /opt/frontend/ but Dockerfile now copies to /opt/apps/frontend/
- **Fix:** Updated all container-internal paths to /opt/apps/frontend/ and /opt/apps/strapi/
- **Files modified:** apps/frontend/docker-compose.dev.yml, apps/strapi/docker-compose.dev.yml
- **Committed in:** 33e3c0a9a (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (4 bugs - stale path references)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep. All were direct consequences of the directory move.

## Issues Encountered
None - the directory move and path updates proceeded smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Directory structure complete and verified
- All builds and tests pass from new paths
- Docker and CI configs ready (full Docker start and E2E run recommended as smoke test in Plan 09-02 if it exists)
- Ready for Phase 10 (versioning) or Phase 11 (publishing) work

## Self-Check: PASSED

- All created files verified to exist (apps/frontend, apps/strapi, apps/docs, tests/tests/utils/paths.ts, SUMMARY.md)
- Old directories confirmed removed (frontend/, backend/, docs/)
- All 3 task commits verified in git history (9501259, 33e3c0a, 90240ca)

---
*Phase: 09-directory-restructure*
*Completed: 2026-03-13*

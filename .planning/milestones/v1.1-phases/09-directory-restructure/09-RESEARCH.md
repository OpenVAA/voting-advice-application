# Phase 9: Directory Restructure - Research

**Researched:** 2026-03-12
**Domain:** Monorepo directory reorganization (Yarn workspaces, Docker, CI, TypeScript)
**Confidence:** HIGH

## Summary

This phase moves three application directories (`frontend/`, `backend/vaa-strapi/`, `docs/`) into an `apps/` directory following the standard monorepo `apps/` + `packages/` convention. The Strapi backend flattens from `backend/vaa-strapi/` to `apps/strapi/`. The `tests/` directory stays at root.

The restructure is mechanically straightforward but touches many configuration files. The comprehensive inventory below identifies 30+ files requiring path updates across 7 categories: workspace config, Docker configs, CI workflows, TypeScript references, root scripts, E2E test path references, and deployment config. The key risk is missing a path reference, causing silent failures. The mitigation is systematic file-by-file verification against this inventory.

**Primary recommendation:** Execute as a single atomic operation (big-bang move), updating all path references in one commit. Incremental moves would leave the repo in a broken state between steps since workspace resolution, Docker builds, and CI all depend on consistent paths.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All three applications move: frontend, backend (Strapi), and docs
- `backend/vaa-strapi/` flattens to `apps/strapi/` (remove the extra nesting level)
- `tests/` stays at the project root -- it's cross-cutting, not an app
- `packages/` stays at root (unchanged)
- `apps/frontend/` -- keeps current name, matches @openvaa/frontend package name
- `apps/strapi/` -- flattened from `backend/vaa-strapi/`, matches @openvaa/strapi package name
- `apps/docs/` -- keeps current name, matches @openvaa/docs package name
- No renames to package names -- all stay as-is
- Use `apps/*` glob pattern for app workspaces (auto-discovers new apps)
- Strapi plugins remain as workspaces: `apps/strapi/src/plugins/*`
- Full workspace list: `["packages/*", "apps/*", "apps/strapi/src/plugins/*"]`
- Tests directory stays at root, not a Yarn workspace
- Introduce path aliases (FRONTEND_DIR, BACKEND_DIR constants in a test config file) instead of raw relative paths
- Update `docs/**` path trigger to `apps/docs/**` in `.github/workflows/docs.yml`
- No expanded triggers (don't add shared package paths as triggers)

### Claude's Discretion
- Migration approach (big-bang vs incremental moves)
- Exact path alias implementation in test config
- Order of operations for Docker/CI/TypeScript updates
- Whether to update the docs CI `build:shared` reference to `yarn build` (Phase 8 change)
- How to handle Dockerfile context paths after flattening

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIR-01 | Frontend, backend (Strapi), and docs are moved to `apps/` directory | Complete inventory of move operations and all path references requiring updates (see Architecture Patterns section) |
| DIR-02 | Docker Compose configs updated for new paths and dev stack starts correctly | Detailed analysis of all Docker files: root compose, frontend compose, backend compose, both Dockerfiles, localstack volume mounts (see Docker Path Changes subsection) |
| DIR-03 | CI workflows updated for new directory structure | Analysis of all 4 workflow files, path triggers, `cd` commands, cache paths, artifact paths (see CI Workflow Changes subsection) |
| DIR-04 | E2E tests pass with new directory layout | Identified 3 test files with hardcoded `../../frontend` paths needing path alias extraction (see E2E Test Path Changes subsection) |
| DIR-05 | TypeScript project references updated for new paths | Frontend tsconfig has 8 references changing `../packages` to `../../packages`; backend tsconfig reference changes from `../../packages` to `../../packages`; docs tsconfig reference changes from `../packages` to `../../packages` (see TypeScript Reference Changes subsection) |
</phase_requirements>

## Standard Stack

No new libraries or tools. This phase uses only existing tooling:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Yarn 4 | 4.6.0 | Workspace resolution via `workspaces` in package.json | Already in use; workspace globs handle new paths |
| Turborepo | ^2.8.16 | Build orchestration | Already configured; auto-discovers workspaces from Yarn |
| Docker Compose | v2 | Dev stack orchestration | Already in use; `extends` pattern requires path updates |
| TypeScript | ^5.7 | Type checking via project references | Already in use; references use relative paths |
| Playwright | ^1.58 | E2E testing | Already in use; testDir paths are relative to config |

### Installation
No new packages needed. This is purely a file move + path update operation.

## Architecture Patterns

### Target Directory Structure
```
repo-root/
  apps/
    frontend/          # was: frontend/
    strapi/            # was: backend/vaa-strapi/ (flattened)
    docs/              # was: docs/
  packages/            # unchanged
    app-shared/
    core/
    data/
    filters/
    matching/
    ...
  tests/               # unchanged, stays at root
  docker-compose.dev.yml
  package.json
  turbo.json
  .github/workflows/
```

### Pattern: Big-Bang Atomic Move

**What:** Move all three directories and update all path references in a single operation.
**Why:** The monorepo's workspace resolution, Docker builds, CI, and TypeScript references form an interconnected system. Moving one directory without the others leaves the repo in a broken state.
**How:**
1. Create `apps/` directory
2. `git mv frontend apps/frontend`
3. `git mv backend/vaa-strapi apps/strapi` (flattens)
4. `git mv docs apps/docs`
5. Remove empty `backend/` directory
6. Update all path references (30+ files)
7. Verify: `yarn install`, `yarn build`, `yarn test:unit`

### Complete Path Reference Inventory

#### Category 1: Workspace Configuration (root package.json)

**File:** `package.json`

| Current | New |
|---------|-----|
| `"backend/vaa-strapi"` | `"apps/*"` (glob covers all apps) |
| `"backend/vaa-strapi/src/plugins/*"` | `"apps/strapi/src/plugins/*"` |
| `"frontend"` | removed (covered by `"apps/*"` glob) |
| `"docs"` | removed (covered by `"apps/*"` glob) |

Final workspaces array: `["packages/*", "apps/*", "apps/strapi/src/plugins/*"]`

#### Category 2: Root Scripts (root package.json)

| Script | Current Path | New Path |
|--------|-------------|----------|
| `sync:translations` | `frontend/src/lib/i18n/translations/ backend/vaa-strapi/src/util/translations/` | `apps/frontend/src/lib/i18n/translations/ apps/strapi/src/util/translations/` |
| `lint:fix` | `backend/vaa-strapi/src backend/vaa-strapi/tests frontend packages tests` | `apps/strapi/src apps/strapi/tests apps/frontend packages tests` |
| `lint:check` | same as lint:fix | same as lint:fix |
| `dev:restart-frontend` | `voting-advice-application-frontend-1` | same (Docker container name unchanged) |

**Note:** Workspace-based scripts like `yarn workspace @openvaa/frontend dev` do NOT need changes -- Yarn resolves by package name, not path. Scripts like `yarn build`, `yarn test:unit` also work unchanged (Turborepo resolves via workspaces).

#### Category 3: Docker Configuration

**File: `docker-compose.dev.yml` (root)**

| Current | New |
|---------|-----|
| `file: ./frontend/docker-compose.dev.yml` | `file: ./apps/frontend/docker-compose.dev.yml` |
| `file: ./backend/vaa-strapi/docker-compose.dev.yml` (x3 services) | `file: ./apps/strapi/docker-compose.dev.yml` |

**File: `apps/frontend/docker-compose.dev.yml` (was `frontend/docker-compose.dev.yml`)**

| Property | Current | New |
|----------|---------|-----|
| `build.context` | `../` | `../../` |
| `build.dockerfile` | `frontend/Dockerfile` | `apps/frontend/Dockerfile` |
| `volumes[1]` (packages) | `../packages:/opt/packages:ro` | `../../packages:/opt/packages:ro` |

**File: `apps/strapi/docker-compose.dev.yml` (was `backend/vaa-strapi/docker-compose.dev.yml`)**

| Property | Current | New |
|----------|---------|-----|
| `build.context` | `../../` | `../../` (unchanged -- was already repo root) |
| `build.dockerfile` | `backend/vaa-strapi/Dockerfile` | `apps/strapi/Dockerfile` |
| `volumes` (localstack init) | `./localstack-init-aws.sh:/etc/localstack/...` | unchanged (relative to this file) |
| `volumes` (localstack cors) | `./localstack-s3-cors-policy.json:/etc/localstack/...` | unchanged |
| `volumes` (strapi uploads) | `/opt/backend/vaa-strapi/public/uploads` | `/opt/apps/strapi/public/uploads` |

**File: `apps/frontend/Dockerfile` (was `frontend/Dockerfile`)**

| Line | Current | New |
|------|---------|-----|
| `COPY backend backend` | `COPY apps/strapi apps/strapi` (or restructure) | See Dockerfile Strategy below |
| `COPY docs docs` | `COPY apps/docs apps/docs` | |
| `COPY frontend frontend` | `COPY apps/frontend apps/frontend` | |
| `COPY --from=shared /opt/frontend frontend` | `COPY --from=shared /opt/apps/frontend apps/frontend` | |
| `CMD yarn workspace @openvaa/frontend dev --host` | unchanged (workspace name) | |
| `RUN yarn workspace @openvaa/frontend build` | unchanged | |
| `CMD node ./frontend/build/index.js` | `CMD node ./apps/frontend/build/index.js` | |

**File: `apps/strapi/Dockerfile` (was `backend/vaa-strapi/Dockerfile`)**

| Line | Current | New |
|------|---------|-----|
| `COPY backend backend` | `COPY apps apps` | See Dockerfile Strategy below |
| `COPY docs docs` | removed or `COPY apps/docs apps/docs` | |
| `COPY frontend frontend` | `COPY apps/frontend apps/frontend` | |
| `COPY --from=shared /opt/packages/app-shared ./packages/app-shared` | unchanged | |
| `COPY --from=shared /opt/packages/core ./packages/core` | unchanged | |
| `COPY --from=shared /opt/packages/data ./packages/data` | unchanged | |
| `COPY --from=shared /opt/backend/vaa-strapi ./backend/vaa-strapi` | `COPY --from=shared /opt/apps/strapi ./apps/strapi` | |

**Dockerfile Strategy:** Both Dockerfiles currently COPY the entire workspace tree for `yarn install --immutable` to work (Yarn needs all workspace package.json files). The simplest approach: replace `COPY backend backend`, `COPY docs docs`, `COPY frontend frontend` with `COPY apps apps`. This is cleaner and future-proof. The `packages` COPY stays unchanged.

#### Category 4: CI Workflows

**File: `.github/workflows/docs.yml`**

| Line | Current | New |
|------|---------|-----|
| `paths: - "docs/**"` | `paths: - "apps/docs/**"` |
| `cd docs` (x3 occurrences) | `cd apps/docs` |
| `path: ./docs/build` (upload artifact) | `path: ./apps/docs/build` |
| `yarn build:shared` | `yarn build` (Phase 8 removed `build:shared`; use Turborepo) |

**File: `.github/workflows/main.yaml`**

| Line | Current | New |
|------|---------|-----|
| `yarn build:shared` (x2 occurrences) | `yarn build` (or `turbo run build --filter='./packages/*'`) |
| `cp .env.example frontend/.env` | `cp .env.example apps/frontend/.env` |
| `path: "backend/vaa-strapi/node_modules"` (cache) | `path: "apps/strapi/node_modules"` (cache) |

**Note:** The `build:shared` script no longer exists in root package.json (Phase 8 removed it). CI will fail on this reference regardless of this phase. Updating to `yarn build` or `turbo run build --filter='./packages/*'` fixes both the stale reference and aligns with Phase 8 changes.

**Files: `.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml`, `.github/workflows/claude-solve-issue.yml`**
No filesystem path references -- these use workspace commands and git operations. No changes needed.

#### Category 5: TypeScript Project References

**File: `apps/frontend/tsconfig.json` (was `frontend/tsconfig.json`)**

All 8 references change from `../packages/X` to `../../packages/X`:

```json
"references": [
  { "path": "../../packages/app-shared/tsconfig.esm.json" },
  { "path": "../../packages/argument-condensation/tsconfig.json" },
  { "path": "../../packages/core/tsconfig.json" },
  { "path": "../../packages/data/tsconfig.json" },
  { "path": "../../packages/filters/tsconfig.json" },
  { "path": "../../packages/llm/tsconfig.json" },
  { "path": "../../packages/matching/tsconfig.json" },
  { "path": "../../packages/question-info/tsconfig.json" }
]
```

**File: `apps/strapi/tsconfig.json` (was `backend/vaa-strapi/tsconfig.json`)**

Currently: `"references": [{ "path": "../../packages/app-shared/tsconfig.cjs.json" }]`
New: `"references": [{ "path": "../../packages/app-shared/tsconfig.cjs.json" }]` -- same depth! Backend was at `backend/vaa-strapi/` (2 levels deep), now `apps/strapi/` (still 2 levels). No change needed.

**File: `apps/docs/tsconfig.json` (was `docs/tsconfig.json`)**

Currently: `"references": [{ "path": "../packages/app-shared/tsconfig.esm.json" }]`
New: `"references": [{ "path": "../../packages/app-shared/tsconfig.esm.json" }]`

#### Category 6: E2E Test Path References

**File: `tests/tests/utils/buildRoute.ts`**

```typescript
// Current
import { ROUTE } from '../../../frontend/src/lib/utils/route/route';
import type { Route } from '../../../frontend/src/lib/utils/route/route';

// New (with path alias)
import { ROUTE } from '../../apps/frontend/src/lib/utils/route/route';
// OR use the path alias pattern from CONTEXT.md decision
```

**File: `tests/tests/utils/translations.ts`**

```typescript
// Current
import { locales as localeNames } from '../../../frontend/src/lib/i18n/translations';
import type { TranslationKey } from '../../../frontend/src/lib/types';
const TRANSL_DIR = path.join(TESTS_DIR, '../../frontend/src/lib/i18n/translations');

// All three references need updating
```

**Path Alias Implementation (Claude's discretion):**

Create `tests/tests/utils/paths.ts`:
```typescript
import path from 'path';
import { TESTS_DIR } from './testsDir';

/** Root of the repository */
export const REPO_ROOT = path.join(TESTS_DIR, '../..');

/** Frontend app directory */
export const FRONTEND_DIR = path.join(REPO_ROOT, 'apps', 'frontend');

/** Backend (Strapi) app directory */
export const BACKEND_DIR = path.join(REPO_ROOT, 'apps', 'strapi');
```

Then update imports:
```typescript
// buildRoute.ts
import { FRONTEND_DIR } from './paths';
const routeModule = path.join(FRONTEND_DIR, 'src/lib/utils/route/route');
// ... dynamic import or adjusted static import

// translations.ts
import { FRONTEND_DIR } from './paths';
const TRANSL_DIR = path.join(FRONTEND_DIR, 'src/lib/i18n/translations');
```

**Challenge:** The `import { ROUTE } from '../../../frontend/...'` is a static TypeScript import, not a filesystem path.join. Static imports cannot use variables. Two approaches:

1. **Simple approach:** Just update the relative paths directly (`../../../frontend/` becomes `../../apps/frontend/`). This works but doesn't add the path alias abstraction.

2. **Alias approach (CONTEXT.md decision):** Create a `paths.ts` with constants for filesystem operations (like `TRANSL_DIR`), but keep static imports as direct relative paths. Document the canonical paths in one place for future reference.

**Recommendation:** Use approach 2 -- create `paths.ts` for filesystem-based operations (translations reading), update static imports to new relative paths directly. The path alias provides value for the filesystem operations where `path.join` is used, but forcing dynamic imports for static TypeScript imports would add unnecessary complexity.

#### Category 7: Deployment & Other Config

**File: `render.example.yaml`**

| Property | Current | New |
|----------|---------|-----|
| `dockerfilePath: ./frontend/Dockerfile` | `dockerfilePath: ./apps/frontend/Dockerfile` |
| `dockerfilePath: ./backend/vaa-strapi/Dockerfile` | `dockerfilePath: ./apps/strapi/Dockerfile` |

**File: `.github/dependabot.yml`**

| Current | New |
|---------|-----|
| `directory: "/backend/vaa-strapi"` | `directory: "/apps/strapi"` |
| `directory: "/frontend"` | `directory: "/apps/frontend"` |

**File: `.husky/pre-commit`**

| Current | New |
|---------|-----|
| `cd frontend` | `cd apps/frontend` |

**File: `.lintstagedrc.json`**

References `yarn build:app-shared` which is NOT in package.json scripts. This is already broken or relies on a Turborepo passthrough. No path changes needed in this file, but it should be verified.

**File: `docs/scripts/docs-scripts.config.ts` (becomes `apps/docs/scripts/docs-scripts.config.ts`)**

| Current | New |
|---------|-----|
| `REPO_ROOT = join(DOCS_ROOT, '..')` | `REPO_ROOT = join(DOCS_ROOT, '../..')` (one more level up) |
| `FRONTEND_ROOT = join(REPO_ROOT, 'frontend')` | `FRONTEND_ROOT = join(REPO_ROOT, 'apps', 'frontend')` |

### Anti-Patterns to Avoid

- **Incremental moves:** Moving frontend first, then backend, then docs creates broken intermediate states. Yarn workspace resolution fails if package.json references a path that doesn't exist.
- **Symlinks as compatibility shim:** Creating `frontend -> apps/frontend` symlinks to avoid updating paths. This masks the real structure and creates confusion. Just update paths.
- **Updating Docker container internal paths unnecessarily:** The container-internal `/opt/` structure mirrors the repo. When the repo structure changes, the Dockerfile COPY paths change, but the container internal layout can remain the same if preferred. However, keeping them aligned is cleaner for debugging.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding all path references | Manual grep | Systematic inventory (this document) | Easy to miss references in YAML, JSON, shell scripts |
| Validating workspace resolution | Manual testing | `yarn install` then `yarn workspaces list` | Yarn validates all workspace references at install time |
| Validating TypeScript references | Manual checking | `yarn build` (Turborepo runs tsc for each workspace) | Build will fail on any broken reference |
| Validating Docker paths | Manual inspection | `yarn dev:start` (builds and starts all containers) | Docker build fails fast on missing COPY sources |

## Common Pitfalls

### Pitfall 1: Forgotten Path References
**What goes wrong:** A file deep in config (dependabot.yml, render.example.yaml) still references old paths. It works locally but fails in CI/deployment.
**Why it happens:** Searches miss YAML/JSON files, or the reference is in a comment or template.
**How to avoid:** Use the complete inventory in this document. After moving, run: `grep -r 'backend/vaa-strapi\|/frontend/' --include='*.json' --include='*.yml' --include='*.yaml' --include='*.ts' --include='*.js' --include='*.sh' --include='*.md' . | grep -v node_modules | grep -v .git`
**Warning signs:** CI fails on paths, deployment uses stale Dockerfile paths.

### Pitfall 2: Yarn Lock File Corruption
**What goes wrong:** Moving workspace directories without running `yarn install` leaves yarn.lock with stale entries referencing old paths.
**Why it happens:** yarn.lock contains workspace resolution metadata keyed by path.
**How to avoid:** After moving all directories and updating package.json workspaces, run `yarn install`. Yarn will update the lock file. Verify with `yarn workspaces list`.
**Warning signs:** `yarn install --immutable` fails in CI.

### Pitfall 3: Docker Volume Mount Mismatch
**What goes wrong:** Docker Compose volume mounts reference old host paths but container expects new internal paths, or vice versa.
**Why it happens:** Volume mounts have both a host path (relative to docker-compose file) and container path.
**How to avoid:** Host-side paths are relative to the docker-compose.yml file location. Since the child compose files move with their apps, `./` references stay correct. But the root compose `extends` paths must be updated, and the child compose `context: ../` paths need updating since depth changed.
**Warning signs:** Container starts but can't find source files for hot reload.

### Pitfall 4: git mv vs Manual Move
**What goes wrong:** Using `mv` instead of `git mv` loses git history for moved files.
**Why it happens:** Developer habit of using regular filesystem commands.
**How to avoid:** Always use `git mv` for directory moves. Git will track the rename and preserve blame history.
**Warning signs:** `git log --follow` stops at the move commit.

### Pitfall 5: Stale build:shared References in CI
**What goes wrong:** CI workflows reference `yarn build:shared` which was removed in Phase 8.
**Why it happens:** Phase 8 updated root package.json scripts but did not update CI workflow files.
**How to avoid:** Replace `yarn build:shared` with `yarn build` or `turbo run build --filter='./packages/*'` in all CI files as part of this phase.
**Warning signs:** CI fails immediately with "script not found".

### Pitfall 6: Strapi Plugin Workspace Path
**What goes wrong:** The Strapi plugin workspace path `backend/vaa-strapi/src/plugins/*` is not updated to `apps/strapi/src/plugins/*`.
**Why it happens:** Easy to overlook nested workspace entries.
**How to avoid:** Explicitly included in workspace array: `["packages/*", "apps/*", "apps/strapi/src/plugins/*"]`.
**Warning signs:** `yarn install` fails or plugin builds fail.

## Code Examples

### Workspace Configuration Update
```json
// package.json - workspaces field
// Source: User decision in CONTEXT.md
{
  "workspaces": [
    "packages/*",
    "apps/*",
    "apps/strapi/src/plugins/*"
  ]
}
```

### Frontend Dockerfile After Move
```dockerfile
# apps/frontend/Dockerfile
# Context: repo root (set by docker-compose)

FROM node:20.18.1-alpine AS base
WORKDIR /opt
ENV YARN_VERSION=4.6
RUN corepack enable && corepack prepare yarn@${YARN_VERSION}
ENV HUSKY=0

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps apps
COPY packages packages
RUN yarn install --immutable

FROM base AS shared
WORKDIR /opt
RUN yarn build

FROM base AS frontend
WORKDIR /opt
COPY --from=shared /opt/packages packages
COPY --from=shared /opt/apps/frontend apps/frontend

FROM frontend AS development
WORKDIR /opt
EXPOSE 5173
CMD yarn workspace @openvaa/frontend dev --host

FROM frontend AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt
RUN yarn workspace @openvaa/frontend build
EXPOSE 3000
CMD node ./apps/frontend/build/index.js
```

### Test Path Alias
```typescript
// tests/tests/utils/paths.ts
// Source: New file implementing CONTEXT.md path alias decision
import path from 'path';
import { TESTS_DIR } from './testsDir';

/** Root of the monorepo */
export const REPO_ROOT = path.join(TESTS_DIR, '../..');

/** Frontend application directory */
export const FRONTEND_DIR = path.join(REPO_ROOT, 'apps', 'frontend');

/** Backend (Strapi) application directory */
export const STRAPI_DIR = path.join(REPO_ROOT, 'apps', 'strapi');
```

### Docs Config Update
```typescript
// apps/docs/scripts/docs-scripts.config.ts
// Key change: REPO_ROOT goes up two levels instead of one
export const DOCS_ROOT = process.cwd();
export const REPO_ROOT = join(DOCS_ROOT, '../..');  // was: join(DOCS_ROOT, '..')
export const FRONTEND_ROOT = join(REPO_ROOT, 'apps', 'frontend');  // was: join(REPO_ROOT, 'frontend')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `backend/` + `frontend/` at root | `apps/` directory | Standard monorepo convention (Turborepo, Nx docs) | Cleaner separation of apps vs libraries |
| `build:shared` script | `turbo run build` with dependency graph | Phase 8 (2026-03-12) | CI workflows still reference old script |

**Deprecated/outdated:**
- `yarn build:shared` -- removed in Phase 8 but still referenced in 3 CI workflow files and Dockerfiles. Must be replaced during this phase.

## Open Questions

1. **Dockerfile `build:shared` vs `yarn build`**
   - What we know: Phase 8 removed `build:shared` from package.json and replaced with Turborepo `yarn build`. Both Dockerfiles still use `RUN yarn build:shared` in their `shared` stage.
   - What's unclear: Whether replacing with `yarn build` (which builds ALL workspaces) is acceptable in Docker context, or if a more targeted command like `turbo run build --filter='./packages/*'` is preferred for build speed.
   - Recommendation: Use `yarn build` in Dockerfiles. Turborepo caching means building all packages is cheap, and it ensures everything needed is built. The `--filter='./packages/*'` variant is also acceptable for faster Docker builds.

2. **`.lintstagedrc.json` references `build:app-shared`**
   - What we know: This script is not in root package.json. It may have been removed in Phase 8 or was already broken.
   - What's unclear: Whether lint-staged is currently functional.
   - Recommendation: Verify if this works. If `build:app-shared` doesn't exist, replace with `turbo run build --filter=@openvaa/app-shared...` or remove if lint-staged handles it differently.

3. **Production Docker Compose**
   - What we know: No production `docker-compose.yml` exists at the repo root (only `docker-compose.dev.yml`). The `render.example.yaml` handles deployment.
   - What's unclear: Whether any external deployment scripts reference old paths.
   - Recommendation: Update `render.example.yaml` and document the change in deployment docs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 (E2E) + Vitest ^2.1.8 (unit) |
| Config file | `tests/playwright.config.ts` (E2E), per-package `vitest.config.ts` (unit) |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit && yarn test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIR-01 | Apps moved to apps/ directory | smoke | `yarn workspaces list` (verifies all workspaces resolve) | N/A (manual verification) |
| DIR-02 | Docker Compose starts correctly | integration | `yarn dev:start` (builds and starts full stack) | N/A (manual verification) |
| DIR-03 | CI workflows updated | smoke | Verify in CI run (push to branch) | N/A (CI-based) |
| DIR-04 | E2E tests pass | e2e | `yarn test:e2e` | Existing tests |
| DIR-05 | TypeScript references work | smoke | `yarn build` (builds all packages and apps) | N/A (build-based) |

### Sampling Rate
- **Per task commit:** `yarn install && yarn build && yarn test:unit`
- **Per wave merge:** `yarn dev:start && yarn test:e2e && yarn dev:down`
- **Phase gate:** Full stack start + all E2E tests pass

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files needed. The validation is inherent: if paths are wrong, `yarn install`, `yarn build`, or `yarn test:e2e` will fail.

## Sources

### Primary (HIGH confidence)
- Direct file inspection of all referenced files in the repository
- User decisions documented in `09-CONTEXT.md`
- Phase 8 completion context in `STATE.md`

### Secondary (MEDIUM confidence)
- Yarn 4 workspaces documentation (glob pattern support for workspace discovery)
- Turborepo workspace detection (auto-discovers from Yarn workspaces)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new tools, purely path updates on existing infrastructure
- Architecture: HIGH - Complete file-by-file inventory verified against actual repository contents
- Pitfalls: HIGH - Based on direct inspection of actual configuration files and their dependencies

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- no external dependencies to become outdated)

# Phase 9: Directory Restructure - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Move frontend, backend (Strapi), and docs into an `apps/` directory so the monorepo follows the standard `apps/` + `packages/` convention. Update all tooling (Docker, CI, TypeScript, Yarn workspaces, Turborepo) for the new paths. E2E tests must continue passing. This phase does NOT add new apps, change build pipelines (Phase 8 done), or modify package publishing setup (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### What moves to apps/
- All three applications move: frontend, backend (Strapi), and docs
- `backend/vaa-strapi/` flattens to `apps/strapi/` (remove the extra nesting level)
- `tests/` stays at the project root — it's cross-cutting, not an app
- `packages/` stays at root (unchanged)

### Directory naming
- `apps/frontend/` — keeps current name, matches @openvaa/frontend package name
- `apps/strapi/` — flattened from `backend/vaa-strapi/`, matches @openvaa/strapi package name
- `apps/docs/` — keeps current name, matches @openvaa/docs package name
- No renames to package names — all stay as-is

### Yarn workspace configuration
- Use `apps/*` glob pattern for app workspaces (auto-discovers new apps)
- Strapi plugins remain as workspaces: `apps/strapi/src/plugins/*`
- Full workspace list: `["packages/*", "apps/*", "apps/strapi/src/plugins/*"]`

### E2E tests handling
- Tests directory stays at root, not a Yarn workspace
- Introduce path aliases (FRONTEND_DIR, BACKEND_DIR constants in a test config file) instead of raw relative paths — survives future moves
- API URLs are unaffected (tests hit localhost endpoints, not filesystem paths)
- Test data paths are filesystem-local to tests/ directory — no changes needed

### CI workflow updates
- Update `docs/**` path trigger to `apps/docs/**` in `.github/workflows/docs.yml`
- No expanded triggers (don't add shared package paths as triggers)

### Claude's Discretion
- Migration approach (big-bang vs incremental moves)
- Exact path alias implementation in test config
- Order of operations for Docker/CI/TypeScript updates
- Whether to update the docs CI `build:shared` reference to `yarn build` (Phase 8 change)
- How to handle Dockerfile context paths after flattening

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Root `docker-compose.dev.yml` extends from child docker-compose files — both need path updates
- `turbo.json` already configured from Phase 8 — may not need changes (Turborepo uses workspace detection)
- Playwright config at `tests/playwright.config.ts` — has `TESTS_DIR` utility already, good pattern for path aliases

### Established Patterns
- Yarn 4 workspaces with `workspace:^` protocol for inter-package deps
- Docker Compose `extends` pattern: root compose extends service-specific compose files
- Frontend Dockerfile context is `../` (parent dir), backend context is `../../` (repo root) — both change with flattening
- CI uses `yarn install --immutable` + specific build commands

### Integration Points
- Root `package.json` workspaces array — must update
- Root `docker-compose.dev.yml` — extends paths, volume mounts
- `frontend/docker-compose.dev.yml` — volume mounts reference `../packages`
- `backend/vaa-strapi/docker-compose.dev.yml` — context `../../`, volume mounts
- Frontend and backend Dockerfiles — COPY paths, context assumptions
- `.github/workflows/docs.yml` — path triggers, `cd docs` commands
- TypeScript project references in `tsconfig.json` files across packages
- Any `import` paths that reference `backend/` or `frontend/` relatively

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard monorepo conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-directory-restructure*
*Context gathered: 2026-03-12*

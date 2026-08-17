# Phase 12: Polish and Optimization - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Final milestone polish: enable Vercel remote caching for CI and local builds, upgrade Yarn to 4.10+ with catalogs for centralized dependency versions, and add per-workspace lint/typecheck pipelines running through Turborepo with caching. This phase does NOT add new features, change build tooling (Phase 11 done), or modify package publishing.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation details are at Claude's discretion. The requirements (POL-01, POL-02, POL-03) are well-scoped and technically straightforward:

- **POL-01 (Vercel remote cache):** Claude decides scope (CI-only vs CI+local), token configuration approach, and turbo.json remote cache settings
- **POL-02 (Yarn upgrade + catalogs):** Claude decides which dependencies to centralize via catalogs, migration approach from 4.6 to 4.10+, and how to handle workspace-specific overrides
- **POL-03 (Lint/typecheck pipelines):** Claude decides whether to use per-package ESLint configs or a shared root config, whether typecheck is a separate turbo task or combined with build, and caching strategy

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches and best practices.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Turborepo already configured (`turbo.json`) with `build` and `test:unit` tasks — add `lint` and `typecheck` tasks
- ESLint config exists at root level — currently runs as monolithic command across all directories
- Shared TypeScript config at `packages/shared-config/tsconfig.base.json`
- Yarn 4.6.0 with `nodeLinker: node-modules` in `.yarnrc.yml`

### Established Patterns
- Root `package.json` lint scripts: `lint:check` and `lint:fix` run ESLint across `apps/strapi/src apps/strapi/tests apps/frontend packages tests`
- No per-workspace `lint` or `typecheck` scripts exist — these need creation
- Turborepo task pattern: `dependsOn: ["^build"]` for topological ordering
- `test:unit` has `cache: false` — lint/typecheck can likely be cached

### Integration Points
- `turbo.json` — add `lint` and `typecheck` task definitions
- Per-package `package.json` — add `lint` and `typecheck` scripts
- Root `package.json` — update `lint:check` and `lint:fix` to use `turbo run lint`
- `.yarnrc.yml` — update `yarnPath` after Yarn upgrade
- CI workflows — benefit from remote cache automatically once configured

</code_context>

<deferred>
## Deferred Ideas

- Native frontend dev without Docker (deferred from Phase 8)
- VER-04 changeset bot (deferred from Phase 10 — low priority, can be done anytime)

</deferred>

---

*Phase: 12-polish-and-optimization*
*Context gathered: 2026-03-13*

# Phase 13: Tech Debt Cleanup - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve 9 accumulated tech debt items identified by v1.1 milestone audit — version string mismatches, stale documentation, dead code. No new features, no requirement gaps (those are Phase 14).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All 9 items are well-defined by the milestone audit. Claude has full discretion on implementation approach:

1. **`.husky/pre-commit` cd depth** — Fix so it always lands at monorepo root before running `yarn lint-staged`
2. **`STRAPI_DIR` dead export** — Remove unused export from `tests/tests/utils/paths.ts`
3. **Stale docs paths** — Update 45 references from `backend/vaa-strapi` to `apps/strapi` in `apps/docs/src/`
4. **Stale README references** — Update 4 package READMEs (core, data, matching, filters) to reflect tsup instead of tsc-esm-fix
5. **Frontend `packageManager`** — Update `apps/frontend/package.json` from `yarn@4.6.0` to `yarn@4.13.0`
6. **Strapi `packageManager`** — Update `apps/strapi/package.json` from `yarn@4.6.0` to `yarn@4.13.0`
7. **Root `engine.yarn`** — Update from `4.6` to `4.13` in root `package.json`
8. **Dockerfile `YARN_VERSION`** — Update from `4.6` to `4.13.0` in both Dockerfiles
9. **`docs.yml` Yarn setup** — Add explicit Yarn version pinning (match `release.yml` pattern with `setup-yarn-action`)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — user chose to skip discussion. All items are mechanical fixes defined by the v1.1 milestone audit.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `release.yml` uses `threeal/setup-yarn-action@v2` with `version: 4.13` — pattern for docs.yml fix

### Established Patterns
- Root `packageManager: yarn@4.13.0` is the source of truth for Yarn version
- `apps/docs/src/` contains markdown files with GitHub-style file path references

### Integration Points
- `.husky/pre-commit` → `apps/frontend/` (lint-staged)
- `docs.yml` → `apps/docs/` (build and deploy)
- Dockerfiles → `apps/frontend/`, `apps/strapi/` (container builds)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-tech-debt-cleanup*
*Context gathered: 2026-03-15*

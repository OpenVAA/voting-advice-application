# Phase 18: Dependency Modernization - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Update all non-Strapi monorepo dependencies to latest compatible versions, remove unused packages across all workspaces, fix pre-existing build failures to the extent needed for E2E validation, and expand the Yarn catalog to cover all shared dependencies. Strapi package versions are NOT bumped. Docker/CI/E2E verification is Phase 19.

</domain>

<decisions>
## Implementation Decisions

### Update strategy
- Update all deps to latest compatible versions, including major bumps (e.g., Vite 5→6, @types/node 20→22)
- Update all workspaces in one pass (not sequenced by dependency order), then run `yarn install` once
- Vite bumped to 6 — SvelteKit 2 supports it, @sveltejs/vite-plugin-svelte 4 expects it
- Strapi deps are NOT bumped — leave all Strapi package versions as-is given planned Supabase migration

### Yarn catalog expansion
- Expand catalog to cover all shared deps (not just the current 13 entries)
- Any dep used across 2+ workspaces should be in the catalog as single source of truth
- Workspace package.json files use `catalog:` references for shared deps

### Unused dependency audit
- Full audit of every dep across all workspaces for actual usage
- Remove Capacitor packages (`@capacitor/android`, `cli`, `core`, `ios`) from frontend deps
- Delete `apps/frontend/capacitor.config.ts` — Capacitor was never used
- Move `ai` package from frontend deps to `packages/llm` only — frontend doesn't import it directly
- Remove `jest` from frontend and Strapi devDeps if no test files import from jest (vitest is the test runner)
- Audit and remove other unused deps: `supertest`, `sqlite3`, `yalc`, etc. — check actual imports before removing

### Build failure handling
- Fix `@openvaa/llm` build issues if feasible (bump ai SDK deps, fix breaking changes). If complex, document with workaround
- Fix Strapi TS errors in `generateMockData.ts` only to the extent required for Strapi to build/start — E2E validation in Phase 19 needs a working Strapi
- Do NOT fix Strapi TS errors beyond what's needed for build/start
- Run `yarn build` as quick smoke test after all dep updates to catch obvious breakage

### Claude's Discretion
- Which additional deps to add to Yarn catalog beyond the obvious shared ones
- Exact fix approach for llm package build issues after ai SDK bump
- Whether to update `@types/node` to match actual Node.js version or keep it as a compatible range
- Fix strategy for Strapi generateMockData.ts TS errors (minimal type assertions vs proper typing)
- Whether `react-is@19` / `react@18` mismatch in Strapi needs attention (Strapi deps are untouched, but this may cause warnings)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dependency management
- `.yarnrc.yml` — Yarn catalog definitions, current 13 catalog entries
- `package.json` (root) — Root devDependencies, workspace definitions
- `turbo.json` — Turborepo pipeline config, may need updates if scripts change

### Workspace package files
- `apps/frontend/package.json` — Frontend deps including Capacitor (to remove), ai (to move), jest (to audit)
- `apps/strapi/package.json` — Strapi deps (versions NOT bumped, but jest/unused deps audited)
- `packages/llm/package.json` — LLM package deps, ai SDK versions
- `packages/core/package.json`, `packages/data/package.json`, `packages/matching/package.json`, `packages/filters/package.json`, `packages/app-shared/package.json` — Core package deps

### Build issues
- `apps/strapi/src/util/generateMockData.ts` — Pre-existing TS errors, fix only for build/start
- `packages/llm/src/` — ai SDK usage files, may need updates after bump

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Yarn catalog in `.yarnrc.yml`: Already defines 13 shared dep versions — extend this pattern
- `packages/shared-config`: Shared ESLint, TypeScript, and build configs — may need version alignment

### Established Patterns
- `catalog:` references in package.json for shared deps — expand to cover all shared deps
- `workspace:^` for internal @openvaa/* deps — no changes needed
- tsup builds for publishable packages (core, data, matching, filters) — verify these still work after bumps

### Integration Points
- `apps/frontend/capacitor.config.ts` — Delete entirely (Capacitor removal)
- All workspace `package.json` files — Updated dep versions
- `.yarnrc.yml` — Expanded catalog entries
- `yarn.lock` — Regenerated after all updates

</code_context>

<specifics>
## Specific Ideas

- Capacitor has never been used — remove all traces from the repo, not just deps
- Frontend doesn't import `ai` directly — it goes through `@openvaa/llm` workspace dep. Clean dependency boundary.
- Strapi deps untouched because Supabase migration makes Strapi investment low-value, but Strapi must still build/start for E2E testing
- The "fix TS errors unless complicated" approach for Strapi is pragmatic — just enough to unblock Phase 19

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-dependency-modernization*
*Context gathered: 2026-03-16*

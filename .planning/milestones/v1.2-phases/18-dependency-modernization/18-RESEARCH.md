# Phase 18: Dependency Modernization - Research

**Researched:** 2026-03-16
**Domain:** Monorepo dependency management, Yarn catalog, Vite/SvelteKit ecosystem
**Confidence:** HIGH

## Summary

Phase 18 updates all non-Strapi dependencies to latest compatible versions, removes unused packages, and expands the Yarn catalog. The key upgrade chain is Vite 5 to 6, which cascades into required upgrades of `@sveltejs/vite-plugin-svelte` (4 to 5), vitest (2 to 3), and `@vitest/coverage-v8` (2 to 3). The docs workspace is already on newer versions (Vite 7, vite-plugin-svelte 6+, vitest 4) and should NOT be downgraded -- these workspaces can coexist at different major versions since Yarn/npm resolves them independently per workspace.

ESLint stays at v9 because `eslint-plugin-import` does not support ESLint 10 (only up to v9). Migrating to `eslint-plugin-import-x` (which supports ESLint 10) would require config changes beyond this phase's scope. The AI SDK (`ai` package) stays at v5 because v6 has significant breaking changes (`generateObject` deprecated, `CoreMessage` removed, type changes) that would require substantial refactoring of `@openvaa/llm`.

**Primary recommendation:** Execute all updates in a single coordinated pass, run `yarn install` once, then `yarn build` to verify. Structure work as: (1) catalog expansion + unused dep removal, (2) version bumps across all workspaces, (3) build verification and fix-up.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Update all deps to latest compatible versions, including major bumps (e.g., Vite 5->6, @types/node 20->22)
- Update all workspaces in one pass (not sequenced by dependency order), then run `yarn install` once
- Vite bumped to 6 -- SvelteKit 2 supports it, @sveltejs/vite-plugin-svelte 4 expects it
- Strapi deps are NOT bumped -- leave all Strapi package versions as-is given planned Supabase migration
- Expand catalog to cover all shared deps (not just the current 13 entries)
- Any dep used across 2+ workspaces should be in the catalog as single source of truth
- Workspace package.json files use `catalog:` references for shared deps
- Full audit of every dep across all workspaces for actual usage
- Remove Capacitor packages (`@capacitor/android`, `cli`, `core`, `ios`) from frontend deps
- Delete `apps/frontend/capacitor.config.ts` -- Capacitor was never used
- Move `ai` package from frontend deps to `packages/llm` only -- frontend doesn't import it directly
- Remove `jest` from frontend and Strapi devDeps if no test files import from jest (vitest is the test runner)
- Audit and remove other unused deps: `supertest`, `sqlite3`, `yalc`, etc. -- check actual imports before removing
- Fix `@openvaa/llm` build issues if feasible (bump ai SDK deps, fix breaking changes). If complex, document with workaround
- Fix Strapi TS errors in `generateMockData.ts` only to the extent required for Strapi to build/start -- E2E validation in Phase 19 needs a working Strapi
- Do NOT fix Strapi TS errors beyond what's needed for build/start
- Run `yarn build` as quick smoke test after all dep updates to catch obvious breakage

### Claude's Discretion
- Which additional deps to add to Yarn catalog beyond the obvious shared ones
- Exact fix approach for llm package build issues after ai SDK bump
- Whether to update `@types/node` to match actual Node.js version or keep it as a compatible range
- Fix strategy for Strapi generateMockData.ts TS errors (minimal type assertions vs proper typing)
- Whether `react-is@19` / `react@18` mismatch in Strapi needs attention (Strapi deps are untouched, but this may cause warnings)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEP-01 | All monorepo workspace dependencies updated to latest compatible versions | Version matrix below identifies exact target versions for every dependency; Vite 5->6 cascade chain documented |
| DEP-02 | Unused dependencies removed (Capacitor packages, etc.) | Import audit confirms: `ai` not imported in frontend src, Capacitor not imported anywhere, `jest` not imported in frontend, `sqlite3`/`yalc` not imported in Strapi src |
| DEP-03 | Pre-existing build failures resolved or documented (ai package, Strapi TS errors) | LLM package currently builds successfully on ai@5; Strapi builds and typechecks cleanly; ai v6 migration would require significant refactoring -- stay on v5 |
| DEP-04 | Yarn catalog updated with new dependency versions | Full dependency cross-workspace map identifies 25+ deps used in 2+ workspaces eligible for catalog |
</phase_requirements>

## Standard Stack

### Version Upgrade Chain (Vite 6 Cascade)

This is the critical dependency chain. All four must upgrade together:

| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| `vite` | ^5.4.11 | ^6.4.1 | User decision: bump to Vite 6 |
| `@sveltejs/vite-plugin-svelte` | ^4.0.4 | ^5.1.1 | v4 requires Vite 5; v5 requires Vite 6 |
| `vitest` | ^2.1.8 (catalog) | ^3.2.4 | v2 requires Vite 5; v3 supports Vite 5/6/7 |
| `@vitest/coverage-v8` | ^2.1.8 | ^3.2.4 | Must match vitest major version |

**Confidence:** HIGH -- verified via `npm view` peer dependency checks.

### Frontend Dependencies Update Targets

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| `@sveltejs/kit` | ^2.55.0 | ^2.55.0 | Already latest; supports Vite 5/6/7/8 |
| `@sveltejs/adapter-node` | ^5.5.4 | ^5.5.4 | Already latest SvelteKit 2-compatible |
| `svelte` | ^5.53.12 | ^5.53.12 | Already latest |
| `svelte-check` | ^4.4.5 | ^4.4.5 | Already latest |
| `@tailwindcss/vite` | ^4.2.1 | ^4.2.1 | Already supports Vite 6 |
| `tailwindcss` | ^4.2.1 | ^4.2.1 | Already latest |
| `daisyui` | ^5 | ^5.5.14 | Pin to latest v5 |
| `eslint-plugin-svelte` | ^2.46.1 | ^2.46.1 | Keep v2; v3 only needed for ESLint 10 |
| `svelte-eslint-parser` | ^0.43.0 | ^1.6.0 | Latest |
| `prettier-plugin-svelte` | ^3.3.2 | ^3.5.1 | Latest v3 |
| `prettier-plugin-tailwindcss` | ^0.6.9 | ^0.7.2 | Latest |
| `jsdom` | ^24.1.3 | ^26.1.0 | Major bump, latest compatible |
| `zod` | ^4.0.0 | ^4.3.6 | Latest v4 |
| `jose` | ^5.9.6 | ^6.2.1 | Major bump available |
| `isomorphic-dompurify` | ^2.19.0 | ^3.3.0 | Major bump available |
| `qs` | ^6.13.1 | ^6.15.0 | Latest v6 |
| `flat-cache` | ^6.1.7 | ^6.1.20 | Latest |
| `intl-messageformat` | ^10.7.11 | ^11.1.3 | Major bump available |
| `@inlang/paraglide-js` | ^2.15.0 | ^2.15.0 | Already latest |

### Packages to Stay at Current Versions

| Package | Current | Why Not Bump |
|---------|---------|--------------|
| `eslint` | ^9.39.2 | `eslint-plugin-import` doesn't support v10 |
| `ai` | ^5.0.0 | v6 has breaking changes (generateObject deprecated, CoreMessage removed); LLM refactor out of scope |
| `@ai-sdk/openai` | ^2.0.31 | Stays on v2 to match ai@5 |
| `@ai-sdk/google` | ^2.0.20 | Stays on v2 to match ai@5 |
| `@faker-js/faker` | ^8.4.1 | v10 is ESM-only, may break Strapi CJS context; v9 changes seed behavior |
| All `@strapi/*` packages | ^5.9.0 | Locked decision: Strapi deps NOT bumped |

### Root DevDependencies Update Targets

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| `@types/node` | ^20.17.12 | ^22.19.15 | Match Node 22 (or keep ^20 if engine stays 20) |
| `turbo` | ^2.8.16 | ^2.8.17 | Latest |
| `tsup` | ^8.5.1 | ^8.5.1 | Already latest |
| `husky` | ^9.1.7 | ^9.1.7 | Already latest |
| `lint-staged` | ^16.2.7 | ^16.4.0 | Latest |
| `@playwright/test` | ^1.58.2 | ^1.58.2 | Already latest |
| `dotenv` | ^16.4.7 | ^17.3.1 | Major bump available |
| `glob` | ^11.0.0 | ^11.0.0 | Already latest |

### Catalog Dependencies (Stays at Current or Minor Bump)

| Package | Current Catalog | Target Catalog | Notes |
|---------|----------------|----------------|-------|
| `typescript` | ^5.7.3 | ^5.8.3 | Latest TS 5 |
| `vitest` | ^2.1.8 | ^3.2.4 | Must bump for Vite 6 |
| `eslint` | ^9.39.2 | ^9.39.2 | Keep v9 |
| `prettier` | ^3.7.4 | ^3.7.4 | Already latest |
| `tsx` | ^4.19.2 | ^4.19.2 | Already latest |
| `@typescript-eslint/eslint-plugin` | ^8.19.1 | ^8.57.0 | Latest v8 |
| `@typescript-eslint/parser` | ^8.19.1 | ^8.57.0 | Latest v8 |
| `eslint-plugin-simple-import-sort` | ^12.1.1 | ^12.1.1 | Already latest |
| `eslint-plugin-import` | ^2.32.0 | ^2.32.0 | Already latest |
| `@eslint/eslintrc` | ^3.2.0 | ^3.2.0 | Already latest |
| `@eslint/js` | ^9.39.1 | ^9.39.1 | Already latest |
| `globals` | ^15.14.0 | ^15.14.0 | Keep v15; docs uses ^16.5.0 independently |

## Architecture Patterns

### Yarn Catalog Expansion Strategy

The current catalog has 13 entries. The following deps are used across 2+ workspaces and should be added:

**New catalog entries (deps used in 2+ workspaces):**

| Package | Workspaces | Target Version |
|---------|-----------|----------------|
| `@types/node` | root, frontend, docs | ^22.19.15 |
| `@faker-js/faker` | root, strapi | ^8.4.1 |
| `@playwright/test` | root, docs | ^1.58.2 |
| `dotenv` | root, arg-condensation | ^17.3.1 |
| `zod` | frontend, llm, question-info | ^4.3.6 |
| `@sveltejs/kit` | frontend, docs | ^2.55.0 |
| `svelte` | frontend, docs | ^5.53.12 |
| `svelte-check` | frontend, docs | ^4.4.5 |
| `@tailwindcss/vite` | frontend, docs | ^4.2.1 |
| `tailwindcss` | frontend, docs | ^4.2.1 |
| `daisyui` | frontend, docs | ^5.5.14 |
| `eslint-plugin-svelte` | frontend, docs | ^2.46.1 |
| `prettier-plugin-svelte` | frontend, docs | ^3.5.1 |
| `prettier-plugin-tailwindcss` | frontend, docs | ^0.7.2 |
| `eslint-config-prettier` | shared-config, docs | ^10.1.8 |
| `js-yaml` | arg-condensation, question-info | ^4.1.0 |
| `@types/js-yaml` | arg-condensation, question-info | ^4.0.9 |
| `ai` | frontend(to-remove), llm | ^5.0.154 |

**Note on docs workspace:** The docs workspace uses significantly newer versions of several packages (Vite 7, vite-plugin-svelte 6+, vitest 4). For packages where docs uses a different major version than frontend, do NOT add to catalog -- let each workspace manage its own version. Catalog entries should only cover packages where the same version range works across all consumers.

**Packages that should NOT go in catalog despite 2+ usage:**
- `vite` -- frontend uses ^6.4.1, docs uses ^7.2.6 (different majors)
- `vitest` -- BUT actually needs re-evaluation: packages use catalog vitest, and vitest 3 supports Vite 5/6/7, so the catalog vitest@^3.2.4 could work for both frontend packages AND could work for docs if docs is willing to downgrade to vitest 3 from 4. However docs already pinned vitest@4 for Vite 7 compatibility. Keep vitest out of docs workspace catalog ref, let docs manage independently.
- `@sveltejs/vite-plugin-svelte` -- frontend ^5.1.1, docs ^6.2.1 (different majors)

### Dependency Removal Audit Results

**Confirmed unused (safe to remove):**

| Package | Workspace | Evidence |
|---------|-----------|----------|
| `@capacitor/android` | frontend deps | Zero imports in `apps/frontend/src/` |
| `@capacitor/cli` | frontend deps | Zero imports in `apps/frontend/src/` |
| `@capacitor/core` | frontend deps | Zero imports in `apps/frontend/src/` |
| `@capacitor/ios` | frontend deps | Zero imports in `apps/frontend/src/` |
| `ai` | frontend deps | Zero imports in `apps/frontend/src/`; used only via `@openvaa/llm` workspace dep |
| `jest` | frontend devDeps | Zero imports in `apps/frontend/`; vitest is the test runner |
| `sqlite3` | strapi devDeps | Zero imports in `apps/strapi/src/` |
| `yalc` | strapi devDeps | Zero imports/references in `apps/strapi/` |

**Requires careful consideration:**

| Package | Workspace | Situation |
|---------|-----------|-----------|
| `jest` | strapi devDeps | `apps/strapi/tests/app.test.js` uses jest globals; `test:e2e` script runs `jest`. However, these are legacy tests. Keep jest in Strapi for now since `test:e2e` depends on it. |
| `supertest` | strapi devDeps | Used in `apps/strapi/tests/election/index.js` and `tests/user/index.js`. Keep -- these legacy tests still reference it. |
| `@testing-library/jest-dom` | frontend devDeps | Provides matchers -- check if any test files use `.toBeInTheDocument()` etc. If vitest tests use it, keep it. |
| `@faker-js/faker` | root devDeps | Not imported in `tests/` directory. May be unused at root level. Check if any root-level scripts use it before removing. |

**Files to delete:**
- `apps/frontend/capacitor.config.ts` -- Capacitor config file, never used

### Update Execution Order

1. **Catalog expansion** -- Add all new catalog entries with target versions
2. **Update existing catalog entries** -- Bump vitest, typescript, @typescript-eslint/*
3. **Remove unused deps** from workspace package.json files
4. **Update workspace-specific deps** -- Vite, vite-plugin-svelte, etc.
5. **Convert shared deps to catalog: references** in workspace package.json files
6. **Delete capacitor.config.ts**
7. **Run `yarn install`** to regenerate yarn.lock
8. **Run `yarn build`** to verify all packages compile
9. **Fix any build breaks** from version bumps

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dep version audit | Manual `npm outdated` per workspace | `yarn upgrade-interactive` or systematic `npm view` checks | Monorepo has 14 workspaces; manual tracking misses transitive issues |
| Unused dep detection | Manual grep per package | Systematic import search + build verification | Some deps are used indirectly (type-only, or via test globals) |
| Catalog version sync | Manual editing of each package.json | Yarn catalog `catalog:` references | Single source of truth eliminates version drift |

## Common Pitfalls

### Pitfall 1: Vite/Vitest Version Mismatch
**What goes wrong:** Upgrading Vite to 6 but leaving vitest at 2 causes `vitest` to internally install Vite 5, creating duplicate Vite instances and mysterious build failures.
**Why it happens:** vitest declares `vite` as a dependency (not peer dep), so `vitest@2` pulls in `vite@^5.0.0` regardless of the workspace's own vite version.
**How to avoid:** Always upgrade vitest and vite together. Vitest 3 declares `vite: '^5.0.0 || ^6.0.0 || ^7.0.0'` as its dependency.
**Warning signs:** Duplicate vite versions in `yarn.lock`, HMR failures, different config being applied.

### Pitfall 2: @sveltejs/vite-plugin-svelte Version Mismatch
**What goes wrong:** `@sveltejs/vite-plugin-svelte@4` has `peerDependencies: { "vite": "^5.0.0" }`. Installing it alongside Vite 6 produces peer dependency warnings and may cause runtime issues.
**Why it happens:** Each major version of the plugin targets a specific Vite major.
**How to avoid:** Use `@sveltejs/vite-plugin-svelte@5` with `vite@6`. Verified: v5.1.1 has `peerDependencies: { "vite": "^6.0.0", "svelte": "^5.0.0" }`.
**Warning signs:** `yarn install` peer dependency warnings.

### Pitfall 3: Docs Workspace Version Divergence
**What goes wrong:** The docs workspace (`apps/docs`) already uses Vite 7, vite-plugin-svelte 6+, and vitest 4. Forcing catalog versions (e.g., vitest 3) on docs would break it.
**Why it happens:** Docs was scaffolded or updated independently with newer versions.
**How to avoid:** For packages where docs uses a different major version, do NOT use catalog references in docs. Let docs manage its own version pins. Only use catalog for packages where all consumers can share the same version range.
**Warning signs:** Docs build failures after catalog changes.

### Pitfall 4: Sass Modern API Default in Vite 6
**What goes wrong:** Vite 6 defaults to the modern Sass API. If the project uses Sass features incompatible with the modern API, builds break.
**Why it happens:** Vite 6 changed the default from legacy to modern Sass API.
**How to avoid:** This project uses Tailwind CSS 4 with its own `@tailwindcss/vite` plugin and does not use Sass preprocessing. No Sass-related changes needed.
**Warning signs:** N/A for this project.

### Pitfall 5: ESLint Plugin Compatibility Wall
**What goes wrong:** Attempting to upgrade ESLint to v10 breaks `eslint-plugin-import` which only supports up to v9.
**Why it happens:** `eslint-plugin-import` peer dependency: `"eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9"`.
**How to avoid:** Keep ESLint at v9 in this phase. ESLint 10 migration requires switching to `eslint-plugin-import-x` and updating ESLint config, which is separate scope.
**Warning signs:** ESLint plugin peer dependency errors on install.

### Pitfall 6: AI SDK v6 Breaking Changes
**What goes wrong:** Bumping `ai` from v5 to v6 breaks the LLM package: `generateObject` is deprecated (replaced by `generateText` with `output`), `CoreMessage` type is removed, `ToolCallOptions` renamed.
**Why it happens:** AI SDK v6 is a major redesign with substantial API changes.
**How to avoid:** Stay on `ai@^5.0.154` (latest v5 patch). The LLM package builds and works fine on v5. Document that v6 migration is deferred.
**Warning signs:** Type errors in `packages/llm/src/llm-providers/llmProvider.ts` after bumping ai.

### Pitfall 7: Strapi Jest/Supertest Dependency Chain
**What goes wrong:** Removing `jest` from Strapi devDeps breaks the `test:e2e` script which runs `jest --forceExit --detectOpenHandles`.
**Why it happens:** `apps/strapi/tests/app.test.js` uses jest globals, and `supertest` is imported in the test files.
**How to avoid:** Keep `jest` and `supertest` in Strapi devDeps. These legacy tests still work and may be used for Strapi integration testing. Only remove `jest` from frontend where vitest is the sole test runner.
**Warning signs:** `yarn workspace @openvaa/strapi test:e2e` fails.

## Code Examples

### Yarn Catalog Entry Format
```yaml
# .yarnrc.yml catalog section
catalog:
  typescript: ^5.8.3
  vitest: ^3.2.4
  eslint: ^9.39.2
  prettier: ^3.7.4
  tsx: ^4.19.2
  "@typescript-eslint/eslint-plugin": ^8.57.0
  "@typescript-eslint/parser": ^8.57.0
  eslint-plugin-simple-import-sort: ^12.1.1
  eslint-plugin-import: ^2.32.0
  "@eslint/eslintrc": ^3.2.0
  "@eslint/js": ^9.39.1
  globals: ^15.14.0
  # New entries
  "@types/node": ^22.19.15
  zod: ^4.3.6
  "@sveltejs/kit": ^2.55.0
  svelte: ^5.53.12
  svelte-check: ^4.4.5
  daisyui: ^5.5.14
  "@tailwindcss/vite": ^4.2.1
  tailwindcss: ^4.2.1
  "@faker-js/faker": ^8.4.1
  "@playwright/test": ^1.58.2
  eslint-config-prettier: ^10.1.8
  eslint-plugin-svelte: ^2.46.1
  prettier-plugin-svelte: ^3.5.1
  prettier-plugin-tailwindcss: ^0.7.2
  js-yaml: ^4.1.0
  "@types/js-yaml": ^4.0.9
```

### Workspace package.json Catalog Reference Pattern
```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:",
    "svelte": "catalog:",
    "svelte-check": "catalog:"
  }
}
```

### Vite 6 Config Changes
No config file changes expected. Vite 6 breaking changes that affect this project:
- `commonjsOptions.strictRequires` now defaults to `true` (may increase bundle size slightly)
- Range braces in globs no longer supported (check `import.meta.glob` usage)
- CSS minification enabled by default for SSR builds

The frontend `vite.config.ts` should work as-is with Vite 6, since it uses standard SvelteKit + Tailwind Vite plugins.

### Removing `--flag v10_config_lookup_from_file` After ESLint Stays at v9
The `--flag v10_config_lookup_from_file` flags in lint scripts are forward-compatibility flags for ESLint 10 config lookup behavior. Since we're staying on ESLint 9, these flags remain valid and should be kept for future-proofing. Do NOT remove them.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite 5 + vite-plugin-svelte 4 | Vite 6 + vite-plugin-svelte 5 | Dec 2024 | New default Sass API, stricter CJS, Environment API |
| Vitest 2 | Vitest 3 | Feb 2025 | Multi-project support, improved snapshots |
| AI SDK v5 | AI SDK v6 | Mar 2026 | generateObject deprecated, new output API |
| `eslint-plugin-import` | `eslint-plugin-import-x` | 2025-2026 | ESLint 10 support, better perf, exports support |
| Faker.js v8 | Faker.js v10 | 2025 | ESM-only in v10, seed behavior changes in v9 |

**Deprecated/outdated:**
- `@capacitor/*` packages: Never used in this project, safe to remove entirely
- `sqlite3` in Strapi: Strapi uses Postgres; sqlite3 was likely from initial Strapi scaffold
- `yalc` in Strapi: Development tool for local package testing, not actively used

## Open Questions

1. **`@types/node` version vs engine field**
   - What we know: Root `package.json` has `"engine": { "node": "20.18.1" }`. Current `@types/node` is `^20.17.12`. Latest is `^22.19.15`.
   - What's unclear: Should `@types/node` match the engine field (stay at ^20) or go to ^22 for broader type coverage?
   - Recommendation: Use `^22.19.15` -- it's backward-compatible for Node 20 code, and provides types for newer APIs. The engine field constrains runtime, not types. But if the planner prefers safety, `^20.19.37` is also fine.

2. **`@testing-library/jest-dom` in frontend**
   - What we know: Listed as frontend devDep. `jest` is being removed from frontend.
   - What's unclear: Whether vitest tests use jest-dom matchers (`.toBeInTheDocument()` etc.)
   - Recommendation: Search frontend test files for jest-dom matcher usage before removing. The package works with vitest (it's matcher-only, not jest-specific).

3. **`@faker-js/faker` in root devDeps**
   - What we know: Not imported in `tests/` directory (E2E tests).
   - What's unclear: Whether it's used by any root-level scripts or was added for convenience.
   - Recommendation: Remove from root if no usage found. It remains in Strapi devDeps where it's actually used.

4. **`react-is@19` / `react@18` mismatch in Strapi**
   - What we know: Strapi has `"react": "^18.3.1"` but `"react-is": "^19.0.0"`. This is a version mismatch.
   - What's unclear: Whether this causes actual issues or just warnings.
   - Recommendation: Leave as-is per "Strapi deps NOT bumped" rule. If it causes install warnings, document as known.

5. **Major bumps for `jose`, `isomorphic-dompurify`, `intl-messageformat`, `dotenv`**
   - What we know: These have major version bumps available.
   - What's unclear: Whether the major bumps have breaking API changes that affect usage in this codebase.
   - Recommendation: Check each package's migration guide before bumping. If API usage is simple (which it is for all four in this codebase), major bumps are likely safe.

## Validation Architecture

> `workflow.nyquist_validation` not explicitly set to false in config.json -- including validation section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 (after upgrade) |
| Config file | Individual `vitest.config.ts` per workspace |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn build && yarn test:unit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEP-01 | All deps updated to latest compatible | smoke | `yarn install && yarn build` | N/A -- build verification |
| DEP-02 | Unused deps removed | smoke | `yarn install` (no resolution warnings) | N/A -- install verification |
| DEP-03 | Build failures resolved/documented | smoke | `yarn build` (all workspaces succeed) | N/A -- build verification |
| DEP-04 | Catalog entries updated | smoke | `yarn install` (catalog resolves correctly) | N/A -- install verification |

### Sampling Rate
- **Per task commit:** `yarn install && yarn build`
- **Per wave merge:** `yarn build && yarn test:unit`
- **Phase gate:** Full `yarn build` succeeds, `yarn test:unit` passes

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. This phase is about dependency versions, not new test coverage.

## Sources

### Primary (HIGH confidence)
- `npm view` commands for all package versions and peer dependencies -- verified live against npm registry
- Workspace `package.json` files -- direct source code inspection
- `.yarnrc.yml` -- current catalog state

### Secondary (MEDIUM confidence)
- [Vite 5 to 6 Migration Guide](https://v6.vite.dev/guide/migration) -- official docs, verified
- [AI SDK v5 to v6 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) -- official docs
- [ESLint v10 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0) -- official docs
- [@sveltejs/vite-plugin-svelte releases](https://github.com/sveltejs/vite-plugin-svelte/releases) -- GitHub

### Tertiary (LOW confidence)
- [Faker.js v10 upgrade guide](https://fakerjs.dev/guide/upgrading) -- checked briefly, not deeply verified against Strapi CJS compatibility
- [eslint-plugin-import-x](https://github.com/un-ts/eslint-plugin-import-x) -- alternative for future ESLint 10 migration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, peer deps checked
- Architecture: HIGH -- catalog pattern already established, just expanding
- Pitfalls: HIGH -- Vite/vitest cascade verified empirically, ESLint/AI SDK limitations confirmed
- Unused deps: HIGH -- import searches performed across all relevant source directories

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (30 days -- versions are stable, ecosystem moves slowly)

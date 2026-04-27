# Phase 12: Polish and Optimization - Research

**Researched:** 2026-03-14
**Domain:** Build infrastructure optimization (Turborepo remote caching, Yarn catalogs, per-workspace lint/typecheck)
**Confidence:** HIGH

## Summary

Phase 12 covers three independent optimization tasks for the monorepo build infrastructure: (1) enabling Vercel Remote Cache for Turborepo to share build artifacts between CI and local development, (2) upgrading Yarn from 4.6.0 to 4.13.0 and introducing catalogs for centralized dependency version management, and (3) adding per-workspace `lint` and `typecheck` tasks through Turborepo with proper caching.

All three requirements are well-understood, well-documented by their respective tooling, and can be implemented with high confidence. The project already has strong foundations: Turborepo 2.8.16 is configured with `build` and `test:unit` tasks, ESLint flat configs exist for all apps with a shared config package (`@openvaa/shared-config`), and the `--flag v10_config_lookup_from_file` flag is already in use (enabling per-directory ESLint config resolution, which is exactly what per-workspace linting needs).

**Primary recommendation:** Implement in three independent waves -- Vercel remote cache (environment setup + turbo.json), Yarn upgrade with catalogs (version bump + catalog definitions), and lint/typecheck pipelines (per-workspace scripts + turbo.json tasks).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
No locked decisions -- all implementation details are at Claude's discretion per CONTEXT.md.

### Claude's Discretion
All implementation details are at Claude's discretion. The requirements (POL-01, POL-02, POL-03) are well-scoped and technically straightforward:

- **POL-01 (Vercel remote cache):** Claude decides scope (CI-only vs CI+local), token configuration approach, and turbo.json remote cache settings
- **POL-02 (Yarn upgrade + catalogs):** Claude decides which dependencies to centralize via catalogs, migration approach from 4.6 to 4.10+, and how to handle workspace-specific overrides
- **POL-03 (Lint/typecheck pipelines):** Claude decides whether to use per-package ESLint configs or a shared root config, whether typecheck is a separate turbo task or combined with build, and caching strategy

### Deferred Ideas (OUT OF SCOPE)
- Native frontend dev without Docker (deferred from Phase 8)
- VER-04 changeset bot (deferred from Phase 10 -- low priority, can be done anytime)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POL-01 | Vercel remote cache enabled for CI and local builds | Remote caching via TURBO_TOKEN/TURBO_TEAM env vars in GitHub Actions + `turbo login`/`turbo link` locally. Zero turbo.json changes needed -- remote cache is configured via env vars, not config file. |
| POL-02 | Yarn upgraded to 4.10+ with catalogs for centralized dependency versions | `yarn set version 4.13.0` upgrades Yarn. Catalogs defined in `.yarnrc.yml` under `catalog:` key. 13 dependencies identified as candidates (typescript, vitest, eslint, prettier, etc.). |
| POL-03 | Lint and typecheck run per-workspace through Turborepo with caching | Add `lint` and `typecheck` scripts to each workspace package.json. Add task definitions in turbo.json with empty `outputs` (side-effect tasks) and appropriate `inputs`. Leverages existing ESLint flat configs and `v10_config_lookup_from_file` behavior. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Turborepo | 2.8.16 (already installed) | Build orchestration, task caching, remote cache | Already in use; remote cache is a built-in feature |
| Yarn | 4.13.0 (upgrade from 4.6.0) | Package management with catalogs | Latest stable; catalogs built-in since 4.10.0 |
| ESLint | ^9.39.2 (already installed) | Per-workspace linting | Already in use with flat config and v10_config_lookup_from_file |
| TypeScript | ^5.7.3 (already installed) | Per-workspace type checking | Already in use across all workspaces |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @openvaa/shared-config | workspace:^ | Shared ESLint/TS/Prettier configs | Already used by all workspaces for consistent config |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Remote Cache | GitHub Actions cache (rharkor/caching-for-turbo) | Free alternative using GH cache, but Vercel cache is also free and purpose-built for Turborepo |
| Vercel Remote Cache | Self-hosted cache (brunojppb/turbo-cache-server) | More control but unnecessary operational overhead |

## Architecture Patterns

### POL-01: Vercel Remote Cache

**How it works:** Turborepo checks TURBO_TOKEN and TURBO_TEAM environment variables at runtime. When present, task outputs (build artifacts, logs) are uploaded to Vercel's cache and downloaded on subsequent runs instead of re-executing tasks.

**CI Setup (GitHub Actions):**
1. Create a Vercel Scoped Access Token at https://vercel.com/account/tokens
2. Add `TURBO_TOKEN` as a GitHub Actions secret
3. Add `TURBO_TEAM` as a GitHub Actions variable (not secret -- keeps team name visible in logs)
4. Add env block to workflow jobs

```yaml
# In each workflow that runs turbo commands
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ vars.TURBO_TEAM }}
    steps:
      - uses: actions/checkout@v4
      # ... rest of steps
```

**Local Setup:**
```bash
npx turbo login    # Authenticate with Vercel
npx turbo link     # Link repo to team
```

**turbo.json:** No changes required for basic remote caching. The `remoteCache` key in turbo.json is only needed for optional features like signature verification.

**Verification:** Delete local cache with `rm -rf .turbo/cache` and re-run `turbo run build`. Logs should show `cache hit, replaying logs` for unchanged packages and display remote cache URL.

**Affected workflows:**
- `.github/workflows/release.yml` -- add TURBO_TOKEN/TURBO_TEAM env vars
- `.github/workflows/docs.yml` -- add TURBO_TOKEN/TURBO_TEAM env vars (runs `yarn build`)
- `.github/workflows/claude.yml` -- already runs turbo via allowed commands, benefits automatically

### POL-02: Yarn Upgrade + Catalogs

**Upgrade Process:**
```bash
yarn set version 4.13.0
```

This updates:
- `.yarnrc.yml` `yarnPath` field (if using yarnPath) or `packageManager` field
- `.yarn/releases/yarn-4.13.0.cjs` (new release binary)
- Root `package.json` `packageManager` field

**Catalog Definition in .yarnrc.yml:**
```yaml
nodeLinker: node-modules

yarnPath: .yarn/releases/yarn-4.13.0.cjs

catalog:
  typescript: ^5.7.3
  vitest: ^2.1.8
  eslint: ^9.39.2
  prettier: ^3.4.2
  tsx: ^4.19.2
  "@openvaa/shared-config": "workspace:^"
  "@typescript-eslint/eslint-plugin": ^8.19.1
  "@typescript-eslint/parser": ^8.19.1
  eslint-plugin-simple-import-sort: ^12.1.1
  eslint-plugin-import: ^2.32.0
  "@eslint/eslintrc": ^3.2.0
  "@eslint/js": ^9.17.0
  globals: ^15.14.0
```

**Package.json migration:** Replace explicit version ranges with `catalog:` protocol:
```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:",
    "@openvaa/shared-config": "catalog:"
  }
}
```

**Dependencies to centralize (13 candidates across 10+ workspaces):**

| Dependency | Current Versions | Workspaces |
|------------|-----------------|------------|
| `typescript` | ^5.7.3 (12x), ^5.7.2 (1x docs) | All packages + apps + plugin |
| `vitest` | ^2.1.8 (11x), ^4.0.15 (1x docs) | All packages + apps + root |
| `eslint` | ^9.39.2 (5x) | shared-config, frontend, strapi, docs, root |
| `prettier` | ^3.4.2 (3x), ^3.7.4 (1x docs) | shared-config, frontend, plugin, docs |
| `@openvaa/shared-config` | workspace:^ (12x) | All packages + apps + plugin |
| `tsx` | ^4.19.2 (2x), ^4.19.3 (1x) | root, frontend, data |
| `@typescript-eslint/parser` | ^8.19.1 (4x) | shared-config, frontend, strapi, plugin |
| `@typescript-eslint/eslint-plugin` | ^8.19.1 (3x) | shared-config, frontend, strapi |
| `@eslint/eslintrc` | ^3.2.0 (2x) | shared-config, frontend |
| `@eslint/js` | ^9.17.0 (2x), ^9.39.1 (1x) | shared-config, frontend, docs |
| `eslint-plugin-simple-import-sort` | ^12.1.1 (2x) | shared-config, docs |
| `eslint-plugin-import` | ^2.32.0 (2x) | shared-config, root |
| `globals` | ^15.14.0 (2x), ^16.5.0 (1x) | frontend, strapi, docs |

**Version conflicts to resolve before cataloging:**
- `typescript`: docs uses ^5.7.2 vs ^5.7.3 everywhere else -- normalize to ^5.7.3
- `vitest`: docs uses ^4.0.15 vs ^2.1.8 everywhere else -- docs is intentionally on newer version, exclude from catalog
- `prettier`: docs uses ^3.7.4 vs ^3.4.2 -- normalize to ^3.7.4 (or leave docs excluded)
- `globals`: docs uses ^16.5.0 vs ^15.14.0 -- different major, exclude docs from catalog for this dep
- `@eslint/js`: docs uses ^9.39.1 vs ^9.17.0 -- normalize to higher version

**Important:** The `catalog:` protocol is automatically resolved to real versions during `yarn npm publish`, so published packages will not contain `catalog:` strings. This is safe for the publishable packages (core, data, matching, filters).

**Important:** The `workspace:^` protocol can also be managed via catalogs. Since `@openvaa/shared-config` appears in 12 workspaces with the same `workspace:^` value, it is a natural catalog candidate.

### POL-03: Per-Workspace Lint and Typecheck

**Current state:**
- Root `lint:check` runs monolithic `eslint --flag v10_config_lookup_from_file apps/strapi/src apps/strapi/tests apps/frontend packages tests`
- No per-workspace `lint` or `typecheck` scripts exist
- ESLint flat configs exist at: root, `apps/frontend`, `apps/strapi`, `apps/docs`, `packages/shared-config`, `tests/`
- Packages without ESLint configs (core, data, matching, filters, app-shared, llm, argument-condensation, question-info) inherit from root `eslint.config.mjs` which re-exports `@openvaa/shared-config/eslint`
- The `--flag v10_config_lookup_from_file` makes ESLint search for config starting from the file being linted, walking up to find the nearest `eslint.config.mjs` -- this is exactly per-workspace behavior
- Frontend already has `check` script: `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`
- Docs already has `check` script with same pattern
- Strapi has no typecheck script

**Recommended turbo.json task definitions:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**"],
      "inputs": [
        "src/**",
        "tsconfig.json",
        "tsconfig.*.json",
        "tsup.config.ts",
        "package.json"
      ]
    },
    "test:unit": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": [],
      "inputs": [
        "$TURBO_DEFAULT$",
        "eslint.config.*"
      ]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [],
      "inputs": [
        "$TURBO_DEFAULT$",
        "tsconfig.json",
        "tsconfig.*.json"
      ]
    }
  }
}
```

**Key design decisions:**
- `lint.dependsOn: ["^lint"]` -- ensures changes to `@openvaa/shared-config` (which exports the ESLint config) invalidate cache for all dependent workspaces
- `lint.outputs: []` -- lint produces no file artifacts, but Turborepo still caches the logs
- `typecheck.dependsOn: ["^build"]` -- type checking requires dependencies to be built first (for `.d.ts` files), not `^typecheck`
- `typecheck.outputs: []` -- typecheck produces no artifacts

**Per-workspace scripts to add:**

For packages (core, data, matching, filters, app-shared, llm, argument-condensation, question-info):
```json
{
  "scripts": {
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit"
  }
}
```

For `apps/frontend`:
```json
{
  "scripts": {
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```

For `apps/strapi`:
```json
{
  "scripts": {
    "lint": "eslint --flag v10_config_lookup_from_file src/",
    "typecheck": "tsc --noEmit"
  }
}
```

For `apps/docs`:
```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```
Note: `apps/docs` already has a `lint` script (`prettier --check . && eslint .`). It should be simplified to just the ESLint part, with Prettier handled separately. The existing `check` script can be renamed/aliased to `typecheck`.

For `tests/` directory: The tests directory has an `eslint.config.mjs` but is not a workspace -- it is included in the root workspaces glob as a subdirectory. The root lint command currently includes `tests` in its file list. Since `tests/` is not a Yarn workspace, it cannot have its own turbo task. The root-level `lint:check` should continue to cover `tests/` separately.

For `apps/strapi/src/plugins/openvaa-admin-tools`: This IS a workspace. It has its own `package.json` but no ESLint config -- it will inherit from the root ESLint config via the `v10_config_lookup_from_file` behavior. Add lint and typecheck scripts here too.

**Root package.json updates:**
```json
{
  "scripts": {
    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests",
    "lint:fix": "turbo run lint -- --fix && eslint --flag v10_config_lookup_from_file --fix tests"
  }
}
```

Note: The existing root `lint:check` includes a `turbo run build --filter=@openvaa/app-shared...` prefix. With Turborepo's `dependsOn`, the lint task can declare build dependencies directly, removing the need for this manual prefix.

**Packages without ESLint configs:** The packages `core`, `data`, `matching`, `filters`, `app-shared`, `llm`, `argument-condensation`, `question-info` do NOT have their own `eslint.config.*` files. With `--flag v10_config_lookup_from_file`, ESLint will walk up from `src/` to find the nearest config. For packages, it will find the root `eslint.config.mjs`. This works correctly without adding per-package configs -- the root config re-exports `@openvaa/shared-config/eslint`.

### Anti-Patterns to Avoid
- **Adding eslint.config.mjs to every package unnecessarily:** The root config works fine for packages via v10_config_lookup_from_file. Only apps with special needs (Svelte, Strapi globals) need their own configs.
- **Using `globalDependencies` for ESLint config:** This would invalidate ALL task caches when ESLint config changes, not just lint caches. Use task-level `inputs` instead.
- **Combining lint and typecheck into one task:** They have different cache invalidation patterns and should be separate turbo tasks.
- **Using `^typecheck` in typecheck.dependsOn:** Type checking does not depend on downstream typecheck results. It depends on built `.d.ts` files from dependencies, so `^build` is correct.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Remote caching | Custom S3 cache server | Vercel Remote Cache (free) | Zero infrastructure, built-in Turborepo support |
| Dependency version sync | Manual version auditing scripts | Yarn catalogs (`catalog:` protocol) | Native Yarn feature, handles publish resolution |
| Parallel lint/typecheck | Custom parallelization scripts | Turborepo task definitions | Already using Turborepo for build orchestration |

**Key insight:** All three requirements are solved by existing tooling features -- zero custom code needed.

## Common Pitfalls

### Pitfall 1: Yarn Upgrade Breaks Lock File
**What goes wrong:** `yarn set version 4.13.0` may require a fresh `yarn install` to update the lock file format.
**Why it happens:** Yarn minor versions sometimes change lock file internals.
**How to avoid:** Run `yarn install` immediately after `yarn set version 4.13.0` and commit the updated `yarn.lock` together with the version change.
**Warning signs:** CI fails with "lock file out of date" errors.

### Pitfall 2: Catalog Entries for Workspace Protocol
**What goes wrong:** Using `catalog:` for `workspace:^` dependencies may confuse tooling.
**Why it happens:** `workspace:^` is a Yarn protocol, not a version range.
**How to avoid:** Test that `workspace:^` works in catalogs. If not, keep `workspace:^` as explicit entries and only catalog external dependencies.
**Warning signs:** Resolution errors during `yarn install`.

### Pitfall 3: ESLint --flag Removed in ESLint 10
**What goes wrong:** The `--flag v10_config_lookup_from_file` flag will be removed in ESLint 10 (becomes default behavior).
**Why it happens:** The flag was a preview of v10 behavior.
**How to avoid:** Keep using the flag for now (ESLint ^9.39.2). When upgrading to ESLint 10, remove all `--flag v10_config_lookup_from_file` occurrences.
**Warning signs:** ESLint 10 will error on unknown flags.

### Pitfall 4: Remote Cache Token Scope
**What goes wrong:** CI builds fail to authenticate with Vercel Remote Cache.
**Why it happens:** Scoped Access Token does not have correct team permissions.
**How to avoid:** Create the token with the correct team scope. Use `TURBO_TEAM` as a repository variable (not secret) so the team name appears in logs for debugging.
**Warning signs:** `turbo` logs show "remote cache disabled" or authentication errors.

### Pitfall 5: Pre-commit Hook Still Uses Monolithic Lint
**What goes wrong:** `.husky/pre-commit` and `.lintstagedrc.json` still call `eslint --fix --flag v10_config_lookup_from_file` directly (not through turbo).
**Why it happens:** lint-staged runs on individual files, not workspaces.
**How to avoid:** Leave lint-staged as-is. It works at the file level with `v10_config_lookup_from_file` and doesn't benefit from turbo caching. The turbo `lint` task is for CI and full-repo linting.
**Warning signs:** None -- this is by design.

### Pitfall 6: Docs Workspace Version Divergence
**What goes wrong:** `apps/docs` uses newer versions of several deps (vitest ^4.0.15, globals ^16.5.0, prettier ^3.7.4).
**Why it happens:** Docs was recently updated independently.
**How to avoid:** For deps where docs diverges significantly (vitest major version, globals major version), either keep explicit versions in docs or create a named catalog. For minor version differences (prettier, @eslint/js), normalize to the higher version.
**Warning signs:** Resolution conflicts or test failures in docs workspace.

### Pitfall 7: Strapi Plugin Workspace
**What goes wrong:** `apps/strapi/src/plugins/openvaa-admin-tools` is a workspace but easily forgotten.
**Why it happens:** It is nested deep inside `apps/strapi/src/plugins/`.
**How to avoid:** Include it in per-workspace script additions. It has `typescript` in devDependencies and builds via `strapi-plugin build` (not tsc directly), so its typecheck setup may differ.
**Warning signs:** `turbo run lint` or `turbo run typecheck` skips this workspace.

## Code Examples

### turbo.json with lint and typecheck tasks
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**"],
      "inputs": [
        "src/**",
        "tsconfig.json",
        "tsconfig.*.json",
        "tsup.config.ts",
        "package.json"
      ]
    },
    "test:unit": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": [],
      "inputs": [
        "$TURBO_DEFAULT$",
        "eslint.config.*"
      ]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [],
      "inputs": [
        "$TURBO_DEFAULT$",
        "tsconfig.json",
        "tsconfig.*.json"
      ]
    }
  }
}
```
Source: Turborepo docs -- https://turborepo.dev/docs/crafting-your-repository/configuring-tasks

### GitHub Actions remote cache setup
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ vars.TURBO_TEAM }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.18.1
          cache: "yarn"
      - run: yarn install --frozen-lockfile
      - run: yarn build
```
Source: Turborepo docs -- https://turborepo.dev/docs/guides/ci-vendors/github-actions

### Yarn catalog definition
```yaml
# .yarnrc.yml
nodeLinker: node-modules

yarnPath: .yarn/releases/yarn-4.13.0.cjs

catalog:
  typescript: ^5.7.3
  vitest: ^2.1.8
  eslint: ^9.39.2
  prettier: ^3.4.2
```
Source: Yarn docs -- https://yarnpkg.com/features/catalogs

### Package.json with catalog references
```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```
Source: Yarn docs -- https://yarnpkg.com/features/catalogs

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No remote cache | Vercel Remote Cache (free) | Turborepo 1.x+ | Shared cache across CI runs and developers |
| Duplicated dep versions | Yarn catalogs | Yarn 4.10.0 (Sep 2024) | Single source of truth for common dependencies |
| Monolithic root lint | Per-workspace lint via Turborepo | ESLint 9 flat config + v10_config_lookup_from_file | Cached, parallel lint per workspace |
| ESLint searches from cwd | ESLint searches from file being linted | ESLint 9.30+ (flag), ESLint 10 (default) | Makes per-workspace linting natural |

**Deprecated/outdated:**
- ESLint `unstable_config_lookup_from_file` flag: Renamed to `v10_config_lookup_from_file` in ESLint 9.30.0
- Turborepo `pipeline` key: Renamed to `tasks` in Turborepo 2.x (already using `tasks` in this project)

## Open Questions

1. **Vercel account/team setup**
   - What we know: TURBO_TOKEN and TURBO_TEAM environment variables needed in GitHub
   - What's unclear: Whether the OpenVAA project already has a Vercel account/team
   - Recommendation: Document the manual steps (create Vercel account, generate token, add to GitHub secrets) as prerequisites. The planner should note this requires manual action outside of code.

2. **Strapi plugin typecheck**
   - What we know: `openvaa-admin-tools` uses `strapi-plugin build` for building, has separate `test:ts:front` and `test:ts:back` scripts using `run -T tsc -p` with specific tsconfig paths
   - What's unclear: Whether a single `typecheck` script can cover both front and back, or if it needs special handling
   - Recommendation: Use `tsc -p admin/tsconfig.json && tsc -p server/tsconfig.json` as the typecheck command, or keep existing `test:ts:front`/`test:ts:back` and add a `typecheck` that calls both.

3. **Workspace `catalog:` protocol for `workspace:^`**
   - What we know: Yarn docs say catalogs support dependencies/devDependencies/peerDependencies
   - What's unclear: Whether `workspace:^` as a catalog value is officially supported
   - Recommendation: Test this during implementation. If it works, great. If not, keep `workspace:^` explicit and only catalog external dependencies.

## Sources

### Primary (HIGH confidence)
- Turborepo official docs -- https://turborepo.dev/docs/core-concepts/remote-caching (remote cache setup)
- Turborepo official docs -- https://turborepo.dev/docs/guides/ci-vendors/github-actions (GitHub Actions CI)
- Turborepo official docs -- https://turborepo.dev/docs/guides/tools/eslint (ESLint integration)
- Turborepo official docs -- https://turborepo.dev/docs/guides/tools/typescript (TypeScript integration)
- Turborepo official docs -- https://turborepo.dev/docs/reference/configuration (turbo.json reference)
- Yarn official docs -- https://yarnpkg.com/features/catalogs (catalogs feature)
- Yarn GitHub releases -- https://github.com/yarnpkg/berry/releases (version 4.13.0 confirmed latest)
- ESLint blog -- https://eslint.org/blog/2026/02/eslint-v10.0.0-released/ (v10_config_lookup_from_file becomes default)

### Secondary (MEDIUM confidence)
- Vercel community discussion on topo task pattern -- https://community.vercel.com/t/understanding-turbos-topo-task/4962
- GitHub discussions on ESLint + Turborepo caching -- https://github.com/vercel/turborepo/discussions/8445

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in use, just enabling features
- Architecture: HIGH -- patterns well-documented by Turborepo and Yarn official docs
- Pitfalls: HIGH -- based on direct code inspection and known ESLint/Yarn version behaviors

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable tooling, unlikely to change significantly)

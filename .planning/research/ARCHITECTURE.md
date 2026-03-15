# Architecture Patterns: Monorepo Refresh

**Domain:** Monorepo tooling, versioning, package publishing, docs site evaluation
**Researched:** 2026-03-12
**Confidence:** HIGH (Turborepo + Yarn 4 compatibility verified, Changesets well-documented)

## Current Architecture Baseline

Before describing changes, here is what exists today.

### Current Directory Layout

```
voting-advice-application/
  packages/
    core/           (@openvaa/core)            - private, ESM only
    data/           (@openvaa/data)            - private, ESM only
    matching/       (@openvaa/matching)        - private, ESM only
    filters/        (@openvaa/filters)         - private, ESM only
    app-shared/     (@openvaa/app-shared)      - private, dual CJS+ESM
    shared-config/  (@openvaa/shared-config)   - private, config exports
    llm/            (@openvaa/llm)             - private, ESM only
    argument-condensation/                     - private, ESM experimental
    question-info/                             - private, ESM experimental
  frontend/         (@openvaa/frontend)        - private, SvelteKit 2
  backend/vaa-strapi/                          - private, Strapi v5
    src/plugins/openvaa-admin-tools/           - private, Strapi plugin
  docs/             (@openvaa/docs)            - private, SvelteKit static
  tests/                                       - E2E tests (not a workspace)
```

### Current Dependency Graph

```
shared-config (config only, no runtime deps)
     |
     v
   core  (leaf package - no @openvaa deps)
   / | \
  v  v  v
data matching filters
  |           |
  v           v
 data <----- filters (filters depends on core + data)
  |
  v
app-shared (depends on data, dual CJS/ESM build)
  /    \        \
 v      v        v
frontend strapi  strapi-admin-tools
                      |
                      v
                   docs (depends on app-shared)
```

### Current Build Pipeline

Root `package.json` orchestrates builds sequentially:

1. `build:shared` -- builds all packages via `yarn workspaces foreach -At --include 'packages/*' run build`
2. `build:app-shared` -- builds `app-shared` and all its transitive dependencies via `-Rt` flag
3. Frontend and backend build independently after shared packages are built
4. Docs site builds after shared packages, generating TypeDoc + component docs

**Key problem:** `yarn workspaces foreach` does topological ordering (`-t` flag) but has no caching. Every CI run rebuilds everything. The `watch:shared` script uses `onchange` to detect file changes, which is fragile.

### Current CI Pipeline

GitHub Actions `main.yaml` has 4 jobs running in parallel:
- `frontend-and-shared-module-validation` -- lint, format, unit tests, frontend build
- `backend-validation` -- shared build, backend build
- `e2e-tests` -- Docker stack, Playwright
- `e2e-visual-perf` -- visual regression + performance (continue-on-error)

**Redundancy:** Both `frontend-*` and `backend-*` jobs run `yarn build:shared` independently. No caching between jobs.

### Current Package Build Configuration

| Package | Build Tool | Output | CJS | ESM |
|---------|-----------|--------|-----|-----|
| core | tsc + tsc-esm-fix | `build/` | No | Yes |
| data | tsc + tsc-esm-fix | `build/` | No | Yes |
| matching | tsc + tsc-esm-fix | `build/` | No | Yes |
| filters | tsc + tsc-esm-fix | `build/` | No | Yes |
| app-shared | tsc (2x configs) | `build/esm/` + `build/cjs/` | Yes | Yes |
| shared-config | No build | N/A (config files) | N/A | N/A |
| llm | tsc + tsc-esm-fix | `build/` | No | Yes |

All publishable-candidate packages (core, data, matching) are currently `"private": true`.

---

## Recommended Architecture

### Phase 1: Add Turborepo for Build Orchestration

**Decision:** Add Turborepo on top of existing Yarn 4 workspaces. Do NOT migrate to pnpm.

**Rationale:**
- Yarn 4 with `nodeLinker: node-modules` (current config) is fully supported by Turborepo
- Turborepo is an additive layer -- it reads the existing workspace structure and `package.json` scripts
- Switching package managers (to pnpm) is high-risk, breaks Docker configs, CI, lockfile, and developer muscle memory for no proportional benefit
- Turborepo gives immediate value: task graph, local caching, parallel execution, and optional remote caching

**What changes:**

New file: `turbo.json` at repo root.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**", ".svelte-kit/**"],
      "inputs": ["src/**", "tsconfig*.json", "package.json"]
    },
    "test:unit": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "**/*.test.ts", "vitest.config.*"]
    },
    "lint:check": {
      "dependsOn": ["@openvaa/app-shared#build"]
    },
    "format:check": {
      "dependsOn": ["@openvaa/app-shared#build"]
    },
    "check": {
      "dependsOn": ["^build"]
    }
  }
}
```

Modified file: root `package.json` -- add `turbo` devDependency, update script commands.

```json
{
  "devDependencies": {
    "turbo": "^2.x"
  },
  "scripts": {
    "build:shared": "turbo run build --filter='./packages/*'",
    "build:app-shared": "turbo run build --filter=@openvaa/app-shared...",
    "test:unit": "turbo run test:unit",
    "lint:check": "turbo run lint:check",
    "format:check": "turbo run format:check"
  }
}
```

**What does NOT change:**
- Individual package `package.json` scripts (Turbo reads them as-is)
- Yarn workspaces config
- `.yarnrc.yml`
- Docker configuration
- Individual `tsconfig.json` files

### Phase 2: Restructure to apps/ + packages/

**Decision:** Move applications into `apps/` directory, keep library packages in `packages/`.

**Target layout:**

```
voting-advice-application/
  apps/
    frontend/       (@openvaa/frontend)
    strapi/         (@openvaa/strapi)
      src/plugins/openvaa-admin-tools/
    docs/           (@openvaa/docs)
  packages/
    core/           (@openvaa/core)
    data/           (@openvaa/data)
    matching/       (@openvaa/matching)
    filters/        (@openvaa/filters)
    app-shared/     (@openvaa/app-shared)
    shared-config/  (@openvaa/shared-config)
    llm/            (@openvaa/llm)
    argument-condensation/
    question-info/
  tests/            (E2E tests, not a workspace)
```

**What changes:**

| Item | Current Path | New Path |
|------|-------------|----------|
| Frontend | `frontend/` | `apps/frontend/` |
| Strapi | `backend/vaa-strapi/` | `apps/strapi/` |
| Strapi plugin | `backend/vaa-strapi/src/plugins/openvaa-admin-tools/` | `apps/strapi/src/plugins/openvaa-admin-tools/` |
| Docs | `docs/` | `apps/docs/` |
| Packages | `packages/*` | `packages/*` (unchanged) |

Root `package.json` workspaces field:
```json
{
  "workspaces": [
    "apps/*",
    "apps/strapi/src/plugins/*",
    "packages/*"
  ]
}
```

**What needs updating after the move:**
1. Root `package.json` workspaces paths
2. Docker compose volume mounts and context paths
3. Dockerfile paths (`frontend/Dockerfile` becomes `apps/frontend/Dockerfile`)
4. GitHub Actions workflow paths (build commands, path filters)
5. Docs site scripts referencing `../frontend` (update `docs-scripts.config.ts` REPO_ROOT calculations)
6. Root `.env.example` path references
7. TypeScript project references that use relative paths (these are within `packages/` so most are unaffected)
8. The `watch:shared` script referencing `packages/*/src/**/*` (unchanged since packages stay put)

**Why this order matters:** Restructuring AFTER Turborepo is added means Turbo's `--filter` flag can validate the new layout immediately. Moving files without Turbo means manually re-verifying the build graph.

### Phase 3: Package Publishing Readiness

**Decision:** Prepare `core`, `data`, and `matching` for npm publishing. Use `tsup` for building publishable packages instead of raw `tsc + tsc-esm-fix`.

**Rationale:**
- `tsup` (esbuild-based) produces clean ESM+CJS dual packages with proper `exports` fields in one command
- Eliminates the `tsc-esm-fix` workaround currently used by 5 packages
- Generates `.d.ts` type declarations alongside bundled output
- Faster builds (esbuild is 10-100x faster than tsc for emit)

**Package.json for publishable packages (example: core):**

```json
{
  "name": "@openvaa/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

**tsup.config.ts for publishable packages:**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist'
});
```

**Migration from `build/` to `dist/`:** Publishable packages switch output directory from `build/` to `dist/` to follow npm convention. Non-publishable packages can stay with `build/` or migrate for consistency.

**Which packages to publish:**

| Package | Publish? | Rationale |
|---------|----------|-----------|
| core | YES | Foundation types used by all other packages |
| data | YES | Universal data model, useful standalone |
| matching | YES | Matching algorithms, useful standalone |
| filters | LATER | Depends on data, publish after data is stable |
| app-shared | NO | OpenVAA-specific settings, not useful standalone |
| shared-config | NO | Internal tooling config |
| llm | LATER | Experimental, not stable |

**Dependency implications for publishing:**
- `data` exports `core` types, so `core` must be published first
- `matching` depends on `core`, so `core` must be published first
- Published packages must use version ranges for `@openvaa/*` deps, not `workspace:^`
- Changesets handles this transformation automatically at publish time

### Phase 4: Changesets for Version Management

**Decision:** Use `@changesets/cli` for automated versioning, changelogs, and publishing.

**What gets added:**

New directory: `.changeset/` at repo root containing config and changeset files.

New file: `.changeset/config.json`:

```json
{
  "$schema": "https://github.com/changesets/changesets/blob/main/packages/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [
    ["@openvaa/core", "@openvaa/data", "@openvaa/matching"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@openvaa/frontend",
    "@openvaa/strapi",
    "@openvaa/strapi-admin-tools",
    "@openvaa/docs",
    "@openvaa/shared-config",
    "@openvaa/app-shared"
  ]
}
```

**Key configuration choices:**

- `linked` groups `core`, `data`, `matching` so they version together (a change to core bumps all three). This simplifies the consumer experience.
- `ignore` excludes private/non-publishable packages from versioning. They stay at internal version numbers.
- `access: "public"` for scoped packages on npm.
- `updateInternalDependencies: "patch"` ensures when core bumps, data and matching get their dependency on core updated automatically.

**GitHub Actions release workflow:**

```yaml
name: Release
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write  # For npm OIDC trusted publishing

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: yarn install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          publish: yarn changeset publish
          version: yarn changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Developer workflow:**

1. Make changes to `@openvaa/core`
2. Run `yarn changeset` -- CLI prompts for affected packages and semver bump type
3. Commit the generated `.changeset/*.md` file with the PR
4. Changesets bot comments on PRs missing changesets (optional, via GitHub App)
5. On merge to main, the release workflow either:
   a. Creates a "Version Packages" PR aggregating all changesets into version bumps, or
   b. Publishes directly if already versioned

### Phase 5: Docs Site Evaluation

**Decision:** Keep docs in the monorepo. Do NOT split to a separate repository.

**Rationale:**

Arguments for keeping in monorepo:
1. Docs generate content from source code (TypeDoc for packages, component extraction from frontend). Splitting would require complex cross-repo build triggers.
2. The `docs/scripts/docs-scripts.config.ts` references `../frontend` for component docs and route maps. In a separate repo, this becomes a submodule or artifact-download dance.
3. The docs CI workflow (`docs.yml`) already builds shared packages before generating docs. It needs the full monorepo context.
4. The docs workspace depends on `@openvaa/app-shared` as a runtime dependency for settings display. This is a real code dependency, not just a doc reference.
5. The `apps/` restructure gives docs its own clear boundary at `apps/docs/` without needing a separate repo.

Arguments against splitting that clinched the decision:
1. Docs are already correctly isolated as a workspace -- they don't pollute other packages.
2. The GitHub Pages deployment workflow already only triggers on `docs/**` path changes.
3. External contributors rarely touch docs and code simultaneously, so there is no velocity argument for splitting.

**Architecture improvement within monorepo:**

With Turborepo, the docs build can declare explicit dependencies:

```json
// apps/docs/turbo.json (package-level override)
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["@openvaa/app-shared#build", "generate:docs"],
      "outputs": ["build/**"]
    },
    "generate:docs": {
      "dependsOn": ["@openvaa/app-shared#build"],
      "outputs": ["src/routes/(content)/developers-guide/**/generated/**"]
    }
  }
}
```

This makes the docs build cache-aware -- regeneration only happens when source packages change.

---

## Component Boundaries

### New Components (added by this milestone)

| Component | Location | Responsibility |
|-----------|----------|---------------|
| `turbo.json` | Root | Task graph, caching config, pipeline definition |
| `.changeset/` | Root | Version management config and changeset files |
| `tsup.config.ts` | Per publishable package | Build config for publishable output |
| Release workflow | `.github/workflows/release.yml` | Automated version PRs and npm publishing |

### Modified Components

| Component | Change | Reason |
|-----------|--------|--------|
| Root `package.json` | Add turbo devDep, update scripts to use `turbo run` | Build orchestration |
| Root `package.json` | Update workspaces to `["apps/*", "apps/strapi/src/plugins/*", "packages/*"]` | Directory restructure |
| Package `package.json` (core, data, matching) | Remove `"private": true`, add publishConfig, exports, files | Publishing readiness |
| Package `package.json` (core, data, matching) | Replace `tsc + tsc-esm-fix` build with `tsup` | Better build output |
| CI workflow (`main.yaml`) | Add Turborepo caching, update paths for `apps/` | Performance + new layout |
| Docker compose files | Update volume mount paths for `apps/` layout | Directory restructure |
| Docs scripts config | Update REPO_ROOT / FRONTEND_ROOT paths | Directory restructure |
| `.husky/pre-commit` | Update `cd frontend` to `cd apps/frontend` | Directory restructure |
| `.lintstagedrc` | No change needed (glob patterns are relative) | N/A |

### Unchanged Components

| Component | Why Unchanged |
|-----------|--------------|
| `packages/*` directory | Packages stay in packages/ |
| `tests/` directory | E2E tests stay at root, not a workspace |
| `@openvaa/shared-config` | Config package, no publish, no build change |
| `@openvaa/app-shared` | Dual build stays (Strapi needs CJS), but could adopt tsup later |
| TypeScript project references | Relative paths within packages/ are stable |
| `vitest.workspace.ts` | Pattern `packages/**/vitest.config.ts` still matches |

---

## Data Flow

### Build Flow (current vs proposed)

**Current:**
```
yarn build:shared
  -> yarn workspaces foreach -At --include 'packages/*' run build
    -> Topological order, but EVERY package rebuilds EVERY time
    -> No caching
    -> Sequential within dependency tiers
```

**Proposed with Turborepo:**
```
turbo run build --filter='./packages/*'
  -> Reads workspace dependency graph
  -> Hashes inputs (src/**, tsconfig.json, package.json)
  -> Skips packages whose inputs have not changed (cache hit)
  -> Runs uncached builds in parallel where possible
  -> Stores outputs in .turbo/ cache (local) or remote cache (CI)
```

### Release Flow (new)

```
Developer:
  1. Make code changes
  2. Run `yarn changeset` -> generates .changeset/random-name.md
  3. Commit changeset file with PR
  4. PR merged to main

CI (on push to main):
  1. Changesets action detects pending changesets
  2. Creates "Version Packages" PR with:
     - Updated package.json versions
     - Updated CHANGELOG.md files
     - Removed consumed changeset files
  3. Maintainer merges "Version Packages" PR
  4. Changesets action runs `changeset publish`
     - Builds packages (turbo run build)
     - npm publish with OIDC token (no secrets needed)
     - Creates git tags (v0.2.0, etc.)
```

### CI Build Flow (proposed)

```
main.yaml:
  ┌─ shared-build (turbo run build --filter='./packages/*')
  │    -> Cached between runs via actions/cache on .turbo/
  │
  ├─> frontend-validation
  │    turbo run build check test:unit --filter=@openvaa/frontend
  │
  ├─> backend-validation
  │    turbo run build --filter=@openvaa/strapi
  │
  ├─> e2e-tests (needs Docker stack, separate job)
  │
  └─> e2e-visual-perf (needs Docker stack, continue-on-error)

release.yml (separate workflow):
  -> changesets/action for version management + publishing
```

---

## Patterns to Follow

### Pattern 1: Turborepo Additive Layer

**What:** Turborepo sits on top of existing Yarn workspaces without replacing them. Package scripts remain the source of truth.

**When:** Always. Turbo orchestrates, Yarn resolves.

**Example:**
```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**"]
    }
  }
}
```

```json
// packages/core/package.json (unchanged script name)
{
  "scripts": {
    "build": "tsup"
  }
}
```

Turbo finds `build` script in each package, respects `dependsOn: ["^build"]` to run dependencies first, and caches the declared outputs.

### Pattern 2: Package-Level Turbo Overrides

**What:** Individual packages can override root turbo.json settings via their own `turbo.json`.

**When:** When a package has non-standard build behavior (e.g., docs site with code generation step).

**Example:**
```json
// apps/docs/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["generate:docs", "@openvaa/app-shared#build"],
      "outputs": ["build/**"]
    }
  }
}
```

### Pattern 3: Conditional Exports for Published Packages

**What:** Use the `exports` field with import/require conditions for packages that will be published to npm.

**When:** For core, data, matching -- any package consumed externally.

**Example:**
```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

### Pattern 4: Linked Versioning for Coupled Packages

**What:** Changesets `linked` config ensures packages that form a logical API surface version together.

**When:** When a semver bump to one package should bump all others in the group (core + data + matching).

**Example:** If `@openvaa/core` gets a minor bump, `@openvaa/data` and `@openvaa/matching` also get bumped to the same minor, keeping versions in sync.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Migrating Package Manager Simultaneously

**What:** Switching from Yarn 4 to pnpm or npm while also adding Turborepo, Changesets, and restructuring directories.

**Why bad:** Each migration touches every lockfile, every CI script, every Docker config, and every developer's local setup. Doing two of these at once creates debugging nightmares where you cannot isolate which change broke what.

**Instead:** Keep Yarn 4. It works. Turborepo supports it. Revisit package manager only if a concrete, measurable problem emerges.

### Anti-Pattern 2: Publishing All Packages

**What:** Making every workspace package publishable to npm.

**Why bad:** `@openvaa/app-shared` contains OpenVAA-specific settings (colors, locales, admin emails). `@openvaa/shared-config` is ESLint/Prettier/TS config for this repo specifically. Publishing these creates maintenance burden with zero external consumers.

**Instead:** Only publish packages with genuine external value: core, data, matching. Keep everything else `"private": true`.

### Anti-Pattern 3: Splitting Docs Before Stabilizing Build Pipeline

**What:** Moving docs to a separate repo while the monorepo build is being restructured.

**Why bad:** Docs depend on monorepo packages for TypeDoc generation and component extraction. Splitting requires building an artifact pipeline (publish packages, install in docs repo, run generation). This is a second migration on top of the first.

**Instead:** Move docs to `apps/docs/` within the monorepo. The Turborepo task graph handles build ordering. Revisit splitting only if docs become a bottleneck (they will not at current project scale).

### Anti-Pattern 4: Remote Caching Before Local Caching is Proven

**What:** Setting up Vercel Remote Cache or self-hosted remote cache on day one.

**Why bad:** Remote caching adds authentication, network dependency, and debugging complexity. Most of the performance win comes from local caching -- skipping rebuilds of unchanged packages on a single machine.

**Instead:** Start with local `.turbo/` cache. Measure CI times. Add remote caching only if CI build times remain a problem after local caching is working.

### Anti-Pattern 5: Changing Output Directories Without Updating All References

**What:** Switching from `build/` to `dist/` in publishable packages without updating TypeScript project references, vitest configs, `.gitignore`, and CI cache patterns.

**Why bad:** Stale references to `build/` will silently use old cached outputs or fail to find modules.

**Instead:** Use a checklist per package: `exports`, `main`, `module`, `types`, `files`, `.gitignore`, turbo.json `outputs`, any consuming package imports. Do all packages in one PR, not incrementally.

---

## Scalability Considerations

| Concern | Now (10 packages) | At 30 packages | At 100 packages |
|---------|-------------------|----------------|-----------------|
| Build time | ~30s full, tolerable | Turbo cache essential | Remote cache essential |
| CI cost | 4 parallel jobs | Turbo filters affected packages | Only changed packages build |
| Dependency graph complexity | Manual ordering works | Turbo handles automatically | Need strict layering rules |
| Versioning | Manual | Changesets handles | Changesets + release groups |
| Publishing | N/A (nothing published) | 3-5 packages, manageable | Need publish pipeline optimization |
| Developer onboarding | Read CLAUDE.md | Turbo makes build order invisible | Need architecture docs |

---

## Build Order (Recommended Implementation Sequence)

Implementing these changes in the wrong order creates unnecessary churn. This is the recommended sequence:

### Step 1: Add Turborepo (no other changes)

**Touched files:** `package.json` (root), new `turbo.json`, `.gitignore` (add `.turbo/`)

**Validation:** Run `turbo run build --filter='./packages/*'` and verify output matches existing `yarn build:shared`. Run `turbo run test:unit` and verify all tests pass. Compare build times.

### Step 2: Update CI to use Turborepo

**Touched files:** `.github/workflows/main.yaml`

**Validation:** CI passes on all 4 jobs. Shared build job uses Turbo. Cache hits visible in second run.

### Step 3: Restructure directories (apps/ + packages/)

**Touched files:** Move directories, update root `package.json` workspaces, Docker compose, CI paths, docs config, husky hooks.

**Validation:** `turbo run build` succeeds. `yarn dev` starts Docker stack. `yarn test:e2e` passes. Docs site builds.

### Step 4: Add tsup to publishable packages

**Touched files:** `packages/core/`, `packages/data/`, `packages/matching/` -- add `tsup.config.ts`, update `package.json` build script, update exports/main/module/types fields.

**Validation:** `turbo run build --filter=@openvaa/core` produces correct `dist/` output. Frontend and backend still build and run correctly with the new output paths.

### Step 5: Remove `"private": true` from publishable packages

**Touched files:** `packages/core/package.json`, `packages/data/package.json`, `packages/matching/package.json` -- add publishConfig, files, repository, license metadata.

**Validation:** `npm pack --dry-run` in each package shows correct file list. `yarn install` still resolves workspace links.

### Step 6: Add Changesets

**Touched files:** New `.changeset/config.json`, new `.github/workflows/release.yml`, `package.json` (root) add `@changesets/cli` devDep.

**Validation:** `yarn changeset` creates a changeset file. `yarn changeset version` bumps versions correctly. `yarn changeset publish --dry-run` shows correct publish targets.

---

## Integration Points Summary

| New Tooling | Integrates With | How |
|------------|----------------|-----|
| Turborepo | Yarn workspaces | Reads `workspaces` field, orchestrates `package.json` scripts |
| Turborepo | GitHub Actions CI | `turbo run` replaces manual `yarn workspaces foreach` commands |
| Turborepo | Docker dev | No direct integration -- Docker still uses `yarn build:shared` internally, but that script now calls Turbo |
| Changesets | GitHub Actions | Automated version PRs and npm publish via `changesets/action` |
| Changesets | npm registry | OIDC trusted publishing (no tokens needed) |
| Changesets | Turborepo | `changeset publish` can invoke `turbo run build` before publishing |
| tsup | Turborepo | Turbo caches tsup output directories |
| tsup | TypeScript | tsup uses esbuild for emit but tsc for type checking (via `dts: true`) |
| apps/ restructure | Docker compose | Volume mount paths need updating |
| apps/ restructure | Docs scripts | `FRONTEND_ROOT` path calculation needs updating |

## Sources

- [Turborepo documentation: Structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) -- HIGH confidence
- [Turborepo documentation: Configuring tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) -- HIGH confidence
- [Turborepo documentation: Add to existing repository](https://turborepo.dev/docs/getting-started/add-to-existing-repository) -- HIGH confidence
- [Turborepo + Yarn 4 nodeLinker compatibility](https://github.com/vercel/turborepo/issues/4953) -- HIGH confidence (verified: current project already uses `nodeLinker: node-modules`)
- [Changesets documentation](https://changesets-docs.vercel.app/) -- HIGH confidence
- [Changesets GitHub Action](https://github.com/changesets/action) -- HIGH confidence
- [npm trusted publishing with OIDC](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) -- MEDIUM confidence (requires npm CLI >=11.5.1 and Node >=22.14.0; project currently on Node 20, may need fallback to NPM_TOKEN)
- [tsup documentation](https://tsup.egoist.dev/) -- HIGH confidence
- [Monorepo tools comparison 2026](https://www.aviator.co/blog/monorepo-tools/) -- MEDIUM confidence
- [Dual ESM/CJS package publishing](https://mayank.co/blog/dual-packages/) -- HIGH confidence

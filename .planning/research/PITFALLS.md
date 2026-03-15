# Domain Pitfalls: Monorepo Refresh

**Domain:** Monorepo tooling, versioning, publishing, and docs site management for an existing Yarn 4 workspace monorepo
**Project:** OpenVAA v1.1 Monorepo Refresh
**Researched:** 2026-03-12
**Confidence:** HIGH (verified against current codebase state, official docs, and community issue trackers)

---

## Critical Pitfalls

Mistakes that cause broken releases, unrevertable state, or require multi-day recovery.

---

### Pitfall 1: Changesets Uses `npm publish` Instead of `yarn npm publish` -- workspace:^ Versions Leak to npm

**What goes wrong:**
You add `@changesets/cli`, configure it, run `changeset publish`, and your packages land on npm with `"@openvaa/core": "workspace:^"` in their dependency fields. Every consumer who installs your package gets a resolution error because `workspace:^` is a Yarn-specific protocol that npm, pnpm, and Node cannot resolve. The packages are published, the version numbers are burned, and you must either `npm unpublish` (only possible within 72 hours) or publish a corrected patch release.

**Why it happens:**
`@changesets/cli` internally uses `npm publish` by default, not `yarn npm publish`. Only `yarn npm publish` performs the workspace protocol replacement that converts `workspace:^` to the actual version number (e.g., `"@openvaa/core": "^0.2.0"`). This is a well-documented issue (changesets/changesets#432, changesets/changesets#1454) that has persisted since 2020 and remains the default behavior.

OpenVAA is especially vulnerable because ALL 9 packages use `workspace:^` for inter-package dependencies. The dependency chain `core -> data -> app-shared -> frontend/strapi` means a broken publish at the core level cascades to every downstream package.

**Consequences:**
- Published packages are non-installable by external consumers
- Version numbers are consumed and cannot be reused on npm
- If consumers already installed broken versions before the fix, they need manual intervention
- Trust in the package quality is damaged on the first public release

**Prevention:**
1. Configure changesets to use `yarn npm publish` by setting the `publishCommand` in `.changeset/config.json`:
   ```json
   {
     "publish": "yarn npm publish"
   }
   ```
   Or use a custom publish script that invokes `yarn npm publish` for each package.
2. Add a dry-run step to CI that runs `yarn pack` on each publishable package and inspects the tarball's `package.json` for any remaining `workspace:` references before the actual publish.
3. Add a pre-publish check script:
   ```bash
   # Fail if any workspace: protocol remains in packed output
   yarn pack --dry-run | grep -q "workspace:" && exit 1
   ```

**Detection:**
- Run `yarn pack` on any package and check `package.json` in the tarball
- Search published package on npm and check dependency versions
- CI step that greps packed output for `workspace:` protocol strings

**Phase to address:** Versioning and publishing setup phase -- must be verified before the first real publish

---

### Pitfall 2: All Packages Are `"private": true` -- Nothing Can Be Published

**What goes wrong:**
You configure changesets, write changesets, run `changeset version` (versions bump correctly), run `changeset publish`, and... nothing publishes. No error, no packages on npm. The publish silently skips every package because npm refuses to publish packages with `"private": true` in their `package.json`.

**Why it happens:**
Every package in OpenVAA currently has `"private": true`:
- `@openvaa/core` -- private: true
- `@openvaa/data` -- private: true
- `@openvaa/matching` -- private: true
- `@openvaa/filters` -- private: true
- `@openvaa/app-shared` -- private: true
- `@openvaa/shared-config` -- private: true
- All experimental packages -- private: true

This is the default for workspace packages that were never intended for publishing. Removing `"private": true` from packages that SHOULD be published (core, data, matching) while keeping it for packages that should NOT be published (shared-config, frontend, strapi, docs) requires careful per-package decisions.

**Consequences:**
- Publish pipeline appears to work but publishes nothing
- Changesets `version` command still bumps versions and writes changelogs, creating a confusing state where versions are bumped in git but nothing is on npm
- If you don't notice immediately, subsequent changesets stack up against phantom versions

**Prevention:**
1. Before adding changesets, audit each package and decide its publish status:
   - **Remove `"private": true`**: `core`, `data`, `matching`, `filters` (candidate for external consumption)
   - **Keep `"private": true`**: `shared-config`, `app-shared` (internal-only), `frontend`, `strapi`, `docs`, experimental packages
   - **Add `publishConfig`** for scoped packages: `"publishConfig": { "access": "public" }` (npm requires explicit opt-in for scoped packages)
2. Configure changesets `privatePackages` option:
   ```json
   {
     "privatePackages": { "version": true, "tag": false }
   }
   ```
   This lets private packages participate in versioning (important for internal consistency) without attempting to publish.
3. Add a CI verification that the publish step actually published N packages (check exit status + npm registry).

**Detection:**
- `changeset publish` output says "No unreleased packages found" or lists 0 packages
- npm registry shows no new versions after a publish run
- `package.json` still contains `"private": true` on packages meant for publishing

**Phase to address:** Package publishing readiness phase -- first task before any versioning setup

---

### Pitfall 3: Removing `"private": true` Without Adding `package.json` Metadata Causes npm Rejection

**What goes wrong:**
You remove `"private": true` from `@openvaa/core` and run `yarn npm publish`. npm rejects the publish because the package is missing required metadata: no `description`, no `license`, no `repository`, no `author`, and potentially missing or malformed `files` field. For scoped packages (`@openvaa/*`), npm also requires explicit `"publishConfig": { "access": "public" }` for public publishing.

**Why it happens:**
When packages were created as private workspace packages, nobody added the metadata npm requires for public packages. The current `@openvaa/core` package.json has:
```json
{
  "private": true,
  "name": "@openvaa/core",
  "version": "0.1.0",
  "scripts": { "build": "..." },
  "type": "module",
  "module": "./build/index.js",
  "types": "./build/index.d.ts",
  "exports": { "import": "./build/index.js" }
}
```
Missing: `description`, `license`, `repository`, `author`, `keywords`, `files`, `publishConfig`, `engines`, `homepage`, `bugs`.

**Consequences:**
- npm publish fails with cryptic validation errors
- If metadata is incomplete but npm accepts the publish, the package page on npmjs.com looks abandoned (no description, no license, no repository link)
- Missing `files` field means the entire package directory (including `src/`, `tsconfig.json`, test files) gets published, bloating the package size
- Missing `license` causes npm warnings for consumers and blocks adoption by organizations with license policies

**Prevention:**
1. Create a shared metadata template and apply to all publishable packages:
   ```json
   {
     "description": "...",
     "license": "AGPL-3.0",
     "repository": {
       "type": "git",
       "url": "https://github.com/OpenVAA/voting-advice-application",
       "directory": "packages/core"
     },
     "author": "OpenVAA contributors",
     "homepage": "https://openvaa.org",
     "bugs": "https://github.com/OpenVAA/voting-advice-application/issues",
     "keywords": ["vaa", "voting-advice-application"],
     "publishConfig": { "access": "public" },
     "files": ["build/", "README.md", "LICENSE"],
     "engines": { "node": ">=20" }
   }
   ```
2. Add a lint script that validates package.json completeness for all non-private packages.
3. Run `yarn pack` + `tar tf` on each publishable package to verify only intended files are included.

**Detection:**
- `yarn npm publish --dry-run` fails with metadata errors
- `yarn pack` produces a tarball larger than expected (source files included)
- npm package page shows "No description" or "No license"

**Phase to address:** Package publishing readiness phase -- metadata audit before versioning setup

---

### Pitfall 4: Version Cascade Avalanche -- Every Change to `core` Bumps 8 Packages

**What goes wrong:**
A developer fixes a typo in `@openvaa/core`. Changesets creates a patch bump for core (0.1.0 -> 0.1.1). Because `data` depends on `core`, changesets bumps `data` too (0.1.0 -> 0.1.1). Because `app-shared` depends on `data`, it bumps too. Because `frontend` depends on `app-shared`, `core`, `data`, `matching`, and `filters`... the cascade results in ALL 8+ packages getting new versions from a single typo fix. Every package gets a changelog entry saying "Updated dependency @openvaa/core to 0.1.1" -- meaningless noise.

**Why it happens:**
The OpenVAA dependency graph is deep and wide:
```
core -> data -> app-shared -> frontend, strapi
core -> matching -> frontend
core -> data -> filters -> frontend
core -> data -> question-info -> frontend
core -> data -> llm -> argument-condensation -> frontend
```
Changesets' default behavior (`updateInternalDependents: "out-of-range"`) only bumps dependents when the new version falls outside the declared range. But with `workspace:^`, the resolved range is `^0.1.0`, and a patch bump to `0.1.1` is IN range -- so dependents should NOT need bumping. The problem is that changesets' version replacement at publish time AND the desire for lockstep changelog entries can still create unnecessary releases.

**Consequences:**
- Changelog noise: consumers see 8 package updates when only 1 had a real change
- npm download stats become meaningless (every package shows same update frequency)
- CI publish pipeline takes longer (building and publishing 8 packages vs 1)
- Consumers using multiple packages must update all of them every time

**Prevention:**
1. Use independent versioning (changesets default) rather than fixed/lockstep versioning. Confirm this in `.changeset/config.json`:
   ```json
   {
     "fixed": [],
     "linked": []
   }
   ```
2. Do NOT use `updateInternalDependents: "always"`. Use the default `"out-of-range"` which only bumps dependents when the version falls outside the declared range.
3. Keep `workspace:^` dependencies -- they resolve to `^x.y.z` at publish time, which means patch and minor bumps in dependencies do NOT force dependent package bumps.
4. Review each changeset PR to ensure only genuinely affected packages are included. Changesets generates a PR -- use that review step.

**Detection:**
- A changeset for a single package results in a PR that bumps 5+ package versions
- Changelog entries consist mostly of "Updated dependency X" boilerplate
- The `changeset status` output shows more packages to release than expected

**Phase to address:** Versioning configuration phase -- get this right in the initial changesets config

---

### Pitfall 5: Dual CJS/ESM Build in `app-shared` Breaks After Versioning Changes

**What goes wrong:**
`@openvaa/app-shared` has a unique dual build (`build:cjs` + `build:esm`) that outputs to `build/cjs/` and `build/esm/` with separate `package.json` files declaring `"type": "commonjs"` and `"type": "module"` respectively. When Turborepo or a new build orchestrator is added, the custom build script (`mkdir -p ./build/cjs/ && echo '{ "type": "commonjs" }' > ./build/cjs/package.json`) gets cached or skipped incorrectly, or the synthetic `package.json` files in the build output confuse versioning tools that scan for `package.json` files.

There is also a bug in the current build: the ESM package script writes to `packagec.json` (typo: extra 'c') instead of `package.json`:
```json
"package:esm": "mkdir -p ./build/esm/ && echo '{ \"type\": \"module\" }' > ./build/esm/packagec.json"
```

**Why it happens:**
The dual build predates any tooling decisions. It exists because Strapi (CJS) and the frontend (ESM) both consume `app-shared`. This is a correct architectural decision, but the implementation with synthetic `package.json` files inside build output is fragile. Build caching tools (Turborepo, Nx) hash inputs and cache outputs -- but the synthetic package.json is generated by a shell command, not by tsc, so caching may miss it.

**Consequences:**
- Cached builds may be missing the synthetic `package.json` files, causing import resolution failures
- The existing typo (`packagec.json`) means the ESM build may not work correctly in some environments
- Versioning tools scanning for `package.json` files may find and modify the synthetic ones
- Turborepo output caching may not restore the synthetic files correctly

**Prevention:**
1. Fix the existing typo immediately (`packagec.json` -> `package.json`)
2. When adding Turborepo/build caching, declare `build/cjs/package.json` and `build/esm/package.json` as explicit outputs in the caching configuration
3. Consider migrating to a proper dual-build tool like `tsup` or using Node.js conditional exports more cleanly, which eliminates the need for synthetic `package.json` files:
   ```json
   "exports": {
     "import": { "types": "./build/esm/index.d.ts", "default": "./build/esm/index.js" },
     "require": { "types": "./build/cjs/index.d.ts", "default": "./build/cjs/index.js" }
   }
   ```
4. Evaluate whether the CJS build is still needed. Strapi v5 supports ESM. If the Supabase migration removes Strapi, the CJS build becomes dead code.

**Detection:**
- `require('@openvaa/app-shared')` fails with "ERR_REQUIRE_ESM" after a cached build
- `build/esm/` directory contains `packagec.json` instead of `package.json`
- Turborepo reports cache HIT but the build output is incomplete

**Phase to address:** Package organization/restructure phase -- fix before adding build caching

---

## Moderate Pitfalls

Mistakes that cause hours-to-days of debugging or require significant rework of the approach.

---

### Pitfall 6: Turborepo `outputs` Misconfiguration Causes Silent Cache Corruption

**What goes wrong:**
Turborepo is added to speed up builds. The `turbo.json` defines a `build` task but doesn't correctly specify `outputs`. On the first run, everything builds correctly. On the second run, Turborepo reports "FULL TURBO" (cache hit) but the build output directories are empty or stale because Turborepo didn't know which files to cache and restore.

**Why it happens:**
Each OpenVAA package builds to a different output structure:
- Most packages: `./build/` (tsc output)
- `app-shared`: `./build/cjs/` AND `./build/esm/` (dual build)
- `shared-config`: no build output (just config files)
- `frontend`: `.svelte-kit/` and `build/`
- `strapi`: `dist/`
- `docs`: `build/`

A generic `"outputs": ["build/**"]` in `turbo.json` misses the frontend's `.svelte-kit/` directory, misses Strapi's `dist/`, and doesn't account for the synthetic `package.json` files in `app-shared`'s build output.

**Prevention:**
1. Define per-package output overrides in `turbo.json`:
   ```json
   {
     "tasks": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["build/**", "dist/**", ".svelte-kit/**"]
       }
     }
   }
   ```
2. After adding Turborepo, run a full clean build, then run again and verify the cached build produces identical output:
   ```bash
   yarn turbo build --force  # Full build
   rm -rf packages/*/build   # Remove outputs
   yarn turbo build           # Should restore from cache
   diff -r before/ after/     # Compare
   ```
3. Add `"cache": false` for tasks that should never be cached (like `dev`, `watch`).

**Detection:**
- "FULL TURBO" in CI output but downstream steps fail with missing files
- Tests pass after clean build but fail after cached build
- `tsc` reports no errors but `import` fails at runtime

**Phase to address:** Build tooling/package manager evaluation phase

---

### Pitfall 7: TypeScript `moduleResolution: "Bundler"` in Published Packages Breaks Consumers

**What goes wrong:**
The shared TypeScript config (`tsconfig.base.json`) sets `"moduleResolution": "Bundler"`. This works within the monorepo because SvelteKit's Vite-based bundler handles resolution. But when `@openvaa/core` or `@openvaa/matching` are published and consumed by an external project using Node.js directly (not a bundler), module resolution fails because `"Bundler"` resolution allows import paths that Node.js cannot resolve (e.g., imports without file extensions, subpath imports).

**Why it happens:**
`moduleResolution: "Bundler"` is the correct setting for the monorepo because:
- Vite (SvelteKit frontend) uses bundler resolution
- TypeScript 5.x recommends it for projects using modern bundlers
- It allows cleaner import paths

But published npm packages are consumed in varied environments -- some use bundlers, some use Node.js directly, some use Deno. The published `.js` files must work with Node.js module resolution.

**Consequences:**
- External consumers get "Cannot find module" errors
- `tsc-esm-fix` (used by core, data, matching) exists specifically to fix ESM import paths -- if it silently fails or is misconfigured, the published files have broken imports
- Deno (a stated future target for OpenVAA) has its own resolution algorithm that may not match either setting

**Prevention:**
1. Verify that `tsc-esm-fix` is correctly adding `.js` extensions to all import paths in the build output. Inspect the `build/` directory of each publishable package.
2. Add a CI step that installs the packed tarball in a fresh Node.js project (not a bundler project) and runs a basic import:
   ```bash
   npm pack @openvaa/core
   mkdir /tmp/test && cd /tmp/test && npm init -y && npm install ../openvaa-core-0.2.0.tgz
   node -e "import('@openvaa/core').then(m => console.log(Object.keys(m)))"
   ```
3. Consider switching publishable packages to `"moduleResolution": "NodeNext"` for their build configs, separate from the monorepo-wide bundler setting.

**Detection:**
- External project importing `@openvaa/core` gets "ERR_MODULE_NOT_FOUND"
- Build output `.js` files contain `import { X } from './types'` without `.js` extension
- `tsc-esm-fix` exits with non-zero but the build script ignores it (piped with `&&`)

**Phase to address:** Package publishing readiness phase -- verify before first publish

---

### Pitfall 8: Docs Site Split Creates Stale Documentation

**What goes wrong:**
The docs site is moved to a separate repository (or a separate deployment pipeline). Over time, the documentation diverges from the actual code. API references describe v0.3.0 interfaces while the packages are at v0.5.0. Installation guides reference deprecated configuration options. Contributors update code but forget to update the separate docs repo. The docs site becomes actively misleading.

**Why it happens:**
The OpenVAA docs currently live in `/docs/` within the monorepo and have scripts that generate documentation FROM the codebase:
- `generate:component-docs` -- extracts component docs
- `generate:navigation` -- builds nav from route structure
- `generate:route-map` -- maps routes
- `validate:links` -- checks internal links
- TypeDoc integration for API reference from source code

These scripts assume co-location. They reference `../packages/`, `../frontend/`. Moving docs to a separate repo breaks every generation script and every relative path. Without the auto-generation, docs become manually maintained and drift.

**Consequences:**
- Stale docs are worse than no docs -- users follow outdated instructions and blame the framework
- TypeDoc API references stop being generated from source (or require complex cross-repo builds)
- Component documentation shows old interfaces
- Link validation cannot check links to source code
- Every release requires manual docs-repo update (which will be forgotten)

**Prevention:**
1. **Strong recommendation: Keep docs in the monorepo.** The co-location benefits (auto-generation, link validation, atomic commits with code changes) outweigh the separation benefits (independent deployment, different tech stack). Deploy docs separately via CI, but keep the source in the monorepo.
2. If docs MUST be split:
   - Generate all auto-generated content as a CI step in the main repo and push to the docs repo via a GitHub Action
   - Trigger docs repo rebuilds on every main repo release
   - Keep TypeDoc generation in the main repo and export artifacts
   - Add a CI check in the main repo that verifies docs repo links still work
3. Never manually maintain what can be auto-generated. If a generation script breaks after a code change, fix the script -- don't start hand-editing the generated file.

**Detection:**
- Docs repo hasn't been updated in 2+ weeks while main repo has active development
- API reference shows different function signatures than current source code
- Installation guide references an old package version
- "Edit this page" links point to a different repo than where the code lives

**Phase to address:** Docs site evaluation phase -- decide early, implement consistently

---

### Pitfall 9: Adding Turborepo Without Handling the Strapi Plugin Workspace

**What goes wrong:**
Turborepo is added with a standard `turbo.json`. The `build` task has `"dependsOn": ["^build"]` (build all dependencies first). But the workspace includes `backend/vaa-strapi/src/plugins/*`, which creates a cycle: Strapi's build depends on the plugin being built, but the plugin workspace is part of Strapi's directory tree. Turborepo either refuses to build (cycle detection) or builds in the wrong order.

**Why it happens:**
The workspace configuration includes nested workspaces:
```json
"workspaces": [
  "packages/*",
  "backend/vaa-strapi",
  "backend/vaa-strapi/src/plugins/*",  // Nested under vaa-strapi
  "frontend",
  "docs"
]
```
The Strapi plugin `@openvaa/strapi-admin-tools` lives inside the Strapi backend directory but is a separate workspace package that Strapi depends on (`"@openvaa/strapi-admin-tools": "workspace:^"` in Strapi's package.json). This nested structure is a Strapi convention but creates confusion for build orchestrators.

**Consequences:**
- Build task fails or executes in wrong order
- Strapi builds before its plugin is built, causing "module not found" at build time
- Turborepo's dependency graph visualization shows unexpected connections
- CI builds that worked with plain `yarn workspaces foreach` break with Turborepo

**Prevention:**
1. Explicitly configure the Strapi plugin workspace in `turbo.json` with a custom build task:
   ```json
   {
     "tasks": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["build/**", "dist/**"]
       }
     }
   }
   ```
   Turborepo should handle this via the package.json dependency declaration, but verify the build order explicitly.
2. Test the dependency graph before relying on it:
   ```bash
   npx turbo build --dry-run --graph
   ```
3. Consider whether the Strapi plugin should remain a separate workspace or be folded into the Strapi package (reducing workspace complexity), especially given the planned Strapi -> Supabase migration.

**Detection:**
- `turbo build` fails with "Circular dependency detected" or builds Strapi before its plugin
- `turbo build --graph` shows unexpected dependency arrows
- Strapi build succeeds locally (where all packages are already built) but fails in CI (clean checkout)

**Phase to address:** Build tooling evaluation phase -- test graph resolution before committing to Turborepo

---

### Pitfall 10: Initial Publish from 0.1.0 Creates SemVer Confusion

**What goes wrong:**
All packages are at version `0.1.0`. You add changesets and make a few changes. Changesets creates a patch bump to `0.1.1`. An external consumer starts using `@openvaa/core@0.1.1`. But `0.x.y` versions in SemVer have NO stability guarantees -- breaking changes are allowed in any release. Then you publish `0.1.2` with a breaking change, which is technically correct per SemVer rules for `0.x`, but the consumer's `^0.1.1` range resolves to `0.1.2` and their code breaks.

**Why it happens:**
SemVer treats `0.x.y` specially: "Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable." In practice, npm's `^` operator treats `^0.1.1` as `>=0.1.1 <0.2.0`, so patch bumps within `0.1.x` ARE automatically installed. This means consumers expect `0.1.x` patch bumps to be non-breaking, but SemVer doesn't guarantee it.

**Consequences:**
- Consumer code breaks on `npm update` if a "patch" release contains breaking changes
- Version number becomes meaningless if you try to follow strict SemVer 0.x rules
- Changesets asks "Is this a major, minor, or patch change?" but all three are fuzzy at 0.x

**Prevention:**
1. **Before the first publish, decide:** Are these packages ready for `1.0.0`? If the APIs are stable (core, matching, and data are used in production), consider starting at `1.0.0`.
2. If starting at `0.x`: treat minor bumps (0.1.0 -> 0.2.0) as breaking changes and patch bumps (0.1.0 -> 0.1.1) as non-breaking. Document this convention in CONTRIBUTING.md.
3. If starting at `1.0.0`: commit to standard SemVer and use changesets' `major`/`minor`/`patch` classifications strictly.
4. **Recommendation for OpenVAA:** Start at `1.0.0` for `core`, `data`, `matching`, and `filters` since they are production-used with stable APIs. Keep experimental packages at `0.x`.

**Detection:**
- Changesets asking for bump type on packages that have `0.x.y` versions (the choice is ambiguous)
- Consumer issue reports about broken `npm update`
- Internal confusion about what constitutes a "breaking change" at `0.x`

**Phase to address:** Versioning configuration phase -- version strategy decision before first changeset

---

## Minor Pitfalls

Issues that cause hours of debugging but have straightforward fixes.

---

### Pitfall 11: `tsc-esm-fix` Dependency Missing from Published Packages

**What goes wrong:**
`tsc-esm-fix` is listed as a `devDependency` in core, data, and matching. It runs during the build step (`yarn tsc --build && yarn tsc-esm-fix`). In the monorepo, it works because devDependencies are installed. But the build output (the `.js` files) already has the fixes applied, so this isn't a runtime concern -- it's a build concern. The pitfall occurs if someone forks the repo and runs `yarn install --production` before building, which skips devDependencies and breaks the build.

**Prevention:**
- Ensure CI always runs `yarn install` (not `--production`) before building
- Document in CONTRIBUTING.md that building requires all dependencies
- This is already correctly configured (devDependency) -- just don't change it to an optional dependency

**Phase to address:** Low priority -- document during publishing readiness

---

### Pitfall 12: Forgetting to Register the npm Organization Before First Publish

**What goes wrong:**
You run `yarn npm publish` for `@openvaa/core` and get a 403 error because the `@openvaa` scope is not registered on npm, or it's registered by someone else.

**Prevention:**
1. Register the `@openvaa` organization on npmjs.com BEFORE any publishing work
2. Add all team members who need publish access
3. Enable 2FA for the organization
4. Configure the npm automation token for CI (separate from personal tokens)

**Detection:**
- `yarn npm publish` returns 403 Forbidden
- `npm org ls openvaa` returns nothing or shows unexpected members

**Phase to address:** Publishing readiness -- first task, before any code changes

---

### Pitfall 13: Git Tags Conflict Between Packages

**What goes wrong:**
Changesets creates git tags for each release (e.g., `@openvaa/core@1.0.1`). If multiple packages are released simultaneously, the release commit contains many tags. GitHub's releases page becomes cluttered with individual package releases instead of showing a coherent project release.

**Prevention:**
1. Consider using changesets' `commit` option to configure commit message format
2. Decide whether to use per-package tags (changesets default) or a single project-level tag for coordinated releases
3. If using GitHub Releases, create a single release note that aggregates all package changes (the changesets GitHub action supports this)

**Phase to address:** Versioning configuration phase

---

### Pitfall 14: Husky Pre-commit Hooks Conflict with Changesets Workflow

**What goes wrong:**
The project uses Husky for pre-commit hooks (lint-staged). When changesets' GitHub Action creates a release PR and commits version bumps, the CI commit triggers Husky hooks in CI, which either fail (because CI doesn't have the full dev environment) or slow down the automated workflow.

**Prevention:**
1. Configure CI to skip Husky hooks: `HUSKY=0 git commit` in the changesets action
2. Or ensure the CI environment has all tools the hooks need (eslint, prettier)
3. The changesets GitHub Action runs its own commit -- ensure it's configured to work with or without hooks

**Detection:**
- Changesets version PR commits fail in CI with lint errors
- Changesets action takes unusually long due to lint/format checks on automated commits

**Phase to address:** Versioning automation phase -- configure CI workflow

---

### Pitfall 15: Yarn's Built-in Release Workflow vs Changesets -- Choosing Both Causes Conflicts

**What goes wrong:**
Yarn 4 has its own built-in release workflow (`yarn version check`, `yarn version apply`). Someone also installs `@changesets/cli`. Now two systems compete to manage versions, creating conflicting version files, duplicate git tags, and confusion about which tool to use.

**Why it happens:**
Yarn's release workflow is less known than changesets but is deeply integrated with Yarn's workspace protocol and `workspace:^` resolution. Changesets is the more popular community standard with better GitHub Action integration. Both are valid choices, but using both simultaneously creates chaos.

**Prevention:**
1. **Choose one tool and remove the other.** Recommendation: Use changesets because of broader community adoption, better GitHub Action ecosystem, and more documentation. But Yarn's built-in workflow is worth evaluating if you want fewer dependencies.
2. If choosing changesets: don't use `yarn version check` or `yarn version apply`
3. If choosing Yarn's workflow: don't install `@changesets/cli`
4. Document the decision in CONTRIBUTING.md so future contributors know which tool to use

**Phase to address:** Versioning tool selection -- decide before implementing

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|---|---|---|---|
| Package manager evaluation | Adding Turborepo without understanding workspace graph (nested Strapi plugin) | MEDIUM | Run `turbo build --dry-run --graph` and verify order before committing |
| Package manager evaluation | Switching from `nodeLinker: node-modules` to PnP breaks Strapi and frontend | HIGH | Do NOT switch to PnP. Strapi v5 requires node_modules. Keep current linker |
| Package organization | Moving packages to `packages/` and `apps/` subdirectories breaks all imports | MEDIUM | Update all workspace paths in root package.json and all tsconfig references simultaneously |
| Docs site evaluation | Splitting docs to separate repo breaks all auto-generation scripts | HIGH | Keep docs in monorepo, deploy separately via CI |
| Versioning setup | All packages at 0.1.0 with `private: true` -- neither ready for versioning nor publishing | HIGH | Audit private flags and version numbers BEFORE adding changesets |
| Versioning setup | Changesets uses `npm publish` instead of `yarn npm publish` | CRITICAL | Configure custom publish command in changesets config |
| Publishing readiness | Missing package.json metadata (license, description, files, publishConfig) | HIGH | Create metadata checklist and template, apply to all publishable packages |
| Publishing readiness | `@openvaa` npm organization not registered | HIGH | Register organization first |
| Cross-package version sync | Cascade bumps from core changes affect all 8+ packages | MEDIUM | Use independent versioning, keep `workspace:^` ranges |
| CI/CD pipeline | GitHub Action for changesets needs npm token and correct publish command | MEDIUM | Set up NPM_TOKEN secret, configure `yarn npm publish` |
| Build caching (Turborepo) | Incorrect `outputs` config causes stale/missing build artifacts from cache | MEDIUM | Define outputs per-package, verify with clean-rebuild test |
| Dual CJS/ESM build | Existing typo in app-shared ESM build script (`packagec.json`) | LOW | Fix typo before adding any build caching |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| Changesets + Yarn 4 | Using default `npm publish` which doesn't resolve `workspace:^` | Configure `yarn npm publish` as the publish command |
| Changesets + private packages | All packages are `private: true`, nothing publishes | Remove `private` from publishable packages, configure `privatePackages` for internal ones |
| Turborepo + Yarn 4 | Turborepo's default caching doesn't know about Yarn's `.yarn/cache` or build outputs | Explicitly configure `outputs` for each task in `turbo.json` |
| Turborepo + Docker | Dev script chains `yarn build:shared && docker compose up` -- Turborepo can't orchestrate Docker | Keep Docker orchestration in npm scripts, use Turborepo only for build/test/lint tasks |
| TypeDoc + separate docs repo | TypeDoc needs source files co-located to generate API docs | Keep docs in monorepo or generate TypeDoc output in main repo and copy to docs repo |
| Changesets + GitHub Actions | Automated PRs from changesets action don't trigger other workflows (GITHUB_TOKEN limitation) | Use a Personal Access Token (PAT) for the changesets action |
| Changesets + Husky | Automated commits from changesets trigger pre-commit hooks in CI | Set `HUSKY=0` in CI environment for changesets action |
| npm publishing + scoped packages | `@openvaa/*` packages default to restricted access | Add `"publishConfig": { "access": "public" }` to each publishable package |

---

## "Looks Done But Isn't" Checklist

- [ ] **Publish works:** Run `yarn npm publish --dry-run` on each publishable package and verify it succeeds with correct contents
- [ ] **workspace: resolved:** Pack each package with `yarn pack` and inspect the tarball's `package.json` for any `workspace:` protocol strings
- [ ] **Metadata complete:** Every publishable package has description, license, repository, author, files, publishConfig, engines
- [ ] **Files field correct:** `yarn pack` + `tar tf` shows only intended files (build output, README, LICENSE -- NOT src/, tsconfig.json, tests)
- [ ] **External install works:** Install the packed tarball in a fresh Node.js project and import the main export successfully
- [ ] **TypeScript types resolve:** Install the packed tarball and verify that `import { X } from '@openvaa/core'` resolves types in the consumer's IDE
- [ ] **Build from clean:** `git clean -xdf && yarn install && yarn build:shared` succeeds (no stale cached artifacts)
- [ ] **Turborepo cache valid:** Full build, delete outputs, rebuild from cache, verify identical output
- [ ] **CI publishes:** Changesets GitHub Action can publish with the configured npm token
- [ ] **Docs still generate:** All docs generation scripts still work after any structural changes
- [ ] **Changelogs meaningful:** Changeset version PR doesn't show cascade bumps for packages with no real changes
- [ ] **No tool conflicts:** Only ONE version management tool is configured (changesets OR yarn version, not both)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Published packages with `workspace:^` in dependencies | HIGH | `npm unpublish` within 72 hours, or publish corrected patch immediately. Notify users. Add CI guard. |
| All packages published with wrong/missing metadata | MEDIUM | Publish new patch versions with corrected metadata. npm allows metadata updates via `npm pkg fix`. |
| Version cascade published 8 packages for 1 real change | LOW | No recovery needed -- versions are correct, just noisy. Adjust changesets config for future releases. |
| Turborepo cache serving stale builds | LOW | `npx turbo clean` to clear cache. Fix `outputs` config. Re-run full build. |
| Docs repo diverged from code | MEDIUM | Re-run all generation scripts against current code. Set up CI automation to prevent recurrence. |
| 0.x version with accidental breaking change in patch | MEDIUM | Publish 0.2.0 (minor bump) to signal the break. Communicate in changelog. Consider moving to 1.0.0. |
| npm org not registered, someone else claimed `@openvaa` | HIGH | Contact npm support. Consider alternative scope. This is why you register the org FIRST. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| Changesets npm publish vs yarn npm publish (#1) | Versioning setup | Dry-run publish in CI, inspect tarball |
| All packages private: true (#2) | Publishing readiness | `changeset publish --dry-run` shows packages to publish |
| Missing package.json metadata (#3) | Publishing readiness | Lint script validates all publishable packages |
| Version cascade avalanche (#4) | Versioning configuration | Single-package changeset doesn't bump unrelated packages |
| Dual CJS/ESM build fragility (#5) | Package organization | Fix typo, verify both CJS and ESM imports work |
| Turborepo outputs misconfiguration (#6) | Build tooling evaluation | Clean rebuild matches cached rebuild |
| moduleResolution: Bundler in published packages (#7) | Publishing readiness | Fresh Node.js project can import published package |
| Docs site split causes stale docs (#8) | Docs site evaluation | All generation scripts work, docs match current code |
| Strapi plugin workspace nesting (#9) | Build tooling evaluation | `turbo build --graph` shows correct order |
| SemVer confusion at 0.x (#10) | Versioning strategy decision | Version convention documented, team aligned |
| npm org registration (#12) | Publishing readiness (first task) | `npm org ls openvaa` shows correct members |
| Git tags clutter (#13) | Versioning configuration | GitHub releases page is readable |
| Husky conflicts in CI (#14) | CI pipeline setup | Changesets action commits without hook failures |
| Yarn version vs changesets conflict (#15) | Tool selection | Only one version tool installed and configured |

---

## Sources

- Changesets workspace protocol issue: https://github.com/changesets/changesets/issues/432
- Changesets yarn publish issue: https://github.com/changesets/changesets/issues/1454
- Changesets workspace:* publish issue: https://github.com/changesets/action/issues/246
- Yarn workspace protocol docs: https://yarnpkg.com/features/workspaces
- Yarn npm publish docs: https://yarnpkg.com/cli/npm/publish
- Yarn release workflow: https://yarnpkg.com/features/release-workflow
- Turborepo task configuration: https://turborepo.dev/docs/crafting-your-repository/configuring-tasks
- Turborepo pitfalls: https://dev.to/_gdelgado/pitfalls-when-adding-turborepo-to-your-project-4cel
- Changesets GitHub Action: https://github.com/changesets/action
- Changesets private packages: https://github.com/changesets/changesets/issues/1702
- Changesets dependent bumping discussion: https://github.com/changesets/changesets/discussions/920
- npm scoped packages: https://docs.npmjs.com/cli/v11/configuring-npm/package-json/
- Dual ESM/CJS publishing: https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing
- TypeScript monorepo patterns: https://nx.dev/blog/managing-ts-packages-in-monorepos
- Monorepo versioning strategies: https://amarchenko.dev/blog/2023-09-26-versioning/
- Monorepo tools comparison 2026: https://viadreams.cc/en/blog/monorepo-tools-2026/
- SemVer specification: https://semver.org/
- OpenVAA current codebase analysis: all package.json files, tsconfig files, .yarnrc.yml, GitHub workflows

---

_Pitfalls research for: v1.1 Monorepo Refresh -- OpenVAA_
_Researched: 2026-03-12_

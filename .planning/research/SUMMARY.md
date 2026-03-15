# Project Research Summary

**Project:** OpenVAA v1.1 Monorepo Refresh
**Domain:** Monorepo tooling, versioning, package publishing, and build orchestration for an existing TypeScript monorepo
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

The OpenVAA monorepo refresh is a developer infrastructure project -- not a feature project. The codebase is a 9-package Yarn 4 workspace monorepo with a SvelteKit frontend, Strapi v5 backend, and shared TypeScript library packages (core, data, matching, filters). The goal is to modernize build orchestration, establish automated versioning and changelog generation, and prepare four core library packages for npm publishing. Research strongly converges on a two-tool stack: **Turborepo** for build orchestration and caching on top of existing Yarn 4 workspaces, and **Changesets** for version management and automated releases. Both are additive -- they layer onto what already works rather than replacing it.

The recommended approach follows a strict dependency order across five phases: (1) add Turborepo for build orchestration and fix known bugs, (2) restructure directories into `apps/` + `packages/` convention, (3) configure Changesets for versioning with a new release GitHub Action, (4) prepare packages for npm publishing by migrating builds to tsup and adding required metadata, and (5) polish with remote caching and dependency alignment. The directory restructure and Turborepo addition are independent of each other but both must precede publishing. The docs site should remain in the monorepo -- splitting it would break the auto-generation scripts that produce API references and component documentation from source code.

The highest-risk pitfall is Changesets' default use of `npm publish` instead of `yarn npm publish`, which would ship packages with unresolvable `workspace:^` protocol strings in their dependency fields. This must be caught before the first real publish or version numbers are burned and packages are non-installable. Secondary risks include the fact that all packages are currently `"private": true` (silent publish failure), missing npm package metadata (rejection on publish), and a known typo in the app-shared ESM build script (`packagec.json`). All are preventable with a disciplined pre-publish checklist.

## Key Findings

### Recommended Stack

The stack recommendation is narrow and confident. Both Turborepo and Changesets are dominant tools in their respective categories, actively maintained, and verified compatible with Yarn 4 + Node 20.

**Core technologies:**
- **Turborepo ^2.8:** Build orchestration and caching -- layers on Yarn 4 workspaces without replacing them. Adds parallel task execution, intelligent caching, and dependency-aware task graphs. Single `turbo.json` config file. 10-minute setup.
- **Changesets ^2.30:** Version management, changelog generation, release coordination -- decouples version intent from commit history. Contributors declare changes via changeset files. CI automates version PRs and publishing. 11.5k GitHub stars, used by Svelte, Astro, Turborepo themselves.
- **tsup (esbuild-based):** Build tool for publishable packages -- replaces `tsc + tsc-esm-fix` with a faster, cleaner ESM+CJS dual-build pipeline. Recommended by Turborepo's own publishing guide.
- **Yarn 4.6.0 (keep):** No package manager migration. Switching to pnpm is high-risk for zero gain at this scale.
- **SvelteKit docs site (keep):** No migration to Starlight/VitePress. The current site works and has deep monorepo integration. Evaluate Starlight only for a future major docs overhaul.

**Rejected alternatives:** Nx (too opinionated for 9 packages), Lerna (abandoned/Nx wrapper), semantic-release (poor monorepo support), Monoweave (requires Node >= 22), pnpm migration (high risk, low reward).

### Expected Features

**Must have (table stakes):**
- Task orchestration with caching (Turborepo -- replaces slow sequential `yarn workspaces foreach`)
- Topological build ordering (declarative via `turbo.json`, not hand-crafted scripts)
- Changesets for version management (no versioning exists today)
- Automated changelog generation (per-package CHANGELOG.md)
- Package publishing readiness for core, data, matching, filters (currently `"private": true`)
- Directory restructure to `apps/` + `packages/` (clarifies publishable vs deployable)
- CI pipeline for automated releases (Changesets GitHub Action)
- Local build caching (Turborepo default -- every `build:shared` currently rebuilds everything)

**Should have (differentiators):**
- Remote caching via Vercel (free, nearly zero effort to enable later)
- Changeset bot on PRs (catches forgotten changesets)
- tsup build pipeline for publishable packages (faster, cleaner output)
- Yarn catalogs for dependency alignment (eliminates version drift across packages)
- Per-workspace typecheck and lint in Turborepo

**Defer (v2+):**
- Prerelease/snapshot releases (enable when downstream consumers exist)
- Docs site migration to Starlight (only if current site becomes a burden)
- Publishing additional packages beyond core/data/matching/filters

### Architecture Approach

The architecture is additive and layered. Turborepo reads the existing Yarn workspace graph and orchestrates `package.json` scripts -- individual packages do not need modification for orchestration to work. The directory restructure moves `frontend/`, `backend/vaa-strapi/`, and `docs/` into `apps/` while `packages/` stays in place. Publishable packages (core, data, matching, filters) switch from `tsc + tsc-esm-fix` to `tsup` for build, outputting to `dist/` with proper conditional `exports` for ESM+CJS consumers. Changesets operates independently of Turborepo -- one handles builds, the other handles versions.

**Major components:**
1. **`turbo.json` (root)** -- Task graph definition with `dependsOn` for topological ordering, `outputs` for caching, and `inputs` for change detection
2. **`.changeset/config.json` (root)** -- Versioning config with linked package groups, ignore lists for private packages, and `updateInternalDependencies` for cascade control
3. **`tsup.config.ts` (per publishable package)** -- Build config replacing `tsc-esm-fix` workaround, producing ESM+CJS dual output with type declarations
4. **`.github/workflows/release.yml` (new)** -- Changesets GitHub Action for automated version PRs and npm publishing
5. **`apps/` directory (new)** -- Contains frontend, strapi, and docs as deployable applications separated from library packages

**Key patterns:**
- Turborepo as additive layer (wraps existing scripts, does not replace Yarn)
- Package-level Turborepo overrides for non-standard builds (e.g., docs site with code generation)
- Conditional exports for published packages (ESM + CJS with proper `types` conditions)
- Linked versioning for coupled packages (core + data + matching version together)

### Critical Pitfalls

1. **Changesets publishes with `workspace:^` intact** -- The default `npm publish` command does not resolve Yarn's workspace protocol. Published packages would be non-installable. Prevention: configure `yarn npm publish` as the publish command and add a CI dry-run check that greps packed tarballs for `workspace:` strings.

2. **All packages are `"private": true`** -- Publishing silently does nothing. Prevention: audit and flip `private` flag for core, data, matching, filters before configuring Changesets. Add `publishConfig: { "access": "public" }` for scoped packages.

3. **Missing npm package metadata** -- Packages lack `description`, `license`, `repository`, `author`, `files`, `engines`. npm will reject or produce ugly package pages. Prevention: create a shared metadata template and apply to all publishable packages before first publish.

4. **Version cascade avalanche** -- A typo fix in `core` could cascade version bumps to 8+ packages. Prevention: use independent versioning (not fixed/lockstep), keep `workspace:^` ranges, and use `updateInternalDependencies: "patch"` not `"always"`.

5. **Turborepo `outputs` misconfiguration** -- Different packages use different output directories (`build/`, `dist/`, `.svelte-kit/`). A generic outputs config causes stale cache hits. Prevention: define comprehensive output patterns in `turbo.json` and verify with clean-rebuild-from-cache testing.

## Implications for Roadmap

Based on combined research, the work naturally divides into 5 phases with strict ordering constraints. Phases 1-4 are core delivery; Phase 5 is refinement.

### Phase 1: Build Orchestration and Immediate Fixes
**Rationale:** Highest DX impact, zero risk to existing functionality. Turborepo is purely additive -- it wraps existing scripts. Fix the known app-shared typo here since it affects caching correctness.
**Delivers:** Cached parallel builds, topological ordering, faster CI, bug fix for app-shared ESM build
**Addresses:** Task orchestration, topological builds, local caching (table stakes from FEATURES.md)
**Avoids:** Pitfall #6 (outputs misconfiguration) -- define outputs carefully; Pitfall #9 (Strapi plugin nesting) -- verify build graph with `--dry-run --graph`; Pitfall #5 (app-shared dual build fragility) -- fix `packagec.json` typo before caching
**Stack:** Turborepo ^2.8, existing Yarn 4
**Key tasks:** Install turbo, create `turbo.json`, update root scripts to use `turbo run`, add `.turbo/` to `.gitignore`, update CI workflow, verify build graph

### Phase 2: Directory Restructure
**Rationale:** Must happen before publishing (clear boundary between apps and packages) and is easier to validate with Turborepo already in place. `turbo run build` validates the new layout immediately. Has the most file-move churn of any phase -- isolate it.
**Delivers:** `apps/` + `packages/` convention, cleaner workspace organization
**Addresses:** Directory restructure (table stakes from FEATURES.md), docs site decision (keep in monorepo at `apps/docs/`)
**Avoids:** Pitfall #8 (docs split causes stale documentation) -- keep docs in monorepo; Pitfall #9 (nested Strapi plugin) -- update workspace globs correctly
**Key tasks:** Move frontend/strapi/docs to `apps/`, update workspace paths in root package.json, update Docker compose volumes and Dockerfiles, update CI paths, update docs scripts, update Husky hooks, verify E2E tests pass, verify Docker dev stack starts

### Phase 3: Version Management
**Rationale:** Independent of Phases 1-2 technically, but better to have build orchestration and directory structure settled first so the version workflow operates on the final layout. Publishing depends on this.
**Delivers:** Automated versioning, changelog generation, release PR workflow, changeset bot
**Addresses:** Changesets setup, changelog generation, CI publishing pipeline (table stakes from FEATURES.md); changeset bot (differentiator)
**Avoids:** Pitfall #4 (version cascade) -- use independent versioning with `linked` only for core+data+matching; Pitfall #15 (Yarn version vs Changesets conflict) -- only install Changesets; Pitfall #10 (0.x SemVer confusion) -- start stable packages at 1.0.0
**Stack:** Changesets ^2.30, @changesets/changelog-github, changesets/action
**Key tasks:** Install Changesets CLI, create `.changeset/config.json`, create `.github/workflows/release.yml`, decide initial version numbers (recommend 1.0.0 for core/data/matching/filters), configure linked groups and ignore lists, document changeset workflow in CONTRIBUTING.md

### Phase 4: Package Publishing Readiness
**Rationale:** Depends on all three prior phases -- needs Turborepo for build validation, correct directory layout for metadata paths, and Changesets for version management. This is where most pitfalls concentrate (5 of 15).
**Delivers:** Publishable npm packages (@openvaa/core, @openvaa/data, @openvaa/matching, @openvaa/filters on npm)
**Addresses:** Package publishing readiness, tsup migration (table stakes + differentiator from FEATURES.md)
**Avoids:** Pitfall #1 (workspace: protocol leak) -- configure `yarn npm publish`, add tarball inspection CI step; Pitfall #2 (private: true blocks publish) -- flip flags; Pitfall #3 (missing metadata) -- apply metadata template; Pitfall #7 (moduleResolution: Bundler breaks consumers) -- verify external import works in fresh Node.js project; Pitfall #12 (npm org not registered) -- register @openvaa org first
**Stack:** tsup, npm registry, @openvaa npm org
**Key tasks:** Register @openvaa npm org on npmjs.com, migrate core/data/matching/filters builds to tsup (output to `dist/`), update package.json with full metadata (license, description, repository, files, publishConfig, engines), remove `"private": true`, test with `yarn pack` and fresh Node.js project install, wire `yarn npm publish` in Changesets config, execute first real publish

### Phase 5: Polish and Optimization
**Rationale:** Enhancements that are valuable but not blocking. Enable once the core pipeline is proven in production.
**Delivers:** Faster CI, better dependency alignment, contributor tooling improvements
**Addresses:** Remote caching, Yarn catalogs, per-workspace lint/typecheck (differentiators from FEATURES.md)
**Key tasks:** Enable Vercel remote cache (`turbo login` + `turbo link`), upgrade Yarn to 4.10+ for catalogs, migrate shared dependency versions to catalogs, configure per-workspace lint and typecheck tasks in turbo.json, document prerelease mode for future use

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Turborepo validates the workspace graph. With Turbo in place, the directory restructure can be verified immediately with `turbo run build`. Without it, validation requires manual checking of every build path.
- **Phase 2 before Phase 4:** Publishing metadata includes `repository.directory` paths. Get the directory structure right first so metadata is correct from the start. Avoid publishing packages with wrong directory references.
- **Phase 3 before Phase 4:** Publishing requires version management. Changesets must be configured before the publish pipeline can work. The `changeset publish` command is the mechanism for npm publishing.
- **Phase 4 is the critical path:** It concentrates the most pitfalls (5 of 15) and has the highest recovery cost if done wrong. All prior phases systematically de-risk it.
- **Phase 5 is independent:** Can happen any time after Phase 1. Placed last because it is purely incremental improvement with no blocking dependencies on later work.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Directory Restructure):** Docker compose path updates and E2E test path sensitivity need careful analysis of actual Dockerfiles and test configs. The Docker dev setup has hard-coded paths in volume mounts. Also need to verify the docs site build scripts after path changes -- they reference `../frontend` for component extraction.
- **Phase 4 (Publishing Readiness):** The Changesets + Yarn 4 `workspace:^` publish interaction needs hands-on testing. The `changeset version` step resolves protocols in package.json, but the `changeset publish` step may not use `yarn npm publish` by default. Must verify with a dry-run before the first real publish. Also need to test that tsup output is compatible with all internal consumers (frontend, backend, app-shared) before switching from tsc.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Build Orchestration):** Turborepo setup on existing Yarn workspaces is extremely well-documented. Official "add to existing repo" guide covers this exact scenario.
- **Phase 3 (Version Management):** Changesets setup is well-documented with official config examples and a template GitHub Action workflow. No novel integration.
- **Phase 5 (Polish):** Remote caching, Yarn catalogs, and per-workspace tasks are documented features with minimal config changes.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Turborepo + Changesets are dominant tools with extensive official docs. Compatibility with Yarn 4 + Node 20 verified. All alternatives evaluated and rejected with clear rationale. No new unproven tools. |
| Features | HIGH | Feature set maps directly to established monorepo patterns. Complexity estimates grounded in actual codebase analysis. Total estimated effort: 13-22 hours across phases. Clear P1/P2/defer prioritization. |
| Architecture | HIGH | All changes are additive. Turborepo does not replace Yarn, tsup does not replace TypeScript type checking. Each layer has a clear, bounded responsibility. Build order for implementation is well-defined. |
| Pitfalls | HIGH | Pitfalls verified against actual codebase (package.json files, build scripts, CI workflows, existing bugs). The workspace:^ publish issue is well-documented in Changesets issue tracker (#432, #1454) with known workarounds. |

**Overall confidence:** HIGH

### Gaps to Address

- **Changesets + `yarn npm publish` interaction:** The `changeset version` command resolves `workspace:^` in package.json, but the publish step behavior with Yarn 4 needs end-to-end verification. Documented in Changesets issues #432 and #1454 with an unmerged fix PR. Must be tested before first real publish.

- **npm OIDC trusted publishing:** Requires npm CLI >= 11.5.1 and Node >= 22.14.0. OpenVAA is on Node 20, so OIDC is likely unavailable. Fallback: use NPM_TOKEN secret in GitHub Actions. Verify during Phase 4 setup.

- **Strapi plugin workspace nesting:** The `backend/vaa-strapi/src/plugins/*` workspace glob creates a nested workspace inside another workspace. Turborepo should handle this via the package dependency graph, but needs verification with `turbo build --graph` during Phase 1.

- **app-shared CJS necessity:** Strapi v5 supports ESM. If the planned Supabase migration (2026 roadmap) removes Strapi, the CJS build of app-shared becomes dead code. For now, keep the dual build but flag for evaluation during Supabase migration planning.

- **License for published packages:** The codebase uses AGPL-3.0. Need to confirm this is the intended license for published npm packages, as AGPL may deter some potential consumers. This is a project governance decision, not a technical one -- must be resolved before Phase 4.

- **Initial version number decision:** Research recommends starting publishable packages at 1.0.0 (they are production-used with stable APIs). This is a team decision that should be made explicitly during Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- [Turborepo: Add to existing repository](https://turborepo.dev/docs/getting-started/add-to-existing-repository)
- [Turborepo: Configuring tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)
- [Turborepo: Structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
- [Turborepo: Publishing libraries guide](https://turborepo.dev/docs/guides/publishing-libraries)
- [Turborepo 2.7 release (Yarn 4 catalogs)](https://turborepo.dev/blog/turbo-2-7)
- [Vercel Remote Cache free announcement](https://turborepo.dev/blog/free-vercel-remote-cache)
- [Changesets repository](https://github.com/changesets/changesets) -- v2.30.0, 11.5k stars
- [Changesets documentation](https://changesets-docs.vercel.app/)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [Changesets workspace protocol issue #432](https://github.com/changesets/changesets/issues/432)
- [Changesets yarn publish issue #1454](https://github.com/changesets/changesets/issues/1454)
- [tsup documentation](https://tsup.egoist.dev/)
- [Yarn workspace protocol docs](https://yarnpkg.com/features/workspaces)
- [Yarn release workflow](https://yarnpkg.com/features/release-workflow)
- [Dual ESM/CJS publishing guide](https://mayank.co/blog/dual-packages/)

### Secondary (MEDIUM confidence)
- [TypeScript ESM+CJS npm publishing in 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)
- [Turborepo vs Nx comparison](https://dev.to/thedavestack/nx-vs-turborepo-integrated-ecosystem-or-high-speed-task-runner-the-key-decision-for-your-monorepo-279)
- [Changesets vs semantic-release](https://brianschiller.com/blog/2023/09/18/changesets-vs-semantic-release/)
- [Monorepo tools comparison 2026](https://www.aviator.co/blog/monorepo-tools/)
- [Monorepo versioning strategies](https://amarchenko.dev/blog/2023-09-26-versioning/)
- [npm OIDC trusted publishing](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [JSR + Yarn integration (future Deno path)](https://deno.com/blog/add-jsr-with-pnpm-yarn)
- [SemVer specification](https://semver.org/)

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*

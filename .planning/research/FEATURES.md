# Feature Landscape: Monorepo Refresh

**Domain:** Monorepo tooling, versioning, publishing, and organization for an existing TypeScript monorepo
**Researched:** 2026-03-12
**Overall confidence:** HIGH (well-established ecosystem patterns, verified against official docs)

## Table Stakes

Features users (both maintainers and downstream consumers) expect. Missing any of these means the monorepo refresh feels incomplete.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|-------------|------------|--------------|-------|
| Task orchestration with caching | Current `yarn workspaces foreach` is slow, no caching, no parallelism. Any modern monorepo has this. | Low | Yarn 4 (existing) | Turborepo is the standard addition on top of Yarn workspaces. Drop-in, additive. |
| Topological build ordering | Currently manual (`build:shared` script chains). Should be declarative and automatic. | Low | Turborepo `turbo.json` | `dependsOn: ["^build"]` handles this natively. Replaces hand-crafted `yarn workspaces foreach -Rt`. |
| Changesets for version management | No version bumping, no changelogs, no coordinated releases exist today. All packages at `0.1.0` with `"private": true`. | Medium | Changesets CLI + config | Industry standard for monorepo versioning. Used by Svelte, Astro, Turborepo themselves. |
| Changelog generation | Contributors and consumers need to know what changed between releases. Manual changelogs are never maintained. | Low | Changesets (auto-generates from changeset descriptions) | Comes free with Changesets workflow. Per-package CHANGELOG.md files. |
| Package publishing readiness | `core`, `data`, `matching` are explicitly targeted for npm publishing per PROJECT.md. Currently `"private": true` with incomplete `exports`. | Medium | Package.json metadata, proper `exports` field, build pipeline | Requires removing `"private": true`, adding `"license"`, `"repository"`, `"files"`, proper conditional `exports`. |
| apps/packages directory restructure | Current flat structure mixes deployable apps (frontend, backend, docs) with library packages. Convention is `apps/` vs `packages/`. | Medium | File moves, workspace config updates, CI updates, Docker path updates | Turborepo convention. Clarifies what is publishable vs deployable. |
| CI pipeline for publishing | No automated release pipeline exists. Publishing should happen via GitHub Actions on merge. | Medium | Changesets GitHub Action, NPM_TOKEN secret | Standard workflow: changeset bot checks PRs, version PR auto-created, merge triggers publish. |
| Local build caching | Rebuilding unchanged packages wastes developer time. Every `yarn build:shared` rebuilds everything. | Low | Turborepo (enabled by default) | Turborepo hashes inputs and skips unchanged tasks. Immediate DX win. |

## Differentiators

Features that improve the project beyond baseline expectations. Not required for a functional monorepo but provide significant value.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Remote caching | Share build cache across CI runs and developers. Vercel Remote Cache is free on all plans, even without hosting on Vercel. | Low | Turborepo + Vercel account (free) | Saves CI minutes. Not strictly needed for 9 packages but nearly free to enable. |
| Changeset bot on PRs | Automatically comments on PRs missing changesets, prompting contributors to add them before review. | Low | Install changeset-bot GitHub App | Improves contributor workflow, catches forgotten changesets. Zero code changes. |
| tsup build pipeline (replacing tsc + tsc-esm-fix) | Current build uses raw `tsc` plus `tsc-esm-fix` post-processing workaround. tsup is faster, handles ESM+CJS in one step, produces tree-shakeable output. Recommended by Turborepo's own publishing guide. | Medium | tsup config per publishable package | 4 packages (core, data, matching, filters) currently use `tsc-esm-fix`. tsup is the standard TypeScript library bundler in 2025-2026. |
| Prerelease/snapshot releases | Allow testing unreleased versions before cutting official releases (e.g., `0.2.0-next.1`). | Low | Changesets prerelease mode (config only) | Useful for downstream consumers testing canary builds. Already supported by Changesets. |
| Yarn catalogs for dependency alignment | Centralize dependency versions across packages. Supported since Yarn 4.10.0; Turborepo 2.7 added lockfile-aware caching for catalogs. | Low | Yarn upgrade from 4.6.0 to >= 4.10.0 | Eliminates version drift. Currently vitest is `^2.1.8` in most packages but `^4.0.15` in docs. TypeScript is `^5.7.2` in some, `^5.7.3` in others. |
| Per-workspace typecheck and lint in Turborepo | Run type checking and linting per-workspace with caching, instead of current global lint scripts. | Medium | turbo.json task definitions, per-workspace scripts | Catches errors per-package. Enables caching of lint results. Current `lint:check` runs globally and rebuilds app-shared every time. |

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong for this project at this stage.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Migrate from Yarn 4 to pnpm | pnpm has better monorepo DX in isolation, but migration cost is high: Docker configs, CI pipelines, developer muscle memory, and the `onchange` watcher script all assume Yarn. PROJECT.md mentions evaluation but does not mandate a switch. | Keep Yarn 4. Add Turborepo on top (works with any package manager). Revisit only if Yarn becomes a concrete blocker. |
| Adopt Nx instead of Turborepo | Nx is more powerful (affected detection, generators, plugins) but dramatically more opinionated and invasive. For 9 packages, Nx is overkill. Community reports it "takes over your entire development workflow." | Use Turborepo for simple, additive task orchestration. Nx adds complexity without proportional benefit at this scale. |
| Migrate docs site from SvelteKit to Astro/Starlight | Tempting because Starlight is purpose-built for docs. But the docs site already works, uses SvelteKit (team expertise), and has substantial custom tooling (typedoc generation, component docs extraction, route map generation, link validation). Migration cost is high for unclear benefit. | Keep SvelteKit docs site. Evaluate Starlight only in a future milestone if docs needs outgrow current tooling. |
| Split docs to a separate repository | Docs reference internal packages (`@openvaa/app-shared` as a dependency), generate API docs from source code, and share the build pipeline. A separate repo breaks these workflows and adds cross-repo sync burden. | Keep docs in monorepo. Move to `apps/docs/` following Turborepo convention. |
| Build custom release orchestration | Changesets already solves versioning, changelog generation, cross-package dependency updates, and npm publishing. Custom tooling is maintenance burden for a solved problem. | Use Changesets as-is with the official GitHub Action. |
| Publish ALL packages to npm | `app-shared` bridges frontend and backend with deployment-specific settings. `shared-config` is ESLint/TS config. `argument-condensation`, `question-info`, `llm` are experimental. Publishing them creates public API surface area with maintenance burden. | Publish only `core`, `data`, `matching`, `filters` (general-purpose packages useful outside OpenVAA). Keep others `"private": true`. |
| Adopt Lerna | Lerna was the original monorepo tool but is now maintained by Nx (acquired 2022). It adds a layer of abstraction without clear benefit over Turborepo + Changesets. The JavaScript community has moved on. | Use Turborepo + Changesets directly. Simpler, better maintained, more active ecosystem. |
| Use semantic-release instead of Changesets | semantic-release is commit-message-driven (Conventional Commits). Changesets is explicit-intent-driven. For a project with mixed contributor experience and no existing Conventional Commits convention, explicit changeset files are clearer and more forgiving. | Use Changesets. It separates "what changed" from "how the commit message is formatted." |
| Adopt Moon (monorepo tool) | Moon is polyglot-focused (Rust, Go, etc.) and uses a custom task runner language. OpenVAA is TypeScript-only. Moon adds unnecessary complexity for a single-language repo. | Turborepo is purpose-built for JavaScript/TypeScript monorepos. |

## Feature Dependencies

```
Turborepo setup ─────────────> Cached builds (immediate win)
                ─────────────> Topological ordering (immediate win)
                ─────────────> Remote caching (optional, trivial to enable later)
                ─────────────> Per-workspace lint/typecheck (after setup)

Directory restructure ───────> apps/ vs packages/ split
                      ───────> Workspace glob updates in root package.json
                      ───────> Docker compose path updates
                      ───────> CI workflow path updates
                      ───────> TypeScript project reference updates

Changesets setup ────────────> Version management
                 ────────────> Changelog generation (automatic)
                 ────────────> GitHub Action for release PRs
                 ────────────> Changeset bot on PRs (optional)

Package publishing readiness:
    Requires: Changesets setup (version management)
    Requires: tsup build pipeline OR verified tsc output for ESM+CJS
    Requires: Proper package.json metadata (exports, files, license, repository)
    Requires: npm org (@openvaa) claimed and tokens configured
    Enables:  `changeset publish` in CI
```

Key ordering constraint: **Turborepo, directory restructure, and Changesets are independent of each other and can be done in parallel or any order.** However, **publishing readiness requires all three** (proper build output from Turborepo-orchestrated builds, proper metadata, and version management from Changesets).

## MVP Recommendation

**Phase 1 -- Foundation (do first, highest DX impact):**
1. Add Turborepo with `turbo.json` -- task orchestration, caching, topological ordering
2. Restructure to `apps/` + `packages/` convention -- clarity, aligns with ecosystem

**Phase 2 -- Versioning (do second, enables release workflow):**
3. Install and configure Changesets CLI and `.changeset/config.json`
4. Set up Changesets GitHub Action + changeset-bot
5. Upgrade Yarn to 4.10+ and enable catalogs for dependency alignment

**Phase 3 -- Publishing (do last, depends on phases 1 and 2):**
6. Migrate publishable packages from `tsc + tsc-esm-fix` to `tsup`
7. Update package.json metadata for publishable packages (core, data, matching, filters)
8. Wire up npm publish workflow via Changesets GitHub Action with NPM_TOKEN

**Defer to future milestones:**
- Remote caching: Enable when CI times become painful. Nearly zero effort when ready.
- Prerelease/snapshot releases: Enable when downstream consumers exist.
- Per-workspace lint/typecheck: Refine after Turborepo is established.

## Complexity Budget

| Feature | Estimated Effort | Risk Level |
|---------|-----------------|------------|
| Turborepo setup | 1-2 hours | Very low -- additive, single config file, no existing code changes |
| Directory restructure | 3-5 hours | Medium -- many file moves, Docker path updates, import paths, workspace globs |
| Changesets setup | 1-2 hours | Low -- well-documented, standard config, minimal existing code impact |
| GitHub Action for releases | 1-2 hours | Low -- template workflow from changesets/action repo |
| Yarn catalog upgrade | 1 hour | Low -- minor version bump, opt-in feature |
| tsup migration (4 packages) | 3-5 hours | Medium -- need to verify output compatibility with all consumers |
| Package.json metadata cleanup | 2-3 hours | Low -- mechanical but needs careful review of each field |
| npm publish workflow | 1-2 hours | Medium -- requires npm org setup, token management, first publish testing |

**Total estimated:** 13-22 hours of focused work, spread across 3 phases.

## Existing Infrastructure to Preserve

The following must continue working through the refresh:

| What | Current State | Constraint |
|------|--------------|------------|
| `yarn dev` Docker workflow | Builds shared packages, starts Docker Compose stack, watches for changes via `onchange` | Turborepo replaces `yarn workspaces foreach` in build step. `onchange` watcher may need path updates if dirs move. |
| `yarn test:e2e` | Playwright E2E tests (v1.0 milestone, 56 requirements) | Path-sensitive -- if frontend/backend move to `apps/`, test configs need updating. |
| `yarn test:unit` | Vitest unit tests across packages + frontend + backend | Must still work per-workspace. Turborepo can orchestrate these. |
| `yarn lint:check` / `yarn format:check` | Global lint and format scripts | Can be migrated to per-workspace Turborepo tasks incrementally. |
| `yarn build:app-shared` | Critical build step producing ESM + CJS dual output | app-shared stays `"private": true` but build must still produce both formats for Strapi (CJS) and frontend (ESM). |
| Docker compose configs | Reference `backend/vaa-strapi/` and `frontend/` paths in volumes and build contexts | If apps move to `apps/`, Docker Compose files need path updates. |
| TypeScript project references | `tsconfig.json` files use relative `"path"` references to sibling packages | Must be updated if package directories move. |
| Husky + lint-staged | Pre-commit hooks for formatting | Continue working unchanged. |
| `onchange` watcher | Watches `packages/*/src/**/*` for rebuilds during `yarn dev` | Glob pattern stays valid if packages/ directory is preserved. |

## Sources

- [Turborepo: Structuring a Repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) -- HIGH confidence, official docs
- [Turborepo: Publishing Libraries](https://turborepo.dev/docs/guides/publishing-libraries) -- HIGH confidence, official docs
- [Turborepo 2.7 Release (Yarn 4 catalogs support)](https://turborepo.dev/blog/turbo-2-7) -- HIGH confidence, official blog
- [Vercel Remote Cache is free](https://turborepo.dev/blog/free-vercel-remote-cache) -- HIGH confidence, official blog
- [Changesets GitHub repository](https://github.com/changesets/changesets) -- HIGH confidence, official source
- [Changesets GitHub Action](https://github.com/changesets/action) -- HIGH confidence, official source
- [Changesets documentation](https://changesets-docs.vercel.app/) -- HIGH confidence, official docs
- [tsup documentation](https://tsup.egoist.dev/) -- HIGH confidence, official docs
- [TypeScript ESM+CJS npm publishing in 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) -- MEDIUM confidence, well-regarded security author
- [Turborepo, Nx, and Lerna: Monorepo Tooling in 2026](https://dev.to/dataformathub/turborepo-nx-and-lerna-the-truth-about-monorepo-tooling-in-2026-71) -- MEDIUM confidence, comparison article
- [Best Monorepo Tools 2026](https://www.pkgpulse.com/blog/best-monorepo-tools-2026) -- MEDIUM confidence, comparison article
- [Complete Monorepo Guide: pnpm + Changesets (2025)](https://jsdev.space/complete-monorepo-guide/) -- MEDIUM confidence, tutorial
- [Monorepos in JavaScript, Anti-Pattern](https://medium.com/@PepsRyuu/monorepos-in-javascript-anti-pattern-917603da59c8) -- MEDIUM confidence, community analysis on unnecessary fragmentation
- [Building a TypeScript Library in 2025](https://dev.to/arshadyaseen/building-a-typescript-library-in-2025-2h0i) -- MEDIUM confidence, ecosystem overview
- [Tutorial: publishing ESM-based npm packages with TypeScript](https://2ality.com/2025/02/typescript-esm-packages.html) -- MEDIUM confidence, Dr. Axel Rauschmayer (well-regarded author)

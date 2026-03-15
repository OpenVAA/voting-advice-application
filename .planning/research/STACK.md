# Stack Research

**Domain:** Monorepo tooling, versioning, publishing, and docs site for an existing Yarn 4 workspace monorepo
**Researched:** 2026-03-12
**Confidence:** HIGH (core recommendations) / MEDIUM (docs site evaluation)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Yarn 4 Workspaces | 4.6.0 | Package management, workspace orchestration | Already in use, no migration cost. Yarn 4 handles dependency resolution, workspace linking, and the `workspace:^` protocol. Switching package managers mid-monorepo is high risk for zero gain. |
| Turborepo | ^2.8 | Build orchestration, task caching | Layers on top of Yarn 4 workspaces without replacing them. Adds parallel task execution, intelligent caching (local + free Vercel remote), and dependency-aware task graphs. 10-minute setup for existing repos. Minimal config surface (`turbo.json`). |
| Changesets | ^2.30.0 | Version management, changelog generation, release coordination | De facto standard for monorepo versioning (11.5k GitHub stars, 497 releases, actively maintained). Designed for monorepos first. Decouples version bumps from commit messages. Contributors declare changes via changeset files, CI automates the rest. |
| changesets/action | latest | GitHub Actions CI integration for automated releases | Official GitHub Action that creates "Version Packages" PRs with bumped versions and changelogs. Merge to publish. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@changesets/changelog-github` | latest | GitHub-linked changelog entries | Always. Generates changelogs with PR links and contributor attribution. |
| `turbo` (global) | ^2.8 | CLI for running turbo commands | Install globally for developer convenience, plus as devDependency in root package.json for CI reproducibility. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `turbo.json` | Task pipeline configuration | Define `build`, `test:unit`, `lint:check`, `format:check` tasks with proper `dependsOn` and `outputs`. Start minimal, expand incrementally. |
| `.changeset/config.json` | Changesets configuration | Set `access: "public"` for publishable packages, configure `linked` groups for packages that should version together, and `ignore` for private packages. |
| Vercel Remote Cache | Shared build cache across CI and developers | Free on all Vercel plans (announced Jan 2025). Link repo via `turbo login` + `turbo link`. Dramatically speeds up CI. |

## Current State Analysis

The existing monorepo has these characteristics that inform decisions:

| Aspect | Current State | Implication |
|--------|---------------|-------------|
| Package manager | Yarn 4.6.0 with `node-modules` linker | Keep Yarn 4. No reason to migrate. |
| Workspace protocol | All internal deps use `workspace:^` | Changesets handles this natively via `changeset version`. Publishing requires attention (see Pitfalls). |
| Package privacy | All packages marked `"private": true` | Must flip to `"private": false` for core, data, matching before publishing. |
| Exports | ESM-only for most packages, dual ESM+CJS for app-shared | Good foundation. Need to add `repository`, `license`, `description`, `keywords`, `homepage` fields for publishable packages. |
| Build tool | `tsc --build` + `tsc-esm-fix` | Turborepo wraps this, doesn't replace it. |
| CI | GitHub Actions with 4 jobs (frontend, backend, e2e, visual-perf) | Turborepo can optimize shared steps (install, build:shared). Changesets adds a release workflow. |
| Node version | 20.18.1 | Constrains tool choices (rules out Monoweave which requires Node >= 22). |
| Docs site | SvelteKit + mdsvex + adapter-static on GitHub Pages | Already works. Evaluate whether migration is worth the effort (see Docs Site Evaluation below). |

## Detailed Recommendations

### 1. Monorepo Orchestration: Turborepo (not Nx, not bare Yarn)

**Decision: Add Turborepo as a thin caching/orchestration layer on top of Yarn 4 workspaces.**

**Rationale:**
- Yarn 4 already handles workspace resolution, dependency installation, and the `workspace:` protocol. These are not problems to solve again.
- What Yarn 4 lacks: intelligent task caching, parallel execution with dependency awareness, and remote cache sharing.
- Turborepo solves exactly those gaps with minimal config. A single `turbo.json` file. No schema changes, no generators, no plugins.
- Adding Turborepo to an existing Yarn workspace takes under 10 minutes: `yarn add -D turbo`, create `turbo.json`, add `.turbo` to `.gitignore`.

**Why not Nx:**
- Nx wants to own the workspace. It has its own project graph, generators, plugins, and configuration format (`project.json` or inferred).
- For a project that already has a working Yarn 4 workspace with 9 packages, 2 apps, and docs, Nx is a lateral migration with high effort and unclear benefit.
- Nx's advantage (fine-grained affected detection for 50+ packages) is irrelevant at OpenVAA's scale.
- Nx recently started requiring a license fee for using Vercel Remote Cache (as of v19.7+).

**Why not bare Yarn 4:**
- Yarn 4's `yarn workspaces foreach` is sequential by default and has no caching. The current `build:shared` script already suffers from this -- it rebuilds everything every time.
- The `watch:shared` script uses `onchange` which is fragile and doesn't understand the dependency graph.
- Turborepo's `turbo run build` understands that `core` must build before `data` and `matching`, caches results, and parallelizes independent tasks.

**Minimal `turbo.json` for OpenVAA:**

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**"]
    },
    "test:unit": {
      "dependsOn": ["build"]
    },
    "lint:check": {
      "dependsOn": ["build"]
    },
    "format:check": {}
  }
}
```

### 2. Version Management: Changesets (not semantic-release, not Yarn release workflow, not Monoweave)

**Decision: Use Changesets for version management, changelog generation, and release coordination.**

**Rationale:**
- Changesets is the dominant tool for monorepo versioning. 11.5k stars, 182 contributors, actively maintained (v2.30.0 released March 2026).
- Designed for monorepos first. Understands cross-package dependencies and cascading version bumps.
- Decouples version intent from commit history. Contributors add a changeset file describing what changed and the semver bump level. This is reviewable in PRs.
- The `changesets/action` GitHub Action automates the release cycle: accumulates changesets, creates a "Version Packages" PR with updated versions and changelogs, and publishes on merge.

**Why not semantic-release:**
- Fundamentally designed for single-package repos. Monorepo support requires complex per-package configuration.
- Tightly couples version bumps to commit message format (Conventional Commits). This is fragile in a monorepo where a single commit may touch multiple packages.
- Git tag collisions in monorepos with multiple packages.

**Why not Yarn's built-in release workflow:**
- Yarn's `yarn version` with deferred versioning is a lower-level primitive. It handles version bumping but has no changelog generation, no GitHub Action, no automated PR flow, no npm publishing automation.
- You would need to build all the CI/CD automation that Changesets provides out of the box.

**Why not Monoweave:**
- Requires Node >= 22. OpenVAA is on Node 20.18.1 and the engine is locked in package.json. Upgrading Node is a separate initiative.
- Only 22 GitHub stars vs Changesets' 11.5k. Much smaller community, fewer battle-tested edge cases.
- If the project later moves to Node 22+, Monoweave could be reconsidered for its native Yarn workspace protocol support, but the Node constraint is a hard blocker today.

**Changesets configuration for OpenVAA:**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [
    ["@openvaa/core", "@openvaa/data", "@openvaa/matching", "@openvaa/filters"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@openvaa/app-shared",
    "@openvaa/strapi",
    "@openvaa/frontend",
    "@openvaa/docs",
    "@openvaa/shared-config",
    "@openvaa/llm",
    "@openvaa/argument-condensation",
    "@openvaa/question-info"
  ]
}
```

The `linked` array ensures core, data, matching, and filters always release together (they share tight API boundaries). The `ignore` list excludes private/app packages from the publishing pipeline.

### 3. Publishing Pipeline: Changesets + Yarn npm publish

**Decision: Use Changesets' publish flow with attention to the Yarn 4 workspace protocol.**

**Known issue (MEDIUM confidence):** Changesets v2.30.0 historically used `npm publish` internally rather than `yarn npm publish`. This means the `workspace:^` protocol in published package.json files may not be resolved to concrete version numbers. A PR to fix this (changesets/changesets#1560) is open but unmerged as of March 2026.

**However**, the `changeset version` command itself DOES replace `workspace:^` references with concrete versions in the package.json files before publishing. The risk is primarily around edge cases during the publish step itself.

**Mitigation strategy (in order of preference):**

1. **Test the flow end-to-end:** After `changeset version` runs, verify that the package.json files in each publishable package have concrete version numbers (not `workspace:^`). If they do, `npm publish` will work correctly since the references are already resolved.

2. **Custom publish command:** If option 1 doesn't work, use a custom script in the GitHub Action that runs `yarn npm publish` for each changed package instead of `changeset publish`.

3. **Yarn patch:** Patch `@changesets/cli` to use `yarn npm publish` via `yarn patch @changesets/cli`. This is a documented community workaround.

**For future Deno/JSR publishing:**
- JSR (JavaScript Registry) now supports packages from Yarn workspaces. Publishing to JSR uses `deno publish` and can work alongside npm publishing.
- This is a future concern (Milestone #5: Deno Investigation). Do not add JSR publishing now. The packages need to be pure ESM with clean exports first, which is already the case.

### 4. Docs Site: Keep Current SvelteKit Site (Evaluate Starlight for v2.0)

**Decision: Do NOT migrate the docs site now. The current SvelteKit + mdsvex + adapter-static setup works and is deployed. Evaluate Astro Starlight when/if a major docs overhaul is needed.**

**Rationale for keeping current setup:**
- The docs site is already built, deployed to GitHub Pages, and has a working CI pipeline.
- It uses SvelteKit (consistent with the main app framework), mdsvex for markdown, TypeDoc for API docs, and auto-generation scripts.
- Migration would be a large effort with no user-facing benefit right now.
- The docs site already uses Svelte 5 (v5.46.1 in its dependencies), so it is on a modern stack.

**Why Starlight is the future candidate (not VitePress):**
- Starlight is purpose-built for documentation. Built-in search (Pagefind), i18n (i18next), sidebar navigation, dark mode, accessibility, SEO -- all zero-config.
- Starlight supports Svelte components natively via `@astrojs/svelte`. OpenVAA could reuse Svelte components in docs.
- `starlight-typedoc` plugin (v0.21.4) generates API docs from TypeScript -- directly replacing the current custom TypeDoc scripts.
- Starlight v1.0 is expected in early 2026, marking stability.
- VitePress is Vue-only. OpenVAA is a Svelte project. No reason to introduce Vue.

**When to migrate:**
- If the current docs site becomes a maintenance burden
- If a major docs restructure is needed (e.g., for v2.0 public launch)
- After Starlight reaches v1.0 stable

**If/when migrating, the approach:**
- Starlight can live in `docs/` as a standalone Astro project
- Markdown content ports directly (mdsvex to MDX with minimal changes)
- TypeDoc integration via `starlight-typedoc` replaces custom scripts
- GitHub Pages deployment stays the same (static output)

## Installation

```bash
# Turborepo - add to root devDependencies
yarn add -D turbo

# Changesets - add to root devDependencies
yarn add -D @changesets/cli @changesets/changelog-github

# Initialize Changesets config
yarn changeset init

# Add .turbo to .gitignore
echo ".turbo" >> .gitignore
```

No other installations needed. The docs site stays as-is.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Turborepo | Nx | When you have 50+ packages and need fine-grained affected detection, code generators, or a plugin ecosystem. Not warranted for OpenVAA's 9-package monorepo. |
| Turborepo | Bare Yarn 4 | When your monorepo is tiny (2-3 packages) and build times are negligible. OpenVAA already has slow builds due to sequential `workspaces foreach`. |
| Changesets | Monoweave | When on Node >= 22 and want native Yarn workspace protocol support without workarounds. Blocked by OpenVAA's Node 20 requirement. |
| Changesets | semantic-release | When you have a single-package repo with strict Conventional Commits discipline. Poor fit for monorepos. |
| Changesets | Yarn version (built-in) | When you want maximum control and are willing to build your own CI/CD automation. Missing changelog generation and GitHub Action. |
| Keep SvelteKit docs | Astro Starlight | When doing a major docs overhaul or when Starlight v1.0 ships. Worth evaluating for v2.0 but not worth migrating now. |
| Keep SvelteKit docs | VitePress | Never for this project. Vue-only, wrong framework ecosystem. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Lerna | Effectively abandoned as an independent tool. Now just an Nx wrapper. Adds complexity without unique value. | Turborepo + Changesets |
| Nx | Requires buy-in to Nx's project model. Migration cost is high for an existing Yarn 4 workspace. License fee for Vercel Remote Cache. Overkill for 9-package monorepo. | Turborepo |
| semantic-release in monorepo | Not designed for multi-package repos. Git tag collisions, no native cross-package dependency tracking. | Changesets |
| Monoweave (today) | Requires Node >= 22. OpenVAA is locked to Node 20.18.1. Only 22 GitHub stars -- tiny community. | Changesets |
| pnpm migration | Switching package managers is a high-risk, low-reward change. Yarn 4 with `node-modules` linker works. pnpm's advantages (disk space, speed) are marginal for a project this size. | Stay on Yarn 4 |
| VitePress for docs | Vue-only framework. OpenVAA is Svelte. Introduces unnecessary framework divergence. | Keep SvelteKit or migrate to Starlight (supports Svelte) |
| Custom versioning scripts | Reinventing the wheel. Changesets already handles version bumping, changelog generation, cross-package deps, and CI automation. | Changesets |

## Package Publishing Readiness Checklist

Before any package can be published to npm, it needs these `package.json` changes:

| Field | Current State | Required State |
|-------|---------------|----------------|
| `private` | `true` | `false` (for core, data, matching, filters) |
| `version` | `0.1.0` | Keep, Changesets will manage going forward |
| `license` | Missing | `MIT` or chosen license |
| `description` | Missing | Short description of package purpose |
| `repository` | Missing | `{ "type": "git", "url": "https://github.com/OpenVAA/voting-advice-application", "directory": "packages/core" }` |
| `homepage` | Missing | Link to docs site |
| `keywords` | Missing | Relevant search terms |
| `author` | Missing | `OpenVAA` |
| `files` | Missing | `["build"]` to control what gets published |
| `engines` | Missing | `{ "node": ">=20" }` |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `turbo@^2.8` | Yarn 4.6.0 | Turborepo auto-detects Yarn workspaces. Supports `node-modules` linker. Yarn 4 catalogs support added in Turborepo 2.7. |
| `@changesets/cli@^2.30` | Yarn 4.6.0 | Works for `changeset add`, `changeset version`. Publishing may need workaround for `workspace:^` protocol (see above). |
| `@changesets/changelog-github` | `@changesets/cli@^2.30` | Must match Changesets version family. |
| Node 20.18.1 | All recommended tools | Turborepo, Changesets, and Yarn 4 all support Node 20. Monoweave does NOT (requires >= 22). |
| Turborepo | Changesets | Complementary, no conflicts. Turborepo orchestrates builds/tests, Changesets handles versioning/publishing. Common pattern in major open-source monorepos. |

## CI/CD Integration Pattern

### Existing Workflows (keep)
- `main.yaml`: Build validation, lint, unit tests, E2E tests
- `docs.yml`: Docs site build and deploy

### Updated Build Commands (Turborepo)

Replace sequential Yarn commands with Turborepo equivalents:

| Current | With Turborepo | Benefit |
|---------|----------------|---------|
| `yarn build:shared` (sequential foreach) | `turbo run build --filter='./packages/*'` | Parallel + cached |
| `yarn test:unit` (sequential) | `turbo run test:unit` | Parallel + cached |
| `yarn lint:check` (sequential) | `turbo run lint:check` | Parallel + cached |
| `yarn format:check` (independent) | `turbo run format:check` | Cached |

### New Workflow (add)

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.18.1
          cache: "yarn"
      - run: yarn install --frozen-lockfile
      - run: turbo run build --filter='./packages/*'
      - uses: changesets/action@v1
        with:
          publish: yarn changeset publish
          version: yarn changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Sources

- [Turborepo - Add to existing repository](https://turborepo.dev/docs/getting-started/add-to-existing-repository) -- setup guide (HIGH confidence, official docs)
- [Turborepo - Configuring tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) -- turbo.json reference (HIGH confidence, official docs)
- [Vercel Remote Cache is now free](https://turborepo.dev/blog/free-vercel-remote-cache) -- pricing confirmation (HIGH confidence, official announcement)
- [Turborepo 2.7 release](https://turborepo.dev/blog/turbo-2-7) -- Yarn 4 catalogs support (HIGH confidence, official blog)
- [Changesets GitHub repository](https://github.com/changesets/changesets) -- v2.30.0, 11.5k stars (HIGH confidence, primary source)
- [Changesets GitHub Action](https://github.com/changesets/action) -- CI automation (HIGH confidence, official)
- [Changesets Yarn Berry publish PR #1560](https://github.com/changesets/changesets/pull/1560) -- unmerged PR for `yarn npm publish` (HIGH confidence, primary source)
- [Changesets workspace protocol issue #432](https://github.com/changesets/changesets/issues/432) -- known limitation (HIGH confidence, primary source)
- [Monoweave repository](https://github.com/monoweave/monoweave) -- Node >= 22 requirement, 22 stars (HIGH confidence, primary source)
- [Yarn Release Workflow](https://yarnpkg.com/features/release-workflow) -- built-in versioning (HIGH confidence, official docs)
- [Starlight documentation](https://starlight.astro.build/) -- docs framework features (HIGH confidence, official docs)
- [starlight-typedoc plugin](https://github.com/HiDeoo/starlight-typedoc) -- TypeDoc integration v0.21.4 (HIGH confidence, primary source)
- [Astro Svelte integration](https://docs.astro.build/en/guides/integrations-guide/svelte/) -- Svelte 5 component support in Starlight (HIGH confidence, official docs)
- [Nx vs Turborepo comparison](https://dev.to/thedavestack/nx-vs-turborepo-integrated-ecosystem-or-high-speed-task-runner-the-key-decision-for-your-monorepo-279) -- ecosystem comparison (MEDIUM confidence, community analysis)
- [Changesets vs semantic-release](https://brianschiller.com/blog/2023/09/18/changesets-vs-semantic-release/) -- comparison (MEDIUM confidence, community analysis)
- [Release management comparison](https://oleksiipopov.com/blog/npm-release-automation/) -- Changesets vs semantic-release vs release-please (MEDIUM confidence, community analysis)
- [JSR + Yarn integration](https://deno.com/blog/add-jsr-with-pnpm-yarn) -- future Deno publishing path (MEDIUM confidence, official Deno blog)

---
*Stack research for: OpenVAA Monorepo Refresh (v1.1)*
*Researched: 2026-03-12*

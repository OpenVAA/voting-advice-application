# Phase 8: Build Orchestration - Research

**Researched:** 2026-03-12
**Domain:** Monorepo build orchestration with Turborepo
**Confidence:** HIGH

## Summary

Turborepo is the standard build orchestration tool for JavaScript/TypeScript monorepos using Yarn workspaces. The current stable version is **2.8.16** (March 2026). It is installed as a root devDependency, configured via a `turbo.json` file, and provides dependency-aware task execution with local file caching. The project already uses Yarn 4.6 with `nodeLinker: node-modules`, which is the recommended configuration for Turborepo compatibility.

The integration is straightforward for this project: add `turbo` as a devDependency, create `turbo.json` with `build` and `test:unit` task definitions, update root `package.json` scripts to use `turbo run`, and replace the `onchange`-based watcher with `turbo watch`. The main complexity lies in correctly configuring cache outputs for packages with different build strategies (standard tsc+tsc-esm-fix, dual ESM/CJS for app-shared, and asset-copying for argument-condensation/question-info).

**Primary recommendation:** Install `turbo` ^2.8, create a minimal `turbo.json` with two tasks (`build` and `test:unit`), fix the FIX-01 typo in app-shared, update all root scripts, and replace `onchange` with `turbo watch`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- `yarn build` becomes the primary command, mapped to `turbo run build`
- Remove old `build:shared` and `build:app-shared` scripts entirely (clean break, no aliases)
- `yarn dev` uses Turborepo for the initial package build step (replaces `yarn build:shared` in the dev script)
- All root scripts that currently reference `build:shared` or `build:app-shared` (format, format:check, lint:fix, lint:check, docs:prepare) get updated to turbo equivalents
- Update CLAUDE.md and docs to reflect new commands
- turbo.json defines two task pipelines: `build` and `test:unit`
- `build` has `dependsOn: ["^build"]` for topological ordering and `outputs: ["build/**"]` for caching
- `test:unit` has `dependsOn: ["build"]` so packages are built before tests run
- Root `yarn test:unit` script replaced with `turbo run test:unit`
- `watch:shared` replaced with `turbo watch build --filter='./packages/*'` (dependency-aware file watching)
- Lint and typecheck pipelines deferred to Phase 12
- Deno evaluation: quick feasibility note (~1 page), focused on Turborepo's Deno compatibility only, document lives at `.planning/deno-compatibility.md`

### Claude's Discretion
- Exact turbo.json configuration details (inputs, env passthrough, etc.)
- How to handle app-shared's dual ESM/CJS output in turbo cache config
- How to handle packages with asset copying (argument-condensation, question-info prompts)
- Whether incomplete TypeScript project references need fixing alongside Turborepo setup
- How turbo watch integrates with the Docker frontend container restart

### Deferred Ideas (OUT OF SCOPE)
- Native frontend dev without Docker (run SvelteKit directly on host during development, keep Docker for production deployment) -- evaluate during Phase 12 or add as new phase

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUILD-01 | Turborepo is installed and configured with `turbo.json` for all workspace tasks | turbo ^2.8 as root devDependency + turbo.json with build/test:unit tasks |
| BUILD-02 | Build tasks execute in topological order with dependency-aware caching | `dependsOn: ["^build"]` with verified outputs per package |
| BUILD-03 | Local build caching skips unchanged packages on rebuild | outputs config includes build artifacts + .tsbuildinfo files |
| BUILD-04 | Deno compatibility impact of Turborepo is evaluated and documented | Research findings below on Deno status |
| FIX-01 | app-shared ESM build typo (`packagec.json`) is fixed | Line 7 of `packages/app-shared/package.json` `package:esm` script |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turbo | ^2.8 | Build orchestration, caching, task graph | Official Vercel monorepo tool, 50k+ GitHub stars, built-in Yarn 4 support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none -- turbo is the only addition) | | | |

### Removals
| Library | Reason |
|---------|--------|
| `onchange` (^7.1.0) | Replaced by `turbo watch` -- dependency-unaware file watcher no longer needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Turborepo | Nx | Overkill for 9-package monorepo, too opinionated (per REQUIREMENTS out-of-scope) |
| Turborepo | Lerna | Legacy tool, effectively an Nx wrapper (per REQUIREMENTS out-of-scope) |

**Installation:**
```bash
yarn add turbo --dev -W
```

Note: The `-W` flag (or `--ignore-workspace-root-check` in older Yarn) ensures the package is added to the workspace root. In Yarn 4 this may just be `yarn add -D turbo` from root.

## Architecture Patterns

### Complete Workspace Inventory

Turborepo will discover these workspaces from the root `package.json` `workspaces` field:

| Workspace | Path | Has Build | Has test:unit | Dependencies |
|-----------|------|-----------|---------------|-------------|
| @openvaa/shared-config | packages/shared-config | echo only (no-op) | no | (none) |
| @openvaa/core | packages/core | tsc + tsc-esm-fix | no (via root vitest) | (none) |
| @openvaa/data | packages/data | tsc + tsc-esm-fix | no (via root vitest) | core |
| @openvaa/matching | packages/matching | tsc + tsc-esm-fix | no (via root vitest) | core |
| @openvaa/filters | packages/filters | tsc + tsc-esm-fix | no (via root vitest) | core, data |
| @openvaa/app-shared | packages/app-shared | dual CJS + ESM (tsc) | no (via root vitest) | data |
| @openvaa/llm | packages/llm | tsc + tsc-esm-fix | no (test script only) | core, app-shared |
| @openvaa/argument-condensation | packages/argument-condensation | tsc + tsc-esm-fix + asset copy | no (test script only) | core, data, app-shared, llm |
| @openvaa/question-info | packages/question-info | tsc + tsc-esm-fix + asset copy | no (test script only) | core, data, llm |
| @openvaa/frontend | frontend | svelte-kit sync + vite build | vitest run | all packages |
| @openvaa/strapi | backend/vaa-strapi | strapi build (incl. plugin build) | vitest run ./src | app-shared, strapi-admin-tools |
| @openvaa/strapi-admin-tools | backend/vaa-strapi/src/plugins/openvaa-admin-tools | strapi-plugin build | no | app-shared |
| @openvaa/docs | docs | vite build | vitest (not test:unit) | app-shared |

### Build Dependency Graph (Topological Order)

```
Level 0: shared-config (no-op build, no deps)
Level 1: core (no internal deps)
Level 2: data, matching (both depend on core)
Level 3: filters (depends on core, data)
Level 4: app-shared (depends on data -> core)
Level 5: llm (depends on core, app-shared)
Level 6: argument-condensation, question-info (depend on core, data, llm, app-shared)
Level 7: strapi-admin-tools (depends on app-shared)
Level 8: frontend, strapi, docs (depend on app-shared + others)
```

### Recommended turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**"],
      "inputs": ["src/**", "tsconfig.json", "tsconfig.*.json", "package.json"]
    },
    "test:unit": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

**Key design decisions for turbo.json:**

1. **`outputs: ["build/**", "dist/**"]`**: Most packages output to `build/`, but `strapi-admin-tools` outputs to `dist/`. Including both catches all packages. Turborepo only caches files that actually exist, so unused patterns are harmless.

2. **`inputs` specification**: Explicitly listing `src/**`, `tsconfig.json`, `tsconfig.*.json`, and `package.json` prevents cache invalidation from irrelevant file changes (README edits, test file changes, etc.). The default is "all files in the package" which would cause unnecessary rebuilds.

3. **`test:unit` with `cache: false`**: Tests should always re-run to catch non-deterministic failures. The `dependsOn: ["build"]` ensures packages are built before tests. Setting `cache: false` means tests always execute but builds are still cached.

4. **No `inputs` on `test:unit`**: Since cache is false, inputs are irrelevant.

### Handling app-shared Dual ESM/CJS

app-shared outputs to both `build/cjs/` and `build/esm/`. The `outputs: ["build/**"]` glob already covers both subdirectories. No special per-package turbo.json is needed.

The cache will store both directories and restore them on cache hit. The `tsBuildInfoFile` paths (`build/cjs/tsconfig.tsbuildinfo` and `build/esm/tsconfig.tsbuildinfo`) are inside `build/**` and will be cached automatically.

### Handling Asset-Copying Packages

`argument-condensation` and `question-info` have build scripts that copy prompt assets after TypeScript compilation:

- argument-condensation: `mkdir -p build/core/condensation/prompts && find src/core/condensation/prompts -mindepth 1 -maxdepth 1 -type d -exec cp -R {} build/core/condensation/prompts/ \;`
- question-info: `mkdir -p build/prompts && cp -R src/prompts/* build/prompts/`

These copy steps are part of the existing `build` script in their `package.json`. Turborepo runs whatever the `build` script is -- it does not need to know about the copy step. The `outputs: ["build/**"]` glob captures the copied assets. The `inputs` should include the prompt directories since changes to prompts should invalidate the cache. These are already in `src/**` so the default `inputs` configuration handles them.

### TypeScript Project References

Turborepo's official guidance discourages TypeScript project references, stating they "introduce both another point of configuration as well as another caching layer." However, this project already uses them extensively. **Do NOT remove or change TypeScript project references in this phase.** They serve a dual purpose:

1. IDE resolution (TypeScript language server uses them)
2. Build ordering (via `tsc --build`)

Turborepo's `dependsOn: ["^build"]` handles build ordering independently of TypeScript references. The two systems coexist without conflict because:
- Turborepo orders *task execution* across packages
- TypeScript references order *type resolution* within a single tsc invocation

The incomplete reference in `@openvaa/llm` (missing `app-shared` reference) should be noted but is not blocking. It means the IDE may not resolve app-shared types in llm correctly, but the build works because `^build` ensures app-shared builds first. Fixing this is optional in this phase.

### Root Script Mapping

Current -> New:

| Current Script | New Script | Notes |
|----------------|------------|-------|
| `build:app-shared` | REMOVED | `turbo run build` handles it |
| `build:shared` | REMOVED | `turbo run build` handles it |
| `build` (new) | `turbo run build` | Primary build command |
| `watch:shared` | `turbo watch build --filter='./packages/*'` | Dependency-aware watching |
| `dev` | `turbo run build --filter='./packages/*' && docker compose ...` then `turbo watch build --filter='./packages/*'` | Build packages first, then watch |
| `dev:start` | Update to use `turbo run build --filter='./packages/*'` | Replace `yarn build:shared` |
| `test:unit` | `turbo run test:unit` | Runs build first via dependsOn |
| `format` | Replace `yarn build:app-shared` with `turbo run build --filter=@openvaa/app-shared...` | Build app-shared and its deps |
| `format:check` | Same pattern as format | |
| `lint:fix` | Replace `yarn build:app-shared` prefix | |
| `lint:check` | Replace `yarn build:app-shared` prefix | |
| `docs:prepare` | Replace `yarn build:shared` with `turbo run build --filter='./packages/*'` | |

**Important nuance for `test:unit`:** The current root `test:unit` runs three separate commands: `vitest run` (packages via vitest.workspace.ts), `yarn workspace @openvaa/frontend test:unit`, and `yarn workspace @openvaa/strapi test:unit`. With Turborepo, this needs careful handling:

- Packages under `packages/` do NOT have a `test:unit` script. They use `test` (llm, argument-condensation, question-info) or rely on the root vitest workspace runner.
- Frontend and strapi have `test:unit` scripts.
- **Recommendation:** Add `test:unit` scripts to all packages that have tests, and add `"test:unit": "vitest run"` to core, data, matching, filters, app-shared as well. Then `turbo run test:unit` runs tests across all workspaces that define it. The root vitest.workspace.ts becomes unnecessary for the turbo-driven test command.

Alternatively, keep the root vitest workspace approach and only wire test:unit through turbo for frontend/strapi. This is simpler but less consistent.

### Docker Integration for `turbo watch`

The current `watch:shared` script uses `onchange` to detect file changes and then:
1. Rebuilds the changed package: `yarn workspace @openvaa/$(echo {{changed}} | cut -d/ -f2) build`
2. Restarts the frontend Docker container: `yarn dev:restart-frontend`

With `turbo watch build --filter='./packages/*'`, Turborepo handles step 1 (and does it better -- dependency-aware, so changing core also rebuilds data/matching/etc.). Step 2 (Docker restart) needs a separate mechanism.

**Recommended approach:** Run `turbo watch` for package rebuilding and add a separate file watcher (or a post-build hook) for the Docker restart. One option:
- Use a simple wrapper script that runs `turbo watch build --filter='./packages/*'` and a file watcher on `packages/*/build/**` that triggers `docker restart voting-advice-application-frontend-1`
- Or: mark the Docker restart as a separate turbo task that depends on builds

**Simplest approach:** Keep the existing `dev:restart-frontend` as a manual step or integrate it via a root turbo.json task that watches build outputs. However, since the frontend container mounts `node_modules` which includes symlinked package builds, the frontend Vite dev server inside Docker may detect changes automatically. This needs testing during implementation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Topological build ordering | Shell script sequencing `build:shared` | `turbo run build` with `dependsOn: ["^build"]` | Automatic from package.json dependencies |
| Build caching | Manual timestamp checking | Turborepo file-hash cache | Content-based, not timestamp-based |
| File watching with deps | `onchange` pattern matching | `turbo watch` | Knows the dependency graph |
| Parallel task execution | Sequential `&&` chains | Turborepo automatic parallelism | Runs independent tasks in parallel |

**Key insight:** The current `build:shared` command (`yarn workspaces foreach -At --include 'packages/*' run build`) builds in workspace order which happens to be topological, but it rebuilds everything every time. Turborepo builds in the same order but skips unchanged packages via content hashing.

## Common Pitfalls

### Pitfall 1: tsBuildInfo + Turbo Cache Conflict
**What goes wrong:** TypeScript's `--build` flag uses file timestamps to determine freshness. Turborepo restores cached files with new timestamps, potentially confusing `tsc --build` into thinking nothing needs rebuilding (or vice versa).
**Why it happens:** Turborepo and TypeScript have independent caching layers.
**How to avoid:** Include `.tsbuildinfo` files in the `outputs` configuration. The `build/**` glob already covers these since all packages have `tsBuildInfoFile` inside `build/`. Do NOT use `tsc --build` at the Turborepo level (it is used within individual package build scripts, which is fine -- Turborepo caches the entire output).
**Warning signs:** A second `turbo run build` takes as long as the first despite cache hits being reported.

### Pitfall 2: Missing Outputs Configuration
**What goes wrong:** If outputs are not specified, Turborepo only caches logs, not build artifacts. On cache hit, logs replay but the `build/` directory is empty.
**Why it happens:** Empty `outputs` array means "no file outputs to cache."
**How to avoid:** Always specify `outputs: ["build/**", "dist/**"]` for build tasks.
**Warning signs:** `turbo run build` reports cache hit but downstream packages fail with "module not found."

### Pitfall 3: Over-Broad Default Inputs
**What goes wrong:** Without explicit `inputs`, Turborepo hashes all files in the package. Editing a README, test file, or .gitignore causes a cache miss and full rebuild.
**Why it happens:** Default is all files in the package directory.
**How to avoid:** Specify `inputs: ["src/**", "tsconfig.json", "tsconfig.*.json", "package.json"]`.
**Warning signs:** Frequent cache misses despite no source code changes.

### Pitfall 4: Forgetting to Add .turbo to .gitignore
**What goes wrong:** The `.turbo/` cache directory (default location) gets committed to git, bloating the repository.
**Why it happens:** Turborepo creates `.turbo/` in the root directory.
**How to avoid:** Add `.turbo` to `.gitignore` before the first `turbo run`.
**Warning signs:** Large untracked files in git status after running turbo.

### Pitfall 5: test:unit Script Name Mismatch
**What goes wrong:** `turbo run test:unit` silently skips packages that don't have a `test:unit` script. Tests appear to pass but most packages were never tested.
**Why it happens:** Turborepo only runs tasks in packages where the script exists.
**How to avoid:** Either add `test:unit` scripts to all packages, or accept that only frontend/strapi run via turbo and use the root vitest.workspace.ts for packages.
**Warning signs:** `turbo run test:unit` finishes suspiciously fast.

### Pitfall 6: turbo watch Output Loops
**What goes wrong:** `turbo watch` detects changes to build outputs and triggers rebuilds in an infinite loop.
**Why it happens:** Build outputs are in the package directory, which is watched by default.
**How to avoid:** Turborepo should handle this by only watching `inputs`, but verify during testing. If loops occur, ensure `outputs` directories are excluded from the watch scope via the `inputs` configuration.
**Warning signs:** Console shows continuous rebuild cycles.

### Pitfall 7: shared-config "Build" Confusion
**What goes wrong:** `@openvaa/shared-config` has `"build": "echo 'Nothing to build.'"`. Turborepo treats this as a build task, runs it, and caches the (empty) output.
**Why it happens:** Turborepo discovers all packages with matching script names.
**How to avoid:** This is harmless -- the echo runs in milliseconds and caches with no outputs. Leave it as-is. Alternatively, remove the build script from shared-config, but then Turborepo won't consider it at all.
**Warning signs:** None -- this is benign.

## Code Examples

### turbo.json (Complete)

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
        "package.json"
      ]
    },
    "test:unit": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```
Source: Turborepo official configuration reference

### FIX-01: app-shared ESM Build Typo Fix

Current (broken) line in `packages/app-shared/package.json`:
```json
"package:esm": "mkdir -p ./build/esm/ && echo '{ \"type\": \"module\" }' > ./build/esm/packagec.json"
```

Fixed:
```json
"package:esm": "mkdir -p ./build/esm/ && echo '{ \"type\": \"module\" }' > ./build/esm/package.json"
```

The typo `packagec.json` should be `package.json`. This file tells Node.js that files in the `build/esm/` directory should be treated as ES modules.

### Updated Root package.json Scripts

```json
{
  "scripts": {
    "build": "turbo run build",
    "watch:shared": "turbo watch build --filter='./packages/*'",
    "dev": "turbo run build --filter='./packages/*' && docker compose -f docker-compose.dev.yml up -d --force-recreate --build --wait && turbo watch build --filter='./packages/*'",
    "dev:start": "turbo run build --filter='./packages/*' && docker compose -f docker-compose.dev.yml up -d --force-recreate --build --wait",
    "test:unit": "turbo run test:unit",
    "format": "turbo run build --filter=@openvaa/app-shared... && prettier --write . && yarn workspace @openvaa/docs format",
    "format:check": "turbo run build --filter=@openvaa/app-shared... && prettier --check . && yarn workspace @openvaa/docs format:check",
    "lint:fix": "turbo run build --filter=@openvaa/app-shared... && prettier --write . && eslint --flag v10_config_lookup_from_file --fix backend/vaa-strapi/src backend/vaa-strapi/tests frontend packages tests",
    "lint:check": "turbo run build --filter=@openvaa/app-shared... && eslint --flag v10_config_lookup_from_file backend/vaa-strapi/src backend/vaa-strapi/tests frontend packages tests",
    "docs:prepare": "turbo run build --filter='./packages/*' && yarn workspace @openvaa/frontend prepare"
  }
}
```

Note: `--filter=@openvaa/app-shared...` means "app-shared and all its dependencies" (i.e., core, data, and app-shared). The `...` suffix selects the package and its upstream dependencies.

### .gitignore Addition

```
# Turborepo
.turbo
```

### Docker-Aware Watch Script (if needed)

If Docker frontend container restart is needed alongside turbo watch:
```json
{
  "watch:shared": "turbo watch build --filter='./packages/*'"
}
```

Then separately, test whether the Docker-mounted frontend picks up changes automatically via Vite's HMR. If it does not, a wrapper approach may be needed (but this should be determined during implementation).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `turbo.json` pipeline key | `turbo.json` tasks key | Turborepo 2.0 (2024) | Renamed from `pipeline` to `tasks` |
| Global turbo install only | Both global + local install | Turborepo 2.0+ | Local ensures version consistency |
| No watch mode | `turbo watch` built-in | Turborepo 2.0+ | Replaces external file watchers |
| Turbo v1 `pipeline` syntax | Turbo v2 `tasks` syntax | 2024 | Breaking change in v2 |

**Deprecated/outdated:**
- `pipeline` key in turbo.json (replaced by `tasks` in v2)
- `globalDependencies` for lockfile (now included by default)
- Turbo v1 filter syntax with `[]` for git-based filtering (still works but less common)

## Deno Compatibility Assessment (for BUILD-04)

### Summary
Turborepo has **no native Deno support** and this is unlikely to change. However, the impact on this project's future Deno migration is **minimal**.

### Key Findings

1. **Turborepo requires Node.js package managers:** It reads `package.json` and lockfiles from npm/yarn/pnpm. Deno's native `deno.json` and URL-based imports are not supported.

2. **Deno 2.x supports `package.json`:** Deno 2.0+ can read `package.json` and resolve npm packages. Projects that keep `package.json` can theoretically use Turborepo, but it is awkward and not the Deno-native workflow.

3. **Deno is building its own monorepo tooling:** Deno 2.1+ includes task dependencies inspired by Google's Wireit, with caching planned. This suggests Deno intends to replace Turborepo rather than integrate with it.

4. **Official Turborepo position:** The maintainers have stated Deno support is "not immediately on the roadmap" and the fundamental paradigm mismatch (URL-based vs package manager-based) makes integration difficult.

5. **Impact on OpenVAA:** The v1.1 roadmap mentions future Deno exploration. If/when the project migrates to Deno:
   - Turborepo would need to be replaced with Deno's native task runner
   - The `turbo.json` configuration would map cleanly to `deno.json` task definitions
   - Build caching concepts transfer directly (Deno plans equivalent caching)
   - The investment in Turborepo is not wasted: it establishes proper dependency graphs and caching patterns that any future tool will need

### Recommendation for BUILD-04 Document
Write a brief (~1 page) document at `.planning/deno-compatibility.md` covering the above points. Conclude that Turborepo is the right choice for now, and future Deno migration would replace Turborepo with Deno's native tooling rather than trying to make them coexist.

## Open Questions

1. **Docker frontend restart with turbo watch**
   - What we know: The current `watch:shared` script explicitly restarts the frontend Docker container after each package rebuild. `turbo watch` does not have a post-build hook mechanism.
   - What's unclear: Whether the Docker-mounted frontend (with Vite dev server) automatically picks up changes to symlinked packages in `node_modules`.
   - Recommendation: Test during implementation. If Vite HMR works through Docker volume mounts, no restart is needed. If not, add a simple `concurrently`-based wrapper or accept manual restart.

2. **test:unit script consistency across packages**
   - What we know: Packages use `test` not `test:unit`. Frontend and strapi use `test:unit`. Root uses vitest.workspace.ts for packages.
   - What's unclear: Whether to add `test:unit` to all packages or keep the split approach.
   - Recommendation: Add `"test:unit": "vitest run"` to all packages with tests for consistency. This lets `turbo run test:unit` work uniformly. The root vitest.workspace.ts can remain as a fallback.

3. **strapi-admin-tools build outputs**
   - What we know: It uses `strapi-plugin build` which outputs to `dist/`, not `build/`.
   - What's unclear: Whether the strapi plugin build tool supports all the same caching assumptions.
   - Recommendation: The `outputs: ["build/**", "dist/**"]` in turbo.json already covers this. Verify during implementation that strapi-plugin build is deterministic.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x (packages), Vitest 2.x (frontend/strapi) |
| Config file | `vitest.workspace.ts` (root), `vitest.config.ts` (per-package) |
| Quick run command | `turbo run test:unit --filter=@openvaa/core` |
| Full suite command | `turbo run test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-01 | turbo.json exists and turbo runs | smoke | `turbo run build --dry` | N/A (config, not test file) |
| BUILD-02 | Topological build ordering | smoke | `turbo run build --filter=@openvaa/app-shared...` | N/A (verified by turbo output) |
| BUILD-03 | Cache hit on second build | smoke | `turbo run build && turbo run build` (second run < 5s) | N/A (timing-based verification) |
| BUILD-04 | Deno compatibility documented | manual-only | Check `.planning/deno-compatibility.md` exists | N/A (document) |
| FIX-01 | app-shared ESM build produces package.json | smoke | `turbo run build --filter=@openvaa/app-shared && ls packages/app-shared/build/esm/package.json` | N/A (file existence check) |

### Sampling Rate
- **Per task commit:** `turbo run build --dry` (verify task graph correctness)
- **Per wave merge:** `turbo run build && turbo run test:unit`
- **Phase gate:** Full build + cache hit verification + all tests pass

### Wave 0 Gaps
None -- this phase modifies build tooling configuration, not application code. Existing tests validate that packages build correctly. The validation is primarily smoke testing (does turbo run build work? do cache hits happen? does the FIX-01 fix produce the right file?).

## Sources

### Primary (HIGH confidence)
- [Turborepo Configuration Reference](https://turborepo.dev/docs/reference/configuration) - turbo.json schema, task options, all configuration keys
- [Turborepo Watch Reference](https://turborepo.dev/docs/reference/watch) - turbo watch behavior, persistent/interruptible tasks
- [Turborepo TypeScript Guide](https://turborepo.dev/docs/guides/tools/typescript) - TypeScript project reference recommendation, tsconfig patterns
- [Turborepo Caching Guide](https://turborepo.dev/docs/crafting-your-repository/caching) - Hash computation, inputs/outputs, cache debugging
- [Turborepo Structuring Guide](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) - Workspace layout, Yarn configuration
- [Turborepo Developing Applications](https://turborepo.dev/docs/crafting-your-repository/developing-applications) - Dev task setup, turbo watch workflow

### Secondary (MEDIUM confidence)
- [Turborepo GitHub Releases](https://github.com/vercel/turborepo/releases) - v2.8.16 confirmed as latest stable (March 2026)
- [TypeScript Build Gotchas with Turborepo](https://notes.webutvikling.org/typescript-build-gotchas/) - tsBuildInfo conflicts, incremental build issues
- [Turborepo + Deno Discussion #3057](https://github.com/vercel/turborepo/discussions/3057) - Official maintainer position on Deno support
- [Turborepo + Deno Issue #6368](https://github.com/vercel/turborepo/issues/6368) - Feature request, maintainer response

### Tertiary (LOW confidence)
- [Turborepo + Deno Discussion #7454](https://github.com/vercel/turborepo/discussions/7454) - Community discussion on Deno 2.1 alternatives

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Turborepo is well-documented, widely used, and the project's constraints (Yarn 4, node-modules linker) are the happy path
- Architecture: HIGH - turbo.json configuration is straightforward, build dependency graph is well understood from codebase analysis
- Pitfalls: HIGH - Known issues are well-documented in official docs and community
- Deno compatibility: MEDIUM - Based on GitHub discussions and maintainer statements, but Deno ecosystem is fast-moving

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain, Turborepo releases are incremental)

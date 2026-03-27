# Domain Pitfalls: Deno 2.x Migration Feasibility

**Domain:** Node.js-to-Deno runtime migration for a monorepo
**Researched:** 2026-03-26

## Critical Pitfalls

Mistakes that cause significant rework or derail the migration.

### P1: Attempting Full Toolchain Replacement (Severity: CRITICAL)

**What goes wrong:** Replacing Yarn, Turborepo, ESLint, Prettier, and Vitest simultaneously with Deno built-ins. Each tool has gaps that individually seem "solvable" but together create an unmanageable number of regressions.

**Why it happens:** Deno's marketing emphasizes "all-in-one toolchain" -- zero config TS, built-in test/lint/fmt. Developers extrapolate from simple examples to a 10-package monorepo with Svelte, Tailwind, and complex build pipelines.

**Consequences:**
- Loss of Turborepo caching (builds go from <5s to 30s+)
- Loss of Svelte template linting (deno lint cannot parse .svelte AST)
- Loss of Tailwind class sorting (deno fmt has no plugin for this)
- Loss of Vitest module mocking (deno test has no vi.mock equivalent)
- Loss of Yarn catalogs (30 shared dependency version entries)
- All at once, making it impossible to isolate which change caused which failure

**Prevention:** Use Strategy B (runtime-only). Change ONE variable: the execution runtime. Keep all build tooling.

**Detection:** If a migration plan includes "replace Turborepo" AND "replace ESLint" AND "replace Vitest" in the same phase, it is too aggressive.

### P2: Premature Removal of package.json (Severity: HIGH)

**What goes wrong:** Converting workspace members from package.json to deno.json-only to "fully embrace Deno."

**Why it happens:** Deno workspaces use deno.json. Developers assume this means package.json should be removed.

**Consequences:**
- Turborepo stops recognizing the workspace member (turbo.json reads package.json scripts)
- Yarn stops resolving the member's dependencies
- Changesets cannot version the package
- npm publishing breaks (no package.json = no name/version/exports for npm)
- TypeScript project references may break (tsconfig.json references package paths)

**Prevention:** Keep package.json in ALL workspace members. If deno.json is needed, add it alongside package.json (hybrid mode).

**Detection:** Any workspace member that has deno.json but no package.json is at risk.

### P3: Assuming Deno npm Workspace Support Is Production-Ready (Severity: HIGH)

**What goes wrong:** Relying on Deno's npm workspace compatibility for the full monorepo workflow, including cross-package resolution.

**Why it happens:** Deno docs say "supports npm workspaces." Developers take this at face value.

**Consequences:** Open issue #28157 reports "hard breaking issues when trying to integrate Deno into an existing npm monorepo" -- specifier resolutions fail, manual import map entries are needed, workspace:* protocol has edge cases. The project's `workspace:^` protocol usage across 10+ packages amplifies this risk.

**Prevention:** The PoC must validate cross-workspace imports (e.g., @openvaa/matching importing @openvaa/core) under Deno before any commitment. Keep Yarn as the primary workspace resolver; use Deno only as runtime.

**Detection:** Import errors like "Module not found" or "Could not resolve" when running workspace packages under Deno.

## Moderate Pitfalls

### P4: Paraglide JS FsWatcher Failure in Dev Mode (Severity: MEDIUM)

**What goes wrong:** Paraglide JS 2.x Vite plugin uses file watchers that break on Deno, producing "Input watch path is neither a file nor a directory" errors during development.

**Why it happens:** Deno's FsWatcher implementation differs from Node.js's `fs.watch()`. Vite plugins that use Node-specific file watching APIs hit incompatibilities.

**Prevention:** Test the Vite dev server with Paraglide early in PoC. If it fails, the workaround is a custom Vite plugin wrapper using `Deno.Command` to invoke the Paraglide compiler.

**Detection:** Error messages containing "FsWatcher" or "watch path" during `deno task dev`.

### P5: Playwright Version Sensitivity (Severity: MEDIUM)

**What goes wrong:** Playwright works on some Deno versions but breaks on others. Deno 2.1.5 introduced BadResource errors with Playwright. Later patches fixed it, but future regressions are possible.

**Why it happens:** Playwright heavily uses Node.js process and stream APIs. Deno's Node compatibility layer evolves between versions, sometimes introducing regressions.

**Prevention:** Pin Deno version in CI. Run Playwright via `npx playwright test` rather than `deno run npm:playwright`. Test E2E suite immediately after any Deno version upgrade.

**Detection:** Unexplained Playwright test failures after Deno upgrade; errors containing "BadResource" or socket-related messages.

### P6: Turborepo in Hybrid Mode Untested (Severity: MEDIUM)

**What goes wrong:** Turborepo may not work correctly when Deno-specific configuration files (deno.json, deno.lock) coexist with package.json and turbo.json.

**Why it happens:** Turborepo discovers workspace members via package.json. Additional config files should be ignored, but Turborepo's file hashing for caching may include unexpected files, causing cache invalidation or confusion.

**Prevention:** Test Turborepo caching behavior after adding deno.json to a workspace member. Verify cached builds still work.

**Detection:** Turborepo cache misses that should be hits; or unexpected includes in turbo's inputs hash.

### P7: Changesets CLI Compatibility Unknown (Severity: MEDIUM)

**What goes wrong:** Changesets CLI may fail under Deno's Node compatibility layer due to usage of Node-specific APIs (child_process for git operations, fs for changeset file management).

**Why it happens:** Changesets was not designed for Deno. It uses Node.js APIs extensively for git integration.

**Prevention:** Test `npx changeset` and `npx changeset publish` early. If they fail under Deno, keep running them under Node (they are dev tools, not production code).

**Detection:** Errors during `changeset version` or `changeset publish` commands.

### P8: Docker Build Complexity Increase (Severity: MEDIUM)

**What goes wrong:** Production Docker builds become more complex because both Deno AND Node may be needed -- Node for the build step (Yarn/Turborepo) and Deno for the runtime step.

**Why it happens:** Strategy B keeps Yarn and Turborepo, which require Node. The built output runs on Deno. Multi-stage Docker builds need both runtimes.

**Prevention:** Multi-stage Dockerfile: build stage with Node, production stage with Deno only. The adapter-node output is plain JavaScript that Deno can execute.

```dockerfile
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN yarn install && yarn build

# Production stage
FROM denoland/deno:alpine-2.7.7
COPY --from=build /app/apps/frontend/build /app/build
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "/app/build/index.js"]
```

**Detection:** Docker build failures or oversized images.

## Minor Pitfalls

### P9: Deno Lock File Conflicts (Severity: LOW)

**What goes wrong:** Deno generates a `deno.lock` file when it encounters `deno.json`. This can conflict with `yarn.lock` and confuse CI caching.

**Prevention:** Add `deno.lock` to `.gitignore` if using Yarn as the primary package manager. OR commit both lockfiles with clear documentation about which is the source of truth.

### P10: Permission Flag Verbosity (Severity: LOW)

**What goes wrong:** Every `deno run` command needs explicit permission flags (--allow-net, --allow-read, etc.), making task definitions verbose compared to Node.

**Prevention:** Use `--allow-all` (`-A`) for development tasks. Define granular permissions only for production Docker CMD.

### P11: VSCode Extension Conflicts (Severity: LOW)

**What goes wrong:** The Deno VSCode extension and the TypeScript extension can conflict, each trying to provide TS language services. In a monorepo with both Node and Deno workspaces, the extension may activate in the wrong context.

**Prevention:** Configure `.vscode/settings.json` with `deno.enablePaths` to restrict Deno LSP to specific directories (e.g., Edge Functions only).

### P12: esm.sh Import Pattern in Edge Functions (Severity: LOW)

**What goes wrong:** Edge Functions currently import from `https://esm.sh/@supabase/supabase-js@2`. If migrating to `npm:` specifiers, the Supabase CLI's Edge Runtime may not resolve them correctly.

**Prevention:** Keep esm.sh imports in Edge Functions during PoC. Only migrate to npm specifiers after validating the deploy pipeline.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| PoC: SvelteKit dev server | P4: Paraglide FsWatcher | Test with full Vite plugin stack, not just basic pages |
| PoC: Unit tests on Deno | P3: Workspace resolution bugs | Start with @openvaa/core (no workspace deps), then test cross-package |
| PoC: Playwright E2E | P5: Version sensitivity | Use npx, pin Deno version, test 5-10 specs first |
| PoC: Benchmarking | Misleading blog benchmarks | Measure THIS project, not synthetic benchmarks |
| Deployment: Docker | P8: Dual runtime complexity | Multi-stage build, test locally before CI |
| Integration: Edge Functions | P12: Import pattern change | Defer to after runtime validation |
| Tooling: Turborepo hybrid | P6: Untested coexistence | Verify cache behavior with deno.json present |
| Release: Changesets | P7: Unknown compatibility | Test npx changeset early; fallback to Node |

## Rollback Strategy

**Key principle:** The migration must be reversible at every stage.

1. **Runtime rollback:** Change Docker CMD from `deno run` back to `node`. Change CI from `setup-deno` back to `setup-node`. All code is the same.
2. **Config rollback:** Remove deno.json files from workspace members. package.json was never modified.
3. **CI rollback:** Keep Node.js CI job alongside Deno CI job until fully validated. Remove Node job only after production validation.
4. **Full rollback:** The entire migration is on a feature branch. If PoC fails, the branch is discarded.

Cost of rollback: ~1 hour (revert Dockerfile + CI config). No code changes needed because Strategy B does not modify application code.

## Sources

- [Deno npm Workspace Compat Issue #28157](https://github.com/denoland/deno/issues/28157) -- "hard breaking issues"
- [Turborepo Deno Discussion #7454](https://github.com/vercel/turborepo/discussions/7454) -- "not immediately on the roadmap"
- [Playwright on Deno Issue #27623](https://github.com/denoland/deno/issues/27623) -- BadResource errors
- [Paraglide FsWatcher Issue](https://questions.deno.com/m/1328508724410843136)
- [deno compile SvelteKit Issue #26155](https://github.com/denoland/deno/issues/26155)
- [Supabase Edge Functions in Monorepos Issue #1303](https://github.com/supabase/cli/issues/1303)
- [Deno Workspaces Docs](https://docs.deno.com/runtime/fundamentals/workspaces/)

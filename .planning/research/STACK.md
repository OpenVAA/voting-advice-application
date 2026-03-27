# Technology Stack: Deno 2.x Feasibility Assessment

**Project:** OpenVAA v2.2 -- Deno Feasibility Study
**Researched:** 2026-03-26
**Deno Version Evaluated:** 2.7.7 (latest as of research date)

## Executive Summary

Deno 2.7.7 can run the SvelteKit frontend with adapter-node, execute TypeScript natively, and use most npm packages. However, replacing the full Node.js monorepo toolchain is **not currently feasible** due to hard blockers in workspace orchestration (no Turborepo equivalent with caching), package manager integration (Yarn 4 not supported), and critical gaps in Svelte-specific tooling. A hybrid approach -- Deno as runtime for specific workloads while keeping Node.js toolchain for builds -- is the realistic path.

## Compatibility Matrix: Existing Stack vs Deno 2.7

| Component | Current | Deno Status | Verdict |
|-----------|---------|-------------|---------|
| **Runtime** | Node 22 | Deno 2.7.7 | WORKS -- native TS, faster startup |
| **Package Manager** | Yarn 4.13 | Not supported | BLOCKER -- Deno supports npm workspaces only, not Yarn |
| **Build Orchestration** | Turborepo 2.8 | No equivalent | BLOCKER -- no task caching, no topology sorting |
| **Package Bundling** | tsup 8.5 (esbuild) | Not needed for Deno-first; still need for npm | SOLVABLE -- tsup must stay for npm publishing |
| **Frontend Framework** | SvelteKit 2.55 | Works with adapter-node | WORKS -- use adapter-node, Deno as runtime |
| **Svelte** | Svelte 5.53 | Works | WORKS -- Svelte 5 runes-mode confirmed working |
| **Vite** | 6.4.1 | Works with nodeModulesDir | WORKS -- requires `nodeModulesDir: "auto"` |
| **Tailwind 4** | @tailwindcss/vite 4.2.1 | Works with config | SOLVABLE -- needs nodeModulesDir for PostCSS |
| **DaisyUI 5** | 5.5.14 | Works (npm package) | WORKS -- standard npm dependency |
| **Unit Tests** | Vitest 3.2.4 | Partial compatibility | GAP -- runs but workspace integration has edge cases |
| **E2E Tests** | Playwright 1.58.2 | Partial compatibility | GAP -- known regressions in specific Deno versions |
| **Linting** | ESLint 9.39 + eslint-plugin-svelte 2.46 | ESLint works via npm; deno lint lacks Svelte | GAP -- no Svelte template linting in deno lint |
| **Formatting** | Prettier 3.7 + svelte/tailwind plugins | deno fmt has unstable Svelte support | GAP -- `unstable: ["fmt-component"]` needed |
| **i18n** | Paraglide JS 2.15 | Known FsWatcher issue | GAP -- Vite plugin file watcher breaks; workaround exists |
| **Versioning** | Changesets 2.30 | Untested on Deno | UNKNOWN -- Node.js CLI tool, likely works via npx |
| **Pre-commit** | Husky 9 + lint-staged 16 | Not designed for Deno | SOLVABLE -- continue via npx or use deno_hooks |
| **Supabase Client** | @supabase/supabase-js 2.99 | Works | WORKS -- well-tested on Deno |
| **Supabase SSR** | @supabase/ssr 0.9 | Works | WORKS -- standard npm package |
| **Edge Functions** | Already Deno (2.1.4) | Native | SYNERGY -- already run on Deno |
| **CI** | GitHub Actions (setup-node) | setup-deno available | WORKS -- denoland/setup-deno installs v2.x by default |
| **Docker** | Node 22 Alpine | Deno Alpine (~53MB) | WORKS -- comparable image sizes |

## Hard Blockers

### 1. Yarn 4 Workspaces -- NOT SUPPORTED
**Confidence:** HIGH (verified via official docs and GitHub issues)

Deno supports npm workspaces (package.json `"workspaces"` field) but not Yarn workspaces. Yarn 4's `workspace:^` protocol, dependency catalogs (30 entries in `.yarnrc.yml`), and Yarn-specific lockfile are all incompatible. Deno does not understand Yarn's PnP resolution or catalog system.

**Impact:** Migrating requires either:
- (a) Dropping Yarn entirely for Deno native workspaces (deno.json-based), or
- (b) Switching to npm workspaces as an intermediate step, or
- (c) Running Deno as runtime only, keeping Yarn for package management (recommended)

There is also an open issue (#28157) reporting that npm workspace integration with Deno has "hard breaking issues" -- workspace specifier resolution fails, manual import map entries are needed.

**Sources:** [Deno Workspaces Docs](https://docs.deno.com/runtime/fundamentals/workspaces/), [GitHub #26346](https://github.com/denoland/deno/issues/26346), [GitHub #28157](https://github.com/denoland/deno/issues/28157)

### 2. Turborepo Replacement -- NO EQUIVALENT IN DENO
**Confidence:** HIGH (verified via Turborepo discussions and Deno task docs)

Turborepo provides three critical features the monorepo relies on:
1. **Content-based task caching** -- skip rebuilds when inputs unchanged (sub-5s no-change builds)
2. **Topological task ordering** -- build dependencies before dependents (`^build` in turbo.json)
3. **Remote caching** -- Vercel remote cache in CI

Deno's task runner (as of 2.7) has:
- Task dependencies with parallel execution (since 2.1) -- YES
- `--recursive` and `--filter` flags for workspace tasks (since 2.1) -- YES
- **Task output caching** -- NO (on roadmap, not implemented)
- **Topological sorting across packages** -- NO (on roadmap, not implemented)
- **Remote caching** -- NO

Turborepo maintainers have explicitly said Deno support is not prioritized because Deno's URL-based dependency model differs fundamentally from how Turborepo operates.

**Sources:** [deno task docs](https://docs.deno.com/runtime/reference/cli/task/), [Turborepo Discussion #7454](https://github.com/vercel/turborepo/discussions/7454), [Deno workspace features roadmap](https://github.com/denoland/deno/issues/24991)

### 3. npm Publishing Workflow -- REQUIRES TSUP
**Confidence:** HIGH

Four packages (@openvaa/core, data, matching, filters) publish ESM JavaScript with `.d.ts` declaration files to npm. Deno's philosophy is "ship TypeScript directly" via JSR, but npm consumers expect compiled JavaScript. The current `tsup && tsc --emitDeclarationOnly` workflow must persist for npm publishing regardless of runtime.

Additionally, `@openvaa/app-shared` produces both ESM and CJS output (`format: ['esm', 'cjs']` in tsup.config.ts). Deno does not generate CJS.

**Impact:** tsup cannot be eliminated for any packages that publish to npm.

## Solvable Gaps

### 4. SvelteKit + Vite -- WORKS WITH adapter-node
**Confidence:** HIGH (official Deno tutorial, multiple community confirmations)

**Correction to prior research:** adapter-node is NOT broken on Deno. Both Deno and Svelte teams now recommend using the standard `@sveltejs/adapter-node` with Deno as the runtime. Custom Deno adapters are no longer recommended because they require custom code for every plugin and extension.

Required deno.json configuration:
```json
{
  "nodeModulesDir": "auto",
  "unstable": ["fmt-component"]
}
```

The `nodeModulesDir: "auto"` setting is critical because Vite, Tailwind CSS 4's PostCSS plugin, and other Node-ecosystem tools expect a `node_modules` directory.

Minimum Deno version: 2.1.10 or later for SvelteKit.

**Sources:** [Deno SvelteKit Tutorial](https://docs.deno.com/examples/sveltekit_tutorial/), [amun.pl blog](https://amun.pl/blog/post/running-svelte-5-projects-using-deno-in-2024)

### 5. Paraglide JS -- WORKAROUND NEEDED
**Confidence:** MEDIUM (community-reported, not officially resolved)

Paraglide JS 2.x uses a Vite plugin with file watching. On Deno, the FsWatcher implementation causes "Input watch path is neither a file nor a directory" errors during development.

**Workaround:** Create a custom Vite plugin wrapper that uses `Deno.Command` to invoke the Paraglide compiler with watch mode instead of the standard file watcher.

**Source:** [Deno Questions Forum](https://questions.deno.com/m/1328508724410843136)

### 6. Vitest -- MOSTLY WORKS, KEEP IT
**Confidence:** MEDIUM

Vitest runs under Deno for most test scenarios. Known limitations:
- Module/package mocking is less robust than under Node.js
- Workspace integration has reported edge cases with module resolution
- The 542 existing unit tests would need individual validation

Deno's built-in test runner (`Deno.test()`) is NOT a practical replacement -- it lacks `test.each()`, Vitest's module mocking, and Vite-powered watch mode. Migrating 542 tests to `Deno.test()` would be a rewrite for minimal gain.

**Recommendation:** Keep Vitest, run it under Deno runtime.

**Sources:** [Vitest on Deno](https://questions.deno.com/m/1364243812532228157), [Deno Testing Docs](https://docs.deno.com/runtime/fundamentals/testing/)

### 7. Playwright -- WORKS WITH CAUTION
**Confidence:** MEDIUM (documented issues exist, workarounds confirmed)

Playwright works with Deno but has had version-specific regressions. Deno 2.1.5 introduced BadResource errors. The `webServer` option in playwright.config.ts needs adjustment.

Deno 2.7.x appears stable for Playwright usage.

**Sources:** [Deno 2 and Playwright](https://honman.dev/posts/deno-2-and-playwright), [Deno Issue #27623](https://github.com/denoland/deno/issues/27623)

### 8. Linting -- HYBRID APPROACH REQUIRED
**Confidence:** HIGH

`deno lint` is extremely fast (~21ms for 50 files vs ~2,369ms for ESLint) and now has ESLint-compatible plugin API (Deno 2.2+). However:
- **No Svelte template linting** -- same blocker that caused oxlint deferral in v1.2
- Plugin API is unstable and not 100% ESLint-compatible
- No existing Svelte plugin for deno lint

**Recommendation:** Keep ESLint + eslint-plugin-svelte for Svelte files. Could use deno lint for pure TS/JS packages in a partial migration.

**Sources:** [Deno Linting Docs](https://docs.deno.com/runtime/fundamentals/linting_and_formatting/), [Deno 2.2 Blog](https://deno.com/blog/v2.2)

### 9. Formatting -- PARTIAL REPLACEMENT
**Confidence:** MEDIUM

`deno fmt` uses dprint (Rust-based, very fast). Svelte component formatting requires unstable flag: `"unstable": ["fmt-component"]`. Does not handle Tailwind class sorting (currently via `prettier-plugin-tailwindcss`).

**Recommendation:** Keep Prettier for Svelte files with Tailwind plugin.

## Supabase Edge Functions Synergy

**Confidence:** HIGH

The monorepo already has 3 Edge Functions running on Deno (invite-candidate, send-email, signicat-callback) using `Deno.serve()` and `Deno.env.get()`. Supabase Edge Functions now run Deno 2.1.4 in all regions.

**Current pattern** (Edge Functions import from esm.sh):
```typescript
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
```

**Potential improvement:** With Deno workspaces, Edge Functions could import shared workspace packages directly, enabling type-safe shared code between frontend and Edge Functions.

**Limitation:** Supabase CLI uses its own Edge Runtime for local development (not standard Deno CLI). Each function should have its own `deno.json` for deployment isolation. A shared `_shared` folder is the recommended pattern for code reuse between functions.

**Sources:** [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions/dependencies), [Supabase Deno 2 Discussion](https://github.com/orgs/supabase/discussions/37941)

## Migration Strategies

### Strategy A: Full Deno Replacement (NOT RECOMMENDED)
Replace Node + Yarn + Turborepo entirely with Deno.

| Replace | With | Risk |
|---------|------|------|
| Yarn 4.13 | deno.json workspaces | HIGH -- lose catalogs, lockfile migration, #28157 bugs |
| Turborepo 2.8 | deno task --recursive | HIGH -- lose caching, topology sorting |
| tsup | Remove for internal, keep for npm | MEDIUM |
| Vitest | deno test | HIGH -- 542 tests to rewrite |
| ESLint | deno lint | HIGH -- no Svelte template linting |
| Prettier | deno fmt | MEDIUM -- Svelte unstable, no Tailwind sort |
| Husky | deno_hooks | LOW |
| Changesets | deno_changesets or keep via npx | MEDIUM |

**Verdict:** Too many simultaneous regressions. Destroys proven toolchain for immature alternatives.

### Strategy B: Deno as Runtime Only (RECOMMENDED FOR PoC)
Keep Node.js toolchain (Yarn, Turborepo, tsup, ESLint, Prettier). Use Deno as the runtime for execution.

| Component | Change | Risk |
|-----------|--------|------|
| Yarn 4.13 | Keep | NONE |
| Turborepo 2.8 | Keep | NONE |
| tsup | Keep | NONE |
| Runtime | Node 22 -> Deno 2.7 | LOW |
| Docker | node:22-alpine -> denoland/deno:alpine | LOW |
| CI | setup-node -> setup-deno | LOW |
| SvelteKit | adapter-node on Deno | LOW |

**Verdict:** Minimal disruption. Validates Deno runtime benefits (startup, security, TS native) without touching the proven build toolchain.

### Strategy C: Gradual Deno-First (LONG-TERM, CONDITIONAL)
Start with Strategy B, then incrementally:
1. Migrate pure TS packages (core, matching, filters) to deno.json alongside package.json
2. Monitor Deno task caching development -- adopt when shipped
3. Monitor deno lint Svelte plugin ecosystem -- adopt when available
4. Re-evaluate full migration when Deno workspaces mature and #28157 is resolved

**Verdict:** Pragmatic long-term path, but timeline depends on Deno team's roadmap delivery.

## Performance Comparison

| Metric | Node 22 | Deno 2.7 | Delta |
|--------|---------|----------|-------|
| Cold start (JS) | 60-120ms | 40-60ms | ~50% faster |
| Cold start (TS) | ~400ms | ~80ms | ~5x faster |
| HTTP throughput | ~42K req/s | ~47K req/s | ~12% faster |
| Docker image (Alpine) | ~38MB compressed | ~53MB on-disk | Comparable |
| Lint (50 files) | ~2,369ms (ESLint) | ~21ms (deno lint) | ~100x faster |

Performance gains are real but modest for a web application. The value is primarily DX (native TS, security model, built-in tooling convergence) rather than raw throughput.

**Sources:** [Runtime Benchmarks 2026](https://dev.to/pockit_tools/deno-2-vs-nodejs-vs-bun-in-2026-the-complete-javascript-runtime-comparison-1elm)

## Deployment Options

### Option 1: adapter-node on Deno (Recommended)
```dockerfile
FROM denoland/deno:alpine-2.7.7
WORKDIR /app
COPY build/ ./build/
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "build/index.js"]
```

### Option 2: deno compile (NOT production-ready for SvelteKit)
`deno compile` with SvelteKit has a known bug: "Module not found runtime/control.js" ([Issue #26155](https://github.com/denoland/deno/issues/26155)). Do not use for SvelteKit production.

### Option 3: Keep Node.js for production, Deno for dev only
Most conservative. Zero production risk. Validates Deno in development without deployment changes.

## Recommended PoC Scope

For the feasibility study proof of concept, validate Strategy B:

1. **One pure TS package** (`@openvaa/core`) -- run its unit tests with Vitest on Deno runtime
2. **SvelteKit dev server** -- run `vite dev` under Deno with adapter-node
3. **Subset of E2E tests** -- run 5-10 Playwright specs under Deno
4. **Benchmark** -- startup time and test execution time vs Node.js baseline
5. **Edge Function sharing** -- import a shared type from workspace into an Edge Function

This validates the runtime story without touching the build toolchain.

## Sources

- [Deno Workspaces Documentation](https://docs.deno.com/runtime/fundamentals/workspaces/)
- [Deno Node.js Compatibility](https://docs.deno.com/runtime/fundamentals/node/)
- [Deno Task Runner Reference](https://docs.deno.com/runtime/reference/cli/task/)
- [Deno Testing](https://docs.deno.com/runtime/fundamentals/testing/)
- [Deno Linting and Formatting](https://docs.deno.com/runtime/fundamentals/linting_and_formatting/)
- [Deno Lint Plugins (2.2)](https://docs.deno.com/runtime/reference/lint_plugins/)
- [Building SvelteKit with Deno](https://docs.deno.com/examples/sveltekit_tutorial/)
- [Deno Docker Reference](https://docs.deno.com/runtime/reference/docker/)
- [Deno CI/GitHub Actions](https://docs.deno.com/runtime/reference/continuous_integration/)
- [Turborepo Deno Discussion #7454](https://github.com/vercel/turborepo/discussions/7454)
- [Deno npm Workspace Compat Issue #28157](https://github.com/denoland/deno/issues/28157)
- [Supabase Edge Functions Deno 2 Regions](https://github.com/orgs/supabase/discussions/37941)
- [Supabase Edge Function Dependencies](https://supabase.com/docs/guides/functions/dependencies)
- [Deno 2 + Playwright](https://honman.dev/posts/deno-2-and-playwright)
- [Paraglide + Deno FsWatcher Issue](https://questions.deno.com/m/1328508724410843136)
- [Deno 2.7 Releases](https://github.com/denoland/deno/releases)
- [Deno 2.6 Blog (tsgo integration)](https://deno.com/blog/v2.6)
- [Deno 2.2 Blog (Lint Plugins, OpenTelemetry)](https://deno.com/blog/v2.2)
- [Runtime Benchmarks 2026](https://dev.to/pockit_tools/deno-2-vs-nodejs-vs-bun-in-2026-the-complete-javascript-runtime-comparison-1elm)
- [Deno Announcing v2.0](https://deno.com/blog/v2.0)

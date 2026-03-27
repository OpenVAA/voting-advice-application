# Feature Landscape: Deno 2.x Migration

**Domain:** Node.js-to-Deno monorepo migration for a Voting Advice Application framework
**Researched:** 2026-03-26
**Confidence:** MEDIUM (Deno 2.x is well-documented; OpenVAA-specific compatibility is unverified)

## Table Stakes

Features that MUST work for a Deno migration to proceed. Missing any = migration blocked.

### 1. SvelteKit 2 with SSR and Production Deployment

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| Dev server (`vite dev`) | Working | Low | Official Deno SvelteKit tutorial confirms this |
| SvelteKit build | Working | Low | `svelte-kit sync && vite build` works under Deno |
| adapter-node on Deno | Working | Low | **Both Deno and Svelte teams recommend adapter-node with Deno as runtime**. Do NOT use community adapters. |
| Docker production deploy | Working | Low | `denoland/deno:alpine` images; run `deno run --allow-net --allow-read --allow-env build/index.js` |
| SSR with Supabase auth | Working | Low | @supabase/supabase-js and @supabase/ssr work on Deno (verified by Edge Functions) |

**Key correction from prior research:** adapter-node is NOT broken on Deno. The recommendation has changed -- use the standard adapter-node with Deno as the runtime. Community Deno adapters are no longer recommended because they require custom code for every plugin and extension.

**Minimum Deno version:** 2.1.10+ for SvelteKit projects.

**Required configuration:**
```json
{
  "nodeModulesDir": "auto",
  "unstable": ["fmt-component"]
}
```

**Confidence:** HIGH -- official Deno tutorial demonstrates this exact pattern.

### 2. npm Package Compatibility

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| `npm:` specifier imports | Working | None | Deno 2 native feature |
| `node_modules` auto-creation | Working | Low | `"nodeModulesDir": "auto"` in deno.json |
| `package.json` recognition | Working | Low | Deno 2 reads package.json natively |
| @supabase/supabase-js | Working | None | Tested on Deno via Edge Functions |
| @supabase/ssr | Working | Low | Standard npm package, Web API based |
| Paraglide JS | Known issue | Medium | FsWatcher breaks in dev mode; workaround exists |
| DaisyUI 5 / Tailwind 4 | Working | Low | Needs nodeModulesDir for PostCSS |
| jose, zod, qs | Working | None | Pure JS/TS packages |
| isomorphic-dompurify | Likely working | Low | Requires jsdom; jsdom version pinning may be needed |

**Confidence:** HIGH for core npm compat; MEDIUM for the full transitive dependency tree.

### 3. Workspace / Monorepo Support

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| Workspace member declaration | Working | Low | `"workspace": ["packages/*", "apps/*"]` in root deno.json |
| Cross-workspace imports | Working | Low | Bare specifiers resolved via member `name` + `exports` |
| npm workspace compat | Partial | Medium | Supports npm workspaces; **NOT Yarn workspaces** |
| `workspace:^` protocol | Working | Low | Supported in package.json dependencies |
| Yarn 4 catalogs | NOT supported | High | No equivalent; would need import maps or per-member versions |
| Yarn lockfile | NOT supported | High | Uses deno.lock format, not yarn.lock |

**Critical note:** Deno supports npm workspaces but NOT Yarn workspaces. Open issue #28157 reports "hard breaking issues" with npm workspace integration. The project's 30-entry Yarn catalog has no Deno equivalent.

**Confidence:** MEDIUM -- basic workspace support works; Yarn-specific features are unsupported.

### 4. Unit Test Execution (542 tests)

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| Vitest on Deno runtime | Mostly works | Medium | Some edge cases with workspace module resolution |
| `deno test` for pure-TS | Working | Medium | BDD via @std/testing/bdd, expect via @std/expect |
| Module mocking | Partial | High | Deno lacks vi.mock() equivalent |
| test.each parameterized | NOT supported | Medium | Open issue #30110, no ETA |
| jsdom environment | NOT available | High | Deno test has no environment abstraction |
| Code coverage | Working | Low | V8-based, lcov export |
| Watch mode | Basic | Medium | File-watching, not Vitest HMR-based |

**Recommendation:** Keep Vitest, run it on Deno runtime. Do NOT migrate tests to deno test -- the 542 tests use Vitest APIs extensively.

**Confidence:** MEDIUM -- Vitest on Deno works for most cases; deno test is not a practical replacement.

### 5. E2E Test Execution (50 Playwright specs)

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| Playwright on Deno | Works with caution | Medium | Version-specific regressions (2.1.5 broke, patches fixed) |
| `npx playwright test` | Working | Low | Bypasses Deno-specific issues entirely |
| webServer config option | Needs adjustment | Low | Node.js-specific; may need customization |

**Recommendation:** Run Playwright via `npx playwright test` for maximum reliability. Do not force through `deno run npm:playwright`.

**Confidence:** MEDIUM -- works via npx escape hatch; direct Deno execution is fragile.

### 6. npm Package Publishing (core, data, matching, filters)

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| tsup builds | Working | Low | tsup runs as npm package under Deno |
| tsc declaration emit | Working | Low | TypeScript available via npm |
| Changesets CLI | Unknown | Medium | Node CLI tool; untested on Deno |
| JSR dual publishing | Available | Medium | `deno publish` for JSR, separate from npm |

**Confidence:** MEDIUM -- tsup should work; Changesets is unverified.

### 7. Build Orchestration (Turborepo)

| Aspect | Status | Complexity | Notes |
|--------|--------|------------|-------|
| Turborepo with package.json | Works (hybrid) | Low | Turborepo reads package.json scripts |
| Turborepo with deno.json | NOT supported | High | Turborepo maintainers: "not immediately on the roadmap" |
| Content-hash caching | Deno has NONE | High | On roadmap, not shipped |
| Topological ordering | Deno has NONE | High | On roadmap, not shipped |
| Remote cache | Deno has NONE | High | No equivalent |

**Critical:** The three pillars of Turborepo value (caching, topology, remote cache) have NO Deno equivalent. For a 10-package monorepo, losing caching means every build takes 30s+ instead of <5s.

**Confidence:** HIGH that this is a real gap that cannot be solved today.

## Differentiators

Features Deno provides that justify migration effort.

| Feature | Value Proposition | Impact |
|---------|-------------------|--------|
| Native TypeScript execution | No compile step for dev; ~5x faster TS cold start | HIGH for dev loop |
| Permission security model | Explicit --allow-net/read/env; supply chain protection | MEDIUM for election software |
| Edge Function alignment | Same runtime for frontend SSR and Edge Functions | MEDIUM for shared code |
| Faster startup | 40-60ms vs 60-120ms cold start | LOW for web server |
| Built-in linting (TS/JS) | ~100x faster than ESLint for non-Svelte files | LOW -- ESLint still needed for Svelte |
| Web standard APIs | Native fetch, WebCrypto, WebStreams | LOW -- already available |
| JSR publishing | Modern registry alongside npm | LOW -- nice-to-have |
| deno compile potential | Single binary deployment (future) | LOW -- not working with SvelteKit |

## Anti-Features

Features to explicitly NOT build/attempt.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Replace Turborepo with deno task | No caching, no topology sorting; 30s+ vs <5s builds | Keep Turborepo in hybrid mode |
| Replace Yarn 4 entirely | Lose catalogs, lockfile, proven workspace support; open bugs | Keep Yarn or evaluate if pure npm workspaces suffice |
| Migrate 542 tests to deno test | test.each missing, no module mocking, no jsdom | Run Vitest on Deno runtime |
| Replace ESLint for Svelte | No template AST parsing (same blocker as oxlint) | Keep ESLint + eslint-plugin-svelte |
| Replace Prettier for Svelte | Unstable flag, known bugs, no Tailwind sorting | Keep Prettier with plugins |
| Use community Deno adapters | Maintenance burden, plugin incompatibility | Use standard adapter-node |
| deno compile SvelteKit | Known bug #26155 | Use adapter-node output |
| Drop tsup for npm packages | Consumers expect JS + .d.ts | Keep tsup for 4 published packages |

## Feature Dependencies

```
adapter-node on Deno works --> Frontend can be deployed on Deno
  |
  +--> Vitest on Deno stays (jsdom, Svelte plugin required)
  |
  +--> ESLint stays (Svelte template linting required)
  |
  +--> Prettier stays (Svelte + Tailwind plugin required)

npm compat layer works --> tsup/tsc can build publishable packages
  |
  +--> Changesets works on Deno --> Release workflow preserved

Workspace support works --> Packages can import each other
  |
  +--> Turborepo works in hybrid mode --> Cached builds preserved
  |    |
  |    +--> OR accept no caching with deno task (major DX regression)
  |
  +--> Vitest on Deno runtime --> Unit tests work
```

## PoC Scope Recommendation

Prioritize validation of blockers over toolchain simplification:

1. **SvelteKit on Deno** -- adapter-node, dev server starts, pages render
2. **@openvaa/core tests on Deno** -- Vitest running under Deno runtime
3. **Playwright subset on Deno** -- 5-10 E2E specs via npx
4. **Startup benchmarks** -- Cold start time comparison

Defer:
- deno fmt adoption (Svelte unstable)
- deno lint adoption (no Svelte template support)
- JSR dual publishing (nice-to-have)
- Turborepo replacement (keep it)
- Vitest replacement with deno test (keep Vitest)

## Sources

### Official Documentation (HIGH confidence)
- [Deno Workspaces and Monorepos](https://docs.deno.com/runtime/fundamentals/workspaces/)
- [Deno Testing](https://docs.deno.com/runtime/fundamentals/testing/)
- [Deno Linting and Formatting](https://docs.deno.com/runtime/fundamentals/linting_and_formatting/)
- [Deno SvelteKit Tutorial](https://docs.deno.com/examples/sveltekit_tutorial/)
- [Deno Node/npm Compatibility](https://docs.deno.com/runtime/fundamentals/node/)
- [Deno Task Runner](https://docs.deno.com/runtime/reference/cli/task/)

### GitHub Issues (MEDIUM confidence)
- [Turborepo Deno Discussion #7454](https://github.com/vercel/turborepo/discussions/7454)
- [Deno npm Workspace Compat #28157](https://github.com/denoland/deno/issues/28157)
- [Deno test.each #30110](https://github.com/denoland/deno/issues/30110)
- [Playwright on Deno #27623](https://github.com/denoland/deno/issues/27623)
- [deno compile SvelteKit #26155](https://github.com/denoland/deno/issues/26155)

### Community (LOW confidence)
- [Paraglide FsWatcher Issue](https://questions.deno.com/m/1328508724410843136)
- [Deno 2 + Playwright Blog](https://honman.dev/posts/deno-2-and-playwright)

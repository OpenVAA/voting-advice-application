# Phase 42: Runtime Validation and PoC - Research

**Researched:** 2026-03-26
**Domain:** Deno 2.x runtime compatibility with existing Node.js/SvelteKit/Turborepo monorepo
**Confidence:** HIGH

## Summary

Deno 2.7.8 (latest stable, released 2026-03-25) provides robust Node.js compatibility that makes the "Deno as runtime only" strategy viable. The project's SvelteKit production build (adapter-node 5.5.4) already uses `node:` prefixed imports in all generated files, which was the primary blocker fixed in SvelteKit PR #12785. Running the production build under Deno requires only `deno run --allow-env --allow-read --allow-net apps/frontend/build/index.js`.

For package testing (POC-01), two approaches exist: (1) running the existing vitest tests through Deno via `deno run -A npm:vitest` (works with `--pool=forks`, the default in vitest 2.x), or (2) creating parallel `deno test`-compatible test files using `@std/testing/bdd` + `@std/expect` which mirror vitest's `describe`/`expect` API closely. The requirement says "passes its full test suite via `deno test`" -- this means approach (2): rewriting tests to use Deno's native test runner. The core package has only 58 lines of tests across 3 files, making it the lowest-risk candidate.

Turborepo's hybrid mode (VAL-03) works because Turborepo reads scripts from `package.json` files, which Deno workspace members can still have alongside `deno.json`. Turborepo does not need to understand `deno.json` -- it only needs `package.json` with scripts defined. Deno workspace members that also have a `package.json` are fully compatible.

**Primary recommendation:** Install Deno 2.7.x via `curl -fsSL https://deno.land/install.sh | sh`, keep all existing tooling unchanged, and validate each requirement with minimal configuration changes (a root `deno.json` for workspace declaration, a per-package `deno.json` for the PoC package).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VAL-01 | SvelteKit production build + Docker deployment tested under Deno's Node compat layer | Build output already uses `node:` imports (adapter-node 5.5.4, PR #12785 fix). Command: `deno run --allow-env --allow-read --allow-net build/index.js` |
| VAL-02 | Playwright E2E tests execute successfully (via `npx` workaround acceptable) | Playwright works via `npx playwright test` against Deno-served frontend. Direct `deno run -A npm:playwright` has had regressions (fixed in 2.7.x). npx is the safer path. |
| VAL-03 | Turborepo hybrid mode tested (deno.json + package.json workspace members coexisting) | Turborepo reads `package.json` scripts only. Deno members with both `deno.json` + `package.json` are invisible to Turborepo as Deno-specific -- they just look like regular npm members. |
| VAL-04 | Changesets CLI compatibility verified in Deno workspace | Changesets reads `package.json` exclusively. Adding `deno.json` alongside does not interfere. The `changeset` CLI runs via npx/yarn, not Deno. |
| VAL-05 | Supabase auth (cookie-based PKCE through hooks.server.ts) works under Deno | `@supabase/ssr` uses standard Web APIs (`fetch`, cookies) + `node:` compatible modules. The server client uses `getAll`/`setAll` cookie methods which are framework-agnostic. |
| POC-01 | One pure logic package runs tests via `deno test` | `@openvaa/core` has 3 test files (58 lines total). Tests use only `vitest` imports (`describe`, `test`, `expect`) -- direct mapping to `@std/testing/bdd` + `@std/expect`. |
| POC-02 | Cross-workspace imports resolve between Deno and npm workspace members | Deno hybrid workspaces support `package.json`-only members alongside `deno.json` members. Import resolution follows `name` field in either config. |
| POC-03 | npm publishing pipeline (tsup build) works from Deno workspace member | tsup runs via npx/yarn (Node process), not Deno. Having `deno.json` alongside `package.json` does not affect tsup. Build output (ESM `.js` files) is runtime-agnostic. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Deno | 2.7.8 | Runtime for validation | Latest stable, all known Playwright/SvelteKit regressions fixed |
| @sveltejs/adapter-node | 5.5.4 | SvelteKit production adapter | Already installed; `node:` imports fixed since PR #12785 |
| Turborepo | (existing) | Build orchestration | Stays as-is; reads `package.json` scripts only |
| Playwright | (existing) | E2E testing | Runs via `npx` against Deno-served frontend |
| vitest | (existing) | Unit testing (existing) | Existing tests stay; parallel `deno test` files created for POC-01 |
| @std/testing/bdd | latest | Deno-native BDD test API | `describe`/`it` compatible with vitest patterns |
| @std/expect | latest | Deno-native expect assertions | `expect(x).toBe(y)` compatible with vitest |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| @changesets/cli | 2.30.0 | Version management | Existing; runs via yarn, not Deno |
| tsup | (existing) | Package bundling | Existing; runs via yarn, not Deno |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `deno test` with rewritten tests | `deno run -A npm:vitest` | Vitest-through-Deno would avoid rewriting but doesn't test native `deno test` capability (POC-01 specifically requires `deno test`) |
| adapter-node | @nextlegacy/sveltekit-adapter-deno | Community adapter uses `Deno.serve` natively, but requirement says "adapter-node" explicitly. Both Deno and Svelte teams recommend adapter-node. |
| Playwright via `deno run` | Playwright via `npx` | `npx` is more stable; `deno run` had regressions in 2.6.0 (fixed in 2.7.x but npx is safer for validation) |

**Installation:**
```bash
# Install Deno (macOS)
curl -fsSL https://deno.land/install.sh | sh
# Or via Homebrew
brew install deno

# Verify
deno --version
# Expected: deno 2.7.8 (or later patch)
```

## Architecture Patterns

### Recommended Project Structure (hybrid workspace)
```
/ (project root)
├── deno.json                    # NEW: root workspace config
├── package.json                 # EXISTING: yarn workspaces
├── turbo.json                   # EXISTING: unchanged
├── apps/
│   └── frontend/
│       ├── package.json         # EXISTING: unchanged
│       └── build/index.js       # EXISTING: run with `deno run`
├── packages/
│   └── core/
│       ├── package.json         # EXISTING: unchanged
│       ├── deno.json            # NEW: Deno workspace member config
│       ├── src/
│       │   └── *.test.ts        # EXISTING: vitest tests (unchanged)
│       └── tests_deno/          # NEW: deno test compatible copies
│           └── *.test.ts        # Imports from @std/testing/bdd + @std/expect
│   └── matching/
│       ├── package.json         # EXISTING: unchanged
│       └── tests/               # EXISTING: vitest tests (unchanged)
```

### Pattern 1: Root deno.json for Hybrid Workspace
**What:** A minimal root `deno.json` that declares the workspace without interfering with existing package.json workspaces.
**When to use:** Phase 42 validation -- coexistence proof.
**Example:**
```json
// deno.json (project root)
{
  "workspace": ["./packages/core"],
  "nodeModulesDir": "manual"
}
```
Key settings:
- `nodeModulesDir: "manual"` -- lets yarn manage node_modules, Deno just reads them
- `workspace` -- only lists the PoC package(s), not the entire monorepo

### Pattern 2: Package-level deno.json for PoC Member
**What:** A `deno.json` in the PoC package that enables `deno test` while preserving `package.json` for Turborepo/yarn.
**When to use:** POC-01 validation.
**Example:**
```json
// packages/core/deno.json
{
  "name": "@openvaa/core",
  "version": "0.1.0",
  "exports": "./src/index.ts",
  "imports": {
    "@std/testing": "jsr:@std/testing@^1",
    "@std/expect": "jsr:@std/expect@^1"
  },
  "tasks": {
    "test": "deno test tests_deno/"
  }
}
```

### Pattern 3: Deno-Compatible Test File (mirroring vitest)
**What:** Test files that use Deno's `@std/testing/bdd` instead of vitest imports.
**When to use:** POC-01 -- proving `deno test` works on package logic.
**Example:**
```typescript
// packages/core/tests_deno/missingValue.test.ts
// Source: https://docs.deno.com/runtime/fundamentals/testing/
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { isEmptyValue } from "../src/matching/missingValue.ts";

describe("isEmptyValue", () => {
  it("treats undefined as empty", () => {
    expect(isEmptyValue(undefined)).toBe(true);
  });
  it("treats null as empty", () => {
    expect(isEmptyValue(null)).toBe(true);
  });
  // ... mirror remaining assertions from vitest version
});
```

### Pattern 4: Running SvelteKit Production Build on Deno
**What:** Start the adapter-node build output under Deno runtime.
**When to use:** VAL-01 validation.
**Example:**
```bash
# Build with existing tooling (yarn/Node)
yarn build

# Serve with Deno instead of Node
cd apps/frontend
deno run --allow-env --allow-read --allow-net build/index.js
```
Required permissions:
- `--allow-env` -- reads `PORT`, `HOST`, Supabase env vars
- `--allow-read` -- serves static files from `build/client/`
- `--allow-net` -- listens on HTTP port, connects to Supabase API

### Pattern 5: E2E Tests Against Deno-Served Frontend
**What:** Point Playwright at the Deno-served frontend.
**When to use:** VAL-02 validation.
**Example:**
```bash
# Terminal 1: Start frontend on Deno
cd apps/frontend
PORT=5173 deno run --allow-env --allow-read --allow-net build/index.js

# Terminal 2: Run Playwright (via npx, not Deno)
FRONTEND_PORT=5173 npx playwright test -c ./tests/playwright.config.ts --project=voter-app
```

### Anti-Patterns to Avoid
- **Replacing adapter-node with a community Deno adapter:** Both Deno and Svelte teams recommend adapter-node. Community adapters add maintenance burden for zero gain in the "runtime only" strategy.
- **Running the build step itself via Deno:** The build uses Vite, SvelteKit, and tsup -- these run under Node. Only the production server runtime switches to Deno.
- **Adding deno.json to all packages at once:** Start with one PoC package. Adding deno.json to packages that don't need it creates unnecessary configuration surface.
- **Using `--allow-all` / `-A` in production validation:** Use granular permissions (`--allow-env`, `--allow-read`, `--allow-net`) to validate Deno's security model works correctly.
- **Removing vitest tests:** Keep existing vitest tests unchanged. The `deno test` files are parallel copies for POC-01 proof only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| BDD test structure for Deno | Custom test harness | `@std/testing/bdd` | Standard library, maintained by Deno team, mirrors vitest API |
| Assertion library for Deno | Custom matchers | `@std/expect` | Jest/vitest-compatible `expect()` API |
| SvelteKit Deno adapter | Custom HTTP server | `@sveltejs/adapter-node` (existing) | Official adapter, `node:` imports fixed, works on Deno out-of-box |
| Deno workspace resolution | Manual import maps | `deno.json` workspace config | Native feature, handles cross-member resolution automatically |

**Key insight:** The "Deno as runtime" strategy means almost no new tooling is needed. Deno runs the existing Node.js output. The only new code is the parallel test files for POC-01.

## Common Pitfalls

### Pitfall 1: Playwright Regressions in Specific Deno Versions
**What goes wrong:** Playwright tests timeout or produce `BadResource` errors when run via `deno run -A npm:playwright`.
**Why it happens:** Deno has had multiple regressions affecting `setImmediate` behavior (fixed in patches but recurring across minor versions: 2.1.5, 2.6.0).
**How to avoid:** Run Playwright via `npx playwright test` (Node.js process), not `deno run`. The requirement allows this: "via `npx` workaround is acceptable".
**Warning signs:** Tests hanging indefinitely or timeouts on browser.newPage().

### Pitfall 2: Paraglide JS FsWatcher Error on Deno Dev Server
**What goes wrong:** `@inlang/paraglide-js` throws "Input watch path is neither a file nor a directory" when running the Vite dev server under Deno.
**Why it happens:** Paraglide's file watcher uses Node.js `fs.watch` in a way incompatible with Deno's polyfill.
**How to avoid:** This affects **dev server only**, not production builds. For Phase 42 validation, only the production build needs to run on Deno. Dev server stays on Node.
**Warning signs:** Error during `deno task dev`.

### Pitfall 3: nodeModulesDir Misconfiguration
**What goes wrong:** Deno tries to install its own node_modules or conflicts with yarn's existing node_modules.
**Why it happens:** Default `nodeModulesDir` behavior changes based on whether `package.json` is present.
**How to avoid:** Set `"nodeModulesDir": "manual"` in root `deno.json`. This tells Deno to use the existing node_modules managed by yarn without trying to modify them.
**Warning signs:** Duplicate package installations, version conflicts, or missing modules.

### Pitfall 4: File Extension Requirements in deno test
**What goes wrong:** `deno test` can't resolve imports without `.ts` extensions.
**Why it happens:** Deno requires explicit file extensions in imports (e.g., `./missingValue.ts` not `./missingValue`). The existing TypeScript source uses extensionless imports relying on Node/bundler resolution.
**How to avoid:** In `deno test` files, use full `.ts` extensions when importing from source. Or set `"nodeModulesDir": "manual"` and import from the built `dist/` output (which has `.js` extensions).
**Warning signs:** `Module not found` errors during `deno test`.

### Pitfall 5: Changesets Trying to Read deno.json
**What goes wrong:** Changesets might not recognize workspace members that have a `deno.json` but no changes to `package.json`.
**Why it happens:** Changesets uses yarn/npm workspace resolution, not Deno workspaces.
**How to avoid:** Ensure every Deno workspace member also has a `package.json` (which they already do). Changesets reads `package.json` only.
**Warning signs:** "No packages found" during `changeset status`.

### Pitfall 6: Supabase Cookie Serialization Differences
**What goes wrong:** Auth cookies are set but not readable across requests under Deno runtime.
**Why it happens:** Deno's Node.js compat layer may handle `Set-Cookie` headers slightly differently from Node.js native.
**How to avoid:** Test the complete auth flow (login -> navigate -> reload -> verify session persists) explicitly. The `@supabase/ssr` package uses `getAll`/`setAll` which are web-standard patterns.
**Warning signs:** Session lost on page reload, redirect loops on protected routes.

## Code Examples

### Running SvelteKit Production Build on Deno
```bash
# Source: https://docs.deno.com/examples/svelte_tutorial/
# Build with Node/Yarn (unchanged)
yarn workspace @openvaa/frontend build

# Run with Deno
deno run --allow-env --allow-read --allow-net apps/frontend/build/index.js
# Expected output: "Listening on http://0.0.0.0:3000"
```

### Creating a deno.json for Hybrid Workspace
```json
// Source: https://docs.deno.com/runtime/fundamentals/workspaces/
// Root deno.json
{
  "workspace": ["./packages/core"],
  "nodeModulesDir": "manual"
}
```

### Rewriting a vitest Test for deno test
```typescript
// BEFORE (vitest) - packages/core/src/matching/distance.test.ts
import { expect, test } from 'vitest';
import { normalizedDistance } from '../../src/matching/distance';

test('normalizedDistance', () => {
  expect(normalizedDistance({ value: 0, max: 10 })).toBe(0);
});

// AFTER (deno test) - packages/core/tests_deno/distance.test.ts
// Source: https://docs.deno.com/runtime/fundamentals/testing/
import { expect } from "@std/expect";
import { normalizedDistance } from "../src/matching/distance.ts";

Deno.test("normalizedDistance", () => {
  expect(normalizedDistance({ value: 0, max: 10 })).toBe(0);
});
```

### Verifying Turborepo Still Works with deno.json Present
```bash
# After adding deno.json files, verify Turborepo still functions
yarn build  # Should complete normally
yarn test:unit  # Should complete normally
# Turborepo ignores deno.json -- it only reads package.json scripts
```

### Verifying Changesets Still Works
```bash
# After adding deno.json files
yarn changeset status  # Should list all packages normally
```

### Running Playwright Against Deno-Served Frontend
```bash
# Start Deno-served frontend (production build)
PORT=5173 deno run --allow-env --allow-read --allow-net apps/frontend/build/index.js &

# Run a subset of E2E tests (voter-app project has 7 specs, candidate-app has 6)
FRONTEND_PORT=5173 npx playwright test -c ./tests/playwright.config.ts \
  --project=data-setup --project=voter-app

# Verify at least 10 specs passing
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Community Deno adapters for SvelteKit | adapter-node on Deno | SvelteKit PR #12785, Oct 2024 | No custom adapter needed; official adapter works |
| `deno run npm:vitest` unreliable | vitest 2.x works via `--pool=forks` | Deno #23882 closed, mid-2025 | Existing vitest tests can run under Deno |
| Deno workspaces incompatible with npm | Hybrid deno.json + package.json workspaces | Deno 2.1+, late 2024 | Gradual adoption possible |
| Playwright broken on Deno | Fixed (multiple regression/fix cycles) | Deno 2.7.x, 2026 | Still recommend npx for stability |

**Deprecated/outdated:**
- `svelte-adapter-deno` by pluvial: Unnecessary now that adapter-node works on Deno
- `sveltekit-adapter-deno` by dbushell: Same -- adapter-node is recommended
- Deno's blog post recommending community adapters: Superseded by official adapter fix

## Open Questions

1. **Paraglide JS FsWatcher -- has it been fixed upstream?**
   - What we know: The issue exists on Deno dev server. A workaround using a custom Vite plugin exists.
   - What's unclear: Whether @inlang/paraglide-js 2.15.0 has fixed this natively.
   - Recommendation: Not blocking for Phase 42 (only production runtime is tested, not dev server). Document for future reference.

2. **Exact Deno permissions needed for full auth flow**
   - What we know: `--allow-env --allow-read --allow-net` covers basic serving.
   - What's unclear: Whether cookie serialization through `@supabase/ssr` needs additional permissions (e.g., `--allow-sys` for hostname).
   - Recommendation: Start with specific permissions, add only if errors occur. Document findings.

3. **vitest jsdom environment on Deno**
   - What we know: `environment: 'jsdom'` in vitest config causes "Cannot redefine property: location" on Deno due to `globalThis.location` being non-configurable.
   - What's unclear: Whether this affects any frontend unit tests.
   - Recommendation: POC-01 targets `@openvaa/core` which does not use jsdom. Not blocking.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Deno | All VAL/POC requirements | NOT INSTALLED | -- | `curl -fsSL https://deno.land/install.sh \| sh` or `brew install deno` |
| Node.js | Build pipeline | Available | 22.4.0 | -- |
| Yarn | Package management | Available | 4.13.0 | -- |
| Turborepo | Build orchestration | Available | (via yarn) | -- |
| Supabase CLI | Local backend | Available (via yarn) | -- | -- |
| Playwright | E2E testing | Available (via npx) | -- | -- |
| Docker | Production testing | Not checked | -- | Not required for Phase 42 core validation |

**Missing dependencies with no fallback:**
- Deno must be installed before any validation work begins. First task.

**Missing dependencies with fallback:**
- None -- all other tools are already available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (existing) + deno test (new for POC-01) |
| Config file | `vitest.workspace.ts` (existing), per-package `deno.json` (Wave 0) |
| Quick run command | `deno test packages/core/tests_deno/` |
| Full suite command | `yarn test:unit && deno test packages/core/tests_deno/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-01 | SvelteKit build starts on Deno | smoke | `deno run --allow-env --allow-read --allow-net apps/frontend/build/index.js & sleep 3 && curl -f http://localhost:3000 && kill %1` | Wave 0 (script) |
| VAL-02 | Playwright E2E pass against Deno frontend | e2e | `FRONTEND_PORT=5173 npx playwright test -c ./tests/playwright.config.ts --project=voter-app` | Existing specs |
| VAL-03 | Turborepo works with deno.json present | smoke | `yarn build && yarn test:unit` | Existing pipeline |
| VAL-04 | Changesets CLI works with deno.json present | smoke | `yarn changeset status` | Existing CLI |
| VAL-05 | Supabase PKCE auth works on Deno | e2e | `FRONTEND_PORT=5173 npx playwright test -c ./tests/playwright.config.ts --project=auth-setup --project=candidate-app` | Existing specs |
| POC-01 | Core package tests pass via deno test | unit | `deno test packages/core/tests_deno/` | Wave 0 |
| POC-02 | Cross-workspace imports resolve | smoke | `deno check packages/core/src/index.ts` | Wave 0 (script) |
| POC-03 | tsup build works from Deno workspace member | smoke | `yarn workspace @openvaa/core build` | Existing pipeline |

### Sampling Rate
- **Per task commit:** `deno test packages/core/tests_deno/` (for POC-01 tasks)
- **Per wave merge:** Full validation suite (all smoke + unit + targeted e2e)
- **Phase gate:** All 8 requirements verified before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Install Deno 2.7.x on development machine
- [ ] `packages/core/tests_deno/` directory with deno-test-compatible test files
- [ ] `packages/core/deno.json` -- Deno workspace member config
- [ ] Root `deno.json` -- workspace declaration with `nodeModulesDir: "manual"`
- [ ] Smoke test script for VAL-01 (start server, curl, stop)

## Sources

### Primary (HIGH confidence)
- [SvelteKit PR #12783](https://github.com/sveltejs/kit/issues/12783) - adapter-node `node:` import fix confirmed merged, issue closed Oct 2024
- [Deno Workspaces Docs](https://docs.deno.com/runtime/fundamentals/workspaces/) - hybrid deno.json + package.json coexistence
- [Deno Configuration Docs](https://docs.deno.com/runtime/fundamentals/configuration/) - `nodeModulesDir` settings, package.json support
- [Deno Testing Docs](https://docs.deno.com/runtime/fundamentals/testing/) - `deno test`, `@std/testing/bdd`, `@std/expect`
- [Deno `deno test` CLI Reference](https://docs.deno.com/runtime/reference/cli/test/) - file patterns, flags, filtering
- Verified: `apps/frontend/build/index.js` already uses `node:` prefixed imports (read directly)
- Verified: `@sveltejs/adapter-node` 5.5.4 installed (from yarn.lock)

### Secondary (MEDIUM confidence)
- [Deno #23882 - Vitest tracking issue](https://github.com/denoland/deno/issues/23882) - closed as completed; vitest works with `--pool=forks`
- [Deno #31595 - Playwright timeout regression](https://github.com/denoland/deno/issues/31595) - fixed in patch after 2.6.0; `npx` workaround recommended
- [Turborepo #7454 - Deno packages discussion](https://github.com/vercel/turborepo/discussions/7454) - Turborepo reads package.json only; deno.json is invisible to it
- [Deno SvelteKit Tutorial](https://docs.deno.com/examples/svelte_tutorial/) - official tutorial uses sv CLI + Deno
- [Running Svelte 5 on Deno 2](https://amun.pl/blog/post/running-svelte-5-projects-using-deno-in-2024) - confirmed adapter-node + Deno works

### Tertiary (LOW confidence)
- Paraglide FsWatcher issue -- confirmed to exist but workaround status unclear; not blocking for Phase 42 (production only, not dev server)
- Changesets CLI on Deno -- no direct testing evidence found; MEDIUM risk but Changesets only reads package.json so interference unlikely

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Deno 2.7.x is well-documented, adapter-node fix verified in build output
- Architecture: HIGH - Hybrid workspace pattern documented officially by Deno; Turborepo behavior confirmed via discussions
- Pitfalls: HIGH - Playwright regressions well-documented with fix history; nodeModulesDir gotcha documented officially
- POC-01 approach: HIGH - @std/testing/bdd + @std/expect provide direct vitest API mapping; core tests are 58 lines total
- VAL-05 (auth): MEDIUM - @supabase/ssr uses web-standard APIs but no direct Deno 2 compatibility report found

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (Deno releases ~monthly; check for new regressions before execution)

## Project Constraints (from CLAUDE.md)

- **Use TypeScript strictly** -- avoid `any`, prefer explicit types (applies to new deno test files)
- **Yarn 4 workspaces** -- must not be disrupted by deno.json additions
- **Turborepo build orchestration** -- must continue to work with `yarn build`
- **adapter-node** -- confirmed as the production adapter; no switching
- **Testing** -- `yarn test:unit` uses vitest via Turborepo; existing tests must not break
- **E2E testing** -- Playwright config at `tests/playwright.config.ts`; uses `npx playwright test`
- **Environment variables** -- read from root `.env` file
- **Build system** -- tsup for package builds, vite for frontend; both run under Node

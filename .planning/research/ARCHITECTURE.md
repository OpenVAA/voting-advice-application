# Architecture Patterns: Deno Migration

**Domain:** Runtime migration feasibility study
**Researched:** 2026-03-26

## Recommended Architecture: Strategy B (Runtime-Only Migration)

The recommended approach keeps the entire build toolchain intact and only replaces the execution runtime.

```
BEFORE (Node.js everywhere):
  Developer Machine: Node 22 + Yarn 4 + Turborepo
  CI/CD: Node 22 + Yarn 4 + Turborepo + Playwright
  Production: Node 22 Docker (adapter-node output)
  Edge Functions: Deno 2.1.4 (already)

AFTER (Deno as runtime, Node toolchain for builds):
  Developer Machine: Deno 2.7 (runtime) + Yarn 4 + Turborepo
  CI/CD: Deno 2.7 (runtime) + Yarn 4 + Turborepo + Playwright
  Production: Deno 2.7 Docker (adapter-node output)
  Edge Functions: Deno 2.1.4 (unchanged)
```

### Component Boundaries

| Component | Responsibility | Changes in Migration |
|-----------|---------------|---------------------|
| Yarn 4.13 | Package management, workspace resolution, catalogs | NONE -- stays as-is |
| Turborepo 2.8 | Build orchestration, caching, topological ordering | NONE -- stays as-is |
| tsup | ESM/CJS bundle generation for npm packages | NONE -- stays as-is |
| Vite 6.4 | Dev server, frontend build | Runtime changes from Node to Deno |
| SvelteKit 2.55 | Frontend framework, SSR, routing | NONE -- adapter-node stays |
| Vitest 3.2 | Unit test framework | Runtime changes from Node to Deno |
| Playwright 1.58 | E2E test framework | Run via npx (uses system Node/Deno) |
| ESLint 9 | Linting (Svelte + TS/JS) | NONE -- stays as-is |
| Prettier 3.7 | Formatting (Svelte + Tailwind) | NONE -- stays as-is |
| Deno 2.7 (NEW) | Execution runtime | NEW -- replaces Node for running scripts |

### Data Flow (Unchanged)

```
Build: Turborepo -> tsup (packages) -> Vite (frontend) -> adapter-node output
Dev:   Deno -> Vite dev server -> SvelteKit -> Supabase API
Prod:  Deno -> adapter-node handler -> SvelteKit SSR -> Supabase API
Test:  Deno -> Vitest (unit) / npx -> Playwright (E2E) / pgTAP (database)
```

## Migration Sequence (PoC Phase)

### Step 1: Install Deno alongside Node
No changes to existing toolchain. Both runtimes coexist.

```bash
# Deno install (one-time)
curl -fsSL https://deno.land/install.sh | sh

# Verify
deno --version  # Should show 2.7.x
```

### Step 2: Create root deno.json (minimal)
This does NOT replace package.json or turbo.json. It provides Deno-specific configuration.

```json
{
  "nodeModulesDir": "auto",
  "unstable": ["fmt-component"],
  "tasks": {
    "dev:deno": "deno run -A npm:vite dev",
    "test:deno": "deno run -A npm:vitest run"
  }
}
```

### Step 3: Validate SvelteKit dev server on Deno
```bash
# Current (Node)
yarn dev  # starts Supabase + Vite under Node

# PoC (Deno)
yarn supabase:start  # Supabase still via CLI
deno task dev:deno   # Vite dev server under Deno
```

### Step 4: Validate unit tests on Deno
```bash
# Current (Node)
yarn test:unit  # Turborepo -> Vitest under Node

# PoC (Deno)
cd packages/core
deno run -A npm:vitest run  # Vitest under Deno for one package
```

### Step 5: Validate Playwright on Deno
```bash
# E2E tests run via npx regardless -- Playwright manages its own runtime
npx playwright test -c ./tests/playwright.config.ts ./tests
```

## Patterns to Follow

### Pattern 1: Hybrid Workspace (deno.json alongside package.json)
**What:** Add deno.json to workspace members without removing package.json
**When:** During gradual migration
**Why:** Preserves Yarn/Turborepo compatibility while enabling Deno execution

```
packages/core/
  package.json    # Yarn resolution, Turborepo scripts, npm publishing
  deno.json       # Deno-specific config (if needed for deno test)
  tsup.config.ts  # npm build (unchanged)
  tsconfig.json   # TypeScript config (unchanged)
  src/
  dist/
```

### Pattern 2: adapter-node on Deno Runtime
**What:** Use standard @sveltejs/adapter-node, run output under Deno
**When:** Always -- this is the recommended approach
**Why:** Both Deno and Svelte teams recommend this over community adapters

```javascript
// svelte.config.js -- NO CHANGES NEEDED
import adapter from '@sveltejs/adapter-node';
export default { kit: { adapter: adapter() } };
```

```dockerfile
# Production Dockerfile change
# BEFORE
FROM node:22-alpine
CMD ["node", "build/index.js"]

# AFTER
FROM denoland/deno:alpine-2.7.7
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "build/index.js"]
```

### Pattern 3: Permission Flags in Tasks
**What:** Explicit permission grants for Deno execution
**When:** Any deno run command
**Why:** Security model requires explicit grants

```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-write --allow-env --allow-run npm:vite dev",
    "build": "deno run --allow-all npm:vite build",
    "test": "deno run --allow-read --allow-env npm:vitest run"
  }
}
```

Note: `--allow-all` (`-A`) is acceptable for build tasks; more granular permissions are better for production.

### Pattern 4: Edge Function Shared Code
**What:** Share TypeScript types between frontend and Edge Functions
**When:** After runtime unification is validated
**Why:** Eliminates the esm.sh CDN import pattern in Edge Functions

```
Current Edge Function:
  import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

Potential with workspace:
  import {createClient} from 'npm:@supabase/supabase-js';
  import type {CandidateData} from '@openvaa/data';  // workspace import
```

**Limitation:** Supabase CLI uses its own Edge Runtime, not standard Deno CLI. Each function needs its own deno.json for deployment. The _shared folder pattern is recommended for shared code between functions. Full workspace imports may not work with Supabase's deploy pipeline.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Big Bang Migration
**What:** Replacing all tools at once (Yarn, Turborepo, ESLint, Prettier, Vitest)
**Why bad:** Multiple simultaneous changes make it impossible to isolate failures. If something breaks, you cannot tell if it was the Deno migration, the Turborepo removal, or the ESLint replacement.
**Instead:** Change ONE variable at a time. Strategy B changes only the runtime.

### Anti-Pattern 2: Removing package.json Prematurely
**What:** Converting workspace members to deno.json-only
**Why bad:** Turborepo requires package.json to find scripts. Yarn requires package.json for workspace resolution. Changesets requires package.json for version management.
**Instead:** Keep package.json in all workspace members. Add deno.json alongside it if needed.

### Anti-Pattern 3: Using Community SvelteKit Adapters
**What:** Switching from adapter-node to sveltekit-adapter-deno or svelte-adapter-deno
**Why bad:** Community adapters require custom code for every plugin (Paraglide, Tailwind, etc.), have smaller maintainer pools, and may lag behind SvelteKit releases.
**Instead:** Use the standard adapter-node. Deno's Node compatibility layer handles it.

### Anti-Pattern 4: Replacing Vitest with deno test
**What:** Rewriting 542 unit tests to use Deno.test() API
**Why bad:** Loses test.each, module mocking (vi.mock), jsdom environment, Vite plugin integration, and watch mode. The frontend tests cannot work without these.
**Instead:** Run Vitest under Deno runtime. Same test code, different execution engine.

### Anti-Pattern 5: Dropping Turborepo Without Caching Alternative
**What:** Replacing Turborepo with `deno task --recursive`
**Why bad:** Every build becomes uncached (~30s+ for full monorepo vs <5s with Turborepo). The caching features are "on the roadmap" for Deno but not shipped.
**Instead:** Keep Turborepo. It reads package.json scripts regardless of runtime.

## Scalability Considerations

| Concern | Current (Node) | After Migration (Deno) |
|---------|---------------|----------------------|
| Build caching | Turborepo: <5s cached | Same (Turborepo stays) |
| CI time | ~3min total | Same or marginally faster (Deno startup) |
| Dev startup | ~2s (Vite) | ~2s (Vite on Deno, same Vite) |
| Docker size | ~38MB compressed | ~53MB on-disk (comparable) |
| Package count | 10 packages, 3 apps | Same structure, no architectural change |
| Contributor onboarding | Install Node + Yarn | Install Deno + Yarn (adds one tool) |

The migration does NOT change the system's scalability characteristics because the architecture stays identical. The only change is which binary executes the JavaScript/TypeScript.

## CI/CD Architecture

### Current
```yaml
# .github/workflows/ci.yml
- uses: actions/setup-node@v4
  with: { node-version: '22' }
- run: yarn install
- run: yarn build
- run: yarn test:unit
- run: yarn test:e2e
```

### After Migration
```yaml
# .github/workflows/ci.yml
- uses: denoland/setup-deno@v2  # Deno for runtime
  # Deno 2.x is the default
- uses: actions/setup-node@v4   # Node still needed for Yarn/Turborepo
  with: { node-version: '22' }
- run: yarn install              # Yarn still manages packages
- run: yarn build                # Turborepo still orchestrates builds
- run: yarn test:unit            # Vitest runs on Deno (if configured)
- run: npx playwright test       # Playwright via npx
```

Note: Both Node AND Deno may be needed in CI during transition. Node for Yarn/Turborepo, Deno as runtime.

## Sources

- [Deno SvelteKit Tutorial](https://docs.deno.com/examples/sveltekit_tutorial/)
- [Deno Docker Reference](https://docs.deno.com/runtime/reference/docker/)
- [Deno CI/GitHub Actions](https://docs.deno.com/runtime/reference/continuous_integration/)
- [Supabase Edge Functions Deps](https://supabase.com/docs/guides/functions/dependencies)
- [Deno Workspaces](https://docs.deno.com/runtime/fundamentals/workspaces/)
- [Turborepo Deno Discussion #7454](https://github.com/vercel/turborepo/discussions/7454)
- [adapter-node recommendation](https://amun.pl/blog/post/running-svelte-5-projects-using-deno-in-2024)

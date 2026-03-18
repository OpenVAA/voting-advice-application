# Architecture Patterns: Svelte 5 Frontend Migration Infrastructure

**Domain:** Svelte 5 migration infrastructure for existing SvelteKit 2 monorepo
**Researched:** 2026-03-15

## Recommended Architecture: Fresh Scaffold Replacement-in-Place

The strategy is to replace the `apps/frontend` directory with a fresh SvelteKit 2 + Svelte 5 scaffold, then re-integrate the existing application code on the new infrastructure. This is preferable to in-place upgrade because the configuration surface area between Svelte 4 and Svelte 5 is large enough that a clean starting point avoids accumulating deprecated config.

**Confidence:** HIGH (based on official Svelte migration docs, official Tailwind 4 upgrade guide, official DaisyUI 5 install docs)

---

## Component Boundaries: What Changes vs What Stays

### Files That Are REPLACED (new scaffold provides these)

| File | Svelte 4 (Current) | Svelte 5 (New) | Key Change |
|------|-------------------|----------------|------------|
| `svelte.config.js` | `svelte-preprocess` with PostCSS | No preprocessor needed (Svelte 5 handles `lang="ts"` natively) | `preprocess` array removed entirely |
| `vite.config.ts` | `sveltekit()` + `vite-tsconfig-paths` | `tailwindcss()` from `@tailwindcss/vite` + `sveltekit()` | Add Tailwind Vite plugin, remove `vite-tsconfig-paths` (SvelteKit handles aliases) |
| `postcss.config.cjs` | `tailwindcss` + `autoprefixer` plugins | **DELETE** -- no longer needed when using `@tailwindcss/vite` | Tailwind 4 uses Vite plugin, not PostCSS |
| `tailwind.config.mjs` | 283-line JS config with DaisyUI plugin, custom theme, safelist | **DELETE** -- replaced by CSS-first `@theme` in `app.css` | Entire config moves to CSS |
| `src/app.css` | `@tailwind base/components/utilities` + `@layer` rules | `@import "tailwindcss"` + `@plugin "daisyui"` + `@theme {}` + `@utility` | Complete rewrite of CSS entry point |
| `package.json` | Svelte 4, vite-plugin-svelte v3, svelte-preprocess, TW 3, DaisyUI 4 | Svelte 5, vite-plugin-svelte v4+, TW 4, DaisyUI 5 | Major version bumps across the board |
| `vitest.config.ts` | `svelte({ hot: !process.env.VITEST })` | Updated for Svelte 5 testing | Plugin config changes |

### Files That Are MODIFIED (existing files, updated for Svelte 5 infrastructure)

| File | What Changes | Why |
|------|-------------|-----|
| `tsconfig.json` | Extends from `.svelte-kit/tsconfig.json` + shared-config (keep existing pattern), but remove `preserveSymlinks` if no longer needed | Svelte 5 generates updated tsconfig types |
| `src/app.html` | Stays the same (the `%lang%` pattern and DaisyUI theme data attribute are compatible) | No structural changes needed |
| `src/app.d.ts` | Keep as-is during infrastructure phase; will need Svelte 5 type updates during content migration | Type definitions are unchanged at infrastructure level |
| `Dockerfile` | No changes needed -- still builds packages then frontend | Docker build process is infra-agnostic |
| `docker-compose.dev.yml` | No changes needed -- volume mounts and ports stay the same | Dev container mounts the source directory regardless of framework version |

### Files That STAY UNCHANGED (no infrastructure impact)

| File/Area | Why No Change |
|-----------|--------------|
| `turbo.json` | Turborepo task definitions are framework-agnostic; `build`, `test:unit`, `lint`, `typecheck` tasks stay the same |
| `docker-compose.dev.yml` (root) | Service definitions, environment variables, health checks are all independent of Svelte version |
| `.github/workflows/main.yaml` | CI steps (install, build, lint, test) use yarn workspace commands that are framework-agnostic |
| `tests/playwright.config.ts` | E2E tests hit the browser -- they test the running app, not the build tooling |
| `packages/*` | All shared packages are consumed as built artifacts; they have no Svelte dependency |
| `apps/strapi/` | Backend is completely independent of frontend framework version |

---

## Detailed Infrastructure Changes

### 1. svelte.config.js -- From Preprocessor to Minimal

**Current (Svelte 4):**
```javascript
import adapter from '@sveltejs/adapter-node';
import path from 'path';
import { sveltePreprocess } from 'svelte-preprocess';

const config = {
  preprocess: [
    sveltePreprocess({
      postcss: true
    })
  ],
  kit: {
    adapter: adapter({}),
    alias: {
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate')
    },
    version: {
      pollInterval: 5 * 60 * 1000
    }
  }
};
```

**New (Svelte 5):**
```javascript
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter({}),
    alias: {
      $types: 'src/lib/types',
      $voter: 'src/lib/voter',
      $candidate: 'src/lib/candidate'
    },
    version: {
      pollInterval: 5 * 60 * 1000
    }
  }
};
```

**Key changes:**
- `svelte-preprocess` removed entirely -- Svelte 5 natively supports `lang="ts"` without a preprocessor
- `path.resolve()` calls simplified to string paths (SvelteKit resolves aliases relative to project root)
- `@sveltejs/adapter-node` stays the same -- SSR adapter is unchanged
- Custom aliases (`$types`, `$voter`, `$candidate`) preserved -- these are SvelteKit features, not Svelte-version-specific
- `version.pollInterval` preserved -- this is a SvelteKit feature

**Confidence:** HIGH (official Svelte 5 docs confirm preprocessor removal; SvelteKit alias docs confirm string paths)

### 2. vite.config.ts -- Add Tailwind Vite Plugin

**Current:**
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  resolve: { preserveSymlinks: true },
  plugins: [sveltekit(), viteTsConfigPaths()],
  server: { port: Number(process.env.FRONTEND_PORT) }
};
```

**New:**
```typescript
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: { port: Number(process.env.FRONTEND_PORT) }
});
```

**Key changes:**
- `@tailwindcss/vite` plugin added (Tailwind 4 recommended approach for Vite-based projects)
- `vite-tsconfig-paths` removed -- SvelteKit handles path aliases natively via `kit.alias`
- `preserveSymlinks` removed -- evaluate if still needed (was likely for monorepo workspace resolution, which modern Vite handles)
- `defineConfig` used instead of raw object (better type inference)

**Confidence:** HIGH (official Tailwind 4 upgrade guide, official DaisyUI SvelteKit install guide)

### 3. CSS Architecture -- Tailwind 3 to Tailwind 4 + DaisyUI 5

This is the most complex infrastructure change. The entire Tailwind and DaisyUI configuration moves from JavaScript to CSS.

**Current `app.css` (Tailwind 3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base { ... }
@layer components { ... }
@layer utilities { ... }
```

**New `app.css` (Tailwind 4 + DaisyUI 5):**
```css
@import "tailwindcss";
@plugin "daisyui";

/* Custom light theme */
@plugin "daisyui/theme" {
  name: "openvaa-light";
  default: true;
  color-scheme: light;
  --color-primary: oklch(...);
  --color-secondary: oklch(...);
  /* ... all theme colors ... */
  --radius-selector: 0.5rem;
  --radius-field: 0.5rem;
  --radius-box: 0.25rem;
  --border: 0px;
}

/* Custom dark theme */
@plugin "daisyui/theme" {
  name: "openvaa-dark";
  prefersdark: true;
  color-scheme: dark;
  --color-primary: oklch(...);
  /* ... */
}

/* Custom theme tokens */
@theme {
  --font-base: "Inter", system-ui, sans-serif;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  /* ... migrated from tailwind.config.mjs ... */
}

/* Custom utilities (migrated from @layer) */
@utility edgetoedge-x {
  /* ... */
}
```

**What must be migrated from `tailwind.config.mjs`:**

| Config Section | Lines | Migration Target | Complexity |
|---------------|-------|-----------------|------------|
| Theme colors (DaisyUI themes) | 60+ | `@plugin "daisyui/theme" {}` blocks in CSS | Medium -- need hex-to-oklch conversion |
| Custom spacing scale | 40+ | `@theme { --spacing-* }` in CSS | Low -- mechanical |
| Custom font-family | 10 | `@theme { --font-* }` in CSS | Low |
| Custom fontSize scale | 15 | `@theme { --text-* }` in CSS | Low |
| Custom borderRadius | 10 | `@theme { --radius-* }` in CSS | Low |
| Custom borderWidth | 5 | `@theme { --border-* }` in CSS | Low |
| Custom lineHeight | 5 | `@theme { --leading-* }` in CSS | Low |
| Custom transitionDuration | 6 | `@theme { --duration-* }` in CSS | Low |
| Safe area spacing | 12 | `@theme { --spacing-safe* }` in CSS | Low |
| Safelist (dynamic color classes) | 5 | `@source inline(...)` in CSS | Medium -- verify DaisyUI 5 color handling |
| DaisyUI CSS variables (`--rounded-*`, `--animation-*`) | 10 | Evaluate if DaisyUI 5 handles differently | Medium -- check DaisyUI 5 variables |
| `fixedScreenHeight` extend | 5 | `@theme { --height-screen }` or check TW4 defaults | Low -- TW4 may handle dvh natively |

**DaisyUI 4 to 5 class name changes that affect `app.css`:**
- `@layer utilities` becomes `@utility` directive
- `@layer components` custom styles need evaluation -- DaisyUI 5 uses native cascade layers
- `.btn-ghost` styles may need updating for DaisyUI 5 component changes

**DaisyUI 5 theme variable mapping:**
| DaisyUI 4 (JS) | DaisyUI 5 (CSS) |
|----------------|----------------|
| `primary: '#2546a8'` | `--color-primary: oklch(...)` |
| `'base-100': '#ffffff'` | `--color-base-100: oklch(...)` |
| `'--rounded-btn': 'var(--rounded-lg)'` | `--radius-selector: 0.5rem` |
| `'--animation-btn': 'var(--duration-sm)'` | Evaluate DaisyUI 5 defaults |
| `'--border-btn': '0px'` | `--border: 0px` |

**Critical: Dynamic colors from `@openvaa/app-shared`**

The current `tailwind.config.mjs` reads colors from `staticSettings` at build time:
```javascript
import { staticSettings } from '@openvaa/app-shared';
function getColor(name, defaultValue, theme = 'light') {
  return staticSettings.colors?.[theme]?.[name] ?? defaultValue;
}
```

This pattern is **incompatible with CSS-first configuration**. Options:

1. **Build-time CSS generation** -- A build script reads `staticSettings` and generates the `@plugin "daisyui/theme"` CSS block before the build. This preserves the runtime-configurable theme pattern.
2. **CSS custom properties at runtime** -- Use CSS variables set by a `<style>` tag in `+layout.svelte` that override the defaults. DaisyUI 5 themes are CSS-variable-based, so this is viable.
3. **Use `@config` directive** -- Tailwind 4 supports `@config "../../tailwind.config.js"` to load a JS config, but this limits the migration benefits and is marked as legacy.

**Recommendation:** Option 2 -- CSS custom properties at runtime. Define sensible defaults in the CSS theme, then override from `staticSettings` in the root layout. This is the most Svelte-5-native approach and avoids build-time code generation.

**Confidence:** MEDIUM -- the dynamic color pattern needs validation during implementation. The `@config` fallback (option 3) exists if option 2 proves insufficient.

### 4. Package Version Matrix

| Package | Current Version | Target Version | Breaking? |
|---------|----------------|---------------|-----------|
| `svelte` | `^4.2.19` | `^5.x` | YES -- runes, snippets, new component model |
| `@sveltejs/kit` | `^2.15.2` | `^2.x` (latest) | Minor -- already on SvelteKit 2 |
| `@sveltejs/adapter-node` | `^5.2.11` | `^5.x` (latest) | No |
| `@sveltejs/vite-plugin-svelte` | `^3.1.2` | `^4.x` or `^5.x` | YES -- preprocessor changes |
| `vite` | `^5.4.11` | `^6.x` | YES -- check SvelteKit compatibility |
| `tailwindcss` | `^3.4.17` | `^4.x` | YES -- CSS-first config |
| `daisyui` | `^4.12.23` | `^5.x` | YES -- CSS plugin, class renames |
| `svelte-preprocess` | `^6.0.3` | **REMOVE** | N/A -- no longer needed |
| `autoprefixer` | `^10.4.20` | **REMOVE** | N/A -- Tailwind 4 handles this |
| `postcss` | `^8.4.49` | **REMOVE** | N/A -- using Vite plugin instead |
| `vite-tsconfig-paths` | `^4.3.2` | **REMOVE** | N/A -- SvelteKit handles aliases |
| `svelte-check` | `^3.8.6` | `^4.x` | Minor -- updated for Svelte 5 |
| `svelte-eslint-parser` | `^0.43.0` | Latest | Minor -- Svelte 5 syntax support |
| `eslint-plugin-svelte` | `^2.46.1` | Latest | Minor |
| `sveltekit-i18n` | `^2.4.2` | Evaluate -- see i18n section | Depends on decision |
| `@sveltekit-i18n/parser-icu` | `^1.0.8` | Evaluate | Depends on decision |
| `svelte-visibility-change` | `^0.6.0` | Check Svelte 5 compat | Unknown |
| `@capacitor/*` | `^5.7.x` | Evaluate removal or update | Likely remove if not used |
| `ai` | `^5.0.0` | Keep or evaluate | Known pre-existing build failure |

**Packages to ADD:**
| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/vite` | `^4.x` | Tailwind 4 Vite integration |

**Confidence:** HIGH for core Svelte/Kit/Vite/Tailwind versions. MEDIUM for ecosystem packages (`svelte-visibility-change`, `ai`, Capacitor).

### 5. Turborepo -- No Changes Required

The `turbo.json` configuration is framework-agnostic:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**"],
      "inputs": ["src/**", "tsconfig.json", "package.json"]
    }
  }
}
```

The frontend's `build` script (`svelte-kit sync && vite build`) runs the same way regardless of Svelte version. The `outputs` pattern (`build/**`) matches SvelteKit's output directory. The `inputs` pattern captures source changes.

**One potential addition:** Add `app.css` to inputs if it contains Tailwind theme configuration that was previously in `tailwind.config.mjs` (already covered by `src/**`).

**Confidence:** HIGH

### 6. Docker -- No Changes Required

The `Dockerfile` multi-stage build is framework-agnostic:

1. `base` stage: installs Node 20, Yarn 4.13, runs `yarn install`
2. `shared` stage: runs `yarn build` (builds all packages via Turborepo)
3. `frontend` stage: copies built packages
4. `development` stage: runs `yarn workspace @openvaa/frontend dev --host`
5. `production` stage: runs `yarn workspace @openvaa/frontend build`, then `node ./apps/frontend/build/index.js`

None of these steps reference Svelte versions or Tailwind config. The dev command (`vite dev --host`) and production output (`build/index.js`) remain the same.

The `docker-compose.dev.yml` volume mounts are path-based and do not reference any framework-specific files:
```yaml
volumes:
  - ./:/opt/apps/frontend
  - ../../packages:/opt/packages:ro
  - /opt/apps/frontend/node_modules
  - /opt/apps/frontend/.svelte-kit
  - /opt/apps/frontend/.vite
```

The `.svelte-kit` and `.vite` exclusions remain valid.

**Confidence:** HIGH

### 7. CI/CD Pipeline -- No Changes Required

The GitHub Actions workflow `main.yaml` runs these steps:
1. `yarn install --frozen-lockfile`
2. `yarn build` (Turborepo)
3. `yarn format:check` / `yarn lint:check`
4. `yarn test:unit`
5. `yarn workspace @openvaa/frontend build`

None of these are framework-version-specific. The lint step already uses `eslint --flag v10_config_lookup_from_file` which is ESLint-config-specific, not Svelte-version-specific.

The E2E test pipeline runs `yarn dev:start` (Docker-based) and `yarn test:e2e` (Playwright). Both are framework-agnostic.

**Confidence:** HIGH

### 8. E2E Testing Infrastructure -- Minimal Impact

Playwright tests interact with the running application through the browser. The `playwright.config.ts` references:
- `testDir: TESTS_DIR` (in `tests/` directory, outside `apps/frontend`)
- `baseURL: http://localhost:${FRONTEND_PORT}`
- Various test project definitions with file matchers

None of these are Svelte-version-dependent. Tests use test IDs (`data-testid`) which survive framework migrations.

**Potential issue:** During the infrastructure phase, when no routes or components exist yet, E2E tests will fail. This is expected and acceptable -- they will be re-validated after content migration in the next milestone.

**Confidence:** HIGH

### 9. Path Aliases -- Preserved, Simplified

Current aliases in `svelte.config.js`:
```javascript
alias: {
  $types: path.resolve('./src/lib/types'),
  $voter: path.resolve('./src/lib/voter'),
  $candidate: path.resolve('./src/lib/candidate')
}
```

These are SvelteKit features, not Svelte-version-specific. They work identically in Svelte 5. The only change is simplifying from `path.resolve()` to string paths:

```javascript
alias: {
  $types: 'src/lib/types',
  $voter: 'src/lib/voter',
  $candidate: 'src/lib/candidate'
}
```

The `vitest.config.ts` currently imports both `svelte` and `sveltekit` plugins. For Svelte 5, this needs updating to use the Svelte 5-compatible test setup:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
```

**Confidence:** HIGH

### 10. TypeScript References -- No Changes

The `tsconfig.json` references to workspace packages remain valid:
```json
{
  "references": [
    { "path": "../../packages/app-shared/tsconfig.json" },
    { "path": "../../packages/core/tsconfig.json" }
  ]
}
```

These are monorepo workspace references, not Svelte-version-specific. The `extends` from `@openvaa/shared-config/ts` and `.svelte-kit/tsconfig.json` also remains valid.

**Confidence:** HIGH

---

## i18n Architecture Decision Point

The current i18n uses `sveltekit-i18n` (store-based, runtime key lookup). Two paths forward:

### Option A: Keep sveltekit-i18n (Lower risk, deferred migration)

- `sveltekit-i18n` uses Svelte stores which remain compatible with Svelte 5 (stores are not deprecated)
- The `$t` store pattern works in Svelte 5 unchanged
- The `locale.subscribe()` pattern works unchanged
- No infrastructure changes needed during this milestone
- ICU message format support retained
- Dynamic translation loading from backend retained

**Risk:** `sveltekit-i18n` may not receive active Svelte 5-specific updates. The library works but uses the legacy store API rather than runes.

### Option B: Migrate to Paraglide (Higher reward, higher risk)

- Compiler-based, tree-shakable, type-safe
- Official Svelte ecosystem recommendation (`npx sv add paraglide`)
- Generates functions instead of key-value lookup
- Smaller bundle sizes (up to 70% reduction)

**Risk:** Paraglide is fundamentally different from `sveltekit-i18n`. It uses compiled message functions, not runtime key lookup. The current codebase has:
- ICU message format with complex interpolation
- Dynamic translation loading from the backend (`addTranslations`)
- Runtime locale switching
- Translation key type generation
- Default payload injection

Migrating to Paraglide would require rethinking the entire i18n architecture, not just swapping libraries.

### Recommendation

**Keep `sveltekit-i18n` for the infrastructure milestone.** Evaluate Paraglide as a separate investigation in the content migration milestone. The i18n architecture is deeply integrated (42+ files import from `svelte/store`, the i18n context system, dynamic backend translations) and should not be disrupted during infrastructure work.

**Confidence:** MEDIUM -- `sveltekit-i18n` compatibility with Svelte 5 is based on the fact that Svelte 5 supports stores, but the library's long-term maintenance status is unclear. The evaluation should happen before content migration.

---

## Data Flow Architecture: Stores vs Runes

### Infrastructure Phase Impact: NONE

The infrastructure milestone explicitly defers content migration. Stores continue to work in Svelte 5:
- `writable`, `readable`, `derived` from `svelte/store` are fully supported
- The `$store` auto-subscription syntax works in Svelte 5
- Context API (`setContext`/`getContext`) works unchanged
- `$:` reactive declarations work in Svelte 5 (legacy mode)

### Content Migration Phase Impact: SIGNIFICANT

For the roadmap, the content migration milestone will need to address:

| Pattern | Count | Svelte 5 Equivalent |
|---------|-------|-------------------|
| `export let prop` | 361 occurrences across 100 components | `let { prop } = $props()` |
| `$:` reactive declarations | ~139 occurrences | `$derived()` or `$effect()` |
| `<slot>` | 56 occurrences across 41 components | `{@render children()}` snippets |
| `createEventDispatcher` | 12 occurrences across 6 components | Callback props |
| `on:event` directives | ~297 occurrences across 102 components | `onevent` props |
| `svelte/store` imports | 52 occurrences across 42 files | Can stay (stores work) or migrate to `$state` |

**Key architectural decision for content migration:** The context system (`initAppContext`, `initDataContext`, etc.) uses stores extensively. These can remain as stores in Svelte 5 -- there is no urgency to convert them to runes. The migration tool (`npx sv migrate svelte-5`) handles most mechanical changes but the context architecture should be manually planned.

---

## Replacement-in-Place Strategy

### Step-by-Step Approach

**Phase A: Scaffold Preparation**

1. Archive current frontend config files (Git tracks history, but a reference branch helps)
2. Run `npx sv create` in a temporary directory with options: `--template minimal --types ts`
3. Extract the generated infrastructure files:
   - `svelte.config.js` (minimal, no preprocessor)
   - `vite.config.ts` (with `defineConfig`)
   - `tsconfig.json` (Svelte 5 types)
   - `.svelte-kit/` gitignore pattern

**Phase B: Infrastructure Replacement**

1. Delete from `apps/frontend`: `postcss.config.cjs`, `tailwind.config.mjs`
2. Replace `svelte.config.js` with scaffold version + OpenVAA customizations (aliases, adapter-node, version polling)
3. Replace `vite.config.ts` with scaffold version + `@tailwindcss/vite` + port config
4. Update `package.json` dependencies (see version matrix above)
5. Rewrite `src/app.css` for Tailwind 4 + DaisyUI 5 (CSS-first config)
6. Update `vitest.config.ts` for Svelte 5

**Phase C: Theme Migration**

1. Convert DaisyUI theme colors from hex to oklch
2. Create `@plugin "daisyui/theme"` blocks for light and dark themes
3. Migrate custom spacing/font/border tokens to `@theme {}` block
4. Migrate safelist to `@source inline()` directive
5. Migrate custom `@layer` styles to `@utility` directives
6. Handle dynamic `staticSettings` color integration

**Phase D: Validation**

1. Run `yarn install` to resolve all dependencies
2. Run `svelte-kit sync` to generate types
3. Run `yarn workspace @openvaa/frontend build` -- expect compilation to succeed with no routes
4. Run `yarn workspace @openvaa/frontend dev` -- expect dev server to start
5. Verify Docker build still works
6. Verify CI pipeline passes (with empty frontend)

### Build Order Considering Dependencies

```
1. packages/* (unchanged, build first via Turborepo ^build dependency)
   |
2. apps/frontend infrastructure files (svelte.config.js, vite.config.ts, app.css)
   |
3. apps/frontend package.json (dependency updates)
   |
4. yarn install (resolve new dependency tree)
   |
5. svelte-kit sync (generate Svelte 5 types)
   |
6. vite build (validate build pipeline)
   |
7. Docker build (validate containerized build)
```

The key insight is that **packages do not depend on the frontend's Svelte version**. They export JavaScript/TypeScript that is consumed at build time. The dependency flows one way: `packages/* -> apps/frontend`. Updating the frontend framework version has zero impact on package builds.

---

## Scalability Considerations

| Concern | Current State | After Svelte 5 Infrastructure | After Content Migration |
|---------|--------------|-------------------------------|----------------------|
| Build time | ~45s full build | No change (packages unchanged) | Potentially faster (Svelte 5 compiler improvements) |
| Bundle size | Baseline | No change (no content yet) | Potentially smaller (tree-shakable runes, TW4 smaller CSS) |
| Dev server startup | ~5s | No change | Potentially faster (Vite 6 improvements) |
| Docker image size | Baseline | No change | No change |
| CI pipeline duration | ~5-8 min | No change | No change |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixing Scaffold and Upgrade
**What:** Trying to merge a fresh scaffold with in-place `npx sv migrate` on existing code.
**Why bad:** Creates conflicting config -- the migration tool assumes existing Svelte 4 infrastructure, the scaffold assumes a clean start.
**Instead:** Do the scaffold for infrastructure files, defer content migration to the next milestone where `npx sv migrate svelte-5` can be run on the actual component code.

### Anti-Pattern 2: Migrating i18n During Infrastructure Phase
**What:** Switching from `sveltekit-i18n` to Paraglide while also changing the build tooling.
**Why bad:** Two major changes at once make debugging impossible. The i18n system touches 42+ files and the context architecture.
**Instead:** Keep `sveltekit-i18n` during infrastructure. Evaluate Paraglide separately.

### Anti-Pattern 3: Using `@config` to Keep JS Tailwind Config
**What:** Adding `@config "../../tailwind.config.mjs"` to `app.css` to avoid migrating to CSS-first.
**Why bad:** Defeats the purpose of the Tailwind 4 upgrade. The JS config is a legacy compatibility layer, not a long-term strategy. DaisyUI 5 expects CSS-first configuration.
**Instead:** Fully migrate to CSS-first `@theme` configuration.

### Anti-Pattern 4: Converting All Stores to Runes During Infrastructure
**What:** Rewriting context stores from `writable`/`derived` to `$state`/`$derived` while replacing build config.
**Why bad:** Stores work perfectly in Svelte 5. Converting them is content migration work, not infrastructure work.
**Instead:** Leave stores as-is. Address in the content migration milestone.

### Anti-Pattern 5: Removing `preserveSymlinks` Without Testing
**What:** Dropping `preserveSymlinks: true` from vite config and tsconfig without verifying monorepo resolution.
**Why bad:** This setting exists because of workspace package resolution. Removing it without testing can cause "module not found" errors.
**Instead:** Test without it, but have it ready to add back if workspace resolution breaks.

---

## Files to Create/Delete/Modify Summary

### CREATE (new files)
None -- the scaffold files replace existing ones.

### DELETE
| File | Reason |
|------|--------|
| `apps/frontend/postcss.config.cjs` | Tailwind 4 uses Vite plugin, not PostCSS |
| `apps/frontend/tailwind.config.mjs` | Tailwind 4 uses CSS-first `@theme` in `app.css` |

### MODIFY (significant changes)
| File | Nature of Change |
|------|-----------------|
| `apps/frontend/svelte.config.js` | Remove preprocessor, simplify aliases |
| `apps/frontend/vite.config.ts` | Add `@tailwindcss/vite`, remove `vite-tsconfig-paths` |
| `apps/frontend/src/app.css` | Complete rewrite for TW4 + DaisyUI 5 |
| `apps/frontend/package.json` | Major dependency version updates |
| `apps/frontend/vitest.config.ts` | Update for Svelte 5 test plugins |

### UNCHANGED (verified no impact)
| File/Area | Verified |
|-----------|----------|
| `turbo.json` | Framework-agnostic task definitions |
| `docker-compose.dev.yml` | Path-based volume mounts |
| `apps/frontend/docker-compose.dev.yml` | Service definition unchanged |
| `apps/frontend/Dockerfile` | Multi-stage build unchanged |
| `.github/workflows/main.yaml` | Yarn workspace commands unchanged |
| `tests/playwright.config.ts` | Browser-based testing unchanged |
| `apps/frontend/tsconfig.json` | Minor updates only (if needed) |
| `apps/frontend/src/app.html` | Template compatible as-is |
| `apps/frontend/src/app.d.ts` | Type definitions unchanged at infra level |
| All `packages/*` | No Svelte dependency |
| `apps/strapi/*` | Independent of frontend framework |

---

## Sources

- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Migrating to SvelteKit v2](https://svelte.dev/docs/kit/migrating-to-sveltekit-2)
- [sv create documentation](https://svelte.dev/docs/cli/sv-create)
- [sv migrate documentation](https://svelte.dev/docs/cli/sv-migrate)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Install Tailwind CSS with SvelteKit](https://tailwindcss.com/docs/guides/sveltekit)
- [DaisyUI 5 upgrade guide](https://daisyui.com/docs/upgrade/?lang=en)
- [DaisyUI 5 SvelteKit installation](https://daisyui.com/docs/install/sveltekit/)
- [DaisyUI 5 themes documentation](https://daisyui.com/docs/themes/)
- [DaisyUI 5 release notes](https://daisyui.com/docs/v5/?lang=en)
- [@sveltejs/vite-plugin-svelte](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte)
- [Paraglide for SvelteKit](https://svelte.dev/docs/cli/paraglide)
- [Refactoring Svelte stores to $state runes](https://www.loopwerk.io/articles/2025/svelte-5-stores/)
- [Global state in Svelte 5: do's and don'ts](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/)

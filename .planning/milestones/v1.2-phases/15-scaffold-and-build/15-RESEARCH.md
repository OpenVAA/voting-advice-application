# Phase 15: Scaffold and Build - Research

**Researched:** 2026-03-15
**Domain:** SvelteKit 2 + Svelte 5 scaffold, Tailwind CSS 4 Vite plugin, build configuration
**Confidence:** HIGH

## Summary

This phase replaces the frontend build configuration with a fresh SvelteKit 2 + Svelte 5 scaffold while preserving the existing `src/` directory and all application code. The research confirms a clean upgrade path: stay on Vite 5, upgrade `@sveltejs/vite-plugin-svelte` from 3.x to 4.x (which requires Svelte 5), and replace the PostCSS-based Tailwind pipeline with `@tailwindcss/vite`. Svelte 5 is almost fully backward-compatible with Svelte 4 syntax -- `export let`, `$:`, `<slot>`, and `on:event` all still work with deprecation warnings but no compilation errors in the vast majority of cases.

The most complex aspect is the Tailwind 4 transition. While `@config` loads JS config files including plugins (DaisyUI 4 will continue to work), the `safelist` option is NOT supported in Tailwind v4. Safelisted classes must be migrated to the `@source inline()` CSS directive. Additionally, components using `<style lang="postcss">` with `@apply` directives will need `@reference "tailwindcss"` added to their style blocks for `@apply` to resolve Tailwind utilities.

**Primary recommendation:** Upgrade to Svelte 5 + vite-plugin-svelte 4.x on Vite 5, use `@tailwindcss/vite` plugin with `@config` bridge for existing tailwind.config.mjs, and migrate safelist to `@source inline()` in the new app.css.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Generate fresh SvelteKit 2 + Svelte 5 scaffold via `npx sv create` in a temp directory
- Copy config files into apps/frontend/: svelte.config.js, vite.config.ts, tsconfig.json, app.html, app.d.ts
- Remove obsolete files: postcss.config.cjs, svelte-preprocess references
- Keep entire src/ directory untouched
- Start from fresh scaffold's app.html template, re-add custom elements (Google Fonts link, meta tags, `lang` attribute)
- Phase 15 touches only scaffold-related deps: svelte (4->5), @sveltejs/kit, @sveltejs/vite-plugin-svelte, svelte-check
- Remove: svelte-preprocess, autoprefixer
- Try without vite-tsconfig-paths first; add back if workspace @openvaa/* imports break
- Install Tailwind 4 with @tailwindcss/vite plugin (satisfies SCAF-03)
- Remove postcss.config.cjs and autoprefixer dep
- Use `@config './tailwind.config.mjs'` directive to keep existing JS config working temporarily
- Keep DaisyUI 4.12 -- it works through the @config compat bridge
- Preserve entire safelist as-is through @config bridge
- Phase 16 does the full CSS-first migration, DaisyUI 5 upgrade, and removes tailwind.config.mjs
- Start fresh: new app.css with `@import 'tailwindcss'` and `@config` directive
- Leave Svelte 5 deprecation warnings visible
- Fix minimal compilation blockers (<5 files) with simplest Svelte 5-compatible equivalent
- If >5 files need fixing, stop and flag as risk for replanning
- Both `vite dev` and `vite build` (adapter-node) must succeed
- Vitest must still run (pre-existing test failures OK, config failures not OK)
- Docker, CI, and E2E are Phase 19

### Claude's Discretion
- Verification depth for Svelte 4 compat (dev server check vs route rendering vs unit tests)
- Whether workspace import resolution needs explicit testing beyond dev server startup
- Exact vitest config adjustments for Svelte 5
- Whether vite-tsconfig-paths is needed (try without, judge results)

### Deferred Ideas (OUT OF SCOPE)
- Shared-config optimization (review whether @openvaa/shared-config can be simplified)
- tailwind-merge utility (rewrite concatClasses paradigm -- deferred to v1.3)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-01 | Frontend uses Svelte 5 + SvelteKit 2 (latest) with fresh scaffold configuration | Version matrix confirmed: svelte@5.53.12 + @sveltejs/kit@2.55.0 + @sveltejs/vite-plugin-svelte@4.0.4 + vite@5.x. Use `npx sv create` to generate scaffold. |
| SCAF-02 | `svelte.config.js` uses native TypeScript support (no svelte-preprocess) | Svelte 5 handles TypeScript natively. No preprocess array needed unless advanced TS features (enum, decorators) are used. Remove svelte-preprocess dependency entirely. |
| SCAF-03 | `vite.config.ts` uses `@tailwindcss/vite` plugin (no PostCSS pipeline) | `@tailwindcss/vite@4.2.1` supports Vite 5+. Add as plugin before `sveltekit()`. Remove postcss.config.cjs and autoprefixer. |
| SCAF-04 | Path aliases ($types, $voter, $candidate) preserved in new config | Carry forward `kit.alias` config from current svelte.config.js. These are SvelteKit-native, not dependent on preprocessor. |
| SCAF-05 | adapter-node configured for production builds | `@sveltejs/adapter-node@5.5.4` (latest) requires `@sveltejs/kit@^2.4.0`. Already configured in current setup, carry forward. |
| SCAF-06 | Existing Svelte 4 component syntax compiles and runs without changes | Svelte 5 is almost fully backward-compatible. 361 `export let` across 100 files, 163 `on:event` across 74 files, 140 `$:` across 80 files -- all produce deprecation warnings but compile. Only known hard breaking change: invalid HTML nesting (e.g., `<div>` inside `<p>`) and `<svelte:component>` with `on:` handlers (1 instance found). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | ^5.53.12 | UI compiler | Target of this migration; backward-compat with Svelte 4 syntax |
| @sveltejs/kit | ^2.55.0 | Application framework | Latest SvelteKit 2; supports Svelte 4+5, Vite 5+6 |
| @sveltejs/vite-plugin-svelte | ^4.0.4 | Vite integration | v4.x requires Svelte 5 + Vite 5 (our target) |
| @sveltejs/adapter-node | ^5.5.4 | Production adapter | Already in use; latest v5 compatible |
| vite | ^5.4.11 | Build tool | Keep current major; upgrading Vite is out of scope |
| tailwindcss | ^4.2.1 | CSS framework | v4 with CSS-first config, @config bridge for v3 compat |
| @tailwindcss/vite | ^4.2.1 | Vite plugin for Tailwind | Replaces PostCSS pipeline entirely |
| svelte-check | ^4.4.5 | Type/syntax checker | v4.x required for Svelte 5 |
| daisyui | ^4.12.24 | UI component library | Keep v4.12.x; loaded via @config bridge plugin array |

### Supporting (Keep Existing)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | (catalog) | Unit testing | Existing config; may need minor adjustments |
| typescript | (catalog) | Type checking | Shared via @openvaa/shared-config |

### Remove
| Library | Reason |
|---------|--------|
| svelte-preprocess | Svelte 5 handles TypeScript natively; PostCSS via @tailwindcss/vite |
| autoprefixer | Not needed with Tailwind 4 Vite plugin |
| postcss | Not needed as standalone dep when using @tailwindcss/vite |
| @sveltejs/adapter-auto | Not used (adapter-node is the target) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite 5 + vite-plugin-svelte 4 | Vite 6 + vite-plugin-svelte 5/6 | Vite 6 upgrade is out of scope (Phase 18); keeping Vite 5 minimizes risk |
| @tailwindcss/vite | PostCSS pipeline | @tailwindcss/vite is the modern approach; PostCSS is legacy for TW4 |
| @config bridge | Full CSS-first migration | @config bridge is the right choice for Phase 15; full migration is Phase 16 |

## Architecture Patterns

### Version Compatibility Matrix
```
@sveltejs/kit@2.55.0
  requires: svelte@^4.0.0||^5.0.0  vite@^5.0.3||^6.0.0  @sveltejs/vite-plugin-svelte@^3||^4||^5||^6||^7

@sveltejs/vite-plugin-svelte@4.0.4
  requires: svelte@^5.0.0  vite@^5.0.0

@tailwindcss/vite@4.2.1
  requires: vite@^5.2.0||^6||^7

CHOSEN: Vite 5 + vite-plugin-svelte 4.x + Svelte 5 + @tailwindcss/vite
```

### New svelte.config.js Pattern
```javascript
// Source: https://svelte.dev/docs/kit/configuration + current project aliases
import adapter from '@sveltejs/adapter-node';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // No preprocess array needed -- Svelte 5 handles TypeScript natively
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

export default config;
```

### New vite.config.ts Pattern
```typescript
// Source: https://tailwindcss.com/docs/guides/sveltekit + current project config
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [
    tailwindcss(),  // MUST be before sveltekit()
    sveltekit()
  ],
  resolve: {
    preserveSymlinks: true  // Keep for monorepo workspace resolution
  },
  server: {
    port: Number(process.env.FRONTEND_PORT)
  }
};

export default config;
```
**Note:** Start WITHOUT `vite-tsconfig-paths`. The `preserveSymlinks: true` option plus SvelteKit's native module resolution should handle workspace `@openvaa/*` imports. Add `vite-tsconfig-paths` back only if workspace imports break.

### New app.css Pattern
```css
/* Source: https://tailwindcss.com/docs/functions-and-directives */
@import "tailwindcss";
@config "./tailwind.config.mjs";

/* Safelist: migrated from tailwind.config.mjs safelist array */
/* @source inline() replaces safelist which is NOT supported via @config in TW4 */
@source inline("btn-{current,primary,secondary,accent,neutral,base-100,base-200,base-300,info,success,warning,error,base-content,primary-content,secondary-content,accent-content,info-content,success-content,warning-content,error-content,white}");
@source inline("bg-{current,primary,secondary,accent,neutral,base-100,base-200,base-300,info,success,warning,error,base-content,primary-content,secondary-content,accent-content,info-content,success-content,warning-content,error-content,white}");
@source inline("fill-{current,primary,secondary,accent,neutral,base-100,base-200,base-300,info,success,warning,error,base-content,primary-content,secondary-content,accent-content,info-content,success-content,warning-content,error-content,white}");
@source inline("{dark:}fill-{current,primary,secondary,accent,neutral,base-100,base-200,base-300,info,success,warning,error,base-content,primary-content,secondary-content,accent-content,info-content,success-content,warning-content,error-content,white}");
@source inline("text-{current,primary,secondary,accent,neutral,base-100,base-200,base-300,info,success,warning,error,base-content,primary-content,secondary-content,accent-content,info-content,success-content,warning-content,error-content,white}");

/* Re-add global styles from previous app.css */
@layer base {
  /* ... existing base layer styles ... */
}

@layer components {
  /* ... existing component layer styles ... */
}

@layer utilities {
  /* ... existing utility layer styles ... */
}
```

### New app.html Pattern
```html
<!doctype html>
<html lang="%lang%">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    %sveltekit.head%
  </head>
  <body>
    <div class="flex min-h-screen flex-col items-center">%sveltekit.body%</div>
  </body>
</html>
```
**Note:** The `%lang%` placeholder is custom to this project -- it is replaced at runtime by `hooks.server.ts` via `transformPageChunk`. A fresh SvelteKit scaffold uses `lang="en"`. Must preserve `%lang%`.

### Style Blocks with @apply (21 files affected)
Components using `<style lang="postcss">` with `@apply` directives need `@reference "tailwindcss"` added:
```svelte
<style lang="postcss">
  @reference "tailwindcss";
  .my-class {
    @apply bg-primary text-white;
  }
</style>
```
There are 21 files with `<style lang="postcss">`. Without `@reference`, `@apply` will fail to resolve Tailwind utilities because Svelte's `<style>` blocks are processed separately from the main CSS. The `@reference "tailwindcss"` directive makes the full Tailwind config available without actually emitting CSS.

### vitest.config.ts Adjustments
```typescript
// Source: https://testing-library.com/docs/svelte-testing-library/setup/
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
```
**Note:** Remove `sveltekit()` import from vitest config -- it was incorrectly used alongside `svelte()`. The vitest config should only use the base `svelte()` plugin. The `@sveltejs/vite-plugin-svelte` v4.x auto-detects Svelte 5.

### Anti-Patterns to Avoid
- **Do NOT upgrade to Vite 6/7:** This phase targets Vite 5 stability. Vite upgrades belong in Phase 18 (Dependencies).
- **Do NOT migrate any Svelte 4 syntax to Svelte 5 runes:** Content migration is deferred to v1.3. Only fix hard compilation blockers.
- **Do NOT use `@plugin "daisyui"` in CSS:** That is the DaisyUI 5 pattern. DaisyUI 4 is loaded via `plugins: [daisyui]` in tailwind.config.mjs, which is picked up by the `@config` bridge.
- **Do NOT convert `@tailwind base/components/utilities` manually:** Replace the entire file with `@import "tailwindcss"` + `@config` + `@source inline()`.
- **Do NOT remove `lang="postcss"` from style blocks:** It is still valid and signals Vite to process these blocks through the CSS pipeline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safelist migration | Manual class list in CSS comments | `@source inline()` with brace expansion | Official TW4 replacement for safelist; supports variant syntax |
| PostCSS pipeline | Custom PostCSS config | `@tailwindcss/vite` plugin | One plugin replaces postcss.config.cjs + autoprefixer + postcss dep |
| TypeScript preprocessing | vitePreprocess or svelte-preprocess | Svelte 5 native TS support | Svelte 5 understands TypeScript natively; no preprocessor needed |
| Scaffold generation | Manual config file creation | `npx sv create` in temp dir | Gets correct boilerplate for current versions; avoids missed config keys |

**Key insight:** The scaffold generation via `npx sv create` ensures we get the exact config file structure that the current SvelteKit version expects. Hand-writing configs risks missing new required fields or using deprecated patterns.

## Common Pitfalls

### Pitfall 1: Safelist Silently Ignored
**What goes wrong:** The `safelist` array in tailwind.config.mjs is silently ignored by Tailwind 4's `@config` bridge. Dynamic color classes (`btn-${color}`, `bg-${color}`) disappear from the CSS output, causing invisible styling regressions.
**Why it happens:** Tailwind 4 explicitly does not support `safelist`, `corePlugins`, or `separator` from JavaScript config files.
**How to avoid:** Migrate all safelisted classes to `@source inline()` directives in app.css. Use brace expansion to keep it concise.
**Warning signs:** DaisyUI themed buttons losing their colors; dynamic class-based styling appearing broken.

### Pitfall 2: @apply Fails in Component Style Blocks
**What goes wrong:** Components with `<style lang="postcss">` using `@apply` fail because Tailwind utilities are not available in scoped style blocks by default in v4.
**Why it happens:** Svelte `<style>` blocks are processed as CSS Modules by the build tooling, isolated from the main Tailwind CSS context.
**How to avoid:** Add `@reference "tailwindcss"` at the top of every `<style lang="postcss">` block that uses `@apply`. There are 21 such files.
**Warning signs:** Build warnings about unknown utilities; missing styles on components that use scoped `@apply`.

### Pitfall 3: @config Placement in app.css
**What goes wrong:** The `@config` directive must come AFTER `@import "tailwindcss"` (contrary to some forum posts suggesting it goes before). If placed incorrectly, the config is not applied.
**Why it happens:** Tailwind 4 processes directives in order; `@import "tailwindcss"` must be first.
**How to avoid:** Always structure app.css as: `@import "tailwindcss"` then `@config` then `@source inline()` then custom styles.
**Warning signs:** Theme colors not applying; DaisyUI components unstyled.

### Pitfall 4: vite-tsconfig-paths Removal Breaks Workspace Imports
**What goes wrong:** Removing `vite-tsconfig-paths` may cause `@openvaa/*` workspace package imports to fail resolution at runtime.
**Why it happens:** The monorepo uses `workspace:^` dependencies and TypeScript project references. While Vite handles `preserveSymlinks`, the paths from tsconfig may not be resolved without explicit help.
**How to avoid:** Try without `vite-tsconfig-paths` first. If dev server shows module resolution errors for `@openvaa/*` packages, add it back. Test by running `vite dev` and checking import resolution.
**Warning signs:** `Cannot find module '@openvaa/app-shared'` errors at dev server startup.

### Pitfall 5: svelte:component with on: Handler
**What goes wrong:** One instance in `+layout.svelte` uses `<svelte:component this={VisibilityChange.default} on:hidden={() => submitAllEvents()} />`. The `on:` directive on `<svelte:component>` may cause issues in Svelte 5 if the component doesn't dispatch that event in a way compatible with Svelte 5's event system.
**Why it happens:** `on:` directives still work in Svelte 5 legacy mode, but `<svelte:component>` with `on:` can be problematic if the dynamic component uses Svelte 5 internals.
**How to avoid:** This specific case likely still works in Svelte 5 compat mode. Monitor for runtime errors. If it breaks, it counts toward the <5 files budget.
**Warning signs:** Console errors about event handlers; `on:hidden` callback never firing.

### Pitfall 6: tsconfig.json Extends Chain
**What goes wrong:** The frontend tsconfig.json extends both `@openvaa/shared-config/ts` and `.svelte-kit/tsconfig.json`. A fresh scaffold may generate a different tsconfig structure that conflicts.
**Why it happens:** `npx sv create` generates its own tsconfig.json that may not account for the monorepo's shared config pattern.
**How to avoid:** Do NOT blindly copy the scaffold's tsconfig.json. Instead, update the existing tsconfig.json to be compatible with Svelte 5's generated `.svelte-kit/tsconfig.json`. The key requirement is that `extends` includes the SvelteKit-generated config.
**Warning signs:** TypeScript errors about missing Svelte types; IDE resolution failures.

## Code Examples

### Generating the Scaffold
```bash
# Source: https://svelte.dev/docs/cli/sv-create
# Create scaffold in temp directory to extract config files
cd /tmp
npx sv create scaffold-temp --template minimal --types ts --no-add-ons --no-install
# Copy needed config files
cp scaffold-temp/svelte.config.js apps/frontend/svelte.config.js.scaffold
cp scaffold-temp/vite.config.ts apps/frontend/vite.config.ts.scaffold
# Then manually merge with project-specific settings
```

### @source inline() Brace Expansion for Safelist
```css
/* Source: https://tailwindcss.com/docs/detecting-classes-in-source-files */
/* Generate btn-primary, btn-secondary, etc. for all color names */
@source inline("btn-{current,primary,secondary,accent,neutral,base-100,base-200,base-300,info,success,warning,error,base-content,primary-content,secondary-content,accent-content,info-content,success-content,warning-content,error-content,white}");
```

### Adding @reference to Style Blocks
```svelte
<!-- Before (Svelte 4 + svelte-preprocess + postcss.config.cjs) -->
<style lang="postcss">
  .top-bar {
    @apply min-h-0;
  }
</style>

<!-- After (Svelte 5 + @tailwindcss/vite) -->
<style lang="postcss">
  @reference "tailwindcss";
  .top-bar {
    @apply min-h-0;
  }
</style>
```

### Checking for Compilation Blockers
```bash
# After updating deps, try compiling
cd apps/frontend
npx vite build 2>&1 | head -100
# Look for:
# - CompileError (hard failures, not deprecation warnings)
# - Invalid HTML nesting errors
# - Module resolution failures
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| svelte-preprocess for TypeScript | Native TS in Svelte 5 | Svelte 5.0 (Oct 2024) | Remove svelte-preprocess dependency entirely |
| postcss.config.cjs + autoprefixer | @tailwindcss/vite plugin | Tailwind 4.0 (Jan 2025) | Remove postcss and autoprefixer deps |
| tailwind.config.js auto-detection | @config directive or CSS-first | Tailwind 4.0 (Jan 2025) | Must explicitly reference config via @config |
| safelist in JS config | @source inline() in CSS | Tailwind 4.0 (Jan 2025) | Safelist option silently ignored via @config |
| @tailwind base/components/utilities | @import "tailwindcss" | Tailwind 4.0 (Jan 2025) | Single import replaces three directives |
| svelte-check@3.x | svelte-check@4.x | Svelte 5.0 | Must upgrade for Svelte 5 compatibility |
| @sveltejs/vite-plugin-svelte@3.x | @sveltejs/vite-plugin-svelte@4.x | Svelte 5.0 | v4.x requires Svelte 5, stays on Vite 5 |

**Deprecated/outdated:**
- `svelte-preprocess`: Maintained but unnecessary with Svelte 5 native TS support
- `postcss.config.cjs`: Replaced by @tailwindcss/vite for Tailwind projects
- `@tailwind base/components/utilities` directives: Replaced by `@import "tailwindcss"`
- `safelist` in tailwind.config.js: Not supported in Tailwind v4 -- use `@source inline()`

## Open Questions

1. **Does DaisyUI 4 fully work via @config bridge in Tailwind 4?**
   - What we know: The `@config` directive loads JS config including plugins. DaisyUI 4 is a standard TW3 plugin. Multiple sources confirm @config supports plugins.
   - What's unclear: No first-hand verified report of DaisyUI 4 specifically working via @config (most community reports discuss DaisyUI 5 with @plugin). DaisyUI 4 uses the `addBase` plugin API to inject CSS variables for themes.
   - Recommendation: This should work because @config supports the v3 plugin API. Verify during implementation by checking that DaisyUI theme colors are applied. If DaisyUI 4 fails, use `@plugin "daisyui"` directly in CSS as fallback (DaisyUI 4 may also work with `@plugin`).

2. **Will removing vite-tsconfig-paths break workspace imports?**
   - What we know: SvelteKit uses `preserveSymlinks` and Yarn workspace resolution. The `workspace:^` protocol resolves at install time.
   - What's unclear: Whether all `@openvaa/*` imports resolve correctly without `vite-tsconfig-paths` at runtime.
   - Recommendation: Try without it first. Test by running `vite dev` and navigating to a page that imports from `@openvaa/app-shared`. If it fails, re-add `vite-tsconfig-paths`.

3. **How many Svelte 5 hard compilation errors will there be?**
   - What we know: 361 `export let`, 163 `on:event`, 140 `$:` usages -- all deprecated but compile. 21 `<style lang="postcss">` files need @reference. 6 files use `createEventDispatcher`. 1 file uses `<svelte:component>` with `on:` handler.
   - What's unclear: Whether any HTML nesting violations exist (e.g., `<div>` inside `<p>`, `<button>` inside `<button>`). These would be hard errors.
   - Recommendation: Run `vite build` first and examine only CompileError outputs. The <5 files budget should be sufficient based on the codebase analysis.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.x (from yarn catalog) |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` (all workspaces) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAF-01 | Svelte 5 dev server starts | smoke | `cd apps/frontend && npx vite dev --port 5199 &; sleep 5; curl -s http://localhost:5199 > /dev/null && echo OK; kill %1` | N/A (manual check) |
| SCAF-02 | No svelte-preprocess in config | unit | `! grep -r 'svelte-preprocess' apps/frontend/svelte.config.js` | N/A (grep check) |
| SCAF-03 | @tailwindcss/vite in vite config | unit | `grep '@tailwindcss/vite' apps/frontend/vite.config.ts` | N/A (grep check) |
| SCAF-04 | Path aliases resolve | smoke | `cd apps/frontend && npx vite build 2>&1 \| grep -i 'alias\|resolve' \| head -5` | N/A (build check) |
| SCAF-05 | adapter-node build succeeds | integration | `yarn workspace @openvaa/frontend build` | N/A (build command) |
| SCAF-06 | Svelte 4 components compile | integration | `yarn workspace @openvaa/frontend build 2>&1 \| grep -c 'CompileError'` | N/A (build check) |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` (vitest still runs)
- **Per wave merge:** `yarn workspace @openvaa/frontend build` (production build succeeds)
- **Phase gate:** Dev server starts + production build completes + vitest config works

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. The validation is primarily build-based (dev server + production build) rather than unit test-based.

## Sources

### Primary (HIGH confidence)
- npm registry -- package versions and peer dependencies for svelte, @sveltejs/kit, @sveltejs/vite-plugin-svelte, @tailwindcss/vite, svelte-check, adapter-node (verified via `npm view`)
- [Tailwind CSS Functions and Directives](https://tailwindcss.com/docs/functions-and-directives) -- @config, @plugin, @source inline() documentation
- [Tailwind CSS SvelteKit Installation Guide](https://tailwindcss.com/docs/guides/sveltekit) -- official setup steps, @reference usage
- [Tailwind CSS Detecting Classes in Source Files](https://tailwindcss.com/docs/detecting-classes-in-source-files) -- @source inline() syntax and brace expansion
- [Tailwind CSS Compatibility](https://tailwindcss.com/docs/compatibility) -- Svelte style block isolation, @reference requirement

### Secondary (MEDIUM confidence)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- backward compatibility, breaking changes
- [SvelteKit Creating a Project](https://svelte.dev/docs/kit/creating-a-project) -- sv create documentation
- [Svelte TypeScript Docs](https://svelte.dev/docs/svelte/typescript) -- native TS support in Svelte 5
- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) -- @config limitations (safelist, corePlugins, separator not supported)
- [Setting Up Tailwind CSS v4 in SvelteKit](https://dev.to/fedor-pasynkov/setting-up-tailwind-css-v4-in-sveltekit-the-vite-plugin-way-a-guide-based-on-real-issues-380n) -- real-world setup issues

### Tertiary (LOW confidence)
- [Tailwind CSS v4 @config Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/16803) -- community reports on @config placement
- [DaisyUI + Tailwind v4 Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15828) -- community reports on DaisyUI v4/v5 with TW4
- [Tailwind CSS v4 Plugins Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/13292) -- plugin loading patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry with peer dependency checks
- Architecture: HIGH -- config patterns derived from official docs + current project analysis
- Pitfalls: HIGH -- safelist limitation confirmed by official docs; @reference requirement confirmed by official compatibility docs; codebase analysis quantified affected files
- Svelte 4 compat: MEDIUM -- backward compatibility is well-documented but HTML nesting violations are hard to predict without a build attempt

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable ecosystem; versions unlikely to break within 30 days)

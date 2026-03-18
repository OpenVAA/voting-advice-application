# Domain Pitfalls: Svelte 5 Frontend Migration Infrastructure

**Domain:** Svelte 4 to Svelte 5 monorepo frontend migration with Tailwind 4 + DaisyUI 5
**Researched:** 2026-03-15

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Dynamic Color System Breaks with CSS-First Tailwind 4
**What goes wrong:** The current `tailwind.config.mjs` reads colors from `@openvaa/app-shared`'s `staticSettings` at build time using a `getColor()` function. Tailwind 4's CSS-first configuration does not support JavaScript imports or runtime logic in `@theme {}` blocks.
**Why it happens:** Tailwind 4 fundamentally changes how configuration works -- from a JavaScript module to CSS declarations. There is no place to call `staticSettings.colors?.light?.primary`.
**Consequences:** If not addressed, all per-deployment theme colors (primary, secondary, accent, neutral, base, warning, error) revert to hardcoded defaults, breaking the customization model.
**Prevention:** Implement CSS custom property override strategy: define defaults in the CSS theme, then override from `staticSettings` at runtime in the root `+layout.svelte` using `<svelte:head>` or inline styles. DaisyUI 5 themes are CSS-variable-based, making this viable.
**Detection:** Theme colors not matching `staticSettings` values after migration. Build succeeds but colors are wrong.

### Pitfall 2: DaisyUI 5 Class Renames Break Existing Templates
**What goes wrong:** DaisyUI 5 renamed many component modifier classes. Examples: `card-bordered` to `card-border`, `tabs-bordered` to `tabs-border`, avatar `online`/`offline` to `avatar-online`/`avatar-offline`, menu `disabled`/`active` to `menu-disabled`/`menu-active`, `bottom-nav` to `dock`, `form-control` removed entirely.
**Why it happens:** DaisyUI 5 adopted a consistent `component-modifier` naming convention.
**Consequences:** Components that use renamed classes silently lose their styling. No build error -- the classes just do nothing.
**Prevention:** Run a systematic search-and-replace for all renamed classes before content migration. The DaisyUI upgrade guide provides the complete rename list. Even during infrastructure, the `app.css` custom component overrides (`.btn-ghost`, `.checkbox`, `.select`, `.divider`) must be checked against DaisyUI 5's new defaults.
**Detection:** Visual regression in component styling. Use E2E screenshot comparison tests after content migration.

### Pitfall 3: Tailwind 4 Default Changes Silently Alter Appearance
**What goes wrong:** Tailwind 4 changed several defaults: border color (gray-200 to currentColor), ring width (3px to 1px), ring color (blue-500 to currentColor), gradient syntax (`bg-gradient-to-*` changes). These apply globally without any build warning.
**Why it happens:** Tailwind 4 adopted more sensible defaults, but they differ from v3.
**Consequences:** Subtle visual changes across the entire UI. Borders appear differently, focus rings change, gradients may break.
**Prevention:** During the CSS migration, audit all border/ring/gradient usage. The Tailwind upgrade tool (`npx @tailwindcss/upgrade`) handles some of these, but manual review is needed for the custom app.css styles and any DaisyUI theme overrides.
**Detection:** Side-by-side visual comparison of key pages before and after migration.

### Pitfall 4: Mixing Infrastructure and Content Migration
**What goes wrong:** Attempting to convert component syntax (runes, snippets, event handlers) while simultaneously replacing build tooling.
**Why it happens:** Natural temptation to "do it all at once" when touching the frontend.
**Consequences:** When something breaks, impossible to determine if it is a config issue or a syntax migration issue. Debugging complexity multiplies.
**Prevention:** Strict phase separation: infrastructure milestone changes only config files and dependencies. Content migration is a separate milestone. The project plan already makes this distinction -- enforce it.
**Detection:** PR scope creep -- if a PR in the infrastructure milestone modifies .svelte files (beyond app.css import), it is crossing boundaries.

## Moderate Pitfalls

### Pitfall 5: `preserveSymlinks` Removal Breaks Workspace Resolution
**What goes wrong:** The current `vite.config.ts` and `tsconfig.json` both set `preserveSymlinks: true`. This exists because Yarn workspaces use symlinks for `workspace:^` dependencies. Removing it without testing can cause "module not found" errors for `@openvaa/*` packages.
**Prevention:** Test the build with `preserveSymlinks` removed. If it fails, add it back. Modern Vite (5+) handles workspace symlinks better, so it may no longer be needed. Keep it available as a fallback.

### Pitfall 6: Safelist Migration to @source inline()
**What goes wrong:** The current config safelists hundreds of dynamic color classes (`btn-${color}`, `bg-${color}`, `fill-${color}`, etc.) because they are constructed dynamically in components. Tailwind 4 replaced the `safelist` option with `@source inline()`.
**Prevention:** Migrate the safelist to `@source inline(...)` in `app.css`. However, evaluate whether DaisyUI 5's color system handles this differently -- if DaisyUI 5 generates these classes on its own, the safelist may be unnecessary.

### Pitfall 7: `@layer` to `@utility` Migration in app.css
**What goes wrong:** The current `app.css` uses `@layer base`, `@layer components`, and `@layer utilities` for custom styles. Tailwind 4 uses native CSS cascade layers and the `@utility` directive. Blindly converting `@layer utilities { .foo { ... } }` to `@utility foo { ... }` can change specificity behavior.
**Prevention:** Understand the specificity difference: `@utility` styles are sorted by property count and always override-able by Tailwind utilities. `@layer components` custom styles in the current app.css (`.list-circled`, `.faded`, `.prose`, `.small-label`, `.tag`, etc.) should remain as regular CSS or use `@utility` depending on whether they should participate in Tailwind's specificity system.

### Pitfall 8: svelte-check Version Mismatch
**What goes wrong:** `svelte-check@3` does not understand Svelte 5 syntax. If not updated to v4, type checking fails on any file using runes.
**Prevention:** Update `svelte-check` to `^4.x` as part of the dependency updates. During infrastructure (no runes yet), v3 may still work, but update proactively to avoid issues when content migration begins.

### Pitfall 9: Vite Version Compatibility with SvelteKit
**What goes wrong:** SvelteKit pins Vite as a peer dependency. Installing Vite 6 when SvelteKit requires Vite 5 (or vice versa) causes build failures.
**Prevention:** Check SvelteKit's peer dependency requirements before updating Vite. The latest SvelteKit 2 may support Vite 6 -- verify against the official SvelteKit changelog.

### Pitfall 10: `app.css` Import Location Change
**What goes wrong:** The current root layout (`+layout.svelte`) imports `../../app.css`. In Tailwind 4 with the Vite plugin, CSS processing may behave differently depending on whether the CSS is imported in a component or registered as a Vite entry.
**Prevention:** Keep the same import pattern initially. If Tailwind processing issues occur, try importing in `+layout.ts` or registering the CSS in `vite.config.ts` instead.

## Minor Pitfalls

### Pitfall 11: `svelte-visibility-change` Package Compatibility
**What goes wrong:** The `svelte-visibility-change@0.6.0` package uses Svelte 4 component syntax. If not compatible with Svelte 5, the analytics visibility tracking breaks.
**Prevention:** Check for a Svelte 5-compatible version. If none exists, replace with a simple `$effect` that listens to `document.visibilitychange` (trivial to implement).

### Pitfall 12: Capacitor Dependencies Causing Warnings
**What goes wrong:** `@capacitor/*` packages at `^5.7.x` may have peer dependency conflicts with updated packages.
**Prevention:** Evaluate whether Capacitor is actively used. If not, remove all `@capacitor/*` dependencies during the infrastructure phase to reduce noise.

### Pitfall 13: `jest` DevDependency Confusion
**What goes wrong:** The frontend has both `jest` and `vitest` as devDependencies. This can cause import confusion and unnecessary install weight.
**Prevention:** Remove `jest` if the project uses Vitest exclusively (which it does based on the config).

### Pitfall 14: CSS-in-JS `@apply` Behavior Changes
**What goes wrong:** Some `@apply` uses in `app.css` may behave differently in Tailwind 4 due to cascade layer changes. For example, `@apply bg-base-100` inside `@layer base` may not resolve the same way.
**Prevention:** Test all `@apply` usages after migration. Tailwind 4 still supports `@apply` but its resolution context within layers may differ.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Dependency updates | Vite/SvelteKit peer dependency mismatch | Check SvelteKit changelog for Vite version requirements |
| svelte.config.js | Forgetting to keep path aliases | Copy aliases from current config before replacing |
| app.css rewrite | Dynamic colors from staticSettings breaking | Implement CSS custom property override in +layout.svelte |
| DaisyUI theme migration | Hex-to-oklch color conversion errors | Use official oklch converter; test each color visually |
| Tailwind 4 class changes | Silent appearance changes (border, ring, gradient) | Visual regression comparison of key pages |
| i18n evaluation | Paraglide evaluation scope creep into migration | Keep evaluation as research only; no code changes |
| Full dep bump | Breaking changes in unrelated packages | Bump incrementally, test after each group |
| Docker validation | Build succeeds locally but fails in container | Test Docker build explicitly; check Node version compatibility |

## Sources

- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) - Breaking defaults, safelist removal, @utility
- [DaisyUI 5 upgrade guide](https://daisyui.com/docs/upgrade/?lang=en) - Class renames, removed components
- [DaisyUI 5 themes](https://daisyui.com/docs/themes/) - CSS-first theme configuration
- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) - Preprocessor removal, component changes
- [vite-plugin-svelte preprocess docs](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md) - Native TS in Svelte 5
- Codebase analysis of `tailwind.config.mjs`, `app.css`, `svelte.config.js`, `vite.config.ts`

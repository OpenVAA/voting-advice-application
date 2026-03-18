# Feature Landscape: Svelte 5 Migration Infrastructure

**Domain:** Frontend framework migration -- SvelteKit 2 + Svelte 4 to Svelte 5, Tailwind CSS 3 to 4, DaisyUI 4 to 5, i18n evaluation
**Researched:** 2026-03-15

## Table Stakes

Features that must work after the infrastructure migration. Missing = broken build.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `yarn build` succeeds | Turborepo builds all packages and frontend | Low | Packages unchanged; frontend needs valid config |
| `yarn dev` starts Docker stack | Development environment must work | Low | Docker is framework-agnostic |
| `svelte-kit sync` generates types | TypeScript IDE support | Low | New Svelte 5 types auto-generated |
| Path aliases work ($types, $voter, $candidate) | All existing imports use these | Low | SvelteKit aliases, not Svelte-version-specific |
| TypeScript references to workspace packages | IDE resolution of @openvaa/* | Low | tsconfig.json references unchanged |
| Tailwind utility classes render correctly | Entire UI uses Tailwind | Medium | TW4 has class name changes (gradients, ring, border) |
| DaisyUI component classes render correctly | Entire UI uses DaisyUI | Medium | DaisyUI 5 has class renames (see ARCHITECTURE.md) |
| Custom theme (light/dark) applies | Brand colors, custom spacing | High | Biggest migration task -- JS config to CSS-first |
| Dynamic colors from staticSettings | Per-deployment theming | High | Incompatible with CSS-first; needs new approach |
| `yarn test:unit` passes | Vitest unit tests | Low | Updated vitest config for Svelte 5 |
| Linting passes | ESLint with Svelte plugin | Low | Update svelte-eslint-parser for Svelte 5 syntax |
| i18n translations load | Stores-based sveltekit-i18n | Low | Svelte stores work in Svelte 5 |

## Differentiators

Features that the infrastructure upgrade enables, beyond just "not breaking."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Svelte 5 runes API available | Modern reactivity for content migration | Zero at infra level | Infrastructure enables it; content migration uses it |
| Tailwind 4 CSS-first config | Smaller CSS output, native CSS features | Included in migration | Already handled by app.css rewrite |
| DaisyUI 5 component improvements | New dock, improved form defaults, noise/depth effects | Zero at infra level | Available once DaisyUI 5 installed |
| Tree-shakable CSS output | Smaller production bundles | Automatic | Tailwind 4 + Vite plugin handles this |
| Modern CSS features (oklch, @property) | Better color handling, smaller stylesheets | Automatic | Tailwind 4 uses modern CSS |
| Native TypeScript in .svelte files | No preprocessor latency | Automatic | Svelte 5 handles `lang="ts"` natively |

## Anti-Features

Features to explicitly NOT build during the infrastructure milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Component migration to runes | Too large to combine with infra changes; 361 `export let` + 139 `$:` occurrences | Defer to content migration milestone |
| Slot-to-snippet migration | 56 `<slot>` across 41 components; mixing with config is risky | Defer to content migration |
| Event dispatcher migration | 12 `createEventDispatcher` usages; content-level change | Defer to content migration |
| Store-to-rune migration | 52 `svelte/store` imports across 42 files; works as-is | Defer; stores are not deprecated |
| i18n library replacement | Paraglide requires architecture rethinking; 42+ affected files | Evaluate during i18n phase; decide before content migration |
| Route structure changes | `[[lang=locale]]` routing works unchanged | No reason to change during infrastructure |
| Data adapter changes | UniversalAdapter, DataProvider patterns work unchanged | Backend integration untouched |

## Feature Dependencies

```
Svelte 5 package installed
  -> svelte.config.js updated (no preprocessor)
  -> vite.config.ts updated (new plugin)
  -> vitest.config.ts updated (Svelte 5 test support)
  -> svelte-check updated (Svelte 5 types)

Tailwind 4 installed + @tailwindcss/vite added
  -> postcss.config.cjs deleted
  -> tailwind.config.mjs deleted
  -> app.css rewritten (CSS-first)

DaisyUI 5 installed
  -> app.css uses @plugin "daisyui" (not JS require)
  -> Theme config uses @plugin "daisyui/theme" (not JS themes array)

All infrastructure in place
  -> yarn build succeeds (empty frontend)
  -> Docker build succeeds
  -> CI pipeline passes
  -> Content migration can begin (next milestone)
```

## MVP Recommendation

The "MVP" for infrastructure is the smallest set of changes that makes the frontend build successfully on Svelte 5:

Prioritize:
1. **Package dependency updates** -- without Svelte 5 installed, nothing else matters
2. **svelte.config.js + vite.config.ts** -- must be valid for dev server and builds to work
3. **app.css with Tailwind 4 + DaisyUI 5** -- must compile for CSS to work
4. **Theme migration** -- custom colors must be present for visual correctness

Defer:
- **i18n evaluation** -- works as-is, evaluate separately
- **Full monorepo dep bump** -- independent concern, do after framework is stable
- **Capacitor/ai cleanup** -- nice-to-have, not blocking

## Sources

- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [DaisyUI 5 upgrade guide](https://daisyui.com/docs/upgrade/?lang=en)
- Codebase analysis: 167 .svelte files, 361 `export let`, 139 `$:`, 56 `<slot>`, 52 store imports

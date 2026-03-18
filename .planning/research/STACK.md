# Technology Stack: Svelte 5 Migration Infrastructure

**Project:** OpenVAA Frontend Modernization (v1.2)
**Researched:** 2026-03-15

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Svelte | ^5.x (latest) | UI framework | Target of migration; runes, snippets, function components |
| SvelteKit | ^2.x (latest) | App framework | Already on v2; update to latest for Svelte 5 support |
| @sveltejs/adapter-node | ^5.x (latest) | SSR adapter | Production deployment via Docker; unchanged |

### Build Tooling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | ^6.x (latest, if SvelteKit supports) or ^5.x | Build tool | SvelteKit's build engine; check Kit compatibility |
| @sveltejs/vite-plugin-svelte | ^4.x or ^5.x | Svelte compilation | Required for Svelte 5; preprocessor changes |
| @tailwindcss/vite | ^4.x | CSS processing | Replaces PostCSS plugin; Tailwind 4 recommended |
| Turborepo | ^2.8.x (existing) | Build orchestration | Unchanged; framework-agnostic |
| tsup | ^8.x (existing) | Package builds | Unchanged; only used by publishable packages |

### CSS & Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^4.x | Utility CSS framework | CSS-first config, smaller output, modern CSS features |
| DaisyUI | ^5.x | Component library | CSS plugin syntax, updated components, oklch colors |

### Testing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | catalog: (existing) | Unit tests | Unchanged; framework-agnostic test runner |
| Playwright | ^1.58.2 (existing) | E2E tests | Unchanged; browser-based testing |
| svelte-check | ^4.x | Type checking | Updated for Svelte 5 type system |

### i18n
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| sveltekit-i18n | ^2.4.2 (existing) | Internationalization | Keep during infrastructure; store-based API works in Svelte 5 |
| @sveltekit-i18n/parser-icu | ^1.0.8 (existing) | ICU message format | Required by sveltekit-i18n |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | existing | Containerization | Unchanged; framework-agnostic |
| Node.js | 20.18.1 (existing) | Runtime | Unchanged |
| Yarn | 4.13 (existing) | Package manager | Unchanged |

## Packages to REMOVE

| Package | Reason |
|---------|--------|
| `svelte-preprocess` | Svelte 5 handles `lang="ts"` natively; no preprocessor needed |
| `autoprefixer` | Tailwind 4 handles vendor prefixing internally |
| `postcss` | Using `@tailwindcss/vite` instead of PostCSS plugin |
| `vite-tsconfig-paths` | SvelteKit handles path aliases via `kit.alias`; redundant |

## Packages to EVALUATE

| Package | Question | Action |
|---------|----------|--------|
| `@capacitor/*` (android, cli, core, ios) | Is Capacitor actively used? | If not, remove to reduce dependency footprint |
| `ai` (^5.0.0) | Known build failure; is it actively used? | Evaluate removal or fix |
| `svelte-visibility-change` (^0.6.0) | Svelte 5 compatibility? | Check if Svelte 5-compatible version exists |
| `jest` (^29.7.0) | Listed as devDep but project uses Vitest | Remove if not used |
| `jsdom` (^24.1.3) | Only needed if Vitest uses jsdom environment | Keep if vitest uses it |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| CSS processing | @tailwindcss/vite | @tailwindcss/postcss | Vite plugin is faster and recommended for Vite-based projects |
| Preprocessor | None (native TS) | vitePreprocess | Svelte 5 handles TS natively; vitePreprocess only needed for advanced TS features like enums |
| i18n | Keep sveltekit-i18n | Paraglide | Paraglide requires rethinking i18n architecture; too risky during infrastructure phase |
| Tailwind config | CSS-first @theme | @config (JS fallback) | JS config is legacy; DaisyUI 5 expects CSS-first |
| CSS framework | Tailwind 4 + DaisyUI 5 | Stay on Tailwind 3 | Missing the point of the upgrade; DaisyUI 5 requires TW4 |

## Installation

```bash
# Core framework updates (in apps/frontend/package.json)
# devDependencies:
yarn add -D svelte@latest @sveltejs/kit@latest @sveltejs/adapter-node@latest
yarn add -D @sveltejs/vite-plugin-svelte@latest vite@latest
yarn add -D tailwindcss@latest @tailwindcss/vite@latest daisyui@latest
yarn add -D svelte-check@latest eslint-plugin-svelte@latest svelte-eslint-parser@latest

# Remove obsolete packages
yarn remove svelte-preprocess autoprefixer postcss vite-tsconfig-paths

# Delete config files
rm apps/frontend/postcss.config.cjs apps/frontend/tailwind.config.mjs
```

## Sources

- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) - Preprocessor removal, native TS
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) - CSS-first config, Vite plugin
- [DaisyUI 5 SvelteKit installation](https://daisyui.com/docs/install/sveltekit/) - @tailwindcss/vite + @plugin syntax
- [@sveltejs/vite-plugin-svelte](https://www.npmjs.com/package/@sveltejs/vite-plugin-svelte) - Version compatibility

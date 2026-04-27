# Technology Stack: Svelte 5 Context System Rewrite

**Project:** OpenVAA v2.4 Full Svelte 5 Rewrite
**Researched:** 2026-03-27

## Recommended Stack

### Core Framework (No Changes)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Svelte | 5.53.12 | Component framework | Already installed. Provides `$state`, `$derived`, `$effect`, `createContext` (5.40+) |
| SvelteKit | 2.55.0 | App framework | Already installed. Provides `$app/state` (2.12+), replacing deprecated `$app/stores` |
| TypeScript | (workspace) | Type safety | Already installed. No version changes needed |

### Key Svelte 5 APIs to Adopt

| API | Min Version | Purpose | Replaces |
|-----|-------------|---------|----------|
| `$state` | 5.0 | Reactive state declaration | `writable()` from `svelte/store` |
| `$derived` | 5.0 | Computed values | `derived()` from `svelte/store` |
| `$derived.by()` | 5.0 | Complex computed values | `derived()` with multi-step logic |
| `$effect` | 5.0 | Side effects (persistence, DOM) | `store.subscribe()` for side effects |
| `$props()` | 5.0 | Component props | `export let` |
| `createContext()` | 5.40 | Type-safe context | `setContext()` + `getContext()` + Symbol keys |
| `page` from `$app/state` | SvelteKit 2.12 | Fine-grained page state | `page` from `$app/stores` |

### Libraries Removed from Context System

| Library | Current Usage | Replacement |
|---------|--------------|-------------|
| `svelte/store` (writable, derived, get, readable) | 51 imports across 40 files | `$state`, `$derived` runes |
| `$app/stores` (page) | 5 files | `$app/state` (page) |
| `svelte/motion` (tweened) | 1 file (layoutContext) | Keep as-is -- motion stores still valid in Svelte 5 |

### Libraries Unchanged

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@openvaa/data` | workspace | Data model | DataRoot consumed by context, API unchanged |
| `@openvaa/matching` | workspace | Matching algorithms | Used in VoterContext, API unchanged |
| `@openvaa/filters` | workspace | Entity filtering | Used in VoterContext, API unchanged |
| `@openvaa/app-shared` | workspace | Settings, types | StaticSettings/DynamicSettings consumed, unchanged |
| `$app/navigation` | SvelteKit | Navigation | `goto`, `beforeNavigate`, `afterNavigate` -- unchanged |
| `$app/environment` | SvelteKit | Environment detection | `browser` import -- unchanged |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State primitive | `$state` rune | Keep `writable()` stores | Stores are deprecated path. Runes are Svelte 5's native reactivity |
| Computed values | `$derived` rune | Keep `derived()` stores | Runes provide fine-grained tracking without custom `parsimoniusDerived` |
| Context API | `createContext()` | Keep `setContext(Symbol)` | `createContext` provides type safety. Available since 5.40 (we have 5.53) |
| Page state | `$app/state` | Keep `$app/stores` | `$app/stores` is deprecated. `$app/state` fixes pushState reactivity |
| Persistence | `$state` + `$effect` | External store library (e.g., svelte-persisted-store) | No need for external dep -- pattern is simple and self-contained |

## No Installation Changes

This migration does not add, remove, or update any npm packages. All required APIs are already available in the installed versions of Svelte and SvelteKit. The changes are entirely internal to the frontend application code.

## Sources

- [Svelte 5 docs: $state](https://svelte.dev/docs/svelte/$state)
- [Svelte 5 docs: $derived](https://svelte.dev/docs/svelte/$derived)
- [Svelte 5 docs: Context](https://svelte.dev/docs/svelte/context) -- createContext() since v5.40
- [SvelteKit docs: $app/state](https://svelte.dev/docs/kit/$app-state) -- since SvelteKit 2.12
- [SvelteKit docs: $app/stores](https://svelte.dev/docs/kit/$app-stores) -- deprecated
- yarn.lock: Svelte 5.53.12, SvelteKit 2.55.0

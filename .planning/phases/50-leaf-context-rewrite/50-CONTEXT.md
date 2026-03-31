# Phase 50: Leaf Context Rewrite - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite the 3 leaf contexts (I18nContext, LayoutContext, AuthContext) from `svelte/store` internals to native `$state`/`$derived`. Migrate ALL `$app/stores` imports to `$app/state` across the entire codebase. Update all consumer components of these 3 contexts to use direct property access instead of `$store` syntax.

</domain>

<decisions>
## Implementation Decisions

### D-01: Writable stores become direct $state properties
All `Writable<T>` stores in LayoutContext (video.show, video.hasContent, video.mode, video.player, progress.max) are replaced with plain `$state` properties. Consumers access them directly (e.g., `ctx.video.show` instead of `$video.show`). Type definitions change from `Writable<T>` to plain `T`.

### D-02: Tweened progress replaced with Svelte 5 Tween class
`progress.current` switches from `tweened()` (store-based) to `new Tween()` from `svelte/motion`. The Tween class is rune-native with `.current` and `.target` properties. No `svelte/store` dependency needed.

### D-03: All 11 $app/stores files migrated in this phase
Every `$app/stores` import is migrated to `$app/state` in one sweep, including files in other contexts (candidateContext, paramStore, pageDatumStore, getRoute) that are otherwise rewritten in later phases. This satisfies the "zero `$app/stores` imports" success criterion.

Files: authContext.ts, candidateContext.ts, paramStore.ts, pageDatumStore.ts, getRoute.ts, +layout.svelte (root), results/+layout.svelte, +error.svelte, Banner.svelte, admin/login/+page.svelte, LanguageSelection.svelte.

### D-04: Full consumer migration per phase (no shim layer)
Each context rewrite phase also updates ALL consumers of those contexts. Phase 50 updates all I18n/Layout/Auth consumers to direct property access. No intermediate shim objects that preserve `$store` syntax.

Consumer counts: ~34 LayoutContext consumers, ~3 I18nContext consumers, ~4 AuthContext consumers, ~13 files using `$locale`/`$isAuthenticated` store syntax.

### Claude's Discretion
- I18nContext implementation approach (simplest context — `readable()` → `$state` or plain getters since locale is constant within page lifecycle)
- AuthContext `isAuthenticated` implementation (currently `derived(page, ...)` — will use `$app/state` page + `$derived`)
- File rename strategy (.ts → .svelte.ts) for files using runes
- SSR safety validation approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Context system
- `apps/frontend/src/lib/contexts/i18n/i18nContext.ts` — Current I18nContext implementation
- `apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts` — Current I18nContext types (Readable<T>)
- `apps/frontend/src/lib/contexts/layout/layoutContext.ts` — Current LayoutContext implementation (writable, tweened, StackedState)
- `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` — Current LayoutContext types (Writable<T>, Tweened<T>)
- `apps/frontend/src/lib/contexts/auth/authContext.ts` — Current AuthContext implementation (derived from $app/stores page)
- `apps/frontend/src/lib/contexts/auth/authContext.type.ts` — Current AuthContext types (Readable<boolean>)
- `apps/frontend/src/lib/contexts/README.md` — Context system overview

### Phase 49 utilities (already rune-based)
- `apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts` — Rune-based stack state (used by LayoutContext)
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` — Rune-based localStorage/sessionStorage persistence
- `apps/frontend/src/lib/contexts/utils/memoizedDerived.ts` — Rune-compatible memoized derivation

### $app/stores migration targets
- `apps/frontend/src/lib/contexts/utils/paramStore.ts` — Uses $app/stores page
- `apps/frontend/src/lib/contexts/utils/pageDatumStore.ts` — Uses $app/stores page
- `apps/frontend/src/lib/contexts/candidate/candidateContext.ts` — Uses $app/stores page
- `apps/frontend/src/lib/contexts/app/getRoute.ts` — Uses $app/stores page

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StackedState.svelte.ts` — Already rune-based, used by LayoutContext for pageStyles/topBarSettings/navigationSettings (no change needed)
- `persistedState.svelte.ts` — Available if any context needs persistent storage
- `memoizedDerived.ts` — Available for replacing `parsimoniusDerived` patterns in contexts

### Established Patterns
- All contexts use `getContext`/`setContext`/`hasContext` from Svelte with Symbol keys — this pattern stays
- `getXxxContext()`/`initXxxContext()` API shape is preserved (R2.10)
- LayoutContext's `getLayoutContext(onDestroy)` takes an `onDestroy` callback for automatic cleanup of stacked state

### Integration Points
- Root `+layout.svelte` calls `initI18nContext()`, `initLayoutContext()`, `initAuthContext()`
- Consumer components import `getXxxContext()` and destructure stores
- Layout-related components (Header, Banner, MainContent) heavily use LayoutContext video/progress writables

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 50-leaf-context-rewrite*
*Context gathered: 2026-03-28*

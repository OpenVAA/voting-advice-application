# Phase 51: Mid-Level Context Rewrite - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite ComponentContext, DataContext, and AppContext from `svelte/store` internals to native `$state`/`$derived`. Bridge DataRoot's mutable-in-place updates with `$derived` via version counter. Update all consumer components of these 3 contexts to direct property access.

</domain>

<decisions>
## Implementation Decisions

### D-01: DataRoot version counter pattern
Add a `$state` version counter that increments whenever `DataRoot.subscribe()` fires. `$derived` expressions read both the DataRoot reference AND the version counter, forcing re-evaluation on mutation. No changes to DataRoot source code needed. Replaces the custom `alwaysNotifyStore` workaround entirely.

### D-02: AppContext pageDatumStore refactored
Since pageDatumStore is already migrated to `$app/state` (Phase 50), simplify AppContext's data flow during the rune migration. Replace `pageDatumStore.subscribe()` patterns with direct `$derived` chains from page state. This is a deliberate refactoring of the subscription patterns, not just a mechanical store-to-$state swap.

### D-03: All 52 ComponentContext consumers updated in this phase
Per Phase 50's D-04 decision (full consumer migration per phase), all ~52 files importing `getComponentContext` are updated in Phase 51. Mostly mechanical: `$locale` becomes `locale`, `$darkMode` becomes `darkMode`.

### D-04: Carry forward from Phase 50
- Direct $state properties for all writables (Phase 50 D-01)
- Full consumer migration per phase, no shim layers (Phase 50 D-04)
- Same .ts → .svelte.ts file rename pattern for files using runes

### Claude's Discretion
- ComponentContext implementation (trivial — spreads I18nContext + darkMode, just update type cascade)
- DataContext version counter placement (in context init vs separate reactive helper)
- AppContext internal structure for tracking, survey, popup queue conversions
- Whether pageDatumStore utility itself is simplified or replaced during the refactor

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Context implementations
- `apps/frontend/src/lib/contexts/component/componentContext.ts` — Current ComponentContext (spreads I18nContext + darkMode)
- `apps/frontend/src/lib/contexts/component/componentContext.type.ts` — Current ComponentContext type
- `apps/frontend/src/lib/contexts/data/dataContext.ts` — Current DataContext with alwaysNotifyStore workaround
- `apps/frontend/src/lib/contexts/app/appContext.ts` — Current AppContext (~170 lines, pageDatumStore subscriptions, popup/tracking/survey)
- `apps/frontend/src/lib/contexts/app/appContext.type.ts` — Current AppContext type

### AppContext dependencies
- `apps/frontend/src/lib/contexts/utils/pageDatumStore.ts` — Derives values from $app/stores page data (migrated to $app/state in Phase 50)
- `apps/frontend/src/lib/contexts/app/getRoute.ts` — Route helper using $app/stores (migrated in Phase 50)
- `apps/frontend/src/lib/contexts/app/popup/` — Popup queue store
- `apps/frontend/src/lib/contexts/app/survey.ts` — Survey link derivation
- `apps/frontend/src/lib/contexts/app/tracking/` — Tracking service

### Phase 50 artifacts (prerequisite)
- `.planning/phases/50-leaf-context-rewrite/50-CONTEXT.md` — Decisions D-01 through D-04 that carry forward

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StackedState.svelte.ts` — Already rune-based, not used by these contexts but pattern reference
- `persistedState.svelte.ts` — Used by AppContext for `userPreferences` (localStorageWritable)
- `memoizedDerived.ts` — Available for complex derivations in AppContext

### Established Patterns
- ComponentContext spreads I18nContext via `...getI18nContext()` — after Phase 50, I18nContext properties are plain values, so ComponentContext type must cascade
- DataRoot uses `.subscribe()` for imperative change notification — version counter bridges this to $derived
- AppContext uses `pageDatumStore` to derive settings from page data — refactoring to $derived chains simplifies this

### Integration Points
- AppContext spreads ComponentContext and DataContext: `...getComponentContext(), ...getDataContext()`
- ~52 components import `getComponentContext` for `t()`, `translate`, `locale`, `darkMode`
- ~30 components import `getAppContext` for app settings, preferences, feedback, etc.
- VoterContext, CandidateContext, AdminContext all depend on AppContext (Phase 52)

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

*Phase: 51-mid-level-context-rewrite*
*Context gathered: 2026-03-28*

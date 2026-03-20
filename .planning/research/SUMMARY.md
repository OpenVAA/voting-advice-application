# Project Research Summary

**Project:** OpenVAA v1.3 — Svelte 5 Content Migration (Voter App)
**Domain:** Frontend framework migration — Svelte 4 idioms to Svelte 5 runes/snippets/callback props
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

This project is a content migration: converting the OpenVAA voter app frontend from Svelte 4 patterns (reactive statements, event directives, slot syntax, legacy props) to Svelte 5 idioms (runes, snippets, callback props). The infrastructure was already upgraded to Svelte 5.53.12 and SvelteKit 2.55.0 in v1.2, so the core task is transforming idioms across ~112 component and route files. The migration surface is large but well-bounded: 570+ `export let` occurrences, 122 `on:event` directives, 50+ `<slot>` elements, and 100+ `$:` reactive statements. The `sv migrate svelte-5` CLI automates roughly 60-70% of mechanical changes per file, leaving the complex cases — context stores, event dispatcher replacement, and reactive statement disambiguation — for manual work. Zero new dependencies are required; everything needed is already installed.

The recommended approach is strict bottom-up migration: leaf components first (Icon, Loading, Button, etc.), then container components (Modal, Alert, EntityCard), then root layout components, then voter route pages, then context utilities, and finally the context class system. This order is enforced by Svelte 5's backward compatibility guarantees: runes-mode components can receive old-style content from legacy-mode consumers, but a component migrated to `{@render}` snippets cannot receive old-style `<div slot="name">` content. The context system must be migrated last because it is the deepest shared dependency and changing its API surface requires updating every consumer simultaneously. Critically, Svelte 5's `svelte/store` module is explicitly NOT deprecated — stores and runes coexist fully — so components can migrate to runes while still consuming store-based contexts via `$storeName` auto-subscription.

The single most important risk is the `$$slots`/`$$restProps` immediate breakage: the moment any rune is used in a file, legacy globals become undefined. Each component must be fully migrated atomically — `$props()`, rest spread, snippet checks, and type annotations all in a single commit. The second major risk is silent event handler loss from Svelte 5's removal of component-level event forwarding — click handlers stop working with no error thrown. The 92-test E2E suite is the non-negotiable regression gate; it must pass after every phase. The `DataRoot` class from `@openvaa/data` must never be wrapped in `$state()` due to proxy conflicts with class instances; the `alwaysNotifyStore` workaround continues working and should be preserved through at least Phase 6.

## Key Findings

### Recommended Stack

The stack is fully in place from v1.2 and requires zero new dependencies or version changes. Svelte 5.53.12 and SvelteKit 2.55.0 are already installed with all required features (runes, snippets, `$app/state`, `createContext`). The `sv migrate` CLI (invoked as `npx sv migrate svelte-5`) is the primary automation tool for mechanical transforms; no external migration libraries should be added.

**Core technologies:**
- `sv migrate svelte-5` (via `npx sv migrate`): automated idiom conversion — handles `export let`, `$:`, `on:`, `<slot>` transforms per file (~60-70% automation rate); ships with the installed `svelte` package
- `sv migrate app-state` (via `npx sv migrate`): converts `$app/stores` to `$app/state` in `.svelte` files — handles 18 of 21 impacted files; 3 `.ts` context utilities require manual migration
- Svelte 5 runes (`$state`, `$derived`, `$derived.by`, `$effect`, `$props`, `$bindable`): built into installed version 5.53.12, the replacement for all legacy reactive patterns
- `.svelte.ts` file extension: required to use runes in non-component TypeScript files — rename only files that actually use runes to avoid unnecessary Svelte compiler overhead
- `createContext` API (Svelte 5.40+): available in installed version 5.53.12; returns typed `[get, set]` tuple; eliminates manual Symbol key management; use in Phase 6 when context system migrates

### Expected Features

**Must have (table stakes — zero legacy patterns target):**
- `export let` to `$props()` conversion across ~105 voter-app and shared component files — foundational, everything else depends on it
- `$$restProps`/`$$slots`/`$$Props` removal — immediately undefined in runes mode; must be converted atomically with `$props()` in the same commit per file
- `$:` reactive statements converted to `$derived`/`$derived.by()`/`$effect` — 100+ occurrences across 30 files; wrong rune choice causes SSR failures or infinite loops
- `on:event` directives replaced with native event attributes and callback props — 122 occurrences; silent failure mode (no error, handlers just stop working)
- `<slot>` replaced with `{@render children?.()}` and snippet props — 50+ occurrences, 41 files
- `createEventDispatcher` replaced with callback props — 6 files (Alert, Expander, Navigation, SurveyButton, Feedback, DataConsent)
- `$bindable()` annotations on all bound props — 92 `bind:` occurrences across 40 files; missing annotation causes runtime error
- `svelte:self` replaced with explicit self-import — 2 files (EntityCard, EntityTag)
- `svelte:component` deprecation resolved — 7 occurrences, 3 files
- Event modifiers (`|once`, `|preventDefault`, `|capture`) replaced with inline JavaScript — 11 occurrences, Video.svelte needs significant rework
- All 10 v1.3-scoped `TODO[Svelte 5]` markers resolved
- All 92 E2E tests passing after migration

**Should have (differentiators, if capacity allows):**
- `createContext` API adoption replacing manual Symbol keys — available in installed version, low complexity
- `$app/state` adoption replacing `$app/stores` in the `paramStore`/`pageDatumStore` utility chain — eliminates deprecated API, medium complexity
- Class-based context state objects replacing bag-of-stores pattern — cleaner API, better performance, high complexity; the version-counter `DataContextState` pattern replaces `alwaysNotifyStore`
- Fine-grained `$derived` chains replacing `parsimoniusDerived` — eliminates 57-line custom utility; requires all context files to be `.svelte.ts`

**Defer to v1.4+:**
- Candidate app route migration (10 route files + 7 candidate-only components)
- Admin app routes (planned for rebuild milestone)
- `alwaysNotifyStore` / `DataRoot` rune integration if full context class migration is deferred
- `Input.svelte` TODO[Svelte 5] marker (candidate-only component, 3 admin-scope markers)

### Architecture Approach

The architecture is a 7-phase bottom-up migration that maintains a "compatibility bridge" during the transition: components migrate to runes while the context system stays store-based, allowing `$store` auto-subscription syntax to continue working in runes-mode components. The context chain (I18n → Component → Data → App → Voter) is a strict initialization dependency and migrates as a single coordinated unit in Phase 6, converting from bag-of-stores to typed classes with `$state`/`$derived` properties. DataRoot from `@openvaa/data` stays non-proxied throughout; a version-counter signal in `DataContextState` replaces the `alwaysNotifyStore` hack only when context class migration occurs.

**Major components:**
1. **Leaf components** (Icon, Loading, Button, Avatar, MatchScore, etc.) — pure display, no slots or complex events; migrate first, independently testable, unblock all downstream phases
2. **Container components** (Modal, Alert, EntityCard, MainContent, HeadingGroup, Tabs) — named slots and event dispatching; migrate with all consumers atomically to avoid slot-consumer mismatch
3. **Root layout components** (Layout.svelte, MainContent.svelte) — shared between voter and candidate apps; migrate after containers, before route pages; candidate call sites get syntax-only updates
4. **Voter route pages** (14 `+page.svelte`, 4 `+layout.svelte`) — consumers of contexts and components; migrate after dependencies; retain `$storeName` store subscriptions until context migration
5. **Context utility layer** (parsimoniusDerived, paramStore, pageDatumStore, storageStore, stackedStore) — rewrite or delete as part of context migration; `$app/stores` migration for 3 `.ts` files happens here
6. **Context class system** (I18n/Component/Data/App/VoterContext) — entire chain migrates together to class-based `$state`/`$derived` pattern using `createContext` API
7. **Root layout integration** — final wiring of context initialization and `children` snippet; E2E validation gate

### Critical Pitfalls

1. **`$$slots`/`$$restProps` crash immediately in runes mode** — the moment any rune is used, legacy globals are undefined. This project has 186 occurrences across 40+ components. Convert ALL legacy patterns in a single commit per component: `$props()`, rest spread, snippet checks, and type annotations simultaneously. Run `svelte-check` after each file. Button.svelte is the highest-risk file due to pervasive use across the codebase.

2. **Event forwarding silently removed** — `<Button on:click>` component-level forwarding has no Svelte 5 equivalent. Handlers stop working with no error thrown. This project has 66 `on:event` occurrences in components. Button must accept `onclick` callback prop; every call site (30+ files) must be updated atomically. E2E tests must verify handler execution, not just element presence.

3. **Context store API change cascades to all consumers** — `VoterContext` exposes 15+ store properties accessed via `$storeName` in dozens of route files. Changing context return type from `Readable<T>` to rune state breaks every consumer. Prevention: keep store-based contexts through all component migration phases. Never change context API without updating all consumers in the same commit.

4. **`DataRoot` class instance breaks if wrapped in `$state()`** — Svelte 5's deep proxy conflicts with class instance methods, private properties, and `instanceof` checks that `@openvaa/data` relies on. Use `$state.raw()` or the version-counter pattern instead. Keep `alwaysNotifyStore` intact until Phase 6 context class migration.

5. **`$:` to wrong rune causes SSR failures or infinite loops** — `$derived` for pure computations, `$effect` for side effects (async, DOM, logging, storage). Using `$effect` where `$derived` is needed causes SSR mismatches. Using `run()` from `svelte/legacy` is deprecated and will break in Svelte 6. Every `$:` statement must be reviewed individually; `sv migrate` often falls back to `run()` for ambiguous cases.

## Implications for Roadmap

Based on combined research, the migration follows a strict dependency order enforced by Svelte 5's backward compatibility model. Phase structure maps directly to the architectural layer dependency graph.

### Phase 1: Leaf Component Migration

**Rationale:** Leaf components (no child custom components, no complex slots, no event dispatching) are self-contained and can be migrated independently with zero blast radius. Button, Icon, and Loading are the most critical because they are used in 30+ files each — migrating them first unblocks all subsequent component phases. `sv migrate svelte-5` per file provides the mechanical baseline; manual review catches `$$restProps`/`$$slots` that must be converted in the same pass.

**Delivers:** ~20 leaf components fully migrated to runes mode. `Button.svelte` migration complete with `onclick` callback prop replacing event forwarding. `svelte:self` fixed in EntityTag. Zero `$$restProps`/`$$slots` remaining in migrated files.

**Addresses features:** `$props()` conversion, `$$Props`/`$$restProps`/`$$slots` removal, basic `on:event` to native attribute conversion, `$bindable()` on bound props (e.g., `bind:value` in toggle components), `svelte:component` deprecation for leaf-level uses.

**Avoids:** Pitfall 1 (legacy globals crash), Pitfall 2 (event forwarding loss). Atomic-per-component rule prevents partial migration state that would crash at runtime.

### Phase 2: Container Component Migration

**Rationale:** Container components (Modal, Alert, EntityCard, HeadingGroup, MainContent, Tabs, etc.) have named slots, event dispatching via `createEventDispatcher`, and are consumed by both voter and candidate apps. They require migrating the component AND all its consumers simultaneously because a component using `{@render}` cannot receive old-style `<div slot="name">` content. The candidate app call sites receive syntax-only updates (snippet syntax, `onclick` instead of `on:click`) without logic refactoring — Svelte 5's compatibility mode handles the rest.

**Delivers:** Named slot → snippet migration across 15+ container components. `createEventDispatcher` removed from 6 components (Alert, Expander, Navigation, SurveyButton, Feedback, DataConsent). `svelte:self` replaced with self-import in EntityCard. `svelte:component` deprecation resolved for all non-leaf files. `$$slots` checks converted to snippet presence checks throughout. Event modifiers resolved (Video.svelte `|once`/`|capture`).

**Addresses features:** Slot-to-snippets conversion, createEventDispatcher removal, event modifier replacement, TODO[Svelte 5] markers for EntityCard, Alert, EntityCardAction, ConstituencySelector.

**Avoids:** Pitfall 6 (slot consumers lag behind), Pitfall 12 (createEventDispatcher deprecation), Pitfall 13 (svelte:component deprecation), Pitfall 14 (svelte:self deprecation).

### Phase 3: Root Layout Component Migration

**Rationale:** Layout.svelte and MainContent.svelte are shared between voter and candidate apps and form the structural shell of every page. They must be migrated after their contained components (Phase 2) but before the route pages that compose them (Phase 4). They have complex named slot structures (6 named slots in MainContent), `$bindable()` props (`isDrawerOpen`), and both voter and candidate consumers.

**Delivers:** Root layout fully migrated with 6 named slots → snippet props in MainContent, `$bindable(isDrawerOpen)` in Layout, `on:click` to `onclick` on layout controls. Store subscriptions kept intact (contexts unchanged at this stage).

**Addresses features:** `$props()` and `$$Props` removal for root layouts, named slot → snippet for structural slots, `$bindable()` annotations.

**Avoids:** Pitfall 7 (missing `$bindable()` annotations cause runtime error when candidate app tries to bind), Pitfall 11 (mixed Svelte 4/5 boundary issues at root layout level).

### Phase 4: Voter Route Page Migration

**Rationale:** Route pages are consumers of both the component layer (now fully migrated) and the context layer (still store-based). They can be migrated to runes for their own local logic — `$props()` for `export let data`, `$derived`/`$effect` for reactive blocks — while continuing to consume contexts via `$storeName` auto-subscription syntax. This combination is explicitly supported by Svelte 5. The root `+layout.svelte` is the most complex due to its async data-loading `$:` block.

**Delivers:** All 19 voter route `.svelte` files migrated. Root `+layout.svelte` data-loading pattern rewritten with `$effect` (async side effect, not `$derived`). Elections and constituencies pages simplified with `$derived` (removing unnecessary wrapper functions). `(located)/+layout.svelte` async nomination-settled pattern rewritten. TODO[Svelte 5] markers resolved for elections, constituencies, located-layout, and EntityFilters.

**Addresses features:** Route-level `$:` → `$derived`/`$effect` conversion, `on:event` in route files, `slot=` usage in route templates, 6 of 10 v1.3-scoped TODO markers.

**Avoids:** Pitfall 5 (`$:` wrong rune choice) — root `+layout.svelte` async pattern specifically requires `$effect` not `$derived`. Pitfall 3 (context cascade) — contexts remain store-based so `$storeName` references in routes continue working unchanged.

### Phase 5: Context Utility Rewrite

**Rationale:** With all component and route migrations complete, the custom store utilities can be addressed. `parsimoniusDerived` becomes unnecessary when contexts use `$derived` natively. `paramStore` and `pageDatumStore` become inline `$derived` expressions against `page` from `$app/state`. `storageStore` becomes a `$state` + `$effect` sync pattern. `stackedStore` becomes a typed class with `$state`. This phase also handles the 3 manual `.ts` files that import `$app/stores` (`paramStore.ts`, `authContext.ts`, `pageDatumStore.ts`).

**Delivers:** 5 custom store utilities deleted or replaced with rune-based equivalents. `$app/stores` imports eliminated from all files. Context files ready for class conversion in Phase 6. Remaining TODO[Svelte 5] marker for `pageDatumStore` resolved.

**Addresses features:** `$app/state` adoption, `parsimoniusDerived` elimination, `storageStore` SSR-safe replacement.

**Avoids:** Pitfall 9 (`$app/stores` deprecation cascade) — utilities rewritten as a unit, never partially migrated. Pitfall 16 (premature `parsimoniusDerived` conversion before context is ready).

### Phase 6: Context System Class Migration

**Rationale:** The entire context chain (I18n → Component → Data → App → Voter) must migrate as a coordinated unit. They use spread composition (`...appContext` spread into VoterContext return), so any mix of store/rune return types would break consumers. Each context becomes a `.svelte.ts` class with `$state`/`$derived` properties. `createContext` API from Svelte 5.53 replaces manual Symbol key management. `DataContextState` implements the version-counter pattern to replace `alwaysNotifyStore`. Every `$storeName` reference in templates across all voter routes updates to `context.propertyName`.

**Delivers:** All context modules converted to `.svelte.ts` class pattern. `alwaysNotifyStore` eliminated via version-counter signal. `parsimoniusDerived` chains replaced by `$derived` class getters. All `$storeName` template references updated to direct property access. `createContext<T>()` adopted for type-safe context access. Final TODO[Svelte 5] marker for `dataContext.ts` resolved.

**Addresses features:** Full context system modernization, `createContext` adoption, `DataRoot` integration redesign.

**Avoids:** Pitfall 3 (cascading context breakage) — entire chain migrates together so no consumer sees mixed store/rune types. Pitfall 4 (DataRoot proxy conflict) — version-counter pattern avoids `$state(dataRoot)`.

### Phase 7: Integration Validation and E2E Gate

**Rationale:** Final integration pass to verify the entire migration is coherent. Root layout wires context initialization using the new class system. All 92 E2E tests must pass. TypeScript check and lint must be clean. Zero `TODO[Svelte 5]` markers remaining in voter app scope.

**Delivers:** Zero legacy Svelte 4 patterns in voter app and shared components. All 92 E2E tests green. Clean TypeScript and lint output. Complete v1.3 milestone.

**Avoids:** Silent regressions from earlier phases. Undiscovered broken candidate app call sites from shared component changes.

### Phase Ordering Rationale

- **Bottom-up is mandatory:** Svelte 5's compatibility layer allows runes-mode components to accept old-style slot content from legacy consumers, but NOT the reverse. A component migrated to `{@render}` snippets cannot receive old `<div slot="name">` content. Working bottom-up ensures every migration is immediately usable by still-unmigrated parents.
- **Context last is mandatory:** The context API surface change requires all consumers to update simultaneously. Migrating components first while contexts stay store-based allows incremental progress without a big-bang cutover.
- **Utilities before context classes (Phase 5 before Phase 6):** Context utility deletion must precede context class conversion because the current context implementation depends on those utilities.
- **E2E gate implicitly after each phase:** The 92 E2E tests should remain green throughout. A phase that breaks tests must be fixed before proceeding.
- **Candidate app call sites updated during Phase 2-3:** Shared components are used by both apps. Candidate call sites receive syntax-only updates (snippet syntax, `onclick`) during Phase 2-3 without migrating candidate logic.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 6 (Context System):** The context class conversion has no official automated tooling. The exact migration of `VoterContext` (which spreads properties from 4 parent contexts and has 15+ `parsimoniusDerived` chains) requires a property-by-property design pass. Research during planning to enumerate every store property and its `$derived` class getter equivalent.
- **Phase 5 (Context Utilities):** `storageStore` replacement needs verification of SSR-safe `$effect` + localStorage/sessionStorage sync pattern in `.svelte.ts` context files. `$effect` does not run on the server; the replacement must handle the `window` undefined case during SSR.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Leaf Components):** Fully documented mechanical transforms. Official migration guide has exact patterns. `sv migrate svelte-5` handles most of it.
- **Phase 2 (Container Components):** Named slot → snippet conversion has clear official patterns. Per-component review needed but no architectural uncertainty.
- **Phase 4 (Route Pages):** Route-level `$:` conversion follows the `$derived`/`$effect` decision rule documented in research. Standard patterns apply.
- **Phase 7 (Validation):** Run E2E suite. No architectural decisions needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official Svelte 5 and SvelteKit 2 docs. Already installed. Zero new dependencies. |
| Features | HIGH | Migration surface measured via direct codebase grep. Every API change confirmed in official docs. Scope boundary (voter app only) is clear. |
| Architecture | HIGH | Bottom-up migration order derived from Svelte 5's backward compatibility guarantees. Context-last strategy validated against official migration guide. |
| Pitfalls | HIGH | Every pitfall verified against official Svelte 5 docs or confirmed community migration reports. Codebase exposure quantified by direct file analysis. |

**Overall confidence:** HIGH

### Gaps to Address

- **`VoterContext` property-by-property migration map:** The full mapping of `parsimoniusDerived` chains to `$derived` class getters has not been enumerated. Produce this map during Phase 6 planning — it is the critical input for that phase.
- **`storageStore` SSR safety:** The `$state` + `$effect` replacement pattern for localStorage/sessionStorage sync needs validation against SvelteKit's SSR execution model. Handle the `window` undefined case explicitly.
- **Candidate app call-site inventory:** The exact set of candidate route files requiring syntax-only updates (snippet syntax, `onclick`) when shared components migrate is not fully enumerated. Audit before Phase 2 begins.
- **`svelte-visibility-change@^0.6.0` compatibility:** This package's Svelte 5 compatibility is unverified. If the voter app uses it, verify or replace before Phase 1 begins. A custom `$effect`-based implementation is trivial.
- **Some TODO[Svelte 5] markers resolve only through testing:** Markers tagged "check if reactivity needed" (elections, constituencies pages) can only be confirmed after migration and running E2E tests.

## Sources

### Primary (HIGH confidence)

- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) — comprehensive runes, snippets, events, and lifecycle migration patterns
- [sv migrate CLI](https://svelte.dev/docs/cli/sv-migrate) — automated transforms and their limitations
- [$app/state documentation](https://svelte.dev/docs/kit/$app-state) — SvelteKit page/navigating/updated state objects
- [Svelte $props rune](https://svelte.dev/docs/svelte/$props) — replaces `export let` and `$$restProps`
- [Svelte $state rune](https://svelte.dev/docs/svelte/$state) — proxy behavior, class instance limitations, `$state.raw()`
- [Svelte $derived rune](https://svelte.dev/docs/svelte/$derived) — runtime dependency tracking, `$derived.by()`
- [Svelte $bindable rune](https://svelte.dev/docs/svelte/$bindable) — breaking change: props not bindable by default in runes mode
- [Svelte context API](https://svelte.dev/docs/svelte/context) — `createContext`, `setContext`, `getContext` patterns
- [Svelte lifecycle hooks](https://svelte.dev/docs/svelte/lifecycle-hooks) — `onMount`/`onDestroy` NOT deprecated; `beforeUpdate`/`afterUpdate` deprecated
- [Svelte legacy overview](https://svelte.dev/docs/svelte/legacy-overview) — deprecated vs supported feature list
- [$$slots in runes mode issue](https://github.com/sveltejs/svelte/issues/9683) — confirms `$$slots` breaks immediately with any rune
- [$app/stores deprecation](https://svelte.dev/docs/kit/$app-stores) — deprecated in SvelteKit 2.12, will be removed in SvelteKit 3
- [createContext PR by Rich Harris](https://github.com/sveltejs/svelte/pull/16948) — Svelte 5.40+ typed context API
- [Svelte snippet docs](https://svelte.dev/docs/svelte/snippet) — snippet syntax and patterns
- Codebase analysis of `apps/frontend/src/` via direct grep — quantified all legacy pattern occurrences

### Secondary (MEDIUM confidence)

- [Refactoring Svelte stores to $state runes (Loopwerk)](https://www.loopwerk.io/articles/2025/svelte-5-stores/) — practical store-to-runes patterns
- [Global state in Svelte 5 (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) — SSR safety, context vs module state
- [Experiences and Caveats of Svelte 5 Migration (sveltejs/svelte Discussion #14131)](https://github.com/sveltejs/svelte/discussions/14131) — real migration problems from community
- [Svelte 5 Patterns: Shared State (fubits)](https://fubits.dev/notes/svelte-5-patterns-simple-shared-state-getcontext-tweened-stores-with-runes/) — context + state patterns
- [Different Ways to Share State in Svelte 5 (Joy of Code)](https://joyofcode.xyz/how-to-share-state-in-svelte-5) — state sharing strategies

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
